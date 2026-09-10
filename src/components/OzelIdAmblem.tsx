import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import { AKIS_FAZI, akisiBaslat, RenkliAd } from "@/components/RenkliAd";
import { useCanliSV } from "@/lib/canli";
import {
  AMBLEM_ORAN, AMBLEM_RENK, amblemSec, ID_PUNTO,
  type OzelIdAmblemi,
} from "@/data/specialId";

const AMBLEM = {
  altin: require("@/assets/badges/ozelid/altin.png"),
  yakut: require("@/assets/badges/ozelid/yakut.png"),
  ametist: require("@/assets/badges/ozelid/ametist.png"),
  buz: require("@/assets/badges/ozelid/buz.png"),
  zumrut: require("@/assets/badges/ozelid/zumrut.png"),
  celik: require("@/assets/badges/ozelid/celik.png"),
} as const;

export const OZEL_ID_AMBLEM_KAYNAK = AMBLEM;

export function AmblemGorseli({ amblem, boy }: { amblem: OzelIdAmblemi; boy: number }) {
  return <Image source={AMBLEM[amblem]} style={{ width: boy, height: boy }} contentFit="contain" />;
}

const BANT_ORANI = 0.55;
const BANT_OPAKLIGI = 0.62;

function AmblemParilti({ amblem, boy, akis }: { amblem: OzelIdAmblemi; boy: number; akis: boolean }) {
  useEffect(() => { if (akis) akisiBaslat(); }, [akis]);

  const bant = boy * BANT_ORANI;
  const canliSV = useCanliSV();
  const stil = useAnimatedStyle(() => ({
    transform: [{ translateX: canliSV.value ? -boy + AKIS_FAZI.value * boy * 2 : boy * 0.2 }],
  }));

  return (
    <MaskedView
      style={{ position: "absolute", left: 0, top: 0, width: boy, height: boy }}
      pointerEvents="none"
      maskElement={<Image source={AMBLEM[amblem]} style={{ width: boy, height: boy }} contentFit="contain" />}
    >
      <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, width: bant }, akis ? stil : { transform: [{ translateX: boy * 0.2 }] }]}>
        <LinearGradient
          colors={["rgba(255,255,255,0)", `rgba(255,255,255,${BANT_OPAKLIGI})`, "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </MaskedView>
  );
}

function beyazaKaristir(hex: string, oran: number): string {
  const n = parseInt(hex.slice(1), 16);
  const k = (v: number) => Math.round(v + (255 - v) * oran);
  return `#${[k((n >> 16) & 255), k((n >> 8) & 255), k(n & 255)]
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("")}`;
}

export function OzelIdAmblem({
  id,
  punto = ID_PUNTO,
  akis = true,
  style,
}: {
  id: string;
  punto?: number;
  akis?: boolean;
  style?: ViewStyle;
}) {
  const amblem = amblemSec(id);
  if (!amblem) return null;
  const renk = AMBLEM_RENK[amblem];
  const boy = punto * AMBLEM_ORAN;
  const isik = beyazaKaristir(renk.accent, 0.6);
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", gap: punto * 0.34 }, style]}>
      <View style={{ width: boy, height: boy }}>
        <AmblemGorseli amblem={amblem} boy={boy} />
        <AmblemParilti amblem={amblem} boy={boy} akis={akis} />
      </View>
      <RenkliAd
        ad={id}
        size={punto}
        weight="displayBold"
        akis={akis}
        renkler={[renk.g[1], renk.g[0], renk.accent, isik, renk.accent]}
      />
    </View>
  );
}
