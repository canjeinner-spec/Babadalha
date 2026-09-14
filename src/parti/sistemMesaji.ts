import { cevir } from "@/lib/ceviri";
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
  | { cesit: "atildi"; atan?: SistemKisi; atanRol: PartiRol }
  | { cesit: "mikrofon"; veren?: SistemKisi; acik: boolean }
  | { cesit: "sohbet"; veren?: SistemKisi; acik: boolean };

export type SistemParcasi =
  | { tur: "etiket"; kisi: SistemKisi }
  | { tur: "metin"; metin: string };

export function etiketAdi(kisi: SistemKisi): string {
  const k = (kisi.kullaniciAdi ?? "").trim();
  return `@${k || kisi.ad}`;
}

function kur(anahtar: string, degerler: (SistemKisi | string)[]): SistemParcasi[] {
  const kalip = cevir(anahtar);
  const cikti: SistemParcasi[] = [];
  for (const parca of kalip.split(/(\{\d\})/)) {
    const eslesme = /^\{(\d)\}$/.exec(parca);
    if (eslesme) {
      const deger = degerler[Number(eslesme[1])];
      if (typeof deger === "string") cikti.push({ tur: "metin", metin: deger });
      else if (deger) cikti.push({ tur: "etiket", kisi: deger });
    } else if (parca !== "") {
      cikti.push({ tur: "metin", metin: parca });
    }
  }
  return cikti;
}

export function sistemParcalari(
  kisi: SistemKisi,
  olay: SistemOlayi,
  benim: boolean,
): SistemParcasi[] {
  if (olay.cesit === "katildi") {
    return benim ? kur("sistem.katildinBen", []) : kur("sistem.katildi", [kisi]);
  }

  if (olay.cesit === "ayrildi") {
    return kur("sistem.ayrildi", [kisi]);
  }

  if (olay.cesit === "rol") {
    if (olay.rol === "uye") {
      return benim
        ? kur("sistem.yardimciAlindiBen", [olay.veren])
        : kur("sistem.yardimciAlindi", [kisi, olay.veren]);
    }
    return benim
      ? kur("sistem.rolVerildiBen", [olay.veren, rolAdi(olay.rol)])
      : kur("sistem.rolVerildi", [kisi, olay.veren, rolAdi(olay.rol)]);
  }

  if (olay.cesit === "mikrofon" || olay.cesit === "sohbet") {
    const durum = olay.acik ? "Acildi" : "Kapandi";
    const veren = olay.veren;
    if (benim) {
      return veren
        ? kur(`sistem.${olay.cesit}${durum}Ben`, [veren])
        : kur(`sistem.${olay.cesit}${durum}BenAdsiz`, []);
    }
    return veren
      ? kur(`sistem.${olay.cesit}${durum}`, [kisi, veren])
      : kur(`sistem.${olay.cesit}${durum}Adsiz`, [kisi]);
  }

  const eden: SistemKisi | string = olay.atan ?? rolAdi(olay.atanRol);
  return benim ? kur("sistem.atildinBen", [eden]) : kur("sistem.atildi", [kisi, eden]);
}
