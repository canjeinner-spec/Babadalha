import { MOCK_ARKADAS_ACIK } from "@/data/arkadasMock";
import { type PartiIstatistik } from "@/data/remote/partiRepo";
import { type PublicProfile } from "@/data/remote/profileRepo";
import { type ArkadaslikDurumu } from "@/data/remote/sosyalRepo";

export type MockKisi = {
  profil: PublicProfile;
  istatistik: PartiIstatistik;
  takipci: number;
  takip: number;
  arkadaslik: ArkadaslikDurumu;
  takipte: boolean;
  beniEngelledi: boolean;
};

const BOS_ISTATISTIK: PartiIstatistik = {
  toplamSaniye: null, enUzunSaniye: null, ortalamaSaniye: null, buHaftaSaniye: null,
  oturumSayisi: 0, farkliOda: 0, enAktifSaat: null, sonOturum: null, favoriPlatform: null,
};

function profil(
  id: number,
  kullaniciAdi: string,
  ek: Partial<PublicProfile>,
): PublicProfile {
  return {
    id,
    public_id: kullaniciAdi,
    kullanici_adi: kullaniciAdi,
    profil_resmi: null,
    biyografi: null,
    cinsiyet: null,
    ulke: null,
    dogum_tarihi: null,
    sehir: null,
    seviye_id: null,
    deneyim_puani: 0,
    durum: "aktif",
    ekonomi_rolu: "uye",
    olusturulma_tarihi: null,
    ozel_id: null,
    ozel_id_tip: null,
    ozel_id_tema: null,
    kusanilan_rozet: null,
    ...ek,
  };
}

function istatistik(ek: Partial<PartiIstatistik>): PartiIstatistik {
  return { ...BOS_ISTATISTIK, ...ek };
}

const SAAT = 3600;

export const MOCK_KISILER: MockKisi[] = [
  {
    profil: profil(-101, "deniz", {
      kullanici_adi: "Deniz",
      public_id: "deniz",
      biyografi: "cuma akşamları korku, pazar sabahları anime",
      sehir: "İzmir", ulke: "Türkiye",
      seviye_id: 12, deneyim_puani: 8430,
      olusturulma_tarihi: "2025-11-03T19:20:00Z",
      ozel_id: "1907", ozel_id_tip: "premium", ozel_id_tema: "yakut",
    }),
    istatistik: istatistik({ toplamSaniye: 64 * SAAT, favoriPlatform: "netflix", oturumSayisi: 41, farkliOda: 12 }),
    takipci: 128, takip: 64, arkadaslik: "gelen", takipte: false, beniEngelledi: false,
  },
  {
    profil: profil(-102, "melis", {
      kullanici_adi: "Melis",
      public_id: "melis",
      biyografi: "altyazıyı kapatana kızarım",
      sehir: "Ankara", ulke: "Türkiye",
      seviye_id: 7, deneyim_puani: 3110,
      olusturulma_tarihi: "2026-02-14T10:05:00Z",
      ozel_id_tip: "kapsul", ozel_id_tema: "emerald",
    }),
    istatistik: istatistik({ toplamSaniye: 19 * SAAT, favoriPlatform: "youtube", oturumSayisi: 16, farkliOda: 5 }),
    takipci: 42, takip: 88, arkadaslik: "gelen", takipte: false, beniEngelledi: false,
  },
  {
    profil: profil(-103, "ender", {
      kullanici_adi: "Ender",
      public_id: "ender",
      seviye_id: 3, deneyim_puani: 640,
      olusturulma_tarihi: "2026-06-28T08:41:00Z",
    }),
    istatistik: istatistik({ toplamSaniye: 4 * SAAT, favoriPlatform: "prime_video", oturumSayisi: 4, farkliOda: 2 }),
    takipci: 9, takip: 31, arkadaslik: "bekliyor", takipte: false, beniEngelledi: true,
  },
  {
    profil: profil(-104, "ruya", {
      kullanici_adi: "Rüya",
      public_id: "ruya",
      biyografi: "aynı filmi on kere izleyebilirim",
      sehir: "İstanbul", ulke: "Türkiye",
      seviye_id: 21, deneyim_puani: 24900,
      olusturulma_tarihi: "2025-08-09T21:15:00Z",
      ozel_id_tip: "premium", ozel_id_tema: "gokkusagi",
    }),
    istatistik: istatistik({ toplamSaniye: 213 * SAAT, favoriPlatform: "netflix", oturumSayisi: 132, farkliOda: 38 }),
    takipci: 1240, takip: 210, arkadaslik: "arkadas", takipte: true, beniEngelledi: false,
  },
  {
    profil: profil(-105, "baris", {
      kullanici_adi: "Barış",
      public_id: "baris",
      seviye_id: 9, deneyim_puani: 5020,
      olusturulma_tarihi: "2026-01-22T17:00:00Z",
    }),
    istatistik: istatistik({ toplamSaniye: 31 * SAAT, favoriPlatform: "disney_plus", oturumSayisi: 22, farkliOda: 7 }),
    takipci: 58, takip: 47, arkadaslik: "arkadas", takipte: false, beniEngelledi: false,
  },
];

const HARF_ESI: Record<string, string> = {
  ı: "i", İ: "i", ş: "s", Ş: "s", ğ: "g", Ğ: "g",
  ü: "u", Ü: "u", ö: "o", Ö: "o", ç: "c", Ç: "c",
};

function sadelestir(metin: string): string {
  return metin.replace(/[ıİşŞğĞüÜöÖçÇ]/g, (h) => HARF_ESI[h] ?? h).toLowerCase().trim();
}

export function mockKisiBul(
  id?: number | null,
  kullaniciAdi?: string | null,
  ad?: string | null,
): MockKisi | null {
  if (!MOCK_ARKADAS_ACIK) return null;
  if (id != null && id < 0) {
    const kimlikle = MOCK_KISILER.find((k) => k.profil.id === id);
    if (kimlikle) return kimlikle;
  }
  for (const aday of [kullaniciAdi, ad]) {
    const a = sadelestir(aday ?? "");
    if (!a) continue;
    const bulunan = MOCK_KISILER.find(
      (k) => sadelestir(k.profil.public_id) === a || sadelestir(k.profil.kullanici_adi) === a,
    );
    if (bulunan) return bulunan;
  }
  return null;
}
