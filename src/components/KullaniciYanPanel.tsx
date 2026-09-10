import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { Platform, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { atabilirMi, rolAdi, rolVerebilirMi, yetkiVar, type PartiRol } from "@/parti/yetki";

export type YanPanelKisisi = {
  anahtar: string;
  ad: string;
  foto?: string;
  sahip?: boolean;
  rol?: PartiRol;
  mikrofonIzni?: boolean;
  yayinda?: boolean;
  ozelIdTip?: "premium" | "kapsul" | null;
  ozelIdTema?: string | null;
};

export type YanPanelYetkileri = {
  benimRol: PartiRol;
  benimAnahtar: string;
  onYetki: (kisi: YanPanelKisisi, yeniRol: PartiRol) => void;
  onAt: (kisi: YanPanelKisisi) => void;
  onMikrofon: (kisi: YanPanelKisisi, acik: boolean) => void;
  otomatikDevir?: boolean;
  onOtomatikDevir?: (acik: boolean) => void;
};

const SURE = 280;
const ANDROID = Platform.OS === "android";
const METIN = "#17141F";
const ALTIN = "#B7791F";

export function KullaniciYanPanel({ acik, kisiler, onKapat, ustPay = 0, yetkiler }: {
  acik: boolean;
  kisiler: YanPanelKisisi[];
  onKapat: () => void;
  ustPay?: number;
  yetkiler?: YanPanelYetkileri;
}) {
  const [secili, setSecili] = useState<YanPanelKisisi | null>(null);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const genislik = Math.min(280, Math.round(width * 0.66));
  const ustBosluk = ustPay > 0 ? 14 : insets.top + 14;
  const k = useSharedValue(1);
  const [sonAcik, setSonAcik] = useState(acik);
  const [kapaniyor, setKapaniyor] = useState(false);
  if (acik !== sonAcik) {
    setSonAcik(acik);
    if (!acik) setKapaniyor(true);
  }
  const gorunur = acik || kapaniyor;

  useEffect(() => {
    if (acik) {
      k.value = withTiming(0, { duration: SURE, easing: Easing.out(Easing.cubic) });
      return;
    }
    k.value = withTiming(1, { duration: SURE, easing: Easing.in(Easing.cubic) }, (bitti) => {
      if (bitti) runOnJS(setKapaniyor)(false);
    });
  }, [acik, k]);

  const panelStil = useAnimatedStyle(() => ({ transform: [{ translateX: k.value * genislik }] }));
  const perdeStil = useAnimatedStyle(() => ({ opacity: 1 - k.value }));

  if (!gorunur) return null;

  const sahipler = kisiler.filter((x) => x.sahip);
  const digerleri = kisiler.filter((x) => !x.sahip);

  return (
    <View style={[StyleSheet.absoluteFill, { top: ustPay }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.perde, perdeStil]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} />
      </Animated.View>

      <Animated.View style={[styles.panel, { width: genislik, paddingTop: ustBosluk, paddingBottom: insets.bottom + 14 }, panelStil]}>
        {!ANDROID && <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />}
        <View style={[StyleSheet.absoluteFill, ANDROID ? styles.camAndroid : styles.cam]} pointerEvents="none" />
        <View style={styles.parilti} pointerEvents="none" />

        <View style={styles.baslik}>
          <Txt weight="displayBold" size={17} color={METIN}>Odadakiler</Txt>
          <View style={styles.sayi}>
            <Txt weight="extrabold" size={11} color={METIN}>{kisiler.length}</Txt>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onKapat} hitSlop={10}>
            <Icon name="x" size={22} sw={2.2} color={METIN} />
          </Pressable>
        </View>

        {yetkiler?.onOtomatikDevir && (
          <Pressable
            style={styles.devirSatiri}
            onPress={() => yetkiler.onOtomatikDevir?.(!yetkiler.otomatikDevir)}
          >
            <View style={{ flex: 1 }}>
              <Txt weight="extrabold" size={12.5} color={METIN}>Sahiplik devri</Txt>
              <Txt size={10.5} color="rgba(23,20,31,.6)" style={{ marginTop: 2 }}>
                {yetkiler.otomatikDevir
                  ? "Çıkarsan parti odadaki birine geçer"
                  : "Çıkarsan parti kimseye geçmez"}
              </Txt>
            </View>
            <View style={[styles.anahtar, yetkiler.otomatikDevir && styles.anahtarAcik]}>
              <View style={[styles.topuz, yetkiler.otomatikDevir && styles.topuzAcik]} />
            </View>
          </Pressable>
        )}

        <ScrollView contentContainerStyle={styles.liste} showsVerticalScrollIndicator={false}>
          {sahipler.map((x) => <Satir key={x.anahtar} kisi={x} onBasili={yetkiler ? () => setSecili(x) : undefined} />)}
          {sahipler.length > 0 && digerleri.length > 0 && <View style={styles.ayrac} />}
          {digerleri.map((x) => <Satir key={x.anahtar} kisi={x} onBasili={yetkiler ? () => setSecili(x) : undefined} />)}
        </ScrollView>
      </Animated.View>

      {yetkiler && secili && (
        <YetkiMenusu
          kisi={secili}
          yetkiler={yetkiler}
          onKapat={() => setSecili(null)}
        />
      )}
    </View>
  );
}

function YetkiMenusu({ kisi, yetkiler, onKapat }: {
  kisi: YanPanelKisisi;
  yetkiler: YanPanelYetkileri;
  onKapat: () => void;
}) {
  const hedefRol: PartiRol = kisi.rol ?? (kisi.sahip ? "sahip" : "uye");
  const kendim = kisi.anahtar === yetkiler.benimAnahtar;
  const rolVerilir = !kendim && rolVerebilirMi(yetkiler.benimRol, hedefRol);
  const atilir = !kendim && atabilirMi(yetkiler.benimRol, hedefRol);
  const mikVar = !kendim && yetkiVar(yetkiler.benimRol, "mikrofonAyar");
  const hicbiri = !rolVerilir && !atilir && !mikVar;

  const sec = (isi: () => void) => () => { isi(); onKapat(); };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onKapat} />
      <View style={styles.menuSarmal} pointerEvents="box-none">
        <View style={styles.menu}>
          <Txt weight="displayBold" size={15} color={METIN}>{kisi.ad}</Txt>
          <Txt weight="semibold" size={11} color="rgba(23,20,31,.55)" style={{ marginTop: 2, marginBottom: 10 }}>
            {rolAdi(hedefRol)}
          </Txt>

          {rolVerilir && hedefRol !== "yardimci" && (
            <Pressable style={styles.menuOge} onPress={sec(() => yetkiler.onYetki(kisi, "yardimci"))}>
              <Txt weight="extrabold" size={14} color={METIN}>Parti Yardımcısı yap</Txt>
            </Pressable>
          )}
          {rolVerilir && hedefRol === "yardimci" && (
            <Pressable style={styles.menuOge} onPress={sec(() => yetkiler.onYetki(kisi, "uye"))}>
              <Txt weight="extrabold" size={14} color={METIN}>Yardımcılığı al</Txt>
            </Pressable>
          )}
          {mikVar && (
            <Pressable style={styles.menuOge} onPress={sec(() => yetkiler.onMikrofon(kisi, !kisi.mikrofonIzni))}>
              <Txt weight="extrabold" size={14} color={METIN}>
                {kisi.mikrofonIzni ? "Mikrofonu kapat" : "Mikrofonu aç"}
              </Txt>
            </Pressable>
          )}
          {atilir && (
            <Pressable style={styles.menuOge} onPress={sec(() => yetkiler.onAt(kisi))}>
              <Txt weight="extrabold" size={14} color="#C0392B">Odadan at</Txt>
            </Pressable>
          )}
          {hicbiri && (
            <Txt weight="semibold" size={13} color="rgba(23,20,31,.55)">Bu kişi için yetkin yok</Txt>
          )}
        </View>
      </View>
    </View>
  );
}

function Satir({ kisi, onBasili }: { kisi: YanPanelKisisi; onBasili?: () => void }) {
  return (
    <Pressable style={styles.satir} onLongPress={onBasili} delayLongPress={280} disabled={!onBasili}>
      <View>
        <Portrait name={kisi.ad} size={44} photo={kisi.foto} halkasiz />
        {kisi.sahip && (
          <View style={styles.tac}>
            <Icon name="crown" size={14} color={ALTIN} fill={ALTIN} />
          </View>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <RenkliAd ad={kisi.ad} tip={kisi.ozelIdTip} tema={kisi.ozelIdTema} size={15} weight="extrabold" renk={METIN} />
        {kisi.rol === "sahip" || kisi.sahip ? (
          <Txt weight="semibold" size={11} color={ALTIN} style={{ marginTop: 2 }}>Parti Sahibi</Txt>
        ) : kisi.rol === "yardimci" ? (
          <Txt weight="semibold" size={11} color="#2C7A7B" style={{ marginTop: 2 }}>Parti Yardımcısı</Txt>
        ) : null}
      </View>
      {kisi.yayinda && <Icon name="mic" size={18} sw={2} color="#2C7A7B" />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  devirSatiri: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 14, marginBottom: 8,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, backgroundColor: "rgba(23,20,31,.06)",
  },
  anahtar: {
    width: 38, height: 22, borderRadius: 11, padding: 3,
    justifyContent: "center", backgroundColor: "rgba(23,20,31,.18)",
  },
  anahtarAcik: { backgroundColor: ALTIN },
  topuz: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff" },
  topuzAcik: { alignSelf: "flex-end" },
  perde: { backgroundColor: "rgba(0,0,0,.35)" },
  menuSarmal: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center" },
  menu: {
    minWidth: 230, maxWidth: 300, paddingHorizontal: 18, paddingVertical: 16,
    borderRadius: 22, backgroundColor: "#F4F1F8",
  },
  menuOge: { paddingVertical: 11 },
  panel: {
    position: "absolute", top: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 30, borderBottomLeftRadius: 30,
    overflow: "hidden",
    ...(ANDROID
      ? { elevation: 16, backgroundColor: "rgba(244,242,248,.97)" }
      : {
          backgroundColor: "rgba(255,255,255,.18)",
          borderLeftWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,.7)",
          shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: -8, height: 0 },
        }),
  },
  cam: { backgroundColor: "rgba(255,255,255,.58)" },
  camAndroid: { backgroundColor: "transparent" },
  parilti: { position: "absolute", top: 0, left: 24, right: 24, height: 1, backgroundColor: "rgba(255,255,255,.9)" },
  baslik: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingBottom: 10 },
  sayi: {
    minWidth: 24, height: 22, borderRadius: 11, paddingHorizontal: 7, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(23,20,31,.1)",
  },
  liste: { paddingHorizontal: 8, paddingTop: 2, gap: 2 },
  satir: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 7, paddingHorizontal: 6, borderRadius: 16 },
  ayrac: { height: 1, backgroundColor: "rgba(23,20,31,.1)", marginVertical: 6, marginHorizontal: 6 },
  tac: { position: "absolute", top: -9, left: -4, transform: [{ rotate: "-22deg" }] },
});
