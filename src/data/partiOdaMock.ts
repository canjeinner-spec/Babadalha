import { type PartiSohbetOgesi } from "@/data/partiSohbetMock";
import { type PartiKisi } from "@/parti/senkron";
import { type SistemKisi } from "@/parti/sistemMesaji";

export const MOCK_KISILER: PartiKisi[] = [
  {
    anahtar: "mock-deniz", ad: "Deniz", kullaniciAdi: "deniz",
    sahip: false, rol: "yardimci", yayinda: true, mikrofonIzni: true,
    ozelIdTip: "premium", ozelIdTema: "yakut",
  },
  {
    anahtar: "mock-melis", ad: "Melis", kullaniciAdi: "melis",
    sahip: false, rol: "uye", mikrofonIzni: true,
    ozelIdTip: "kapsul", ozelIdTema: "emerald",
  },
  {
    anahtar: "mock-ender", ad: "Ender", kullaniciAdi: "ender",
    sahip: false, rol: "uye",
  },
  {
    anahtar: "mock-ruya", ad: "Rüya", kullaniciAdi: "ruya",
    sahip: false, rol: "uye", ozelIdTip: "premium", ozelIdTema: "gokkusagi",
  },
];

function kisi(k: PartiKisi): SistemKisi {
  return {
    anahtar: k.anahtar,
    ad: k.ad,
    kullaniciAdi: k.kullaniciAdi ?? null,
    foto: k.foto,
    ozelIdTip: k.ozelIdTip ?? null,
    ozelIdTema: k.ozelIdTema ?? null,
  };
}

const [DENIZ, MELIS, ENDER, RUYA] = MOCK_KISILER;

const ATILAN: PartiKisi = {
  anahtar: "mock-baris", ad: "Barış", kullaniciAdi: "baris", sahip: false, rol: "uye",
};

export function mockOdaAkisi(benimAd: string, benimAnahtar: string): PartiSohbetOgesi[] {
  const ben: SistemKisi = { anahtar: benimAnahtar, ad: benimAd, kullaniciAdi: null };
  return [
    { tur: "sistem", anahtar: "mk-1", kisi: kisi(DENIZ), olay: { cesit: "katildi" } },
    { tur: "sistem", anahtar: "mk-2", kisi: kisi(MELIS), olay: { cesit: "katildi" } },
    {
      tur: "mesaj", anahtar: "mm-1", kisi: DENIZ.ad, metin: "geldim, başlayabiliriz",
      ozelIdTip: DENIZ.ozelIdTip, ozelIdTema: DENIZ.ozelIdTema,
    },
    { tur: "sistem", anahtar: "mk-3", kisi: kisi(ENDER), olay: { cesit: "katildi" } },
    {
      tur: "mesaj", anahtar: "mm-2", kisi: MELIS.ad, metin: "bir saniye, mısır patlatıyorum",
      ozelIdTip: MELIS.ozelIdTip, ozelIdTema: MELIS.ozelIdTema,
    },
    {
      tur: "sistem", anahtar: "mk-4", kisi: kisi(DENIZ),
      olay: { cesit: "rol", veren: ben, rol: "yardimci" },
    },
    { tur: "sistem", anahtar: "mk-5", kisi: kisi(RUYA), olay: { cesit: "katildi" } },
    { tur: "mesaj", anahtar: "mm-3", kisi: ENDER.ad, metin: "sesim geliyor mu?" },
    {
      tur: "sistem", anahtar: "mk-6", kisi: kisi(ATILAN),
      olay: { cesit: "atildi", atan: kisi(DENIZ), atanRol: "yardimci" },
    },
    {
      tur: "sistem", anahtar: "mk-7", kisi: kisi(MELIS),
      olay: { cesit: "rol", veren: kisi(DENIZ), rol: "yardimci" },
    },
    {
      tur: "mesaj", anahtar: "mm-4", kisi: RUYA.ad, metin: "bu sahneyi kaçırmayın",
      ozelIdTip: RUYA.ozelIdTip, ozelIdTema: RUYA.ozelIdTema,
    },
    {
      tur: "sistem", anahtar: "mk-8", kisi: kisi(MELIS),
      olay: { cesit: "rol", veren: ben, rol: "uye" },
    },
    { tur: "sistem", anahtar: "mk-9", kisi: kisi(ENDER), olay: { cesit: "ayrildi" } },
    {
      tur: "sistem", anahtar: "mk-10", kisi: ben,
      olay: { cesit: "rol", veren: kisi(DENIZ), rol: "yardimci" },
      benim: true,
    },
    {
      tur: "sistem", anahtar: "mk-11", kisi: ben,
      olay: { cesit: "rol", veren: kisi(DENIZ), rol: "uye" },
      benim: true,
    },
    { tur: "mesaj", anahtar: "mm-5", kisi: benimAd, metin: "hazırım, açıyorum", benim: true },
  ];
}
