import { memo, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { type LayoutChangeEvent, PanResponder, Pressable, StyleSheet, View } from "react-native";

import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

const YOL_OYNAT = "M7 4l12 8-12 8V4z";
const YOL_DURAKLAT = "M8 5v14M16 5v14";
const YOL_GERI = "M1.6 4.4v6h6M4.1 15a9 9 0 1 0 2.13-9.36L1.6 10";
const YOL_ILERI = "M22.4 4.4v6h-6M19.9 15a9 9 0 1 1-2.13-9.36L22.4 10";
const YOL_SES = "M3 9.5v5h3.5L11 18.5v-13L6.5 9.5H3zM15 9.6a4 4 0 0 1 0 4.8M17.6 7.3a7.5 7.5 0 0 1 0 9.4";
const YOL_SES_KAPALI = "M3 9.5v5h3.5L11 18.5v-13L6.5 9.5H3zM15.5 9.8l5 4.4M20.5 9.8l-5 4.4";
const YOL_MIKROFON = "M12 3.5a2.6 2.6 0 0 1 2.6 2.6v5a2.6 2.6 0 0 1-5.2 0v-5A2.6 2.6 0 0 1 12 3.5zM5.8 11a6.2 6.2 0 0 0 12.4 0M12 17.2v3.3";
const YOL_AYAR =
  "M12 9.6a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8zM19.3 13.1a7.6 7.6 0 0 0 0-2.2l2-1.5-2-3.4-2.3 1a7.6 7.6 0 0 0-1.9-1.1L14.8 3.4H9.2l-.3 2.5a7.6 7.6 0 0 0-1.9 1.1l-2.3-1-2 3.4 2 1.5a7.6 7.6 0 0 0 0 2.2l-2 1.5 2 3.4 2.3-1a7.6 7.6 0 0 0 1.9 1.1l.3 2.5h5.6l.3-2.5a7.6 7.6 0 0 0 1.9-1.1l2.3 1 2-3.4z";

const ATLAMA_SN = 10;
const GIZLENME_MS = 3600;

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
  ses, onSes, odak, onOdak, baslik, altBaslik, hiz, onAyarlar,
}: {
  konum: number; sure: number; oynuyor: boolean;
  onOynat: () => void; onDuraklat: () => void; onAtla: (saniye: number) => void;
  sagDugmeler?: ReactNode;
  ses?: number; onSes?: (deger: number) => void;
  odak?: number; onOdak?: (deger: number) => void;
  baslik?: string | null; altBaslik?: string | null;
  hiz?: number; onAyarlar?: () => void;
}) {
  const [acik, setAcik] = useState(true);
  const [genislik, setGenislik] = useState(0);
  const [surukleme, setSurukleme] = useState<number | null>(null);
  const [sesAcik, setSesAcik] = useState(false);
  const [sesGenislik, setSesGenislik] = useState(0);

  useEffect(() => {
    if (!acik || surukleme != null || sesAcik) return;
    const t = setTimeout(() => setAcik(false), GIZLENME_MS);
    return () => clearTimeout(t);
  }, [acik, surukleme, sesAcik, konum, oynuyor]);

  const gosterilen = surukleme ?? konum;
  const oran = sure > 0 ? Math.min(1, Math.max(0, gosterilen / sure)) : 0;

  const olculer = useRef({ genislik: 0, sure: 0, onAtla });
  useEffect(() => { olculer.current = { genislik, sure, onAtla }; }, [genislik, sure, onAtla]);

  const sesOlculer = useRef({ genislik: 0, onSes: onOdak ?? onSes });
  useEffect(() => { sesOlculer.current = { genislik: sesGenislik, onSes: onOdak ?? onSes }; }, [sesGenislik, onOdak, onSes]);

  const sesSur = useMemo(() => {
    const uygula = (x: number) => {
      const g = sesOlculer.current.genislik;
      sesOlculer.current.onSes?.(g > 0 ? Math.min(1, Math.max(0, x / g)) : 0);
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => uygula(e.nativeEvent.locationX),
      onPanResponderMove: (e) => uygula(e.nativeEvent.locationX),
    });
  }, []);

  const sesDegeri = Math.min(1, Math.max(0, ses ?? 1));
  const odakVar = !!onOdak;
  const odakDegeri = Math.min(1, Math.max(0, odak ?? 0.5));
  const rayDegeri = odakVar ? odakDegeri : sesDegeri;
  const kaydiriciVar = odakVar || !!onSes;

  const sur = useMemo(() => {
    const konumdan = (x: number) => {
      const { genislik: g, sure: s } = olculer.current;
      return g > 0 && s > 0 ? Math.min(s, Math.max(0, (x / g) * s)) : 0;
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => setSurukleme(konumdan(e.nativeEvent.locationX)),
      onPanResponderMove: (e) => setSurukleme(konumdan(e.nativeEvent.locationX)),
      onPanResponderRelease: (e) => {
        const sn = konumdan(e.nativeEvent.locationX);
        setSurukleme(null);
        olculer.current.onAtla(sn);
      },
      onPanResponderTerminate: () => setSurukleme(null),
    });
  }, []);

  const atla = (fark: number) => {
    haptic.select();
    onAtla(Math.max(0, Math.min(sure || Number.MAX_SAFE_INTEGER, konum + fark)));
    setAcik(true);
  };

  if (!acik) {
    return <Pressable style={StyleSheet.absoluteFill} onPress={() => setAcik(true)} />;
  }

  return (
    <Pressable style={[StyleSheet.absoluteFill, styles.perde]} onPress={() => setAcik(false)}>
      <View style={styles.ust} pointerEvents="box-none">
        {!!onAyarlar && (
          <Pressable
            onPress={() => { haptic.select(); onAyarlar(); }}
            hitSlop={10}
            style={styles.rozet}
          >
            <Txt weight="extrabold" size={12} color="#fff">{`${hiz ?? 1}x`}</Txt>
          </Pressable>
        )}
        <View style={styles.esnek} />
        {!!onAyarlar && (
          <Pressable
            onPress={() => { haptic.select(); onAyarlar(); }}
            hitSlop={10}
            style={styles.yuvarlakDugme}
          >
            <Icon path={YOL_AYAR} size={19} sw={1.8} color="#fff" />
          </Pressable>
        )}
      </View>

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

      {kaydiriciVar && sesAcik && (
        <View style={styles.sesSatiri} pointerEvents="box-none">
          <View style={styles.kosuDugmesi} pointerEvents="none">
            <Icon path={odakVar ? YOL_SES : (sesDegeri === 0 ? YOL_SES_KAPALI : YOL_SES)} size={19} sw={2.1} color="#fff" />
          </View>
          <View
            style={styles.sesRayYuva}
            onLayout={(e: LayoutChangeEvent) => setSesGenislik(e.nativeEvent.layout.width)}
            {...sesSur.panHandlers}
          >
            <View style={styles.ray} pointerEvents="none">
              <View style={[styles.dolu, { width: `${rayDegeri * 100}%` }]} />
            </View>
            <View pointerEvents="none" style={[styles.tutamac, { left: Math.max(0, rayDegeri * sesGenislik - 6) }]} />
          </View>
          {odakVar ? (
            <View style={styles.kosuDugmesi} pointerEvents="none">
              <Icon path={YOL_MIKROFON} size={18} sw={2.1} color="#fff" />
            </View>
          ) : (
            <Txt weight="extrabold" size={11} color="#fff" style={styles.yuzde}>{Math.round(rayDegeri * 100)}</Txt>
          )}
        </View>
      )}

      <View style={styles.altKapsul} pointerEvents="box-none">
        {!!baslik && (
          <View style={styles.baslikSatiri} pointerEvents="none">
            <Txt weight="extrabold" size={13} color="#fff" numberOfLines={1}>{baslik}</Txt>
            {!!altBaslik && (
              <Txt weight="medium" size={11} color="rgba(255,255,255,.62)" numberOfLines={1}>{altBaslik}</Txt>
            )}
          </View>
        )}
        <View style={styles.ilerlemeSatiri} pointerEvents="box-none">
          <Txt weight="extrabold" size={11} color="#fff" style={styles.zaman}>{zamanYaz(gosterilen)}</Txt>
          <View
            style={styles.rayYuva}
            onLayout={(e: LayoutChangeEvent) => setGenislik(e.nativeEvent.layout.width)}
            {...sur.panHandlers}
          >
            <View style={styles.ray} pointerEvents="none">
              <View style={[styles.dolu, { width: `${oran * 100}%` }]} />
            </View>
            <View
              pointerEvents="none"
              style={[styles.tutamac, { left: Math.max(0, oran * genislik - 6) }, surukleme != null && styles.tutamacBuyuk]}
            />
          </View>
          <Txt weight="extrabold" size={11} color="rgba(255,255,255,.62)" style={styles.zaman}>{zamanYaz(sure)}</Txt>
          {kaydiriciVar && (
            <Pressable
              onPress={() => { haptic.select(); setSesAcik((v) => !v); setAcik(true); }}
              hitSlop={8}
              style={styles.kosuDugmesi}
            >
              <Icon
                path={!odakVar && sesDegeri === 0 ? YOL_SES_KAPALI : YOL_SES}
                size={18}
                sw={2.1}
                color={sesAcik ? C.gold2 : "#fff"}
              />
            </Pressable>
          )}
          {sagDugmeler}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  perde: { backgroundColor: "rgba(0,0,0,.28)", justifyContent: "center" },
  esnek: { flex: 1 },
  ust: { position: "absolute", left: 10, right: 10, top: 8, flexDirection: "row", alignItems: "center", gap: 8 },
  rozet: {
    minWidth: 34, height: 28, paddingHorizontal: 9, borderRadius: 14,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,.42)",
  },
  yuvarlakDugme: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,.42)",
  },
  orta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 34 },
  yanDugme: {
    alignItems: "center", justifyContent: "center", width: 40, height: 40,
    shadowColor: "#000", shadowOpacity: 0.55, shadowRadius: 6, shadowOffset: { width: 0, height: 1 },
  },
  yanYaziKutu: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center", marginTop: 1.5 },
  anaDugme: {
    width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,.38)",
  },
  altKapsul: {
    position: "absolute", left: 8, right: 8, bottom: 8,
    borderRadius: 16, paddingHorizontal: 10, paddingTop: 7, paddingBottom: 4,
    backgroundColor: "rgba(0,0,0,.46)",
  },
  baslikSatiri: { paddingHorizontal: 2, paddingBottom: 3, gap: 1 },
  ilerlemeSatiri: { flexDirection: "row", alignItems: "center", gap: 8 },
  sesSatiri: {
    position: "absolute", left: 8, right: 8, bottom: 74,
    flexDirection: "row", alignItems: "center", gap: 8,
    borderRadius: 16, paddingHorizontal: 10, backgroundColor: "rgba(0,0,0,.46)",
  },
  zaman: { minWidth: 34, textAlign: "center" },
  yuzde: { minWidth: 26, textAlign: "center" },
  rayYuva: { flex: 1, height: 26, justifyContent: "center" },
  sesRayYuva: { flex: 1, height: 30, justifyContent: "center" },
  ray: { height: 4, borderRadius: 3, backgroundColor: "rgba(255,255,255,.24)", overflow: "hidden" },
  dolu: { height: "100%", borderRadius: 3, backgroundColor: C.gold2 },
  tutamac: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#fff" },
  tutamacBuyuk: { width: 16, height: 16, borderRadius: 8, marginLeft: -2 },
  kosuDugmesi: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
});
