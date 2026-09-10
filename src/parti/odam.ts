import { create } from "zustand";

import { type PartiOda } from "@/data/partiMock";

export const ODAM_ID = "odam";

export function kendiOdaKimligi(dbId: number | null | undefined): string {
  return dbId != null ? `${ODAM_ID}-${dbId}` : ODAM_ID;
}

type Durum = {
  odam: PartiOda | null;
  ac: (o: PartiOda) => void;
  kapat: () => void;
};

export const usePartiOdam = create<Durum>((set) => ({
  odam: null,
  ac: (o) => set({ odam: o }),
  kapat: () => set({ odam: null }),
}));
