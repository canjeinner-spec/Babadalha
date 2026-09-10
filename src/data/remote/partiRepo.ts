import { requireSupabase } from "@/lib/supabase";

const KAYIT_TAVAN = 1000;
const OTURUM_TAVAN_SN = 12 * 60 * 60;

export type PartiIstatistik = {
  toplamSaniye: number | null;
  enUzunSaniye: number | null;
  ortalamaSaniye: number | null;
  buHaftaSaniye: number | null;
  oturumSayisi: number;
  farkliOda: number;
  enAktifSaat: number | null;
  sonOturum: number | null;
  favoriPlatform: string | null;
};

const BOS: PartiIstatistik = {
  toplamSaniye: null,
  enUzunSaniye: null,
  ortalamaSaniye: null,
  buHaftaSaniye: null,
  oturumSayisi: 0,
  farkliOda: 0,
  enAktifSaat: null,
  sonOturum: null,
  favoriPlatform: null,
};

const HAFTA_MS = 7 * 24 * 60 * 60 * 1000;

type HareketSatiri = { oda_id: number; tip: string; tarih: string };

export async function partiIstatistiklerim(kullaniciId: number | null): Promise<PartiIstatistik> {
  if (kullaniciId == null) return BOS;
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("oda_hareket_log")
    .select("oda_id, tip, tarih")
    .eq("kullanici_id", kullaniciId)
    .order("tarih", { ascending: true })
    .limit(KAYIT_TAVAN);

  if (error) {
    console.warn("[parti] hareket kaydi okunamadi:", (error as { message?: string })?.message ?? error);
    return BOS;
  }

  const satirlar = (data as HareketSatiri[]) ?? [];
  const acik = new Map<number, number>();
  const odalar = new Set<number>();
  const saatler = new Array<number>(24).fill(0);
  const haftaEsigi = Date.now() - HAFTA_MS;
  let toplam = 0;
  let enUzun = 0;
  let sayi = 0;
  let buHafta = 0;
  let son = 0;

  for (const s of satirlar) {
    const an = new Date(s.tarih).getTime();
    if (Number.isNaN(an)) continue;
    if (s.tip === "giris") {
      acik.set(s.oda_id, an);
      continue;
    }
    if (s.tip !== "cikis") continue;
    const bas = acik.get(s.oda_id);
    if (bas == null) continue;
    acik.delete(s.oda_id);
    const sure = Math.floor((an - bas) / 1000);
    if (sure <= 0 || sure > OTURUM_TAVAN_SN) continue;
    toplam += sure;
    sayi += 1;
    odalar.add(s.oda_id);
    if (sure > enUzun) enUzun = sure;
    if (bas >= haftaEsigi) buHafta += sure;
    if (an > son) son = an;
    saatler[new Date(bas).getHours()] += sure;
  }

  if (sayi === 0) return BOS;

  let enAktif = 0;
  for (let i = 1; i < 24; i++) if (saatler[i] > saatler[enAktif]) enAktif = i;

  return {
    toplamSaniye: toplam,
    enUzunSaniye: enUzun,
    ortalamaSaniye: Math.floor(toplam / sayi),
    buHaftaSaniye: buHafta,
    oturumSayisi: sayi,
    farkliOda: odalar.size,
    enAktifSaat: saatler[enAktif] > 0 ? enAktif : null,
    sonOturum: son > 0 ? son : null,
    favoriPlatform: null,
  };
}

export function saatAraligiYaz(saat: number | null): string {
  if (saat == null) return "—";
  const iki = (n: number) => String(n).padStart(2, "0");
  return `${iki(saat)}:00 – ${iki((saat + 1) % 24)}:00`;
}

export function gunYaz(an: number | null): string {
  if (an == null) return "—";
  const fark = Date.now() - an;
  const gun = Math.floor(fark / (24 * 60 * 60 * 1000));
  if (gun <= 0) return "Bugün";
  if (gun === 1) return "Dün";
  if (gun < 30) return `${gun} gün önce`;
  return new Date(an).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}

export function sureYaz(saniye: number | null): string {
  if (saniye == null || saniye <= 0) return "—";
  const dk = Math.floor(saniye / 60);
  if (dk < 60) return `${dk} dk`;
  const sa = Math.floor(dk / 60);
  const kalan = dk % 60;
  if (sa < 24) return kalan > 0 ? `${sa} sa ${kalan} dk` : `${sa} sa`;
  const gun = Math.floor(sa / 24);
  const saKalan = sa % 24;
  return saKalan > 0 ? `${gun} gün ${saKalan} sa` : `${gun} gün`;
}
