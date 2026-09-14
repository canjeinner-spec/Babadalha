import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeInDown } from "react-native-reanimated";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { PLATFORMLAR } from "@/oda/platform";
import { C } from "@/theme/colors";
import { icerikKapsul } from "@/theme/duzen";
import { Gradient } from "@/theme/Gradient";

const SURUM = "1.0.0";

function Adim({ sira, metin }: { sira: number; metin: string }) {
  return (
    <View style={styles.adim}>
      <View style={styles.adimSayi}>
        <Txt weight="displayBold" size={13} color={C.gold2}>{String(sira)}</Txt>
      </View>
      <Txt size={13.5} color="rgba(255,255,255,.86)" lh={1.45} style={{ flex: 1 }}>{metin}</Txt>
    </View>
  );
}

function YolSatiri({ metin }: { metin: string }) {
  return (
    <View style={styles.yol}>
      <Icon name="check" size={15} sw={2.4} color={C.gold2} />
      <Txt size={13.5} color="rgba(255,255,255,.82)" lh={1.45} style={{ flex: 1 }}>{metin}</Txt>
    </View>
  );
}

export default function Duyuru() {
  const t = useCeviri();
  const router = useRouter();

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
          <Txt weight="displayBold" size={17} color="#fff">{t("duyuru.baslik")}</Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={[styles.govde, icerikKapsul]} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeInDown.duration(420)} style={styles.tanit}>
            <View style={styles.amblem}>
              <Image
                source={require("@/assets/images/icon.png")}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={0}
              />
            </View>
            <Txt weight="displayBold" size={22} color="#fff" align="center" style={{ marginTop: 14 }}>
              {t("duyuru.baslik")}
            </Txt>
            <Txt size={11.5} color={C.dim2} align="center" style={{ marginTop: 5 }}>
              {t("duyuru.surum", SURUM)}
            </Txt>
            <Txt size={13.5} color={C.dim} align="center" lh={1.6} style={{ marginTop: 14 }}>
              {t("duyuru.giris")}
            </Txt>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(420).delay(90)}>
            <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
              {t("duyuru.nasilBaslik").toLocaleUpperCase("tr")}
            </Txt>
            <View style={styles.kutu}>
              <Adim sira={1} metin={t("duyuru.adim1")} />
              <Adim sira={2} metin={t("duyuru.adim2")} />
              <Adim sira={3} metin={t("duyuru.adim3")} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(420).delay(160)}>
            <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
              {t("duyuru.platformBaslik").toLocaleUpperCase("tr")}
            </Txt>
            <View style={styles.kutu}>
              <View style={styles.logolar}>
                {PLATFORMLAR.map((p) => (
                  <Image key={p.kod} source={p.logo} style={styles.logo} contentFit="contain" transition={0} />
                ))}
              </View>
              <Txt size={12.5} color={C.dim} lh={1.5} style={{ marginTop: 14 }}>
                {t("duyuru.platformMetin")}
              </Txt>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(420).delay(230)}>
            <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
              {t("duyuru.gelisimBaslik").toLocaleUpperCase("tr")}
            </Txt>
            <View style={styles.kutu}>
              <Txt size={13.5} color="rgba(255,255,255,.86)" lh={1.6}>{t("duyuru.gelisimMetin")}</Txt>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(420).delay(300)}>
            <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
              {t("duyuru.yolBaslik").toLocaleUpperCase("tr")}
            </Txt>
            <View style={styles.kutu}>
              <YolSatiri metin={t("duyuru.yol1")} />
              <YolSatiri metin={t("duyuru.yol2")} />
              <YolSatiri metin={t("duyuru.yol3")} />
              <Txt size={12.5} color={C.dim} lh={1.5} style={{ marginTop: 12 }}>
                {t("duyuru.geriBildirim")}
              </Txt>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(420).delay(370)}>
            <Pressable
              style={styles.dugme}
              onPress={() => { haptic.select(); router.push("/parti-platform"); }}
            >
              <Icon name="evParty" size={18} sw={2} color="#1a1206" />
              <Txt weight="extrabold" size={14.5} color="#1a1206">{t("ana.kisayolKur")}</Txt>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", left: 0, right: 0, top: 0, height: 300 },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 8,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  tanit: { alignItems: "center", paddingTop: 8, paddingBottom: 6 },
  amblem: {
    width: 78, height: 78, borderRadius: 24, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,.16)",
  },
  bolumBaslik: { marginTop: 26, marginBottom: 10, marginLeft: 4, letterSpacing: 0.7 },
  kutu: {
    padding: 16, borderRadius: 18,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  adim: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  adimSayi: {
    width: 30, height: 30, borderRadius: 11, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.1)", borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  logolar: { flexDirection: "row", flexWrap: "wrap", gap: 16, alignItems: "center" },
  logo: { width: 62, height: 22 },
  yol: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7 },
  dugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9,
    marginTop: 26, paddingVertical: 15, borderRadius: 16, backgroundColor: C.gold2,
  },
});
