import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ANAHTAR = "aron.engellenenler";

type EngelDurumu = {
  liste: string[];
  hazir: boolean;
  yukle: () => Promise<void>;
  degistir: (anahtar: string) => Promise<boolean>;
};

function yaz(liste: string[]): void {
  AsyncStorage.setItem(ANAHTAR, JSON.stringify(liste)).catch(() => {});
}

export const useEngellenenler = create<EngelDurumu>((set, get) => ({
  liste: [],
  hazir: false,
  yukle: async () => {
    let liste: string[] = [];
    try {
      const ham = await AsyncStorage.getItem(ANAHTAR);
      if (ham) {
        const c = JSON.parse(ham) as unknown;
        if (Array.isArray(c)) liste = c.filter((x): x is string => typeof x === "string");
      }
    } catch { /* yoksay */ }
    set({ liste, hazir: true });
  },
  degistir: async (anahtar) => {
    const var_ = get().liste.includes(anahtar);
    const yeni = var_ ? get().liste.filter((x) => x !== anahtar) : [...get().liste, anahtar];
    set({ liste: yeni });
    yaz(yeni);
    return !var_;
  },
}));

export function engelliMi(liste: string[], ...adaylar: (string | null | undefined)[]): boolean {
  return adaylar.some((a) => !!a && liste.includes(a));
}
