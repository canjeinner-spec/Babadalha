import { create } from "zustand";

import { type PlatformKodu } from "@/oda/platform";

export type IzlemeDurumu = {
  baslik: string | null;
  kapak: string | null;
  platform: PlatformKodu;
  an: number;
};

type Durum = {
  odalar: Record<string, IzlemeDurumu>;
  bildir: (odaId: string, d: Omit<IzlemeDurumu, "an">) => void;
};

export const usePartiIzleme = create<Durum>((set, get) => ({
  odalar: {},
  bildir: (odaId, d) => {
    const eski = get().odalar[odaId];
    if (eski && eski.baslik === d.baslik && eski.kapak === d.kapak && eski.platform === d.platform) return;
    set({ odalar: { ...get().odalar, [odaId]: { ...d, an: Date.now() } } });
  },
}));
