import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DogrudanLogo } from "@/components/DogrudanMarka";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { PLATFORMLAR, platformBul, platformKilitNotu } from "@/oda/platform";
import { usePartiKuyruk } from "@/parti/kuyruk";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

export default function PartiPlatform() {
  const router = useRouter();
  const { secim } = useLocalSearchParams<{ secim?: string }>();
  const sec = usePartiKuyruk((s) => s.sec);
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.baslik}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">Ne izleyeceğiz?</Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, paddingTop: 6 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.izgara}>
            {PLATFORMLAR.map((p) => {
              const kilit = platformKilitNotu(p.kod);
              return (
                <Pressable
                  key={p.kod}
                  disabled={!!kilit}
                  onPress={() => {
                    haptic.select();
                    if (secim) {
                      const hedef = platformBul(p.kod);
                      sec({
                        anahtar: String(Date.now()),
                        platform: p.kod,
                        adres: hedef?.adres ?? p.adres,
                        baslik: null,
                        secen: userName,
                        secenFoto: userPhoto ?? undefined,
                      });
                      router.back();
                    } else {
                      router.replace({ pathname: "/parti-oda", params: { platform: p.kod } });
                    }
                  }}
                  style={styles.hucre}
                >
                  <Image
                    source={p.logo}
                    style={[styles.logo, !!kilit && styles.logoKilitli]}
                    contentFit="contain"
                    transition={0}
                  />
                  {!!kilit && (
                    <Txt size={10} color={C.dim} align="center" style={styles.kilitNotu}>{kilit}</Txt>
                  )}
                </Pressable>
              );
            })}

          <Pressable
            onPress={() => {
              haptic.select();
              if (secim) router.replace({ pathname: "/parti-dogrudan", params: { secim: "1" } });
              else router.push({ pathname: "/parti-dogrudan", params: {} });
            }}
            style={styles.hucre}
          >
            <DogrudanLogo />
          </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  baslik: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  izgara: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 30 },
  hucre: { width: "46%", height: 66, alignItems: "center", justifyContent: "center" },
  logo: { width: "100%", height: 46 },
  logoKilitli: { opacity: 0.28 },
  kilitNotu: { marginTop: 4 },
});
