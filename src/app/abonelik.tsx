import { useEffect, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { useDil } from "@/lib/dil";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { abonelikBilgisiAl, satinAlmalariGeriYukle, type AbonelikBilgisi } from "@/lib/satinalma";
import { basariUyar, hataUyar, uyar } from "@/lib/uyari";
import { C } from "@/theme/colors";
import { icerikKapsul } from "@/theme/duzen";
import { Gradient } from "@/theme/Gradient";

const MAGAZA_ADRESI = Platform.select({
  ios: "https://apps.apple.com/account/subscriptions",
  android: "https://play.google.com/store/account/subscriptions",
  default: "https://play.google.com/store/account/subscriptions",
});

function tarihYaz(ham: string | null, dilKodu: string): string | null {
  if (!ham) return null;
  const z = new Date(ham);
  if (Number.isNaN(z.getTime())) return null;
  return z.toLocaleDateString(dilKodu, { day: "numeric", month: "long", year: "numeric" });
}

function Satir({ etiket, deger, vurgu }: { etiket: string; deger: string; vurgu?: boolean }) {
  return (
    <View style={styles.satir}>
      <Txt size={13.5} color={C.dim} style={{ flex: 1 }}>{etiket}</Txt>
      <Txt weight="extrabold" size={13.5} color={vurgu ? C.green : "#fff"} numberOfLines={1}>{deger}</Txt>
    </View>
  );
}

function Avantaj({ simge, metin }: { simge: IconName; metin: string }) {
  return (
    <View style={styles.avantaj}>
      <View style={styles.avantajSimge}>
        <Icon name={simge} size={16} sw={2} color={C.gold2} />
      </View>
      <Txt size={13.5} color="rgba(255,255,255,.86)" style={{ flex: 1 }}>{metin}</Txt>
    </View>
  );
}

export default function Abonelik() {
  const t = useCeviri();
  const dilKodu = useDil((s) => s.dil.kod);
  const [bilgi, setBilgi] = useState<AbonelikBilgisi | null>(null);
  const [mesgul, setMesgul] = useState(false);

  useEffect(() => {
    let acik = true;
    abonelikBilgisiAl()
      .then((b) => { if (acik) setBilgi(b); })
      .catch(() => {});
    return () => { acik = false; };
  }, []);

  const yonetBas = async () => {
    haptic.select();
    const acildi = await Linking.openURL(MAGAZA_ADRESI).then(() => true).catch(() => false);
    if (!acildi) hataUyar(t("abonelik.yonetilemedi"));
  };

  const geriYukleBas = async () => {
    if (mesgul) return;
    haptic.select();
    setMesgul(true);
    const oldu = await satinAlmalariGeriYukle();
    setMesgul(false);
    if (oldu) basariUyar(t("premium.geriYuklendi"));
    else uyar(t("premium.geriYuklenemedi"));
  };

  const bilinmiyor = t("abonelik.bilinmiyor");
  const paketAdi = bilgi?.paket ? t(bilgi.paket === "yillik" ? "premium.yillik" : "premium.aylik") : bilinmiyor;
  const baslangic = tarihYaz(bilgi?.baslangic ?? null, dilKodu) ?? bilinmiyor;
  const yenileme = tarihYaz(bilgi?.yenileme ?? null, dilKodu) ?? bilinmiyor;
  const iptalli = !!bilgi?.iptalEdildi;

  return (
    <View style={styles.kok}>
      <Gradient
        colors={["rgba(232,179,65,.14)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom", "left", "right"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("abonelik.baslik")}</Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.govde, icerikKapsul]} showsVerticalScrollIndicator={false}>
          <View style={styles.rozetKutusu}>
            <View style={styles.rozetSimge}>
              <Icon name="evDiamond" size={26} sw={1.9} color={C.gold2} />
            </View>
            <Txt weight="displayBold" size={19} color="#fff" align="center">{t("premium.baslik")}</Txt>
            <Txt size={13} color={C.dim} align="center" lh={1.5} style={{ marginTop: 8 }}>
              {t("abonelik.tesekkur")}
            </Txt>
          </View>

          <View style={styles.kume}>
            <Satir
              etiket={t("abonelik.durum")}
              deger={t(iptalli ? "abonelik.iptalEdildi" : "abonelik.aktif")}
              vurgu={!iptalli}
            />
            <Satir etiket={t("abonelik.paket")} deger={paketAdi} />
            <Satir etiket={t("abonelik.baslangic")} deger={baslangic} />
            <Satir etiket={t(iptalli ? "abonelik.bitis" : "abonelik.yenileme")} deger={yenileme} />
          </View>

          <Txt size={12} color={C.dim2} lh={1.5} style={styles.not}>{t("abonelik.magazaNotu")}</Txt>

          <Pressable style={styles.yonetDugmesi} onPress={yonetBas}>
            <Icon name="gear" size={17} sw={2} color="#1a1206" />
            <Txt weight="extrabold" size={14} color="#1a1206">{t("abonelik.yonet")}</Txt>
          </Pressable>

          <Pressable style={styles.geriYukleDugmesi} onPress={geriYukleBas} disabled={mesgul}>
            <Txt weight="bold" size={12.5} color={C.dim}>{t("premium.geriYukle")}</Txt>
          </Pressable>

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            {t("abonelik.avantajlar").toLocaleUpperCase("tr")}
          </Txt>

          <View style={styles.kume}>
            <Avantaj simge="ban" metin={t("premium.reklamsizMetin")} />
            <Avantaj simge="mic" metin={t("premium.mikrofonMetin")} />
            <Avantaj simge="heart" metin={t("premium.renkliAdMetin")} />
            <Avantaj simge="bolt" metin={t("premium.erkenMetin")} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", left: 0, right: 0, top: 0, height: 280 },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  rozetKutusu: {
    alignItems: "center", paddingHorizontal: 20, paddingVertical: 24, borderRadius: 20,
    backgroundColor: "rgba(232,179,65,.05)", borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  rozetSimge: {
    width: 58, height: 58, borderRadius: 20, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.1)", borderWidth: 1, borderColor: "rgba(232,179,65,.24)",
    marginBottom: 14,
  },
  kume: {
    marginTop: 18, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 18,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  satir: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  avantaj: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  avantajSimge: {
    width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)", borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
  not: { marginTop: 16, marginHorizontal: 4 },
  yonetDugmesi: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
    marginTop: 16, paddingVertical: 15, borderRadius: 16, backgroundColor: C.gold2,
  },
  geriYukleDugmesi: { alignItems: "center", justifyContent: "center", paddingVertical: 14 },
  bolumBaslik: { marginTop: 12, marginBottom: 2, marginLeft: 4, letterSpacing: 0.7 },
});
