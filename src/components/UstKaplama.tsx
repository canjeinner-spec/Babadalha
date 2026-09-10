import { Image } from "expo-image";
import { memo, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Anim } from "@/components/Anim";
import { useCanli } from "@/lib/canli";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";
import { useTema } from "@/theme/tema";

const VARSAYILAN_YUKSEKLIK = 54;
const VARSAYILAN_SUZULME = 14;
const VARSAYILAN_PERDE = 0.28;
const DONGU_MS = 26000;
const KESIN_DURAK = [0, 0.85, 1] as const;
const YUMUSAK_DURAK = [0, 0.22, 1] as const;

type Props = {
  uzat?: number;
  yumusak?: boolean;
  zemin?: string;
};

export const UstKaplama = memo(function UstKaplama({ uzat = 0, yumusak = false, zemin }: Props) {
  const { ic } = useTema();
  const insets = useSafeAreaInsets();
  const canli = useCanli();
  const k = useSharedValue(0);

  const suzulme = ic?.suzulme ?? VARSAYILAN_SUZULME;
  const hareketli = !!ic?.ustGorsel && suzulme > 0 && canli;

  useEffect(() => {
    if (!hareketli) { cancelAnimation(k); return; }
    k.value = withRepeat(
      withTiming(1, { duration: DONGU_MS, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => { cancelAnimation(k); };
  }, [hareketli, k]);

  const suzulmeStil = useAnimatedStyle(() => ({
    transform: [
      { translateX: (k.value - 0.5) * 2 * suzulme },
      { scale: 1.06 + k.value * 0.03 },
    ],
  }));

  if (!ic?.ustGorsel) return null;

  return (
    <View
      style={[styles.kok, { height: (ic.ustYukseklik ?? VARSAYILAN_YUKSEKLIK) + insets.top + uzat }]}
      pointerEvents="none"
    >
      <Animated.View style={[StyleSheet.absoluteFill, suzulmeStil]}>
        <Image
          source={{ uri: ic.ustGorsel }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={220}
          priority="high"
        />
      </Animated.View>

      {!!ic.parilti && canli && (
        <Anim kaynak={{ uri: ic.parilti }} kapla style={StyleSheet.absoluteFill} hiz={0.7} />
      )}

      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(8,8,12,${ic.perde ?? VARSAYILAN_PERDE})` }]}
      />
      <Gradient
        colors={["transparent", "transparent", zemin ?? ic.zemin ?? C.bg]}
        locations={yumusak ? YUMUSAK_DURAK : KESIN_DURAK}
        deg={180}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  kok: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" },
});
