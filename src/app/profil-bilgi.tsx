import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DilSecici } from "@/components/DilSecici";
import { Txt } from "@/components/Txt";
import { gunYaz, partiIstatistiklerim, saatAraligiYaz, sureYaz, type PartiIstatistik } from "@/data/remote/partiRepo";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { useDil } from "@/lib/dil";
import { geriDon } from "@/lib/gezinme";
import { platformBul } from "@/oda/platform";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

type Tur = "hesap" | "parti";

function tarihYaz(ham: string | null | undefined, dilKodu: string): string {
  if (!ham) return "—";
  const zaman = new Date(ham);
  if (Number.isNaN(zaman.getTime())) return "—";
  return zaman.toLocaleDateString(dilKodu, { day: "numeric", month: "long", year: "numeric" });
}

function Kart({ simge, etiket, deger }: { simge: IconName; etiket: string; deger: string }) {
  return (
    <View style={styles.kart}>
      <View style={styles.simge}>
        <Icon name={simge} size={18} sw={2} color={C.gold2} />
      </View>
      <Txt weight="bold" size={14} color="#fff" style={{ flex: 1 }}>{etiket}</Txt>
      <Txt weight="extrabold" size={13.5} color="rgba(255,255,255,.82)" numberOfLines={1}>{deger}</Txt>
    </View>
  );
}

export default function ProfilBilgi() {
  const t = useCeviri();
  const dilKodu = useDil((s) => s.dil.kod);
  const { tur } = useLocalSearchParams<{ tur?: string }>();
  const hangi: Tur = tur === "parti" ? "parti" : "hesap";

  const userLevel = useApp((s) => s.userLevel);
  const session = useApp((s) => s.session);
  const dbId = useApp((s) => s.dbId);

  const [istatistik, setIstatistik] = useState<PartiIstatistik | null>(null);
  useEffect(() => {
    if (hangi !== "parti") return;
    let acik = true;
    partiIstatistiklerim(dbId)
      .then((r) => { if (acik) setIstatistik(r); })
      .catch(() => {});
    return () => { acik = false; };
  }, [hangi, dbId]);

  const favori = platformBul(istatistik?.favoriPlatform)?.ad ?? "—";

  return (
    <View style={styles.kok}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">
            {t(hangi === "parti" ? "profil.partiKart" : "profil.hesapKart")}
          </Txt>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
          {hangi === "hesap" ? (
            <>
              <Kart simge="trophy" etiket={t("profil.seviye")} deger={`Lv ${userLevel}`} />
              <Kart simge="cal" etiket={t("profil.kayitTarihi")} deger={tarihYaz(session?.user?.created_at, dilKodu)} />
              <Kart
                simge="idcard"
                etiket={t("profil.hesap")}
                deger={session ? t("profil.dogrulanmis") : t("profil.misafir")}
              />
              <DilSecici bicim="kart" />
            </>
          ) : (
            <>
              <Kart simge="evStar" etiket={t("profil.favoriPlatform")} deger={favori} />
              <Kart simge="bars" etiket={t("profil.toplamSure")} deger={sureYaz(istatistik?.toplamSaniye ?? null)} />
              <Kart simge="flame" etiket={t("profil.buHafta")} deger={sureYaz(istatistik?.buHaftaSaniye ?? null)} />
              <Kart simge="bolt" etiket={t("profil.enUzunOturum")} deger={sureYaz(istatistik?.enUzunSaniye ?? null)} />
              <Kart simge="minimize" etiket={t("profil.ortalamaOturum")} deger={sureYaz(istatistik?.ortalamaSaniye ?? null)} />
              <Kart simge="evParty" etiket={t("profil.oturumSayisi")} deger={istatistik ? String(istatistik.oturumSayisi) : "—"} />
              <Kart simge="users" etiket={t("profil.farkliOda")} deger={istatistik ? String(istatistik.farkliOda) : "—"} />
              <Kart simge="eye" etiket={t("profil.enAktifSaat")} deger={saatAraligiYaz(istatistik?.enAktifSaat ?? null)} />
              <Kart simge="pin" etiket={t("profil.sonOturum")} deger={gunYaz(istatistik?.sonOturum ?? null)} />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  kart: {
    flexDirection: "row", alignItems: "center", gap: 11,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 13,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  simge: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
});
