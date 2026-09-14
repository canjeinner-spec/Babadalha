import { StyleSheet, View } from "react-native";

import { Icon } from "@/icons/Icon";
import { Gradient } from "@/theme/Gradient";

export function Jeton({ boyut = 28 }: { boyut?: number }) {
  return (
    <Gradient
      colors={["#F7DE9B", "#E8B341", "#B07C12"]}
      deg={150}
      style={[styles.jeton, { width: boyut, height: boyut, borderRadius: boyut / 2 }]}
    >
      <View style={[styles.ic, { width: boyut * 0.74, height: boyut * 0.74, borderRadius: boyut * 0.37 }]}>
        <Icon name="evParty" size={boyut * 0.42} sw={2.2} color="#7A5104" fill="#7A5104" />
      </View>
    </Gradient>
  );
}

export function JetonYigini() {
  return (
    <View style={styles.yigin}>
      <View style={styles.hale} />
      <View style={styles.arka}>
        <View style={{ transform: [{ rotate: "-16deg" }], opacity: 0.9 }}><Jeton boyut={46} /></View>
        <View style={{ transform: [{ rotate: "12deg" }], marginTop: 10, opacity: 0.9 }}><Jeton boyut={40} /></View>
      </View>
      <View style={styles.on}>
        <Jeton boyut={74} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  jeton: { alignItems: "center", justifyContent: "center" },
  ic: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.34)",
  },
  yigin: { height: 112, alignItems: "center", justifyContent: "center" },
  hale: {
    position: "absolute", width: 190, height: 82, borderRadius: 41,
    backgroundColor: "rgba(232,179,65,.16)",
  },
  arka: { position: "absolute", flexDirection: "row", gap: 78 },
  on: { shadowColor: "#E8B341", shadowOpacity: 0.5, shadowRadius: 18, shadowOffset: { width: 0, height: 6 } },
});
