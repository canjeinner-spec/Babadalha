import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ModalKok } from "@/components/ModalKok";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { getPublicProfileById, type PublicProfile } from "@/data/remote/profileRepo";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { rolAdi, type PartiRol } from "@/parti/yetki";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

const SURE = 260;

export type KartKisisi = {
  anahtar: string;
  ad: string;
  kullaniciAdi?: string | null;
  foto?: string;
  dbId?: number | null;
  rol?: PartiRol;
  sahip?: boolean;
  mikrofonIzni?: boolean;
  yayinda?: boolean;
  sohbetKapali?: boolean;
  ozelId?: string | null;
  ozelIdTip?: "premium" | "kapsul" | null;
  ozelIdTema?: string | null;
};

function sayiYaz(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

function Kutucuk({ deger, etiket, vurgu }: { deger: string; etiket: string; vurgu?: boolean }) {
  return (
    <View style={styles.kutucuk}>
      <Txt weight="displayBold" size={18} color={vurgu ? C.gold2 : "#fff"} numberOfLines={1}>{deger}</Txt>
      <Txt weight="extrabold" size={10} color={C.dim2} style={{ letterSpacing: 0.9, marginTop: 4 }}>
        {etiket}
      </Txt>
    </View>
  );
}

function Eylem({ simge, etiket, altYazi, renk, onBas }: {
  simge: IconName;
  etiket: string;
  altYazi?: string;
  renk?: string;
  onBas: () => void;
}) {
  return (
    <Pressable style={styles.eylem} onPress={onBas}>
      <View style={[styles.eylemSimge, !!renk && { backgroundColor: renk + "1a", borderColor: renk + "3d" }]}>
        <Icon name={simge} size={17} sw={2} color={renk ?? C.gold2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="bold" size={14} color={renk ?? "#fff"}>{etiket}</Txt>
        {!!altYazi && <Txt size={11.5} color={C.dim} style={{ marginTop: 2 }}>{altYazi}</Txt>}
      </View>
      <Icon name="chev" size={17} sw={2.2} color={C.dim2} />
    </Pressable>
  );
}

export function KullaniciKarti({ kisi, onKapat, onProfil, onEngelle, onRaporla, engelli }: {
  kisi: KartKisisi | null;
  onKapat: () => void;
  onProfil?: (kisi: KartKisisi) => void;
  onEngelle?: (kisi: KartKisisi) => void;
  onRaporla?: (kisi: KartKisisi) => void;
  engelli?: boolean;
}) {
  const t = useCeviri();
  const insets = useSafeAreaInsets();
  const [profil, setProfil] = useState<PublicProfile | null>(null);
  const [gorunen, setGorunen] = useState<KartKisisi | null>(null);
  const k = useSharedValue(1);

  const dbId = kisi?.dbId ?? null;
  const [sonId, setSonId] = useState<number | null>(null);
  if (dbId !== sonId) {
    setSonId(dbId);
    if (profil) setProfil(null);
  }
  if (kisi && kisi !== gorunen) setGorunen(kisi);

  useEffect(() => {
    if (kisi) {
      k.value = withTiming(0, { duration: SURE, easing: Easing.out(Easing.cubic) });
      return;
    }
    k.value = withTiming(1, { duration: SURE, easing: Easing.in(Easing.cubic) }, (bitti) => {
      if (bitti) runOnJS(setGorunen)(null);
    });
  }, [kisi, k]);

  useEffect(() => {
    if (!dbId) return;
    let acik = true;
    getPublicProfileById(dbId)
      .then((p) => { if (acik) setProfil(p); })
      .catch(() => {});
    return () => { acik = false; };
  }, [dbId]);

  const sayfaStil = useAnimatedStyle(() => ({
    transform: [{ translateY: k.value * 640 }],
    opacity: 1 - k.value * 0.4,
  }));
  const perdeStil = useAnimatedStyle(() => ({ opacity: 1 - k.value }));

  if (!gorunen) return null;

  const g = gorunen;
  const rol: PartiRol = g.rol ?? (g.sahip ? "sahip" : "uye");
  const tip = g.ozelIdTip ?? profil?.ozel_id_tip ?? null;
  const tema = g.ozelIdTema ?? profil?.ozel_id_tema ?? null;
  const kullaniciAdi = (g.kullaniciAdi ?? profil?.kullanici_adi ?? "").trim();
  const konum = [profil?.sehir, profil?.ulke].filter(Boolean).join(", ");


  return (
    <Modal visible transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={onKapat}>
      <ModalKok>
        <View style={StyleSheet.absoluteFill}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.perde, perdeStil]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} />
          </Animated.View>

          <Animated.View style={[styles.sayfa, { paddingBottom: insets.bottom + 18 }, sayfaStil]}>
            <Gradient
              colors={["rgba(232,179,65,.1)", "rgba(20,16,10,0)"]}
              deg={180}
              style={styles.isik}
              pointerEvents="none"
            />
            <View style={styles.tutamak} />

            <Pressable style={styles.kapatDugmesi} onPress={onKapat} hitSlop={10}>
              <Icon name="x" size={19} sw={2.4} color="rgba(255,255,255,.75)" />
            </Pressable>

            <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
              <View style={styles.yuz}>
                <Portrait name={g.ad} size={96} photo={g.foto ?? profil?.profil_resmi ?? undefined} halkasiz />
                {(g.sahip || rol === "sahip") && (
                  <View style={styles.tac}>
                    <Icon name="crown" size={15} color="#241A05" fill="#241A05" />
                  </View>
                )}
                <View style={[styles.mikRozet, g.yayinda && styles.mikAcik]}>
                  <Icon name={g.mikrofonIzni === false ? "micOff" : "mic"} size={13} sw={2.2} color={g.yayinda ? "#241A05" : "rgba(255,255,255,.7)"} />
                </View>
              </View>

              <View style={{ alignItems: "center", marginTop: 14, gap: 6 }}>
                <RenkliAd ad={g.ad} tip={tip} tema={tema} size={21} weight="displayBold" renk="#fff" />
                {!!kullaniciAdi && <Txt size={13} color={C.dim}>@{kullaniciAdi}</Txt>}
              </View>

              <View style={styles.serit}>
                <Kutucuk deger={profil?.seviye_id != null ? String(profil.seviye_id) : "—"} etiket={t("kart.seviyeKisa")} />
                <View style={styles.ayirac} />
                <Kutucuk deger={profil ? sayiYaz(profil.deneyim_puani) : "—"} etiket={t("kart.deneyim")} />
                <View style={styles.ayirac} />
                <Kutucuk deger={rolAdi(rol)} etiket={t("kart.rolKisa")} vurgu />
              </View>

              {!!konum && (
                <View style={styles.konum}>
                  <Icon name="pin" size={14} sw={2} color={C.dim2} />
                  <Txt size={12.5} color={C.dim}>{konum}</Txt>
                </View>
              )}

              {!!profil && (
                <Txt size={13} color={profil.biyografi ? C.dim : C.dim2} align="center" lh={1.5} style={styles.biyografi}>
                  {profil.biyografi || t("kart.biyografiYok")}
                </Txt>
              )}

              <View style={styles.eylemler}>
                <Eylem
                  simge="user"
                  etiket={t("kart.profilineGit")}
                  altYazi={t("kart.profilineGitAlt")}
                  onBas={() => { haptic.select(); onKapat(); onProfil?.(g); }}
                />
                {!!onEngelle && (
                  <Eylem
                    simge="blockuser"
                    etiket={t(engelli ? "kisi.engeliKaldir" : "kisi.engelle")}
                    renk={C.red}
                    onBas={() => { haptic.select(); onKapat(); onEngelle(g); }}
                  />
                )}
                {!!onRaporla && (
                  <Eylem
                    simge="flag"
                    etiket={t("kisi.raporla")}
                    renk={C.red}
                    onBas={() => { haptic.select(); onKapat(); onRaporla(g); }}
                  />
                )}
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </ModalKok>
    </Modal>
  );
}

const styles = StyleSheet.create({
  perde: { backgroundColor: "rgba(3,3,8,.66)" },
  sayfa: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    maxHeight: "88%",
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    backgroundColor: "#14100A",
    borderTopWidth: 1, borderTopColor: "rgba(232,179,65,.2)",
    overflow: "hidden",
  },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 190 },
  tutamak: {
    width: 40, height: 4, borderRadius: 2, alignSelf: "center", marginTop: 10,
    backgroundColor: "rgba(255,255,255,.18)",
  },
  kapatDugmesi: {
    position: "absolute", left: 16, top: 16, zIndex: 2,
    width: 34, height: 34, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.07)",
    borderWidth: 1, borderColor: "rgba(255,255,255,.1)",
  },
  govde: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 6 },
  yuz: { alignSelf: "center" },
  tac: {
    position: "absolute", top: -6, right: -4,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.gold2, borderWidth: 2.5, borderColor: "#14100A",
  },
  mikRozet: {
    position: "absolute", bottom: 0, right: -2,
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#221A10", borderWidth: 2.5, borderColor: "#14100A",
  },
  mikAcik: { backgroundColor: "#4ADE80" },
  serit: {
    flexDirection: "row", alignItems: "center", marginTop: 20,
    borderRadius: 18, paddingVertical: 15,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kutucuk: { flex: 1, alignItems: "center", paddingHorizontal: 6 },
  ayirac: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,.09)" },
  konum: { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 14 },
  biyografi: { marginTop: 12, paddingHorizontal: 6 },
  eylemler: { marginTop: 20, gap: 9 },
  eylem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 13,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  eylemSimge: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
});
