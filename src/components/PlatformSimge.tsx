import { Image } from "expo-image";
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

import { Txt } from "@/components/Txt";
import { type Platform } from "@/oda/platform";

function acikMi(renk: string): boolean {
  const h = renk.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export function PlatformSimge({
  platform, boyut, style,
}: {
  platform: Platform;
  boyut: number;
  style?: StyleProp<ViewStyle>;
}) {
  if (platform.logo) {
    return (
      <Image source={platform.logo} style={style as StyleProp<ImageStyle>} contentFit="contain" transition={0} />
    );
  }
  const harf = platform.ad.trim().charAt(0).toLocaleUpperCase("tr-TR");
  return (
    <View style={[styles.kap, style]}>
      <View
        style={[
          styles.kutu,
          {
            width: boyut,
            height: boyut,
            borderRadius: Math.round(boyut * 0.24),
            backgroundColor: platform.vurgu,
          },
        ]}
      >
        <Txt
          weight="extrabold"
          size={Math.max(9, Math.round(boyut * 0.54))}
          color={acikMi(platform.vurgu) ? "#101010" : "#FFFFFF"}
        >
          {harf}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kap: { alignItems: "center", justifyContent: "center" },
  kutu: { alignItems: "center", justifyContent: "center" },
});
