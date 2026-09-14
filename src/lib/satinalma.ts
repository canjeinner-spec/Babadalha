export type PaketKodu = "aylik" | "yillik";

export type SatinAlmaSonucu = "alindi" | "iptal" | "hazirDegil" | "hata";

export const URUN_KIMLIKLERI: Record<PaketKodu, string> = {
  aylik: "aron_premium_aylik",
  yillik: "aron_premium_yillik",
};

type Kopru = {
  hazirla: () => Promise<void>;
  satinAl: (urun: string) => Promise<SatinAlmaSonucu>;
  geriYukle: () => Promise<boolean>;
};

let kopru: Kopru | null = null;

export function kopruyuBagla(k: Kopru): void {
  kopru = k;
}

export function satinAlmaHazirMi(): boolean {
  return kopru != null;
}

export async function premiumSatinAl(paket: PaketKodu): Promise<SatinAlmaSonucu> {
  if (!kopru) return "hazirDegil";
  try {
    await kopru.hazirla();
    return await kopru.satinAl(URUN_KIMLIKLERI[paket]);
  } catch {
    return "hata";
  }
}

export async function satinAlmalariGeriYukle(): Promise<boolean> {
  if (!kopru) return false;
  try {
    await kopru.hazirla();
    return await kopru.geriYukle();
  } catch {
    return false;
  }
}
