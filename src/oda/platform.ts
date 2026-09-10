import { Platform as Isletim, type ImageSourcePropType } from "react-native";

export type PlatformKodu =
  | "youtube" | "netflix" | "prime_video" | "disney_plus" | "hbo_max"
  | "hulu" | "crunchyroll" | "apple_tv" | "plex" | "google_drive" | "dogrudan";

export type Platform = {
  kod: PlatformKodu;
  ad: string;
  adres: string;
  logo: ImageSourcePropType;
  hesapGerekir: boolean;
  vurgu: string;
};

export const PLATFORMLAR: Platform[] = [
  { kod: "youtube", ad: "YouTube", adres: "https://www.youtube.com", logo: require("@/assets/platform/youtube.png"), hesapGerekir: false, vurgu: "#FF0000" },
  { kod: "netflix", ad: "Netflix", adres: "https://www.netflix.com/browse", logo: require("@/assets/platform/netflix.png"), hesapGerekir: true, vurgu: "#E50914" },
  { kod: "prime_video", ad: "Prime Video", adres: "https://www.primevideo.com", logo: require("@/assets/platform/prime_video.png"), hesapGerekir: true, vurgu: "#00A8E1" },
  { kod: "disney_plus", ad: "Disney+", adres: "https://www.disneyplus.com/home", logo: require("@/assets/platform/disney_plus.png"), hesapGerekir: true, vurgu: "#0063E5" },
  { kod: "hbo_max", ad: "HBO Max", adres: "https://www.hbomax.com", logo: require("@/assets/platform/hbo_max.png"), hesapGerekir: true, vurgu: "#8A2BE2" },
  { kod: "hulu", ad: "Hulu", adres: "https://www.hulu.com", logo: require("@/assets/platform/hulu.png"), hesapGerekir: true, vurgu: "#1CE783" },
  { kod: "crunchyroll", ad: "Crunchyroll", adres: "https://www.crunchyroll.com", logo: require("@/assets/platform/crunchyroll.png"), hesapGerekir: true, vurgu: "#F47521" },
  { kod: "apple_tv", ad: "Apple TV+", adres: "https://tv.apple.com", logo: require("@/assets/platform/apple_tv.png"), hesapGerekir: true, vurgu: "#FFFFFF" },
  { kod: "plex", ad: "Plex", adres: "https://app.plex.tv", logo: require("@/assets/platform/plex.png"), hesapGerekir: true, vurgu: "#EBAF00" },
  { kod: "google_drive", ad: "Drive", adres: "https://drive.google.com", logo: require("@/assets/platform/google_drive.png"), hesapGerekir: true, vurgu: "#00AC47" },
];

export const DOGRUDAN_ADI = "Doğrudan bağlantı";

export function dogrudanMi(kod?: string | null): boolean {
  return kod === "dogrudan";
}

export function oynatilabilirAdresMi(adres: string): boolean {
  const a = adres.trim();
  if (!/^https?:\/\//i.test(a)) return false;
  return /\.(mp4|m4v|mov|webm|mkv|mpd|m3u8)(\?|#|$)/i.test(a) || /\/manifest|\/playlist/i.test(a);
}

export function platformBul(kod?: string | null): Platform | undefined {
  if (!kod) return undefined;
  return PLATFORMLAR.find((p) => p.kod === kod);
}

const BU_CIHAZDA_YOK = new Set<PlatformKodu>(Isletim.OS === "android" ? ["netflix"] : []);

export function platformDesteklenmiyor(kod?: string | null): boolean {
  if (!kod) return false;
  return BU_CIHAZDA_YOK.has(kod as PlatformKodu);
}

export function platformKilitNotu(kod: PlatformKodu): string | null {
  if (!BU_CIHAZDA_YOK.has(kod)) return null;
  if (kod === "netflix") return "Netflix ile izleme yalnız iPhone'da";
  return "Bu cihazda kullanılamıyor";
}

const GIRIS_DESENI = /(\/login|\/signin|\/sign-in|\/ap\/signin|\/auth(\/|\?|$)|\/identity|accounts\.google\.com|idmsa\.apple\.com|auth\.hulu\.com|sso\.crunchyroll\.com|auth\.max\.com|app\.plex\.tv\/auth|\/tr\/?$|\/tr-tr\/?$)/i;

export function girisSayfasiMi(adres: string | null | undefined): boolean {
  if (!adres) return false;
  return GIRIS_DESENI.test(adres);
}
