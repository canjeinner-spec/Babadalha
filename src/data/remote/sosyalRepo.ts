import { requireSupabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/remote/profileRepo";

export class TabloYok extends Error {}

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
    .select("isteyen_id, istenen_id, durum")
    .or(`and(isteyen_id.eq.${ben},istenen_id.eq.${hedefId}),and(isteyen_id.eq.${hedefId},istenen_id.eq.${ben})`)
    .maybeSingle();
  if (error) hataCevir(error);
  const r = data as { isteyen_id: number; istenen_id: number; durum: string } | null;
  if (!r) return "yok";
  if (r.durum === "kabul") return "arkadas";
  if (r.durum === "red") return "yok";
  return r.isteyen_id === ben ? "bekliyor" : "gelen";
}

export async function arkadaslikIste(hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar")
    .upsert({ isteyen_id: ben, istenen_id: hedefId, durum: "bekliyor" }, { onConflict: "isteyen_id,istenen_id" });
  if (error) hataCevir(error);
}

export async function arkadasligiKabulEt(isteyenId: number): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb
    .from("arkadasliklar").update({ durum: "kabul" })
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
): Promise<void> {
  const sb = requireSupabase();
  const ben = await benimId();
  const { error } = await sb.from("bildirimler").insert({
    bildiren_id: ben,
    bildirilen_id: hedefId,
    sebep,
    oda_id: odaId ?? null,
  });
  if (error) hataCevir(error);
}
