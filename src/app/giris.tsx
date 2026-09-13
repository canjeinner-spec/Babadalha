import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AkanDuvar } from "@/components/AkanDuvar";
import { ElmaIsareti, GoogleIsareti } from "@/components/MarkaIkonlari";
import { TitrekYazi } from "@/components/TitrekYazi";
import { Txt } from "@/components/Txt";
import { KARSILAMA_KARELERI } from "@/data/karsilamaKareleri";
import { useCeviri } from "@/lib/ceviri";
import { signInWithApple, signInWithGoogle } from "@/data/remote/authRepo";
import { isSupabaseConfigured } from "@/lib/supabase";
import { haptic } from "@/lib/haptics";
import { girisEkraniniGec } from "@/lib/ilkAcilis";
import { C } from "@/theme/colors";

export default function Giris() {
  const router = useRouter();
  const t = useCeviri();
  const [markaHatasi, setMarkaHatasi] = useState(false);
  const [mesgul, setMesgul] = useState<"apple" | "google" | "misafir" | null>(null);
  const [hata, setHata] = useState("");

  const iceGir = useCallback(async () => {
    await girisEkraniniGec();
    router.replace("/");
  }, [router]);

  const misafir = useCallback(async () => {
    if (mesgul) return;
    haptic.select();
    setMesgul("misafir");
    await iceGir();
  }, [mesgul, iceGir]);

  const saglayiciyla = useCallback(async (saglayici: "apple" | "google") => {
    if (mesgul) return;
    haptic.select();
    setHata("");
    if (!isSupabaseConfigured) {
      setHata(t("giris.sunucuEksik"));
      return;
    }
    setMesgul(saglayici);
    try {
      if (saglayici === "google") await signInWithGoogle();
      else await signInWithApple();
      await iceGir();
    } catch (e) {
      const m = (e as Error)?.message ?? "";
      setHata(
        /provider is not enabled|not enabled|Unsupported provider/i.test(m)
          ? t("giris.saglayiciKapali", saglayici === "google" ? "Google" : "Apple")
          : m || t("giris.basarisiz"),
      );
    } finally {
      setMesgul(null);
    }
  }, [mesgul, iceGir, t]);

  return (
    <View style={styles.kok}>
      <AkanDuvar gorseller={KARSILAMA_KARELERI} sutunSayisi={3} sutunOrani={0.42} karartma={0.38} />

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
        </View>

        <View style={{ flex: 0.85 }} />

        <View style={styles.orta}>
          <TitrekYazi
            parcalar={[
              { metin: `${t("giris.baslik1")}\n`, renk: "#fff" },
              { metin: t("giris.baslik2"), renk: C.gold2 },
            ]}
            size={25}
            style={styles.baslik}
          />
          <Txt size={13.5} color="rgba(255,255,255,.86)" align="center" lh={1.5} style={styles.altYazi}>
            {t("giris.altYazi")}
          </Txt>
        </View>

        <View style={{ flex: 1.5 }} />

        <View style={styles.dip}>
          <Pressable
            style={[styles.beyazDugme, mesgul && mesgul !== "apple" && styles.sonuk]}
            onPress={() => saglayiciyla("apple")}
          >
            <ElmaIsareti size={19} renk="#141018" />
            <Txt weight="extrabold" size={15.5} color="#141018">
              {mesgul === "apple" ? t("giris.baglaniyor") : t("giris.apple")}
            </Txt>
          </Pressable>

          <Pressable
            style={[styles.beyazDugme, mesgul && mesgul !== "google" && styles.sonuk]}
            onPress={() => saglayiciyla("google")}
          >
            <GoogleIsareti size={19} />
            <Txt weight="extrabold" size={15.5} color="#141018">
              {mesgul === "google" ? t("giris.baglaniyor") : t("giris.google")}
            </Txt>
          </Pressable>

          <View style={styles.ayrac}>
            <View style={styles.cizgi} />
            <Txt weight="bold" size={13} color="rgba(255,255,255,.85)" style={styles.ayracYazi}>{t("giris.veya")}</Txt>
            <View style={styles.cizgi} />
          </View>

          <Pressable
            style={[styles.misafirDugme, mesgul && mesgul !== "misafir" && styles.sonuk]}
            onPress={misafir}
          >
            <Txt weight="extrabold" size={15.5} color="#fff">{t("giris.misafir")}</Txt>
          </Pressable>

          {hata !== "" && (
            <Txt size={12} color={C.red} align="center" lh={1.45} style={styles.hataYazi}>{hata}</Txt>
          )}
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
  baslik: {
    textAlign: "center", lineHeight: 34,
    textShadowColor: "rgba(0,0,0,.85)", textShadowRadius: 12,
    textShadowOffset: { width: 0, height: 2 },
  },
  altYazi: {
    marginTop: 16, paddingHorizontal: 8,
    textShadowColor: "rgba(0,0,0,.8)", textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 1 },
  },
  dip: { paddingHorizontal: 20, paddingBottom: 46, gap: 12 },
  beyazDugme: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
    paddingVertical: 16, borderRadius: 16, backgroundColor: "#F2F1EC",
  },
  misafirDugme: {
    alignItems: "center", justifyContent: "center", paddingVertical: 16,
    borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,.34)",
    backgroundColor: "rgba(255,255,255,.07)",
  },
  ayrac: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 2 },
  ayracYazi: {
    textShadowColor: "rgba(0,0,0,.8)", textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
  cizgi: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,.28)" },
  sonuk: { opacity: 0.5 },
  hataYazi: {
    marginTop: 2, paddingHorizontal: 8,
    textShadowColor: "rgba(0,0,0,.8)", textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 1 },
  },
});
