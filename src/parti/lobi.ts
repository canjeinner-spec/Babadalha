import { type RealtimeChannel } from "@supabase/supabase-js";
import { AppState } from "react-native";

import { supabase } from "@/lib/supabase";
import { platformDesteklenmiyor, type PlatformKodu } from "@/oda/platform";

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

function gunluk(olay: string, ayrinti?: Record<string, unknown>): void {
  if (!__DEV__) return;
  const ek = ayrinti ? " " + Object.entries(ayrinti).map(([k, v]) => `${k}=${v}`).join(" ") : "";
  console.log(`[lobi] ${olay}${ek}`);
}

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
      if (!o || platformDesteklenmiyor(o.platform)) continue;
      if (!cikti.some((x) => x.odaId === o.odaId)) cikti.push(o);
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
  gunluk("liste", { oda: liste.length, kimlikler: liste.map((o) => o.odaId.slice(-6)).join(",") || "-" });
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
  if (!kanal || !hazir || !yayinlanan) {
    gunluk("iz-gonderilmedi", { kanal: !!kanal, hazir, yayin: !!yayinlanan });
    return;
  }
  gunluk("iz-gonderildi", { oda: yayinlanan.odaId.slice(-6), platform: yayinlanan.platform, kisi: yayinlanan.kisi });
  kanal.track(yayinlanan).catch((e) => gunluk("iz-hata", { mesaj: (e as Error)?.message ?? String(e) }));
}

function kanaliSagla(): void {
  const sb = supabase;
  if (!sb || kanal) return;
  hazir = false;
  const k = sb.channel(LOBI, { config: { presence: { key: anahtar } } });
  kanal = k;
  oneDonusuIzle();
  k.on("presence", { event: "sync" }, yayinlaToplu)
    .on("presence", { event: "join" }, yayinlaToplu)
    .on("presence", { event: "leave" }, yayinlaToplu)
    .subscribe((durum) => {
      if (kanal !== k) return;
      gunluk("kanal", { durum });
      if (durum === "SUBSCRIBED") {
        hazir = true;
        izimiGonder();
        yayinla();
      }
    });
}

let oneDonusAbonesi: { remove: () => void } | null = null;

function oneDonusuIzle(): void {
  if (oneDonusAbonesi) return;
  oneDonusAbonesi = AppState.addEventListener("change", (durum) => {
    if (durum !== "active") return;
    if (!kanal) return;
    if (yayinlanan) {
      yayinlanan = { ...yayinlanan, an: Date.now() };
      izimiGonder();
    }
    yayinla();
  });
}

function oneDonusuBirak(): void {
  oneDonusAbonesi?.remove();
  oneDonusAbonesi = null;
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
  oneDonusuBirak();
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
  gunluk("yayin-basladi", { oda: ilk.odaId.slice(-6), platform: ilk.platform });
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
      gunluk("yayin-bitti", { oda: ilk.odaId.slice(-6) });
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
