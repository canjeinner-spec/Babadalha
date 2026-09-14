import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { KeyboardAware } from "@/components/KeyboardAware";
import { Portrait } from "@/components/Portrait";
import { Txt } from "@/components/Txt";
import { getMyProfile, isUsernameAvailable, updateMyProfile } from "@/data/remote/profileRepo";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

const AD_KALIBI = /^[A-Za-z0-9_.çğıöşüÇĞİÖŞÜ]+$/;
const AD_ASGARI = 3;
const AD_AZAMI = 32;
const BIYOGRAFI_AZAMI = 160;
const BAKMA_GECIKMESI = 550;

type AdDurumu = "bos" | "kisa" | "gecersiz" | "bakiliyor" | "musait" | "dolu";

function Alan({ etiket, ipucu, children, sagUst }: {
  etiket: string;
  ipucu?: string;
  children: React.ReactNode;
  sagUst?: React.ReactNode;
}) {
  return (
    <View style={styles.alan}>
      <View style={styles.alanBaslik}>
        <Txt weight="extrabold" size={12} color={C.dim2} style={{ letterSpacing: 0.6 }}>
          {etiket.toLocaleUpperCase("tr")}
        </Txt>
        <View style={{ flex: 1 }} />
        {sagUst}
      </View>
      {children}
      {!!ipucu && <Txt size={11.5} color={C.dim} style={{ marginTop: 7 }}>{ipucu}</Txt>}
    </View>
  );
}

export default function ProfilDuzenle() {
  const t = useCeviri();
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const setUserName = useApp((s) => s.setUserName);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [ad, setAd] = useState(userName);
  const [ilkAd, setIlkAd] = useState(userName);
  const [biyografi, setBiyografi] = useState("");
  const [ulke, setUlke] = useState("");
  const [sehir, setSehir] = useState("");
  const [adDurumu, setAdDurumu] = useState<AdDurumu>("bos");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [bildirim, setBildirim] = useState("");
  const [hata, setHata] = useState("");
  const bakmaRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let acik = true;
    if (!isSupabaseConfigured) {
      queueMicrotask(() => {
        if (!acik) return;
        setHata(t("duzenle.sunucuYok"));
        setYukleniyor(false);
      });
      return () => { acik = false; };
    }
    getMyProfile()
      .then((p) => {
        if (!acik || !p) return;
        setAd(p.kullanici_adi);
        setIlkAd(p.kullanici_adi);
        setBiyografi(p.biyografi ?? "");
        setUlke(p.ulke ?? "");
        setSehir(p.sehir ?? "");
      })
      .catch(() => { if (acik) setHata(t("duzenle.hata")); })
      .finally(() => { if (acik) setYukleniyor(false); });
    return () => { acik = false; };
  }, [t]);

  const adYaz = useCallback((deger: string) => {
    const temiz = deger.trim().slice(0, AD_AZAMI);
    setAd(temiz);
    setHata("");
    if (bakmaRef.current) clearTimeout(bakmaRef.current);
    if (temiz === ilkAd) { setAdDurumu("bos"); return; }
    if (temiz.length < AD_ASGARI) { setAdDurumu("kisa"); return; }
    if (!AD_KALIBI.test(temiz)) { setAdDurumu("gecersiz"); return; }
    setAdDurumu("bakiliyor");
    bakmaRef.current = setTimeout(() => {
      isUsernameAvailable(temiz)
        .then((musait) => setAdDurumu(musait ? "musait" : "dolu"))
        .catch(() => setAdDurumu("bos"));
    }, BAKMA_GECIKMESI);
  }, [ilkAd]);

  useEffect(() => () => { if (bakmaRef.current) clearTimeout(bakmaRef.current); }, []);

  useEffect(() => {
    if (!bildirim) return;
    const zamanlayici = setTimeout(() => setBildirim(""), 1800);
    return () => clearTimeout(zamanlayici);
  }, [bildirim]);

  const kaydedilebilir = !kaydediliyor
    && !yukleniyor
    && isSupabaseConfigured
    && adDurumu !== "kisa"
    && adDurumu !== "gecersiz"
    && adDurumu !== "dolu"
    && adDurumu !== "bakiliyor";

  const kaydet = useCallback(async () => {
    if (!kaydedilebilir) return;
    haptic.select();
    setKaydediliyor(true);
    setHata("");
    try {
      const yama: Parameters<typeof updateMyProfile>[0] = {
        biyografi: biyografi.trim() || null,
        ulke: ulke.trim() || null,
        sehir: sehir.trim() || null,
      };
      if (ad !== ilkAd) yama.kullanici_adi = ad;
      const p = await updateMyProfile(yama);
      setUserName(p.kullanici_adi);
      setIlkAd(p.kullanici_adi);
      setAdDurumu("bos");
      setBildirim(t("duzenle.kaydedildi"));
    } catch {
      setHata(t("duzenle.hata"));
    } finally {
      setKaydediliyor(false);
    }
  }, [kaydedilebilir, ad, ilkAd, biyografi, ulke, sehir, setUserName, t]);

  const adNotu = (() => {
    if (adDurumu === "kisa") return { metin: t("duzenle.adKisa"), renk: C.red };
    if (adDurumu === "gecersiz") return { metin: t("duzenle.adGecersiz"), renk: C.red };
    if (adDurumu === "dolu") return { metin: t("duzenle.adDolu"), renk: C.red };
    if (adDurumu === "musait") return { metin: t("duzenle.adMusait"), renk: C.gold2 };
    if (adDurumu === "bakiliyor") return { metin: t("duzenle.adBakiliyor"), renk: C.dim };
    return null;
  })();

  return (
    <View style={styles.kok}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("duzenle.baslik")}</Txt>
          <View style={{ width: 30 }} />
        </View>

        {yukleniyor ? (
          <View style={styles.ortala}><ActivityIndicator color={C.gold2} /></View>
        ) : (
          <KeyboardAware>
            <ScrollView contentContainerStyle={styles.govde} showsVerticalScrollIndicator={false}>
              <View style={styles.yuz}>
                <Portrait name={ad || userName} size={86} photo={userPhoto ?? undefined} halkasiz />
              </View>

              <Alan
                etiket={t("duzenle.kullaniciAdi")}
                ipucu={t("duzenle.kullaniciAdiIpucu")}
                sagUst={<Txt size={11} color={C.dim2}>{ad.length}/{AD_AZAMI}</Txt>}
              >
                <TextInput
                  value={ad}
                  onChangeText={adYaz}
                  style={styles.girdi}
                  placeholderTextColor={C.dim2}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={AD_AZAMI}
                />
                {!!adNotu && (
                  <Txt size={11.5} color={adNotu.renk} style={{ marginTop: 7 }}>{adNotu.metin}</Txt>
                )}
              </Alan>

              <Alan
                etiket={t("duzenle.biyografi")}
                ipucu={t("duzenle.biyografiIpucu")}
                sagUst={<Txt size={11} color={C.dim2}>{biyografi.length}/{BIYOGRAFI_AZAMI}</Txt>}
              >
                <TextInput
                  value={biyografi}
                  onChangeText={(v) => setBiyografi(v.slice(0, BIYOGRAFI_AZAMI))}
                  style={[styles.girdi, styles.cokSatir]}
                  placeholderTextColor={C.dim2}
                  multiline
                  maxLength={BIYOGRAFI_AZAMI}
                />
              </Alan>

              <View style={styles.ikili}>
                <View style={{ flex: 1 }}>
                  <Alan etiket={t("duzenle.ulke")}>
                    <TextInput
                      value={ulke}
                      onChangeText={setUlke}
                      style={styles.girdi}
                      placeholderTextColor={C.dim2}
                      maxLength={56}
                    />
                  </Alan>
                </View>
                <View style={{ flex: 1 }}>
                  <Alan etiket={t("duzenle.sehir")}>
                    <TextInput
                      value={sehir}
                      onChangeText={setSehir}
                      style={styles.girdi}
                      placeholderTextColor={C.dim2}
                      maxLength={56}
                    />
                  </Alan>
                </View>
              </View>

              {hata !== "" && (
                <Txt size={12} color={C.red} align="center" lh={1.45} style={{ marginTop: 4 }}>{hata}</Txt>
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

      {bildirim !== "" && (
        <View style={styles.bildirim}>
          <Txt weight="bold" size={12.5} color="#fff">{bildirim}</Txt>
        </View>
      )}
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
  govde: { paddingHorizontal: 18, paddingBottom: 40 },
  yuz: { alignItems: "center", marginTop: 2, marginBottom: 22 },
  alan: { marginBottom: 18 },
  alanBaslik: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginLeft: 2 },
  girdi: {
    backgroundColor: C.kart, borderRadius: 14, borderWidth: 1, borderColor: C.line,
    paddingHorizontal: 14, paddingVertical: 13,
    color: "#fff", fontSize: 14.5,
  },
  cokSatir: { minHeight: 92, textAlignVertical: "top" },
  ikili: { flexDirection: "row", gap: 12 },
  kaydet: {
    marginTop: 10, alignItems: "center", justifyContent: "center",
    paddingVertical: 16, borderRadius: 16, backgroundColor: C.gold2,
  },
  sonuk: { opacity: 0.45 },
  bildirim: {
    position: "absolute", alignSelf: "center", bottom: 34,
    backgroundColor: "rgba(20,16,10,.95)", borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(232,179,65,.25)",
  },
});
