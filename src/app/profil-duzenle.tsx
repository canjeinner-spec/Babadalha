import { useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import * as GorselSecici from "expo-image-picker";

import { KeyboardAware } from "@/components/KeyboardAware";
import { Portrait } from "@/components/Portrait";
import { SohbetKirpmasi } from "@/components/SohbetKirpmasi";
import { Txt } from "@/components/Txt";
import { avatarYukle, getMyProfile, setOzelId, updateMyProfile } from "@/data/remote/profileRepo";
import { AMBLEM_ADI, AMBLEM_RENK, OZEL_ID_AMBLEMLERI, type OzelIdAmblemi } from "@/data/specialId";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { adKilidiKalan } from "@/lib/adKilidi";
import { useGorunenAd } from "@/lib/gorunenAd";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

const GOKKUSAGI_ANAHTARI = "gokkusagi";
const MOCK_OTURUMSUZ = true;



function Satir({ etiket, deger, onBas, kilitli }: {
  etiket: string;
  deger: string;
  onBas: () => void;
  kilitli?: boolean;
}) {
  return (
    <Pressable style={styles.satir} onPress={onBas}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="extrabold" size={11.5} color={C.dim2} style={{ letterSpacing: 0.7 }}>
          {etiket.toLocaleUpperCase("tr")}
        </Txt>
        <Txt
          size={16}
          color={deger ? "#fff" : C.dim2}
          numberOfLines={1}
          style={{ marginTop: 5 }}
        >
          {deger}
        </Txt>
      </View>
      <Icon name={kilitli ? "lock" : "edit"} size={17} sw={2} color={kilitli ? C.dim2 : C.gold2} />
    </Pressable>
  );
}

export default function ProfilDuzenle() {
  const t = useCeviri();
  const router = useRouter();
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const setUserPhoto = useApp((s) => s.setUserPhoto);
  const ozelId = useApp((s) => s.ozelId);
  const ozelIdTip = useApp((s) => s.ozelIdTip);
  const ozelIdTema = useApp((s) => s.ozelIdTema);
  const setOzelIdKimlik = useApp((s) => s.setOzelIdKimlik);
  const session = useApp((s) => s.session);
  const baglandi = !!session && isSupabaseConfigured;
  const premiumMi = ozelIdTip === "premium" || (MOCK_OTURUMSUZ && !baglandi);

  const [yukleniyor, setYukleniyor] = useState(true);
  const [ad, setAd] = useState(userName);
  const [biyografi, setBiyografi] = useState("");
  const [ulke, setUlke] = useState("");
  const [sehir, setSehir] = useState("");
  const [bildirim, setBildirim] = useState("");
  const [hata, setHata] = useState("");
  const bakmaRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [kilitKalan, setKilitKalan] = useState(0);
  const [avatarMesgul, setAvatarMesgul] = useState(false);
  const [renk, setRenk] = useState<string>(ozelIdTema ?? GOKKUSAGI_ANAHTARI);
  const gorunenAd = useGorunenAd((s) => s.ad);
  const gorunen = gorunenAd;
  const gosterilenAd = gorunen.trim() || ad || userName;

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

  const ac = useCallback((alan: string) => {
    haptic.select();
    router.push({ pathname: "/profil-alan", params: { alan } });
  }, [router]);

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
    const yerel = secim.assets[0].uri;
    if (!baglandi) {
      setUserPhoto(yerel);
      setBildirim(t("duzenle.kaydedildi"));
      return;
    }
    setAvatarMesgul(true);
    try {
      const adres = await avatarYukle(yerel);
      await updateMyProfile({ profil_resmi: adres });
      setUserPhoto(adres);
      setBildirim(t("duzenle.kaydedildi"));
    } catch {
      setHata(t("duzenle.avatarHatasi"));
    } finally {
      setAvatarMesgul(false);
    }
  }, [avatarMesgul, baglandi, setUserPhoto, t]);

  const renkSec = useCallback(async (yeni: string) => {
    if (!premiumMi) return;
    haptic.select();
    const onceki = renk;
    setRenk(yeni);
    if (!baglandi || !ozelId) {
      setOzelIdKimlik(ozelId, "premium", yeni);
      return;
    }
    try {
      await setOzelId(ozelId, "premium", yeni);
      setOzelIdKimlik(ozelId, "premium", yeni);
    } catch {
      setRenk(onceki);
      setHata(t("duzenle.hata"));
    }
  }, [premiumMi, baglandi, ozelId, renk, setOzelIdKimlik, t]);


  useEffect(() => () => { if (bakmaRef.current) clearTimeout(bakmaRef.current); }, []);

  useEffect(() => {
    if (!bildirim) return;
    const zamanlayici = setTimeout(() => setBildirim(""), 1800);
    return () => clearTimeout(zamanlayici);
  }, [bildirim]);




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
                  <Portrait name={gosterilenAd} size={96} photo={userPhoto ?? undefined} halkasiz />
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

              <View style={styles.liste}>
                <Satir
                  etiket={t("duzenle.ad")}
                  deger={gorunen || t("duzenle.bos")}
                  onBas={() => ac("ad")}
                />
                <Satir
                  etiket={t("duzenle.kullaniciAdi")}
                  deger={`@${ad}`}
                  kilitli={kilitKalan > 0}
                  onBas={() => ac("kullaniciAdi")}
                />
                <Satir
                  etiket={t("duzenle.biyografi")}
                  deger={biyografi || t("duzenle.bos")}
                  onBas={() => ac("biyografi")}
                />
                <Satir
                  etiket={t("duzenle.ulke")}
                  deger={ulke || t("duzenle.bos")}
                  onBas={() => ac("ulke")}
                />
                <Satir
                  etiket={t("duzenle.sehir")}
                  deger={sehir || t("duzenle.bos")}
                  onBas={() => ac("sehir")}
                />
              </View>

              <View style={styles.alan}>
                <Txt weight="extrabold" size={11.5} color={C.dim2} style={{ letterSpacing: 0.7, marginBottom: 12 }}>
                  {t("duzenle.adRengi").toLocaleUpperCase("tr")}
                </Txt>
                {premiumMi ? (
                  <>
                    <View style={styles.renkOnizleme}>
                      <SohbetKirpmasi
                        ad={gosterilenAd}
                        foto={userPhoto ?? undefined}
                        tema={renk}
                        mesaj={t("premium.ornekMesaj")}
                        ad2={t("premium.ornekAd2")}
                        mesaj2={t("premium.ornekMesaj2")}
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
                    {premiumMi && (
                      <Txt size={12} color={C.dim} lh={1.5} style={{ marginTop: 12 }}>
                        {t("duzenle.adRengiIpucu")}
                      </Txt>
                    )}
                    {!baglandi && (
                      <Txt size={11.5} color={C.dim} lh={1.45} style={{ marginTop: 10 }}>
                        {t("duzenle.adRengiDeneme")}
                      </Txt>
                    )}
                  </>
                ) : (
                  <View style={styles.kilitliKutu}>
                    <Icon name="lock" size={16} sw={2} color={C.dim2} />
                    <Txt size={12.5} color={C.dim} lh={1.45} style={{ flex: 1 }}>
                      {t("duzenle.adRengiKilit")}
                    </Txt>
                  </View>
                )}
              </View>



              {hata !== "" && (
                <Txt size={12} color={C.red} lh={1.45} style={{ marginTop: 14 }}>{hata}</Txt>
              )}

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
  liste: { marginBottom: 26 },
  satir: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.08)",
  },
  alan: { marginBottom: 18 },
  renkOnizleme: { marginBottom: 14 },
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
  yaziSatiri: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,.1)",
    paddingBottom: 9,
  },
  yazi: { flex: 1, color: "#fff", fontSize: 17, paddingVertical: 2, paddingHorizontal: 0 },
  yaziCok: { minHeight: 66, fontSize: 15, textAlignVertical: "top", paddingTop: 2 },
  yaziKilitli: { color: "rgba(255,255,255,.45)" },
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
