import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

const RENKLER = ["#F5CE6E", "#E8B341", "#FFF3D6", "#C9903A", "#FFFFFF", "#B4372F"];

type Parca = {
  sol: number;
  boy: number;
  en: number;
  renk: string;
  gecikme: number;
  sure: number;
  kayma: number;
  donus: number;
  yuvarlak: boolean;
};

function parcalariUret(adet: number, genislik: number, yukseklik: number): Parca[] {
  const liste: Parca[] = [];
  for (let i = 0; i < adet; i++) {
    const r = () => Math.random();
    liste.push({
      sol: r() * genislik,
      boy: 7 + r() * 9,
      en: 4 + r() * 5,
      renk: RENKLER[Math.floor(r() * RENKLER.length)],
      gecikme: Math.round(r() * 620),
      sure: Math.round(yukseklik * 2.4 + r() * 1400),
      kayma: (r() - 0.5) * 130,
      donus: (r() < 0.5 ? -1 : 1) * (360 + r() * 900),
      yuvarlak: r() < 0.25,
    });
  }
  return liste;
}

function Tanecik({ parca, yukseklik }: { parca: Parca; yukseklik: number }) {
  const ilerleme = useSharedValue(0);

  useEffect(() => {
    ilerleme.value = withDelay(
      parca.gecikme,
      withTiming(1, { duration: parca.sure, easing: Easing.linear }),
    );
  }, [ilerleme, parca.gecikme, parca.sure]);

  const stil = useAnimatedStyle(() => {
    const p = ilerleme.value;
    return {
      transform: [
        { translateY: -40 + p * (yukseklik + 80) },
        { translateX: Math.sin(p * Math.PI * 2.4) * parca.kayma },
        { rotate: `${p * parca.donus}deg` },
      ],
      opacity: p > 0.82 ? (1 - p) / 0.18 : 1,
    };
  });

  return (
    <Animated.View
      style={[
        styles.tanecik,
        {
          left: parca.sol,
          width: parca.en,
          height: parca.boy,
          backgroundColor: parca.renk,
          borderRadius: parca.yuvarlak ? parca.en : 1.5,
        },
        stil,
      ]}
    />
  );
}

export const Konfeti = memo(function Konfeti({ adet = 54 }: { adet?: number }) {
  const { width, height } = useWindowDimensions();
  const parcalar = useMemo(() => parcalariUret(adet, width, height), [adet, width, height]);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {parcalar.map((p, i) => (
        <Tanecik key={i} parca={p} yukseklik={height} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  tanecik: { position: "absolute", top: 0 },
});
