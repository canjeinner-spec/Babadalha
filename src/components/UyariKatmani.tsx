import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useUyari, type UyariCesidi } from "@/lib/uyari";
import { C } from "@/theme/colors";

const SURE: Record<UyariCesidi, number> = { hata: 3000, basari: 2000, bilgi: 2400 };
const RENK: Record<UyariCesidi, string> = { hata: C.red, basari: C.green, bilgi: C.gold2 };
const SIMGE: Record<UyariCesidi, IconName> = { hata: "warn", basari: "check", bilgi: "bell" };

export function UyariKatmani() {
  const metin = useUyari((s) => s.metin);
  const cesit = useUyari((s) => s.cesit);
  const sira = useUyari((s) => s.sira);
  const kapat = useUyari((s) => s.kapat);

  useEffect(() => {
    if (!metin) return;
    const z = setTimeout(kapat, SURE[cesit]);
    return () => clearTimeout(z);
  }, [metin, cesit, sira, kapat]);

  if (!metin) return null;

  const renk = RENK[cesit];

  return (
    <View style={styles.katman} pointerEvents="none">
      <Animated.View
        key={sira}
        entering={FadeIn.duration(160)}
        exiting={FadeOut.duration(220)}
        style={[styles.kart, { borderColor: renk + "59" }]}
      >
        <View style={[styles.simge, { backgroundColor: renk + "24", borderColor: renk + "4d" }]}>
          <Icon name={SIMGE[cesit]} size={17} sw={2.2} color={renk} />
        </View>
        <Txt weight="bold" size={13.5} color="#fff" align="center" lh={1.4}>{metin}</Txt>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  katman: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 34,
  },
  kart: {
    alignItems: "center", gap: 11,
    paddingHorizontal: 22, paddingVertical: 20, borderRadius: 20, borderWidth: 1,
    backgroundColor: "rgba(16,13,9,.97)", maxWidth: 320,
  },
  simge: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: "center", justifyContent: "center", borderWidth: 1,
  },
});
