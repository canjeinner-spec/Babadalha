import { useCallback } from "react";

import { metinCevir } from "@/data/metinler";
import { useDil } from "@/lib/dil";

export function useCeviri() {
  const kod = useDil((s) => s.dil.kod);
  return useCallback(
    (anahtar: string, ...degerler: (string | number)[]) => metinCevir(anahtar, kod, degerler),
    [kod],
  );
}

export function useSagdanSola(): boolean {
  return useDil((s) => s.dil.sag === true);
}
