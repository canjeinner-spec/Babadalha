import { forwardRef, type ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { OynaticiKontrol } from "@/components/OynaticiKontrol";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type OynaticiOlayi } from "@/parti/kopru";
import { C } from "@/theme/colors";

import {
  AronOynatici,
  nativeOynaticiVar,
  type AronOynaticiKumanda,
  type DrmYapilandirma,
  type OynaticiDurum,
} from "../../modules/aron-player";
import { type OynaticiKolu } from "@/components/PartiOynatici";

const YOL_BUYUT = "M4 4l6.5 6.5M4 4v6M4 4h6M20 20l-6.5-6.5M20 20v-6M20 20h-6";
const YOL_KUCULT = "M4 4l6.5 6.5M10.5 4.5v6M4.5 10.5h6M20 20l-6.5-6.5M13.5 19.5v-6M19.5 13.5h-6";
const YOL_PANEL = "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM15 5v14";

type Props = {
  adres: string;
  drm?: DrmYapilandirma;
  baslik?: string | null;
  tamEkran?: boolean;
  onBoyut?: () => void;
  onSohbet?: () => void;
  sohbetAcik?: boolean;
  kontrolVar?: boolean;
  kilitli?: boolean;
  onOlay?: (o: OynaticiOlayi) => void;
  ustKatman?: ReactNode;
};

const YOK_MESAJI = "Doğrudan bağlantı oynatıcısı yalnız Android geliştirme derlemesinde çalışıyor.";

export const PartiNativeOynatici = forwardRef<OynaticiKolu, Props>(function PartiNativeOynatici(
  { adres, drm, baslik, tamEkran, onBoyut, onSohbet, sohbetAcik, kontrolVar, kilitli, onOlay, ustKatman },
  ref,
) {
  const kumanda = useRef<AronOynaticiKumanda>(null);
  const konumRef = useRef(0);
  const sureRef = useRef(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [yenileNo, setYenileNo] = useState(0);
  const [konum, setKonum] = useState(0);
  const [sure, setSure] = useState(0);
  const [oynuyor, setOynuyor] = useState(false);
  const [videoVar, setVideoVar] = useState(false);
  const [ses, setSes] = useState(1);

  const varMi = nativeOynaticiVar();

  const olayRef = useRef(onOlay);
  olayRef.current = onOlay;
  const bildir = useCallback((o: OynaticiOlayi) => { olayRef.current?.(o); }, []);

  const drmRef = useRef(drm);
  drmRef.current = drm;
  const baslikRef = useRef(baslik);
  baslikRef.current = baslik;
  const drmAnahtari = drm ? JSON.stringify(drm) : "";

  useEffect(() => {
    if (!varMi) {
      setYukleniyor(false);
      setHata(YOK_MESAJI);
      bildir({ tur: "engel", sebep: YOK_MESAJI });
      return;
    }
    if (!adres) return;
    let iptal = false;
    setYukleniyor(true);
    setHata(null);
    konumRef.current = 0;
    sureRef.current = 0;
    setKonum(0);
    setSure(0);
    setOynuyor(false);
    setVideoVar(false);
    const yapilandirma: Parameters<AronOynaticiKumanda["yukle"]>[0] = { manifestUrl: adres, otomatikBasla: true, arkaPlandaDevam: true };
    const drmSuanki = drmRef.current;
    if (drmSuanki) yapilandirma.drm = drmSuanki;
    kumanda.current
      ?.yukle(yapilandirma)
      .then(() => {
        if (iptal) return;
        bildir({ tur: "bilgi", baslik: baslikRef.current ?? null, yazar: null, adres, kapak: null, izleme: true });
      })
      .catch((e: unknown) => {
        if (iptal) return;
        const sebep = (e as Error)?.message || "Bağlantı yüklenemedi.";
        setHata(sebep);
        bildir({ tur: "engel", sebep });
      });
    return () => { iptal = true; };
  }, [adres, drmAnahtari, yenileNo, varMi, bildir]);

  useImperativeHandle(ref, () => ({
    oynat: () => { kumanda.current?.oynat(); },
    duraklat: () => { kumanda.current?.duraklat(); },
    atla: (saniye: number) => {
      konumRef.current = saniye;
      setKonum(saniye);
      kumanda.current?.ara(Math.max(0, saniye) * 1000);
    },
    sadelestir: () => {},
    yenile: () => { setHata(null); setYenileNo((n) => n + 1); },
  }));

  const durumGeldi = useCallback(
    (o: { durum: OynaticiDurum; konumMs: number; sureMs: number }) => {
      const yeniKonum = o.konumMs / 1000;
      const yeniSure = o.sureMs / 1000;
      if (o.konumMs > 0) { konumRef.current = yeniKonum; setKonum(yeniKonum); }
      if (o.sureMs > 0 && yeniSure !== sureRef.current) {
        sureRef.current = yeniSure;
        setSure(yeniSure);
        bildir({ tur: "sure", sure: yeniSure });
      }
      if (o.durum !== "hazirlaniyor" && o.durum !== "arabellek") setYukleniyor(false);
      switch (o.durum) {
        case "hazir":
          setYukleniyor(false);
          setVideoVar(true);
          bildir({ tur: "hazir", sure: sureRef.current, konum: konumRef.current, izleme: true });
          break;
        case "oynuyor":
          setVideoVar(true);
          setOynuyor(true);
          bildir({ tur: "oynat", konum: konumRef.current, izleme: true });
          break;
        case "durakladi":
          setOynuyor(false);
          bildir({ tur: "duraklat", konum: konumRef.current });
          break;
        case "bitti":
          setOynuyor(false);
          bildir({ tur: "bitti", konum: konumRef.current });
          break;
        case "arabellek":
          bildir({ tur: "bekliyor", konum: konumRef.current });
          break;
        default:
          break;
      }
    },
    [bildir],
  );

  const ilerlemeGeldi = useCallback(
    (o: { konumMs: number; sureMs: number }) => {
      const yeniKonum = o.konumMs / 1000;
      konumRef.current = yeniKonum;
      setKonum(yeniKonum);
      const yeniSure = o.sureMs / 1000;
      if (o.sureMs > 0 && yeniSure !== sureRef.current) {
        sureRef.current = yeniSure;
        setSure(yeniSure);
        bildir({ tur: "sure", sure: yeniSure });
      }
      bildir({ tur: "konum", konum: yeniKonum });
    },
    [bildir],
  );

  const hataGeldi = useCallback(
    (o: { kodAdi: string; mesaj: string; drm: boolean }) => {
      const sebep = `${o.kodAdi}: ${o.mesaj || "-"}`;
      setYukleniyor(false);
      setVideoVar(false);
      setOynuyor(false);
      setHata(sebep);
      bildir({ tur: "engel", sebep });
    },
    [bildir],
  );

  return (
    <View style={[styles.root, tamEkran ? styles.tam : styles.kucuk]}>
      <AronOynatici
        ref={kumanda}
        style={StyleSheet.absoluteFill}
        oranKipi="sigdir"
        onDurum={durumGeldi}
        onIlerleme={ilerlemeGeldi}
        onHata={hataGeldi}
      />
      {yukleniyor && !hata && (
        <View style={styles.katman} pointerEvents="none">
          <ActivityIndicator size="small" color={C.dim} />
        </View>
      )}
      {!!hata && (
        <View style={styles.katman}>
          <Txt size={12} color={C.red} align="center" style={styles.hataMetni}>{hata}</Txt>
        </View>
      )}
      {kilitli && <View style={styles.katman} />}
      {kontrolVar && videoVar && !hata && !kilitli && (
        <OynaticiKontrol
          konum={konum}
          sure={sure}
          oynuyor={oynuyor}
          onOynat={() => kumanda.current?.oynat()}
          onDuraklat={() => kumanda.current?.duraklat()}
          onAtla={(sn) => {
            konumRef.current = sn;
            setKonum(sn);
            kumanda.current?.ara(Math.max(0, sn) * 1000);
          }}
          ses={ses}
          onSes={(deger) => { setSes(deger); kumanda.current?.sesSeviyesi(deger); }}
          sagDugmeler={
            onBoyut ? (
              <View style={styles.kosuKutusu}>
                {!!onSohbet && tamEkran && (
                  <Pressable onPress={onSohbet} hitSlop={10} style={styles.kosuDugmesi}>
                    <Icon path={YOL_PANEL} size={19} sw={2.1} color={sohbetAcik ? C.gold2 : "#fff"} />
                  </Pressable>
                )}
                <Pressable onPress={onBoyut} hitSlop={10} style={styles.kosuDugmesi}>
                  <Icon path={tamEkran ? YOL_KUCULT : YOL_BUYUT} size={21} sw={2.4} color="#fff" />
                </Pressable>
              </View>
            ) : null
          }
        />
      )}
      {ustKatman}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { backgroundColor: "#000" },
  tam: { flex: 1 },
  kucuk: { width: "100%", aspectRatio: 16 / 9 },
  katman: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  hataMetni: { paddingHorizontal: 24 },
  kosuKutusu: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: 2 },
  kosuDugmesi: {
    width: 30, height: 30,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
});
