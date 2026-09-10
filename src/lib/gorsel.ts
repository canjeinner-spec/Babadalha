import { PixelRatio } from "react-native";

const NESNE_YOLU = "/storage/v1/object/public/";
const DONUSUM_YOLU = "/storage/v1/render/image/public/";

export function kucukGorsel(url: string | undefined | null, kutuBoyutu: number): string | undefined {
  if (!url) return undefined;
  const i = url.indexOf(NESNE_YOLU);
  if (i < 0) return url;
  if (url.includes("?")) return url;
  const kenar = Math.min(512, Math.max(48, Math.round(PixelRatio.getPixelSizeForLayoutSize(kutuBoyutu))));
  return `${url.slice(0, i)}${DONUSUM_YOLU}${url.slice(i + NESNE_YOLU.length)}?width=${kenar}&height=${kenar}&resize=cover&quality=80`;
}
