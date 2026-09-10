import { type Room } from "@/data/seed";

export type UygulamaModu = "sesli" | "parti";

export const MODLAR: { kod: UygulamaModu; ad: string; ikon: "mic" | "evParty" }[] = [
  { kod: "sesli", ad: "Sesli Sohbet", ikon: "mic" },
  { kod: "parti", ad: "Parti", ikon: "evParty" },
];

export const VARSAYILAN_MOD: UygulamaModu = "sesli";

export function modGecerli(v: unknown): v is UygulamaModu {
  return v === "sesli" || v === "parti";
}

export function odaModu(oda: Room): UygulamaModu {
  return oda.mod === "parti" ? "parti" : "sesli";
}

export function modaGore(odalar: Room[], mod: UygulamaModu): Room[] {
  return odalar.filter((r) => odaModu(r) === mod);
}

export function modAdi(mod: UygulamaModu): string {
  return MODLAR.find((m) => m.kod === mod)?.ad ?? mod;
}
