import { type FeedComment, type FeedPost, type FeedScope } from "@/data/feed";
import { getMyProfile, resmiMi, resmiYukle } from "@/data/remote/profileRepo";
import { requireSupabase } from "@/lib/supabase";

export const FEED_ID_OFFSET = 1_000_000_000;

export async function resmiGonderiEkle(hesapId: number, icerik: string): Promise<number> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("resmi_gonderi_ekle", { p_hesap_id: hesapId, p_icerik: icerik.trim() });
  if (error) throw error;
  return Number(data);
}

const SELECT_COLS =
  "id, public_id, kullanici_id, icerik, kapsam, begeni_sayisi, yorum_sayisi, sabitlenmis, olusturulma_tarihi";

type GonderiRow = {
  id: number;
  public_id: string;
  kullanici_id: number;
  icerik: string | null;
  kapsam: string;
  begeni_sayisi: number;
  yorum_sayisi: number;
  sabitlenmis: boolean;
  olusturulma_tarihi: string;
};

type Author = { kullanici_adi: string; seviye_id: number | null; public_id: string; profil_resmi: string | null };

function toScope(kapsam: string): FeedScope {
  return kapsam === "arkadaslar" ? "arkadaslar" : "herkes";
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "şimdi";
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  return `${Math.floor(h / 24)} gün önce`;
}

function mapPost(r: GonderiRow, author: Author | undefined, myId: number | null, comments: FeedComment[]): FeedPost {
  return {
    id: FEED_ID_OFFSET + r.id,
    type: "user",
    who: author?.kullanici_adi || "Kullanıcı",
    publicId: author?.public_id,
    authorId: r.kullanici_id,
    photo: author?.profil_resmi || undefined,
    lv: author?.seviye_id ?? 1,
    vip: false,
    body: r.icerik || "",
    when: timeAgo(r.olusturulma_tarihi),
    likes: r.begeni_sayisi,
    room: null,
    scope: toScope(r.kapsam),
    comments,
    mine: myId != null && r.kullanici_id === myId,
    resmi: resmiMi(r.kullanici_id),
    pinned: r.sabitlenmis,
  };
}

async function fetchAuthors(ids: number[]): Promise<Map<number, Author>> {
  const map = new Map<number, Author>();
  const uniq = [...new Set(ids)];
  if (uniq.length === 0) return map;
  const sb = requireSupabase();
  const { data } = await sb.from("profiller").select("id, public_id, kullanici_adi, seviye_id, profil_resmi").in("id", uniq);
  for (const row of (data as { id: number; public_id: string; kullanici_adi: string; seviye_id: number | null; profil_resmi: string | null }[]) ?? []) {
    map.set(row.id, { kullanici_adi: row.kullanici_adi, seviye_id: row.seviye_id, public_id: row.public_id, profil_resmi: row.profil_resmi });
  }
  return map;
}

type YorumRow = { id: number; gonderi_id: number; kullanici_id: number; ust_yorum_id: number | null; icerik: string; olusturulma_tarihi: string };

const YORUM_COLS = "id, gonderi_id, kullanici_id, ust_yorum_id, icerik, olusturulma_tarihi";

function yorumAgaci(rows: YorumRow[], authors: Map<number, Author>, myId: number | null): Map<number, FeedComment[]> {
  const nameOf = (uid: number) => authors.get(uid)?.kullanici_adi || "Kullanıcı";
  const pidOf = (uid: number) => authors.get(uid)?.public_id;
  const photoOf = (uid: number) => authors.get(uid)?.profil_resmi || undefined;

  const byPost = new Map<number, FeedComment[]>();
  const byCid = new Map<number, FeedComment>();
  for (const c of rows.filter((c) => c.ust_yorum_id == null)) {
    const fc: FeedComment = { cid: c.id, uid: c.kullanici_id, who: nameOf(c.kullanici_id), publicId: pidOf(c.kullanici_id), photo: photoOf(c.kullanici_id), text: c.icerik, mine: myId === c.kullanici_id, replies: [] };
    byCid.set(c.id, fc);
    const arr = byPost.get(c.gonderi_id) ?? [];
    arr.push(fc);
    byPost.set(c.gonderi_id, arr);
  }
  for (const r of rows.filter((c) => c.ust_yorum_id != null)) {
    const parent = byCid.get(r.ust_yorum_id as number);
    if (parent) parent.replies.push({ cid: r.id, uid: r.kullanici_id, who: nameOf(r.kullanici_id), publicId: pidOf(r.kullanici_id), photo: photoOf(r.kullanici_id), text: r.icerik, mine: myId === r.kullanici_id });
  }
  return byPost;
}

export type FeedResult = { posts: FeedPost[]; likedIds: number[] };

export async function listPosts(limit = 50): Promise<FeedResult> {
  const sb = requireSupabase();
  const [{ data, error }, me] = await Promise.all([
    sb
      .from("gonderiler")
      .select(SELECT_COLS)
      .order("sabitlenmis", { ascending: false })
      .order("olusturulma_tarihi", { ascending: false })
      .limit(limit),
    getMyProfile().catch(() => null),
    resmiYukle(),
  ]);
  if (error) throw error;
  const rows = (data as GonderiRow[]) ?? [];
  if (rows.length === 0) return { posts: [], likedIds: [] };
  const postIds = rows.map((r) => r.id);

  const [commentsRes, likesRes] = await Promise.all([
    sb
      .from("gonderi_yorumlari")
      .select("id, gonderi_id, kullanici_id, ust_yorum_id, icerik, olusturulma_tarihi")
      .in("gonderi_id", postIds)
      .order("olusturulma_tarihi", { ascending: true }),
    me
      ? sb.from("gonderi_begeniler").select("gonderi_id").eq("kullanici_id", me.id).in("gonderi_id", postIds)
      : Promise.resolve({ data: [] as { gonderi_id: number }[] }),
  ]);
  const allComments = (commentsRes.data as YorumRow[]) ?? [];
  const myLikes = new Set(((likesRes.data as { gonderi_id: number }[]) ?? []).map((x) => x.gonderi_id));

  const authors = await fetchAuthors([...rows.map((r) => r.kullanici_id), ...allComments.map((c) => c.kullanici_id)]);
  const byPost = yorumAgaci(allComments, authors, me?.id ?? null);

  const posts = rows.map((r) => mapPost(r, authors.get(r.kullanici_id), me?.id ?? null, byPost.get(r.id) ?? []));
  const likedIds = rows.filter((r) => myLikes.has(r.id)).map((r) => FEED_ID_OFFSET + r.id);
  return { posts, likedIds };
}

export async function getPost(postDbId: number): Promise<{ post: FeedPost; liked: boolean } | null> {
  const sb = requireSupabase();
  const [{ data, error }, me] = await Promise.all([
    sb.from("gonderiler").select(SELECT_COLS).eq("id", postDbId).maybeSingle(),
    getMyProfile().catch(() => null),
  ]);
  if (error) throw error;
  if (!data) return null;
  const row = data as GonderiRow;

  const [commentsRes, likeRes] = await Promise.all([
    sb.from("gonderi_yorumlari").select(YORUM_COLS).eq("gonderi_id", postDbId).order("olusturulma_tarihi", { ascending: true }),
    me
      ? sb.from("gonderi_begeniler").select("gonderi_id").eq("kullanici_id", me.id).eq("gonderi_id", postDbId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const yorumlar = (commentsRes.data as YorumRow[]) ?? [];
  const authors = await fetchAuthors([row.kullanici_id, ...yorumlar.map((c) => c.kullanici_id)]);
  const comments = yorumAgaci(yorumlar, authors, me?.id ?? null).get(postDbId) ?? [];
  return { post: mapPost(row, authors.get(row.kullanici_id), me?.id ?? null, comments), liked: !!likeRes.data };
}

export async function likePost(postDbId: number): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");
  const { error } = await sb.from("gonderi_begeniler").insert({ gonderi_id: postDbId, kullanici_id: me.id });
  if (error && (error as { code?: string }).code !== "23505") throw error;
}

export async function unlikePost(postDbId: number): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("gonderi_begeniler").delete().eq("gonderi_id", postDbId);
  if (error) throw error;
}

export async function addComment(postDbId: number, icerik: string): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");
  const { error } = await sb.from("gonderi_yorumlari").insert({ gonderi_id: postDbId, kullanici_id: me.id, icerik: icerik.trim() });
  if (error) throw error;
}

export async function addReply(parentCommentId: number, postDbId: number, icerik: string): Promise<void> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");
  const { error } = await sb
    .from("gonderi_yorumlari")
    .insert({ gonderi_id: postDbId, kullanici_id: me.id, ust_yorum_id: parentCommentId, icerik: icerik.trim() });
  if (error) throw error;
}

export async function deleteComment(commentDbId: number): Promise<void> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("yorum_sil", { p_yorum_id: commentDbId });
  if (error) throw error;
  if (data === false) throw new Error("Yorum silinemedi (yetki yok ya da bulunamadı).");
}

export async function editPost(postDbId: number, icerik: string): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("gonderiler").update({ icerik: icerik.trim() }).eq("id", postDbId);
  if (error) throw error;
}

export async function deletePost(postDbId: number): Promise<void> {
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("gonderi_sil", { p_gonderi_id: postDbId });
  if (error) throw error;
  if (data === false) throw new Error("Gönderi silinemedi (yetki yok ya da bulunamadı).");
}

export async function setPinned(postDbId: number, pinned: boolean): Promise<void> {
  const sb = requireSupabase();
  const { error } = await sb.from("gonderiler").update({ sabitlenmis: pinned }).eq("id", postDbId);
  if (error) throw error;
}

function genPublicId(): string {
  return (Date.now().toString(36) + Math.random().toString(36).slice(2)).slice(0, 12);
}

export async function createPost(icerik: string): Promise<FeedPost> {
  const sb = requireSupabase();
  const me = await getMyProfile();
  if (!me) throw new Error("Profil bulunamadı.");

  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    const { data, error } = await sb
      .from("gonderiler")
      .insert({
        public_id: genPublicId(),
        kullanici_id: me.id,
        icerik: icerik.trim(),
        kapsam: "herkes",
      })
      .select(SELECT_COLS)
      .single();
    if (!error && data) {
      return mapPost(data as GonderiRow, { kullanici_adi: me.kullanici_adi, seviye_id: me.seviye_id, public_id: me.public_id, profil_resmi: me.profil_resmi }, me.id, []);
    }
    if ((error as { code?: string } | null)?.code === "23505") { lastErr = error; continue; }
    throw error;
  }
  throw lastErr ?? new Error("Gönderi paylaşılamadı.");
}

export async function gonderiIdBul(publicId: string): Promise<number | null> {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from("gonderiler")
    .select("id")
    .eq("public_id", publicId)
    .maybeSingle();
  if (error || !data) return null;
  const id = Number((data as { id: number }).id);
  return Number.isFinite(id) ? FEED_ID_OFFSET + id : null;
}
