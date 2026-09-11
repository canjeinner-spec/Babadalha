type Dinleyici = (satirlar: string[]) => void;

const SINIR = 40;
let satirlar: string[] = [];
const dinleyiciler = new Set<Dinleyici>();

export function ayiklamaYaz(metin: string): void {
  const zaman = new Date().toLocaleTimeString("tr-TR", { hour12: false });
  if (__DEV__) console.log(`[AYIKLA] ${metin}`);
  satirlar = [...satirlar, `${zaman} ${metin}`].slice(-SINIR);
  for (const d of dinleyiciler) d(satirlar);
}

export function ayiklamaAbone(d: Dinleyici): () => void {
  dinleyiciler.add(d);
  d(satirlar);
  return () => {
    dinleyiciler.delete(d);
  };
}

export function ayiklamaTemizle(): void {
  satirlar = [];
  for (const d of dinleyiciler) d(satirlar);
}
