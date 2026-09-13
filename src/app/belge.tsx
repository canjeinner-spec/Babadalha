import { useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { ARON_ILETISIM, BELGELER, BELGE_TARIHI, belgeYazisi, type BelgeAnahtari } from "@/data/belgeler";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { useDil } from "@/lib/dil";
import { geriDon } from "@/lib/gezinme";
import { C } from "@/theme/colors";

export default function BelgeEkrani() {
  const t = useCeviri();
  const dilKodu = useDil((s) => s.dil.kod);
  const { tur } = useLocalSearchParams<{ tur?: string }>();
  const anahtar: BelgeAnahtari = tur === "gizlilik" ? "gizlilik" : "kosullar";
  const belge = BELGELER[anahtar];
  const y = (yazi: { tr: string; en: string }) => belgeYazisi(yazi, dilKodu);

  return (
    <View style={styles.kok}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={16} color="#fff" numberOfLines={1} style={{ flex: 1 }}>
            {y(belge.baslik)}
          </Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
          <Txt size={13.5} color={C.gold2} lh={1.5}>{y(belge.ozet)}</Txt>
          <Txt size={11.5} color={C.dim2} style={{ marginTop: 6 }}>
            {t("belge.guncelleme", BELGE_TARIHI)}
          </Txt>

          {belge.bolumler.map((b) => (
            <View key={b.baslik.tr} style={styles.bolum}>
              <Txt weight="extrabold" size={14.5} color="#fff">{y(b.baslik)}</Txt>
              {b.maddeler.map((m) => (
                <Txt key={m.tr} size={13.5} color="rgba(255,255,255,.74)" lh={1.6} style={styles.madde}>
                  {y(m)}
                </Txt>
              ))}
            </View>
          ))}

          <View style={styles.iletisim}>
            <Txt weight="extrabold" size={13} color="#fff">{t("belge.iletisim")}</Txt>
            <Txt size={13.5} color={ARON_ILETISIM ? C.gold2 : C.red} style={{ marginTop: 5 }}>
              {ARON_ILETISIM || t("belge.iletisimEksik")}
            </Txt>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  tepe: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 20, paddingBottom: 44 },
  bolum: { marginTop: 24, gap: 9 },
  madde: {},
  iletisim: {
    marginTop: 30, borderRadius: 16, padding: 16,
    backgroundColor: "rgba(255,255,255,.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,.08)",
  },
});
