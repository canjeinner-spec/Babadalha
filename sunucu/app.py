import base64
import logging
import os
import threading
import traceback

from flask import Flask, jsonify, request
from pyplayready import PSSH, Cdm, Device

app = Flask(__name__)
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
kayit = logging.getLogger("aron-cdm")

PRD_DOSYA = os.environ.get("PRD_DOSYA", "device.prd")
PRD_BASE64 = os.environ.get("PRD_BASE64", "")
API_ANAHTAR = os.environ.get("API_ANAHTAR", "")

_cdm = None
_cdm_kilit = threading.Lock()


def prd_bayt_al():
    if PRD_BASE64:
        try:
            return base64.b64decode(PRD_BASE64)
        except Exception as e:
            raise RuntimeError(f"PRD_BASE64 cozulemedi: {e}")
    if os.path.isfile(PRD_DOSYA):
        with open(PRD_DOSYA, "rb") as f:
            return f.read()
    raise RuntimeError(
        f"PlayReady aygit dosyasi bulunamadi. Ya {PRD_DOSYA} dosyasini ekleyin "
        "ya da PRD_BASE64 env degiskenini base64 icerikle doldurun."
    )


def cdm_al():
    global _cdm
    with _cdm_kilit:
        if _cdm is None:
            veri = prd_bayt_al()
            gecici = "/tmp/aron_device.prd"
            with open(gecici, "wb") as f:
                f.write(veri)
            aygit = Device.load(gecici)
            _cdm = Cdm.from_device(aygit)
            kayit.info("PlayReady CDM yuklendi, aygit: %s", aygit)
        return _cdm


def api_anahtarini_dogrula():
    if not API_ANAHTAR:
        return True
    gonderilen = request.headers.get("X-Api-Key", "")
    return gonderilen == API_ANAHTAR


@app.before_request
def yetki_kontrol():
    if request.endpoint in ("health", None):
        return
    if not api_anahtarini_dogrula():
        return jsonify({"error": "yetkisiz"}), 401
    return None


@app.route("/challenge", methods=["POST"])
def challenge():
    try:
        veri = request.get_json(force=True) or {}
        pssh_b64 = veri.get("pssh", "")
        if not pssh_b64:
            return jsonify({"error": "pssh alani gerekli"}), 400
        pssh = PSSH(pssh_b64)
        c = cdm_al()
        oturum = c.open()
        try:
            istek = c.get_license_challenge(oturum, pssh)
        except Exception:
            c.close(oturum)
            raise
        istek_b64 = base64.b64encode(istek).decode()
        kayit.info("challenge acildi, oturum=%s", oturum.hex()[:12])
        return jsonify({"challenge": istek_b64, "session_id": oturum.hex()})
    except Exception as e:
        kayit.error("challenge hatasi: %s\n%s", e, traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/keys", methods=["POST"])
def keys():
    try:
        veri = request.get_json(force=True) or {}
        oturum_hex = veri.get("session_id", "")
        lisans_b64 = veri.get("license", "")
        if not oturum_hex or not lisans_b64:
            return jsonify({"error": "session_id ve license gerekli"}), 400
        oturum = bytes.fromhex(oturum_hex)
        c = cdm_al()
        try:
            c.parse_license(oturum, lisans_b64)
            anahtarlar = {}
            for anahtar in c.get_keys(oturum):
                tip = getattr(anahtar, "type", None)
                if tip is not None and str(tip).upper().startswith("SIGNING"):
                    continue
                try:
                    kid_bytes = anahtar.kid.bytes if hasattr(anahtar.kid, "bytes") else anahtar.kid
                    key_bytes = anahtar.key.bytes if hasattr(anahtar.key, "bytes") else anahtar.key
                except AttributeError:
                    kid_bytes = anahtar.kid
                    key_bytes = anahtar.key
                kid_b64 = base64.b64encode(kid_bytes).decode()
                key_b64 = base64.b64encode(key_bytes).decode()
                anahtarlar[kid_b64] = key_b64
            kayit.info("keys cikarildi, adet=%d, oturum=%s", len(anahtarlar), oturum.hex()[:12])
            return jsonify(anahtarlar)
        finally:
            try:
                c.close(oturum)
            except Exception:
                pass
    except Exception as e:
        kayit.error("keys hatasi: %s\n%s", e, traceback.format_exc())
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    try:
        cdm_al()
        return jsonify({"status": "ok", "cdm": "hazir"})
    except Exception as e:
        return jsonify({"status": "hata", "error": str(e)}), 503


@app.route("/", methods=["GET"])
def kok():
    return jsonify({"servis": "aron-cdm", "surum": 1, "durum": "acik"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
