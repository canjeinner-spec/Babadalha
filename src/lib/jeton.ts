import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ANAHTAR = "aron.jeton";

export const JETON_DAKIKA = 30;
export const GUNLUK_HEDIYE = 1;
export const PREMIUM_DOLUM = 50;
export const REKLAM_ODULU = 1;

type Kayit = { bakiye: number; sonHediye: string; biten: number };

type JetonDurumu = {
  bakiye: number;
  sonHediye: string;
  biten: number;
  hazir: boolean;
  yukle: () => Promise<void>;
  hediyeAlinabilir: () => boolean;
  hediyeAl: () => Promise<boolean>;
  premiumDolumuAl: () => Promise<number>;
  kazan: (adet: number) => Promise<void>;
  izlemeBaslat: () => Promise<boolean>;
  kalanSaniye: () => number;
};

function bugun(): string {
  return new Date().toISOString().slice(0, 10);
}

async function yaz(k: Kayit): Promise<void> {
  await AsyncStorage.setItem(ANAHTAR, JSON.stringify(k)).catch(() => {});
}

export const useJeton = create<JetonDurumu>((set, get) => ({
  bakiye: 0,
  sonHediye: "",
  biten: 0,
  hazir: false,

  yukle: async () => {
    let k: Kayit = { bakiye: 0, sonHediye: "", biten: 0 };
    try {
      const ham = await AsyncStorage.getItem(ANAHTAR);
      if (ham) {
        const c = JSON.parse(ham) as Partial<Kayit>;
        k = {
          bakiye: typeof c.bakiye === "number" ? c.bakiye : 0,
          sonHediye: typeof c.sonHediye === "string" ? c.sonHediye : "",
          biten: typeof c.biten === "number" ? c.biten : 0,
        };
      }
    } catch { return set({ hazir: true }); }
    set({ ...k, hazir: true });
  },

  hediyeAlinabilir: () => get().sonHediye !== bugun(),

  hediyeAl: async () => {
    if (!get().hediyeAlinabilir()) return false;
    const k: Kayit = { bakiye: get().bakiye + GUNLUK_HEDIYE, sonHediye: bugun(), biten: get().biten };
    set(k);
    await yaz(k);
    return true;
  },

  premiumDolumuAl: async () => {
    const eksik = Math.max(0, PREMIUM_DOLUM - get().bakiye);
    if (!eksik) return 0;
    const k: Kayit = { bakiye: PREMIUM_DOLUM, sonHediye: get().sonHediye, biten: get().biten };
    set(k);
    await yaz(k);
    return eksik;
  },

  kazan: async (adet) => {
    if (adet <= 0) return;
    const k: Kayit = { bakiye: get().bakiye + adet, sonHediye: get().sonHediye, biten: get().biten };
    set(k);
    await yaz(k);
  },

  izlemeBaslat: async () => {
    if (get().kalanSaniye() > 0) return true;
    if (get().bakiye < 1) return false;
    const k: Kayit = {
      bakiye: get().bakiye - 1,
      sonHediye: get().sonHediye,
      biten: Date.now() + JETON_DAKIKA * 60 * 1000,
    };
    set(k);
    await yaz(k);
    return true;
  },

  kalanSaniye: () => Math.max(0, Math.round((get().biten - Date.now()) / 1000)),
}));

export function jetonSaati(bakiye: number): number {
  return Math.round((bakiye * JETON_DAKIKA) / 6) / 10;
}
