import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
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

export default function Giris() {
  const router = useRouter();
  const [markaHatasi, setMarkaHatasi] = useState(false);

  const devam = useCallback(async () => {
    haptic.select();
    try { await AsyncStorage.setItem(KARSILAMA_ANAHTARI, "1"); } catch { /* yoksay */ }
    router.replace("/");
  }, [router]);

  return (
    <View style={styles.kok}>
      <AkanDuvar gorseller={KARSILAMA_KARELERI} sutunSayisi={3} karartma={0.66} doldur={false} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          {markaHatasi ? (
            <Txt weight="displayBold" size={28} color={C.gold2}>Aron</Txt>
          ) : (
            <Image
              source={require("@/assets/marka/aron-marka.webp")}
              style={styles.marka}
              contentFit="contain"
              transition={160}
              onError={() => setMarkaHatasi(true)}
            />
          )}
          <DilSecici />
        </View>

        <View style={{ flex: 0.85 }} />

        <View style={styles.orta}>
          <TitrekYazi
            parcalar={[
              { metin: "Arada ne kadar yol varsa,\n", renk: "#fff" },
              { metin: "film aynı saniyede başlar", renk: C.gold2 },
            ]}
            size={25}
            style={{ textAlign: "center", lineHeight: 34 }}
          />
          <Txt size={13.5} color="rgba(255,255,255,.72)" align="center" lh={1.5} style={styles.altYazi}>
            Netflix, Disney+, Prime Video, YouTube ve daha fazlası.
          </Txt>
        </View>

        <View style={{ flex: 1.5 }} />

        <View style={styles.dip}>
          <Pressable style={styles.beyazDugme} onPress={devam}>
            <ElmaIsareti size={19} renk="#141018" />
            <Txt weight="extrabold" size={15.5} color="#141018">Apple ile devam edin</Txt>
          </Pressable>

          <Pressable style={styles.beyazDugme} onPress={devam}>
            <GoogleIsareti size={19} />
            <Txt weight="extrabold" size={15.5} color="#141018">Google ile devam edin</Txt>
          </Pressable>

          <View style={styles.ayrac}>
            <View style={styles.cizgi} />
            <Txt weight="bold" size={13} color="rgba(255,255,255,.72)">veya</Txt>
            <View style={styles.cizgi} />
          </View>

          <Pressable style={styles.misafirDugme} onPress={devam}>
            <Txt weight="extrabold" size={15.5} color="#fff">Misafir Olarak Devam Et</Txt>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  tepe: { alignItems: "center", paddingTop: 12, gap: 16 },
  marka: { width: 148, height: 35 },
  orta: { paddingHorizontal: 26 },
  altYazi: { marginTop: 16, paddingHorizontal: 8 },
  dip: { paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  beyazDugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 16, borderRadius: 16, backgroundColor: "#F2F1EC",
  },
  misafirDugme: {
    alignItems: "center", justifyContent: "center", paddingVertical: 16,
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,.26)",
    backgroundColor: "rgba(10,10,16,.42)",
  },
  ayrac: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 2 },
  cizgi: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,.2)" },
});
