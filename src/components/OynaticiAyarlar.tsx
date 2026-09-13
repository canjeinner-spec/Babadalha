import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";

import { CenterModal } from "@/components/CenterModal";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { C } from "@/theme/colors";

import { type IzListesi } from "../../modules/aron-player";

const YOL_SAG = "M9 5l7 7-7 7";
const YOL_SOL = "M15 5l-7 7 7 7";
const YOL_ONAY = "M4 12.5l5 5 11-11";

const HIZLAR = [0.5, 0.75, 1, 1.25, 1.5, 2];

type Bolum = "kok" | "hiz" | "kalite" | "ses" | "altyazi" | "ayrinti";

type Secenek = { anahtar: string; ad: string; secili: boolean; sec: () => void };

export function OynaticiAyarlar({
  acik, onKapat, izler, hiz, onHiz, onSesDili, onAltyazi, onKalite, baslik, altBaslik,
}: {
  acik: boolean;
  onKapat: () => void;
  izler: IzListesi;
  hiz: number;
  onHiz: (deger: number) => void;
  onSesDili: (kod: string) => void;
  onAltyazi: (kod: string | null) => void;
  onKalite: (yukseklik: number) => void;
  baslik?: string | null;
  altBaslik?: string | null;
}) {
  const [bolum, setBolum] = useState<Bolum>("kok");

  const kapat = () => { setBolum("kok"); onKapat(); };

  const seciliSes = izler.ses.find((s) => s.secili);
  const seciliAltyazi = izler.altyaziAcik ? izler.altyazi.find((s) => s.secili) : null;
  const seciliKalite = izler.kalite.find((k) => k.secili);

  const secenekler = useMemo<Secenek[]>(() => {
    if (bolum === "hiz") {
      return HIZLAR.map((h) => ({
        anahtar: String(h), ad: `${h}x`, secili: Math.abs(h - hiz) < 0.01,
        sec: () => onHiz(h),
      }));
    }
    if (bolum === "kalite") {
      return [
        { anahtar: "oto", ad: "Otomatik", secili: !seciliKalite, sec: () => onKalite(0) },
        ...izler.kalite.map((k) => ({
          anahtar: String(k.yukseklik), ad: k.ad, secili: !!seciliKalite && seciliKalite.yukseklik === k.yukseklik,
          sec: () => onKalite(k.yukseklik),
        })),
      ];
    }
    if (bolum === "ses") {
      return izler.ses.map((s) => ({
        anahtar: s.kod, ad: s.ad, secili: s.secili, sec: () => onSesDili(s.kod),
      }));
    }
    if (bolum === "altyazi") {
      return [
        { anahtar: "kapali", ad: "Kapalı", secili: !seciliAltyazi, sec: () => onAltyazi(null) },
        ...izler.altyazi.map((s) => ({
          anahtar: s.kod, ad: s.ad, secili: !!seciliAltyazi && seciliAltyazi.kod === s.kod,
          sec: () => onAltyazi(s.kod),
        })),
      ];
    }
    return [];
  }, [bolum, hiz, izler, onAltyazi, onHiz, onKalite, onSesDili, seciliAltyazi, seciliKalite]);

  const basliklar: Record<Bolum, string> = {
    kok: "Ayarlar",
    hiz: "Oynatma hızı",
    kalite: "Video kalitesi",
    ses: "Ses",
    altyazi: "Altyazılar",
    ayrinti: "Video ayrıntıları",
  };

  return (
    <CenterModal visible={acik} onClose={kapat}>
      <View style={styles.kart}>
        <View style={styles.baslikSatiri}>
          {bolum !== "kok" ? (
            <Pressable onPress={() => { haptic.select(); setBolum("kok"); }} hitSlop={10} style={styles.geri}>
              <Icon path={YOL_SOL} size={18} sw={2.2} color={C.text} />
            </Pressable>
          ) : (
            <View style={styles.geri} />
          )}
          <Txt weight="extrabold" size={15} color={C.text}>{basliklar[bolum]}</Txt>
          <View style={styles.geri} />
        </View>

        <ScrollView style={styles.govde} contentContainerStyle={styles.govdeIc}>
          {bolum === "kok" && (
            <>
              <Satir ad="Oynatma hızı" deger={`${hiz}x`} onPress={() => setBolum("hiz")} />
              <Satir
                ad="Video kalitesi"
                deger={seciliKalite ? seciliKalite.ad : "Otomatik"}
                onPress={() => setBolum("kalite")}
                kapali={izler.kalite.length === 0}
              />
              <Satir
                ad="Ses"
                deger={seciliSes ? seciliSes.ad : "-"}
                onPress={() => setBolum("ses")}
                kapali={izler.ses.length === 0}
              />
              <Satir
                ad="Altyazılar"
                deger={seciliAltyazi ? seciliAltyazi.ad : "Kapalı"}
                onPress={() => setBolum("altyazi")}
                kapali={izler.altyazi.length === 0}
              />
              <Satir ad="Video ayrıntıları" deger="" onPress={() => setBolum("ayrinti")} />
            </>
          )}

          {bolum === "ayrinti" && (
            <View style={styles.ayrinti}>
              <Ayrinti ad="Başlık" deger={baslik || "-"} />
              <Ayrinti ad="Kaynak" deger={altBaslik || "-"} />
              <Ayrinti ad="Çözünürlük" deger={seciliKalite ? seciliKalite.ad : "Otomatik"} />
              <Ayrinti ad="Ses dili" deger={seciliSes ? seciliSes.ad : "-"} />
              <Ayrinti ad="Altyazı" deger={seciliAltyazi ? seciliAltyazi.ad : "Kapalı"} />
              <Ayrinti ad="Ses dili sayısı" deger={String(izler.ses.length)} />
              <Ayrinti ad="Altyazı sayısı" deger={String(izler.altyazi.length)} />
            </View>
          )}

          {bolum !== "kok" && bolum !== "ayrinti" && (
            secenekler.length === 0 ? (
              <Txt size={13} color={C.dim} style={styles.bos}>Bu içerik için seçenek yok.</Txt>
            ) : (
              secenekler.map((s) => (
                <Pressable
                  key={s.anahtar}
                  onPress={() => { haptic.select(); s.sec(); setBolum("kok"); }}
                  style={styles.secenek}
                >
                  <Txt weight={s.secili ? "extrabold" : "medium"} size={14} color={s.secili ? C.gold2 : C.text}>{s.ad}</Txt>
                  {s.secili && <Icon path={YOL_ONAY} size={16} sw={2.4} color={C.gold2} />}
                </Pressable>
              ))
            )
          )}
        </ScrollView>
      </View>
    </CenterModal>
  );
}

function Satir({ ad, deger, onPress, kapali }: { ad: string; deger: string; onPress: () => void; kapali?: boolean }) {
  return (
    <Pressable
      onPress={() => { if (kapali) return; haptic.select(); onPress(); }}
      style={[styles.satir, kapali && styles.satirKapali]}
    >
      <Txt weight="semibold" size={14} color={kapali ? C.dim2 : C.text}>{ad}</Txt>
      <View style={styles.satirSag}>
        {!!deger && <Txt size={13} color={kapali ? C.dim2 : C.dim}>{deger}</Txt>}
        <Icon path={YOL_SAG} size={15} sw={2.2} color={kapali ? C.dim2 : C.dim} />
      </View>
    </Pressable>
  );
}

function Ayrinti({ ad, deger }: { ad: string; deger: string }) {
  return (
    <View style={styles.ayrintiSatiri}>
      <Txt size={13} color={C.dim}>{ad}</Txt>
      <Txt weight="semibold" size={13} color={C.text} style={styles.ayrintiDeger} numberOfLines={2}>{deger}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  kart: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.line, overflow: "hidden" },
  baslikSatiri: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  geri: { width: 26, height: 22, alignItems: "center", justifyContent: "center" },
  govde: { maxHeight: 340 },
  govdeIc: { paddingVertical: 4 },
  satir: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 13,
  },
  satirKapali: { opacity: 0.45 },
  satirSag: { flexDirection: "row", alignItems: "center", gap: 6 },
  secenek: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  bos: { paddingHorizontal: 14, paddingVertical: 16 },
  ayrinti: { paddingHorizontal: 14, paddingVertical: 4, gap: 10 },
  ayrintiSatiri: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 14 },
  ayrintiDeger: { flex: 1, textAlign: "right" },
});
