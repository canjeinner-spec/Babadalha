import { Image } from "expo-image";
import { useState } from "react";

import { Icon } from "@/icons/Icon";

export function BaslatAmblemi({ boyut = 26, renk = "#241A05" }: { boyut?: number; renk?: string }) {
  const [hata, setHata] = useState(false);
  if (hata) return <Icon name="evParty" size={boyut * 0.68} color={renk} />;
  return (
    <Image
      source={require("@/assets/marka/parti-amblem.webp")}
      style={{ width: boyut, height: boyut }}
      contentFit="contain"
      transition={140}
      onError={() => setHata(true)}
    />
  );
}
