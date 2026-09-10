import { create } from "zustand";

import { type PlatformKodu } from "@/oda/platform";

export type PartiSecim = {
  anahtar: string;
  platform: PlatformKodu;
  adres: string;
  baslik: string | null;
  secen: string;
  secenFoto?: string;
};

type Durum = {
  bekleyen: PartiSecim | null;
  sec: (s: PartiSecim) => void;
  tuket: () => void;
  gezinenVar: boolean;
  gezinenAyarla: (v: boolean) => void;
};

export const usePartiKuyruk = create<Durum>((set) => ({
  bekleyen: null,
  sec: (s) => set({ bekleyen: s }),
  tuket: () => set({ bekleyen: null }),
  gezinenVar: false,
  gezinenAyarla: (v) => set({ gezinenVar: v }),
}));
