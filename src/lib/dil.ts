import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Yerel from "expo-localization";
import { create } from "zustand";

import { dilBul, VARSAYILAN_DIL, type Dil } from "@/data/diller";

const ANAHTAR = "aron.dil";

type DilDurumu = {
  dil: Dil;
  hazir: boolean;
  yukle: () => Promise<void>;
  sec: (kod: string) => Promise<void>;
};

export const useDil = create<DilDurumu>((set) => ({
  dil: VARSAYILAN_DIL,
  hazir: false,
  yukle: async () => {
    let kod: string | null = null;
    try { kod = await AsyncStorage.getItem(ANAHTAR); } catch { /* yoksay */ }
    if (!kod) {
      try { kod = Yerel.getLocales()[0]?.languageTag ?? null; } catch { /* yoksay */ }
    }
    set({ dil: dilBul(kod), hazir: true });
  },
  sec: async (kod) => {
    set({ dil: dilBul(kod) });
    try { await AsyncStorage.setItem(ANAHTAR, kod); } catch { /* yoksay */ }
  },
}));
