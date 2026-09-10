export type Dil = { kod: string; ad: string; bayrak: string };

export const DILLER: Dil[] = [
  { kod: "tr", ad: "Türkçe", bayrak: "🇹🇷" },
  { kod: "en", ad: "English", bayrak: "🇬🇧" },
  { kod: "es", ad: "Español", bayrak: "🇪🇸" },
  { kod: "de", ad: "Deutsch", bayrak: "🇩🇪" },
  { kod: "fr", ad: "Français", bayrak: "🇫🇷" },
  { kod: "it", ad: "Italiano", bayrak: "🇮🇹" },
  { kod: "ar", ad: "العربية", bayrak: "🇸🇦" },
  { kod: "hi", ad: "हिन्दी", bayrak: "🇮🇳" },
  { kod: "zh-Hans", ad: "简体中文", bayrak: "🇨🇳" },
  { kod: "ja", ad: "日本語", bayrak: "🇯🇵" },
  { kod: "ko", ad: "한국어", bayrak: "🇰🇷" },
  { kod: "vi", ad: "Tiếng Việt", bayrak: "🇻🇳" },
];

export const VARSAYILAN_DIL = DILLER[0];

export function dilBul(kod?: string | null): Dil {
  if (!kod) return VARSAYILAN_DIL;
  const tam = DILLER.find((d) => d.kod === kod);
  if (tam) return tam;
  const kok = kod.split("-")[0];
  return DILLER.find((d) => d.kod.split("-")[0] === kok) ?? VARSAYILAN_DIL;
}
