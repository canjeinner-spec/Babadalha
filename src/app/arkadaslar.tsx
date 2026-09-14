import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AltinAmblem } from "@/components/AltinAmblem";
import { CenterModal } from "@/components/CenterModal";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import {
  MOCK_ARKADAS_ACIK, MOCK_ARKADASLAR, MOCK_GELEN_ISTEKLER, MOCK_GIDEN_ISTEKLER,
} from "@/data/arkadasMock";
import {
  arkadaslarim, arkadasligiKabulEt, arkadasligiReddet, gelenIstekler, gidenIstekler,
  istegiGeriAl, TabloYok, type ArkadasKisi,
} from "@/data/remote/sosyalRepo";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { hataUyar, uyar, type UyariCesidi } from "@/lib/uyari";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

type Sekme = "istek" | "arkadas";

const HARF_ESI: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
  â: "a", î: "i", û: "u",
};

function sadelestir(metin: string): string {
  return metin
    .replace(/[ıİşŞğĞüÜöÖçÇâîû]/g, (h) => HARF_ESI[h] ?? h)
    .toLowerCase()
    .trim();
}

function suz(liste: ArkadasKisi[], arama: string): ArkadasKisi[] {
  const a = sadelestir(arama);
  if (!a) return liste;
  return liste.filter((k) => sadelestir(k.ad).includes(a) || sadelestir(k.publicId).includes(a));
}

function Satir({ kisi, onAc, onParti, sag }: {
  kisi: ArkadasKisi; onAc: () => void; onParti?: () => void; sag?: React.ReactNode;
}) {
  const t = useCeviri();
  return (
    <View style={styles.satir}>
      <Pressable style={styles.kimlik} onPress={onAc}>
        <Portrait name={kisi.ad} photo={kisi.foto} size={54} />
        <View style={{ flex: 1, minWidth: 0, gap: 5 }}>
          <View style={styles.adSatiri}>
            <RenkliAd ad={kisi.ad} tip={kisi.ozelIdTip} tema={kisi.ozelIdTema} size={15.5} />
          </View>
          <Txt size={12.5} color={kisi.biyografi ? C.dim : C.dim2} numberOfLines={1}>
            {kisi.biyografi ?? t("arkadas.aciklamaYok")}
          </Txt>
        </View>
      </Pressable>
      {!!kisi.oda && !!onParti && (
        <Pressable style={styles.partiDugmesi} onPress={onParti} hitSlop={6}>
          <AltinAmblem ad="parti" yedek="evParty" boyut={22} />
        </Pressable>
      )}
      {sag}
    </View>
  );
}

function Dugme({ etiket, birincil, onPress, mesgul }: {
  etiket: string; birincil?: boolean; onPress: () => void; mesgul?: boolean;
}) {
  return (
    <Pressable
      style={[styles.dugme, birincil ? styles.dugmeBirincil : styles.dugmeIkincil, mesgul && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={mesgul}
    >
      <Txt weight="extrabold" size={12} color={birincil ? "#1a1206" : "rgba(255,255,255,.85)"}>{etiket}</Txt>
    </Pressable>
  );
}

function Bos({ baslik, alt }: { baslik: string; alt?: string }) {
  return (
    <View style={styles.bos}>
      <View style={styles.bosSimge}>
        <Icon name="users" size={22} sw={1.9} color={C.dim2} />
      </View>
      <Txt weight="bold" size={13.5} color={C.dim} align="center">{baslik}</Txt>
      {!!alt && (
        <Txt size={12} color={C.dim2} align="center" style={{ marginTop: 6, lineHeight: 17 }}>{alt}</Txt>
      )}
    </View>
  );
}

export default function Arkadaslar() {
  const t = useCeviri();
  const router = useRouter();
  const oturum = useApp((s) => s.session);

  const [sekme, setSekme] = useState<Sekme>("arkadas");
  const [arama, setArama] = useState("");
  const [gelen, setGelen] = useState<ArkadasKisi[]>(MOCK_ARKADAS_ACIK ? MOCK_GELEN_ISTEKLER : []);
  const [giden, setGiden] = useState<ArkadasKisi[]>(MOCK_ARKADAS_ACIK ? MOCK_GIDEN_ISTEKLER : []);
  const [dostlar, setDostlar] = useState<ArkadasKisi[]>(MOCK_ARKADAS_ACIK ? MOCK_ARKADASLAR : []);
  const [yukleniyor, setYukleniyor] = useState(!!oturum && !MOCK_ARKADAS_ACIK);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [mesgul, setMesgul] = useState<number | null>(null);
  const [partiOnayi, setPartiOnayi] = useState<ArkadasKisi | null>(null);

  const getir = useCallback(async () => {
    if (!oturum) return;
    const [a, b, c] = await Promise.all([
      gelenIstekler().catch(() => null),
      gidenIstekler().catch(() => null),
      arkadaslarim().catch(() => null),
    ]);
    if (a) setGelen(MOCK_ARKADAS_ACIK ? [...a, ...MOCK_GELEN_ISTEKLER] : a);
    if (b) setGiden(MOCK_ARKADAS_ACIK ? [...b, ...MOCK_GIDEN_ISTEKLER] : b);
    if (c) setDostlar(MOCK_ARKADAS_ACIK ? [...c, ...MOCK_ARKADASLAR] : c);
  }, [oturum]);

  useEffect(() => {
    let acik = true;
    queueMicrotask(() => {
      if (!acik) return;
      getir()
        .then(() => { if (acik) setYukleniyor(false); })
        .catch(() => { if (acik) setYukleniyor(false); });
    });
    return () => { acik = false; };
  }, [getir]);

  const gelenSuzulmus = useMemo(() => suz(gelen, arama), [gelen, arama]);
  const gidenSuzulmus = useMemo(() => suz(giden, arama), [giden, arama]);
  const dostSuzulmus = useMemo(() => suz(dostlar, arama), [dostlar, arama]);

  const yenile = async () => {
    setYenileniyor(true);
    await getir();
    setYenileniyor(false);
  };

  const isle = async (kisi: ArkadasKisi, isi: () => Promise<void>, mesaj: string, cesit: UyariCesidi = "bilgi") => {
    if (mesgul != null) return;
    haptic.select();
    if (kisi.id < 0) {
      setGelen((l) => l.filter((k) => k.id !== kisi.id));
      setGiden((l) => l.filter((k) => k.id !== kisi.id));
      uyar(mesaj, cesit);
      return;
    }
    setMesgul(kisi.id);
    try {
      await isi();
      await getir();
      uyar(mesaj, cesit);
    } catch (e) {
      hataUyar(t(e instanceof TabloYok ? "kisi.baglanmadi" : "duzenle.hata"));
    } finally {
      setMesgul(null);
    }
  };

  const profilAc = (kisi: ArkadasKisi) => {
    haptic.select();
    router.push({
      pathname: "/kisi",
      params: {
        id: kisi.id < 0 ? "" : String(kisi.id),
        ad: kisi.ad,
        kullaniciAdi: kisi.publicId,
        foto: kisi.foto ?? "",
        tip: kisi.ozelIdTip ?? "",
        tema: kisi.ozelIdTema ?? "",
      },
    });
  };

  const istekSekmesi = sekme === "istek";
  const sayac = istekSekmesi
    ? t("arkadas.istekSayac", gelenSuzulmus.length + gidenSuzulmus.length)
    : t("arkadas.sayac", dostSuzulmus.length);

  return (
    <View style={styles.kok}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <View style={styles.sekmeler}>
            {(["istek", "arkadas"] as Sekme[]).map((s) => {
              const secili = sekme === s;
              return (
                <Pressable key={s} onPress={() => { haptic.select(); setSekme(s); }} hitSlop={8}>
                  <View style={styles.sekme}>
                    <Txt
                      weight={secili ? "displayBold" : "bold"}
                      size={17}
                      color={secili ? "#fff" : C.dim2}
                    >
                      {t(s === "istek" ? "arkadas.sekmeIstek" : "arkadas.sekmeArkadas")}
                    </Txt>
                    {s === "istek" && gelen.length > 0 && <View style={styles.nokta} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.aramaKutusu}>
          <Icon name="search" size={17} sw={2} color={C.dim2} />
          <TextInput
            value={arama}
            onChangeText={setArama}
            placeholder={t("arkadas.ara")}
            placeholderTextColor={C.dim2}
            style={styles.aramaGirdi}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {arama !== "" && (
            <Pressable onPress={() => setArama("")} hitSlop={8}>
              <Icon name="x" size={16} sw={2.2} color={C.dim2} />
            </Pressable>
          )}
        </View>

        {!oturum && !MOCK_ARKADAS_ACIK ? (
          <Bos baslik={t("arkadas.girisGerek")} />
        ) : yukleniyor ? (
          <View style={styles.orta}><ActivityIndicator color={C.gold2} /></View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.govde}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={
              <RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={C.gold2} colors={[C.gold2]} />
            }
          >
            <Txt size={12.5} color={C.dim} style={styles.sayac}>{sayac}</Txt>

            {istekSekmesi ? (
              <>
                {gelenSuzulmus.length === 0 && gidenSuzulmus.length === 0 ? (
                  <Bos baslik={arama ? t("arkadas.aramaBos") : t("arkadas.bosIstek")} />
                ) : (
                  gelenSuzulmus.map((k) => (
                    <Satir
                      key={k.id}
                      kisi={k}
                      onAc={() => profilAc(k)}
                      sag={
                        <View style={styles.dugmeler}>
                          <Dugme
                            etiket={t("arkadas.kabul")}
                            birincil
                            mesgul={mesgul === k.id}
                            onPress={() => isle(k, () => arkadasligiKabulEt(k.id), t("arkadas.kabulEdildi", k.ad), "basari")}
                          />
                          <Dugme
                            etiket={t("arkadas.reddet")}
                            mesgul={mesgul === k.id}
                            onPress={() => isle(k, () => arkadasligiReddet(k.id), t("arkadas.reddedildi"))}
                          />
                        </View>
                      }
                    />
                  ))
                )}

                {gidenSuzulmus.length > 0 && (
                  <>
                    <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
                      {t("arkadas.gonderildi")}
                    </Txt>
                    {gidenSuzulmus.map((k) => (
                      <Satir
                        key={k.id}
                        kisi={k}
                        onAc={() => profilAc(k)}
                        sag={
                          <Dugme
                            etiket={t("arkadas.geriAl")}
                            mesgul={mesgul === k.id}
                            onPress={() => isle(k, () => istegiGeriAl(k.id), t("arkadas.geriAlindi"))}
                          />
                        }
                      />
                    ))}
                  </>
                )}
              </>
            ) : dostSuzulmus.length === 0 ? (
              <Bos
                baslik={arama ? t("arkadas.aramaBos") : t("arkadas.bosArkadas")}
                alt={arama ? undefined : t("arkadas.bosArkadasAlt")}
              />
            ) : (
              dostSuzulmus.map((k) => (
                <Satir
                  key={k.id}
                  kisi={k}
                  onAc={() => profilAc(k)}
                  onParti={() => { haptic.select(); setPartiOnayi(k); }}
                />
              ))
            )}
          </ScrollView>
        )}

        <CenterModal visible={partiOnayi != null} onClose={() => setPartiOnayi(null)}>
          <View style={styles.onayKart}>
            <Txt weight="displayBold" size={16} color="#fff" align="center">{t("arkadas.partiOnayBaslik")}</Txt>
            <Txt size={13} color={C.dim} align="center" lh={1.45} style={{ marginTop: 8 }}>
              {t("arkadas.partiOnayMetin", partiOnayi?.publicId ? `@${partiOnayi.publicId}` : (partiOnayi?.ad ?? ""))}
            </Txt>
            {!!partiOnayi?.oda?.ad && (
              <Txt weight="extrabold" size={13.5} color={C.gold2} align="center" style={{ marginTop: 10 }}>
                {partiOnayi.oda.ad}
              </Txt>
            )}
            <View style={styles.onayDugmeler}>
              <Pressable style={styles.onayIkincil} onPress={() => setPartiOnayi(null)}>
                <Txt weight="extrabold" size={13} color="#fff">{t("genel.vazgec")}</Txt>
              </Pressable>
              <Pressable
                style={styles.onayBirincil}
                onPress={() => {
                  const hedef = partiOnayi;
                  setPartiOnayi(null);
                  if (!hedef?.oda) return;
                  haptic.select();
                  if (hedef.id < 0) { uyar(t("arkadas.mockParti")); return; }
                  router.push({ pathname: "/parti-oda", params: { id: hedef.oda.kimlik } });
                }}
              >
                <Txt weight="extrabold" size={13} color="#1a1206">{t("arkadas.partiyeGit")}</Txt>
              </Pressable>
            </View>
          </View>
        </CenterModal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: C.bg },
  tepe: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 12,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  sekmeler: { flexDirection: "row", alignItems: "center", gap: 18 },
  sekme: { flexDirection: "row", alignItems: "flex-start", gap: 4 },
  nokta: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold2, marginTop: 3 },
  aramaKutusu: {
    flexDirection: "row", alignItems: "center", gap: 9,
    marginHorizontal: 16, marginBottom: 6, paddingHorizontal: 13, height: 42,
    borderRadius: 21, backgroundColor: "rgba(255,255,255,.055)",
    borderWidth: 1, borderColor: C.line,
  },
  aramaGirdi: {
    flex: 1, color: "#fff", fontSize: 14, padding: 0,
    includeFontPadding: false,
  },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  sayac: { marginTop: 10, marginBottom: 4, marginLeft: 2 },
  satir: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  kimlik: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 12 },
  adSatiri: { flexDirection: "row", alignItems: "center", gap: 7, flexWrap: "wrap" },
  partiDugmesi: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.1)", borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  onayKart: {
    backgroundColor: C.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.line,
  },
  onayDugmeler: { flexDirection: "row", gap: 10, marginTop: 18 },
  onayIkincil: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12,
    borderRadius: 12, backgroundColor: C.kontrol,
  },
  onayBirincil: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12,
    borderRadius: 12, backgroundColor: C.gold2,
  },
  dugmeler: { flexDirection: "row", gap: 6 },
  dugme: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11 },
  dugmeBirincil: { backgroundColor: C.gold2 },
  dugmeIkincil: { backgroundColor: "rgba(255,255,255,.07)", borderWidth: 1, borderColor: C.line },
  bolumBaslik: { marginTop: 20, marginBottom: 4, marginLeft: 2, letterSpacing: 0.6 },
  orta: { flex: 1, alignItems: "center", justifyContent: "center" },
  bos: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 54 },
  bosSimge: {
    width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: C.line, marginBottom: 14,
  },
});
