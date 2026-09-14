import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CenterModal } from "@/components/CenterModal";
import { Jeton, JetonYigini } from "@/components/JetonGorseli";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import {
  GUNLUK_HEDIYE, JETON_DAKIKA, PREMIUM_DOLUM, REKLAM_ODULU, jetonSaati, useJeton,
} from "@/lib/jeton";
import { odulluReklamGoster } from "@/lib/reklam";
import { basariUyar, hataUyar, uyar } from "@/lib/uyari";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

function saatYaz(saniye: number): string {
  const dakika = Math.floor(saniye / 60);
  const kalanSaniye = saniye % 60;
  return `${String(dakika).padStart(2, "0")}:${String(kalanSaniye).padStart(2, "0")}`;
}

function Fayda({ simge, etiket }: { simge: IconName; etiket: string }) {
  return (
    <View style={styles.fayda}>
      <View style={styles.faydaSimge}>
        <Icon name={simge} size={17} sw={2} color={C.gold2} />
      </View>
      <Txt size={11.5} color="rgba(255,255,255,.8)" align="center">{etiket}</Txt>
    </View>
  );
}

export default function Jetonlar() {
  const t = useCeviri();
  const router = useRouter();
  const premiumHak = useApp((s) => s.premiumHak);

  const bakiye = useJeton((s) => s.bakiye);
  const hazir = useJeton((s) => s.hazir);
  const yukle = useJeton((s) => s.yukle);
  const kazan = useJeton((s) => s.kazan);
  const hediyeAl = useJeton((s) => s.hediyeAl);
  const hediyeAlinabilir = useJeton((s) => s.hediyeAlinabilir);
  const premiumDolumuAl = useJeton((s) => s.premiumDolumuAl);
  const kalanSaniye = useJeton((s) => s.kalanSaniye);

  const [reklamda, setReklamda] = useState(false);
  const [yardim, setYardim] = useState(false);
  const [kalan, setKalan] = useState(0);

  useEffect(() => {
    if (!hazir) yukle();
  }, [hazir, yukle]);

  useEffect(() => {
    const z = setInterval(() => setKalan(kalanSaniye()), 1000);
    return () => clearInterval(z);
  }, [kalanSaniye]);

  const hediyeVar = hazir && hediyeAlinabilir();

  const reklamBas = async () => {
    if (reklamda) return;
    haptic.select();
    setReklamda(true);
    const sonuc = await odulluReklamGoster();
    setReklamda(false);
    if (sonuc !== "odul") {
      hataUyar(t("jeton.reklamOlmadi"));
      return;
    }
    await kazan(REKLAM_ODULU);
    basariUyar(t("jeton.kazanildi", REKLAM_ODULU));
  };

  const hediyeBas = async () => {
    haptic.select();
    if (await hediyeAl()) basariUyar(t("jeton.kazanildi", GUNLUK_HEDIYE));
    else uyar(t("jeton.hediyeAlindi"));
  };

  const dolumBas = async () => {
    haptic.select();
    const eklenen = await premiumDolumuAl();
    if (eklenen > 0) basariUyar(t("jeton.dolumAlindi", PREMIUM_DOLUM));
    else uyar(t("jeton.dolumHazirDegil"));
  };

  return (
    <View style={styles.kok}>
      <Gradient
        colors={["rgba(232,179,65,.12)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.yuvarlak}>
            <Icon name="back" size={20} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("jeton.baslik")}</Txt>
          <Pressable onPress={() => { haptic.select(); setYardim(true); }} hitSlop={10} style={styles.yuvarlak}>
            <Icon name="warn" size={19} sw={2.2} color="#fff" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
          <JetonYigini />

          <View style={styles.bakiyeSatiri}>
            <Jeton boyut={38} />
            <Txt weight="displayBold" size={44} color="#fff">{String(bakiye)}</Txt>
          </View>

          <Txt weight="extrabold" size={15} color={C.gold2} align="center" style={{ marginTop: 6 }}>
            {t("jeton.saat", jetonSaati(bakiye))}
          </Txt>
          <Txt size={13} color={C.dim} align="center" style={{ marginTop: 6 }}>
            {t("jeton.orani", JETON_DAKIKA)}
          </Txt>

          {kalan > 0 && (
            <View style={styles.sayac}>
              <Icon name="bolt" size={14} sw={2.2} color={C.green} />
              <Txt weight="extrabold" size={12.5} color={C.green}>{t("jeton.kalanSure", saatYaz(kalan))}</Txt>
            </View>
          )}

          <View style={styles.kart}>
            <View style={styles.kartSimge}>
              <Icon name="eye" size={19} sw={2} color={C.gold2} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="extrabold" size={14.5} color={C.gold2}>{t("jeton.reklamBaslik", REKLAM_ODULU)}</Txt>
              <Txt size={12.5} color={C.dim} lh={1.45} style={{ marginTop: 5 }}>{t("jeton.reklamMetin")}</Txt>
            </View>
            <Pressable style={[styles.dugme, reklamda && { opacity: 0.6 }]} onPress={reklamBas} disabled={reklamda}>
              {reklamda
                ? <ActivityIndicator color="#1a1206" size="small" />
                : <Txt weight="extrabold" size={12.5} color="#1a1206">{t("jeton.reklamDugme")}</Txt>}
            </Pressable>
          </View>

          {!premiumHak && (
            <View style={styles.kart}>
              <View style={styles.kartSimge}>
                <Icon name="gift" size={19} sw={2} color={C.gold2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="extrabold" size={14.5} color="#fff">{t("jeton.hediyeBaslik")}</Txt>
                <Txt size={12.5} color={C.dim} lh={1.45} style={{ marginTop: 5 }}>
                  {t("jeton.hediyeMetin", GUNLUK_HEDIYE)}
                </Txt>
              </View>
              <Pressable
                style={[styles.dugme, !hediyeVar && styles.dugmeSonuk]}
                onPress={hediyeBas}
                disabled={!hediyeVar}
              >
                <Txt weight="extrabold" size={12.5} color={hediyeVar ? "#1a1206" : C.dim}>
                  {t("jeton.hediyeDugme")}
                </Txt>
              </Pressable>
            </View>
          )}

          <View style={styles.premiumKart}>
            <View style={styles.premiumBaslik}>
              <Icon name="evDiamond" size={19} sw={2} color={C.gold2} />
              <Txt weight="displayBold" size={16} color="#fff" style={{ flex: 1 }}>
                {t("jeton.premiumBaslik")}
              </Txt>
            </View>

            <Pressable style={styles.dolumSatiri} onPress={premiumHak ? dolumBas : undefined}>
              <View style={styles.dolumSimge}>
                <Icon name="bolt" size={18} sw={2} color={C.gold2} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="extrabold" size={13.5} color="#fff">{t("jeton.premiumDolum", PREMIUM_DOLUM)}</Txt>
                <Txt size={12} color={C.dim} lh={1.4} style={{ marginTop: 4 }}>{t("jeton.premiumDolumAlt")}</Txt>
              </View>
              <View style={styles.dolumRozet}>
                <Txt weight="extrabold" size={12.5} color={C.gold2}>{`${bakiye}/${PREMIUM_DOLUM}`}</Txt>
              </View>
            </Pressable>

            <View style={styles.faydalar}>
              <Fayda simge="ban" etiket={t("jeton.premiumReklamsiz")} />
              <View style={styles.faydaAyirac} />
              <Fayda simge="bolt" etiket={t("jeton.premiumDolumKisa")} />
              <View style={styles.faydaAyirac} />
              <Fayda simge="gift" etiket={t("jeton.premiumFazlasi")} />
            </View>

            {!premiumHak && (
              <>
                <Pressable
                  style={styles.premiumDugme}
                  onPress={() => { haptic.select(); router.push("/premium"); }}
                >
                  <Txt weight="displayBold" size={15} color="#1a1206">{t("jeton.premiumDugme")}</Txt>
                </Pressable>
                <Txt size={11.5} color={C.dim2} align="center" style={{ marginTop: 9 }}>
                  {t("jeton.iptalNotu")}
                </Txt>
              </>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      <CenterModal visible={yardim} onClose={() => setYardim(false)}>
        <View style={styles.yardimKart}>
          <Txt weight="displayBold" size={16} color="#fff" align="center">{t("jeton.nasilBaslik")}</Txt>
          <Txt size={13} color={C.dim} align="center" lh={1.5} style={{ marginTop: 10 }}>
            {t("jeton.nasilMetin", JETON_DAKIKA)}
          </Txt>
          <Pressable style={styles.yardimKapat} onPress={() => setYardim(false)}>
            <Txt weight="extrabold" size={13.5} color="#fff">{t("genel.tamam")}</Txt>
          </Pressable>
        </View>
      </CenterModal>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", left: 0, right: 0, top: 0, height: 300 },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10,
  },
  yuvarlak: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  bakiyeSatiri: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 16 },
  sayac: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7,
    alignSelf: "center", marginTop: 14, paddingHorizontal: 13, paddingVertical: 8, borderRadius: 13,
    backgroundColor: "rgba(52,211,153,.08)", borderWidth: 1, borderColor: "rgba(52,211,153,.22)",
  },
  kart: {
    flexDirection: "row", alignItems: "center", gap: 12,
    marginTop: 22, padding: 14, borderRadius: 18,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kartSimge: {
    width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)", borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
  dugme: {
    minWidth: 92, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 14, paddingVertical: 11, borderRadius: 13, backgroundColor: C.gold2,
  },
  dugmeSonuk: { backgroundColor: "rgba(255,255,255,.06)" },
  premiumKart: {
    marginTop: 22, padding: 16, borderRadius: 20,
    backgroundColor: "rgba(232,179,65,.05)", borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  premiumBaslik: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  dolumSatiri: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 13, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,.24)", borderWidth: 1, borderColor: C.line,
  },
  dolumSimge: {
    width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.1)", borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
  dolumRozet: {
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 11,
    backgroundColor: "rgba(232,179,65,.1)", borderWidth: 1, borderColor: "rgba(232,179,65,.26)",
  },
  faydalar: { flexDirection: "row", alignItems: "center", marginTop: 16, marginBottom: 4 },
  fayda: { flex: 1, alignItems: "center", gap: 8 },
  faydaSimge: {
    width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.08)", borderWidth: 1, borderColor: "rgba(232,179,65,.18)",
  },
  faydaAyirac: { width: 1, height: 34, backgroundColor: "rgba(232,179,65,.16)" },
  premiumDugme: {
    alignItems: "center", justifyContent: "center",
    marginTop: 16, paddingVertical: 15, borderRadius: 16, backgroundColor: C.gold2,
  },
  yardimKart: {
    backgroundColor: C.card, borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: C.line,
  },
  yardimKapat: {
    alignItems: "center", justifyContent: "center", marginTop: 18, paddingVertical: 13,
    borderRadius: 13, backgroundColor: "rgba(255,255,255,.06)",
  },
});
