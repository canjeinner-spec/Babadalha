import { memo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";

const YOL_OYNAT = "M7 4l12 8-12 8V4z";
const YOL_DURAKLAT = "M8 5v14M16 5v14";
const YOL_GERI = "M1.6 4.4v6h6M4.1 15a9 9 0 1 0 2.13-9.36L1.6 10";
const YOL_ILERI = "M22.4 4.4v6h-6M19.9 15a9 9 0 1 1-2.13-9.36L22.4 10";
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
  konum, sure, oynuyor, onOynat, onDuraklat, onAtla, sagDugmeler,
}: {
  konum: number; sure: number; oynuyor: boolean;
  onOynat: () => void; onDuraklat: () => void; onAtla: (saniye: number) => void;
  sagDugmeler?: ReactNode;
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
          <Icon path={YOL_GERI} size={26} sw={2.1} color="#fff" />
          <View style={styles.yanYaziKutu} pointerEvents="none">
            <Txt weight="extrabold" size={8} color="#fff">{ATLAMA_SN}</Txt>
          </View>
        </Pressable>
        <Pressable
          onPress={() => { haptic.select(); (oynuyor ? onDuraklat : onOynat)(); setAcik(true); }}
          hitSlop={10}
          style={styles.anaDugme}
        >
          <Icon path={oynuyor ? YOL_DURAKLAT : YOL_OYNAT} size={30} sw={2.6} color="#fff" fill={oynuyor ? "none" : "#fff"} />
        </Pressable>
        <Pressable onPress={() => atla(ATLAMA_SN)} hitSlop={10} style={styles.yanDugme}>
          <Icon path={YOL_ILERI} size={26} sw={2.1} color="#fff" />
          <View style={styles.yanYaziKutu} pointerEvents="none">
            <Txt weight="extrabold" size={8} color="#fff">{ATLAMA_SN}</Txt>
          </View>
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
        {sagDugmeler}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  perde: { backgroundColor: "rgba(0,0,0,.12)", justifyContent: "center" },
  orta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 34 },
  yanDugme: {
    alignItems: "center", justifyContent: "center", width: 40, height: 40,
    shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  yanYaziKutu: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", marginTop: 1.5 },
  anaDugme: {
    width: 50, height: 50, alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  alt: { position: "absolute", left: 10, right: 10, bottom: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  zaman: { minWidth: 36, textAlign: "center" },
  rayYuva: { flex: 1, height: 28, justifyContent: "center" },
  ray: { height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,.22)", overflow: "hidden" },
  dolu: { height: "100%", borderRadius: 4, backgroundColor: "#fff" },
  tutamac: { position: "absolute", width: 13, height: 13, borderRadius: 7, backgroundColor: "#fff" },
  tutamacBuyuk: { width: 17, height: 17, borderRadius: 9, marginLeft: -2 },
});
