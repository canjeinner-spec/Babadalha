import { requireSupabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/remote/profileRepo";

export class TabloYok extends Error {}

export const ARKADASLIK_BEKLIYOR = "beklemede";
export const ARKADASLIK_KABUL = "kabul";
export const ARKADASLIK_RED = "reddedildi";

const YOK_KODLARI = new Set(["42P01", "42501", "PGRST205", "PGRST301"]);

function hataCevir(hata: unknown): never {
  const kod = (hata as { code?: string })?.code;
  if (kod && YOK_KODLARI.has(kod)) throw new TabloYok("Sosyal tablolar kurulmamış.");
  throw hata;
}

async function benimId(): Promise<number> {
  const me = await getMyProfile();
  if (!me) throw new Error("Oturum yok.");
  return me.id;
}

export type ArkadaslikDurumu = "yok" | "bekliyor" | "gelen" | "arkadas";

export async function engellilerim(): Promise<number[]> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { data, error } = await sb.from("engellemeler").select("engellenen_id").eq("engelleyen_id", ben);
  if (error) hataCevir(error);
  return ((data as { engellenen_id: number }[]) ?? []).map((r) => r.engellenen_id);
}

export async function engelle(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb.from("engellemeler").insert({ engelleyen_id: ben, engellenen_id: hedefId });
  if (error) hataCevir(error);
}

export async function engeliKaldir(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("engellemeler").delete().eq("engelleyen_id", ben).eq("engellenen_id", hedefId);
  if (error) hataCevir(error);
}

export async function arkadaslikDurumu(hedefId: number): Promise<ArkadaslikDurumu> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { data, error } = await sb
    .from("arkadasliklar")
    .select("id, isteyen_id, istenen_id, durum")
    .or(`and(isteyen_id.eq.${ben},istenen_id.eq.${hedefId}),and(isteyen_id.eq.${hedefId},istenen_id.eq.${ben})`)
    .maybeSingle();
  if (error) hataCevir(error);
  const r = data as { isteyen_id: number; durum: string } | null;
  if (!r) return "yok";
  if (r.durum === ARKADASLIK_KABUL) return "arkadas";
  if (r.durum === ARKADASLIK_RED) return "yok";
  return r.isteyen_id === ben ? "bekliyor" : "gelen";
}

export async function arkadaslikIste(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar")
    .insert({ isteyen_id: ben, istenen_id: hedefId, durum: ARKADASLIK_BEKLIYOR });
  if (error) hataCevir(error);
}

export async function arkadasligiKabulEt(isteyenId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar")
    .update({ durum: ARKADASLIK_KABUL, yanit_tarihi: new Date().toISOString() })
    .eq("isteyen_id", isteyenId).eq("istenen_id", ben);
  if (error) hataCevir(error);
}

export async function arkadasligiSil(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar").delete()
    .or(`and(isteyen_id.eq.${ben},istenen_id.eq.${hedefId}),and(isteyen_id.eq.${hedefId},istenen_id.eq.${ben})`);
  if (error) hataCevir(error);
}

export type ArkadasKisi = {
  id: number;
  publicId: string;
  ad: string;
  foto?: string;
  ozelId: string | null;
  ozelIdTip: "premium" | "kapsul" | null;
  ozelIdTema: string | null;
  tarih: string | null;
};

type KisiSatiri = {
  id: number;
  public_id: string;
  kullanici_adi: string;
  profil_resmi: string | null;
  ozel_id: string | null;
  ozel_id_tip: "premium" | "kapsul" | null;
  ozel_id_tema: string | null;
};

const KISI_ALANLARI = "id, public_id, kullanici_adi, profil_resmi, ozel_id, ozel_id_tip, ozel_id_tema";

async function kisileriGetir(idler: number[]): Promise<Map<number, KisiSatiri>> {
  const harita = new Map<number, KisiSatiri>();
  if (!idler.length) return harita;
  const sb = requireSupabase();
  const { data } = await sb.from("profiller").select(KISI_ALANLARI).in("id", idler);
  for (const k of (data as KisiSatiri[]) ?? []) harita.set(k.id, k);
  return harita;
}

function kisiYap(k: KisiSatiri | undefined, id: number, tarih: string | null): ArkadasKisi {
  return {
    id,
    publicId: k?.public_id ?? "",
    ad: k?.kullanici_adi || "Kullanıcı",
    foto: k?.profil_resmi || undefined,
    ozelId: k?.ozel_id ?? null,
    ozelIdTip: k?.ozel_id_tip ?? null,
    ozelIdTema: k?.ozel_id_tema ?? null,
    tarih,
  };
}

type BagSatiri = { isteyen_id: number; istenen_id: number; istek_tarihi: string | null; yanit_tarihi: string | null };

async function baglariCoz(satirlar: BagSatiri[], ben: number, tarihAlani: "istek" | "yanit"): Promise<ArkadasKisi[]> {
  const eslesme = satirlar.map((r) => ({
    id: r.isteyen_id === ben ? r.istenen_id : r.isteyen_id,
    tarih: tarihAlani === "yanit" ? (r.yanit_tarihi ?? r.istek_tarihi) : r.istek_tarihi,
  }));
  const kisiler = await kisileriGetir(eslesme.map((e) => e.id));
  return eslesme.map((e) => kisiYap(kisiler.get(e.id), e.id, e.tarih));
}

export async function arkadaslarim(): Promise<ArkadasKisi[]> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { data, error } = await sb
    .from("arkadasliklar")
    .select("isteyen_id, istenen_id, istek_tarihi, yanit_tarihi")
    .eq("durum", ARKADASLIK_KABUL)
    .or(`isteyen_id.eq.${ben},istenen_id.eq.${ben}`)
    .order("yanit_tarihi", { ascending: false });
  if (error) hataCevir(error);
  return baglariCoz((data as BagSatiri[]) ?? [], ben, "yanit");
}

export async function gelenIstekler(): Promise<ArkadasKisi[]> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { data, error } = await sb
    .from("arkadasliklar")
    .select("isteyen_id, istenen_id, istek_tarihi, yanit_tarihi")
    .eq("durum", ARKADASLIK_BEKLIYOR)
    .eq("istenen_id", ben)
    .order("istek_tarihi", { ascending: false });
  if (error) hataCevir(error);
  return baglariCoz((data as BagSatiri[]) ?? [], ben, "istek");
}

export async function gidenIstekler(): Promise<ArkadasKisi[]> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { data, error } = await sb
    .from("arkadasliklar")
    .select("isteyen_id, istenen_id, istek_tarihi, yanit_tarihi")
    .eq("durum", ARKADASLIK_BEKLIYOR)
    .eq("isteyen_id", ben)
    .order("istek_tarihi", { ascending: false });
  if (error) hataCevir(error);
  return baglariCoz((data as BagSatiri[]) ?? [], ben, "istek");
}

export async function arkadasligiReddet(isteyenId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar")
    .update({ durum: ARKADASLIK_RED, yanit_tarihi: new Date().toISOString() })
    .eq("isteyen_id", isteyenId).eq("istenen_id", ben);
  if (error) hataCevir(error);
}

export async function istegiGeriAl(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar").delete()
    .eq("isteyen_id", ben).eq("istenen_id", hedefId).eq("durum", ARKADASLIK_BEKLIYOR);
  if (error) hataCevir(error);
}

export async function takipEdiyorMuyum(hedefId: number): Promise<boolean> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { data, error } = await sb
    .from("takipler").select("takipci_id")
    .eq("takipci_id", ben).eq("takip_edilen_id", hedefId).maybeSingle();
  if (error) hataCevir(error);
  return data != null;
}

export async function takipEt(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb.from("takipler").insert({ takipci_id: ben, takip_edilen_id: hedefId });
  if (error) hataCevir(error);
}

export async function takibiBirak(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("takipler").delete().eq("takipci_id", ben).eq("takip_edilen_id", hedefId);
  if (error) hataCevir(error);
}

export async function takipSayilari(hedefId: number): Promise<{ takipci: number; takip: number }> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("takip_sayilari", { p_id: hedefId });
  if (error) hataCevir(error);
  const r = (data as { takipci: number; takip: number }[] | null)?.[0];
  return { takipci: Number(r?.takipci ?? 0), takip: Number(r?.takip ?? 0) };
}

export const BILDIRIM_SEBEPLERI = ["taciz", "nefret", "cinsel", "cocuk", "spam", "siddet", "diger"] as const;
export type BildirimSebebi = (typeof BILDIRIM_SEBEPLERI)[number];

export async function kullaniciyiBildir(
  hedefId: number,
  sebep: BildirimSebebi,
  odaId?: number | null,
  detay?: string | null,
): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb.from("parti_sikayetleri").insert({
    bildiren_id: ben,
    bildirilen_id: hedefId,
    oda_id: odaId ?? null,
    neden: sebep,
    detay: detay ?? null,
  });
  if (error) hataCevir(error);
}
