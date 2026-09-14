export type ReklamSonucu = "odul" | "yarim" | "yok";

export const REKLAM_SAGLAYICI_BAGLI = false;

const SAHTE_SURE = 1200;

export async function odulluReklamGoster(): Promise<ReklamSonucu> {
  if (!REKLAM_SAGLAYICI_BAGLI) {
    await new Promise((c) => setTimeout(c, SAHTE_SURE));
    return "odul";
  }
  return "yok";
}
