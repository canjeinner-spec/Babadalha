import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const ANAHTAR = "aron.gorunenAd";

type GorunenAdDurumu = {
  ad: string;
  hazir: boolean;
  yukle: () => Promise<void>;
  yaz: (deger: string) => Promise<void>;
};

export const useGorunenAd = create<GorunenAdDurumu>((set) => ({
  ad: "",
  hazir: false,
  yukle: async () => {
    let deger = "";
    try { deger = (await AsyncStorage.getItem(ANAHTAR)) ?? ""; } catch { /* yoksay */ }
    set({ ad: deger, hazir: true });
  },
  yaz: async (deger) => {
    const temiz = deger.trim();
    set({ ad: temiz });
    try {
      if (temiz) await AsyncStorage.setItem(ANAHTAR, temiz);
      else await AsyncStorage.removeItem(ANAHTAR);
    } catch { /* yoksay */ }
  },
}));
