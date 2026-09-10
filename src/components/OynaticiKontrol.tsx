import { memo, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

const YOL_OYNAT = "M7 4l12 8-12 8V4z";
const YOL_DURAKLAT = "M8 5v14M16 5v14";
const YOL_GERI = "M11 17l-5-5 5-5M18 17l-5-5 5-5";
const YOL_ILERI = "M13 17l5-5-5-5M6 17l5-5-5-5";
const ATLAMA_SN = 10;
const GIZLENME_MS = 3200;

export function zamanYaz(sn: number): string {
  if (!Number.isFinite(sn) || sn < 0) sn = 0;
  const t = Math.floor(sn);
  const s = t % 60;
  const d = Math.floor(t / 60) % 60;
  const h = Math.floor(t / 3600);
  const iki = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${iki(d)}:${iki(s)}` : `${d}:${iki(s)}`;
}

export const OynaticiKontrol = memo(function OynaticiKontrol({
  konum, sure, oynuyor, onOynat, onDuraklat, onAtla,
}: {
  konum: number; sure: number; oynuyor: boolean;
  onOynat: () => void; onDuraklat: () => void; onAtla: (saniye: number) => void;
}) {
  const [acik, setAcik] = useState(true);
  const [genislik, setGenislik] = useState(0);
  const [surukleme, setSurukleme] = useState<number | null>(null);

  useEffect(() => {
    if (!acik || surukleme != null) return;
    const t = setTimeout(() => setAcik(false), GIZLENME_MS);
    return () => clearTimeout(t);
  }, [acik, surukleme, konum, oynuyor]);

  const gosterilen = surukleme ?? konum;
  const oran = sure > 0 ? Math.min(1, Math.max(0, gosterilen / sure)) : 0;

  const olculer = useRef({ genislik: 0, sure: 0, onAtla });
  useEffect(() => { olculer.current = { genislik, sure, onAtla }; }, [genislik, sure, onAtla]);

  const sur = useMemo(() => {
    let x0 = 0;
    const konumdan = (x: number) => {
      const { genislik: g, sure: s } = olculer.current;
      return g > 0 && s > 0 ? Math.min(s, Math.max(0, (x / g) * s)) : 0;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        x0 = e.nativeEvent.locationX;
        setSurukleme(konumdan(x0));
      },
      onPanResponderMove: (_e, g) => { setSurukleme(konumdan(x0 + g.dx)); },
      onPanResponderRelease: (_e, g) => {
        const hedef = konumdan(x0 + g.dx);
        setSurukleme(null);
        haptic.select();
        console.warn(`[kontrol] atla hedef=${hedef.toFixed(1)} x=${(x0 + g.dx).toFixed(0)}/${olculer.current.genislik} sure=${olculer.current.sure.toFixed(1)}`);
        olculer.current.onAtla(hedef);
      },
      onPanResponderTerminate: () => { setSurukleme(null); },
    });
  }, []);

  const atla = (fark: number) => {
    haptic.select();
    onAtla(Math.min(sure > 0 ? sure : Infinity, Math.max(0, konum + fark)));
    setAcik(true);
  };

  if (!acik) {
    return <Pressable style={StyleSheet.absoluteFill} onPress={() => setAcik(true)} />;
  }

  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.perde]} onPress={() => setAcik(false)}>
      <View style={styles.orta} pointerEvents="box-none">
        <Pressable onPress={() => atla(-ATLAMA_SN)} hitSlop={10} style={styles.yanDugme}>
          <Icon path={YOL_GERI} size={30} sw={2.4} color="#fff" />
          <Txt weight="extrabold" size={9.5} color="#fff" style={styles.yanYazi}>{ATLAMA_SN}</Txt>
        </Pressable>
        <Pressable
          onPress={() => { haptic.select(); (oynuyor ? onDuraklat : onOynat)(); setAcik(true); }}
          hitSlop={10}
          style={styles.anaDugme}
        >
          <Icon path={oynuyor ? YOL_DURAKLAT : YOL_OYNAT} size={30} sw={2.6} color="#0A0910" fill={oynuyor ? "none" : "#0A0910"} />
        </Pressable>
        <Pressable onPress={() => atla(ATLAMA_SN)} hitSlop={10} style={styles.yanDugme}>
          <Icon path={YOL_ILERI} size={30} sw={2.4} color="#fff" />
          <Txt weight="extrabold" size={9.5} color="#fff" style={styles.yanYazi}>{ATLAMA_SN}</Txt>
        </Pressable>
      </View>

      <View style={styles.alt} pointerEvents="box-none">
        <Txt weight="extrabold" size={11} color="#fff" style={styles.zaman}>{zamanYaz(gosterilen)}</Txt>
        <View
          style={styles.rayYuva}
          onLayout={(e: LayoutChangeEvent) => setGenislik(e.nativeEvent.layout.width)}
          {...sur.panHandlers}
        >
          <View style={styles.ray} pointerEvents="none">
            <View style={[styles.dolu, { width: `${oran * 100}%` }]} />
          </View>
          <View pointerEvents="none" style={[styles.tutamac, { left: Math.max(0, oran * genislik - 7) }, surukleme != null && styles.tutamacBuyuk]} />
        </View>
        <Txt weight="extrabold" size={11} color="rgba(255,255,255,.75)" style={styles.zaman}>{zamanYaz(sure)}</Txt>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  perde: { backgroundColor: "rgba(0,0,0,.28)", justifyContent: "center" },
  orta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 34 },
  yanDugme: { alignItems: "center", justifyContent: "center", width: 44, height: 44 },
  yanYazi: { position: "absolute", bottom: 2 },
  anaDugme: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  alt: { position: "absolute", left: 10, right: 10, bottom: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  zaman: { minWidth: 36, textAlign: "center" },
  rayYuva: { flex: 1, height: 28, justifyContent: "center" },
  ray: { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,.28)", overflow: "hidden" },
  dolu: { height: "100%", backgroundColor: C.gold2 },
  tutamac: { position: "absolute", width: 14, height: 14, borderRadius: 7, backgroundColor: C.gold2 },
  tutamacBuyuk: { width: 18, height: 18, borderRadius: 9, marginLeft: -2 },
});
