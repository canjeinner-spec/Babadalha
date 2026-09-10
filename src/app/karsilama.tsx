import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { KARSILAMA_SAYFALARI, type KarsilamaSayfasi } from "@/data/karsilamaSayfalari";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

export const KARSILAMA_ANAHTARI = "aron.karsilama.goruldu";

function Sayfa({ sayfa, genislik }: { sayfa: KarsilamaSayfasi; genislik: number }) {
  return (
    <ScrollView
      style={{ width: genislik }}
      contentContainerStyle={styles.sayfa}
      showsVerticalScrollIndicator={false}
      nestedScrollEnabled
    >
      {sayfa.gorsel ? (
        <Image source={sayfa.gorsel} style={styles.foto} contentFit="cover" transition={220} />
      ) : (
        <View style={styles.gorselsizPay} />
      )}
      {!!sayfa.altYazi && (
        <Txt weight="bold" size={12.5} color={C.dim} align="center" style={styles.fotoAlti}>
          {sayfa.altYazi}
        </Txt>
      )}

      <View style={styles.kart}>
        <Txt weight="displayBold" size={22} color="#fff" align="center" style={styles.baslik}>
          {sayfa.baslik}
        </Txt>
        {sayfa.paragraflar.map((p, i) =>
          p.vurgu ? (
            <View key={i} style={styles.vurguKutu}>
              <Txt weight="extrabold" size={15} color={C.gold2} align="center" lh={1.58}>
                {p.metin}
              </Txt>
            </View>
          ) : (
            <Txt
              key={i}
              size={14}
              color="rgba(255,255,255,.82)"
              align="center"
              lh={1.62}
              style={styles.paragraf}
            >
              {p.metin}
            </Txt>
          ),
        )}
      </View>
    </ScrollView>
  );
}

export default function Karsilama() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const akis = useRef<ScrollView>(null);
  const [sayfa, setSayfa] = useState(0);
  const son = sayfa >= KARSILAMA_SAYFALARI.length - 1;
  const cokSayfa = KARSILAMA_SAYFALARI.length > 1;

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
        {cokSayfa ? (
        <ScrollView
          ref={akis}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setSayfa(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {KARSILAMA_SAYFALARI.map((s) => (
            <Sayfa key={s.anahtar} sayfa={s} genislik={width} />
          ))}
        </ScrollView>
        ) : (
          <Sayfa sayfa={KARSILAMA_SAYFALARI[0]} genislik={width} />
        )}

        <View style={styles.dip}>
          <Pressable style={styles.dugme} onPress={ileri}>
            <Txt weight="extrabold" size={15.5} color="#241A05">
              {son ? "Devam et" : "İleri"}
            </Txt>
            <Icon name="chev" size={19} sw={2.4} color="#241A05" />
          </Pressable>

          {cokSayfa && (
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
  foto: { width: "66%", aspectRatio: 1, borderRadius: 24, backgroundColor: C.card },
  fotoAlti: { marginTop: 12, paddingHorizontal: 26 },
  gorselsizPay: { height: 26 },
  kart: {
    marginTop: 32, width: "100%", borderRadius: 22, paddingVertical: 22, paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: "rgba(255,255,255,.08)",
  },
  baslik: { letterSpacing: 1.4, marginBottom: 16 },
  paragraf: { marginTop: 12 },
  vurguKutu: {
    marginTop: 20, paddingTop: 18, paddingHorizontal: 4,
    borderTopWidth: 1, borderTopColor: "rgba(232,179,65,.22)",
  },
  dip: { paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  dugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold2,
  },
  noktalar: { flexDirection: "row", justifyContent: "center", gap: 7 },
  nokta: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,.22)" },
  noktaAcik: { backgroundColor: C.gold2, width: 20 },
});
