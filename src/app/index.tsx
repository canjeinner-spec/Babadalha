import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AltCubuk, CUBUK_YUKSEKLIGI } from "@/components/AltCubuk";
import { AltinAmblem, type AltinAmblemAdi } from "@/components/AltinAmblem";
import { Portrait } from "@/components/Portrait";
import { Txt } from "@/components/Txt";
import { UstKaplama } from "@/components/UstKaplama";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { girisEkraniGecildi, karsilamaGoruldu, premiumGoruldu } from "@/lib/ilkAcilis";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";
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
          <View style={styles.duyuru}>
            <Gradient
              colors={["rgba(232,179,65,.16)", "rgba(232,179,65,.03)"]}
              deg={135}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.duyuruAmblem}>
              <AltinAmblem ad="parti" yedek="evParty" boyut={26} />
            </View>
            <Txt weight="displayBold" size={16.5} color="#fff" style={{ marginTop: 14 }}>
              {t("ana.duyuruBaslik")}
            </Txt>
            <Txt size={13} color="rgba(255,255,255,.72)" lh={1.55} style={{ marginTop: 7 }}>
              {t("ana.duyuruMetin")}
            </Txt>
          </View>

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            {t("ana.kisayolBaslik")}
          </Txt>

          <View style={{ gap: 10 }}>
            <Kisayol
              amblem="oynat"
              yedek="evParty"
              baslik={t("ana.kisayolKur")}
              altYazi={t("ana.kisayolKurAlt")}
              onBas={() => { haptic.select(); router.push("/parti-platform"); }}
            />
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
  duyuru: {
    borderRadius: 20, overflow: "hidden", padding: 18,
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
  duyuruAmblem: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.1)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  bolumBaslik: { marginTop: 24, marginBottom: 10, marginLeft: 4, letterSpacing: 1.1 },
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
