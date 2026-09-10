import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { C } from "@/theme/colors";

export function DogrudanMarka({ boyut = 28 }: { boyut?: number }) {
  return (
    <Txt
      weight="displayBold"
      size={boyut}
      color={C.gold}
      style={[styles.yazi, { lineHeight: boyut * 1.04 }]}
    >
      LINK
    </Txt>
  );
}

const styles = StyleSheet.create({
  yazi: { letterSpacing: 1.5 },
  yuva: { width: "100%", height: 46, alignItems: "center", justifyContent: "center" },
  gorsel: { width: "118%", height: 46 },
});

export function DogrudanLogo() {
  const [hata, setHata] = useState(false);
  if (hata) {
    return (
      <View style={styles.yuva}>
        <DogrudanMarka boyut={28} />
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
