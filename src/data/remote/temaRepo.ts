import { isSupabaseConfigured, requireSupabase } from "@/lib/supabase";

export type TemaIkon = { aktif?: string; pasif?: string };

export type TemaIcerik = {
  ustGorsel?: string;
  ustYukseklik?: number;
  ustOran?: number;
  parilti?: string;
  suzulme?: number;
  navGorsel?: string;
  navIkonlar?: Record<string, TemaIkon>;
  yaziAna?: string;
  yaziSolgun?: string;
  vurgu?: string;
  perde?: number;
  zemin?: string;
};

export type Tema = {
  kod: string;
  ad: string;
  icerik: TemaIcerik;
  bitis: string | null;
};

function metin(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v : undefined;
}

function sayi(v: unknown, enAz: number, enCok: number): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  return Math.min(enCok, Math.max(enAz, n));
}

function ikonlar(v: unknown): Record<string, TemaIkon> | undefined {
  if (!v || typeof v !== "object" || Array.isArray(v)) return undefined;
  const cikti: Record<string, TemaIkon> = {};
  for (const [ad, deger] of Object.entries(v as Record<string, unknown>)) {
    if (!deger || typeof deger !== "object") continue;
    const d = deger as Record<string, unknown>;
    const par = { aktif: metin(d.aktif), pasif: metin(d.pasif) };
    if (par.aktif || par.pasif) cikti[ad] = par;
  }
  return Object.keys(cikti).length ? cikti : undefined;
}

function mapIcerik(ham: unknown): TemaIcerik {
  const r = (ham && typeof ham === "object" ? ham : {}) as Record<string, unknown>;
  return {
    ustGorsel: metin(r.ustGorsel),
    ustYukseklik: sayi(r.ustYukseklik, 40, 420),
    ustOran: sayi(r.ustOran, 0.8, 6),
    parilti: metin(r.parilti),
    suzulme: sayi(r.suzulme, 0, 40),
    navGorsel: metin(r.navGorsel),
    navIkonlar: ikonlar(r.navIkonlar),
    yaziAna: metin(r.yaziAna),
    yaziSolgun: metin(r.yaziSolgun),
    vurgu: metin(r.vurgu),
    perde: sayi(r.perde, 0, 1),
    zemin: metin(r.zemin),
  };
}

export async function aktifTema(): Promise<Tema | null> {
  if (!isSupabaseConfigured) return null;
  const sb = requireSupabase();
  const { data, error } = await sb.rpc("aktif_tema");
  if (error) {
    console.warn("[aktif_tema]", error.message);
    return null;
  }
  const r = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
  if (!r) return null;
  return {
    kod: String(r.kod ?? ""),
    ad: String(r.ad ?? ""),
    icerik: mapIcerik(r.icerik),
    bitis: r.bitis == null ? null : String(r.bitis),
  };
}
