import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { C } from "@/theme/colors";

const YOL_OYNAT = "M7 4l12 8-12 8V4z";

export function DogrudanMarka({ boyut = 30 }: { boyut?: number }) {
  return (
    <View style={styles.sar}>
      <Icon path={YOL_OYNAT} size={boyut * 0.72} color={C.teal2} fill={C.teal2} sw={0} />
      <Txt
        weight="displayBold"
        size={boyut}
        color={C.gold}
        style={[styles.yazi, { lineHeight: boyut * 1.04 }]}
      >
        LINK
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  sar: { flexDirection: "row", alignItems: "center", gap: 7 },
  yazi: { letterSpacing: 1.5 },
  yuva: { width: "100%", height: 56, alignItems: "center", justifyContent: "center" },
  gorsel: { width: "90%", height: 56 },
});

export function DogrudanLogo() {
  const [hata, setHata] = useState(false);
  if (hata) {
    return (
      <View style={styles.yuva}>
        <DogrudanMarka boyut={27} />
      </View>
    );
  }
  return (
    <Image
      source={require("@/assets/marka/dogrudan-marka.webp")}
      style={styles.gorsel}
      contentFit="contain"
      transition={0}
      onError={() => setHata(true)}
    />
  );
}
