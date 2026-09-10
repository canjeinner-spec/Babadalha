import { type ImageSourcePropType } from "react-native";

import { type Room } from "@/data/seed";
import { type PlatformKodu } from "@/oda/platform";

export type PartiOda = Room & {
  platform: PlatformKodu;
  kapak: ImageSourcePropType;
};

const KAPAK: ImageSourcePropType[] = [
  require("@/assets/parti/kapak1.webp"),
  require("@/assets/parti/kapak2.webp"),
  require("@/assets/parti/kapak3.webp"),
  require("@/assets/parti/kapak4.webp"),
  require("@/assets/parti/kapak5.webp"),
];

function oda(
  no: number,
  ad: string,
  platform: PlatformKodu,
  host: string,
  crowd: string[],
  online: number,
): PartiOda {
  return {
    id: `parti-${no}`,
    name: ad,
    host,
    online,
    mic: 0,
    extra: online,
    live: true,
    scene: "club",
    crowd,
    mod: "parti",
    platform,
    kapak: KAPAK[(no - 1) % KAPAK.length],
  };
}

export const PARTI_KART_TABANI: PartiOda = oda(1, "Parti", "youtube", "", [], 1);
