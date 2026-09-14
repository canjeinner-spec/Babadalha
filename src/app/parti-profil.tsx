import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AltCubuk, CUBUK_YUKSEKLIGI } from "@/components/AltCubuk";
import { CenterModal } from "@/components/CenterModal";
import { Jeton } from "@/components/JetonGorseli";
import { DilSecici } from "@/components/DilSecici";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { useCeviri } from "@/lib/ceviri";
import { useGorunenAd } from "@/lib/gorunenAd";
import { geriDon } from "@/lib/gezinme";
import { haptic } from "@/lib/haptics";
import { useJeton } from "@/lib/jeton";
import { hataUyar } from "@/lib/uyari";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";

function Kart({ simge, etiket, deger, altYazi, ok, renk, onPress }: {
  simge: IconName;
  etiket: string;
  deger?: string;
  altYazi?: string;
  ok?: boolean;
  renk?: string;
  onPress?: () => void;
}) {
  const govde = (
    <>
      <View style={[styles.kartSimge, !!renk && { borderColor: renk + "3d", backgroundColor: renk + "1a" }]}>
        <Icon name={simge} size={18} sw={2} color={renk ?? C.gold2} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt weight="bold" size={14} color={renk ?? "#fff"}>{etiket}</Txt>
        {!!altYazi && (
          <Txt size={11.5} color={C.dim} style={{ marginTop: 2 }} numberOfLines={1}>{altYazi}</Txt>
        )}
      </View>
      {!!deger && (
        <Txt weight="extrabold" size={13.5} color="rgba(255,255,255,.82)" numberOfLines={1}>{deger}</Txt>
      )}
      {ok && <Icon name="chev" size={17} sw={2.2} color={C.dim2} />}
    </>
  );
  if (!onPress) return <View style={styles.kartSatiri}>{govde}</View>;
  return <Pressable style={styles.kartSatiri} onPress={onPress}>{govde}</Pressable>;
}

const MOCK_GIRIS_DUZENLEMEYE = true;

export default function PartiProfil() {
  const router = useRouter();
  const t = useCeviri();
  const userName = useApp((s) => s.userName);
  const gorunenAd = useGorunenAd((s) => s.ad);
  const userPhoto = useApp((s) => s.userPhoto);
  const session = useApp((s) => s.session);
  const jetonBakiyesi = useJeton((s) => s.bakiye);
  const userBio = useApp((s) => s.userBio);
  const ozelIdTip = useApp((s) => s.ozelIdTip);
  const ozelIdTema = useApp((s) => s.ozelIdTema);
  const signOutApp = useApp((s) => s.signOutApp);
  const [cikisOnayi, setCikisOnayi] = useState(false);
  const [misafirUyarisi, setMisafirUyarisi] = useState(false);
  const [cikiliyor, setCikiliyor] = useState(false);



  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <View style={styles.baslik}>
          <Pressable onPress={() => geriDon()} hitSlop={10} style={styles.geri}>
            <Icon name="back" size={22} color="#fff" />
          </Pressable>
          <Txt weight="displayBold" size={17} color="#fff">{t("profil.baslik")}</Txt>
          <Pressable
            style={styles.jetonDugmesi}
            onPress={() => { haptic.select(); router.push("/jetonlar"); }}
            hitSlop={8}
          >
            <Jeton boyut={19} />
            <Txt weight="extrabold" size={12.5} color={C.gold2}>{String(jetonBakiyesi)}</Txt>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: CUBUK_YUKSEKLIGI + 20 }} showsVerticalScrollIndicator={false}>
          <Pressable
            style={styles.kart}
            onPress={() => {
              haptic.select();
              if (session) router.push("/profil-duzenle");
              else setMisafirUyarisi(true);
            }}
          >
            <Portrait name={gorunenAd.trim() || userName} size={72} photo={userPhoto ?? undefined} halkasiz />

            <View style={{ flex: 1, minWidth: 0, gap: 7 }}>
              <RenkliAd
                ad={gorunenAd.trim() || userName}
                tip={ozelIdTip}
                tema={ozelIdTema}
                size={19}
                weight="displayBold"
                renk="#fff"
              />
              <Txt size={12.5} color={C.dim}>@{userName}</Txt>
              <Txt size={12.5} color={userBio ? C.dim : C.dim2} numberOfLines={2} lh={1.35}>
                {userBio || t("profil.bioYok")}
              </Txt>
            </View>

            <Icon name="chev" size={20} sw={2.2} color={C.dim2} />
          </Pressable>

          <View style={[styles.kume, { marginTop: 4 }]}>
            <Kart
              simge="idcard"
              etiket={t("profil.hesapKart")}
              altYazi={t("profil.hesapKartAlt")}
              ok
              onPress={() => { haptic.select(); router.push({ pathname: "/profil-bilgi", params: { tur: "hesap" } }); }}
            />
            <Kart
              simge="users"
              etiket={t("arkadas.kart")}
              altYazi={t("arkadas.kartAlt")}
              ok
              onPress={() => { haptic.select(); router.push("/arkadaslar"); }}
            />
            <Kart
              simge="evParty"
              etiket={t("profil.partiKart")}
              altYazi={t("profil.partiKartAlt")}
              ok
              onPress={() => { haptic.select(); router.push({ pathname: "/profil-bilgi", params: { tur: "parti" } }); }}
            />
            <DilSecici bicim="kart" />
          </View>

          <Txt weight="extrabold" size={12} color={C.dim2} style={styles.bolumBaslik}>
            {t("profil.belgeler")}
          </Txt>

          <View style={styles.kume}>
            <Kart
              simge="clipboard"
              etiket={t("kurallar.kosullar")}
              ok
              onPress={() => { haptic.select(); router.push({ pathname: "/belge", params: { tur: "kosullar" } }); }}
            />
            <Kart
              simge="shield"
              etiket={t("kurallar.gizlilik")}
              ok
              onPress={() => { haptic.select(); router.push({ pathname: "/belge", params: { tur: "gizlilik" } }); }}
            />
          </View>

          <View style={[styles.kume, { marginTop: 22 }]}>
            {session ? (
              <Kart
                simge="power"
                etiket={t("profil.cikisYap")}
                renk={C.red}
                onPress={() => { haptic.select(); setCikisOnayi(true); }}
              />
            ) : (
              <Kart
                simge="user"
                etiket={t("giris.yap")}
                altYazi={t("profil.misafirNotu")}
                ok
                onPress={() => { haptic.select(); router.push("/giris"); }}
              />
            )}
          </View>

        </ScrollView>
      </SafeAreaView>

      <AltCubuk />

      <CenterModal visible={misafirUyarisi} onClose={() => setMisafirUyarisi(false)}>
        <View style={styles.uyariKart}>
          <Txt weight="displayBold" size={16} color="#fff" align="center">{t("profil.misafirBaslik")}</Txt>
          <Txt size={13} color={C.dim} align="center" lh={1.45} style={{ marginTop: 8 }}>
            {t("profil.misafirMetin")}
          </Txt>
          <View style={styles.uyariDugmeler}>
            <Pressable style={styles.uyariIkincil} onPress={() => setMisafirUyarisi(false)}>
              <Txt weight="extrabold" size={13} color="#fff">{t("genel.vazgec")}</Txt>
            </Pressable>
            <Pressable
              style={[styles.uyariBirincil, { backgroundColor: C.gold2 }]}
              onPress={() => {
                haptic.select();
                setMisafirUyarisi(false);
                router.push(MOCK_GIRIS_DUZENLEMEYE ? "/profil-duzenle" : "/giris");
              }}
            >
              <Txt weight="extrabold" size={13} color="#241A05">{t("giris.yap")}</Txt>
            </Pressable>
          </View>
        </View>
      </CenterModal>

      <CenterModal visible={cikisOnayi} onClose={() => setCikisOnayi(false)}>
        <View style={styles.uyariKart}>
          <Txt weight="displayBold" size={16} color="#fff" align="center">{t("profil.cikisYap")}</Txt>
          <Txt size={13} color={C.dim} align="center" lh={1.45} style={{ marginTop: 8 }}>
            {t("profil.cikisOnayNotu")}
          </Txt>
          <View style={styles.uyariDugmeler}>
            <Pressable style={styles.uyariIkincil} onPress={() => setCikisOnayi(false)}>
              <Txt weight="extrabold" size={13} color="#fff">{t("genel.vazgec")}</Txt>
            </Pressable>
            <Pressable
              style={[styles.uyariBirincil, cikiliyor && { opacity: 0.5 }]}
              disabled={cikiliyor}
              onPress={async () => {
                setCikiliyor(true);
                try {
                  await signOutApp();
                  setCikisOnayi(false);
                  router.replace("/");
                } catch {
                  setCikisOnayi(false);
                  hataUyar(t("profil.cikisHatasi"));
                } finally {
                  setCikiliyor(false);
                }
              }}
            >
              <Txt weight="extrabold" size={13} color="#fff">
                {cikiliyor ? t("profil.cikiliyor") : t("profil.cikisYap")}
              </Txt>
            </Pressable>
          </View>
        </View>
      </CenterModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  uyariKart: {
    backgroundColor: C.card, borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: C.line,
  },
  uyariDugmeler: { flexDirection: "row", gap: 10, marginTop: 18 },
  uyariIkincil: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12,
    borderRadius: 12, backgroundColor: C.kontrol,
  },
  uyariBirincil: {
    flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12,
    borderRadius: 12, backgroundColor: "#B4372F",
  },
  baslik: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14,
  },
  geri: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  jetonDugmesi: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingLeft: 6, paddingRight: 10, paddingVertical: 6, borderRadius: 15,
    backgroundColor: "rgba(232,179,65,.09)", borderWidth: 1, borderColor: "rgba(232,179,65,.22)",
  },
  kart: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    marginTop: 4,
    marginBottom: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,.07)",
  },
  kume: { gap: 10 },
  kartSatiri: {
    flexDirection: "row", alignItems: "center", gap: 11,
    borderRadius: 16, paddingVertical: 13, paddingHorizontal: 13,
    backgroundColor: C.kart, borderWidth: 1, borderColor: C.line,
  },
  kartSimge: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(232,179,65,.09)",
    borderWidth: 1, borderColor: "rgba(232,179,65,.2)",
  },
  bolumBaslik: { marginTop: 22, marginBottom: 9, marginLeft: 4, letterSpacing: 1.1 },
});
