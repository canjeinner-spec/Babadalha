let aktif: Record<string, number> = {};

export function renderSay(ad: string): void {
  if (!__DEV__) return;
  aktif[ad] = (aktif[ad] ?? 0) + 1;
}

export function sayaclariAlVeSifirla(): Record<string, number> {
  const o = aktif;
  aktif = {};
  return o;
}

const onceki = new Map<string, Record<string, unknown>>();

export function degisimSay(ad: string, simdiki: Record<string, unknown>): void {
  if (!__DEV__) return;
  const o = onceki.get(ad);
  if (o) {
    const degisen = Object.keys(simdiki).filter((k) => o[k] !== simdiki[k]);
    renderSay(`${ad}:${degisen.length ? degisen.join("+") : "aynı"}`);
  }
  onceki.set(ad, simdiki);
}
