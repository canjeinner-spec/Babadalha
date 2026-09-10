import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

import { type PlatformKodu } from "@/oda/platform";

const ANAHTAR = "partiGirisler";

type Durum = {
  hazir: boolean;
  girilenler: PlatformKodu[];
  yukle: () => Promise<void>;
  isaretle: (p: PlatformKodu) => void;
  girilmisMi: (p: PlatformKodu) => boolean;
};

export const usePartiGiris = create<Durum>((set, get) => ({
  hazir: false,
  girilenler: [],
  yukle: async () => {
    if (get().hazir) return;
    try {
      const ham = await AsyncStorage.getItem(ANAHTAR);
      const liste = ham ? (JSON.parse(ham) as PlatformKodu[]) : [];
      set({ hazir: true, girilenler: Array.isArray(liste) ? liste : [] });
    } catch {
      set({ hazir: true });
    }
  },
  isaretle: (p) => {
    if (get().girilenler.includes(p)) return;
    const girilenler = [...get().girilenler, p];
    set({ girilenler });
    AsyncStorage.setItem(ANAHTAR, JSON.stringify(girilenler)).catch(() => {});
  },
  girilmisMi: (p) => get().girilenler.includes(p),
}));
