import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as GorselSecici from "expo-image-picker";

import { KeyboardAware } from "@/components/KeyboardAware";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { avatarYukle, getMyProfile, isUsernameAvailable, setOzelId, updateMyProfile } from "@/data/remote/profileRepo";
import { AMBLEM_ADI, AMBLEM_RENK, OZEL_ID_AMBLEMLERI, type OzelIdAmblemi } from "@/data/specialId";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { adKilidiKalan, adKilidiKur, AD_KILIT_SURESI } from "@/lib/adKilidi";
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
const GOKKUSAGI_ANAHTARI = "gokkusagi";

type AdDurumu = "bos" | "kisa" | "gecersiz" | "bakiliyor" | "musait" | "dolu";

function kalanYaz(kalan: number, t: (a: string, ...d: (string | number)[]) => string): string {
  const saat = Math.ceil(kalan / (60 * 60 * 1000));
  if (saat >= 24) return t("duzenle.adKilitGun", Math.ceil(saat / 24));
  return t("duzenle.adKilitSaat", saat);
}

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
  const setUserPhoto = useApp((s) => s.setUserPhoto);
  const ozelId = useApp((s) => s.ozelId);
  const ozelIdTip = useApp((s) => s.ozelIdTip);
  const ozelIdTema = useApp((s) => s.ozelIdTema);
  const setOzelIdKimlik = useApp((s) => s.setOzelIdKimlik);
  const premiumMi = ozelIdTip === "premium";

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
  const [kilitKalan, setKilitKalan] = useState(0);
  const [avatarMesgul, setAvatarMesgul] = useState(false);
  const [renk, setRenk] = useState<string>(ozelIdTema ?? GOKKUSAGI_ANAHTARI);

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

  useEffect(() => {
    let acik = true;
    adKilidiKalan().then((k) => { if (acik) setKilitKalan(k); }).catch(() => {});
    return () => { acik = false; };
  }, []);

  const avatarSec = useCallback(async () => {
    if (avatarMesgul) return;
    haptic.select();
    setHata("");
    const izin = await GorselSecici.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) { setHata(t("duzenle.avatarIzni")); return; }
    const secim = await GorselSecici.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (secim.canceled || !secim.assets?.[0]?.uri) return;
    setAvatarMesgul(true);
    try {
      const adres = await avatarYukle(secim.assets[0].uri);
      await updateMyProfile({ profil_resmi: adres });
      setUserPhoto(adres);
      setBildirim(t("duzenle.kaydedildi"));
    } catch {
      setHata(t("duzenle.avatarHatasi"));
    } finally {
      setAvatarMesgul(false);
    }
  }, [avatarMesgul, setUserPhoto, t]);

  const renkSec = useCallback(async (yeni: string) => {
    if (!premiumMi || !ozelId) return;
    haptic.select();
    const onceki = renk;
    setRenk(yeni);
    try {
      await setOzelId(ozelId, "premium", yeni);
      setOzelIdKimlik(ozelId, "premium", yeni);
    } catch {
      setRenk(onceki);
      setHata(t("duzenle.hata"));
    }
  }, [premiumMi, ozelId, renk, setOzelIdKimlik, t]);

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
    && adDurumu !== "bakiliyor"
    && !(kilitKalan > 0 && ad !== ilkAd);

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
      const adDegisti = ad !== ilkAd;
      if (adDegisti) yama.kullanici_adi = ad;
      const p = await updateMyProfile(yama);
      if (adDegisti) {
        await adKilidiKur();
        setKilitKalan(AD_KILIT_SURESI);
      }
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
                <Pressable onPress={avatarSec} disabled={avatarMesgul}>
                  <Portrait name={ad || userName} size={96} photo={userPhoto ?? undefined} halkasiz />
                  <View style={styles.yuzRozet}>
                    {avatarMesgul
                      ? <ActivityIndicator size="small" color="#241A05" />
                      : <Icon name="camera" size={16} sw={2.2} color="#241A05" />}
                  </View>
                </Pressable>
                <Txt size={12} color={C.gold2} weight="bold" style={{ marginTop: 10 }}>
                  {avatarMesgul ? t("duzenle.avatarYukleniyor") : t("duzenle.avatarDegistir")}
                </Txt>
              </View>

              <Alan
                etiket={t("duzenle.kullaniciAdi")}
                ipucu={t("duzenle.adKural")}
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
                  editable={kilitKalan === 0}
                />
                {!!adNotu && (
                  <Txt size={11.5} color={adNotu.renk} style={{ marginTop: 7 }}>{adNotu.metin}</Txt>
                )}
                {kilitKalan > 0 && (
                  <Txt size={11.5} color={C.red} lh={1.45} style={{ marginTop: 7 }}>
                    {t("duzenle.adKilit", kalanYaz(kilitKalan, t))}
                  </Txt>
                )}
              </Alan>

              <Alan etiket={t("duzenle.adRengi")} ipucu={premiumMi ? t("duzenle.adRengiIpucu") : undefined}>
                {premiumMi ? (
                  <>
                    <View style={styles.renkOnizleme}>
                      <RenkliAd
                        ad={ad || userName}
                        tip="premium"
                        tema={renk}
                        size={19}
                        weight="displayBold"
                        renk="#fff"
                      />
                    </View>
                    <View style={styles.renkler}>
                      <Pressable
                        style={[styles.renkKutu, renk === GOKKUSAGI_ANAHTARI && styles.renkSecili]}
                        onPress={() => renkSec(GOKKUSAGI_ANAHTARI)}
                      >
                        <View style={styles.gokkusagi}>
                          {["#FF4D4D", "#FF9F1C", "#FFE14D", "#3DDC84", "#3D9BFF", "#A855F7"].map((r) => (
                            <View key={r} style={{ flex: 1, backgroundColor: r }} />
                          ))}
                        </View>
                        <Txt size={10.5} color={C.dim} style={{ marginTop: 6 }}>{t("duzenle.gokkusagi")}</Txt>
                      </Pressable>

                      {OZEL_ID_AMBLEMLERI.map((a: OzelIdAmblemi) => (
                        <Pressable
                          key={a}
                          style={[styles.renkKutu, renk === a && styles.renkSecili]}
                          onPress={() => renkSec(a)}
                        >
                          <View style={[styles.renkYuvarlak, { backgroundColor: AMBLEM_RENK[a].g[0], borderColor: AMBLEM_RENK[a].accent }]} />
                          <Txt size={10.5} color={C.dim} style={{ marginTop: 6 }}>{AMBLEM_ADI[a]}</Txt>
                        </Pressable>
                      ))}
                    </View>
                  </>
                ) : (
                  <View style={styles.kilitliKutu}>
                    <Icon name="lock" size={16} sw={2} color={C.dim2} />
                    <Txt size={12.5} color={C.dim} lh={1.45} style={{ flex: 1 }}>
                      {t("duzenle.adRengiKilit")}
                    </Txt>
                  </View>
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
  yuzRozet: {
    position: "absolute", right: -2, bottom: -2,
    width: 32, height: 32, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: C.gold2, borderWidth: 3, borderColor: C.bg,
  },
  alan: { marginBottom: 18 },
  renkOnizleme: {
    alignSelf: "flex-start", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  renkler: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  renkKutu: {
    width: 72, alignItems: "center",
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 6,
    backgroundColor: C.kart, borderWidth: 1.5, borderColor: C.line,
  },
  renkSecili: { borderColor: C.gold2, backgroundColor: "rgba(232,179,65,.1)" },
  renkYuvarlak: { width: 26, height: 26, borderRadius: 13, borderWidth: 2 },
  gokkusagi: { width: 26, height: 26, borderRadius: 13, overflow: "hidden", flexDirection: "row" },
  kilitliKutu: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingVertical: 13, paddingHorizontal: 13,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
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
