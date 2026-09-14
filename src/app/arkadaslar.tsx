import { useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OzelIdGosterim } from "@/components/OzelId";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import {
  arkadaslarim, arkadasligiKabulEt, arkadasligiReddet, gelenIstekler, gidenIstekler,
  istegiGeriAl, TabloYok, type ArkadasKisi,
} from "@/data/remote/sosyalRepo";
import { Icon } from "@/icons/Icon";
import { useCeviri } from "@/lib/ceviri";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

type Sekme = "istek" | "arkadas";

function Satir({ kisi, onAc, sag }: { kisi: ArkadasKisi; onAc: () => void; sag: React.ReactNode }) {
  return (
    <View style={styles.satir}>
      <Pressable style={styles.kimlik} onPress={onAc} hitSlop={4}>
        <Portrait name={kisi.ad} photo={kisi.foto} size={44} />
        <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
          <RenkliAd ad={kisi.ad} tip={kisi.ozelIdTip} tema={kisi.ozelIdTema} size={14.5} />
          {kisi.ozelId ? (
            <View style={{ alignSelf: "flex-start" }}>
              <OzelIdGosterim id={kisi.ozelId} tip={kisi.ozelIdTip} tema={kisi.ozelIdTema} punto={11} kapsulSize={9} />
            </View>
          ) : kisi.publicId ? (
            <Txt size={11.5} color={C.dim} numberOfLines={1}>{`@${kisi.publicId}`}</Txt>
          ) : null}
        </View>
      </Pressable>
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

  const [sekme, setSekme] = useState<Sekme>("istek");
  const [gelen, setGelen] = useState<ArkadasKisi[]>([]);
  const [giden, setGiden] = useState<ArkadasKisi[]>([]);
  const [dostlar, setDostlar] = useState<ArkadasKisi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(!!oturum);
  const [yenileniyor, setYenileniyor] = useState(false);
  const [mesgul, setMesgul] = useState<number | null>(null);
  const [bildirim, setBildirim] = useState("");

  const getir = useCallback(async () => {
    if (!oturum) return;
    const [a, b, c] = await Promise.all([
      gelenIstekler().catch(() => null),
      gidenIstekler().catch(() => null),
      arkadaslarim().catch(() => null),
    ]);
    if (a) setGelen(a);
    if (b) setGiden(b);
    if (c) setDostlar(c);
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

  useEffect(() => {
    if (!bildirim) return;
    const z = setTimeout(() => setBildirim(""), 2200);
    return () => clearTimeout(z);
  }, [bildirim]);

  const yenile = async () => {
    setYenileniyor(true);
    await getir();
    setYenileniyor(false);
  };

  const isle = async (kisi: ArkadasKisi, isi: () => Promise<void>, mesaj: string) => {
    if (mesgul != null) return;
    haptic.select();
    setMesgul(kisi.id);
    try {
      await isi();
      await getir();
      setBildirim(mesaj);
    } catch (e) {
      setBildirim(t(e instanceof TabloYok ? "kisi.baglanmadi" : "duzenle.hata"));
    } finally {
      setMesgul(null);
    }
  };

  const profilAc = (kisi: ArkadasKisi) => {
    haptic.select();
    router.push({
      pathname: "/kisi",
      params: {
        id: String(kisi.id),
        ad: kisi.ad,
        kullaniciAdi: kisi.publicId,
        foto: kisi.foto ?? "",
        tip: kisi.ozelIdTip ?? "",
        tema: kisi.ozelIdTema ?? "",
      },
    });
  };

  return (
    <View style={styles.kok}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.tepe}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("arkadas.baslik")}</Txt>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.sekmeCubugu}>
          {(["istek", "arkadas"] as Sekme[]).map((s) => {
            const secili = sekme === s;
            const sayi = s === "istek" ? gelen.length : dostlar.length;
            return (
              <Pressable key={s} style={styles.sekme} onPress={() => { haptic.select(); setSekme(s); }}>
                <View style={styles.sekmeIc}>
                  <Txt weight={secili ? "extrabold" : "bold"} size={13.5} color={secili ? "#fff" : C.dim}>
                    {t(s === "istek" ? "arkadas.sekmeIstek" : "arkadas.sekmeArkadas")}
                  </Txt>
                  {sayi > 0 && (
                    <Txt weight="extrabold" size={11.5} color={secili ? C.gold2 : C.dim2}>{String(sayi)}</Txt>
                  )}
                </View>
                <View style={[styles.sekmeCizgi, secili && styles.sekmeCizgiAcik]} />
              </Pressable>
            );
          })}
        </View>

        {!oturum ? (
          <Bos baslik={t("arkadas.girisGerek")} />
        ) : yukleniyor ? (
          <View style={styles.orta}><ActivityIndicator color={C.gold2} /></View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.govde}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={yenileniyor} onRefresh={yenile} tintColor={C.gold2} colors={[C.gold2]} />
            }
          >
            {sekme === "istek" ? (
              <>
                {gelen.length === 0 && giden.length === 0 ? (
                  <Bos baslik={t("arkadas.bosIstek")} />
                ) : (
                  <View style={styles.kume}>
                    {gelen.map((k) => (
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
                              onPress={() => isle(k, () => arkadasligiKabulEt(k.id), t("arkadas.kabulEdildi", k.ad))}
                            />
                            <Dugme
                              etiket={t("arkadas.reddet")}
                              mesgul={mesgul === k.id}
                              onPress={() => isle(k, () => arkadasligiReddet(k.id), t("arkadas.reddedildi"))}
                            />
                          </View>
                        }
                      />
                    ))}
                  </View>
                )}

                {giden.length > 0 && (
                  <>
                    <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
                      {t("arkadas.gonderildi")}
                    </Txt>
                    <View style={styles.kume}>
                      {giden.map((k) => (
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
                    </View>
                  </>
                )}
              </>
            ) : dostlar.length === 0 ? (
              <Bos baslik={t("arkadas.bosArkadas")} alt={t("arkadas.bosArkadasAlt")} />
            ) : (
              <View style={styles.kume}>
                {dostlar.map((k) => (
                  <Satir
                    key={k.id}
                    kisi={k}
                    onAc={() => profilAc(k)}
                    sag={<Icon name="chev" size={17} sw={2.2} color={C.dim2} />}
                  />
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {bildirim !== "" && (
          <View style={styles.bildirim}>
            <Txt size={12.5} color="#fff" align="center">{bildirim}</Txt>
          </View>
        )}
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
  sekmeCubugu: {
    flexDirection: "row", marginHorizontal: 16, marginBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line,
  },
  sekme: { flex: 1 },
  sekmeIc: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11,
  },
  sekmeCizgi: { height: 2, borderRadius: 2, backgroundColor: "transparent", marginBottom: -StyleSheet.hairlineWidth },
  sekmeCizgiAcik: { backgroundColor: C.gold2 },
  govde: { paddingHorizontal: 16, paddingBottom: 40 },
  kume: { gap: 8 },
  satir: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kimlik: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 11 },
  dugmeler: { flexDirection: "row", gap: 6 },
  dugme: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 11 },
  dugmeBirincil: { backgroundColor: C.gold2 },
  dugmeIkincil: { backgroundColor: "rgba(255,255,255,.07)", borderWidth: 1, borderColor: C.line },
  bolumBaslik: { marginTop: 22, marginBottom: 9, marginLeft: 4, letterSpacing: 0.6 },
  orta: { flex: 1, alignItems: "center", justifyContent: "center" },
  bos: { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 54 },
  bosSimge: {
    width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.05)", borderWidth: 1, borderColor: C.line, marginBottom: 14,
  },
  bildirim: {
    position: "absolute", left: 20, right: 20, bottom: 26,
    paddingVertical: 11, paddingHorizontal: 16, borderRadius: 14,
    backgroundColor: "rgba(20,16,12,.96)", borderWidth: 1, borderColor: C.line,
  },
});
