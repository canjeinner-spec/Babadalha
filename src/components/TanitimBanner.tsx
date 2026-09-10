import { StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

const ORAN = 7 / 2;
const VURGU = "#F5CE6E";

export function TanitimBanner() {
  return (
    <View style={styles.banner}>
      <Gradient colors={["#2E1F45", "#171029"]} deg={125} style={StyleSheet.absoluteFill} />
      <View style={[styles.hale, { backgroundColor: VURGU + "26" }]} pointerEvents="none" />
      <Gradient
        colors={["rgba(255,255,255,.14)", "rgba(255,255,255,0)"]}
        deg={150}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.icerik}>
        <View style={styles.amblem}>
          <Gradient colors={[VURGU, VURGU + "55"]} deg={150} style={StyleSheet.absoluteFill} />
          <Icon name="evParty" size={29} color="#241A05" />
        </View>

        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.ustSatir}>
            <Txt weight="bold" size={9} color={VURGU} style={{ letterSpacing: 2 }}>ARON PARTİ</Txt>
            <View style={styles.etiket}>
              <Txt weight="extrabold" size={7.5} color="#241A05" style={{ letterSpacing: 0.5 }}>YENİ</Txt>
            </View>
          </View>

          <Txt weight="displayBold" size={18} color="#fff" numberOfLines={1} style={styles.baslik}>
            Birlikte izlemek artık burada
          </Txt>
          <Txt size={11} color="rgba(255,255,255,.78)" lh={1.35} numberOfLines={2} style={{ marginTop: 3 }}>
            Odanı kur, bağlantını paylaş, aynı sahneyi aynı anda izleyin. Sesli sohbet açık.
          </Txt>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    aspectRatio: ORAN,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.16)",
  },
  hale: { position: "absolute", right: -28, top: -34, width: 150, height: 150, borderRadius: 75 },
  icerik: { flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16 },
  amblem: {
    width: 60, height: 60, borderRadius: 19, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,.2)",
  },
  ustSatir: { flexDirection: "row", alignItems: "center", gap: 7 },
  etiket: { paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: 5, backgroundColor: VURGU },
  baslik: {
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
