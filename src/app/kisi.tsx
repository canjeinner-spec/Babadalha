import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { CenterModal } from "@/components/CenterModal";
import { OzelIdGosterim } from "@/components/OzelId";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { partiIstatistiklerim, sureYaz, type PartiIstatistik } from "@/data/remote/partiRepo";
import { getPublicProfileById, type PublicProfile } from "@/data/remote/profileRepo";
import {
  arkadaslikDurumu, arkadaslikIste, arkadasligiKabulEt, arkadasligiSil,
  BILDIRIM_SEBEPLERI, engelle as sunucuEngelle, engeliKaldir as sunucuEngeliKaldir,
  engellilerim, kullaniciyiBildir, takibiBirak, takipEdiyorMuyum, takipEt, takipSayilari,
  TabloYok, type ArkadaslikDurumu, type BildirimSebebi,
} from "@/data/remote/sosyalRepo";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useApp } from "@/store/appStore";
import { useCeviri } from "@/lib/ceviri";
import { useDil } from "@/lib/dil";
import { engelliMi, useEngellenenler } from "@/lib/engellenenler";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { platformBul } from "@/oda/platform";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";

function sayiYaz(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

function Kart({ simge, etiket, deger }: { simge: IconName; etiket: string; deger: string }) {
  return (
    <View style={styles.kart}>
      <View style={styles.kartSimge}>
        <Icon name={simge} size={18} sw={2} color={C.gold2} />
      </View>
      <Txt weight="bold" size={14} color="#fff" style={{ flex: 1 }}>{etiket}</Txt>
      <Txt weight="extrabold" size={13.5} color="rgba(255,255,255,.82)" numberOfLines={1}>{deger}</Txt>
    </View>
  );
}

function tarihYaz(ham: string | null | undefined, dilKodu: string): string {
  if (!ham) return "—";
  const z = new Date(ham);
  if (Number.isNaN(z.getTime())) return "—";
  return z.toLocaleDateString(dilKodu, { day: "numeric", month: "long", year: "numeric" });
}

export default function Kisi() {
  const t = useCeviri();
  const dilKodu = useDil((s) => s.dil.kod);
  const p = useLocalSearchParams<{
    id?: string; ad?: string; kullaniciAdi?: string; foto?: string; tip?: string; tema?: string; bildir?: string;
  }>();
  const dbId = p.id ? Number(p.id) : null;

  const [profil, setProfil] = useState<PublicProfile | null>(null);
  const [istatistik, setIstatistik] = useState<PartiIstatistik | null>(null);
  const [yukleniyor, setYukleniyor] = useState(!!dbId);
  const [menu, setMenu] = useState(false);
  const [bildirim, setBildirim] = useState("");
  const engelListesi = useEngellenenler((s) => s.liste);
  const engelDegistir = useEngellenenler((s) => s.degistir);
  const oturum = useApp((s) => s.session);
  const [sunucuEngelli, setSunucuEngelli] = useState<boolean | null>(null);
  const [arkadaslik, setArkadaslik] = useState<ArkadaslikDurumu>("yok");
  const [takipte, setTakipte] = useState(false);
  const [sayilar, setSayilar] = useState<{ takipci: number; takip: number } | null>(null);
  const [bildirAcik, setBildirAcik] = useState(false);
  const [mesgul, setMesgul] = useState(false);
  const engelli = sunucuEngelli ?? engelliMi(engelListesi, dbId ? `u${dbId}` : null, p.kullaniciAdi || null);

  useEffect(() => {
    if (!dbId || Number.isNaN(dbId)) return;
    let acik = true;
    getPublicProfileById(dbId)
      .then((r) => { if (acik) setProfil(r); })
      .catch(() => {})
      .finally(() => { if (acik) setYukleniyor(false); });
    return () => { acik = false; };
  }, [dbId]);

  useEffect(() => {
    if (!dbId || Number.isNaN(dbId)) return;
    let acik = true;
    partiIstatistiklerim(dbId)
      .then((r) => { if (acik) setIstatistik(r); })
      .catch(() => {});
    return () => { acik = false; };
  }, [dbId]);

  useEffect(() => {
    if (p.bildir !== "1") return;
    const z = setTimeout(() => setBildirAcik(true), 360);
    return () => clearTimeout(z);
  }, [p.bildir]);

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(""), 2000);
    return () => clearTimeout(z);
  }, [bildirim]);

  useEffect(() => {
    if (!dbId || Number.isNaN(dbId) || !oturum) return;
    let acik = true;
    Promise.all([
      engellilerim().then((l) => l.includes(dbId)).catch(() => null),
      arkadaslikDurumu(dbId).catch(() => "yok" as ArkadaslikDurumu),
      takipEdiyorMuyum(dbId).catch(() => false),
      takipSayilari(dbId).catch(() => null),
    ]).then(([e, a, tk, sy]) => {
      if (!acik) return;
      if (e !== null) setSunucuEngelli(e);
      setArkadaslik(a);
      setTakipte(tk);
      if (sy) setSayilar(sy);
    });
    return () => { acik = false; };
  }, [dbId, oturum]);

  const sunucuIsi = async (isi: () => Promise<void>, basari?: string) => {
    if (mesgul) return false;
    if (!dbId || !oturum) { setBildirim(t("kisi.girisGerek")); return false; }
    setMesgul(true);
    try {
      await isi();
      if (basari) setBildirim(basari);
      return true;
    } catch (e) {
      setBildirim(t(e instanceof TabloYok ? "kisi.baglanmadi" : "duzenle.hata"));
      return false;
    } finally {
      setMesgul(false);
    }
  };

  const engelBas = async () => {
    haptic.select();
    setMenu(false);
    if (dbId && oturum) {
      const yeni = !engelli;
      const oldu = await sunucuIsi(() => (yeni ? sunucuEngelle(dbId) : sunucuEngeliKaldir(dbId)));
      if (oldu) {
        setSunucuEngelli(yeni);
        setBildirim(t(yeni ? "kisi.engellendi" : "kisi.engelKalkti", ad));
      }
      return;
    }
    const anahtar = dbId ? `u${dbId}` : (p.kullaniciAdi || p.ad || "");
    if (!anahtar) return;
    const acildi = await engelDegistir(anahtar);
    setBildirim(t(acildi ? "kisi.engellendi" : "kisi.engelKalkti", ad));
  };

  const arkadasBas = async () => {
    haptic.select();
    if (!dbId) { setBildirim(t("kisi.girisGerek")); return; }
    if (arkadaslik === "gelen") {
      if (await sunucuIsi(() => arkadasligiKabulEt(dbId))) setArkadaslik("arkadas");
      return;
    }
    if (arkadaslik === "yok") {
      if (await sunucuIsi(() => arkadaslikIste(dbId))) setArkadaslik("bekliyor");
      return;
    }
    if (await sunucuIsi(() => arkadasligiSil(dbId))) setArkadaslik("yok");
  };

  const takipBas = async () => {
    haptic.select();
    if (!dbId) { setBildirim(t("kisi.girisGerek")); return; }
    const yeni = !takipte;
    if (await sunucuIsi(() => (yeni ? takipEt(dbId) : takibiBirak(dbId)))) {
      setTakipte(yeni);
      setSayilar((s) => (s ? { ...s, takipci: Math.max(0, s.takipci + (yeni ? 1 : -1)) } : s));
    }
  };

  const bildirBas = async (sebep: BildirimSebebi) => {
    haptic.select();
    setBildirAcik(false);
    if (!dbId) { setBildirim(t("kisi.girisGerek")); return; }
    await sunucuIsi(() => kullaniciyiBildir(dbId, sebep), t("kisi.bildirildi"));
  };

  const arkadasEtiketi = arkadaslik === "arkadas" ? t("kisi.arkadaslar")
    : arkadaslik === "bekliyor" ? t("kisi.arkadasBekliyor")
    : arkadaslik === "gelen" ? t("kisi.arkadasGelen")
    : t("kisi.arkadasEkle");

  const ad = profil?.kullanici_adi ?? p.ad ?? "";
  const kullaniciAdi = (p.kullaniciAdi || profil?.kullanici_adi || "").trim();
  const foto = profil?.profil_resmi ?? (p.foto || undefined);
  const tip = (profil?.ozel_id_tip ?? (p.tip || null)) as "premium" | "kapsul" | null;
  const tema = profil?.ozel_id_tema ?? (p.tema || null);
  const konum = [profil?.sehir, profil?.ulke].filter(Boolean).join(", ");

  return (
    <View style={styles.kok}>
      <Gradient
        colors={["rgba(232,179,65,.1)", "rgba(10,8,3,0)"]}
        deg={180}
        style={styles.isik}
        pointerEvents="none"
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("kisi.baslik")}</Txt>
          <Pressable onPress={() => { haptic.select(); setMenu(true); }} hitSlop={10} style={styles.geri}>
            <Icon name="dots" size={22} sw={2.2} color="#fff" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
          <View style={styles.tanit}>
            <Portrait name={ad} size={104} photo={foto} halkasiz />
            <View style={{ alignItems: "center", marginTop: 14, gap: 6 }}>
              <RenkliAd ad={ad} tip={tip} tema={tema} size={22} weight="displayBold" renk="#fff" />
              {!!kullaniciAdi && <Txt size={13} color={C.dim}>@{kullaniciAdi}</Txt>}
              {!!profil?.ozel_id && (
                <View style={{ marginTop: 4 }}>
                  <OzelIdGosterim id={profil.ozel_id} tip={tip} tema={tema} punto={17} kapsulSize={13} />
                </View>
              )}
            </View>
            {!!profil?.biyografi && (
              <Txt size={13.5} color={C.dim} align="center" lh={1.55} style={styles.biyografi}>
                {profil.biyografi}
              </Txt>
            )}
          </View>

          {!!sayilar && (
            <View style={styles.serit}>
              <View style={styles.kutucuk}>
                <Txt weight="displayBold" size={18} color="#fff">{sayilar.takipci}</Txt>
                <Txt weight="extrabold" size={10} color={C.dim2} style={{ letterSpacing: 0.9, marginTop: 4 }}>
                  {t("kisi.takipci")}
                </Txt>
              </View>
              <View style={styles.seritAyirac} />
              <View style={styles.kutucuk}>
                <Txt weight="displayBold" size={18} color="#fff">{sayilar.takip}</Txt>
                <Txt weight="extrabold" size={10} color={C.dim2} style={{ letterSpacing: 0.9, marginTop: 4 }}>
                  {t("kisi.takip")}
                </Txt>
              </View>
            </View>
          )}

          {yukleniyor ? (
            <View style={styles.ortala}><ActivityIndicator color={C.gold2} /></View>
          ) : profil ? (
            <View style={styles.kume}>
              <Kart simge="idcard" etiket={t("duzenle.kullaniciAdi")} deger={`@${profil.kullanici_adi}`} />
              <Kart simge="cal" etiket={t("kisi.kayitTarihi")} deger={tarihYaz(profil.olusturulma_tarihi, dilKodu)} />
              <Kart simge="trophy" etiket={t("profil.seviye")} deger={`Lv ${profil.seviye_id ?? "—"}`} />
              <Kart simge="bolt" etiket={t("kart.deneyim")} deger={sayiYaz(profil.deneyim_puani)} />
              <Kart simge="bars" etiket={t("kisi.toplamSure")} deger={sureYaz(istatistik?.toplamSaniye ?? null)} />
              <Kart
                simge="evStar"
                etiket={t("kisi.favoriPlatform")}
                deger={platformBul(istatistik?.favoriPlatform)?.ad ?? "—"}
              />
              {!!konum && <Kart simge="pin" etiket={t("duzenle.sehir")} deger={konum} />}
              {!!profil.kusanilan_rozet && (
                <Kart simge="evDiamond" etiket={t("kisi.rozet")} deger={profil.kusanilan_rozet} />
              )}
            </View>
          ) : (
            <Txt size={13} color={C.dim2} align="center" lh={1.5} style={{ marginTop: 26 }}>
              {t("kisi.bulunamadi")}
            </Txt>
          )}

          <View style={styles.dipEylemler}>
            <Pressable
              style={[styles.dipDugme, arkadaslik !== "yok" && styles.dipSecili]}
              onPress={arkadasBas}
            >
              <Icon name={arkadaslik === "arkadas" ? "check" : "userAdd"} size={18} sw={2} color={C.gold2} />
              <Txt weight="extrabold" size={13} color="#fff" numberOfLines={1}>{arkadasEtiketi}</Txt>
            </Pressable>
            <Pressable style={[styles.dipDugme, takipte && styles.dipSecili]} onPress={takipBas}>
              <Icon name="heart" size={18} sw={2} color={C.gold2} fill={takipte ? C.gold2 : "none"} />
              <Txt weight="extrabold" size={13} color="#fff">
                {takipte ? t("kisi.takiptesin") : t("kisi.takipEt")}
              </Txt>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <CenterModal visible={menu} onClose={() => setMenu(false)}>
        <View style={styles.menu}>
          <Pressable style={styles.menuOge} onPress={engelBas}>
            <Icon name="blockuser" size={19} sw={2} color={C.red} />
            <Txt weight="extrabold" size={14.5} color={C.red}>
              {t(engelli ? "kisi.engeliKaldir" : "kisi.engelle")}
            </Txt>
          </Pressable>
          <Pressable
            style={styles.menuOge}
            onPress={() => { haptic.select(); setMenu(false); setBildirAcik(true); }}
          >
            <Icon name="flag" size={19} sw={2} color={C.red} />
            <Txt weight="extrabold" size={14.5} color={C.red}>{t("kisi.raporla")}</Txt>
          </Pressable>
          <Pressable style={styles.menuKapat} onPress={() => setMenu(false)}>
            <Txt weight="extrabold" size={13.5} color="#fff">{t("kart.kapat")}</Txt>
          </Pressable>
        </View>
      </CenterModal>

      <CenterModal visible={bildirAcik} onClose={() => setBildirAcik(false)}>
        <View style={styles.menu}>
          <Txt weight="displayBold" size={15.5} color="#fff" align="center" style={{ marginBottom: 6 }}>
            {t("kisi.bildirBaslik")}
          </Txt>
          {BILDIRIM_SEBEPLERI.map((sb) => (
            <Pressable key={sb} style={styles.sebep} onPress={() => bildirBas(sb)}>
              <Txt weight="bold" size={13.5} color="#fff">
                {t(`kisi.sebep${sb.charAt(0).toLocaleUpperCase("tr")}${sb.slice(1)}`)}
              </Txt>
            </Pressable>
          ))}
          <Pressable style={styles.menuKapat} onPress={() => setBildirAcik(false)}>
            <Txt weight="extrabold" size={13.5} color="#fff">{t("genel.vazgec")}</Txt>
          </Pressable>
        </View>
      </CenterModal>

      {bildirim !== "" && (
        <View style={styles.bildirim}>
          <Txt weight="bold" size={12.5} color="#fff" align="center" lh={1.4}>{bildirim}</Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  isik: { position: "absolute", top: 0, left: 0, right: 0, height: 320 },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 10,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  tanit: { alignItems: "center", paddingTop: 10, paddingBottom: 24 },
  biyografi: { marginTop: 16, paddingHorizontal: 18 },
  ortala: { paddingVertical: 30, alignItems: "center" },
  serit: {
    flexDirection: "row", alignItems: "center", marginBottom: 16,
    borderRadius: 18, paddingVertical: 15,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kutucuk: { flex: 1, alignItems: "center" },
  seritAyirac: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,.09)" },
  kume: { gap: 10 },
  kart: {
    flexDirection: "row", alignItems: "center", gap: 11,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 13,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  dipEylemler: { flexDirection: "row", gap: 10, marginTop: 22 },
  dipDugme: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderRadius: 16, paddingVertical: 14,
    backgroundColor: C.kart, borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  dipSecili: { backgroundColor: "rgba(232,179,65,.13)", borderColor: "rgba(232,179,65,.4)" },
  sebep: {
    paddingVertical: 13, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,.05)",
  },
  menu: {
    backgroundColor: C.card, borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: C.line, gap: 6,
  },
  menuOge: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 13,
    backgroundColor: "rgba(248,113,113,.08)",
  },
  menuKapat: {
    alignItems: "center", justifyContent: "center", paddingVertical: 12,
    borderRadius: 13, backgroundColor: "rgba(255,255,255,.06)", marginTop: 4,
  },
  bildirim: {
    position: "absolute", left: 24, right: 24, bottom: 44,
    backgroundColor: "rgba(20,16,10,.96)", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: "rgba(232,179,65,.25)",
  },
  kartSimge: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
});
