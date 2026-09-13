import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CenterModal } from "@/components/CenterModal";
import { Txt } from "@/components/Txt";
import { HAZIR_DILLER } from "@/data/diller";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { useDil } from "@/lib/dil";
import { C } from "@/theme/colors";

type Bicim = "kapsul" | "satir";

export function DilSecici({ bicim = "kapsul" }: { bicim?: Bicim }) {
  const dil = useDil((s) => s.dil);
  const sec = useDil((s) => s.sec);
  const [acik, setAcik] = useState(false);

  const ac = () => { haptic.select(); setAcik(true); };

  return (
    <>
      {bicim === "kapsul" ? (
        <Pressable style={styles.kapsul} onPress={ac} hitSlop={8}>
          <Txt weight="extrabold" size={14.5} color="#fff">{dil.ad}</Txt>
          <Txt size={15}>{dil.bayrak}</Txt>
          <View style={{ flex: 1 }} />
          <View style={{ transform: [{ rotate: "90deg" }] }}>
            <Icon name="chev" size={17} sw={2.2} color="rgba(255,255,255,.7)" />
          </View>
        </Pressable>
      ) : (
        <Pressable style={styles.satir} onPress={ac}>
          <Txt size={13.5} color={C.dim}>Uygulama dili</Txt>
          <View style={{ flex: 1 }} />
          <Txt size={15}>{dil.bayrak}</Txt>
          <Txt weight="extrabold" size={13.5} color="#fff">{dil.ad}</Txt>
          <Icon name="chev" size={16} sw={2.2} color={C.dim2} />
        </Pressable>
      )}

      <CenterModal visible={acik} onClose={() => setAcik(false)}>
        <View style={styles.kart}>
          <Txt weight="displayBold" size={16} color="#fff" align="center">Dil</Txt>
          <ScrollView style={styles.liste} showsVerticalScrollIndicator={false}>
            {HAZIR_DILLER.map((d) => {
              const secili = d.kod === dil.kod;
              return (
                <Pressable
                  key={d.kod}
                  style={[styles.secenek, secili && styles.secenekSecili]}
                  onPress={() => { haptic.select(); sec(d.kod); setAcik(false); }}
                >
                  <Txt size={17}>{d.bayrak}</Txt>
                  <Txt weight={secili ? "extrabold" : "bold"} size={14} color="#fff">{d.ad}</Txt>
                  <View style={{ flex: 1 }} />
                  {secili && <Icon name="check" size={17} sw={2.4} color={C.gold2} />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </CenterModal>
    </>
  );
}

const styles = StyleSheet.create({
  kapsul: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 24,
    borderWidth: 1, borderColor: "rgba(255,255,255,.24)",
    backgroundColor: "rgba(10,10,16,.5)", minWidth: 210,
  },
  satir: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 12 },
  kart: {
    backgroundColor: C.card, borderRadius: 18, paddingVertical: 18, paddingHorizontal: 8,
    borderWidth: 1, borderColor: C.line, maxHeight: 420,
  },
  liste: { marginTop: 10 },
  secenek: {
    flexDirection: "row", alignItems: "center", gap: 11,
    paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
  },
  secenekSecili: { backgroundColor: "rgba(232,179,65,.12)" },
});
