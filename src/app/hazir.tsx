import { useRouter } from "expo-router";
import { useCallback } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { AltinAmblem } from "@/components/AltinAmblem";
import { Konfeti } from "@/components/Konfeti";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

export default function Hazir() {
  const router = useRouter();
  const t = useCeviri();

  const kur = useCallback(() => {
    haptic.select();
    router.replace("/parti-platform");
  }, [router]);

  const bak = useCallback(() => {
    haptic.select();
    router.replace("/");
  }, [router]);

  return (
    <View style={styles.kok}>
      <Gradient
        colors={["rgba(232,179,65,.18)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />
      <Konfeti />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.orta}>
          <Animated.View entering={FadeInDown.duration(560)} style={styles.amblem}>
            <AltinAmblem ad="hazir" yedek="check" boyut={48} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(520).delay(220)}>
            <Txt weight="displayBold" size={26} color="#fff" align="center" style={styles.baslik}>
              {t("hazir.baslik")}
            </Txt>
            <Txt size={14} color="rgba(255,255,255,.76)" align="center" lh={1.55} style={styles.altYazi}>
              {t("hazir.altYazi")}
            </Txt>
          </Animated.View>
        </View>

        <Animated.View entering={FadeInDown.duration(520).delay(520)} style={styles.dip}>
          <Pressable style={styles.dugme} onPress={kur}>
            <Txt weight="extrabold" size={15.5} color="#241A05">{t("hazir.kur")}</Txt>
            <Icon name="chev" size={19} sw={2.4} color="#241A05" />
          </Pressable>
          <Pressable onPress={bak} hitSlop={8} style={styles.ikincil}>
            <Txt weight="bold" size={13.5} color="rgba(255,255,255,.72)">{t("hazir.etrafaBak")}</Txt>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 400 },
  orta: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  amblem: {
    width: 86, height: 86, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.08)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  baslik: { marginTop: 26 },
  altYazi: { marginTop: 12, paddingHorizontal: 4 },
  dip: { paddingHorizontal: 20, paddingBottom: 18, gap: 8 },
  dugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold2,
  },
  ikincil: { alignItems: "center", justifyContent: "center", paddingVertical: 10 },
});
