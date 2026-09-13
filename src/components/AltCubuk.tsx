import { useRouter, usePathname, type Href } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AltinAmblem, type AltinAmblemAdi } from "@/components/AltinAmblem";
import { BaslatAmblemi } from "@/components/BaslatAmblemi";
import { Txt } from "@/components/Txt";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

type Sekme = { yol: Href; amblem: AltinAmblemAdi; yedek: IconName; etiket: string };

const SEKMELER: Sekme[] = [
  { yol: "/", amblem: "ev", yedek: "home", etiket: "cubuk.ev" },
  { yol: "/partiler", amblem: "kapi", yedek: "users", etiket: "cubuk.partiler" },
  { yol: "/parti-profil", amblem: "kisi", yedek: "user", etiket: "cubuk.kisi" },
];

function Sekmesi({ sekme, secili, onBas }: { sekme: Sekme; secili: boolean; onBas: () => void }) {
  const t = useCeviri();
  return (
    <Pressable style={styles.sekme} onPress={onBas} hitSlop={6}>
      <View style={[styles.sekmeKutu, secili && styles.sekmeKutuSecili]}>
        <AltinAmblem ad={sekme.amblem} yedek={sekme.yedek} boyut={24} sonuk={!secili} />
      </View>
      <Txt weight={secili ? "extrabold" : "bold"} size={10} color={secili ? C.gold2 : C.dim2}>
        {t(sekme.etiket)}
      </Txt>
    </Pressable>
  );
}

export function AltCubuk() {
  const router = useRouter();
  const t = useCeviri();
  const yol = usePathname();
  const altPay = useSafeAreaInsets().bottom;

  const git = (hedef: Href) => {
    if (hedef === yol) return;
    haptic.select();
    router.replace(hedef);
  };

  return (
    <View style={[styles.kok, { paddingBottom: altPay > 0 ? altPay : 10 }]}>
      <View style={styles.zemin} pointerEvents="none" />
      <Sekmesi sekme={SEKMELER[0]} secili={yol === SEKMELER[0].yol} onBas={() => git(SEKMELER[0].yol)} />
      <Sekmesi sekme={SEKMELER[1]} secili={yol === SEKMELER[1].yol} onBas={() => git(SEKMELER[1].yol)} />

      <Pressable
        style={styles.orta}
        onPress={() => { haptic.select(); router.push("/parti-platform"); }}
      >
        <Gradient colors={[C.gold2, "#C8922B"]} deg={135} style={styles.ortaKutu}>
          <BaslatAmblemi boyut={30} />
        </Gradient>
        <Txt weight="extrabold" size={10} color={C.gold2} style={{ marginTop: 5 }}>
          {t("cubuk.baslat")}
        </Txt>
      </Pressable>

      <Sekmesi sekme={SEKMELER[2]} secili={yol === SEKMELER[2].yol} onBas={() => git(SEKMELER[2].yol)} />
    </View>
  );
}

export const CUBUK_YUKSEKLIGI = 74;

const styles = StyleSheet.create({
  kok: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    flexDirection: "row", alignItems: "flex-end", paddingTop: 10,
  },
  zemin: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: "rgba(16,12,6,.94)",
    borderTopWidth: 1, borderTopColor: "rgba(232,179,65,.14)",
  },
  sekme: { flex: 1, alignItems: "center", gap: 4 },
  sekmeKutu: {
    width: 38, height: 32, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
  },
  sekmeKutuSecili: {
    backgroundColor: "rgba(232,179,65,.12)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.24)",
  },
  orta: { flex: 1, alignItems: "center", marginBottom: 2 },
  ortaKutu: {
    width: 52, height: 52, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    marginTop: -22,
  },
});
