import { Image } from "expo-image";
import { useState } from "react";

import { Icon } from "@/icons/Icon";
import { type IconName } from "@/icons/paths";
import { C } from "@/theme/colors";

export type AltinAmblemAdi =
  | "tac"
  | "onay"
  | "yasak"
  | "yildiz"
  | "mikrofon"
  | "simsek"
  | "elmas"
  | "parti"
  | "kisi-ekle";

const GORSELLER: Record<AltinAmblemAdi, number> = {
  tac: require("@/assets/amblem/tac.webp"),
  onay: require("@/assets/amblem/onay.webp"),
  yasak: require("@/assets/amblem/yasak.webp"),
  yildiz: require("@/assets/amblem/yildiz.webp"),
  mikrofon: require("@/assets/amblem/mikrofon.webp"),
  simsek: require("@/assets/amblem/simsek.webp"),
  elmas: require("@/assets/amblem/elmas.webp"),
  parti: require("@/assets/amblem/parti.webp"),
  "kisi-ekle": require("@/assets/amblem/kisi-ekle.webp"),
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
