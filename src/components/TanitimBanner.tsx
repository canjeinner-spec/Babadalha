import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  type NativeScrollEvent, type NativeSyntheticEvent,
  Pressable, ScrollView, StyleSheet, View,
} from "react-native";

import { Txt } from "@/components/Txt";
import { useCeviri } from "@/lib/ceviri";
import { haptic } from "@/lib/haptics";
import { Gradient } from "@/theme/Gradient";

const VURGU = "#F5CE6E";
const GECIS_MS = 6000;
const ELLE_BEKLEME = 7000;
const YUKSEKLIK = 96;

type Slayt = {
  anahtar: string;
  etiket: string;
  baslik: string;
  altYazi: string;
  renkler: [string, string];
};

const SLAYTLAR: Slayt[] = [
  {
    anahtar: "tanit",
    etiket: "banner.yeni",
    baslik: "banner.baslik",
    altYazi: "banner.altYazi",
    renkler: ["#2E1F45", "#171029"],
  },
  {
    anahtar: "gelisim",
    etiket: "banner.gelisimEtiket",
    baslik: "banner.gelisimBaslik",
    altYazi: "banner.gelisimAltYazi",
    renkler: ["#1C3040", "#101C26"],
  },
  {
    anahtar: "premium",
    etiket: "banner.premiumEtiket",
    baslik: "banner.premiumBaslik",
    altYazi: "banner.premiumAltYazi",
    renkler: ["#3A2A10", "#1E1608"],
  },
];

export function TanitimBanner() {
  const t = useCeviri();
  const router = useRouter();
  const [genislik, setGenislik] = useState(0);
  const kaydirRef = useRef<ScrollView>(null);
  const siraRef = useRef(0);
  const elleRef = useRef(0);

  useEffect(() => {
    if (!genislik) return;
    const z = setInterval(() => {
      if (Date.now() - elleRef.current < ELLE_BEKLEME) return;
      const yeni = (siraRef.current + 1) % SLAYTLAR.length;
      siraRef.current = yeni;
      kaydirRef.current?.scrollTo({ x: yeni * genislik, animated: true });
    }, GECIS_MS);
    return () => clearInterval(z);
  }, [genislik]);

  const kaydiBitti = (o: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!genislik) return;
    siraRef.current = Math.round(o.nativeEvent.contentOffset.x / genislik);
    elleRef.current = Date.now();
  };

  return (
    <View
      style={styles.banner}
      onLayout={(o) => setGenislik(Math.round(o.nativeEvent.layout.width))}
    >
      {genislik > 0 && (
      <ScrollView
        ref={kaydirRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => { elleRef.current = Date.now(); }}
        onMomentumScrollEnd={kaydiBitti}
      >
        {SLAYTLAR.map((slayt) => (
          <Pressable
            key={slayt.anahtar}
            style={{ width: genislik, height: YUKSEKLIK }}
            onPress={() => { haptic.select(); router.push("/duyuru"); }}
          >
            <Gradient colors={slayt.renkler} deg={125} style={StyleSheet.absoluteFill} />
            <View style={[styles.hale, { backgroundColor: VURGU + "26" }]} pointerEvents="none" />
            <Gradient
              colors={["rgba(255,255,255,.14)", "rgba(255,255,255,0)"]}
              deg={150}
              locations={[0, 0.55]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <View style={styles.icerik}>
              <View style={styles.amblem}>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={0}
                />
              </View>

              <View style={styles.yazilar}>
                <View style={styles.ustSatir}>
                  <Txt weight="bold" size={9} color={VURGU} style={{ letterSpacing: 2 }}>ARON PARTİ</Txt>
                  <View style={styles.etiket}>
                    <Txt weight="extrabold" size={7.5} color="#241A05" style={{ letterSpacing: 0.5 }}>
                      {t(slayt.etiket)}
                    </Txt>
                  </View>
                </View>

                <Txt weight="displayBold" size={16.5} color="#fff" numberOfLines={1} style={styles.baslik}>
                  {t(slayt.baslik)}
                </Txt>
                <Txt size={10.5} color="rgba(255,255,255,.78)" lh={1.35} numberOfLines={2} style={{ marginTop: 3 }}>
                  {t(slayt.altYazi)}
                </Txt>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    width: "100%",
    height: YUKSEKLIK,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.16)",
  },
  hale: { position: "absolute", right: -28, top: -34, width: 150, height: 150, borderRadius: 75 },
  icerik: { flex: 1, flexDirection: "row", alignItems: "center", gap: 13, paddingHorizontal: 16 },
  yazilar: { flex: 1, minWidth: 0, flexShrink: 1 },
  amblem: {
    width: 56, height: 56, borderRadius: 18, overflow: "hidden",
    borderWidth: 1, borderColor: "rgba(255,255,255,.2)",
  },
  ustSatir: { flexDirection: "row", alignItems: "center", gap: 7 },
  etiket: { paddingVertical: 1.5, paddingHorizontal: 6, borderRadius: 5, backgroundColor: VURGU },
  baslik: {
    marginTop: 3,
    textShadowColor: "rgba(0,0,0,.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
