import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Anim } from "@/components/Anim";
import { girisEkraniGecildi, karsilamaGoruldu } from "@/lib/ilkAcilis";
import { BaslatAmblemi } from "@/components/BaslatAmblemi";
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

const ORNEK_ODALAR: LobiOdasi[] = [
  {
    odaId: "ornek-1", ad: "Gece Kuşları", sahip: "Deniz", platform: "netflix",
    baslik: "Sessiz Sokaklar · 3. Bölüm", kapak: null, kisi: 6, ilerleme: 0.34, an: 0,
    katilimcilar: [{ ad: "Deniz" }, { ad: "Ece" }, { ad: "Kaan" }, { ad: "Mert" }],
    konusan: 2, sureSn: 52 * 60, arkadas: true,
  },
  {
    odaId: "ornek-2", ad: "Pazar Filmi", sahip: "Selin", platform: "prime_video",
    baslik: "Uzun Yol", kapak: null, kisi: 3, ilerleme: 0.86, an: 0,
    katilimcilar: [{ ad: "Selin" }, { ad: "Bora" }, { ad: "Ayşe" }],
    konusan: 0, sureSn: 118 * 60,
  },
  {
    odaId: "ornek-3", ad: "Akşam Listesi", sahip: "Efe", platform: "youtube",
    baslik: "Haftanın seçkisi", kapak: null, kisi: 11, ilerleme: 0.05, an: 0,
    katilimcilar: [{ ad: "Efe" }, { ad: "Zeynep" }, { ad: "Can" }, { ad: "Nil" }],
    konusan: 4, sureSn: 26 * 60, arkadas: true,
  },
  {
    odaId: "ornek-4", ad: "Canlı Yayın", sahip: "Barış", platform: "youtube_live",
    baslik: "Stüdyo sohbeti", kapak: null, kisi: 2, ilerleme: 0, an: 0,
    katilimcilar: [{ ad: "Barış" }, { ad: "Ela" }], konusan: 1, canli: true,
  },
  {
    odaId: "ornek-5", ad: "Anime Gecesi", sahip: "Tuna", platform: "crunchyroll",
    baslik: "Rüzgârın Çocukları · 12. Bölüm", kapak: null, kisi: 4, ilerleme: 0.52, an: 0,
    katilimcilar: [{ ad: "Tuna" }, { ad: "Irmak" }, { ad: "Sinan" }], konusan: 0, sureSn: 24 * 60,
  },
];

function durumYazisi(oda: LobiOdasi): string {
  if (oda.canli) return "Canlı";
  const o = Math.min(1, Math.max(0, oda.ilerleme));
  if (o < 0.12) return "Yeni başladı";
  if (o > 0.8) return "Bitmek üzere";
  if (oda.sureSn) return `${Math.max(1, Math.round((oda.sureSn * (1 - o)) / 60))} dk kaldı`;
  return "Yarısında";
}

function OdaKarti({ oda, onBas }: { oda: LobiOdasi; onBas: () => void }) {
  const platform = platformBul(oda.platform);
  const katilimcilar = oda.katilimcilar ?? [];
  const gorunen = katilimcilar.slice(0, 4);
  const artan = Math.max(0, oda.kisi - gorunen.length);
  const konusan = oda.konusan ?? 0;
  const oran = Math.min(1, Math.max(0, oda.ilerleme));

  return (
    <Pressable onPress={onBas} style={[styles.kart, oda.arkadas && styles.kartArkadas]}>
      <View style={styles.kapak}>
        {oda.kapak ? (
          <Image source={{ uri: oda.kapak }} style={StyleSheet.absoluteFill} contentFit="cover" transition={140} />
        ) : (
          <Gradient colors={["#2A2014", "#14100A"]} deg={135} style={StyleSheet.absoluteFill} />
        )}
        {!!platform && (
          <View style={styles.platformRozet}>
            <Image source={platform.logo} style={styles.platformLogo} contentFit="contain" />
          </View>
        )}
        {oda.canli && (
          <View style={styles.canliRozet}>
            <View style={styles.canliNokta} />
            <Txt weight="extrabold" size={8.5} color="#fff">CANLI</Txt>
          </View>
        )}
      </View>

      <View style={styles.sag}>
        <Txt weight="extrabold" size={13.5} color={C.text} numberOfLines={2}>
          {oda.baslik ?? oda.ad}
        </Txt>

        <View style={styles.kisiSatiri}>
          <View style={styles.avatarSira}>
            {gorunen.map((k, i) => (
              <View key={k.ad + i} style={[styles.avatar, i > 0 && styles.avatarUstuste]}>
                <Portrait name={k.ad} size={20} photo={k.foto} halkasiz />
              </View>
            ))}
            {artan > 0 && (
              <View style={[styles.artan, gorunen.length > 0 && styles.avatarUstuste]}>
                <Txt weight="extrabold" size={9.5} color={C.dim}>+{artan}</Txt>
              </View>
            )}
          </View>
          <View style={{ flex: 1 }} />
          {konusan > 0 && (
            <View style={styles.sesKutu}>
              <Icon name="mic" size={11} color={C.gold2} />
              <Txt weight="extrabold" size={10.5} color={C.gold2}>{konusan}</Txt>
            </View>
          )}
        </View>

        <View style={styles.ilerlemeSatiri}>
          {!oda.canli && (
            <View style={styles.ilerlemeYol}>
              <View style={[styles.ilerlemeDolu, { width: `${Math.round(oran * 100)}%` }]} />
            </View>
          )}
          <Txt size={10} color={oda.canli ? C.gold2 : C.dim2} numberOfLines={1}>
            {durumYazisi(oda)}
          </Txt>
        </View>
      </View>
    </Pressable>
  );
}

export default function PartiAnaEkran() {
  const router = useRouter();

  useEffect(() => {
    let acik = true;
    karsilamaGoruldu()
      .then(async (gorulmus) => {
        if (!acik) return;
        if (!gorulmus) {
          router.replace("/karsilama");
          return;
        }
        if (useApp.getState().girisYapildi) return;
        if (await girisEkraniGecildi()) return;
        if (acik) router.replace("/giris");
      })
      .catch(() => {});
    return () => { acik = false; };
  }, [router]);

  const userPhoto = useApp((s) => s.userPhoto);
  const userName = useApp((s) => s.userName);
  const [odalar, setOdalar] = useState<LobiOdasi[]>([]);
  const gosterilecek = odalar.length > 0 ? odalar : __DEV__ ? ORNEK_ODALAR : odalar;
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
        </View>

        <FlatList
          data={gosterilecek}
          keyExtractor={(o) => o.odaId}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 108 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OdaKarti
              oda={item}
              onBas={() => {
                haptic.select();
                router.push({ pathname: "/parti-oda", params: { id: item.odaId, platform: item.platform } });
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.bos}>
              <Anim kaynak={require("@/assets/anim/parti-yok.json")} style={styles.bosAnim} />
              <Txt weight="bold" size={13.5} color={C.text} style={{ marginTop: 6 }}>Şu an açık parti yok</Txt>
            </View>
          }
        />
      </SafeAreaView>

      <Pressable onPress={partiBaslat} style={[styles.baslatSar, { bottom: altPay + 16 }]}>
        <Gradient colors={[C.gold2, "#C8922B"]} deg={135} style={styles.baslat}>
          <BaslatAmblemi />
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
  kart: {
    flexDirection: "row", gap: 11, padding: 10, borderRadius: 16, marginBottom: 10,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kartArkadas: { borderColor: "rgba(232,179,65,.30)" },
  kapak: { width: 144, aspectRatio: 16 / 9, borderRadius: 11, overflow: "hidden", backgroundColor: "#14100A" },
  platformRozet: {
    position: "absolute", left: 5, bottom: 5, paddingHorizontal: 4, paddingVertical: 3,
    borderRadius: 6, backgroundColor: "rgba(0,0,0,.55)",
  },
  platformLogo: { width: 34, height: 11 },
  canliRozet: {
    position: "absolute", right: 5, top: 5, flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 5, paddingVertical: 2.5, borderRadius: 6, backgroundColor: "rgba(220,38,38,.92)",
  },
  canliNokta: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  sag: { flex: 1, minWidth: 0, justifyContent: "space-between", paddingVertical: 1 },
  kisiSatiri: { flexDirection: "row", alignItems: "center", marginTop: 7 },
  avatarSira: { flexDirection: "row", alignItems: "center" },
  avatar: { borderRadius: 12, borderWidth: 1.5, borderColor: C.bg },
  avatarUstuste: { marginLeft: -7 },
  artan: {
    minWidth: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4, backgroundColor: "rgba(255,255,255,.08)", borderWidth: 1.5, borderColor: C.bg,
  },
  sesKutu: {
    flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 8, backgroundColor: C.gold + "1A",
  },
  ilerlemeSatiri: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  ilerlemeYol: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,.10)", overflow: "hidden" },
  ilerlemeDolu: { height: 3, borderRadius: 2, backgroundColor: C.gold },
  bos: { alignItems: "center", paddingTop: 28, paddingHorizontal: 40 },
  bosAnim: { width: 210, height: 149 },
});
