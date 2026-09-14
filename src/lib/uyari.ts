import { create } from "zustand";

export type UyariCesidi = "hata" | "basari" | "bilgi";

type UyariDurumu = {
  metin: string;
  cesit: UyariCesidi;
  sira: number;
  goster: (metin: string, cesit: UyariCesidi) => void;
  kapat: () => void;
};

export const useUyari = create<UyariDurumu>((set, get) => ({
  metin: "",
  cesit: "bilgi",
  sira: 0,
  goster: (metin, cesit) => set({ metin, cesit, sira: get().sira + 1 }),
  kapat: () => set({ metin: "" }),
}));

export function uyar(metin: string, cesit: UyariCesidi = "bilgi"): void {
  if (!metin) return;
  useUyari.getState().goster(metin, cesit);
}

export function hataUyar(metin: string): void {
  uyar(metin, "hata");
}

export function basariUyar(metin: string): void {
  uyar(metin, "basari");
}
