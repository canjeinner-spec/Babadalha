import { OZEL_ID_TEMA_RENK, type OzelIdKart } from "@/data/specialId";

export type BaloncukRengi = { arka: string; kenar: string };

const PREMIUM: BaloncukRengi = { arka: "rgba(232,179,65,.14)", kenar: "rgba(232,179,65,.3)" };

function saydamla(hex: string, oran: number): string {
  const t = hex.replace("#", "");
  const r = parseInt(t.slice(0, 2), 16);
  const g = parseInt(t.slice(2, 4), 16);
  const b = parseInt(t.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${oran})`;
}

export function baloncukRengi(
  tip?: string | null,
  tema?: string | null,
): BaloncukRengi | null {
  if (tip === "premium") return PREMIUM;
  if (tip === "kapsul" && tema) {
    const t = OZEL_ID_TEMA_RENK[tema as OzelIdKart];
    if (t) return { arka: saydamla(t.accent, 0.13), kenar: saydamla(t.accent, 0.28) };
  }
  return null;
}
