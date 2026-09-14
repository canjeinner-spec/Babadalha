import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OzelIdGosterim } from "@/components/OzelId";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { getPublicProfileById, type PublicProfile } from "@/data/remote/profileRepo";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

function sayiYaz(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

function Kart({ simge, etiket, deger }: { simge: IconName; etiket: string; deger: string }) {
  return (
    <View style={styles.kart}>
      <View style={styles.kartSimge}>
        <Icon name={simge} size={18} sw={2} color={C.gold2} />
      </View>
      <Txt weight="bold" size={14} color="#fff" style={{ flex: 1 }}>{etiket}</Txt>
      <Txt weight="extrabold" size={13.5} color="rgba(255,255,255,.82)" numberOfLines={1}>{deger}</Txt>
    </View>
  );
}

export default function Kisi() {
  const t = useCeviri();
  const p = useLocalSearchParams<{
    id?: string; ad?: string; kullaniciAdi?: string; foto?: string; tip?: string; tema?: string;
  }>();
  const dbId = p.id ? Number(p.id) : null;

  const [profil, setProfil] = useState<PublicProfile | null>(null);
  const [yukleniyor, setYukleniyor] = useState(!!dbId);

  useEffect(() => {
    if (!dbId || Number.isNaN(dbId)) return;
    let acik = true;
    getPublicProfileById(dbId)
      .then((r) => { if (acik) setProfil(r); })
      .catch(() => {})
      .finally(() => { if (acik) setYukleniyor(false); });
    return () => { acik = false; };
  }, [dbId]);

  const ad = profil?.kullanici_adi ?? p.ad ?? "";
  const kullaniciAdi = (p.kullaniciAdi || profil?.kullanici_adi || "").trim();
  const foto = profil?.profil_resmi ?? (p.foto || undefined);
  const tip = (profil?.ozel_id_tip ?? (p.tip || null)) as "premium" | "kapsul" | null;
  const tema = profil?.ozel_id_tema ?? (p.tema || null);
  const konum = [profil?.sehir, profil?.ulke].filter(Boolean).join(", ");

  return (
    <View style={styles.kok}>
      <Gradient
        colors={["rgba(232,179,65,.1)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("kisi.baslik")}</Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
          <View style={styles.tanit}>
            <Portrait name={ad} size={104} photo={foto} halkasiz />
            <View style={{ alignItems: "center", marginTop: 14, gap: 6 }}>
              <RenkliAd ad={ad} tip={tip} tema={tema} size={22} weight="displayBold" renk="#fff" />
              {!!kullaniciAdi && <Txt size={13} color={C.dim}>@{kullaniciAdi}</Txt>}
              {!!profil?.ozel_id && (
                <View style={{ marginTop: 4 }}>
                  <OzelIdGosterim id={profil.ozel_id} tip={tip} tema={tema} punto={17} kapsulSize={13} />
                </View>
              )}
            </View>
            {!!profil?.biyografi && (
              <Txt size={13.5} color={C.dim} align="center" lh={1.55} style={styles.biyografi}>
                {profil.biyografi}
              </Txt>
            )}
          </View>

          {yukleniyor ? (
            <View style={styles.ortala}><ActivityIndicator color={C.gold2} /></View>
          ) : profil ? (
            <View style={styles.kume}>
              <Kart simge="trophy" etiket={t("profil.seviye")} deger={`Lv ${profil.seviye_id ?? "—"}`} />
              <Kart simge="bolt" etiket={t("kart.deneyim")} deger={sayiYaz(profil.deneyim_puani)} />
              {!!konum && <Kart simge="pin" etiket={t("duzenle.sehir")} deger={konum} />}
              {!!profil.kusanilan_rozet && (
                <Kart simge="evStar" etiket={t("kisi.rozet")} deger={profil.kusanilan_rozet} />
              )}
            </View>
          ) : (
            <Txt size={13} color={C.dim2} align="center" lh={1.5} style={{ marginTop: 26 }}>
              {t("kisi.bulunamadi")}
            </Txt>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  tanit: { alignItems: "center", paddingTop: 10, paddingBottom: 24 },
  biyografi: { marginTop: 16, paddingHorizontal: 18 },
  ortala: { paddingVertical: 30, alignItems: "center" },
  kume: { gap: 10 },
  kart: {
    flexDirection: "row", alignItems: "center", gap: 11,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 13,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kartSimge: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
});
