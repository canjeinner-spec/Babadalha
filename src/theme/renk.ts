const DIP: [number, number, number] = [8, 8, 12];

function coz(hex: string): [number, number, number] | null {
  const h = hex.trim().replace("#", "");
  const t = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  if (!/^[0-9a-fA-F]{6}$/.test(t)) return null;
  return [parseInt(t.slice(0, 2), 16), parseInt(t.slice(2, 4), 16), parseInt(t.slice(4, 6), 16)];
}

function yaz(r: number, g: number, b: number): string {
  const p = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${p(r)}${p(g)}${p(b)}`;
}

export function karart(hex: string, oran: number): string {
  const c = coz(hex);
  if (!c) return hex;
  const k = Math.max(0, Math.min(1, oran));
  return yaz(
    c[0] + (DIP[0] - c[0]) * k,
    c[1] + (DIP[1] - c[1]) * k,
    c[2] + (DIP[2] - c[2]) * k,
  );
}

export function saydam(hex: string, alfa: number): string {
  const c = coz(hex);
  if (!c) return hex;
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${Math.max(0, Math.min(1, alfa))})`;
}
