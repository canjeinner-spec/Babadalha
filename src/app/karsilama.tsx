import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { KARSILAMA_SAYFALARI } from "@/data/karsilamaSayfalari";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

export const KARSILAMA_ANAHTARI = "aron.karsilama.goruldu";

export default function Karsilama() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const akis = useRef<ScrollView>(null);
  const [sayfa, setSayfa] = useState(0);
  const son = sayfa >= KARSILAMA_SAYFALARI.length - 1;

  const ileri = useCallback(async () => {
    haptic.select();
    if (!son) {
      const hedef = sayfa + 1;
      setSayfa(hedef);
      akis.current?.scrollTo({ x: hedef * width, animated: true });
      return;
    }
    try { await AsyncStorage.setItem(KARSILAMA_ANAHTARI, "1"); } catch { /* yoksay */ }
    router.replace("/");
  }, [son, sayfa, width, router]);

  return (
    <View style={styles.kok}>
      <LinearGradient
        colors={["rgba(232,179,65,.10)", "rgba(8,8,12,0)"]}
        style={styles.isik}
        pointerEvents="none"
      />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <ScrollView
          ref={akis}
          horizontal
          pagingEnabled
          scrollEnabled={KARSILAMA_SAYFALARI.length > 1}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setSayfa(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {KARSILAMA_SAYFALARI.map((s) => (
            <ScrollView
              key={s.anahtar}
              style={{ width }}
              contentContainerStyle={styles.sayfa}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={require("@/assets/karsilama/kediler.webp")}
                style={styles.foto}
                contentFit="cover"
                transition={220}
              />
              {!!s.altYazi && (
                <Txt weight="bold" size={12.5} color={C.dim} align="center" style={styles.fotoAlti}>
                  {s.altYazi}
                </Txt>
              )}

              <View style={styles.kart}>
                <Txt weight="displayBold" size={22} color="#fff" align="center" style={styles.baslik}>
                  {s.baslik}
                </Txt>
                {s.paragraflar.map((p, i) => (
                  <Txt
                    key={i}
                    size={14}
                    color="rgba(255,255,255,.82)"
                    align="center"
                    lh={1.62}
                    style={styles.paragraf}
                  >
                    {p}
                  </Txt>
                ))}
              </View>
            </ScrollView>
          ))}
        </ScrollView>

        <View style={styles.dip}>
          <Pressable style={styles.dugme} onPress={ileri}>
            <Txt weight="extrabold" size={15.5} color="#241A05">
              {son ? "Devam et" : "İleri"}
            </Txt>
            <Icon name="chev" size={19} sw={2.4} color="#241A05" />
          </Pressable>

          {KARSILAMA_SAYFALARI.length > 1 && (
            <View style={styles.noktalar}>
              {KARSILAMA_SAYFALARI.map((s, i) => (
                <View key={s.anahtar} style={[styles.nokta, i === sayfa && styles.noktaAcik]} />
              ))}
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  sayfa: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 26, alignItems: "center" },
  foto: { width: "78%", aspectRatio: 1, borderRadius: 26, backgroundColor: C.card },
  fotoAlti: { marginTop: 12, paddingHorizontal: 26 },
  kart: {
    marginTop: 20, width: "100%", borderRadius: 22, paddingVertical: 22, paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)",
  },
  baslik: { letterSpacing: 1.4, marginBottom: 16 },
  paragraf: { marginTop: 12 },
  dip: { paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  dugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold2,
  },
  noktalar: { flexDirection: "row", justifyContent: "center", gap: 7 },
  nokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,.22)" },
  noktaAcik: { backgroundColor: C.gold2, width: 20 },
});
