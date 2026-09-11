import base64
import os

from flask import Flask, jsonify, request
from pyplayready import PSSH, Cdm, Device, DeviceTypes

app = Flask(__name__)

PRD_DOSYA = os.environ.get("PRD_DOSYA", "device.prd")

cdm = None


def cdm_al():
    global cdm
    if cdm is None:
        aygit = Device.load(PRD_DOSYA)
        cdm = Cdm.from_device(aygit)
    return cdm


@app.route("/challenge", methods=["POST"])
def challenge():
    veri = request.get_json(force=True)
    pssh_b64 = veri.get("pssh", "")
    pssh = PSSH(pssh_b64)
    c = cdm_al()
    oturum = c.open()
    istek = c.get_license_challenge(oturum, pssh)
    istek_b64 = base64.b64encode(istek).decode()
    return jsonify({"challenge": istek_b64, "session_id": oturum.hex()})


@app.route("/keys", methods=["POST"])
def keys():
    veri = request.get_json(force=True)
    oturum_hex = veri.get("session_id", "")
    lisans_b64 = veri.get("license", "")
    oturum = bytes.fromhex(oturum_hex)
    c = cdm_al()
    c.parse_license(oturum, lisans_b64)
    anahtarlar = {}
    for anahtar in c.get_keys(oturum):
        if anahtar.type != "SIGNING":
            kid_b64 = base64.b64encode(anahtar.kid.bytes).decode()
            key_b64 = base64.b64encode(anahtar.key.bytes).decode()
            anahtarlar[kid_b64] = key_b64
    c.close(oturum)
    return jsonify(anahtarlar)


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
