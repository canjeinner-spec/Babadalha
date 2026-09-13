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
  | { cesit: "atildi"; atanRol: PartiRol };

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
    return benim ? kur("sistem.ayrildinBen", []) : kur("sistem.ayrildi", [kisi]);
  }

  if (olay.cesit === "rol") {
    if (olay.rol === "uye") {
      return benim
        ? kur("sistem.yardimciAlindiBen", [olay.veren])
        : kur("sistem.yardimciAlindi", [olay.veren, kisi]);
    }
    return benim
      ? kur("sistem.rolVerildiBen", [olay.veren, rolAdi(olay.rol)])
      : kur("sistem.rolVerildi", [olay.veren, kisi, rolAdi(olay.rol)]);
  }

  return benim
    ? kur("sistem.atildinBen", [rolAdi(olay.atanRol)])
    : kur("sistem.atildi", [kisi, rolAdi(olay.atanRol)]);
}
