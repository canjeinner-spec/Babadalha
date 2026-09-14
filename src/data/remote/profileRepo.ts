import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type Profile = {
  id: number;
  public_id: string;
  kullanici_adi: string;
  email: string | null;
  profil_resmi: string | null;
  biyografi: string | null;
  cinsiyet: string | null;
  ulke: string | null;
  dogum_tarihi: string | null;
  sehir: string | null;
  seviye_id: number | null;
  deneyim_puani: number;
  durum: string;
  ekonomi_rolu: string;
  ozel_id: string | null;
  ozel_id_tip: "premium" | "kapsul" | null;
  ozel_id_tema: string | null;
  kusanilan_rozet: string | null;
  beta_tester: boolean;
  premium_hak: boolean;
};

const SELF_COLS =
  "id, public_id, kullanici_adi, email, profil_resmi, biyografi, cinsiyet, ulke, sehir, dogum_tarihi, seviye_id, deneyim_puani, durum, ekonomi_rolu, ozel_id, ozel_id_tip, ozel_id_tema, kusanilan_rozet, beta_tester, premium_hak";

async function currentAuthUid(): Promise<string | null> {
  const sb = requireSupabase();
  const { data } = await sb.auth.getSession();
  return data.session?.user?.id ?? null;
}

let _profileMemo: { uid: string; at: number; value: Profile | null } | null = null;
const PROFILE_TTL = 2000;
function invalidateProfileMemo() { _profileMemo = null; }

export async function getMyProfile(): Promise<Profile | null> {
  const sb = requireSupabase();
  const uid = await currentAuthUid();
  if (!uid) return null;
  if (_profileMemo && _profileMemo.uid === uid && Date.now() - _profileMemo.at < PROFILE_TTL) {
    return _profileMemo.value;
  }
  const { data, error } = await sb
    .from("kullanicilar")
    .select(SELF_COLS)
    .eq("auth_uid", uid)
    .maybeSingle();
  if (error) throw error;
  const value = (data as Profile | null) ?? null;
  _profileMemo = { uid, at: Date.now(), value };
  return value;
}

export async function updateMyProfile(
  patch: Partial<Pick<Profile, "kullanici_adi" | "profil_resmi" | "biyografi" | "cinsiyet" | "ulke" | "sehir" | "dogum_tarihi">>,
): Promise<Profile> {
  const sb = requireSupabase();
  const uid = await currentAuthUid();
  if (!uid) throw new Error("Oturum yok.");
  const { data, error } = await sb
    .from("kullanicilar")
    .update(patch)
    .eq("auth_uid", uid)
    .select(SELF_COLS)
    .single();
  if (error) throw error;
  invalidateProfileMemo();
  return data as Profile;
}

export async function ensureMyProfile(): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("profilimi_garantile");
  if (error) throw error;
  invalidateProfileMemo();
}

const AVATAR_KOVASI = "avatars";

export async function avatarYukle(yerelAdres: string): Promise<string> {
  const sb = requireSupabase();
  const uid = await currentAuthUid();
  if (!uid) throw new Error("Oturum yok.");
  const yanit = await fetch(yerelAdres);
  if (!yanit.ok) throw new Error("Görsel okunamadı.");
  const veri = await yanit.arrayBuffer();
  const uzanti = (yerelAdres.split("?")[0].split(".").pop() ?? "jpg").toLowerCase();
  const tur = uzanti === "png" ? "image/png" : uzanti === "webp" ? "image/webp" : "image/jpeg";
  const yol = `${uid}/${Date.now()}.${uzanti === "png" ? "png" : uzanti === "webp" ? "webp" : "jpg"}`;
  const { error } = await sb.storage.from(AVATAR_KOVASI).upload(yol, veri, {
    contentType: tur,
    upsert: true,
  });
  if (error) throw error;
  const { data } = sb.storage.from(AVATAR_KOVASI).getPublicUrl(yol);
  return data.publicUrl;
}

export async function isUsernameAvailable(name: string): Promise<boolean> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("kullanici_adi_musait", { p_ad: name });
  if (error) throw error;
  return Boolean(data);
}

export type PublicProfile = {
  id: number;
  public_id: string;
  kullanici_adi: string;
  profil_resmi: string | null;
  biyografi: string | null;
  cinsiyet: string | null;
  ulke: string | null;
  dogum_tarihi: string | null;
  sehir: string | null;
  seviye_id: number | null;
  deneyim_puani: number;
  durum: string;
  ekonomi_rolu: string;
  olusturulma_tarihi: string | null;
  ozel_id: string | null;
  ozel_id_tip: "premium" | "kapsul" | null;
  ozel_id_tema: string | null;
  kusanilan_rozet: string | null;
};

const PUBLIC_COLS =
  "id, public_id, kullanici_adi, profil_resmi, biyografi, cinsiyet, ulke, sehir, seviye_id, deneyim_puani, durum, ekonomi_rolu, olusturulma_tarihi, ozel_id, ozel_id_tip, ozel_id_tema, kusanilan_rozet";

export async function getPublicProfile(publicId: string): Promise<PublicProfile | null> {
  const sb = requireSupabase();
  const anahtar = publicId.trim();
  const { data, error } = await sb
    .from("profiller")
    .select(PUBLIC_COLS)
    .eq("public_id", anahtar)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as PublicProfile;

  const { data: ozel, error: hata2 } = await sb
    .from("profiller")
    .select(PUBLIC_COLS)
    .eq("ozel_id", anahtar)
    .limit(1);
  if (hata2) throw hata2;
  return ((ozel as PublicProfile[]) ?? [])[0] ?? null;
}

export async function getPublicProfileById(id: number): Promise<PublicProfile | null> {
  if (!Number.isFinite(id)) return null;
  const sb = requireSupabase();
  const { data, error } = await sb.from("profiller").select(PUBLIC_COLS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data as PublicProfile | null;
}

export async function searchProfiles(query: string, limit = 20): Promise<PublicProfile[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const sb = requireSupabase();
  const safe = q.replace(/[%,]/g, "");
  const { data, error } = await sb
    .from("profiller")
    .select(PUBLIC_COLS)
    .or(`kullanici_adi.ilike.%${safe}%,public_id.ilike.%${safe}%,ozel_id.ilike.%${safe}%`)
    .order("deneyim_puani", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as PublicProfile[]) ?? [];
}

export type AdTemasi = { tip: "premium" | "kapsul"; tema: string | null; ozelId: string | null };

export async function adTemalari(ids: number[]): Promise<Map<number, AdTemasi>> {
  const harita = new Map<number, AdTemasi>();
  const uniq = [...new Set(ids.filter((x) => Number.isFinite(x)))];
  if (uniq.length === 0) return harita;
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("profiller")
    .select("id, ozel_id, ozel_id_tip, ozel_id_tema")
    .in("id", uniq);
  if (error) throw error;
  for (const r of (data as { id: number; ozel_id: string | null; ozel_id_tip: string | null; ozel_id_tema: string | null }[]) ?? []) {
    if (r.ozel_id_tip === "premium" || r.ozel_id_tip === "kapsul") {
      harita.set(r.id, { tip: r.ozel_id_tip, tema: r.ozel_id_tema, ozelId: r.ozel_id });
    }
  }
  return harita;
}

export async function setOzelId(id: string, tip: "premium" | "kapsul", tema: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("ozel_id_ayarla", { p_id: id, p_tip: tip, p_tema: tema });
  if (error) throw error;
  invalidateProfileMemo();
}

export async function clearOzelId(): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("ozel_id_kaldir");
  if (error) throw error;
  invalidateProfileMemo();
}

export async function betaKapsulHatirlat(): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("beta_kapsul_hatirlat");
  if (error) throw error;
}

export type ResmiHesap = { id: number; publicId: string; ad: string; foto: string | null; kapak: string | null };

let resmiKume = new Set<number>();
let resmiSozu: Promise<ResmiHesap[]> | null = null;

export function resmiMi(kullaniciId: number | null | undefined): boolean {
  return kullaniciId != null && resmiKume.has(kullaniciId);
}

export async function resmiHesaplar(): Promise<ResmiHesap[]> {
  if (!isSupabaseConfigured) return [];
  const sb = requireSupabase();
  const { data, error } = await sb.from("resmi_hesaplar").select("id, public_id, kullanici_adi, profil_resmi, kapak_url");
  if (error) {
    console.warn("[resmi_hesaplar]", error.message);
    return [];
  }
  const liste = ((data as { id: number; public_id: string; kullanici_adi: string; profil_resmi: string | null; kapak_url: string | null }[]) ?? [])
    .map((r) => ({ id: r.id, publicId: r.public_id, ad: r.kullanici_adi, foto: r.profil_resmi, kapak: r.kapak_url }));
  resmiKume = new Set(liste.map((r) => r.id));
  return liste;
}

export function resmiYukle(): Promise<ResmiHesap[]> {
  resmiSozu ??= resmiHesaplar().catch(() => []);
  return resmiSozu;
}
