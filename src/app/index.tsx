import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AltCubuk, CUBUK_YUKSEKLIGI } from "@/components/AltCubuk";
import { AltinAmblem, type AltinAmblemAdi } from "@/components/AltinAmblem";
import { TanitimBanner } from "@/components/TanitimBanner";
import { Image } from "expo-image";
import { Portrait } from "@/components/Portrait";
import { Txt } from "@/components/Txt";
import { UstKaplama } from "@/components/UstKaplama";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { girisEkraniGecildi, karsilamaGoruldu, premiumGoruldu } from "@/lib/ilkAcilis";
import { PLATFORMLAR, platformKilitNotu } from "@/oda/platform";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { saydam } from "@/theme/renk";
import { TEMA_YAZI_GOLGESI, useTema } from "@/theme/tema";
import { Zemin } from "@/theme/Zemin";

function Kisayol({ amblem, yedek, baslik, altYazi, onBas }: {
  amblem: AltinAmblemAdi;
  yedek: IconName;
  baslik: string;
  altYazi: string;
  onBas: () => void;
}) {
  return (
    <Pressable style={styles.kisayol} onPress={onBas}>
      <View style={styles.kisayolSimge}>
        <AltinAmblem ad={amblem} yedek={yedek} boyut={24} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="extrabold" size={14.5} color="#fff">{baslik}</Txt>
        <Txt size={12} color="rgba(255,255,255,.6)" lh={1.4} style={{ marginTop: 3 }}>{altYazi}</Txt>
      </View>
      <Icon name="chev" size={18} sw={2.2} color={C.dim2} />
    </Pressable>
  );
}

const YOL_LINK = "M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71";

export default function AnaSayfa() {
  const t = useCeviri();
  const router = useRouter();
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const publicId = useApp((s) => s.publicId);
  const { ic, renk } = useTema();
  const temali = !!ic?.ustGorsel;
  const [bildirim, setBildirim] = useState("");

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

  useEffect(() => {
    if (!bildirim) return;
    const zamanlayici = setTimeout(() => setBildirim(""), 1600);
    return () => clearTimeout(zamanlayici);
  }, [bildirim]);

  const davetPaylas = useCallback(() => {
    haptic.select();
    Clipboard.setStringAsync(`https://aron.parti/@${publicId ?? ""}`).catch(() => {});
    setBildirim(t("ana.davetKopyalandi"));
  }, [publicId, t]);

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

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            {t("ana.katilBaslik")}
          </Txt>

          <Pressable
            style={styles.katil}
            onPress={() => { haptic.select(); router.push("/parti-dogrudan"); }}
          >
            <Icon path={YOL_LINK} size={19} sw={2} color={C.gold2} />
            <Txt size={13.5} color="rgba(255,255,255,.6)" style={{ flex: 1 }} numberOfLines={1}>
              {t("ana.katilIpucu")}
            </Txt>
            <View style={styles.katilOk}>
              <Icon name="chev" size={17} sw={2.4} color="#241A05" />
            </View>
          </Pressable>

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            {t("ana.platformBaslik")}
          </Txt>
          <Txt size={12} color="rgba(255,255,255,.5)" style={styles.bolumAlt}>
            {t("ana.platformAlt")}
          </Txt>

          <View style={styles.izgara}>
            {PLATFORMLAR.map((p) => {
              const kilit = platformKilitNotu(p.kod);
              return (
                <Pressable
                  key={p.kod}
                  disabled={!!kilit}
                  style={[
                    styles.hucre,
                    { backgroundColor: saydam(p.vurgu, 0.14), borderColor: saydam(p.vurgu, 0.3) },
                    !!kilit && styles.hucreKilitli,
                  ]}
                  onPress={() => {
                    haptic.select();
                    router.push({ pathname: "/parti-oda", params: { platform: p.kod } });
                  }}
                >
                  <Image source={p.logo} style={styles.hucreLogo} contentFit="contain" transition={0} />
                  {!!kilit && (
                    <Txt size={9.5} color={C.dim} align="center" style={styles.kilitNotu}>{kilit}</Txt>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            {t("ana.kisayolBaslik")}
          </Txt>

          <View style={{ gap: 10 }}>
            <Kisayol
              amblem="kapi"
              yedek="users"
              baslik={t("ana.kisayolKatil")}
              altYazi={t("ana.kisayolKatilAlt")}
              onBas={() => { haptic.select(); router.replace("/partiler"); }}
            />
            <Kisayol
              amblem="kisi-ekle"
              yedek="userAdd"
              baslik={t("ana.kisayolDavet")}
              altYazi={t("ana.kisayolDavetAlt")}
              onBas={davetPaylas}
            />
          </View>
        </ScrollView>
      </SafeAreaView>

      {bildirim !== "" && (
        <View style={[styles.bildirim, { bottom: CUBUK_YUKSEKLIGI + 16 }]}>
          <Txt weight="bold" size={12.5} color="#fff">{bildirim}</Txt>
        </View>
      )}

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
  katil: {
    flexDirection: "row", alignItems: "center", gap: 11,
    borderRadius: 16, paddingVertical: 12, paddingLeft: 15, paddingRight: 10,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  katilOk: {
    width: 34, height: 34, borderRadius: 12,
    alignItems: "center", justifyContent: "center", backgroundColor: C.gold2,
  },
  izgara: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  hucre: {
    width: "48.2%", aspectRatio: 1.9, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center", paddingHorizontal: 12,
  },
  hucreKilitli: { opacity: 0.42 },
  hucreLogo: { width: "78%", height: "52%" },
  kilitNotu: { marginTop: 5 },
  bolumBaslik: { marginTop: 24, marginBottom: 10, marginLeft: 4, letterSpacing: 1.1 },
  bolumAlt: { marginTop: -4, marginBottom: 12, marginLeft: 4 },
  kisayol: {
    flexDirection: "row", alignItems: "center", gap: 13,
    borderRadius: 18, paddingVertical: 14, paddingHorizontal: 15,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kisayolSimge: {
    width: 42, height: 42, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
  bildirim: {
    position: "absolute", alignSelf: "center",
    backgroundColor: "rgba(20,16,10,.95)", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(232,179,65,.25)",
  },
});
