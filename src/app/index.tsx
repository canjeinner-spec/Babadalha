import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AltCubuk, CUBUK_YUKSEKLIGI } from "@/components/AltCubuk";
import { DogrudanLogo } from "@/components/DogrudanMarka";
import { TanitimBanner } from "@/components/TanitimBanner";
import { Image } from "expo-image";
import { Portrait } from "@/components/Portrait";
import { Txt } from "@/components/Txt";
import { UstKaplama } from "@/components/UstKaplama";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { girisEkraniGecildi, karsilamaGoruldu, premiumGoruldu } from "@/lib/ilkAcilis";
import { PLATFORMLAR, platformKilitNotu } from "@/oda/platform";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { TEMA_YAZI_GOLGESI, useTema } from "@/theme/tema";
import { Zemin } from "@/theme/Zemin";

export default function AnaSayfa() {
  const t = useCeviri();
  const router = useRouter();
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const { ic, renk } = useTema();
  const temali = !!ic?.ustGorsel;

  useEffect(() => {
    let acik = true;
    (async () => {
      if (!useApp.getState().girisYapildi && !(await girisEkraniGecildi())) {
        if (acik) router.replace("/giris");
        return;
      }
      if (!(await karsilamaGoruldu())) {
        if (acik) router.replace("/karsilama");
        return;
      }
      if (!(await premiumGoruldu())) {
        if (acik) router.replace("/bir-sey-daha");
      }
    })().catch(() => {});
    return () => { acik = false; };
  }, [router]);


  return (
    <View style={styles.kok}>
      <Zemin hale={!temali} />
      <UstKaplama uzat={96} yumusak />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.baslik}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt
              weight="displayBold"
              size={22}
              color={temali ? renk.ana : "#fff"}
              numberOfLines={1}
              style={temali ? TEMA_YAZI_GOLGESI : undefined}
            >
              {t("ana.selam", userName || "")}
            </Txt>
            <Txt
              size={11.5}
              color={temali ? renk.solgun : C.dim}
              style={[{ marginTop: 2 }, temali ? TEMA_YAZI_GOLGESI : undefined]}
            >
              {t("ana.altBaslik")}
            </Txt>
          </View>
          <Pressable onPress={() => router.push("/parti-profil")} hitSlop={8}>
            <Portrait name={userName || "Sen"} size={36} photo={userPhoto || undefined} halkasiz />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: CUBUK_YUKSEKLIGI + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <TanitimBanner />

          <Txt weight="extrabold" size={12.5} color={C.text} style={styles.bolumBaslik}>
            {t("ana.platformBaslik")}
          </Txt>
          <Txt size={12} color={C.dim} style={styles.bolumAlt}>
            {t("ana.platformAlt")}
          </Txt>

          <View style={styles.izgara}>
            {PLATFORMLAR.map((p) => {
              const kilit = platformKilitNotu(p.kod);
              return (
                <Pressable
                  key={p.kod}
                  disabled={!!kilit}
                  style={styles.hucre}
                  onPress={() => {
                    haptic.select();
                    router.push({ pathname: "/parti-oda", params: { platform: p.kod } });
                  }}
                >
                  <Image
                    source={p.logo}
                    style={[styles.hucreLogo, !!kilit && styles.hucreKilitli]}
                    contentFit="contain"
                    transition={0}
                  />
                  {!!kilit && (
                    <Txt size={9.5} color={C.dim} align="center" style={styles.kilitNotu}>{kilit}</Txt>
                  )}
                </Pressable>
              );
            })}

            <Pressable
              style={styles.hucre}
              onPress={() => { haptic.select(); router.push({ pathname: "/parti-dogrudan", params: {} }); }}
            >
              <DogrudanLogo />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>


      <AltCubuk />
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  baslik: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14,
  },
  izgara: {
    flexDirection: "row", flexWrap: "wrap",
    justifyContent: "space-between", rowGap: 28,
  },
  hucre: { width: "46%", height: 62, alignItems: "center", justifyContent: "center" },
  hucreLogo: { width: "100%", height: 44 },
  hucreKilitli: { opacity: 0.28 },
  kilitNotu: { marginTop: 4 },
  bolumBaslik: { marginTop: 26, marginBottom: 10, marginLeft: 2 },
  bolumAlt: { marginTop: -6, marginBottom: 18, marginLeft: 2 },
});
