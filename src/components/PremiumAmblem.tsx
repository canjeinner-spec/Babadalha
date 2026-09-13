import { Image } from "expo-image";
import { useState } from "react";

import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { C } from "@/theme/colors";

export type PremiumAmblemAdi = "reklamsiz" | "ad-rengi" | "mikrofon" | "erken" | "daha";

const GORSELLER: Record<PremiumAmblemAdi, number> = {
  reklamsiz: require("@/assets/premium/reklamsiz.webp"),
  "ad-rengi": require("@/assets/premium/ad-rengi.webp"),
  mikrofon: require("@/assets/premium/mikrofon.webp"),
  erken: require("@/assets/premium/erken.webp"),
  daha: require("@/assets/premium/daha.webp"),
};

export function PremiumAmblem({ ad, yedek, boyut = 24 }: {
  ad: PremiumAmblemAdi;
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
