import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View, type TextStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Txt } from "@/components/Txt";
import { Font } from "@/theme/fonts";

export type YaziParcasi = { metin: string; renk?: string };

type Props = {
  parcalar: YaziParcasi[];
  size?: number;
  weight?: keyof typeof Font;
  renk?: string;
  hiz?: number;
  gecikme?: number;
  imlec?: boolean;
  style?: TextStyle;
};

export function TitrekYazi({
  parcalar,
  size = 30,
  weight = "displayBold",
  renk = "#fff",
  hiz = 42,
  gecikme = 350,
  imlec = true,
  style,
}: Props) {
  const tamMetin = useMemo(() => parcalar.map((p) => p.metin).join(""), [parcalar]);
  const [yazilan, setYazilan] = useState(0);
  const titre = useSharedValue(0);
  const yanip = useSharedValue(1);

  const [sonMetin, setSonMetin] = useState(tamMetin);
  if (sonMetin !== tamMetin) {
    setSonMetin(tamMetin);
    setYazilan(0);
  }

  useEffect(() => {
    let sayac = 0;
    let saat: ReturnType<typeof setInterval> | null = null;
    const baslat = setTimeout(() => {
      saat = setInterval(() => {
        sayac += 1;
        setYazilan(sayac);
        titre.value = withSequence(
          withTiming(1, { duration: 30 }),
          withTiming(0, { duration: 90 }),
        );
        if (sayac >= tamMetin.length && saat) clearInterval(saat);
      }, hiz);
    }, gecikme);
    return () => {
      clearTimeout(baslat);
      if (saat) clearInterval(saat);
    };
  }, [tamMetin, hiz, gecikme, titre]);

  useEffect(() => {
    yanip.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 420 }), withTiming(1, { duration: 420 })),
      -1,
      false,
    );
  }, [yanip]);

  const govdeStil = useAnimatedStyle(() => ({
    transform: [
      { translateY: titre.value * -1.6 },
      { scale: 1 + titre.value * 0.012 },
    ],
  }));

  const imlecStil = useAnimatedStyle(() => ({ opacity: yanip.value }));

  const bitti = yazilan >= tamMetin.length;
  let kalan = yazilan;
  const gorunen: YaziParcasi[] = [];
  for (const p of parcalar) {
    if (kalan <= 0) break;
    gorunen.push({ metin: p.metin.slice(0, kalan), renk: p.renk });
    kalan -= p.metin.length;
  }

  return (
    <Animated.View style={govdeStil}>
      <View style={styles.satir}>
        <Txt weight={weight} size={size} color={renk} style={style}>
          {gorunen.map((p, i) => (
            <Txt key={i} weight={weight} size={size} color={p.renk ?? renk}>
              {p.metin}
            </Txt>
          ))}
        </Txt>
        {imlec && !bitti && (
          <Animated.View
            style={[
              styles.imlec,
              { height: size * 0.94, backgroundColor: renk },
              imlecStil,
            ]}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  satir: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 4 },
  imlec: { width: 3, borderRadius: 2, marginBottom: 5 },
});
