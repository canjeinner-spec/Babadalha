export type PartiRol = "sahip" | "yardimci" | "uye";

export type PartiEylem =
  | "oynatimKontrol"
  | "icerikSec"
  | "sohbetKilit"
  | "mikrofonAyar"
  | "odadanAt"
  | "yardimciAta";

const YETKILER: Record<PartiRol, Set<PartiEylem>> = {
  sahip: new Set<PartiEylem>([
    "oynatimKontrol",
    "icerikSec",
    "sohbetKilit",
    "mikrofonAyar",
    "odadanAt",
    "yardimciAta",
  ]),
  yardimci: new Set<PartiEylem>([
    "oynatimKontrol",
    "icerikSec",
    "sohbetKilit",
    "mikrofonAyar",
    "odadanAt",
  ]),
  uye: new Set<PartiEylem>(),
};

export function yetkiVar(rol: PartiRol | null | undefined, eylem: PartiEylem): boolean {
  if (!rol) return false;
  return YETKILER[rol].has(eylem);
}

export function rolAdi(rol: PartiRol): string {
  if (rol === "sahip") return "Parti Sahibi";
  if (rol === "yardimci") return "Parti Yardımcısı";
  return "İzleyici";
}

export function atabilirMi(benimRol: PartiRol | null | undefined, hedefRol: PartiRol): boolean {
  if (!yetkiVar(benimRol, "odadanAt")) return false;
  if (hedefRol === "sahip") return false;
  if (benimRol === "yardimci" && hedefRol === "yardimci") return false;
  return true;
}

export function rolVerebilirMi(benimRol: PartiRol | null | undefined, hedefRol: PartiRol): boolean {
  if (!yetkiVar(benimRol, "yardimciAta")) return false;
  return hedefRol !== "sahip";
}

export type MikrofonKipi = "herkes" | "izinli" | "kapali";

export type OdaAyari = {
  sohbetKilit: boolean;
  mikrofonKipi: MikrofonKipi;
};

export const VARSAYILAN_ODA_AYARI: OdaAyari = {
  sohbetKilit: false,
  mikrofonKipi: "herkes",
};

export function sohbetYazabilirMi(rol: PartiRol | null | undefined, ayar: OdaAyari): boolean {
  if (!ayar.sohbetKilit) return true;
  return yetkiVar(rol, "sohbetKilit");
}

export function mikrofonAcabilirMi(
  rol: PartiRol | null | undefined,
  ayar: OdaAyari,
  bireyselIzin: boolean,
): boolean {
  if (yetkiVar(rol, "mikrofonAyar")) return true;
  if (ayar.mikrofonKipi === "herkes") return true;
  if (ayar.mikrofonKipi === "izinli") return bireyselIzin;
  return false;
}
