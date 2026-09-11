import { forwardRef, type ReactNode, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
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

type Props = {
  adres: string;
  drm?: DrmYapilandirma;
  tamEkran?: boolean;
  kilitli?: boolean;
  onOlay?: (o: OynaticiOlayi) => void;
  ustKatman?: ReactNode;
};

const YOK_MESAJI = "Doğrudan bağlantı oynatıcısı yalnız Android geliştirme derlemesinde çalışıyor.";

export const PartiNativeOynatici = forwardRef<OynaticiKolu, Props>(function PartiNativeOynatici(
  { adres, drm, tamEkran, kilitli, onOlay, ustKatman },
  ref,
) {
  const kumanda = useRef<AronOynaticiKumanda>(null);
  const konumRef = useRef(0);
  const sureRef = useRef(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [yenileNo, setYenileNo] = useState(0);

  const varMi = nativeOynaticiVar();

  const bildir = useCallback((o: OynaticiOlayi) => { onOlay?.(o); }, [onOlay]);

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
    const yapilandirma: Parameters<AronOynaticiKumanda["yukle"]>[0] = { manifestUrl: adres, otomatikBasla: true };
    if (drm) yapilandirma.drm = drm;
    kumanda.current
      ?.yukle(yapilandirma)
      .then(() => {
        if (iptal) return;
        bildir({ tur: "bilgi", baslik: null, yazar: null, adres, kapak: null, izleme: true });
      })
      .catch((e: unknown) => {
        if (iptal) return;
        const sebep = (e as Error)?.message || "Bağlantı yüklenemedi.";
        setHata(sebep);
        bildir({ tur: "engel", sebep });
      });
    return () => { iptal = true; };
  }, [adres, drm, yenileNo, varMi, bildir]);

  useImperativeHandle(ref, () => ({
    oynat: () => { kumanda.current?.oynat(); },
    duraklat: () => { kumanda.current?.duraklat(); },
    atla: (saniye: number) => {
      konumRef.current = saniye;
      kumanda.current?.ara(Math.max(0, saniye) * 1000);
    },
    sadelestir: () => {},
    yenile: () => { setHata(null); setYenileNo((n) => n + 1); },
  }));

  const durumGeldi = useCallback(
    (o: { durum: OynaticiDurum; konumMs: number; sureMs: number }) => {
      const konum = o.konumMs / 1000;
      const sure = o.sureMs / 1000;
      if (o.konumMs > 0) konumRef.current = konum;
      if (o.sureMs > 0 && sure !== sureRef.current) {
        sureRef.current = sure;
        bildir({ tur: "sure", sure });
      }
      if (o.durum !== "hazirlaniyor" && o.durum !== "arabellek") setYukleniyor(false);
      switch (o.durum) {
        case "hazir":
          setYukleniyor(false);
          bildir({ tur: "hazir", sure: sureRef.current, konum: konumRef.current, izleme: true });
          break;
        case "oynuyor":
          bildir({ tur: "oynat", konum: konumRef.current, izleme: true });
          break;
        case "durakladi":
          bildir({ tur: "duraklat", konum: konumRef.current });
          break;
        case "bitti":
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
      const konum = o.konumMs / 1000;
      konumRef.current = konum;
      const sure = o.sureMs / 1000;
      if (o.sureMs > 0 && sure !== sureRef.current) {
        sureRef.current = sure;
        bildir({ tur: "sure", sure });
      }
      bildir({ tur: "konum", konum });
    },
    [bildir],
  );

  const hataGeldi = useCallback(
    (o: { kodAdi: string; mesaj: string; drm: boolean }) => {
      const sebep = `${o.kodAdi}: ${o.mesaj || "-"}`;
      setYukleniyor(false);
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
});
