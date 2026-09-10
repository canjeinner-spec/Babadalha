import { type RealtimeChannel } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";
import { type PlatformKodu } from "@/oda/platform";

export type LobiOdasi = {
  odaId: string;
  ad: string;
  sahip: string;
  sahipFoto?: string;
  platform: PlatformKodu;
  baslik: string | null;
  kapak: string | null;
  kisi: number;
  ilerleme: number;
  an: number;
};

const LOBI = "parti-lobi";

function odaCoz(ham: unknown): LobiOdasi | null {
  if (!ham || typeof ham !== "object") return null;
  const o = ham as Partial<LobiOdasi>;
  if (!o.odaId || !o.platform) return null;
  return {
    odaId: String(o.odaId),
    ad: String(o.ad ?? "Parti"),
    sahip: String(o.sahip ?? ""),
    sahipFoto: o.sahipFoto ? String(o.sahipFoto) : undefined,
    platform: o.platform as PlatformKodu,
    baslik: o.baslik ?? null,
    kapak: o.kapak ?? null,
    kisi: Number(o.kisi ?? 1),
    ilerleme: Math.max(0, Math.min(1, Number(o.ilerleme ?? 0))),
    an: Number(o.an ?? Date.now()),
  };
}

let kanal: RealtimeChannel | null = null;
let hazir = false;
let sayac = 0;
const dinleyiciler = new Set<(odalar: LobiOdasi[]) => void>();
let yayinlanan: LobiOdasi | null = null;

const anahtar = `lobi-${Math.random().toString(36).slice(2, 9)}`;

function listeCikar(): LobiOdasi[] {
  if (!kanal) return [];
  const durum = kanal.presenceState<Record<string, unknown>>();
  const cikti: LobiOdasi[] = [];
  for (const girisler of Object.values(durum)) {
    for (const g of girisler as unknown[]) {
      const o = odaCoz(g);
      if (o && !cikti.some((x) => x.odaId === o.odaId)) cikti.push(o);
    }
  }
  return cikti.sort((a, b) => b.kisi - a.kisi || b.an - a.an);
}

let yayinZaman: ReturnType<typeof setTimeout> | null = null;

function yayinla(): void {
  if (yayinZaman) {
    clearTimeout(yayinZaman);
    yayinZaman = null;
  }
  const liste = listeCikar();
  for (const d of dinleyiciler) d(liste);
}

function yayinlaToplu(): void {
  if (yayinZaman) return;
  yayinZaman = setTimeout(() => {
    yayinZaman = null;
    yayinla();
  }, 400);
}

function izimiGonder(): void {
  if (!kanal || !hazir || !yayinlanan) return;
  kanal.track(yayinlanan).catch(() => {});
}

function kanaliSagla(): void {
  const sb = supabase;
  if (!sb || kanal) return;
  hazir = false;
  const k = sb.channel(LOBI, { config: { presence: { key: anahtar } } });
  kanal = k;
  k.on("presence", { event: "sync" }, yayinlaToplu)
    .on("presence", { event: "join" }, yayinlaToplu)
    .on("presence", { event: "leave" }, yayinlaToplu)
    .subscribe((durum) => {
      if (kanal !== k) return;
      if (durum === "SUBSCRIBED") {
        hazir = true;
        izimiGonder();
        yayinla();
      }
    });
}

function belkiKapat(): void {
  if (sayac > 0 || yayinlanan) return;
  const sb = supabase;
  const k = kanal;
  kanal = null;
  hazir = false;
  if (yayinZaman) {
    clearTimeout(yayinZaman);
    yayinZaman = null;
  }
  if (sb && k) sb.removeChannel(k);
}

export function lobiyiDinle(onListe: (odalar: LobiOdasi[]) => void): () => void {
  if (!supabase) return () => {};
  dinleyiciler.add(onListe);
  sayac += 1;
  kanaliSagla();
  if (hazir) onListe(listeCikar());

  let birakildi = false;
  return () => {
    if (birakildi) return;
    birakildi = true;
    dinleyiciler.delete(onListe);
    sayac = Math.max(0, sayac - 1);
    belkiKapat();
  };
}

export type LobiYayini = {
  guncelle: (oda: Partial<LobiOdasi>) => void;
  kapat: () => void;
};

export function odayiLobideYayinla(ilk: LobiOdasi): LobiYayini {
  if (!supabase) return { guncelle: () => {}, kapat: () => {} };

  yayinlanan = { ...ilk, an: Date.now() };
  kanaliSagla();
  izimiGonder();

  let kapandi = false;
  return {
    guncelle: (yeni) => {
      if (kapandi || !yayinlanan) return;
      yayinlanan = { ...yayinlanan, ...yeni, an: Date.now() };
      izimiGonder();
    },
    kapat: () => {
      if (kapandi) return;
      kapandi = true;
      yayinlanan = null;
      if (kanal && hazir) {
        try {
          kanal.untrack().catch(() => {});
        } catch {
          /* kanal kapanmis olabilir */
        }
      }
      belkiKapat();
    },
  };
}
