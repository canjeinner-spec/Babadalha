import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Portrait } from "@/components/Portrait";
import { TanitimBanner } from "@/components/TanitimBanner";
import { UstKaplama } from "@/components/UstKaplama";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { platformBul } from "@/oda/platform";
import { lobiyiDinle, type LobiOdasi } from "@/parti/lobi";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";
import { TEMA_YAZI_GOLGESI, useTema } from "@/theme/tema";
import { Zemin } from "@/theme/Zemin";

function OdaSatiri({ oda, onBas }: { oda: LobiOdasi; onBas: () => void }) {
  const platform = platformBul(oda.platform);
  return (
    <Pressable onPress={onBas} style={styles.satir}>
      <View style={styles.kapak}>
        {oda.kapak ? (
          <Image source={{ uri: oda.kapak }} style={StyleSheet.absoluteFill} contentFit="cover" transition={140} />
        ) : (
          <Gradient colors={["#241B3A", "#12101C"]} deg={135} style={StyleSheet.absoluteFill} />
        )}
        {!!platform && (
          <View style={styles.platformRozet}>
            <Image source={platform.logo} style={{ width: 14, height: 14 }} contentFit="contain" />
          </View>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="extrabold" size={13.5} color="#fff" numberOfLines={1}>{oda.ad}</Txt>
        <Txt size={11} color={C.dim} numberOfLines={1} style={{ marginTop: 2 }}>
          {oda.baslik ?? platform?.ad ?? "Parti"}
        </Txt>
        <View style={styles.altSatir}>
          <Portrait name={oda.sahip} size={16} photo={oda.sahipFoto} halkasiz />
          <Txt size={10.5} color={C.dim2} numberOfLines={1} style={{ flexShrink: 1 }}>{oda.sahip}</Txt>
        </View>
      </View>

      <View style={styles.kisiCipi}>
        <Icon name="users" size={12} color={C.gold2} />
        <Txt weight="extrabold" size={11.5} color={C.gold2}>{oda.kisi}</Txt>
      </View>
    </Pressable>
  );
}

export default function PartiAnaEkran() {
  const router = useRouter();
  const userPhoto = useApp((s) => s.userPhoto);
  const userName = useApp((s) => s.userName);
  const [odalar, setOdalar] = useState<LobiOdasi[]>([]);
  const { ic, renk } = useTema();
  const altPay = useSafeAreaInsets().bottom;
  const temali = !!ic?.ustGorsel;

  useEffect(() => lobiyiDinle(setOdalar), []);

  const partiBaslat = () => {
    haptic.select();
    router.push("/parti-platform");
  };

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
              style={temali ? TEMA_YAZI_GOLGESI : undefined}
            >
              Parti
            </Txt>
            <Txt
              size={11.5}
              color={temali ? renk.solgun : C.dim}
              style={[{ marginTop: 2 }, temali ? TEMA_YAZI_GOLGESI : undefined]}
            >
              Birlikte izle, birlikte konuş
            </Txt>
          </View>
          <Pressable onPress={() => router.push("/parti-profil")} hitSlop={8}>
            <Portrait name={userName || "Sen"} size={36} photo={userPhoto || undefined} halkasiz />
          </Pressable>
        </View>

        <View style={styles.bannerYuva}>
          <TanitimBanner />
        </View>

        <View style={styles.listeBasligi}>
          <Txt weight="extrabold" size={12.5} color={C.text}>Canlı partiler</Txt>
          <View style={{ flex: 1 }} />
          <Txt size={11} color={C.dim2}>{odalar.length}</Txt>
        </View>

        <FlatList
          data={odalar}
          keyExtractor={(o) => o.odaId}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 108 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OdaSatiri
              oda={item}
              onBas={() => {
                haptic.select();
                router.push({ pathname: "/parti-oda", params: { id: item.odaId, platform: item.platform } });
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.bos}>
              <Icon name="evMoon" size={30} color={C.dim2} />
              <Txt weight="bold" size={13.5} color={C.text} style={{ marginTop: 12 }}>Şu an açık parti yok</Txt>
              <Txt size={11.5} color={C.dim} align="center" style={{ marginTop: 5, lineHeight: 17 }}>
                İlk partiyi sen başlat, arkadaşların listede görsün.
              </Txt>
            </View>
          }
        />
      </SafeAreaView>

      <Pressable onPress={partiBaslat} style={[styles.baslatSar, { bottom: altPay + 16 }]}>
        <Gradient colors={[C.gold2, "#C8922B"]} deg={135} style={styles.baslat}>
          <Icon name="evParty" size={17} color="#241A05" />
          <Txt weight="extrabold" size={14} color="#241A05">Parti başlat</Txt>
        </Gradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  baslik: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14 },
  bannerYuva: { paddingHorizontal: 16, marginTop: 2 },
  baslatSar: {
    position: "absolute", left: 16, right: 16,
    borderRadius: 16, overflow: "hidden",
    shadowColor: "#000", shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  baslat: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14 },
  listeBasligi: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 22, paddingBottom: 10 },
  satir: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.075)",
  },
  kapak: { width: 62, height: 62, borderRadius: 13, overflow: "hidden", backgroundColor: C.kontrol },
  platformRozet: {
    position: "absolute", left: 4, bottom: 4,
    width: 20, height: 20, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(8,8,12,.8)",
  },
  altSatir: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5, minWidth: 0 },
  kisiCipi: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingVertical: 6, paddingHorizontal: 11, borderRadius: 999,
    backgroundColor: C.gold + "14", borderWidth: 1, borderColor: C.gold + "33",
  },
  bos: { alignItems: "center", paddingTop: 60, paddingHorizontal: 40 },
});
