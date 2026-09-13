export type Dil = {
  kod: string;
  ad: string;
  bayrak: string;
  hazir?: boolean;
  sag?: boolean;
};

export const DILLER: Dil[] = [
  { kod: "en", ad: "English", bayrak: "🇬🇧", hazir: true },
  { kod: "tr", ad: "Türkçe", bayrak: "🇹🇷", hazir: true },

  { kod: "es", ad: "Español", bayrak: "🇪🇸" },
  { kod: "pt", ad: "Português", bayrak: "🇧🇷" },
  { kod: "de", ad: "Deutsch", bayrak: "🇩🇪" },
  { kod: "fr", ad: "Français", bayrak: "🇫🇷" },
  { kod: "it", ad: "Italiano", bayrak: "🇮🇹" },
  { kod: "nl", ad: "Nederlands", bayrak: "🇳🇱" },
  { kod: "pl", ad: "Polski", bayrak: "🇵🇱" },
  { kod: "ru", ad: "Русский", bayrak: "🇷🇺" },
  { kod: "uk", ad: "Українська", bayrak: "🇺🇦" },
  { kod: "cs", ad: "Čeština", bayrak: "🇨🇿" },
  { kod: "hu", ad: "Magyar", bayrak: "🇭🇺" },
  { kod: "ro", ad: "Română", bayrak: "🇷🇴" },
  { kod: "el", ad: "Ελληνικά", bayrak: "🇬🇷" },
  { kod: "sv", ad: "Svenska", bayrak: "🇸🇪" },
  { kod: "da", ad: "Dansk", bayrak: "🇩🇰" },
  { kod: "nb", ad: "Norsk", bayrak: "🇳🇴" },
  { kod: "fi", ad: "Suomi", bayrak: "🇫🇮" },
  { kod: "az", ad: "Azərbaycanca", bayrak: "🇦🇿" },

  { kod: "ar", ad: "العربية", bayrak: "🇸🇦", sag: true },
  { kod: "fa", ad: "فارسی", bayrak: "🇮🇷", sag: true },
  { kod: "ur", ad: "اردو", bayrak: "🇵🇰", sag: true },
  { kod: "he", ad: "עברית", bayrak: "🇮🇱", sag: true },

  { kod: "hi", ad: "हिन्दी", bayrak: "🇮🇳" },
  { kod: "bn", ad: "বাংলা", bayrak: "🇧🇩" },
  { kod: "id", ad: "Bahasa Indonesia", bayrak: "🇮🇩" },
  { kod: "ms", ad: "Bahasa Melayu", bayrak: "🇲🇾" },
  { kod: "fil", ad: "Filipino", bayrak: "🇵🇭" },
  { kod: "th", ad: "ไทย", bayrak: "🇹🇭" },
  { kod: "vi", ad: "Tiếng Việt", bayrak: "🇻🇳" },
  { kod: "zh-Hans", ad: "简体中文", bayrak: "🇨🇳" },
  { kod: "zh-Hant", ad: "繁體中文", bayrak: "🇹🇼" },
  { kod: "ja", ad: "日本語", bayrak: "🇯🇵" },
  { kod: "ko", ad: "한국어", bayrak: "🇰🇷" },
];

export const VARSAYILAN_DIL = DILLER[0];

export const HAZIR_DILLER = DILLER.filter((d) => d.hazir);

function eslestir(liste: Dil[], kod: string): Dil | undefined {
  const tam = liste.find((d) => d.kod.toLowerCase() === kod.toLowerCase());
  if (tam) return tam;
  const kok = kod.split("-")[0].toLowerCase();
  return liste.find((d) => d.kod.split("-")[0].toLowerCase() === kok);
}

export function dilBul(kod?: string | null): Dil {
  if (!kod) return VARSAYILAN_DIL;
  return eslestir(HAZIR_DILLER, kod) ?? VARSAYILAN_DIL;
}

export function dilTanim(kod?: string | null): Dil | undefined {
  if (!kod) return undefined;
  return eslestir(DILLER, kod);
}
