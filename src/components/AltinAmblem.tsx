import { Image } from "expo-image";
import { useState } from "react";

import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { C } from "@/theme/colors";

export type AltinAmblemAdi =
  | "tac"
  | "hazir"
  | "reklamsiz"
  | "ad-rengi"
  | "mikrofon"
  | "erken"
  | "daha";

const GORSELLER: Record<AltinAmblemAdi, number> = {
  tac: require("@/assets/amblem/tac.webp"),
  hazir: require("@/assets/amblem/hazir.webp"),
  reklamsiz: require("@/assets/amblem/reklamsiz.webp"),
  "ad-rengi": require("@/assets/amblem/ad-rengi.webp"),
  mikrofon: require("@/assets/amblem/mikrofon.webp"),
  erken: require("@/assets/amblem/erken.webp"),
  daha: require("@/assets/amblem/daha.webp"),
};

export function AltinAmblem({ ad, yedek, boyut = 24 }: {
  ad: AltinAmblemAdi;
  yedek: IconName;
  boyut?: number;
}) {
  const [hata, setHata] = useState(false);
  if (hata) return <Icon name={yedek} size={boyut * 0.82} sw={2} color={C.gold2} />;
  return (
    <Image
      source={GORSELLER[ad]}
      style={{ width: boyut, height: boyut }}
      contentFit="contain"
      transition={120}
      onError={() => setHata(true)}
    />
  );
}
