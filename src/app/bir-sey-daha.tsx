import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { useCeviri } from "@/lib/ceviri";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

const UST_GECIKME = 260;
const BASLIK_GECIKME = 1100;
const ALT_GECIKME = 2050;
const BEKLEME = 3900;

export default function BirSeyDaha() {
  const router = useRouter();
  const t = useCeviri();
  const gecildi = useRef(false);
  const nabiz = useSharedValue(0);

  useEffect(() => {
    nabiz.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [nabiz]);

  const noktaStil = useAnimatedStyle(() => ({
    opacity: 0.45 + nabiz.value * 0.55,
    transform: [{ scale: 0.85 + nabiz.value * 0.35 }],
  }));

  const gec = useCallback(() => {
    if (gecildi.current) return;
    gecildi.current = true;
    router.replace("/premium");
  }, [router]);

  useEffect(() => {
    const zamanlayici = setTimeout(gec, BEKLEME);
    return () => clearTimeout(zamanlayici);
  }, [gec]);

  return (
    <Pressable style={styles.kok} onPress={gec}>
      <Gradient
        colors={["rgba(232,179,65,.13)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.orta}>
          <Animated.View entering={FadeIn.duration(700).delay(UST_GECIKME)} style={styles.ustKume}>
            <Animated.View style={[styles.nokta, noktaStil]} />
            <Txt weight="bold" size={13.5} color={C.gold2} style={styles.ustSatir}>
              {t("birSeyDaha.ustSatir")}
            </Txt>
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(760).delay(BASLIK_GECIKME)}>
            <Txt weight="displayBold" size={26} color="#fff" align="center" lh={1.32} style={styles.baslik}>
              {t("birSeyDaha.baslik")}
            </Txt>
          </Animated.View>

          <Animated.View entering={FadeIn.duration(760).delay(ALT_GECIKME)}>
            <Txt size={13.5} color="rgba(255,255,255,.62)" align="center" lh={1.55} style={styles.altSatir}>
              {t("birSeyDaha.altSatir")}
            </Txt>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 360 },
  orta: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  ustKume: { flexDirection: "row", alignItems: "center", gap: 9 },
  nokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold2 },
  ustSatir: { letterSpacing: 0.5 },
  baslik: { marginTop: 22 },
  altSatir: { marginTop: 18, paddingHorizontal: 6 },
});
