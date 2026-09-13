import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { useDil } from "@/lib/dil";
import { haptic } from "@/lib/haptics";
import { premiumuIsaretle } from "@/lib/ilkAcilis";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

type Paket = "aylik" | "yillik";

const FIYATLAR: Record<string, Record<Paket, string>> = {
  tr: { aylik: "₺49,99", yillik: "₺499,99" },
  en: { aylik: "$3.99", yillik: "$39.99" },
};

const AYRICALIKLAR: { simge: IconName; baslik: string; metin: string }[] = [
  { simge: "ban", baslik: "premium.reklamsizBaslik", metin: "premium.reklamsizMetin" },
  { simge: "evStar", baslik: "premium.renkliAdBaslik", metin: "premium.renkliAdMetin" },
  { simge: "mic", baslik: "premium.mikrofonBaslik", metin: "premium.mikrofonMetin" },
  { simge: "bolt", baslik: "premium.erkenBaslik", metin: "premium.erkenMetin" },
];

function Ayricalik({ simge, baslik, metin, sira }: {
  simge: IconName;
  baslik: string;
  metin: string;
  sira: number;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(460).delay(240 + sira * 110)} style={styles.ayricalik}>
      <View style={styles.ayricalikSimge}>
        <Icon name={simge} size={18} sw={2} color={C.gold2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="extrabold" size={14.5} color="#fff">{baslik}</Txt>
        <Txt size={12.5} color="rgba(255,255,255,.66)" lh={1.45} style={{ marginTop: 3 }}>{metin}</Txt>
      </View>
    </Animated.View>
  );
}

export default function Premium() {
  const router = useRouter();
  const t = useCeviri();
  const kod = useDil((s) => s.dil.kod).split("-")[0];
  const fiyat = FIYATLAR[kod] ?? FIYATLAR.en;
  const [paket, setPaket] = useState<Paket>("yillik");
  const [not, setNot] = useState("");

  const kapat = useCallback(async () => {
    haptic.select();
    await premiumuIsaretle();
    router.replace("/hazir");
  }, [router]);

  const basla = useCallback(() => {
    haptic.select();
    setNot(t("premium.yakinda"));
  }, [t]);

  const virgulluDil = kod === "tr";
  const yillikAylik = (() => {
    const ham = fiyat.yillik.replace(/[^\d.,]/g, "");
    const duz = virgulluDil ? ham.replace(/\./g, "").replace(",", ".") : ham.replace(/,/g, "");
    const sayi = Number(duz);
    if (!Number.isFinite(sayi) || sayi <= 0) return null;
    const birim = fiyat.yillik.replace(/[\d.,]/g, "");
    const ayda = (sayi / 12).toFixed(2);
    return `${birim}${virgulluDil ? ayda.replace(".", ",") : ayda}`;
  })();

  return (
    <View style={styles.kok}>
      <Gradient
        colors={["rgba(232,179,65,.16)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <View style={{ width: 34 }} />
          <View style={{ flex: 1 }} />
          <Pressable onPress={kapat} hitSlop={12} style={styles.kapatDugmesi}>
            <Icon name="x" size={22} sw={2.4} color="rgba(255,255,255,.7)" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(520)} style={styles.amblem}>
            <Gradient colors={[C.gold2, "rgba(232,179,65,.35)"]} deg={150} style={StyleSheet.absoluteFill} />
            <Icon name="crown" size={30} color="#241A05" fill="#241A05" />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(460).delay(120)}>
            <Txt weight="displayBold" size={23} color="#fff" align="center" style={styles.baslik}>
              {t("premium.baslik")}
            </Txt>
            <Txt weight="bold" size={12.5} color={C.gold2} align="center" style={{ marginTop: 6 }}>
              {t("premium.altYazi")}
            </Txt>
            <Txt size={13} color="rgba(255,255,255,.72)" align="center" lh={1.55} style={styles.giris}>
              {t("premium.giris")}
            </Txt>
          </Animated.View>

          <View style={styles.ayricaliklar}>
            {AYRICALIKLAR.map((a, i) => (
              <Ayricalik
                key={a.simge}
                simge={a.simge}
                baslik={t(a.baslik)}
                metin={t(a.metin)}
                sira={i}
              />
            ))}
          </View>

          <Animated.View entering={FadeInDown.duration(460).delay(700)} style={styles.paketler}>
            <Pressable
              style={[styles.paket, paket === "aylik" && styles.paketSecili]}
              onPress={() => { haptic.select(); setPaket("aylik"); }}
            >
              <Txt weight="extrabold" size={13} color="rgba(255,255,255,.8)">{t("premium.aylik")}</Txt>
              <Txt weight="displayBold" size={20} color="#fff" style={{ marginTop: 6 }}>{fiyat.aylik}</Txt>
              <View style={styles.altNotYeri} />
            </Pressable>

            <Pressable
              style={[styles.paket, paket === "yillik" && styles.paketSecili]}
              onPress={() => { haptic.select(); setPaket("yillik"); }}
            >
              <View style={styles.rozet}>
                <Txt weight="extrabold" size={8} color="#241A05" style={{ letterSpacing: 0.6 }}>
                  {t("premium.rozet")}
                </Txt>
              </View>
              <Txt weight="extrabold" size={13} color="rgba(255,255,255,.8)">{t("premium.yillik")}</Txt>
              <Txt weight="displayBold" size={20} color="#fff" style={{ marginTop: 6 }}>{fiyat.yillik}</Txt>
              <View style={styles.altNotYeri}>
                {!!yillikAylik && (
                  <Txt size={11} color={C.gold2}>{t("premium.ayBasi", yillikAylik)}</Txt>
                )}
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(460).delay(820)}>
            <Txt size={12.5} color="rgba(255,255,255,.62)" align="center" lh={1.5} style={styles.gerekce}>
              {t("premium.gerekce")}
            </Txt>
          </Animated.View>
        </ScrollView>

        <View style={styles.dip}>
          {not !== "" && (
            <Txt size={12} color={C.gold2} align="center" lh={1.45} style={{ paddingHorizontal: 10 }}>
              {not}
            </Txt>
          )}
          <Pressable style={styles.dugme} onPress={basla}>
            <Txt weight="extrabold" size={15.5} color="#241A05">{t("premium.basla")}</Txt>
          </Pressable>
          <Pressable onPress={kapat} hitSlop={8} style={styles.gecDugmesi}>
            <Txt weight="bold" size={13.5} color="rgba(255,255,255,.72)">{t("premium.simdiDegil")}</Txt>
          </Pressable>
          <Txt size={10.5} color={C.dim2} align="center" lh={1.45} style={{ paddingHorizontal: 14 }}>
            {t("premium.iptalNotu")}
          </Txt>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 360 },
  tepe: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingTop: 4 },
  kapatDugmesi: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 20, paddingBottom: 20, alignItems: "center" },
  amblem: {
    width: 64, height: 64, borderRadius: 22, overflow: "hidden",
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  baslik: { marginTop: 16, letterSpacing: 1.6 },
  giris: { marginTop: 14, paddingHorizontal: 6 },
  ayricaliklar: { marginTop: 22, width: "100%", gap: 10 },
  ayricalik: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 14,
    backgroundColor: "rgba(255,255,255,.045)",
    borderWidth: 1, borderColor: "rgba(255,255,255,.07)",
  },
  ayricalikSimge: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.13)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.26)",
  },
  paketler: { flexDirection: "row", gap: 11, marginTop: 22, width: "100%" },
  paket: {
    flex: 1, alignItems: "center", borderRadius: 18, paddingVertical: 16, paddingHorizontal: 10,
    backgroundColor: "rgba(255,255,255,.04)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,.09)",
  },
  paketSecili: { borderColor: C.gold2, backgroundColor: "rgba(232,179,65,.1)" },
  altNotYeri: { height: 18, marginTop: 4, justifyContent: "center" },
  rozet: {
    position: "absolute", top: -9, alignSelf: "center",
    backgroundColor: C.gold2, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3,
  },
  gerekce: { marginTop: 20, paddingHorizontal: 10 },
  dip: { paddingHorizontal: 20, paddingBottom: 10, paddingTop: 8, gap: 10 },
  dugme: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold2,
  },
  gecDugmesi: { alignItems: "center", justifyContent: "center", paddingVertical: 6 },
});
