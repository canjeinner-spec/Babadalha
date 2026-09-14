import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAware } from "@/components/KeyboardAware";
import { Txt } from "@/components/Txt";
import { getMyProfile, isUsernameAvailable, updateMyProfile } from "@/data/remote/profileRepo";
import { Icon } from "@/icons/Icon";
import { adKilidiKalan, adKilidiKur, AD_KILIT_SURESI } from "@/lib/adKilidi";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { useGorunenAd } from "@/lib/gorunenAd";
import { haptic } from "@/lib/haptics";
import { isSupabaseConfigured } from "@/lib/supabase";
import { kalanSureYaz } from "@/lib/sureYazim";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

type Alan = "ad" | "kullaniciAdi" | "biyografi" | "ulke" | "sehir";

const AD_KALIBI = /^[A-Za-z0-9_.çğıöşüÇĞİÖŞÜ]+$/;
const AD_ASGARI = 3;
const BAKMA_GECIKMESI = 450;

const AYAR: Record<Alan, { etiket: string; azami: number; cokSatir?: boolean }> = {
  ad: { etiket: "duzenle.ad", azami: 32 },
  kullaniciAdi: { etiket: "duzenle.kullaniciAdi", azami: 32 },
  biyografi: { etiket: "duzenle.biyografi", azami: 160, cokSatir: true },
  ulke: { etiket: "duzenle.ulke", azami: 56 },
  sehir: { etiket: "duzenle.sehir", azami: 56 },
};

type AdDurumu = "bos" | "kisa" | "gecersiz" | "bakiliyor" | "musait" | "dolu";

export default function ProfilAlan() {
  const t = useCeviri();
  const router = useRouter();
  const { alan } = useLocalSearchParams<{ alan?: string }>();
  const hangi: Alan = (["ad", "kullaniciAdi", "biyografi", "ulke", "sehir"] as Alan[])
    .includes(alan as Alan) ? (alan as Alan) : "ad";
  const ayar = AYAR[hangi];

  const session = useApp((s) => s.session);
  const userName = useApp((s) => s.userName);
  const setUserName = useApp((s) => s.setUserName);
  const gorunenAd = useGorunenAd((s) => s.ad);
  const gorunenAdYaz = useGorunenAd((s) => s.yaz);
  const baglandi = !!session && isSupabaseConfigured;

  const [deger, setDeger] = useState("");
  const [ilk, setIlk] = useState("");
  const [yukleniyor, setYukleniyor] = useState(hangi !== "ad");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [hata, setHata] = useState("");
  const [adDurumu, setAdDurumu] = useState<AdDurumu>("bos");
  const [kilitKalan, setKilitKalan] = useState(0);
  const bakmaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const girdiRef = useRef<TextInput>(null);

  useEffect(() => {
    let acik = true;
    if (hangi === "ad") {
      queueMicrotask(() => {
        if (!acik) return;
        setDeger(gorunenAd);
        setIlk(gorunenAd);
      });
      return () => { acik = false; };
    }
    if (!baglandi) {
      const yerel = hangi === "kullaniciAdi" ? userName : "";
      queueMicrotask(() => {
        if (!acik) return;
        setDeger(yerel);
        setIlk(yerel);
        setYukleniyor(false);
      });
      return () => { acik = false; };
    }
    getMyProfile()
      .then((p) => {
        if (!acik || !p) return;
        const v = hangi === "kullaniciAdi" ? p.kullanici_adi
          : hangi === "biyografi" ? (p.biyografi ?? "")
          : hangi === "ulke" ? (p.ulke ?? "")
          : (p.sehir ?? "");
        setDeger(v);
        setIlk(v);
      })
      .catch(() => { if (acik) setHata(t("duzenle.hata")); })
      .finally(() => { if (acik) setYukleniyor(false); });
    return () => { acik = false; };
  }, [hangi, baglandi, gorunenAd, userName, t]);

  useEffect(() => {
    if (hangi !== "kullaniciAdi") return;
    let acik = true;
    adKilidiKalan().then((k) => { if (acik) setKilitKalan(k); }).catch(() => {});
    return () => { acik = false; };
  }, [hangi]);

  useEffect(() => {
    const zamanlayici = setTimeout(() => girdiRef.current?.focus(), 320);
    return () => clearTimeout(zamanlayici);
  }, []);

  useEffect(() => () => { if (bakmaRef.current) clearTimeout(bakmaRef.current); }, []);

  const yaz = useCallback((ham: string) => {
    setHata("");
    if (hangi !== "kullaniciAdi") {
      setDeger(ham.slice(0, ayar.azami));
      return;
    }
    const temiz = ham.trim().slice(0, ayar.azami);
    setDeger(temiz);
    if (bakmaRef.current) clearTimeout(bakmaRef.current);
    if (temiz === ilk) { setAdDurumu("bos"); return; }
    if (temiz.length < AD_ASGARI) { setAdDurumu("kisa"); return; }
    if (!AD_KALIBI.test(temiz)) { setAdDurumu("gecersiz"); return; }
    setAdDurumu("bakiliyor");
    bakmaRef.current = setTimeout(() => {
      if (!baglandi) { setAdDurumu("musait"); return; }
      isUsernameAvailable(temiz)
        .then((musait) => setAdDurumu(musait ? "musait" : "dolu"))
        .catch(() => setAdDurumu("bos"));
    }, BAKMA_GECIKMESI);
  }, [hangi, ayar.azami, ilk, baglandi]);

  const degisti = deger.trim() !== ilk.trim();
  const kilitli = hangi === "kullaniciAdi" && kilitKalan > 0;
  const kaydedilebilir = !kaydediliyor && !yukleniyor && !kilitli && degisti
    && (hangi !== "kullaniciAdi" || (adDurumu !== "kisa" && adDurumu !== "gecersiz"
      && adDurumu !== "dolu" && adDurumu !== "bakiliyor"));

  const kaydet = useCallback(async () => {
    if (!kaydedilebilir) return;
    haptic.select();
    setKaydediliyor(true);
    setHata("");
    try {
      if (hangi === "ad") {
        await gorunenAdYaz(deger);
      } else if (!baglandi) {
        if (hangi === "kullaniciAdi") setUserName(deger.trim());
      } else if (hangi === "kullaniciAdi") {
        const p = await updateMyProfile({ kullanici_adi: deger.trim() });
        setUserName(p.kullanici_adi);
        await adKilidiKur();
        setKilitKalan(AD_KILIT_SURESI);
      } else {
        const temiz = deger.trim() || null;
        await updateMyProfile(
          hangi === "biyografi" ? { biyografi: temiz }
            : hangi === "ulke" ? { ulke: temiz }
            : { sehir: temiz },
        );
      }
      if (hangi === "kullaniciAdi" && !baglandi) {
        await adKilidiKur();
      }
      router.back();
    } catch {
      setHata(t("duzenle.hata"));
      setKaydediliyor(false);
    }
  }, [kaydedilebilir, hangi, deger, baglandi, gorunenAdYaz, setUserName, router, t]);

  const not = (() => {
    if (hangi !== "kullaniciAdi") return null;
    if (kilitli) return { metin: t("duzenle.adKilitTam", kalanSureYaz(kilitKalan, t)), renk: C.red };
    if (adDurumu === "kisa") return { metin: t("duzenle.adKisa"), renk: C.red };
    if (adDurumu === "gecersiz") return { metin: t("duzenle.adGecersiz"), renk: C.red };
    if (adDurumu === "dolu") return { metin: t("duzenle.adDolu"), renk: C.red };
    if (adDurumu === "musait") return { metin: t("duzenle.adMusait"), renk: C.gold2 };
    if (adDurumu === "bakiliyor") return { metin: t("duzenle.adBakiliyor"), renk: C.dim };
    return null;
  })();

  const ipucu = hangi === "ad" ? t("duzenle.adIpucu")
    : hangi === "kullaniciAdi" ? t("duzenle.adKural")
    : hangi === "biyografi" ? t("duzenle.biyografiIpucu")
    : null;

  return (
    <View style={styles.kok}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t(ayar.etiket)}</Txt>
          <View style={{ width: 30 }} />
        </View>

        {yukleniyor ? (
          <View style={styles.ortala}><ActivityIndicator color={C.gold2} /></View>
        ) : (
          <KeyboardAware>
            <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
              <Pressable style={styles.yaziSatiri} onPress={() => !kilitli && girdiRef.current?.focus()}>
                {hangi === "kullaniciAdi" && (
                  <Txt weight="displayBold" size={19} color={C.gold2}>@</Txt>
                )}
                <TextInput
                  ref={girdiRef}
                  value={deger}
                  onChangeText={yaz}
                  editable={!kilitli}
                  multiline={ayar.cokSatir}
                  maxLength={ayar.azami}
                  autoCapitalize={hangi === "kullaniciAdi" ? "none" : "sentences"}
                  autoCorrect={hangi !== "kullaniciAdi"}
                  placeholderTextColor={C.dim2}
                  style={[styles.yazi, ayar.cokSatir && styles.yaziCok, kilitli && styles.yaziKilitli]}
                />
                <Txt size={11.5} color={C.dim2}>{deger.length}/{ayar.azami}</Txt>
              </Pressable>

              {!!not && (
                <View style={styles.notSatiri}>
                  {adDurumu === "bakiliyor" && !kilitli && <ActivityIndicator size="small" color={C.dim} />}
                  <Txt size={12.5} color={not.renk} lh={1.45} style={{ flex: 1 }}>{not.metin}</Txt>
                </View>
              )}

              {!!ipucu && (
                <Txt size={12} color={C.dim} lh={1.5} style={{ marginTop: 14 }}>{ipucu}</Txt>
              )}

              {hata !== "" && (
                <Txt size={12} color={C.red} lh={1.45} style={{ marginTop: 12 }}>{hata}</Txt>
              )}

              <Pressable
                style={[styles.kaydet, !kaydedilebilir && styles.sonuk]}
                disabled={!kaydedilebilir}
                onPress={kaydet}
              >
                <Txt weight="extrabold" size={15} color="#241A05">
                  {kaydediliyor ? t("duzenle.kaydediliyor") : t("duzenle.kaydet")}
                </Txt>
              </Pressable>
            </ScrollView>
          </KeyboardAware>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  ortala: { flex: 1, alignItems: "center", justifyContent: "center" },
  govde: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 },
  yaziSatiri: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.12)", paddingBottom: 10,
  },
  yazi: { flex: 1, color: "#fff", fontSize: 19, paddingVertical: 2, paddingHorizontal: 0 },
  yaziCok: { minHeight: 96, fontSize: 16, textAlignVertical: "top", paddingTop: 2 },
  yaziKilitli: { color: "rgba(255,255,255,.42)" },
  notSatiri: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  kaydet: {
    marginTop: 30, alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold2,
  },
  sonuk: { opacity: 0.4 },
});
