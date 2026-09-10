import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as EkranYonu from "expo-screen-orientation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GirisGerekli } from "@/components/GirisGerekli";
import { KullaniciYanPanel, type YanPanelKisisi } from "@/components/KullaniciYanPanel";
import { PartiNativeOynatici } from "@/components/PartiNativeOynatici";
import { PartiOynatici, type OynaticiKolu } from "@/components/PartiOynatici";
import { Portrait } from "@/components/Portrait";
import { RenkliAd } from "@/components/RenkliAd";
import { Txt } from "@/components/Txt";
import { UstKaplama } from "@/components/UstKaplama";
import { PARTI_KART_TABANI, type PartiOda as PartiOdaKaydi } from "@/data/partiMock";
import { type PartiSohbetOgesi } from "@/data/partiSohbetMock";
import { PEOPLE } from "@/data/people";
import { amIBannedFromRoom, banRoomUser, getRoomMembers, listRooms, odaKatilimcilariGetir, odaKatilimcilariniDinle, odaSahibi, removeRoomMember, setRoomMemberRole, type OdaKatilimcisi, type OdaSahibi } from "@/data/remote/roomsRepo";
import { type Room } from "@/data/seed";
import { useCachedResource } from "@/lib/cache";
import { isSupabaseConfigured } from "@/lib/supabase";
import { rtcKanalAdi, rtcMotoruGetir } from "@/lib/rtc";
import { DOGRUDAN_ADI, dogrudanMi, girisSayfasiMi, platformBul, type PlatformKodu } from "@/oda/platform";
import {
  atabilirMi,
  mikrofonAcabilirMi,
  rolVerebilirMi,
  sohbetYazabilirMi,
  yetkiVar,
  VARSAYILAN_ODA_AYARI,
  type OdaAyari,
  type PartiRol,
} from "@/parti/yetki";
import { usePartiGiris } from "@/parti/giris";
import { usePartiIzleme } from "@/parti/izleme";
import { odayiLobideYayinla, type LobiYayini } from "@/parti/lobi";
import { saatEsleyiciAc, type SaatEsleyici } from "@/parti/saat";
import {
  beklenenKonum,
  eskiPaketMi,
  paketKimligi,
  partiKanaliAc,
  yankiPenceresinde,
  SAPMA_ESIGI,
  UZAK_UYGULAMA_SOGUMA,
  type OynatimDurumu,
  type PaketKimligi,
  type PartiKanali,
  type PartiKisi,
  type SenkronOlay,
} from "@/parti/senkron";
import { ODAM_ID, kendiOdaKimligi, usePartiOdam } from "@/parti/odam";
import { type OynaticiOlayi } from "@/parti/kopru";
import { type PartiSecim, usePartiKuyruk } from "@/parti/kuyruk";
import { Icon } from "@/icons/Icon";
import { haptic } from "@/lib/haptics";
import { useApp } from "@/store/appStore";
import { C } from "@/theme/colors";
import { Gradient } from "@/theme/Gradient";
import { karart, saydam } from "@/theme/renk";

const AVATAR = 40;


function iyelikEki(ad: string): string {
  const temiz = ad.trim();
  if (!temiz) return "ın";
  const son = temiz[temiz.length - 1].toLocaleLowerCase("tr");
  const sesliler = "aeıioöuü";
  let sonSesli = "a";
  for (let i = temiz.length - 1; i >= 0; i--) {
    const h = temiz[i].toLocaleLowerCase("tr");
    if (sesliler.includes(h)) { sonSesli = h; break; }
  }
  const ek = "aı".includes(sonSesli) ? "ın" : "ei".includes(sonSesli) ? "in" : "ou".includes(sonSesli) ? "un" : "ün";
  return sesliler.includes(son) ? "n" + ek : ek;
}

function karsilamaMetni(sahip: string): string {
  const ad = sahip.trim() || "Oda sahibi";
  return `${ad}'${iyelikEki(ad)} izleme partisine hoş geldin! Film ve dizi izlerken herkesin keyfi yerinde olsun diye küfür, argo ve hakaretten uzak duralım. Sohbet et, eğlen, iyi seyirler!`;
}

const YOL_OYNAT = "M7 4l12 8-12 8V4z";
const YOL_DURAKLAT = "M9 5v14M15 5v14";
const YOL_LINK = "M10 13a5 5 0 007.07 0l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.07 0l-3 3a5 5 0 007.07 7.07l1.71-1.71";
const YOL_GONDER = "M4 12l16-8-6 16-2.5-6.5L4 12z";
const YOL_AT = "M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9h3";
const YOL_GORSEL = "M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6";
const YOL_ARAMA_OYNAT = "M11 4a7 7 0 100 14 7 7 0 000-14zM20.5 20.5L16 16M9.5 8.5l4 2.5-4 2.5z";

function MarkaYazisi() {
  const [hata, setHata] = useState(false);
  if (hata) {
    return <Txt weight="displayBold" size={23} color="#fff" numberOfLines={1}>Aron</Txt>;
  }
  return (
    <Image
      source={require("@/assets/marka/aron-marka.webp")}
      style={{ width: 111, height: 26 }}
      contentFit="contain"
      transition={160}
      onError={() => setHata(true)}
    />
  );
}

function UstBar({ kisi, onKapat, onGezin, onKisiler }: { kisi: number; onKapat: () => void; onGezin: () => void; onKisiler: () => void }) {
  return (
    <View style={styles.ustBar}>
      <Pressable onPress={onKapat} hitSlop={12} style={styles.ustDugme}>
        <Icon name="x" size={29} sw={2.6} color="#fff" />
      </Pressable>
      <Pressable hitSlop={12} style={styles.ustDugme}>
        <Icon name="gear" size={29} sw={2.3} color="#fff" />
      </Pressable>

      <MarkaYazisi />

      <Pressable onPress={onGezin} hitSlop={12} style={styles.ustDugme}>
        <Icon path={YOL_ARAMA_OYNAT} size={29} sw={2.3} color="#fff" />
      </Pressable>
      <Pressable onPress={onKisiler} hitSlop={12} style={styles.ustDugme}>
        <Icon name="users" size={30} sw={2.3} color="#fff" />
        <View style={styles.kisiRozet}>
          <Txt weight="extrabold" size={11.5} color="#0A0910">{kisi}</Txt>
        </View>
      </Pressable>
    </View>
  );
}

function SohbetOgesi({ oge, benimFoto, oynuyor, onOynatDurdur, onDavet }: {
  oge: PartiSohbetOgesi;
  benimFoto?: string;
  oynuyor?: boolean;
  onOynatDurdur?: () => void;
  onDavet?: () => void;
}) {
  if (oge.tur === "katilim") {
    return (
      <View style={styles.katilimSatir}>
        <View style={styles.katilimMetin}>
        <RenkliAd
          ad={oge.kisi}
          tip={oge.ozelIdTip}
          tema={oge.ozelIdTema}
          size={15}
          weight="extrabold"
          renk="#fff"
        />
        <Txt size={15} color="rgba(255,255,255,.72)"> {oge.ayrildi ? "odadan ayrıldı" : "odaya katıldı"}</Txt>
        </View>
        <View style={{ width: 8 }} />
        <Portrait name={oge.kisi} size={AVATAR} photo={oge.foto ?? PEOPLE[oge.kisi]?.photo} halkasiz />
      </View>
    );
  }

  if (oge.tur === "karsilama") {
    return (
      <View style={styles.karsilamaKapsul}>
        <View style={{ paddingTop: 2 }}>
          <Icon name="bell" size={13} color={C.gold2} />
        </View>
        <Txt size={12.5} color="rgba(255,255,255,.8)" lh={1.5} style={{ flexShrink: 1 }}>
          <Txt weight="extrabold" size={12.5} color={C.gold2}>Aron: </Txt>
          {karsilamaMetni(oge.sahip)}
        </Txt>
      </View>
    );
  }

  if (oge.tur === "davet") {
    return (
      <Pressable onPress={onDavet} style={styles.davetSatir}>
        <Icon path={YOL_LINK} size={20} color="#fff" />
        <Txt size={15} color="rgba(255,255,255,.9)">Davet linki: </Txt>
        <Txt size={15} color="#fff" style={styles.altCizgi}>{oge.adres}</Txt>
      </Pressable>
    );
  }

  if (oge.tur === "simdi") {
    return (
      <View style={styles.simdiSatir}>
        {oge.platform && platformBul(oge.platform)?.logo && (
          <Image
            source={platformBul(oge.platform)!.logo}
            style={styles.simdiLogo}
            contentFit="contain"
            transition={0}
          />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt size={15} color="rgba(255,255,255,.9)" lh={1.35}>
            <Txt weight="extrabold" size={15} color="#fff">{oge.baslik}</Txt> oynatılıyor
          </Txt>
        </View>
        <Pressable hitSlop={8} onPress={onOynatDurdur}>
          <Icon path={oynuyor ? YOL_DURAKLAT : YOL_OYNAT} size={22} sw={2} color="#fff" />
        </Pressable>

      </View>
    );
  }

  if (oge.benim) {
    return (
      <View style={styles.benimSatir}>
        <View style={{ flexShrink: 1, alignItems: "flex-end", gap: 3 }}>
          <RenkliAd
            ad={oge.kisi}
            tip={oge.ozelIdTip}
            tema={oge.ozelIdTema}
            size={14.5}
            weight="extrabold"
            renk="#fff"
          />
          <Txt size={15} color="#fff" style={{ textAlign: "right" }} lh={1.35}>{oge.metin}</Txt>
        </View>
        <Portrait name={oge.kisi} size={AVATAR} photo={benimFoto ?? PEOPLE[oge.kisi]?.photo} halkasiz />
      </View>
    );
  }

  return (
    <View style={styles.mesajSatir}>
      <View>
        <Portrait name={oge.kisi} size={AVATAR} photo={PEOPLE[oge.kisi]?.photo} halkasiz />
        {oge.tac && (
          <View style={styles.tac}>
            <Icon name="crown" size={13} color="#fff" fill="#fff" />
          </View>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <RenkliAd
          ad={oge.kisi}
          tip={oge.ozelIdTip}
          tema={oge.ozelIdTema}
          size={14.5}
          weight="extrabold"
          renk="#fff"
          style={{ alignSelf: "flex-start" }}
        />
        <Txt size={15} color="#fff" lh={1.35}>{oge.metin}</Txt>
      </View>
    </View>
  );
}

function AltBar({ altPay, onGonder, onDavet, onKisiler, mikAcilir, mikAcik, onMik, sohbetAcik, kilitDegistir }: {
  altPay: number;
  onGonder: (metin: string) => void;
  onDavet: () => void;
  onKisiler: () => void;
  mikAcilir: boolean;
  mikAcik: boolean;
  onMik: () => void;
  sohbetAcik: boolean;
  kilitDegistir?: () => void;
}) {
  const [metin, setMetin] = useState("");
  const yaziliyor = metin.trim().length > 0;

  const gonder = () => {
    const t = metin.trim();
    if (!t) return;
    haptic.select();
    onGonder(t);
    setMetin("");
  };

  return (
    <View style={[styles.altBar, { paddingBottom: altPay }]}>
      <Pressable
        onPress={() => { if (!mikAcilir) return; haptic.select(); onMik(); }}
        style={[styles.mikDugme, mikAcik && { backgroundColor: C.gold2 }, !mikAcilir && { opacity: 0.45 }]}
      >
        <Icon name={mikAcik ? "mic" : "micOff"} size={26} sw={2} color="#141018" />
      </Pressable>

      <TextInput
        editable={sohbetAcik}
        placeholder={sohbetAcik ? "Sohbet" : "Sohbet kapalı"}
        placeholderTextColor="rgba(255,255,255,.55)"
        style={styles.giris}
        value={metin}
        onChangeText={setMetin}
        onSubmitEditing={gonder}
        returnKeyType="send"
        blurOnSubmit={false}
      />

      {yaziliyor ? (
        <Pressable onPress={gonder} hitSlop={8} style={styles.gonderDugme}>
          <Icon path={YOL_GONDER} size={21} sw={2.2} color="#241A05" />
        </Pressable>
      ) : (
        <View style={styles.altIkonlar}>
          <Pressable hitSlop={6}><Icon path={YOL_AT} size={22} color="#fff" /></Pressable>
          <Pressable hitSlop={6}><Icon path={YOL_GORSEL} size={22} color="#fff" /></Pressable>
          <Pressable hitSlop={6} onPress={onDavet}><Icon path={YOL_LINK} size={22} color="#fff" /></Pressable>
          {kilitDegistir && (
            <Pressable hitSlop={6} onPress={() => { haptic.select(); kilitDegistir(); }}>
              <Icon name={sohbetAcik ? "unlock" : "lock"} size={22} color={sohbetAcik ? "#fff" : C.gold2} />
            </Pressable>
          )}
          <Pressable hitSlop={6} onPress={onKisiler}><Icon name="userAdd" size={22} color="#fff" /></Pressable>
        </View>
      )}
    </View>
  );
}

export default function PartiOda() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, platform: platformKodu, adres: adresParam } = useLocalSearchParams<{ id?: string; platform?: string; adres?: string }>();
  const userName = useApp((s) => s.userName);
  const userPhoto = useApp((s) => s.userPhoto);
  const ozelIdTip = useApp((s) => s.ozelIdTip);
  const ozelIdTema = useApp((s) => s.ozelIdTema);

  const myDbId = useApp((s) => s.dbId);
  const kendiKimlik = kendiOdaKimligi(myDbId);
  const kanalOdaId = id && id !== ODAM_ID ? id : kendiKimlik;
  const { data: dbRooms = [] } = useCachedResource<Room[]>(
    "rooms:list",
    () => listRooms(),
    { persist: true, enabled: isSupabaseConfigured },
  );

  const odam = usePartiOdam((s) => s.odam);
  const oda = useMemo<PartiOdaKaydi>(() => {
    if ((!id || id === ODAM_ID || id === kendiKimlik) && odam) return odam;
    const gercek = dbRooms.find((o) => o.id === id && o.mod === "parti");
    if (gercek) return { ...gercek, platform: (gercek as Partial<PartiOdaKaydi>).platform ?? "youtube", kapak: (gercek as Partial<PartiOdaKaydi>).kapak ?? PARTI_KART_TABANI.kapak };
    return {
      ...PARTI_KART_TABANI,
      id: kanalOdaId,
      platform: (platformKodu as PlatformKodu | undefined) ?? PARTI_KART_TABANI.platform,
    };
  }, [dbRooms, id, platformKodu, odam, kendiKimlik, kanalOdaId]);
  const ilkPlatform = (platformKodu as PlatformKodu | undefined) ?? oda.platform;
  const oynatici = useRef<OynaticiKolu>(null);
  const [oynuyor, setOynuyor] = useState(false);
  const [simdiki, setSimdiki] = useState<string | null>(null);
  const [sonAdres, setSonAdres] = useState<string | null>(null);
  const [simdikiKapak, setSimdikiKapak] = useState<string | null>(null);
  const [kip, setKip] = useState<"gezinme" | "oynatim">("gezinme");
  const [buyuk, setBuyuk] = useState(false);
  const [yanSohbet, setYanSohbet] = useState(false);
  const [sahneRengi, setSahneRengi] = useState<string | null>(null);
  const [oynatilan, setOynatilan] = useState<{ platform: PlatformKodu; adres: string }>(() => ({
    platform: ilkPlatform,
    adres: dogrudanMi(ilkPlatform)
      ? (adresParam ?? "")
      : (platformBul(ilkPlatform)?.adres ?? "https://www.youtube.com"),
  }));
  const [simdiSecim, setSimdiSecim] = useState<PartiSecim | null>(null);
  const [oynatimNo, setOynatimNo] = useState(0);
  const [ek, setEk] = useState<PartiSohbetOgesi[]>([]);
  const [bildirim, setBildirim] = useState("");
  const akis = useRef<ScrollView>(null);
  const [kisilerAcik, setKisilerAcik] = useState(false);
  const [ustYukseklik, setUstYukseklik] = useState(0);
  const [agKisileri, setAgKisileri] = useState<PartiKisi[]>([]);
  const kanalRef = useRef<PartiKanali | null>(null);
  const lobiRef = useRef<LobiYayini | null>(null);
  const yayinBilgiRef = useRef<{
    ad: string; sahip: string; sahipFoto?: string; platform: PlatformKodu; baslik: string | null;
  }>({ ad: "", sahip: "", platform: "youtube", baslik: null });
  const uzakBitisRef = useRef(0);
  const sonYayinRef = useRef(0);
  const askidaRef = useRef(false);
  const askiKaydiRef = useRef<{ konum: number; oynuyor: boolean; an: number } | null>(null);
  const saatRef = useRef<SaatEsleyici | null>(null);
  const siraRef = useRef(0);
  const sonPaketRef = useRef<PaketKimligi | null>(null);
  const sonKonumRef = useRef(0);
  const oynuyorRef = useRef(false);
  const benSahipRef = useRef(false);
  const [dbRol, setDbRol] = useState<PartiRol | null>(null);
  const [canliRol, setCanliRol] = useState<PartiRol | null>(null);
  const [odaAyari, setOdaAyari] = useState<OdaAyari>(VARSAYILAN_ODA_AYARI);
  const [mikrofonIzinleri, setMikrofonIzinleri] = useState<Record<string, boolean>>({});
  const [mikIstek, setMikIstek] = useState(false);
  const [girisGerekli, setGirisGerekli] = useState(false);
  const [devamHedefi, setDevamHedefi] = useState<{ konum: number; an: number } | null>(null);
  const [sonKonum, setSonKonum] = useState(0);
  const [sure, setSure] = useState(0);
  const girisYukle = usePartiGiris((s) => s.yukle);
  useEffect(() => { girisYukle(); }, [girisYukle]);

  useEffect(() => {
    if (id) return;
    const p = platformBul(ilkPlatform);
    usePartiOdam.getState().ac({
      ...PARTI_KART_TABANI,
      id: kanalOdaId,
      name: `${userName} · ${p?.ad ?? (dogrudanMi(ilkPlatform) ? DOGRUDAN_ADI : "Parti")}`,
      host: userName,
      online: 1,
      extra: 1,
      crowd: [],
      platform: ilkPlatform,
      owner: true,
    });
  }, [id, ilkPlatform, userName, kanalOdaId]);

  const cik = useCallback(() => {
    if (!id || id === ODAM_ID || id === kendiKimlik) usePartiOdam.getState().kapat();
    router.back();
  }, [id, kendiKimlik, router]);

  const boyutDegistir = useCallback(() => {
    haptic.select();
    setBuyuk((onceki) => {
      const hedef = !onceki;
      EkranYonu.lockAsync(
        hedef ? EkranYonu.OrientationLock.LANDSCAPE : EkranYonu.OrientationLock.PORTRAIT_UP,
      ).catch(() => {});
      return hedef;
    });
  }, []);

  useEffect(() => () => { EkranYonu.unlockAsync().catch(() => {}); }, []);

  const baslat = useCallback((s: PartiSecim) => {
    setOynatimNo((n) => n + 1);
    setKip("gezinme");
    setOynatilan({ platform: s.platform, adres: s.adres });
    setSimdiSecim(s);
    setSimdiki(s.baslik);
    setSimdikiKapak(null);
    setSahneRengi(null);
    setOynuyor(false);
    setSonKonum(0);
    setEk((e) => [...e, { tur: "simdi", anahtar: "s" + s.anahtar, baslik: s.baslik ?? "Video", platform: s.platform }]);
    const p = platformBul(s.platform);
    const girisLazim = !!p?.hesapGerekir && !usePartiGiris.getState().girilmisMi(s.platform);
    setGirisGerekli(girisLazim);
    setDevamHedefi(girisLazim ? { konum: 0, an: Date.now() } : null);
  }, []);

  useFocusEffect(useCallback(() => {
    const bekleyen = usePartiKuyruk.getState().bekleyen;
    if (bekleyen) {
      usePartiKuyruk.getState().tuket();
      baslat(bekleyen);
    }
  }, [baslat]));

  const benSahip = !id || id === ODAM_ID || id === kendiKimlik;
  const benimRol: PartiRol = benSahip ? "sahip" : (canliRol ?? dbRol ?? "uye");
  const kontrolBende = benSahip || yetkiVar(benimRol, "oynatimKontrol");

  const benimAnahtar = myDbId != null ? `u${myDbId}` : `konuk-${oda.id}`;
  const mikAcilir = mikrofonAcabilirMi(benimRol, odaAyari, !!mikrofonIzinleri[benimAnahtar]);
  const mikYayinda = mikIstek && mikAcilir;

  const saatSapmasi = useCallback(() => saatRef.current?.sapma() ?? 0, []);

  const suankiDurum = useCallback((): OynatimDurumu => {
    siraRef.current += 1;
    return {
      platform: oynatilan.platform,
      adres: sonAdres ?? oynatilan.adres,
      baslik: simdiki,
      kapak: simdikiKapak,
      konum: sonKonum,
      oynuyor,
      an: Date.now() + saatSapmasi(),
      sira: siraRef.current,
      kaynak: benimAnahtar,
    };
  }, [oynatilan, sonAdres, simdiki, simdikiKapak, sonKonum, oynuyor, benimAnahtar, saatSapmasi]);

  const yayinlayabilirMi = useCallback(() => (
    kontrolBende && !askidaRef.current && !yankiPenceresinde(uzakBitisRef.current)
  ), [kontrolBende]);

  const durumYayinla = useCallback((zorla = false) => {
    if (!kanalRef.current || !kontrolBende) return;
    if (!zorla && !yayinlayabilirMi()) return;
    sonYayinRef.current = Date.now();
    kanalRef.current.oynatimYayinla(suankiDurum());
  }, [kontrolBende, suankiDurum, yayinlayabilirMi]);

  const durumUygula = useCallback((d: OynatimDurumu) => {
    if (askidaRef.current) return;
    if (eskiPaketMi(sonPaketRef.current, d)) return;
    const kimlik = paketKimligi(d);
    if (kimlik) sonPaketRef.current = kimlik;
    uzakBitisRef.current = Date.now() + UZAK_UYGULAMA_SOGUMA;
    const farkliIcerik = d.platform !== oynatilan.platform || d.adres !== oynatilan.adres;
    if (farkliIcerik && d.adres) {
      setOynatimNo((n) => n + 1);
      setOynatilan({ platform: d.platform, adres: d.adres });
      setSimdiki(d.baslik);
      setSimdikiKapak(d.kapak ?? null);
      setKip("oynatim");
      setEk((e) => [...e, {
        tur: "simdi", anahtar: "s" + d.an, baslik: d.baslik ?? "Video", platform: d.platform,
      }]);
      return;
    }
    const hedef = beklenenKonum(d, Date.now(), saatSapmasi());
    if (Math.abs(hedef - sonKonum) > SAPMA_ESIGI) oynatici.current?.atla(hedef);
    if (d.oynuyor && !oynuyor) oynatici.current?.oynat();
    if (!d.oynuyor && oynuyor) oynatici.current?.duraklat();
    if (d.baslik && d.baslik !== simdiki) setSimdiki(d.baslik);
  }, [oynatilan, sonKonum, oynuyor, simdiki, saatSapmasi]);

  const benimRolRef = useRef<PartiRol>("uye");
  const odaAyariRef = useRef(odaAyari);
  const benimAnahtarRef = useRef(benimAnahtar);
  const cikRef = useRef(cik);
  useEffect(() => { benimRolRef.current = benimRol; }, [benimRol]);
  useEffect(() => { odaAyariRef.current = odaAyari; }, [odaAyari]);
  useEffect(() => { benimAnahtarRef.current = benimAnahtar; }, [benimAnahtar]);
  useEffect(() => { cikRef.current = cik; }, [cik]);
  useEffect(() => { sonKonumRef.current = sonKonum; }, [sonKonum]);
  useEffect(() => { oynuyorRef.current = oynuyor; }, [oynuyor]);
  useEffect(() => { benSahipRef.current = benSahip; }, [benSahip]);

  const senkronOlay = useCallback((o: SenkronOlay) => {
    if (o.tur === "kisiler") {
      setAgKisileri(o.kisiler);
    } else if (o.tur === "katildi") {
      setEk((e) => [...e, { tur: "katilim", anahtar: `g${o.kisi.anahtar}-${Date.now()}`, kisi: o.kisi.ad, foto: o.kisi.foto, ozelIdTip: o.kisi.ozelIdTip ?? null, ozelIdTema: o.kisi.ozelIdTema ?? null }]);
    } else if (o.tur === "ayrildi") {
      setEk((e) => [...e, { tur: "katilim", anahtar: `c${o.kisi.anahtar}-${Date.now()}`, kisi: o.kisi.ad, foto: o.kisi.foto, ozelIdTip: o.kisi.ozelIdTip ?? null, ozelIdTema: o.kisi.ozelIdTema ?? null, ayrildi: true }]);
    } else if (o.tur === "sohbet") {
      setEk((e) => [...e, {
        tur: "mesaj", anahtar: o.mesaj.anahtar, kisi: o.mesaj.kisi, metin: o.mesaj.metin,
        ozelIdTip: o.mesaj.ozelIdTip ?? null, ozelIdTema: o.mesaj.ozelIdTema ?? null,
      }]);
    } else if (o.tur === "oynatim") {
      durumUygula(o.durum);
    } else if (o.tur === "durumSor") {
      durumYayinla(true);
      if (yetkiVar(benimRolRef.current, "sohbetKilit")) kanalRef.current?.odaAyariYayinla(odaAyariRef.current);
    } else if (o.tur === "saatIstek") {
      if (benSahipRef.current) kanalRef.current?.saatYanitYolla(o.soran, o.t0, Date.now());
    } else if (o.tur === "saatYanit") {
      saatRef.current?.yanit(o.t0, o.t1);
    } else if (o.tur === "yetki") {
      setAgKisileri((liste) => liste.map((k) => (k.anahtar === o.anahtar ? { ...k, rol: o.rol } : k)));
      if (o.anahtar === benimAnahtarRef.current) {
        setCanliRol(o.rol);
        setBildirim(o.rol === "yardimci" ? "Parti Yardımcısı yapıldın" : "Yardımcılığın alındı");
      }
    } else if (o.tur === "atildi") {
      if (o.anahtar === benimAnahtarRef.current) {
        setBildirim("Odadan çıkarıldın");
        setTimeout(() => cikRef.current(), 900);
      } else {
        setAgKisileri((liste) => liste.filter((k) => k.anahtar !== o.anahtar));
      }
    } else if (o.tur === "odaAyari") {
      setOdaAyari(o.ayar);
    } else if (o.tur === "mikrofonIzin") {
      setMikrofonIzinleri((m) => ({ ...m, [o.anahtar]: o.acik }));
      if (o.anahtar === benimAnahtarRef.current) {
        setBildirim(o.acik ? "Mikrofonun açıldı" : "Mikrofonun kapatıldı");
      }
    } else if (o.tur === "baglanti" && o.acik) {
      setEk((e) => (
        e.some((x) => x.anahtar === "ben-katildim")
          ? e
          : [...e, {
              tur: "katilim", anahtar: "ben-katildim", kisi: userName,
              foto: userPhoto ?? undefined, ozelIdTip, ozelIdTema,
            }]
      ));
      if (!benSahip) {
        kanalRef.current?.durumIste();
        setTimeout(() => kanalRef.current?.durumIste(), 1200);
        setTimeout(() => kanalRef.current?.durumIste(), 3500);
      }
    }
  }, [durumUygula, durumYayinla, userName, userPhoto, ozelIdTip, ozelIdTema, benSahip]);

  const senkronOlayRef = useRef(senkronOlay);
  useEffect(() => { senkronOlayRef.current = senkronOlay; }, [senkronOlay]);


  useEffect(() => {
    const kanal = partiKanaliAc({
      odaId: kanalOdaId,
      ben: {
        anahtar: benimAnahtar,
        ad: userName,
        foto: userPhoto ?? undefined,
        sahip: benSahip,
        rol: benimRolRef.current,
        dbId: myDbId,
        ozelIdTip,
        ozelIdTema,
      },
      onOlay: (o) => senkronOlayRef.current(o),
    });
    kanalRef.current = kanal;
    return () => {
      kanal.kapat();
      kanalRef.current = null;
    };
  }, [kanalOdaId, benimAnahtar, userName, userPhoto, benSahip, myDbId, ozelIdTip, ozelIdTema]);

  useEffect(() => {
    if (benSahip) return;
    const esleyici = saatEsleyiciAc({
      yollaIstek: (t0) => kanalRef.current?.saatIsteYolla(benimAnahtar, t0),
    });
    saatRef.current = esleyici;
    esleyici.basla();
    return () => {
      esleyici.durdur();
      saatRef.current = null;
    };
  }, [benSahip, benimAnahtar, kanalOdaId]);

  useEffect(() => {
    const abone = AppState.addEventListener("change", (durum) => {
      if (durum !== "active") {
        if (askidaRef.current) return;
        askidaRef.current = true;
        askiKaydiRef.current = { konum: sonKonumRef.current, oynuyor: oynuyorRef.current, an: Date.now() };
        return;
      }
      if (!askidaRef.current) return;
      askidaRef.current = false;
      uzakBitisRef.current = Date.now() + UZAK_UYGULAMA_SOGUMA;
      saatRef.current?.basla();
      const kayit = askiKaydiRef.current;
      askiKaydiRef.current = null;
      if (!benSahipRef.current) {
        kanalRef.current?.durumIste();
        return;
      }
      if (!kayit?.oynuyor) return;
      oynatici.current?.atla(kayit.konum + (Date.now() - kayit.an) / 1000);
      oynatici.current?.oynat();
    });
    return () => abone.remove();
  }, []);

  useEffect(() => {
    if (!benSahip) return;
    const t = setInterval(() => {
      if (Date.now() - sonYayinRef.current > 1000) durumYayinla();
    }, 1200);
    return () => clearInterval(t);
  }, [benSahip, durumYayinla]);

  useEffect(() => {
    yayinBilgiRef.current = {
      ad: oda.name,
      sahip: userName,
      sahipFoto: userPhoto ?? undefined,
      platform: oynatilan.platform,
      baslik: simdiki,
    };
  });

  useEffect(() => {
    if (!benSahip || kip !== "oynatim") return;
    const b = yayinBilgiRef.current;
    const lobi = odayiLobideYayinla({
      odaId: kanalOdaId,
      ad: b.ad,
      sahip: b.sahip,
      sahipFoto: b.sahipFoto,
      platform: b.platform,
      baslik: b.baslik,
      kapak: null,
      kisi: 1,
      ilerleme: 0,
      an: Date.now(),
    });
    lobiRef.current = lobi;
    return () => {
      lobi.kapat();
      lobiRef.current = null;
    };
  }, [benSahip, kanalOdaId, kip]);

  const kabaIlerleme = sure > 0 ? Math.round(Math.max(0, Math.min(1, sonKonum / sure)) * 20) : 0;

  useEffect(() => {
    lobiRef.current?.guncelle({
      platform: oynatilan.platform,
      baslik: simdiki,
      kapak: simdikiKapak,
      kisi: Math.max(1, agKisileri.length),
      ilerleme: kabaIlerleme / 20,
    });
  }, [oynatilan.platform, simdiki, simdikiKapak, agKisileri.length, kabaIlerleme]);

  const olayGeldi = useCallback((o: OynaticiOlayi) => {
    if (o.tur === "sure") {
      setSure(o.sure);
      return;
    }
    if (o.tur === "hazir" && o.sure > 0) setSure(o.sure);
    if (o.tur === "konum" || o.tur === "atla") {
      setSonKonum(o.konum);
      if (o.tur === "atla" && yayinlayabilirMi()) {
        setTimeout(() => {
          if (!kanalRef.current || !yayinlayabilirMi()) return;
          siraRef.current += 1;
          sonYayinRef.current = Date.now();
          kanalRef.current.oynatimYayinla({
            platform: oynatilan.platform,
            adres: sonAdres ?? oynatilan.adres,
            baslik: simdiki,
            kapak: null,
            konum: o.konum,
            oynuyor,
            an: Date.now() + saatSapmasi(),
            sira: siraRef.current,
            kaynak: benimAnahtar,
          });
        }, 0);
      }
      return;
    }
    if (o.tur === "renk") { setSahneRengi(o.renk); return; }
    if (o.tur === "oynat") {
      if (!o.izleme) return;
      setOynuyor(true);
      setKip("oynatim");
      oynatici.current?.sadelestir();
      usePartiGiris.getState().isaretle(oynatilan.platform);
      setGirisGerekli(false);
      if (devamHedefi) {
        const hedef = devamHedefi.konum + (Date.now() - devamHedefi.an) / 1000;
        if (hedef > 3) oynatici.current?.atla(hedef);
        setDevamHedefi(null);
      }
      if (!simdiSecim) {
        const s: PartiSecim = {
          anahtar: String(Date.now()), platform: oynatilan.platform,
          adres: sonAdres ?? oynatilan.adres, baslik: simdiki, secen: userName, secenFoto: userPhoto ?? undefined,
        };
        setSimdiSecim(s);
        setEk((e) => [...e, { tur: "simdi", anahtar: "s" + s.anahtar, baslik: s.baslik ?? "Video", platform: s.platform }]);
      }
      setTimeout(() => durumYayinla(), 0);
    } else if (o.tur === "duraklat") {
      if (askidaRef.current) return;
      setOynuyor(false);
      setTimeout(() => durumYayinla(), 0);
    } else if (o.tur === "bitti") {
      setOynuyor(false);
      setSimdiSecim(null);
    } else if (o.tur === "bilgi") {
      setSimdiki(o.baslik);
      setSonAdres(o.adres);
      if (o.kapak) setSimdikiKapak(o.kapak);
      oynatici.current?.sadelestir();
      if (o.izleme) {
        usePartiIzleme.getState().bildir(kanalOdaId, {
          baslik: o.baslik,
          kapak: o.kapak ?? null,
          platform: oynatilan.platform,
        });
      }
      if (simdiSecim && platformBul(oynatilan.platform)?.hesapGerekir && girisSayfasiMi(o.adres)) {
        setGirisGerekli(true);
        setDevamHedefi((d) => d ?? { konum: sonKonum, an: Date.now() });
      }
    } else if (o.tur === "hazir" && o.izleme) {
      setKip("oynatim");
      oynatici.current?.sadelestir();
    }
  }, [simdiSecim, oynatilan, sonAdres, simdiki, userName, userPhoto, devamHedefi, sonKonum, kanalOdaId, oynuyor, durumYayinla, yayinlayabilirMi, saatSapmasi, benimAnahtar]);

  const oynatilanPlatform = platformBul(oynatilan.platform);

  const davetAdresi = `aron.watch/${oda.id.replace(/[^a-z0-9]/gi, "").slice(-6) || "parti"}`;

  const davetKopyala = useCallback(() => {
    haptic.select();
    Clipboard.setStringAsync(`https://${davetAdresi}`).catch(() => {});
    setBildirim("Davet linki kopyalandı");
  }, [davetAdresi]);

  const mesajGonder = useCallback((metin: string) => {
    if (!sohbetYazabilirMi(benimRolRef.current, odaAyariRef.current)) {
      setBildirim("Sohbet kapalı");
      return;
    }
    const anahtar = "m" + Date.now();
    setEk((e) => [...e, {
      tur: "mesaj", anahtar, kisi: userName, metin,
      benim: true, ozelIdTip, ozelIdTema,
    }]);
    kanalRef.current?.sohbetYolla({
      anahtar, kisi: userName, metin, foto: userPhoto ?? undefined,
      ozelIdTip, ozelIdTema, an: Date.now(),
    });
  }, [userName, userPhoto, ozelIdTip, ozelIdTema]);

  useEffect(() => {
    if (!bildirim) return;
    const t = setTimeout(() => setBildirim(""), 1600);
    return () => clearTimeout(t);
  }, [bildirim]);

  const ogeler = useMemo(() => {
    const temel: PartiSohbetOgesi[] = [
      { tur: "karsilama", anahtar: "karsilama", sahip: benSahip ? userName : oda.host },
    ];
    const canli = ek.map((o) => {
      if (o.tur === "simdi" && simdiSecim && o.anahtar === "s" + simdiSecim.anahtar && simdiki) return { ...o, baslik: simdiki };
      return o;
    });
    return [...temel, ...canli];
  }, [ek, simdiSecim, simdiki, benSahip, userName, oda.host]);

  const [katilimcilar, setKatilimcilar] = useState<OdaKatilimcisi[]>([]);
  const [sahip, setSahip] = useState<OdaSahibi | null>(null);

  const dbId = oda.dbId ?? null;

  const rolDegistir = useCallback(async (hedef: PartiKisi, yeniRol: PartiRol) => {
    if (!rolVerebilirMi(benimRolRef.current, hedef.rol)) return;
    kanalRef.current?.yetkiYayinla(hedef.anahtar, yeniRol);
    setAgKisileri((liste) => liste.map((k) => (k.anahtar === hedef.anahtar ? { ...k, rol: yeniRol } : k)));
    setBildirim(yeniRol === "yardimci" ? `${hedef.ad} yardımcı yapıldı` : `${hedef.ad} yardımcılıktan alındı`);
    if (dbId != null && hedef.dbId != null) {
      try { await setRoomMemberRole(dbId, hedef.dbId, yeniRol === "yardimci" ? "yardimci" : "uye"); }
      catch { setBildirim("Rol kaydedilemedi"); }
    }
  }, [dbId]);

  const odadanAt = useCallback(async (hedef: PartiKisi) => {
    if (!atabilirMi(benimRolRef.current, hedef.rol)) return;
    kanalRef.current?.atmaYayinla(hedef.anahtar);
    setAgKisileri((liste) => liste.filter((k) => k.anahtar !== hedef.anahtar));
    setBildirim(`${hedef.ad} odadan çıkarıldı`);
    if (dbId != null && hedef.dbId != null) {
      try {
        await banRoomUser(dbId, hedef.dbId);
        await removeRoomMember(dbId, hedef.dbId);
      } catch { setBildirim("Yasaklama kaydedilemedi"); }
    }
  }, [dbId]);

  const odaAyariDegistir = useCallback((yama: Partial<OdaAyari>) => {
    if (!yetkiVar(benimRolRef.current, "sohbetKilit")) return;
    setOdaAyari((a) => {
      const yeni = { ...a, ...yama };
      kanalRef.current?.odaAyariYayinla(yeni);
      return yeni;
    });
  }, []);

  const mikrofonIzniDegistir = useCallback((hedef: PartiKisi, acik: boolean) => {
    if (!yetkiVar(benimRolRef.current, "mikrofonAyar")) return;
    setMikrofonIzinleri((m) => ({ ...m, [hedef.anahtar]: acik }));
    kanalRef.current?.mikrofonIzniYayinla(hedef.anahtar, acik);
    setBildirim(acik ? `${hedef.ad} mikrofonu açabilir` : `${hedef.ad} mikrofonu kapatıldı`);
  }, []);

  useEffect(() => {
    kanalRef.current?.kendiniGuncelle({
      anahtar: benimAnahtar,
      ad: userName,
      foto: userPhoto ?? undefined,
      sahip: benSahip,
      rol: benimRol,
      dbId: myDbId,
      yayinda: mikYayinda,
      ozelIdTip,
      ozelIdTema,
    });
  }, [benimRol, mikYayinda, benimAnahtar, userName, userPhoto, benSahip, myDbId, ozelIdTip, ozelIdTema]);

  const rtc = useMemo(() => rtcMotoruGetir(), []);
  const baskasiYayinda = agKisileri.some((k) => k.anahtar !== benimAnahtar && k.yayinda);
  const kanaldaOlmali = dbId != null && myDbId != null && (mikYayinda || baskasiYayinda);

  useEffect(() => {
    if (!kanaldaOlmali) {
      if (rtc.bagli) rtc.ayril().catch(() => {});
      return;
    }
    if (dbId == null || myDbId == null || rtc.bagli) return;
    rtc.katil({ kanal: rtcKanalAdi(dbId), uid: myDbId, yayinci: mikYayinda })
      .catch((e) => console.warn("[parti-rtc] katilinamadi:", (e as Error)?.message || e));
  }, [rtc, kanaldaOlmali, dbId, myDbId, mikYayinda]);

  useEffect(() => {
    if (!rtc.bagli) return;
    rtc.rolAyarla(mikYayinda).catch((e) => console.warn("[parti-rtc] rol:", (e as Error)?.message || e));
  }, [rtc, mikYayinda]);

  useEffect(() => {
    if (!rtc.bagli) return;
    rtc.micAyarla(mikYayinda).catch((e) => console.warn("[parti-rtc] mic:", (e as Error)?.message || e));
  }, [rtc, mikYayinda]);

  useEffect(() => {
    if (!rtc.bagli) return;
    rtc.hoparlorAyarla(true).catch(() => {});
  }, [rtc, kanaldaOlmali]);

  useEffect(() => () => { rtc.ayril().catch(() => {}); }, [rtc]);

  useEffect(() => {
    if (benSahip || dbId == null) return;
    let iptal = false;
    amIBannedFromRoom(dbId)
      .then((yasakli) => {
        if (iptal || !yasakli) return;
        setBildirim("Bu odaya girişin kapalı");
        setTimeout(() => cikRef.current(), 1200);
      })
      .catch(() => {});
    return () => { iptal = true; };
  }, [benSahip, dbId]);

  useEffect(() => {
    if (benSahip || dbId == null) return;
    let iptal = false;
    getRoomMembers(dbId)
      .then(({ myRole }) => { if (!iptal && myRole) setDbRol(myRole); })
      .catch(() => {});
    return () => { iptal = true; };
  }, [benSahip, dbId]);
  useEffect(() => {
    if (dbId == null || !isSupabaseConfigured) return;
    let iptal = false;
    const yukle = () => {
      odaKatilimcilariGetir(dbId).then((l) => { if (!iptal) setKatilimcilar(l); }).catch(() => {});
    };
    yukle();
    odaSahibi(dbId).then((s) => { if (!iptal) setSahip(s); }).catch(() => {});
    const bitir = odaKatilimcilariniDinle(dbId, yukle);
    return () => { iptal = true; bitir(); };
  }, [dbId]);

  const kisiler = useMemo<YanPanelKisisi[]>(() => {
    if (agKisileri.length > 0) {
      return agKisileri.map((k) => ({
        anahtar: k.anahtar,
        ad: k.ad,
        foto: k.foto,
        sahip: k.sahip,
        rol: k.rol,
        mikrofonIzni: !!mikrofonIzinleri[k.anahtar],
        yayinda: !!k.yayinda,
        ozelIdTip: k.ozelIdTip ?? undefined,
        ozelIdTema: k.ozelIdTema ?? undefined,
      }));
    }
    if (dbId != null) {
      const sahipId = sahip?.id ?? oda.ownerId ?? null;
      const liste: YanPanelKisisi[] = katilimcilar.map((k) => ({
        anahtar: "u" + k.uid,
        ad: k.uid === myDbId ? userName : k.name,
        foto: k.uid === myDbId ? userPhoto ?? undefined : k.photo,
        sahip: sahipId != null && k.uid === sahipId,
        ozelIdTip: k.uid === myDbId ? ozelIdTip : undefined,
        ozelIdTema: k.uid === myDbId ? ozelIdTema : undefined,
      }));
      if (myDbId != null && !liste.some((k) => k.anahtar === "u" + myDbId)) {
        liste.push({ anahtar: "u" + myDbId, ad: userName, foto: userPhoto ?? undefined, sahip: sahipId === myDbId, ozelIdTip, ozelIdTema });
      }
      return liste.sort((a, b) => Number(!!b.sahip) - Number(!!a.sahip) || a.ad.localeCompare(b.ad, "tr"));
    }
    const benSahip = !id;
    const sahipAd = benSahip ? userName : oda.host;
    const liste: YanPanelKisisi[] = [{
      anahtar: "sahip", ad: sahipAd, sahip: true,
      foto: benSahip ? userPhoto ?? undefined : PEOPLE[oda.host]?.photo,
      ozelIdTip: benSahip ? ozelIdTip : undefined, ozelIdTema: benSahip ? ozelIdTema : undefined,
    }];
    if (!benSahip) liste.push({ anahtar: "ben", ad: userName, foto: userPhoto ?? undefined, ozelIdTip, ozelIdTema });
    for (const ad of oda.crowd) {
      if (ad === sahipAd || ad === userName) continue;
      liste.push({ anahtar: "k" + ad, ad, foto: PEOPLE[ad]?.photo });
    }
    return liste;
  }, [agKisileri, mikrofonIzinleri, dbId, sahip, oda.ownerId, oda.host, oda.crowd, katilimcilar, myDbId, userName, userPhoto, ozelIdTip, ozelIdTema, id]);

  return (
    <View style={styles.root}>
      <Gradient
        colors={
          sahneRengi
            ? [sahneRengi, karart(sahneRengi, 0.32), karart(sahneRengi, 0.62), karart(sahneRengi, 0.85)]
            : ["#3A2350", "#6B3F63", "#A8613C", "#6E2F35"]
        }
        deg={165}
        locations={[0, 0.34, 0.68, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <UstKaplama uzat={4} zemin="#3A2350" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {!buyuk && (
        <View
          style={[styles.ustZemin, { paddingTop: insets.top }]}
          onLayout={(e) => setUstYukseklik(e.nativeEvent.layout.height)}
        >
          <UstBar
            kisi={kisiler.length}
            onKapat={cik}
            onGezin={() => router.push({ pathname: "/parti-platform", params: { secim: "1" } })}
            onKisiler={() => setKisilerAcik(true)}
          />
        </View>
        )}

        <View style={buyuk ? styles.yatayGovde : { flex: 1 }}>
        {dogrudanMi(oynatilan.platform) ? (
          <PartiNativeOynatici
            key={`dogrudan-${oynatimNo}`}
            ref={oynatici}
            adres={oynatilan.adres}
            tamEkran={kip === "gezinme" || buyuk}
            kilitli={!kontrolBende}
            onOlay={olayGeldi}
          />
        ) : (
          <PartiOynatici
            key={`${oynatilan.platform}-${oynatimNo}`}
            ref={oynatici}
            adres={oynatilan.adres}
            platform={oynatilan.platform}
            tamEkran={kip === "gezinme" || buyuk}
            onBoyut={boyutDegistir}
            onSohbet={() => setYanSohbet((v) => !v)}
            sohbetAcik={yanSohbet}
            kontrolVar={kip === "oynatim"}
            kilitli={!kontrolBende}
            onOlay={olayGeldi}
            ustKatman={girisGerekli && kip === "oynatim" && oynatilanPlatform ? (
              <GirisGerekli
                platform={oynatilanPlatform}
                onGiris={() => { setGirisGerekli(false); setKip("gezinme"); }}
              />
            ) : null}
          />
        )}

        {kip === "oynatim" && (!buyuk || yanSohbet) && (
        <View
          style={
            buyuk
              ? [styles.yanSutun, { backgroundColor: sahneRengi ? saydam(karart(sahneRengi, 0.55), 0.86) : "rgba(12,10,18,.82)" }]
              : { flex: 1 }
          }
        >
          <ScrollView
            ref={akis}
            style={{ flex: 1 }}
            contentContainerStyle={styles.akis}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => akis.current?.scrollToEnd({ animated: true })}
          >
            {ogeler.map((o) => (
              <SohbetOgesi
                key={o.anahtar}
                oge={o}
                benimFoto={userPhoto ?? undefined}
                oynuyor={oynuyor}
                onOynatDurdur={() => (oynuyor ? oynatici.current?.duraklat() : oynatici.current?.oynat())}
                onDavet={davetKopyala}
              />
            ))}
          </ScrollView>

          <AltBar
            altPay={insets.bottom + 10}
            onGonder={mesajGonder}
            onDavet={davetKopyala}
            onKisiler={() => setKisilerAcik(true)}
            mikAcilir={mikAcilir}
            mikAcik={mikYayinda}
            onMik={() => setMikIstek((v) => !v)}
            sohbetAcik={sohbetYazabilirMi(benimRol, odaAyari)}
            kilitDegistir={
              yetkiVar(benimRol, "sohbetKilit")
                ? () => odaAyariDegistir({ sohbetKilit: !odaAyari.sohbetKilit })
                : undefined
            }
          />
        </View>
        )}
        </View>
      </KeyboardAvoidingView>

      {oda.kapak && (
        <Image source={oda.kapak} style={styles.gizliOnYukleme} contentFit="cover" transition={0} />
      )}

      <KullaniciYanPanel
        acik={kisilerAcik}
        kisiler={kisiler}
        onKapat={() => setKisilerAcik(false)}
        ustPay={ustYukseklik}
        yetkiler={{
          benimRol,
          benimAnahtar,
          onYetki: (k, yeniRol) => {
            const hedef = agKisileri.find((x) => x.anahtar === k.anahtar);
            if (hedef) rolDegistir(hedef, yeniRol);
          },
          onAt: (k) => {
            const hedef = agKisileri.find((x) => x.anahtar === k.anahtar);
            if (hedef) odadanAt(hedef);
          },
          onMikrofon: (k, acik) => {
            const hedef = agKisileri.find((x) => x.anahtar === k.anahtar);
            if (hedef) mikrofonIzniDegistir(hedef, acik);
          },
        }}
      />

      {bildirim !== "" && (
        <View style={[styles.bildirim, { bottom: insets.bottom + 90 }]} pointerEvents="none">
          <Txt weight="extrabold" size={12.5} color="#fff">{bildirim}</Txt>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  yatayGovde: { flex: 1, flexDirection: "row" },
  yanSutun: { width: "32%", minWidth: 240 },
  ustZemin: { paddingHorizontal: 18 },
  ustBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 14,
  },
  ustDugme: { alignItems: "center", justifyContent: "center" },
  kisiRozet: {
    position: "absolute", top: -8, right: -10, minWidth: 20, height: 20, borderRadius: 10,
    paddingHorizontal: 5, alignItems: "center", justifyContent: "center", backgroundColor: "#fff",
  },
  oynatici: { width: "100%", aspectRatio: 16 / 9, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  donen: { opacity: 0.75 },
  akis: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, gap: 14 },

  katilimSatir: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end" },
  katilimMetin: { flexDirection: "row", alignItems: "center", flexShrink: 1, minWidth: 0, flexWrap: "wrap", justifyContent: "flex-end" },
  karsilamaKapsul: {
    flexDirection: "row", alignItems: "flex-start", alignSelf: "flex-start",
    maxWidth: "92%", gap: 7, borderRadius: 16, borderWidth: 1,
    borderColor: C.gold + "3D", backgroundColor: "rgba(245,206,110,.09)",
    paddingVertical: 10, paddingHorizontal: 12,
  },
  davetSatir: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  altCizgi: { textDecorationLine: "underline" },
  simdiSatir: { flexDirection: "row", alignItems: "center", gap: 11 },
  simdiLogo: { width: 52, height: 20 },
  mesajSatir: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  benimSatir: { flexDirection: "row", alignItems: "flex-start", justifyContent: "flex-end", gap: 10 },
  tac: { position: "absolute", top: -9, left: -3, transform: [{ rotate: "-22deg" }] },

  altBar: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingTop: 8 },
  mikDugme: {
    width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center",
    backgroundColor: "#fff",
  },
  giris: { flex: 1, minWidth: 0, color: "#fff", fontSize: 15, paddingVertical: 8 },
  altIkonlar: { flexDirection: "row", alignItems: "center", gap: 13 },
  gonderDugme: {
    width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center",
    backgroundColor: C.gold2,
  },
  bildirim: {
    position: "absolute", alignSelf: "center",
    paddingVertical: 9, paddingHorizontal: 18, borderRadius: 999,
    backgroundColor: "rgba(20,19,26,.96)", borderWidth: 1, borderColor: "rgba(255,255,255,.14)",
  },
  gizliOnYukleme: { width: 1, height: 1, opacity: 0, position: "absolute" },
});
