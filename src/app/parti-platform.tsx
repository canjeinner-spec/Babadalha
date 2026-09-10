import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { PLATFORMLAR, platformKilitNotu } from "@/oda/platform";
import { C } from "@/theme/colors";

export default function PartiPlatform() {
  const router = useRouter();
  const { secim } = useLocalSearchParams<{ secim?: string }>();

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
                    if (secim) router.replace({ pathname: "/parti-sec", params: { platform: p.kod } });
                    else router.replace({ pathname: "/parti-oda", params: { platform: p.kod } });
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
          </View>

          <Pressable
            onPress={() => {
              haptic.select();
              router.push({ pathname: "/parti-dogrudan", params: secim ? { secim: "1" } : {} });
            }}
            style={styles.dogrudan}
          >
            <View style={styles.dogrudanSimge}>
              <Icon name="globe2" size={18} color={C.teal} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="extrabold" size={13} color="#fff">Doğrudan bağlantı</Txt>
              <Txt size={11} color={C.dim} style={{ marginTop: 2 }}>
                Kendi video adresin · eşzamanlı izleme
              </Txt>
            </View>
            <Icon name="chev" size={15} color={C.dim2} />
          </Pressable>
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
  dogrudan: {
    flexDirection: "row", alignItems: "center", gap: 12, marginTop: 30,
    padding: 14, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,.04)", borderWidth: 1, borderColor: C.line,
  },
  dogrudanSimge: {
    width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(94,234,212,.10)", borderWidth: 1, borderColor: "rgba(94,234,212,.24)",
  },
  kilitNotu: { marginTop: 4 },
});
