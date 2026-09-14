type Cevirici = (anahtar: string, ...degerler: (string | number)[]) => string;

const DAKIKA = 60 * 1000;
const SAAT = 60 * DAKIKA;
const GUN = 24 * SAAT;

export function kalanSureYaz(kalan: number, t: Cevirici): string {
  if (kalan <= 0) return "";
  if (kalan >= GUN) {
    const gun = Math.floor(kalan / GUN);
    const saat = Math.floor((kalan % GUN) / SAAT);
    return t("duzenle.adKilitGunSaat", gun, saat);
  }
  if (kalan >= SAAT) {
    const saat = Math.floor(kalan / SAAT);
    const dakika = Math.floor((kalan % SAAT) / DAKIKA);
    return t("duzenle.adKilitSaatDakika", saat, dakika);
  }
  return t("duzenle.adKilitDakika", Math.max(1, Math.ceil(kalan / DAKIKA)));
}
