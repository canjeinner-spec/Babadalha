import { Image } from "expo-image";
import { useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions, type ImageSourcePropType } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

import { useCanli } from "@/lib/canli";
import { C } from "@/theme/colors";

const ARALIK = 10;
const KARE_ORANI = 2 / 3;

type Props = {
  gorseller: ImageSourcePropType[];
  sutunSayisi?: number;
  turSuresi?: number;
  karartma?: number;
  doldur?: boolean;
  sutunOrani?: number;
};

function Sutun({
  gorseller,
  genislik,
  kareYuksekligi,
  sure,
  yukari,
  canli,
  doldur,
  kaydir,
}: {
  gorseller: ImageSourcePropType[];
  genislik: number;
  kareYuksekligi: number;
  sure: number;
  yukari: boolean;
  canli: boolean;
  doldur: boolean;
  kaydir: number;
}) {
  const seritYuksekligi = gorseller.length * (kareYuksekligi + ARALIK);
  const kayma = useSharedValue(yukari ? 0 : -seritYuksekligi);

  useEffect(() => {
    if (!canli || seritYuksekligi <= 0) {
      cancelAnimation(kayma);
      return;
    }
    const bas = yukari ? 0 : -seritYuksekligi;
    const son = yukari ? -seritYuksekligi : 0;
    const gecen = Math.abs(kayma.value - bas) / seritYuksekligi;
    kayma.value = withTiming(son, {
      duration: Math.max(1, sure * (1 - gecen)),
      easing: Easing.linear,
    }, (bitti) => {
      if (!bitti) return;
      kayma.value = bas;
      kayma.value = withRepeat(withTiming(son, { duration: sure, easing: Easing.linear }), -1, false);
    });
    return () => cancelAnimation(kayma);
  }, [canli, sure, yukari, seritYuksekligi, kayma]);

  const stil = useAnimatedStyle(() => ({ transform: [{ translateY: kayma.value }] }));

  return (
    <View style={{ width: genislik, overflow: "hidden" }}>
      <Animated.View style={[{ marginTop: -kaydir }, stil]}>
        {[0, 1].map((tur) =>
          gorseller.map((g, i) => (
            <Image
              key={`${tur}-${i}`}
              source={g}
              style={{
                width: genislik,
                height: kareYuksekligi,
                marginBottom: ARALIK,
                borderRadius: 14,
                backgroundColor: C.card,
              }}
              contentFit={doldur ? "cover" : "contain"}
              transition={0}
            />
          )),
        )}
      </Animated.View>
    </View>
  );
}

export function AkanDuvar({
  gorseller,
  sutunSayisi = 3,
  turSuresi = 42000,
  karartma = 0.72,
  doldur = true,
  sutunOrani,
}: Props) {
  const { width, height } = useWindowDimensions();
  const canli = useCanli();

  const sutunGenisligi = sutunOrani
    ? width * sutunOrani
    : (width + ARALIK * (sutunSayisi + 1)) / sutunSayisi;
  const kareYuksekligi = Math.round(sutunGenisligi / KARE_ORANI);

  const sutunlar = useMemo(() => {
    if (!gorseller.length) return [];
    const enAz = Math.max(3, Math.ceil(height / (kareYuksekligi + ARALIK)) + 1);
    const kutular: ImageSourcePropType[][] = Array.from({ length: sutunSayisi }, () => []);
    for (let i = 0; i < sutunSayisi; i++) {
      for (let j = 0; j < enAz; j++) {
        kutular[i].push(gorseller[(i * 7 + j * 3 + i) % gorseller.length]);
      }
    }
    return kutular;
  }, [gorseller, sutunSayisi, height, kareYuksekligi]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.izgara}>
        {sutunlar.map((s, i) => (
          <Sutun
            key={i}
            gorseller={s}
            genislik={sutunGenisligi}
            kareYuksekligi={kareYuksekligi}
            sure={turSuresi + i * 6000}
            yukari={i % 2 === 0}
            canli={canli}
            doldur={doldur}
            kaydir={((i * 0.37) % 1) * (kareYuksekligi + ARALIK)}
          />
        ))}
      </View>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: C.bg, opacity: karartma }]} />
      <LinearGradient
        colors={[
          "rgba(8,8,12,.74)",
          "rgba(8,8,12,.10)",
          "rgba(8,8,12,.26)",
          "rgba(8,8,12,.52)",
          "rgba(8,8,12,.62)",
        ]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  izgara: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: ARALIK,
    marginLeft: -ARALIK,
  },
});
