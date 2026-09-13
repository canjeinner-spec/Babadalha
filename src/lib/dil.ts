import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Yerel from "expo-localization";
import * as Guncelleme from "expo-updates";
import { I18nManager } from "react-native";
import { create } from "zustand";

import { dilBul, VARSAYILAN_DIL, type Dil } from "@/data/diller";

const ANAHTAR = "aron.dil";

function yonUygula(dil: Dil): boolean {
  const istenen = dil.sag === true;
  try {
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL === istenen) return false;
    I18nManager.forceRTL(istenen);
    return true;
  } catch {
    return false;
  }
}

async function yenidenBaslat(): Promise<void> {
  if (__DEV__) return;
  try {
    await Guncelleme.reloadAsync();
  } catch {
    /* yoksay */
  }
}

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
    const secilen = dilBul(kod);
    yonUygula(secilen);
    set({ dil: secilen, hazir: true });
  },
  sec: async (kod) => {
    const secilen = dilBul(kod);
    const yonDegisti = yonUygula(secilen);
    set({ dil: secilen });
    try { await AsyncStorage.setItem(ANAHTAR, kod); } catch { /* yoksay */ }
    if (yonDegisti) await yenidenBaslat();
  },
}));
