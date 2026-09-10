import { type SceneKind } from "@/components/Scene";
import { type RoomBadgeItem } from "@/components/RoomBadges";
import { odaKimligiSifirlandiMi } from "@/data/odaKimlik";
import { type Room } from "@/data/seed";
import { baglantiSuphesi } from "@/lib/agDurumu";
import { benzersizKanalAdi, requireSupabase, supabase } from "@/lib/supabase";
import { getMyProfile } from "@/data/remote/profileRepo";

const TEMEL_COLS =
  "id, public_id, ad, aciklama, kategori, kapak_url, herkese_acik, olusturan_id, koltuk_sayisi, aktif_katilimci_sayisi, olusturulma_tarihi";

const VITRIN_COLS = "resmi, gunluk_sira, islem_gordu, islem_sebep";
const MOD_COLS = "oda_modu";
const SELECT_COLS = `${TEMEL_COLS}, ${VITRIN_COLS}, ${MOD_COLS}`;
const VITRINLI_COLS = `${TEMEL_COLS}, ${VITRIN_COLS}`;

function kolonYok(e: unknown) {
  return (e as { code?: string })?.code === "42703";
}

function tabloYok(e: unknown) {
  const c = (e as { code?: string })?.code;
  return c === "42P01" || c === "42883" || c === "PGRST202" || c === "PGRST205";
}

type OdaRow = {
  id: number;
  public_id: string;
  ad: string;
  aciklama: string | null;
  kategori: string | null;
  oda_modu?: string | null;
  kapak_url: string | null;
  herkese_acik: boolean;
  olusturan_id: number | null;
  koltuk_sayisi: number;
  aktif_katilimci_sayisi: number;
  olusturulma_tarihi: string;
  resmi?: boolean;
  gunluk_sira?: number | null;
  islem_gordu?: boolean;
  islem_sebep?: string | null;
};

export const SCENES: SceneKind[] = ["official", "club", "lounge", "night", "fire"];
export function toScene(kategori: string | null): SceneKind {
  return kategori && (SCENES as string[]).includes(kategori) ? (kategori as SceneKind) : "club";
}

function mapRoom(r: OdaRow, hostName: string, myId: number | null): Room {
  return {
    id: r.public_id,
    dbId: r.id,
    name: r.ad,
    host: hostName,
    online: r.aktif_katilimci_sayisi,
    mic: 0, // canlı koltuk verisi Faz 4 (presence) ile gelecek
    extra: r.aktif_katilimci_sayisi,
    live: r.aktif_katilimci_sayisi > 0,
    scene: toScene(r.kategori),
    mod: r.oda_modu === "parti" ? "parti" : "sesli",
    locked: !r.herkese_acik,
    owner: myId != null && r.olusturan_id === myId,
    ownerId: r.olusturan_id ?? undefined,
    crowd: [],
    photo: r.kapak_url || undefined,
    announce: r.aciklama || undefined,
    createdAt: Date.parse(r.olusturulma_tarihi) || undefined,
    official: r.resmi || undefined,
    daily: r.gunluk_sira ?? undefined,
    islemGordu: r.islem_gordu || undefined,
    islemSebep: r.islem_sebep ?? undefined,
    kimlikSifirlandi: odaKimligiSifirlandiMi(r.public_id) || undefined,
  };
}

async function fetchHostNames(ids: number[]): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  const uniq = [...new Set(ids.filter((x): x is number => x != null))];
  if (uniq.length === 0) return map;
  const sb = requireSupabase();
  const { data } = await sb.from("profiller").select("id, kullanici_adi").in("id", uniq);
  for (const row of (data as { id: number; kullanici_adi: string }[]) ?? []) {
    map.set(row.id, row.kullanici_adi);
  }
  return map;
}

async function odalariGetir<T>(
  kur: (cols: string) => PromiseLike<{ data: unknown; error: unknown }>,
): Promise<T> {
  const ilk = await kur(SELECT_COLS);
  if (!ilk.error) return ilk.data as T;
  if (!kolonYok(ilk.error)) throw ilk.error;
  console.warn("[odalar] oda_modu kolonu yok — vitrin kolonlarina dusuluyor");
  const orta = await kur(VITRINLI_COLS);
  if (!orta.error) return orta.data as T;
  if (!kolonYok(orta.error)) throw orta.error;
  console.warn("[odalar] vitrin kolonlari yok (052 uygulanmamis) — temel kolonlara dusuluyor");
  const geri = await kur(TEMEL_COLS);
  if (geri.error) throw geri.error;
  return geri.data as T;
}

export async function listRooms(limit = 50): Promise<Room[]> {
  const sb = requireSupabase();
  const [data, me] = await Promise.all([
    odalariGetir<OdaRow[] | null>((cols) =>
      sb
        .from("odalar")
        .select(cols)
        .eq("herkese_acik", true)
        // 079: `aktif_katilimci_sayisi` emekli (hep 0) — sıralamada anlamı
        // kalmadı. Görünen sırayı zaten istemci `sirala()` canlı sayıdan
        // kuruyor ((tabs)/index.tsx); buradaki sıra yalnız ilk karede
        // "en yeni üstte" olarak görünür.
        .order("olusturulma_tarihi", { ascending: false })
        .limit(limit),
    ),
    getMyProfile().catch(() => null),
  ]);
  const rows = (data ?? []).filter((r) => !odaKimligiSifirlandiMi(r.public_id));
  console.log(`[liste] db=${rows.length} oda`);
  const hosts = await fetchHostNames(rows.map((r) => r.olusturan_id).filter((x): x is number => x != null));
  return rozetleriBagla(rows.map((r) => mapRoom(r, hosts.get(r.olusturan_id ?? -1) || "Kullanıcı", me?.id ?? null)));
}

export async function getMyRoom(): Promise<Room | null> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return null;
  const data = await odalariGetir<OdaRow | null>((cols) =>
    sb
      .from("odalar")
      .select(cols)
      .eq("olusturan_id", me.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  if (!data) return null;
  const [oda] = await rozetleriBagla([mapRoom(data, me.kullanici_adi, me.id)]);
  return oda ?? null;
}

function genRoomId(): string {
  return String(Math.floor(100000 + Math.random() * 899999));
}

export type RoomMessage = { id: number; uid: number | null; name: string; photo?: string; publicId?: string; text: string; time: string; me: boolean };

function hhmm(iso: string): string {
  return new Date(iso).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

export async function getRoomMessages(odaId: number, limit = 60): Promise<RoomMessage[]> {
  const sb = requireSupabase();
  const [{ data, error }, me] = await Promise.all([
    sb.from("oda_mesajlari").select("id, kullanici_id, icerik, gonderilme_tarihi").eq("oda_id", odaId).order("gonderilme_tarihi", { ascending: false }).limit(limit),
    getMyProfile().catch(() => null),
  ]);
  if (error) throw error;
  const rows = ((data as { id: number; kullanici_id: number | null; icerik: string; gonderilme_tarihi: string }[]) ?? []).reverse();
  const ids = [...new Set(rows.map((r) => r.kullanici_id).filter((x): x is number => x != null))];
  const names = new Map<number, { kullanici_adi: string; profil_resmi: string | null; public_id: string }>();
  if (ids.length) {
    const { data: profs } = await sb.from("profiller").select("id, public_id, kullanici_adi, profil_resmi").in("id", ids);
    for (const p of (profs as { id: number; public_id: string; kullanici_adi: string; profil_resmi: string | null }[]) ?? []) names.set(p.id, p);
  }
  return rows.map((r) => {
    const prof = r.kullanici_id != null ? names.get(r.kullanici_id) : undefined;
    return {
      id: r.id,
      uid: r.kullanici_id,
      name: prof?.kullanici_adi || "Kullanıcı",
      photo: prof?.profil_resmi || undefined,
      publicId: prof?.public_id,
      text: r.icerik,
      time: hhmm(r.gonderilme_tarihi),
      me: me != null && r.kullanici_id === me.id,
    };
  });
}

export async function sendRoomMessage(odaId: number, text: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_mesaj_yaz", { p_oda: odaId, p_icerik: text.trim() });
  if (error) throw error;
}

export type RoomRole = "sahip" | "yardimci" | "uye";

export type RoomMember = {
  id: number;
  publicId: string;
  name: string;
  photo?: string;
  rol: RoomRole;
  katilma: string;
};

export async function getRoomMembers(odaId: number): Promise<{ members: RoomMember[]; myRole: RoomRole | null }> {
  const sb = requireSupabase();
  const [{ data, error }, me] = await Promise.all([
    sb.from("oda_uyeleri").select("kullanici_id, rol, katilma_tarihi").eq("oda_id", odaId),
    getMyProfile().catch(() => null),
  ]);
  if (error) throw error;
  const rows = (data as { kullanici_id: number; rol: RoomRole; katilma_tarihi: string }[]) ?? [];
  const ids = rows.map((r) => r.kullanici_id);
  const profs = new Map<number, { public_id: string; kullanici_adi: string; profil_resmi: string | null }>();
  if (ids.length) {
    const { data: ps } = await sb.from("profiller").select("id, public_id, kullanici_adi, profil_resmi").in("id", ids);
    for (const p of (ps as { id: number; public_id: string; kullanici_adi: string; profil_resmi: string | null }[]) ?? []) profs.set(p.id, p);
  }
  const order: Record<RoomRole, number> = { sahip: 0, yardimci: 1, uye: 2 };
  const members = rows
    .map((r) => {
      const p = profs.get(r.kullanici_id);
      return {
        id: r.kullanici_id,
        publicId: p?.public_id || "",
        name: p?.kullanici_adi || "Kullanıcı",
        photo: p?.profil_resmi || undefined,
        rol: r.rol,
        katilma: r.katilma_tarihi,
      };
    })
    .sort((a, b) => order[a.rol] - order[b.rol] || a.katilma.localeCompare(b.katilma));
  const myRole = me ? (rows.find((r) => r.kullanici_id === me.id)?.rol ?? null) : null;
  return { members, myRole };
}

export async function getMyBannedRoomIds(): Promise<number[]> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return [];
  const { data, error } = await sb.from("oda_yasaklari").select("oda_id").eq("kullanici_id", me.id);
  if (error) throw error;
  return ((data as { oda_id: number }[]) ?? []).map((r) => r.oda_id);
}

export async function getMyRoomIds(): Promise<number[]> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return [];
  const { data, error } = await sb.from("oda_uyeleri").select("oda_id").eq("kullanici_id", me.id);
  if (error) throw error;
  return ((data as { oda_id: number }[]) ?? []).map((r) => r.oda_id);
}

export async function getUserRoomCount(userId: number): Promise<number> {
  const sb = requireSupabase();
  const { count, error } = await sb
    .from("oda_uyeleri")
    .select("oda_id", { count: "exact", head: true })
    .eq("kullanici_id", userId);
  if (error) throw error;
  return count ?? 0;
}

export async function joinRoomMembership(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");
  const { error } = await sb.from("oda_uyeleri").insert({ oda_id: odaId, kullanici_id: me.id, rol: "uye" });
  if (error && (error as { code?: string }).code !== "23505") throw error;
}

export async function leaveRoomMembership(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return;
  const { error } = await sb.from("oda_uyeleri").delete().eq("oda_id", odaId).eq("kullanici_id", me.id);
  if (error) throw error;
}

export async function setRoomMemberRole(odaId: number, userId: number, rol: "yardimci" | "uye"): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_rol_ata", { p_oda_id: odaId, p_hedef: userId, p_rol: rol });
  if (error) throw error;
}

export async function removeRoomMember(odaId: number, userId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_uye_cikar", { p_oda_id: odaId, p_hedef: userId });
  if (error) throw error;
}

export type RoomBan = {
  id: number;
  publicId: string;
  name: string;
  photo?: string;
  by: string;
  at: number;
};

export async function banRoomUser(odaId: number, userId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_yasakla", { p_oda_id: odaId, p_hedef: userId });
  if (error) throw error;
}

export async function unbanRoomUser(odaId: number, userId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_yasak_kaldir", { p_oda_id: odaId, p_hedef: userId });
  if (error) throw error;
}

export async function banRoomUserByPublicId(odaId: number, publicId: string): Promise<void> {
  const sb = requireSupabase();
  const { data } = await sb.from("profiller").select("id").eq("public_id", publicId).maybeSingle();
  const id = (data as { id: number } | null)?.id;
  if (id == null) throw new Error("Kullanıcı bulunamadı.");
  await banRoomUser(odaId, id);
}

export async function listRoomBans(odaId: number): Promise<RoomBan[]> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("oda_yasaklari")
    .select("kullanici_id, yasaklayan_id, yasaklanma_tarihi")
    .eq("oda_id", odaId)
    .order("yasaklanma_tarihi", { ascending: false });
  if (error) throw error;
  const rows = (data as { kullanici_id: number; yasaklayan_id: number | null; yasaklanma_tarihi: string }[]) ?? [];
  const ids = [...new Set(rows.flatMap((r) => [r.kullanici_id, r.yasaklayan_id]).filter((x): x is number => x != null))];
  const profs = new Map<number, { public_id: string; kullanici_adi: string; profil_resmi: string | null }>();
  if (ids.length) {
    const { data: ps } = await sb.from("profiller").select("id, public_id, kullanici_adi, profil_resmi").in("id", ids);
    for (const p of (ps as { id: number; public_id: string; kullanici_adi: string; profil_resmi: string | null }[]) ?? []) profs.set(p.id, p);
  }
  return rows.map((r) => {
    const p = profs.get(r.kullanici_id);
    return {
      id: r.kullanici_id,
      publicId: p?.public_id || "",
      name: p?.kullanici_adi || "Kullanıcı",
      photo: p?.profil_resmi || undefined,
      by: (r.yasaklayan_id != null ? profs.get(r.yasaklayan_id)?.kullanici_adi : undefined) || "Yönetici",
      at: new Date(r.yasaklanma_tarihi).getTime(),
    };
  });
}

export type MicBan = { sebep: string | null; bitis: number | null; kalici: boolean };

export async function getMyMicBan(): Promise<MicBan | null> {
  const sb = requireSupabase();
  const { data } = await sb.rpc("benim_mic_yasagim");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    sebep: row.sebep ?? null,
    bitis: row.bitis ? new Date(row.bitis).getTime() : null,
    kalici: !!row.kalici,
  };
}

export async function amIBannedFromRoom(odaId: number): Promise<boolean> {
  const sb = requireSupabase();
  const me = await getMyProfile().catch(() => null);
  if (!me) return false;
  const { data } = await sb
    .from("oda_yasaklari")
    .select("kullanici_id")
    .eq("oda_id", odaId)
    .eq("kullanici_id", me.id)
    .maybeSingle();
  return data != null;
}

export async function logRoomMovement(odaId: number, tip: "giris" | "cikis"): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile().catch(() => null);
  if (!me) return;
  await sb.from("oda_hareket_log").insert({ oda_id: odaId, kullanici_id: me.id, tip }).then(
    () => {},
    () => {},
  );
}

export type RoomMovement = {
  id: number;
  uid: number;
  name: string;
  photo?: string;
  publicId?: string;
  tip: "giris" | "cikis";
  at: number;
};

export type RoomReportDetail = {
  oda: {
    id: number;
    publicId: string;
    name: string;
    aciklama: string | null;
    kategori: string | null;
    photo?: string;
    hostName: string;
    uyeSayisi: number;
    aktifKatilimci: number;
  } | null;
  hareketler: RoomMovement[];
  girenSayisi: number;
  cikanSayisi: number;
};

export async function getRoomReportDetail(odaId: number, limit = 200): Promise<RoomReportDetail> {
  const sb = requireSupabase();
  const [odaRes, hareketRes, uyeRes, canliRes] = await Promise.all([
    sb.from("odalar").select(SELECT_COLS).eq("id", odaId).maybeSingle(),
    sb.from("oda_hareket_log").select("id, kullanici_id, tip, tarih").eq("oda_id", odaId).order("id", { ascending: false }).limit(limit),
    sb.from("oda_uyeleri").select("kullanici_id", { count: "exact", head: true }).eq("oda_id", odaId),
    sb.from("oda_katilimcilar").select("kullanici_id", { count: "exact", head: true }).eq("oda_id", odaId)
      .gt("last_heartbeat", new Date(Date.now() - 2 * 60 * 1000).toISOString()),
  ]);

  const oRow = odaRes.data as OdaRow | null;
  const uyeSayisi = uyeRes.count ?? 0;
  const hRows = (hareketRes.data as { id: number; kullanici_id: number; tip: "giris" | "cikis"; tarih: string }[]) ?? [];

  const ids = [...new Set([...(oRow?.olusturan_id != null ? [oRow.olusturan_id] : []), ...hRows.map((h) => h.kullanici_id)])];
  const profs = new Map<number, { public_id: string; kullanici_adi: string; profil_resmi: string | null }>();
  if (ids.length) {
    const { data: ps } = await sb.from("profiller").select("id, public_id, kullanici_adi, profil_resmi").in("id", ids);
    for (const p of (ps as { id: number; public_id: string; kullanici_adi: string; profil_resmi: string | null }[]) ?? []) profs.set(p.id, p);
  }

  const hareketler: RoomMovement[] = hRows.map((h) => {
    const p = profs.get(h.kullanici_id);
    return {
      id: h.id,
      uid: h.kullanici_id,
      name: p?.kullanici_adi || "Kullanıcı",
      photo: p?.profil_resmi || undefined,
      publicId: p?.public_id,
      tip: h.tip,
      at: new Date(h.tarih).getTime(),
    };
  });

  const girenSayisi = new Set(hRows.filter((h) => h.tip === "giris").map((h) => h.kullanici_id)).size;
  const cikanSayisi = new Set(hRows.filter((h) => h.tip === "cikis").map((h) => h.kullanici_id)).size;

  return {
    oda: oRow
      ? {
          id: oRow.id,
          publicId: oRow.public_id,
          name: oRow.ad,
          aciklama: oRow.aciklama,
          kategori: oRow.kategori,
          photo: oRow.kapak_url || undefined,
          hostName: (oRow.olusturan_id != null ? profs.get(oRow.olusturan_id)?.kullanici_adi : undefined) || "Kullanıcı",
          uyeSayisi,
          aktifKatilimci: canliRes.count ?? 0,
        }
      : null,
    hareketler,
    girenSayisi,
    cikanSayisi,
  };
}

export async function updateRoomSettings(
  odaId: number,
  patch: { ad?: string; aciklama?: string | null; kategori?: string; kapak_url?: string | null },
): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("odalar").update(patch).eq("id", odaId);
  if (error) throw error;
}

export async function setRoomPassword(odaId: number, parola: string | null): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_parola_belirle", { p_oda: odaId, p_parola: parola });
  if (error) throw error;
}

export async function verifyRoomPassword(odaId: number, parola: string): Promise<boolean> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("oda_parola_dogrula", { p_oda: odaId, p_parola: parola });
  if (error) throw error;
  return !!data;
}

export async function createRoom(input: {
  name: string;
  photo?: string | null;
  aciklama?: string | null;
  kategori?: string | null;
}): Promise<Room> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await sb
      .from("odalar")
      .insert({
        public_id: genRoomId(),
        ad: input.name.trim(),
        aciklama: input.aciklama ?? null,
        kategori: input.kategori ?? "club",
        kapak_url: input.photo ?? null,
        herkese_acik: true,
        olusturan_id: me.id,
        koltuk_sayisi: 8,
      })
      .select(SELECT_COLS)
      .single();
    if (!error && data) {
      return mapRoom(data as OdaRow, me.kullanici_adi, me.id);
    }
    if ((error as { code?: string } | null)?.code === "23505") { lastErr = error; continue; }
    throw error;
  }
  throw lastErr ?? new Error("Oda oluşturulamadı.");
}

async function odalariIdIleGetir(ids: number[]): Promise<Room[]> {
  if (ids.length === 0) return [];
  const sb = requireSupabase();
  const [data, me] = await Promise.all([
    odalariGetir<OdaRow[] | null>((cols) => sb.from("odalar").select(cols).in("id", ids)),
    getMyProfile().catch(() => null),
  ]);
  const rows = data ?? [];
  const hosts = await fetchHostNames(rows.map((r) => r.olusturan_id).filter((x): x is number => x != null));
  const bul = new Map<number, Room>();
  for (const r of rows) {
    bul.set(r.id, mapRoom(r, hosts.get(r.olusturan_id ?? -1) || "Kullanıcı", me?.id ?? null));
  }
  return rozetleriBagla(ids.map((id) => bul.get(id)).filter((r): r is Room => !!r));
}

export async function ziyaretKaydet(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_ziyaret_kaydet", { p_oda_id: odaId });
  if (error && !tabloYok(error)) throw error;
}

export type OdamOdasi = Room & { sonZiyaret?: number };

export async function sonZiyaretEdilenOdalar(limit = 20): Promise<OdamOdasi[]> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return [];
  const { data, error } = await sb
    .from("oda_ziyaretleri")
    .select("oda_id, son_giris")
    .eq("kullanici_id", me.id)
    .order("son_giris", { ascending: false })
    .limit(limit);
  if (error) {
    if (tabloYok(error)) return [];
    throw error;
  }
  const satirlar = (data as { oda_id: number; son_giris: string }[]) ?? [];
  const zaman = new Map(satirlar.map((r) => [r.oda_id, Date.parse(r.son_giris)]));
  const odalar = await odalariIdIleGetir(satirlar.map((r) => r.oda_id));
  return odalar.map((o) => ({ ...o, sonZiyaret: o.dbId != null ? zaman.get(o.dbId) : undefined }));
}

export async function katildigimOdalar(limit = 50): Promise<Room[]> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return [];
  const { data, error } = await sb
    .from("oda_uyeleri")
    .select("oda_id, katilma_tarihi")
    .eq("kullanici_id", me.id)
    .order("katilma_tarihi", { ascending: false })
    .limit(limit);
  if (error) {
    if (tabloYok(error)) return [];
    throw error;
  }
  return odalariIdIleGetir(((data as { oda_id: number }[]) ?? []).map((r) => r.oda_id));
}

export async function takipEttigimOdalar(limit = 50): Promise<Room[]> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return [];
  const { data, error } = await sb
    .from("oda_takip")
    .select("oda_id, tarih")
    .eq("kullanici_id", me.id)
    .order("tarih", { ascending: false })
    .limit(limit);
  if (error) {
    if (tabloYok(error)) return [];
    throw error;
  }
  return odalariIdIleGetir(((data as { oda_id: number }[]) ?? []).map((r) => r.oda_id));
}

export async function odaTakiptenMi(odaId: number): Promise<boolean> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return false;
  const { count, error } = await sb
    .from("oda_takip")
    .select("oda_id", { count: "exact", head: true })
    .eq("kullanici_id", me.id)
    .eq("oda_id", odaId);
  if (error) {
    if (tabloYok(error)) return false;
    throw error;
  }
  return (count ?? 0) > 0;
}

export async function odaTakipEt(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");
  const { error } = await sb.from("oda_takip").insert({ kullanici_id: me.id, oda_id: odaId });
  if (error && (error as { code?: string }).code !== "23505") throw error;
}

export async function odaTakiptenCik(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) return;
  const { error } = await sb.from("oda_takip").delete().eq("kullanici_id", me.id).eq("oda_id", odaId);
  if (error) throw error;
}

export type OdaSahibi = { id: number; ad: string; foto?: string; publicId?: string };

export async function odaSahibi(odaId: number): Promise<OdaSahibi | null> {
  const sb = requireSupabase();
  const { data: oda, error } = await sb.from("odalar").select("olusturan_id").eq("id", odaId).maybeSingle();
  if (error || !oda) return null;
  const sahipId = (oda as { olusturan_id: number | null }).olusturan_id;
  if (sahipId == null) return null;

  const { data: p } = await sb
    .from("profiller")
    .select("id, kullanici_adi, profil_resmi, public_id")
    .eq("id", sahipId)
    .maybeSingle();
  const pr = p as { id: number; kullanici_adi: string; profil_resmi: string | null; public_id: string } | null;
  if (!pr) return { id: sahipId, ad: "Kullanıcı" };
  return { id: pr.id, ad: pr.kullanici_adi, foto: pr.profil_resmi || undefined, publicId: pr.public_id };
}

export function odaDegisiklikleriniDinle(geriCagir: () => void): () => void {
  const sb = supabase;
  if (!sb) return () => {};

  let zamanlayici: ReturnType<typeof setTimeout> | null = null;
  const tetikle = () => {
    if (zamanlayici) clearTimeout(zamanlayici);
    zamanlayici = setTimeout(geriCagir, 400);
  };

  const ch = sb
    .channel(benzersizKanalAdi("odalar-degisim"))
    .on("postgres_changes", { event: "*", schema: "public", table: "odalar" }, tetikle)
    .subscribe();

  return () => {
    if (zamanlayici) clearTimeout(zamanlayici);
    sb.removeChannel(ch);
  };
}

async function rozetleriBagla(odalar: Room[]): Promise<Room[]> {
  const ids = odalar.map((o) => o.dbId).filter((x): x is number => x != null);
  if (ids.length === 0) return odalar;
  const harita = await odaRozetleri(ids).catch(() => new Map<number, RoomBadgeItem[]>());
  return odalar.map((o) => {
    const rz = o.dbId != null ? harita.get(o.dbId) : undefined;
    return rz && rz.length > 0 ? { ...o, badges: rz } : o;
  });
}

export async function odaRozetleri(odaIds: number[]): Promise<Map<number, RoomBadgeItem[]>> {
  const harita = new Map<number, RoomBadgeItem[]>();
  if (odaIds.length === 0) return harita;
  const sb = supabase;
  if (!sb) return harita;

  const { data, error } = await sb.rpc("oda_rozetleri_getir", { p_oda_ids: odaIds });
  if (error) {
    console.warn("[rozet]", error.code, error.message);
    return harita;
  }
  for (const r of (data as { oda_id: number; kod: string; deger: number | null }[]) ?? []) {
    const liste = harita.get(r.oda_id) ?? [];
    liste.push({ type: r.kod as RoomBadgeItem["type"], n: r.deger ?? undefined });
    harita.set(r.oda_id, liste);
  }
  return harita;
}

export type RozetKatalogu = { kod: string; ad: string; aciklama: string; kaynak: "kural" | "elle" };
export async function rozetKatalogu(): Promise<RozetKatalogu[]> {
  const sb = supabase;
  if (!sb) return [];
  const { data, error } = await sb
    .from("oda_rozet_katalogu")
    .select("kod, ad, aciklama, kaynak, sira")
    .eq("aktif", true)
    .order("sira", { ascending: true });
  if (error) return [];
  return ((data as RozetKatalogu[]) ?? []);
}

export async function odaRozetVer(odaId: number, kod: string, gun?: number, sebep?: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("admin_oda_rozet_ver", {
    p_oda_id: odaId, p_kod: kod, p_gun: gun ?? null, p_sebep: sebep ?? null,
  });
  if (error) throw error;
}

export async function odaRozetAl(odaId: number, kod: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("admin_oda_rozet_al", { p_oda_id: odaId, p_kod: kod });
  if (error) throw error;
}

export async function odaVerilenRozetler(odaId: number): Promise<{ kod: string; ad: string; sebep: string | null; bitis: number | null }[]> {
  const sb = supabase;
  if (!sb) return [];
  const { data, error } = await sb.rpc("admin_oda_rozet_listesi", { p_oda_id: odaId });
  if (error) return [];
  return ((data as { kod: string; ad: string; sebep: string | null; bitis: string | null }[]) ?? []).map((r) => ({
    kod: r.kod, ad: r.ad, sebep: r.sebep, bitis: r.bitis ? Date.parse(r.bitis) : null,
  }));
}

const SAHIP_KOLTUK_NO = 20;
const istemcidenDbye = (i: number) => (i < 0 ? SAHIP_KOLTUK_NO : i + 1);
const dbdenIstemciye = (no: number) => (no === SAHIP_KOLTUK_NO ? -1 : no - 1);

export type KoltukSatiri = {
  koltukNo: number;
  kullaniciId: number | null;
  micAcik: boolean;
  kilitli: boolean;
  ad: string | null;
  foto: string | null;
  publicId: string | null;
  yetkili: boolean;
};

type KoltukRow = {
  koltuk_no: number;
  kullanici_id: number | null;
  susturulmus: boolean;
  kilitli: boolean;
  kullanici_adi: string | null;
  profil_resmi: string | null;
  public_id: string | null;
  yetkili: boolean;
};

export async function koltuklariGetir(odaId: number): Promise<KoltukSatiri[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("oda_koltuklari_getir", { p_oda: odaId });
  if (error) {
    if (tabloYok(error)) return [];
    throw error;
  }
  return ((data as KoltukRow[]) ?? []).map((r) => ({
    koltukNo: dbdenIstemciye(Number(r.koltuk_no)),
    kullaniciId: r.kullanici_id == null ? null : Number(r.kullanici_id),
    micAcik: !r.susturulmus,
    kilitli: !!r.kilitli,
    ad: r.kullanici_adi,
    foto: r.profil_resmi,
    publicId: r.public_id,
    yetkili: !!r.yetkili,
  }));
}

export async function koltugaOtur(odaId: number, koltuk: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("koltuga_otur", { p_oda: odaId, p_koltuk: istemcidenDbye(koltuk) });
  if (error) throw error;
}

export async function koltuktanKalk(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("koltuktan_kalk", { p_oda: odaId });
  if (error && !tabloYok(error)) throw error;
}

export async function koltukMicAyarla(odaId: number, acik: boolean): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("koltuk_mic", { p_oda: odaId, p_acik: acik });
  if (error) throw error;
}

export async function koltukSustur(odaId: number, hedefUid: number, sustur: boolean): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("koltuk_sustur", { p_oda: odaId, p_hedef: hedefUid, p_sustur: sustur });
  if (error) throw error;
}

export async function koltukKilitle(odaId: number, koltuk: number, kilit: boolean): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("koltuk_kilit", { p_oda: odaId, p_koltuk: istemcidenDbye(koltuk), p_kilit: kilit });
  if (error) throw error;
}

const TOPLAMA_MS = 45;
const TAZELE_MS = 120;
const YENIDEN_BAGLAN_TAVAN_MS = 8000;

export type KoltukOlayi = { satir: KoltukSatiri; silindi: boolean };

export function koltuklariDinle(
  odaId: number,
  isleyiciler: { anlik: (olaylar: KoltukOlayi[]) => void; tazele: () => void },
): () => void {
  const sb = supabase;
  if (!sb) return () => {};

  let kuyruk: KoltukOlayi[] = [];
  let toplaZaman: ReturnType<typeof setTimeout> | null = null;
  let tazeleZaman: ReturnType<typeof setTimeout> | null = null;
  let baglanZaman: ReturnType<typeof setTimeout> | null = null;
  let kanal: ReturnType<typeof sb.channel> | null = null;
  let kapandi = false;
  let deneme = 0;

  const bosalt = () => {
    toplaZaman = null;
    if (!kuyruk.length || kapandi) return;
    const toplu = kuyruk;
    kuyruk = [];
    isleyiciler.anlik(toplu);
  };

  const olayGeldi = (yuk: { eventType: string; new?: unknown; old?: unknown }) => {
    const silindi = yuk.eventType === "DELETE";
    const ham = (silindi ? yuk.old : yuk.new) as Partial<KoltukRow> | undefined;
    if (ham?.koltuk_no != null) {
      kuyruk.push({
        satir: {
          koltukNo: dbdenIstemciye(Number(ham.koltuk_no)),
          kullaniciId: ham.kullanici_id == null ? null : Number(ham.kullanici_id),
          micAcik: !ham.susturulmus,
          kilitli: !!ham.kilitli,
          ad: null,
          foto: null,
          publicId: null,
          yetkili: false,
        },
        silindi,
      });
      if (!toplaZaman) toplaZaman = setTimeout(bosalt, TOPLAMA_MS);
    }
    if (tazeleZaman) clearTimeout(tazeleZaman);
    tazeleZaman = setTimeout(isleyiciler.tazele, TAZELE_MS);
  };

  const kur = () => {
    if (kapandi) return;
    kanal = sb
      .channel(benzersizKanalAdi(`oda-koltuk-${odaId}`))
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oda_koltuklari", filter: `oda_id=eq.${odaId}` },
        olayGeldi as never,
      )
      .subscribe((durum) => {
        if (kapandi) return;
        if (durum === "SUBSCRIBED") {
          deneme = 0;
          isleyiciler.tazele();
          return;
        }
        if (durum !== "CHANNEL_ERROR" && durum !== "TIMED_OUT" && durum !== "CLOSED") return;
        console.warn(`[koltuk] kanal ${durum} — yeniden baglaniyor`);
        baglantiSuphesi();
        if (baglanZaman) clearTimeout(baglanZaman);
        const bekle = Math.min(YENIDEN_BAGLAN_TAVAN_MS, 500 * Math.pow(2, deneme++));
        baglanZaman = setTimeout(() => {
          baglanZaman = null;
          if (kapandi) return;
          if (kanal) { sb.removeChannel(kanal); kanal = null; }
          kur();
        }, bekle);
      });
  };

  kur();

  return () => {
    kapandi = true;
    if (toplaZaman) clearTimeout(toplaZaman);
    if (tazeleZaman) clearTimeout(tazeleZaman);
    if (baglanZaman) clearTimeout(baglanZaman);
    if (kanal) sb.removeChannel(kanal);
  };
}

export type MicSirasiSatiri = { uid: number; name: string; photo?: string; publicId?: string; at: number };

export async function koltuktanIndir(odaId: number, hedefId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("koltuktan_indir", { p_oda: odaId, p_hedef: hedefId });
  if (error) throw error;
}

export async function micSirasiGetir(odaId: number): Promise<MicSirasiSatiri[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("mic_sirasi_getir", { p_oda: odaId });
  if (error) {
    if (tabloYok(error)) return [];
    throw error;
  }
  type Satir = { kullanici_id: number; kullanici_adi: string | null; profil_resmi: string | null; public_id: string | null; talep_tarihi: string };
  return ((data as Satir[]) ?? []).map((r) => ({
    uid: Number(r.kullanici_id),
    name: r.kullanici_adi || "Kullanıcı",
    photo: r.profil_resmi || undefined,
    publicId: r.public_id || undefined,
    at: Date.parse(r.talep_tarihi) || 0,
  }));
}

export async function micSirasinaGir(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("mic_sirasina_gir", { p_oda: odaId });
  if (error) throw error;
}

export async function micSirasindanCik(odaId: number, hedefId?: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("mic_sirasindan_cik", { p_oda: odaId, p_hedef: hedefId ?? null });
  if (error) throw error;
}

export async function micSirasiOnayla(odaId: number, hedefId: number, koltuk?: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("mic_sirasi_onayla", {
    p_oda: odaId,
    p_hedef: hedefId,
    p_koltuk: koltuk == null ? null : istemcidenDbye(koltuk),
  });
  if (error) throw error;
}

export function micSirasiniDinle(odaId: number, geriCagir: () => void): () => void {
  const sb = supabase;
  if (!sb) return () => {};
  let zamanlayici: ReturnType<typeof setTimeout> | null = null;
  const ch = sb
    .channel(benzersizKanalAdi(`oda-mic-sirasi-${odaId}`))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "oda_mic_sirasi", filter: `oda_id=eq.${odaId}` },
      () => {
        if (zamanlayici) clearTimeout(zamanlayici);
        zamanlayici = setTimeout(geriCagir, 80);
      },
    )
    .subscribe((durum) => {
      if (durum !== "SUBSCRIBED") { console.warn(`[mic-sirasi] kanal ${durum}`); baglantiSuphesi(); }
    });
  return () => {
    if (zamanlayici) clearTimeout(zamanlayici);
    sb.removeChannel(ch);
  };
}

export type OdaKatilimcisi = {
  uid: number;
  name: string;
  photo?: string;
  publicId?: string;
  yetkili: boolean;
  at: number;
};

export async function odayaKatil(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("odaya_katil", { p_oda: odaId });
  if (error && !tabloYok(error)) throw error;
}

export async function odaKalpAtisi(odaId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("oda_kalp_atisi", { p_oda: odaId });
  if (error && !tabloYok(error)) throw error;
}

export async function odadanAyril(): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.rpc("odadan_ayril");
  if (error && !tabloYok(error)) throw error;
}

export async function odaKatilimcilariGetir(odaId: number): Promise<OdaKatilimcisi[]> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("oda_katilimcilari_getir", { p_oda: odaId });
  if (error) {
    if (tabloYok(error)) return [];
    throw error;
  }
  type Satir = { kullanici_id: number; kullanici_adi: string | null; profil_resmi: string | null; public_id: string | null; yetkili: boolean; giris_tarihi: string };
  return ((data as Satir[]) ?? []).map((r) => ({
    uid: Number(r.kullanici_id),
    name: r.kullanici_adi || "Kullanıcı",
    photo: r.profil_resmi || undefined,
    publicId: r.public_id || undefined,
    yetkili: !!r.yetkili,
    at: Date.parse(r.giris_tarihi) || 0,
  }));
}

const KATILIMCI_YEDEK_MS = 8000;

export function odaKatilimcilariniDinle(odaId: number, geriCagir: () => void): () => void {
  const sb = supabase;
  if (!sb) return () => {};
  let zamanlayici: ReturnType<typeof setTimeout> | null = null;
  let yedek: ReturnType<typeof setInterval> | null = null;
  const yedegiDurdur = () => { if (yedek) { clearInterval(yedek); yedek = null; } };
  const ch = sb
    .channel(benzersizKanalAdi(`oda-katilimci-${odaId}`))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "oda_katilimcilar", filter: `oda_id=eq.${odaId}` },
      () => {
        if (zamanlayici) clearTimeout(zamanlayici);
        zamanlayici = setTimeout(geriCagir, 120);
      },
    )
    .subscribe((durum) => {
      if (durum === "SUBSCRIBED") { yedegiDurdur(); return; }
      console.warn(`[katilimci] kanal ${durum}`);
      baglantiSuphesi();
      if ((durum === "CHANNEL_ERROR" || durum === "TIMED_OUT") && !yedek) {
        yedek = setInterval(geriCagir, KATILIMCI_YEDEK_MS);
      }
    });
  return () => {
    if (zamanlayici) clearTimeout(zamanlayici);
    yedegiDurdur();
    sb.removeChannel(ch);
  };
}

export async function odaKisiSayilari(): Promise<Map<number, number>> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("oda_kisi_sayilari");
  if (error) {
    if (tabloYok(error)) return new Map();
    throw error;
  }
  const m = new Map<number, number>();
  for (const r of (data as { oda_id: number; sayi: number }[]) ?? []) {
    m.set(Number(r.oda_id), Number(r.sayi));
  }
  return m;
}

const SAYAC_YEDEK_MS = 15000;

export function odaKisiSayilariniDinle(geriCagir: () => void): () => void {
  const sb = supabase;
  if (!sb) return () => {};
  let zamanlayici: ReturnType<typeof setTimeout> | null = null;
  let yedek: ReturnType<typeof setInterval> | null = null;
  const yedegiDurdur = () => { if (yedek) { clearInterval(yedek); yedek = null; } };
  const ch = sb
    .channel(benzersizKanalAdi("oda-kisi-sayilari"))
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "oda_katilimcilar" },
      () => {
        if (zamanlayici) clearTimeout(zamanlayici);
        zamanlayici = setTimeout(geriCagir, 250);
      },
    )
    .subscribe((durum) => {
      if (durum === "SUBSCRIBED") { yedegiDurdur(); return; }
      console.warn(`[oda-sayi] kanal ${durum}`);
      baglantiSuphesi();
      if ((durum === "CHANNEL_ERROR" || durum === "TIMED_OUT") && !yedek) {
        yedek = setInterval(geriCagir, SAYAC_YEDEK_MS);
      }
    });
  return () => {
    if (zamanlayici) clearTimeout(zamanlayici);
    yedegiDurdur();
    sb.removeChannel(ch);
  };
}

export type OdaSeviyeBilgi = {
  ad: string;
  sira: number;
  deneyim: number;
  esik: number;
  sonrakiEsik: number | null;
  sonrakiAd: string | null;
  kapasiteBonusu: number;
};

export type OdaIstatistik = {
  seviye: OdaSeviyeBilgi | null;
  deneyim: number | null;
  ziyaretci: number | null;
  uye: number | null;
  takipci: number | null;
  kapasite: number | null;
  kurulus: number | null;
  hafta: { gun: string; deger: number }[] | null;
};

const BOS_ISTATISTIK: OdaIstatistik = {
  seviye: null, deneyim: null, ziyaretci: null, uye: null,
  takipci: null, kapasite: null, kurulus: null, hafta: null,
};

function yumusak<T>(p: PromiseLike<T>, yedek: T): Promise<T> {
  return Promise.resolve(p).then(
    (v) => v,
    () => yedek,
  );
}

const GUN_ADI = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

async function odaSayim(tablo: string, odaId: number): Promise<number | null> {
  const sb = requireSupabase();
  const { count, error } = await sb.from(tablo).select("oda_id", { count: "exact", head: true }).eq("oda_id", odaId);
  if (error) return null;
  return count ?? 0;
}

async function odaSeviyesi(odaId: number): Promise<{ seviye: OdaSeviyeBilgi | null; deneyim: number | null; kapasite: number | null; kurulus: number | null }> {
  const sb = requireSupabase();
  const bos = { seviye: null, deneyim: null, kapasite: null, kurulus: null };
  const { data, error } = await sb
    .from("odalar")
    .select("toplam_deneyim, temel_kapasite, olusturulma_tarihi")
    .eq("id", odaId)
    .maybeSingle();
  if (error || !data) {
    if (error && !tabloYok(error) && !kolonYok(error)) console.warn("[oda-istatistik]", error.message);
    return bos;
  }
  const r = data as { toplam_deneyim?: number | null; temel_kapasite?: number | null; olusturulma_tarihi?: string | null };
  const deneyim = Number(r.toplam_deneyim ?? 0);
  const kurulus = r.olusturulma_tarihi ? Date.parse(r.olusturulma_tarihi) : null;

  const { data: sev, error: sevHata } = await sb
    .from("oda_seviyeleri")
    .select("ad, minimum_deneyim_puani, maks_katilimci_bonusu")
    .order("minimum_deneyim_puani", { ascending: true });
  if (sevHata || !sev || sev.length === 0) {
    return { seviye: null, deneyim, kapasite: r.temel_kapasite ?? null, kurulus };
  }
  const basamaklar = (sev as { ad: string; minimum_deneyim_puani: number; maks_katilimci_bonusu: number }[]).map((x) => ({
    ad: String(x.ad),
    esik: Number(x.minimum_deneyim_puani ?? 0),
    bonus: Number(x.maks_katilimci_bonusu ?? 0),
  }));
  let i = 0;
  while (i + 1 < basamaklar.length && deneyim >= basamaklar[i + 1].esik) i += 1;
  const su = basamaklar[i];
  const sonraki = basamaklar[i + 1] ?? null;
  const temel = r.temel_kapasite ?? null;
  return {
    seviye: {
      ad: su.ad,
      sira: i + 1,
      deneyim,
      esik: su.esik,
      sonrakiEsik: sonraki ? sonraki.esik : null,
      sonrakiAd: sonraki ? sonraki.ad : null,
      kapasiteBonusu: su.bonus,
    },
    deneyim,
    kapasite: temel == null ? null : temel + su.bonus,
    kurulus,
  };
}

async function odaHaftalik(odaId: number): Promise<{ gun: string; deger: number }[] | null> {
  const sb = requireSupabase();
  const basla = new Date();
  basla.setHours(0, 0, 0, 0);
  basla.setDate(basla.getDate() - 6);
  const { data, error } = await sb
    .from("oda_hareket_log")
    .select("tarih")
    .eq("oda_id", odaId)
    .gte("tarih", basla.toISOString())
    .limit(5000);
  if (error || !data) return null;
  const kova = new Map<string, number>();
  for (let g = 0; g < 7; g += 1) {
    const d = new Date(basla);
    d.setDate(basla.getDate() + g);
    kova.set(d.toDateString(), 0);
  }
  for (const satir of data as { tarih: string }[]) {
    const anahtar = new Date(satir.tarih).toDateString();
    if (kova.has(anahtar)) kova.set(anahtar, (kova.get(anahtar) ?? 0) + 1);
  }
  return [...kova.entries()].map(([anahtar, deger]) => ({
    gun: GUN_ADI[new Date(anahtar).getDay()],
    deger,
  }));
}

export async function odaIstatistikleri(odaId: number): Promise<OdaIstatistik> {
  if (!supabase) return BOS_ISTATISTIK;
  const [temel, ziyaretci, uye, takipci, hafta] = await Promise.all([
    yumusak(odaSeviyesi(odaId), { seviye: null, deneyim: null, kapasite: null, kurulus: null }),
    yumusak(odaSayim("oda_ziyaretleri", odaId), null),
    yumusak(odaSayim("oda_uyeleri", odaId), null),
    yumusak(odaSayim("oda_takip", odaId), null),
    yumusak(odaHaftalik(odaId), null),
  ]);
  return { ...temel, ziyaretci, uye, takipci, hafta };
}
