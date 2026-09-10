export const ODA_ID_BULUNAMADI = "BULUNAMADI";

export function odaKimligiSifirlandiMi(publicId: string | null | undefined): boolean {
  const s = (publicId ?? "").trim();
  return s.length === 0 || s.startsWith("0");
}

export function sifirlanmisOdaId(odaDbId: number): string {
  return `0${String(odaDbId).padStart(7, "0")}`;
}

export function odaIdMetni(publicId: string | null | undefined): string {
  return odaKimligiSifirlandiMi(publicId) ? ODA_ID_BULUNAMADI : String(publicId).trim();
}
