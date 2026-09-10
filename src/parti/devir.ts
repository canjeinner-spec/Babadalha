import { type PartiRol } from "@/parti/yetki";

export const DEVIR_GECIKMESI = 8000;

export type DevirAdayi = {
  anahtar: string;
  rol: PartiRol;
};

export type DevirKarari =
  | { tur: "devret"; anahtar: string }
  | { tur: "atla"; sebep: "otomatikKapali" | "adayYok" };

const ONCELIK: Record<PartiRol, number> = { sahip: 0, yardimci: 1, uye: 2 };

const SAYI_ONEKI = /^([A-Za-z-]*)(\d+)$/;

export function anahtarKarsilastir(a: string, b: string): number {
  const pa = SAYI_ONEKI.exec(a);
  const pb = SAYI_ONEKI.exec(b);
  if (pa && pb && pa[1] === pb[1]) {
    const fark = Number(pa[2]) - Number(pb[2]);
    if (fark !== 0) return fark;
  }
  return a < b ? -1 : a > b ? 1 : 0;
}

export function devirKarari(
  adaylar: DevirAdayi[],
  ayrilanAnahtar: string,
  otomatik: boolean,
): DevirKarari {
  if (!otomatik) return { tur: "atla", sebep: "otomatikKapali" };
  const uygun = adaylar.filter((a) => a.anahtar !== ayrilanAnahtar);
  if (!uygun.length) return { tur: "atla", sebep: "adayYok" };
  const sirali = [...uygun].sort(
    (a, b) => ONCELIK[a.rol] - ONCELIK[b.rol] || anahtarKarsilastir(a.anahtar, b.anahtar),
  );
  return { tur: "devret", anahtar: sirali[0].anahtar };
}

export function devralanBenMiyim(karar: DevirKarari, benimAnahtar: string): boolean {
  return karar.tur === "devret" && karar.anahtar === benimAnahtar;
}

export type DevirZamanlayici = {
  basla: (calistir: () => void) => void;
  iptal: () => boolean;
  bekliyorMu: () => boolean;
  durdur: () => void;
};

export function devirZamanlayiciAc(
  gecikme = DEVIR_GECIKMESI,
  kur: (f: () => void, ms: number) => ReturnType<typeof setTimeout> = setTimeout,
  boz: (t: ReturnType<typeof setTimeout>) => void = clearTimeout,
): DevirZamanlayici {
  let bekleyen: ReturnType<typeof setTimeout> | null = null;
  let kapandi = false;
  return {
    basla: (calistir) => {
      if (kapandi || bekleyen) return;
      bekleyen = kur(() => {
        bekleyen = null;
        calistir();
      }, gecikme);
    },
    iptal: () => {
      if (!bekleyen) return false;
      boz(bekleyen);
      bekleyen = null;
      return true;
    },
    bekliyorMu: () => bekleyen !== null,
    durdur: () => {
      kapandi = true;
      if (bekleyen) {
        boz(bekleyen);
        bekleyen = null;
      }
    },
  };
}
