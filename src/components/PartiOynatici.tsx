import { forwardRef, type ReactNode, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from "react-native";

import { KopruWeb, type KopruWebKolu } from "@/components/KopruWeb";
import { OynaticiKontrol } from "@/components/OynaticiKontrol";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type PlatformKodu } from "@/oda/platform";
import { KOMUT, kopruBetigi, kullaniciAjani, masaustuIcerikMi, olayCoz, type OynaticiOlayi } from "@/parti/kopru";
import { C } from "@/theme/colors";

const YOL_BUYUT = "M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7";
const YOL_KUCULT = "M13 11h6V5M11 13H5v6M20 4l-7 7M4 20l7-7";
const YOL_PANEL = "M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM15 5v14";

export type OynaticiKolu = {
  oynat: () => void;
  duraklat: () => void;
  atla: (saniye: number) => void;
  sadelestir: () => void;
  yenile: () => void;
};

export const PartiOynatici = forwardRef<OynaticiKolu, {
  adres: string;
  platform: PlatformKodu;
  tamEkran?: boolean;
  onBoyut?: () => void;
  onSohbet?: () => void;
  sohbetAcik?: boolean;
  kilitli?: boolean;
  onOlay?: (o: OynaticiOlayi) => void;
  ustKatman?: ReactNode;
}>(function PartiOynatici({ adres, platform, tamEkran, onBoyut, onSohbet, sohbetAcik, kilitli, onOlay, ustKatman }, ref) {
  const betik = useMemo(() => kopruBetigi(platform), [platform]);
  const masaustu = masaustuIcerikMi(platform);
  useEffect(() => { console.warn(`[parti-oynatici] ${Platform.OS} yeni oynatici ${platform} ${adres.slice(0, 70)}`); }, [platform, adres]);
  const web = useRef<KopruWebKolu>(null);
  const dogum = useRef(Date.now());
  const [yukleniyor, setYukleniyor] = useState(true);
  const [hata, setHata] = useState<string | null>(null);
  const [konum, setKonum] = useState(0);
  const [sure, setSure] = useState(0);
  const [oynuyor, setOynuyor] = useState(false);
  const [videoVar, setVideoVar] = useState(false);

  useImperativeHandle(ref, () => ({
    oynat: () => web.current?.enjekte(KOMUT.oynat),
    duraklat: () => web.current?.enjekte(KOMUT.duraklat),
    atla: (saniye: number) => { setKonum(saniye); web.current?.enjekte(KOMUT.atla(saniye)); },
    sadelestir: () => web.current?.enjekte(KOMUT.sadelestir),
    yenile: () => { setHata(null); setYukleniyor(true); web.current?.yenile(); },
  }));

  const mesaj = (veri: string) => {
    const o = olayCoz(veri);
    if (!o) return;
    setYukleniyor(false);
    if (o.tur === "tani") {
      console.warn(`[parti-sayfa] ${Platform.OS} tani ${platform}: sistemler=${JSON.stringify(o.sistemler)} eskiEme=${o.eskiEme} mse=${o.mse} platform=${o.platform} dokunma=${o.dokunma}\n  ajan=${o.ajan}`);
      return;
    }
    if (o.tur === "gunluk") {
      console.warn(`[parti-sayfa] ${Platform.OS} ${platform} ${o.seviye}: ${o.metin}`);
      return;
    }
    if (o.tur === "engel") {
      console.warn(`[parti-sayfa] ${Platform.OS} ${platform} engel: ${o.sebep}`);
      setHata(o.sebep);
      setVideoVar(false);
      return;
    }
    if (o.tur === "durum") {
      console.warn(`[parti-sayfa] ${Platform.OS} ${platform} durum: video=${o.videoVar} hazir=${o.hazirDurum} baslik="${o.baslik}" adres=${o.adres}`);
      return;
    }
    if (o.tur === "bilgi") {
      console.warn(`[parti-sayfa] ${Platform.OS} ${platform} bilgi: izleme=${o.izleme ? 1 : 0} baslik="${o.baslik ?? "-"}" kapak=${o.kapak ?? "-"}`);
    }
    if (o.tur === "hazir") { setVideoVar(true); setKonum(o.konum); if (o.sure > 0) setSure(o.sure); }
    else if (o.tur === "konum" || o.tur === "atla") setKonum(o.konum);
    else if (o.tur === "sure") setSure(o.sure);
    else if (o.tur === "oynat") { setOynuyor(true); setKonum(o.konum); }
    else if (o.tur === "duraklat" || o.tur === "bitti") { setOynuyor(false); setKonum(o.konum); }
    else if (o.tur === "yok") { setVideoVar(false); setOynuyor(false); }
    if (onOlay) onOlay(o);
  };

  return (
    <View style={tamEkran ? styles.yuvaTam : styles.yuva}>
      <KopruWeb
        ref={web}
        uri={adres}
        userAgent={kullaniciAjani(platform)}
        betik={betik}
        masaustu={masaustu}
        platform={platform}
        onMesaj={mesaj}
        onYukleBasla={(url) => { console.warn(`[parti-oynatici] yukleme-basladi ${Date.now() - dogum.current}ms ${url}`); setYukleniyor(true); }}
        onYukleBit={(url) => { console.warn(`[parti-oynatici] yukleme-bitti ${Date.now() - dogum.current}ms ${url}`); setYukleniyor(false); }}
        onHata={(aciklama, url) => {
          console.warn(`[parti-oynatici] ${Platform.OS} hata:`, aciklama, url);
          setHata(aciklama);
          setYukleniyor(false);
        }}
        style={styles.web}
      />

      {kilitli && <View style={StyleSheet.absoluteFill} />}

      {!tamEkran && videoVar && !hata && !kilitli && (
        <OynaticiKontrol
          konum={konum}
          sure={sure}
          oynuyor={oynuyor}
          onOynat={() => web.current?.enjekte(KOMUT.oynat)}
          onDuraklat={() => web.current?.enjekte(KOMUT.duraklat)}
          onAtla={(sn) => { setKonum(sn); web.current?.enjekte(KOMUT.atla(sn)); }}
        />
      )}

      {!!onBoyut && !hata && (
        <View style={styles.kosuKutusu}>
          {!!onSohbet && tamEkran && (
            <Pressable onPress={onSohbet} hitSlop={10} style={[styles.kosuDugmesi, sohbetAcik && styles.kosuDugmesiAcik]}>
              <Icon path={YOL_PANEL} size={17} sw={2.1} color={sohbetAcik ? C.gold2 : "#fff"} />
            </Pressable>
          )}
          <Pressable onPress={onBoyut} hitSlop={10} style={styles.kosuDugmesi}>
            <Icon path={tamEkran ? YOL_KUCULT : YOL_BUYUT} size={17} sw={2.2} color="#fff" />
          </Pressable>
        </View>
      )}

      {ustKatman}

      {(yukleniyor || hata) && !ustKatman && (
        <View style={styles.perde} pointerEvents="none">
          {hata ? (
            <Txt size={12.5} color={C.dim} align="center" style={{ paddingHorizontal: 24 }}>{hata}</Txt>
          ) : (
            <ActivityIndicator color="rgba(255,255,255,.7)" />
          )}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  yuva: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000" },
  yuvaTam: { flex: 1, width: "100%", backgroundColor: "#000" },
  web: { flex: 1, backgroundColor: "#000" },
  kosuKutusu: { position: "absolute", right: 10, bottom: 10, flexDirection: "row", gap: 8 },
  kosuDugmesi: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,.55)",
    borderWidth: 1, borderColor: "rgba(255,255,255,.18)",
  },
  kosuDugmesiAcik: { borderColor: C.gold + "88", backgroundColor: "rgba(0,0,0,.7)" },
  perde: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", backgroundColor: "#000" },
});
