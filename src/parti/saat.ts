export type SaatOrnegi = { gidisDonus: number; sapma: number };

export const ORNEK_SAYISI = 7;
export const ORNEK_ARASI = 140;
export const GIDIS_DONUS_TAVANI = 2000;
export const ESLEME_ARALIGI = 60000;
export const ISTEK_OMRU = 5000;

export function sapmaHesapla(t0: number, tUzak: number, t3: number): SaatOrnegi {
  const gidisDonus = Math.max(0, t3 - t0);
  return { gidisDonus, sapma: tUzak - t0 - gidisDonus / 2 };
}

export function sapmaSec(ornekler: SaatOrnegi[]): number | null {
  const gecerli = ornekler.filter((o) => o.gidisDonus <= GIDIS_DONUS_TAVANI);
  if (!gecerli.length) return null;
  const hizli = [...gecerli]
    .sort((a, b) => a.gidisDonus - b.gidisDonus)
    .slice(0, Math.max(1, Math.ceil(gecerli.length / 2)))
    .map((o) => o.sapma)
    .sort((a, b) => a - b);
  const orta = Math.floor(hizli.length / 2);
  return hizli.length % 2 ? hizli[orta] : (hizli[orta - 1] + hizli[orta]) / 2;
}

type Kurulum = {
  yollaIstek: (t0: number) => void;
  onDegisim?: (sapma: number, ornekSayisi: number) => void;
  simdi?: () => number;
};

export type SaatEsleyici = {
  basla: () => void;
  yanit: (t0: number, tUzak: number) => void;
  sapma: () => number;
  hazir: () => boolean;
  durdur: () => void;
};

export function saatEsleyiciAc({ yollaIstek, onDegisim, simdi = Date.now }: Kurulum): SaatEsleyici {
  let ornekler: SaatOrnegi[] = [];
  let bekleyen = new Map<number, number>();
  let secili = 0;
  let hazirMi = false;
  let kapandi = false;
  let turZaman: ReturnType<typeof setTimeout> | null = null;
  let dongu: ReturnType<typeof setInterval> | null = null;

  const turuBitir = () => {
    if (turZaman) {
      clearTimeout(turZaman);
      turZaman = null;
    }
  };

  const basla = () => {
    if (kapandi) return;
    turuBitir();
    ornekler = [];
    bekleyen = new Map();
    let kalan = ORNEK_SAYISI;
    const at = () => {
      if (kapandi || kalan <= 0) {
        turZaman = null;
        return;
      }
      kalan -= 1;
      const t0 = simdi();
      bekleyen.set(t0, t0);
      yollaIstek(t0);
      turZaman = setTimeout(at, ORNEK_ARASI);
    };
    at();
    if (!dongu) dongu = setInterval(basla, ESLEME_ARALIGI);
  };

  const yanit = (t0: number, tUzak: number) => {
    if (kapandi || !bekleyen.has(t0)) return;
    bekleyen.delete(t0);
    const t3 = simdi();
    if (t3 - t0 > ISTEK_OMRU) return;
    ornekler.push(sapmaHesapla(t0, tUzak, t3));
    const yeni = sapmaSec(ornekler);
    if (yeni === null) return;
    secili = yeni;
    hazirMi = true;
    onDegisim?.(secili, ornekler.length);
  };

  return {
    basla,
    yanit,
    sapma: () => (hazirMi ? secili : 0),
    hazir: () => hazirMi,
    durdur: () => {
      kapandi = true;
      turuBitir();
      if (dongu) {
        clearInterval(dongu);
        dongu = null;
      }
    },
  };
}
