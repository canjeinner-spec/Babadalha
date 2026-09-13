import { type PlatformKodu } from "@/oda/platform";

export function icerikAnahtari(platform: PlatformKodu, adres: string | null | undefined): string {
  const ham = (adres ?? "").trim();
  if (!ham) return `${platform}:`;
  let u: URL;
  try {
    u = new URL(ham);
  } catch {
    return `${platform}:${ham.toLowerCase()}`;
  }
  if (platform === "youtube" || platform === "youtube_live") {
    const v = u.searchParams.get("v");
    if (v) return `youtube:v:${v}`;
    const kisa = u.pathname.match(/^\/(shorts|embed|live)\/([^/?#]+)/);
    if (kisa) return `youtube:${kisa[1]}:${kisa[2]}`;
  }
  const yol = u.pathname.replace(/\/+$/, "").toLowerCase();
  return `${platform}:${u.hostname.toLowerCase()}${yol}`;
}
