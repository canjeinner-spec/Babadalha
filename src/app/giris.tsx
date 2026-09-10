import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AkanDuvar } from "@/components/AkanDuvar";
import { TitrekYazi } from "@/components/TitrekYazi";
import { Txt } from "@/components/Txt";
import { KARSILAMA_KARELERI } from "@/data/karsilamaKareleri";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

export const KARSILAMA_ANAHTARI = "aron.karsilama.goruldu";

const DILLER = [
  { kod: "tr", ad: "Türkçe", bayrak: "🇹🇷" },
  { kod: "en", ad: "English", bayrak: "🇬🇧" },
];

export default function Giris() {
  const router = useRouter();
  const [dilAcik, setDilAcik] = useState(false);
  const [dil, setDil] = useState(DILLER[0]);
  const [markaHatasi, setMarkaHatasi] = useState(false);

  const devam = useCallback(async () => {
    haptic.select();
    try { await AsyncStorage.setItem(KARSILAMA_ANAHTARI, "1"); } catch { /* yoksay */ }
    router.replace("/");
  }, [router]);

  return (
    <View style={styles.kok}>
      <AkanDuvar gorseller={KARSILAMA_KARELERI} sutunSayisi={3} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          {markaHatasi ? (
            <Txt weight="displayBold" size={30} color="#fff">Aron</Txt>
          ) : (
            <Image
              source={require("@/assets/marka/aron-marka.webp")}
              style={styles.marka}
              contentFit="contain"
              transition={160}
              onError={() => setMarkaHatasi(true)}
            />
          )}

          <Pressable
            style={styles.dilKapsul}
            onPress={() => { haptic.select(); setDilAcik((v) => !v); }}
          >
            <Txt weight="extrabold" size={14} color="#fff">{dil.ad}</Txt>
            <Txt size={14} color="#fff">{dil.bayrak}</Txt>
            <View style={{ flex: 1 }} />
            <View style={{ transform: [{ rotate: "90deg" }] }}>
              <Icon name="chev" size={18} sw={2.2} color="rgba(255,255,255,.75)" />
            </View>
          </Pressable>

          {dilAcik && (
            <View style={styles.dilListe}>
              {DILLER.map((d) => (
                <Pressable
                  key={d.kod}
                  style={styles.dilSatiri}
                  onPress={() => { haptic.select(); setDil(d); setDilAcik(false); }}
                >
                  <Txt size={14} color="#fff">{d.bayrak}  {d.ad}</Txt>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.orta}>
          <TitrekYazi
            parcalar={[
              { metin: "Her yerden birlikte\n", renk: C.gold2 },
              { metin: "film izleyin ", renk: "#fff" },
              { metin: "❤️", renk: "#fff" },
            ]}
            size={31}
            style={{ textAlign: "center", lineHeight: 40 }}
          />
          <Txt size={14} color="rgba(255,255,255,.72)" align="center" lh={1.45} style={styles.altYazi}>
            Netflix, Disney+, Prime Video, YouTube ve daha fazlasını en sevdiğin
            kişilerle aynı saniyede izle.
          </Txt>
        </View>

        <View style={styles.dip}>
          <Pressable style={styles.birincil} onPress={devam}>
            <Txt weight="extrabold" size={15} color="#141018">Apple ile devam et</Txt>
          </Pressable>

          <Pressable style={styles.birincil} onPress={devam}>
            <Txt weight="extrabold" size={15} color="#141018">Google ile devam et</Txt>
          </Pressable>

          <View style={styles.ayrac}>
            <View style={styles.cizgi} />
            <Txt size={12.5} color="rgba(255,255,255,.6)">veya</Txt>
            <View style={styles.cizgi} />
          </View>

          <Pressable style={styles.ikincil} onPress={devam}>
            <Txt weight="extrabold" size={15} color="#fff">Misafir olarak devam et</Txt>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  tepe: { alignItems: "center", paddingTop: 18, gap: 14 },
  marka: { width: 148, height: 35 },
  dilKapsul: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 9, paddingHorizontal: 18, borderRadius: 22,
    borderWidth: 1, borderColor: "rgba(255,255,255,.22)",
    backgroundColor: "rgba(10,10,16,.45)", minWidth: 186,
  },
  dilListe: {
    borderRadius: 14, overflow: "hidden", minWidth: 186,
    borderWidth: 1, borderColor: "rgba(255,255,255,.14)",
    backgroundColor: "rgba(14,14,20,.94)",
  },
  dilSatiri: { paddingVertical: 12, paddingHorizontal: 18 },
  orta: { flex: 1, justifyContent: "flex-end", paddingHorizontal: 26, paddingBottom: 26 },
  altYazi: { marginTop: 14 },
  dip: { paddingHorizontal: 20, paddingBottom: 10, gap: 10 },
  birincil: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 15, borderRadius: 15, backgroundColor: "#F2F1EC",
  },
  ikincil: {
    alignItems: "center", justifyContent: "center", paddingVertical: 15,
    borderRadius: 15, borderWidth: 1, borderColor: "rgba(255,255,255,.24)",
    backgroundColor: "rgba(10,10,16,.4)",
  },
  ayrac: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 4 },
  cizgi: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,.16)" },
});
