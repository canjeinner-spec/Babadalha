import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Text, type TextStyle, type ViewStyle } from "react-native";
import Animated, { Easing, makeMutable, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";

import { OZEL_ID_TEMA_RENK, type OzelIdKart } from "@/data/specialId";
import { C } from "@/theme/colors";
import { Font } from "@/theme/fonts";
import { renderSay } from "@/lib/takilma/sayac";
import { useCanliSV } from "@/lib/canli";

type Weight = keyof typeof Font;

const GOKKUSAGI = ["#FF4D4D", "#FF9F1C", "#FFE14D", "#3DDC84", "#3D9BFF", "#A855F7", "#FF6EC7"];

const TUR_MS = 2800;

const ilerleme = makeMutable(0);
let saatKuruldu = false;
function saatiBaslat() {
  if (saatKuruldu) return;
  saatKuruldu = true;
  ilerleme.value = withRepeat(withTiming(1, { duration: TUR_MS, easing: Easing.linear }), -1, false);
}

export const AKIS_FAZI = ilerleme;
export const akisiBaslat = saatiBaslat;

function adRenkleri(tip?: string | null, tema?: string | null): string[] | null {
  if (tip === "premium") return GOKKUSAGI;
  if (tip === "kapsul" && tema) {
    const t = OZEL_ID_TEMA_RENK[tema as OzelIdKart];
    if (t) return [t.g[0], t.accent, t.g[1]];
  }
  return null;
}

function Kayan({ genislik, renkler, akis }: { genislik: number; renkler: string[]; akis: boolean }) {
  const canliSV = useCanliSV();
  useEffect(() => { if (akis) saatiBaslat(); }, [akis]);

  const stil = useAnimatedStyle(() => ({
    transform: [{ translateX: canliSV.value ? genislik * (ilerleme.value - 1) : -genislik }],
  }));

  const seri: readonly [string, string, ...string[]] = [
    renkler[0],
    renkler[1] ?? renkler[0],
    ...renkler.slice(2),
    ...renkler,
    renkler[0],
  ];

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: "absolute", left: 0, top: 0, bottom: 0, width: genislik * 2 },
        akis ? stil : { transform: [{ translateX: -genislik }] },
      ]}
    >
      <LinearGradient colors={seri} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={{ flex: 1 }} />
    </Animated.View>
  );
}

type RenkliAdProps = {
  ad: string;
  tip?: string | null;
  tema?: string | null;
  size?: number;
  weight?: Weight;
  renk?: string;
  akis?: boolean;
  numberOfLines?: number;
  renkler?: string[];
  style?: TextStyle;
};

export function RenkliAd({
  ad, tip, tema, size = 14, weight = "extrabold", renk = C.text,
  akis = true, numberOfLines = 1, style, renkler: disRenkler,
}: RenkliAdProps) {
  renderSay("RenkliAd");
  const [genislik, setGenislik] = useState(0);
  const renkler = disRenkler ?? adRenkleri(tip, tema);

  const taban: TextStyle = {
    fontFamily: Font[weight],
    fontSize: size,
    includeFontPadding: false,
  };

  if (!renkler) {
    return (
      <Text numberOfLines={numberOfLines} style={[taban, { color: renk }, style]}>
        {ad}
      </Text>
    );
  }

  return (
    <MaskedView
      style={style as ViewStyle}
      maskElement={
        <Text numberOfLines={numberOfLines} style={[taban, { backgroundColor: "transparent" }]}>
          {ad}
        </Text>
      }
    >
      <Text
        numberOfLines={numberOfLines}
        onLayout={(e) => setGenislik(e.nativeEvent.layout.width)}
        style={[taban, { opacity: 0 }]}
      >
        {ad}
      </Text>
      {genislik > 0 && <Kayan genislik={genislik} renkler={renkler} akis={akis} />}
    </MaskedView>
  );
}
