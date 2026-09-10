import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AkanDuvar } from "@/components/AkanDuvar";
import { DilSecici } from "@/components/DilSecici";
import { ElmaIsareti, GoogleIsareti } from "@/components/MarkaIkonlari";
import { TitrekYazi } from "@/components/TitrekYazi";
import { Txt } from "@/components/Txt";
import { KARSILAMA_KARELERI } from "@/data/karsilamaKareleri";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

export const KARSILAMA_ANAHTARI = "aron.karsilama.goruldu";

const DUVAR_ORANI = 0.54;

export default function Giris() {
  const router = useRouter();
  const { height } = useWindowDimensions();
  const [markaHatasi, setMarkaHatasi] = useState(false);

  const devam = useCallback(async () => {
    haptic.select();
    try { await AsyncStorage.setItem(KARSILAMA_ANAHTARI, "1"); } catch { /* yoksay */ }
    router.replace("/");
  }, [router]);

  const duvarYuksekligi = Math.round(height * DUVAR_ORANI);

  return (
    <View style={styles.kok}>
      <View style={[styles.duvarYuvasi, { height: duvarYuksekligi }]}>
        <AkanDuvar gorseller={KARSILAMA_KARELERI} sutunSayisi={3} karartma={0.6} />
        <LinearGradient
          colors={["rgba(8,8,12,0)", "rgba(8,8,12,.75)", C.bg]}
          locations={[0.45, 0.82, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <View style={[styles.dikis, { top: duvarYuksekligi - 1 }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(232,179,65,0)", C.gold, "rgba(232,179,65,0)"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.dikisCizgi}
        />
        <LinearGradient
          colors={["rgba(232,179,65,.16)", "rgba(232,179,65,0)"]}
          style={styles.dikisIsik}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <View style={{ width: 62 }} />
          {markaHatasi ? (
            <Txt weight="displayBold" size={26} color="#fff">Aron</Txt>
          ) : (
            <Image
              source={require("@/assets/marka/aron-marka.webp")}
              style={styles.marka}
              contentFit="contain"
              transition={160}
              onError={() => setMarkaHatasi(true)}
            />
          )}
          <View style={{ width: 62, alignItems: "flex-end" }}>
            <DilSecici />
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.orta}>
          <TitrekYazi
            parcalar={[
              { metin: "Arada ne kadar yol varsa,\n", renk: "#fff" },
              { metin: "film aynı saniyede başlar", renk: C.gold2 },
            ]}
            size={25}
            style={{ textAlign: "center", lineHeight: 34 }}
          />
          <Txt size={13.5} color="rgba(255,255,255,.66)" align="center" lh={1.5} style={styles.altYazi}>
            Netflix, Disney+, Prime Video, YouTube ve daha fazlası.
            Sen aç, o açsın, geri kalanı Aron halleder.
          </Txt>
        </View>

        <View style={styles.dip}>
          <Pressable style={[styles.dugme, styles.elma]} onPress={devam}>
            <ElmaIsareti size={18} renk="#fff" />
            <Txt weight="extrabold" size={15} color="#fff">Apple ile devam et</Txt>
          </Pressable>

          <Pressable style={[styles.dugme, styles.google]} onPress={devam}>
            <GoogleIsareti size={18} />
            <Txt weight="extrabold" size={15} color="#1F1F1F">Google ile devam et</Txt>
          </Pressable>

          <Pressable style={styles.misafir} onPress={devam} hitSlop={8}>
            <Txt weight="extrabold" size={14} color={C.gold2}>Misafir olarak devam et</Txt>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  duvarYuvasi: { position: "absolute", top: 0, left: 0, right: 0, overflow: "hidden" },
  dikis: { position: "absolute", left: 0, right: 0, height: 60 },
  dikisCizgi: { height: 1, opacity: 0.5 },
  dikisIsik: { height: 58 },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingTop: 10, paddingHorizontal: 16,
  },
  marka: { width: 128, height: 30 },
  orta: { paddingHorizontal: 26, paddingBottom: 30 },
  altYazi: { marginTop: 16, paddingHorizontal: 6 },
  dip: { paddingHorizontal: 20, paddingBottom: 14, gap: 11 },
  dugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 15, borderRadius: 15,
  },
  elma: { backgroundColor: "#0B0B10", borderWidth: 1, borderColor: "rgba(255,255,255,.22)" },
  google: { backgroundColor: "#FFFFFF" },
  misafir: { alignItems: "center", justifyContent: "center", paddingVertical: 12 },
});
