import { rolAdi, type PartiRol } from "@/parti/yetki";

export type SistemKisi = {
  anahtar: string;
  ad: string;
  kullaniciAdi?: string | null;
  foto?: string;
  ozelIdTip?: "premium" | "kapsul" | null;
  ozelIdTema?: string | null;
};

export type SistemOlayi =
  | { cesit: "katildi" }
  | { cesit: "ayrildi" }
  | { cesit: "rol"; veren: SistemKisi; rol: PartiRol }
  | { cesit: "atildi"; atanRol: PartiRol };

export type SistemParcasi =
  | { tur: "etiket"; kisi: SistemKisi }
  | { tur: "metin"; metin: string };

export function etiketAdi(kisi: SistemKisi): string {
  const k = (kisi.kullaniciAdi ?? "").trim();
  return `@${k || kisi.ad}`;
}

export function sistemParcalari(
  kisi: SistemKisi,
  olay: SistemOlayi,
  benim: boolean,
): SistemParcasi[] {
  const e = (k: SistemKisi): SistemParcasi => ({ tur: "etiket", kisi: k });
  const m = (metin: string): SistemParcasi => ({ tur: "metin", metin });

  if (olay.cesit === "katildi") {
    return benim ? [m("Partiye katıldın")] : [e(kisi), m(" partiye katıldı")];
  }

  if (olay.cesit === "ayrildi") {
    return benim ? [m("Partiden ayrıldın")] : [e(kisi), m(" partiden ayrıldı")];
  }

  if (olay.cesit === "rol") {
    if (olay.rol === "uye") {
      return benim
        ? [e(olay.veren), m(" yardımcılığını aldı")]
        : [e(olay.veren), m(", "), e(kisi), m(" kullanıcısının yardımcılığını aldı")];
    }
    return benim
      ? [e(olay.veren), m(` seni ${rolAdi(olay.rol)} yaptı`)]
      : [e(olay.veren), m(", "), e(kisi), m(` kullanıcısını ${rolAdi(olay.rol)} yaptı`)];
  }

  const kimden = `${rolAdi(olay.atanRol)} tarafından partiden`;
  return benim ? [m(`${kimden} atıldın`)] : [e(kisi), m(`, ${kimden} atıldı`)];
}
