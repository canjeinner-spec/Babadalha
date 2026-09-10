import { requireSupabase } from "@/lib/supabase";

export type KazanilmisRozet = {
  kod: string;
  ad: string;
  aciklama: string | null;
  kategori: string | null;
  kazanma_tarihi: string;
};

export type RozetIlerleme = {
  kod: string;
  ad: string;
  aciklama: string | null;
  kategori: string | null;
  kazanildi: boolean;
  kural_metrik: string | null;
  kural_esik: number | null;
  ilerleme: number;
};

export async function evaluateBadges(): Promise<number> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("rozetleri_degerlendir");
  if (error) throw error;
  return Number(data ?? 0);
}

export async function getUserBadges(userId: number): Promise<KazanilmisRozet[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("kullanici_rozetleri_getir", { p_kullanici: userId });
  if (error) throw error;
  return (data as KazanilmisRozet[]) ?? [];
}

export async function getMyBadgeProgress(): Promise<RozetIlerleme[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("rozet_ilerlemem");
  if (error) throw error;
  return (data as RozetIlerleme[]) ?? [];
}

export type RozetTanim = { kod: string; ad: string; aciklama: string | null; kategori: string | null };

let _katalog: Map<string, RozetTanim> | null = null;

export async function getBadgeCatalog(): Promise<Map<string, RozetTanim>> {
  if (_katalog) return _katalog;
  const sb = requireSupabase();
  const { data, error } = await sb.from("rozetler").select("kod, ad, aciklama, kategori").eq("aktif", true);
  if (error) throw error;
  const m = new Map<string, RozetTanim>();
  for (const r of (data as RozetTanim[]) ?? []) if (r.kod) m.set(r.kod, r);
  _katalog = m;
  return m;
}

export async function equipBadge(kod: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("rozet_kusan", { p_kod: kod });
  if (error) throw error;
}

export async function unequipBadge(): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("rozet_kusanma_kaldir");
  if (error) throw error;
}

export async function adminGrantBadge(userId: number, kod: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("rozet_ver", { p_hedef: userId, p_kod: kod });
  if (error) throw error;
}

export async function adminRevokeBadge(userId: number, kod: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("rozet_al", { p_hedef: userId, p_kod: kod });
  if (error) throw error;
}
