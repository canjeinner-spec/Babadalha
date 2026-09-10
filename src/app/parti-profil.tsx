import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OzelIdGosterim } from "@/components/OzelId";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { gunYaz, partiIstatistiklerim, saatAraligiYaz, sureYaz, type PartiIstatistik } from "@/data/remote/partiRepo";
import { Icon } from "@/icons/Icon";
import { platformBul } from "@/oda/platform";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

function tarihYaz(ham?: string | null): string {
  if (!ham) return "—";
  const t = new Date(ham);
  if (Number.isNaN(t.getTime())) return "—";
  return t.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

function Satir({ etiket, deger }: { etiket: string; deger: string }) {
  return (
    <View style={styles.satir}>
      <Txt size={12.5} color={C.dim} style={{ flex: 1 }}>{etiket}</Txt>
      <Txt weight="extrabold" size={12.5} color="#fff" numberOfLines={1}>{deger}</Txt>
    </View>
  );
}

export default function PartiProfil() {
  const router = useRouter();
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const userLevel = useApp((s) => s.userLevel);
  const publicId = useApp((s) => s.publicId);
  const session = useApp((s) => s.session);
  const ozelId = useApp((s) => s.ozelId);
  const ozelIdTip = useApp((s) => s.ozelIdTip);
  const ozelIdTema = useApp((s) => s.ozelIdTema);
  const dbId = useApp((s) => s.dbId);

  const [istatistik, setIstatistik] = useState<PartiIstatistik | null>(null);
  useEffect(() => {
    let acik = true;
    partiIstatistiklerim(dbId)
      .then((r) => { if (acik) setIstatistik(r); })
      .catch(() => {});
    return () => { acik = false; };
  }, [dbId]);

  const favori = platformBul(istatistik?.favoriPlatform)?.ad ?? "—";

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.baslik}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">Profilim</Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <View style={styles.kart}>
            <Portrait name={userName} size={72} photo={userPhoto ?? undefined} halkasiz />

            <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
              <RenkliAd
                ad={userName}
                tip={ozelIdTip}
                tema={ozelIdTema}
                size={19}
                weight="displayBold"
                renk="#fff"
              />
              {ozelId ? (
                <View style={{ alignSelf: "flex-start" }}>
                  <OzelIdGosterim id={ozelId} tip={ozelIdTip} tema={ozelIdTema} punto={17} kapsulSize={13} />
                </View>
              ) : publicId ? (
                <Txt size={12} color={C.dim}>ID {publicId}</Txt>
              ) : null}
            </View>
          </View>

          <View style={styles.kutu}>
            <Satir etiket="Seviye" deger={`Lv ${userLevel}`} />
            <View style={styles.ayirac} />
            <Satir etiket="Kayıt tarihi" deger={tarihYaz(session?.user?.created_at)} />
            <View style={styles.ayirac} />
            <Satir etiket="Hesap" deger={session ? "Doğrulanmış" : "Misafir"} />
          </View>

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            PARTİ MODU
          </Txt>

          <View style={styles.kutu}>
            <Satir etiket="Favori platform" deger={favori} />
            <View style={styles.ayirac} />
            <Satir etiket="Toplam geçirilen süre" deger={sureYaz(istatistik?.toplamSaniye ?? null)} />
            <View style={styles.ayirac} />
            <Satir etiket="Bu hafta" deger={sureYaz(istatistik?.buHaftaSaniye ?? null)} />
            <View style={styles.ayirac} />
            <Satir etiket="En uzun oturum" deger={sureYaz(istatistik?.enUzunSaniye ?? null)} />
            <View style={styles.ayirac} />
            <Satir etiket="Ortalama oturum" deger={sureYaz(istatistik?.ortalamaSaniye ?? null)} />
            <View style={styles.ayirac} />
            <Satir etiket="Oturum sayısı" deger={istatistik ? String(istatistik.oturumSayisi) : "—"} />
            <View style={styles.ayirac} />
            <Satir etiket="Farklı oda" deger={istatistik ? String(istatistik.farkliOda) : "—"} />
            <View style={styles.ayirac} />
            <Satir etiket="En aktif saat" deger={saatAraligiYaz(istatistik?.enAktifSaat ?? null)} />
            <View style={styles.ayirac} />
            <Satir etiket="Son oturum" deger={gunYaz(istatistik?.sonOturum ?? null)} />
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
  kart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.07)",
  },
  kutu: { borderRadius: 16, backgroundColor: "rgba(255,255,255,.04)", paddingHorizontal: 14 },
  bolumBaslik: { marginTop: 22, marginBottom: 9, marginLeft: 4, letterSpacing: 1.1 },
  satir: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 12 },
  ayirac: { height: 1, backgroundColor: "rgba(255,255,255,.06)" },
});
