import { useSyncExternalStore } from "react";
import { AppState } from "react-native";

const SONDA_ARALIK_MS = 4000;
const SONDA_ZAMAN_ASIMI_MS = 6000;

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const dinleyiciler = new Set<() => void>();

let kopuk = false;
let sondaCalisiyor = false;
let zamanlayici: ReturnType<typeof setTimeout> | null = null;

function yayinla() {
  for (const d of dinleyiciler) d();
}

function ayarla(yeni: boolean) {
  if (kopuk === yeni) return;
  kopuk = yeni;
  yayinla();
}

async function sondala(): Promise<boolean> {
  if (!url || !anonKey) return true;
  const iptal = new AbortController();
  const sayac = setTimeout(() => iptal.abort(), SONDA_ZAMAN_ASIMI_MS);
  try {
    const cevap = await fetch(`${url}/auth/v1/health`, {
      method: "GET",
      headers: { apikey: anonKey },
      signal: iptal.signal,
    });
    return cevap.ok || cevap.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(sayac);
  }
}

function onPlanda(): boolean {
  return AppState.currentState === "active";
}

async function dongu() {
  if (!onPlanda()) {
    sondaCalisiyor = false;
    zamanlayici = null;
    return;
  }
  const iyi = await sondala();
  ayarla(!iyi);
  if (iyi) {
    sondaCalisiyor = false;
    zamanlayici = null;
    return;
  }
  zamanlayici = setTimeout(() => { void dongu(); }, SONDA_ARALIK_MS);
}

export function baglantiSuphesi() {
  if (!onPlanda()) return;
  if (sondaCalisiyor) return;
  sondaCalisiyor = true;
  void dongu();
}

export function baglantiyiHemenDene() {
  if (zamanlayici) {
    clearTimeout(zamanlayici);
    zamanlayici = null;
  }
  sondaCalisiyor = true;
  void dongu();
}

AppState.addEventListener("change", (durum) => {
  if (durum === "active") {
    ayarla(false);
    baglantiyiHemenDene();
    return;
  }
  if (zamanlayici) { clearTimeout(zamanlayici); zamanlayici = null; }
  sondaCalisiyor = false;
});

function abone(d: () => void) {
  dinleyiciler.add(d);
  return () => { dinleyiciler.delete(d); };
}

function oku() {
  return kopuk;
}

export function useAgKopuk(): boolean {
  return useSyncExternalStore(abone, oku, oku);
}
