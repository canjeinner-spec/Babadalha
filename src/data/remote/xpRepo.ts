import { getMyProfile } from "@/data/remote/profileRepo";
import { requireSupabase, isSupabaseConfigured } from "@/lib/supabase";

export async function addXp(kaynak: "gunluk_giris" | "oda_katilim" | "oda_mesaj"): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  try {
    const sb = requireSupabase();
    const { data, error } = await sb.rpc("xp_ekle", { p_kaynak: kaynak });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}

export type LevelInfo = {
  level: number;
  xp: number;
  nextAt: number | null;
  currentAt: number;
};

export async function getLevelInfo(): Promise<LevelInfo | null> {
  if (!isSupabaseConfigured) return null;
  const me = await getMyProfile().catch(() => null);
  if (!me) return null;
  const xp = me.deneyim_puani ?? 0;
  const level = me.seviye_id ?? 1;

  try {
    const sb = requireSupabase();
    const { data } = await sb
      .from("seviyeler")
      .select("id, minimum_deneyim_puani")
      .order("minimum_deneyim_puani", { ascending: true });
    const rows = (data as { id: number; minimum_deneyim_puani: number }[]) ?? [];
    if (rows.length) {
      const current = [...rows].reverse().find((r) => r.minimum_deneyim_puani <= xp);
      const next = rows.find((r) => r.minimum_deneyim_puani > xp);
      return { level, xp, nextAt: next?.minimum_deneyim_puani ?? null, currentAt: current?.minimum_deneyim_puani ?? 0 };
    }
  } catch {
    // tablo okunamıyorsa formüle düş
  }
  const currentAt = 100 * (level - 1) * (level - 1);
  const nextAt = 100 * level * level;
  return { level, xp, nextAt, currentAt };
}
