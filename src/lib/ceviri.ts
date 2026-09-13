import { useCallback } from "react";

import { metinCevir } from "@/data/metinler";
import { useDil } from "@/lib/dil";

export function cevir(anahtar: string, ...degerler: (string | number)[]): string {
  return metinCevir(anahtar, useDil.getState().dil.kod, degerler);
}

export function dilKodu(): string {
  return useDil.getState().dil.kod;
}

export function turkceMi(): boolean {
  return dilKodu().split("-")[0] === "tr";
}

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
