import { Platform as Isletim, type ImageSourcePropType } from "react-native";

export type PlatformKodu =
  | "youtube" | "youtube_live" | "netflix" | "prime_video" | "disney_plus" | "hbo_max"
  | "hulu" | "crunchyroll" | "apple_tv" | "plex" | "google_drive"
  | "twitch" | "dailymotion" | "reddit" | "tubi" | "vimeo"
  | "peacock" | "pluto" | "vk" | "rutube" | "twitter"
  | "exxen" | "blutv" | "puhutv" | "tabii" | "tod" | "gain"
  | "dogrudan";

export type Platform = {
  kod: PlatformKodu;
  ad: string;
  adres: string;
  logo?: ImageSourcePropType;
  hesapGerekir: boolean;
  vurgu: string;
};

export const PLATFORMLAR: Platform[] = [
  { kod: "youtube", ad: "YouTube", adres: "https://www.youtube.com", logo: require("@/assets/platform/youtube.png"), hesapGerekir: false, vurgu: "#FF0000" },
  { kod: "youtube_live", ad: "YouTube Live", adres: "https://www.youtube.com/results?search_query=live&sp=EgJAAQ%3D%3D", logo: require("@/assets/platform/youtube_live.png"), hesapGerekir: false, vurgu: "#FF0000" },
  { kod: "netflix", ad: "Netflix", adres: "https://www.netflix.com/browse", logo: require("@/assets/platform/netflix.png"), hesapGerekir: true, vurgu: "#E50914" },
  { kod: "prime_video", ad: "Prime Video", adres: "https://www.primevideo.com", logo: require("@/assets/platform/prime_video.png"), hesapGerekir: true, vurgu: "#00A8E1" },
  { kod: "disney_plus", ad: "Disney+", adres: "https://www.disneyplus.com/home", logo: require("@/assets/platform/disney_plus.png"), hesapGerekir: true, vurgu: "#0063E5" },
  { kod: "hbo_max", ad: "HBO Max", adres: "https://www.hbomax.com", logo: require("@/assets/platform/hbo_max.png"), hesapGerekir: true, vurgu: "#8A2BE2" },
  { kod: "hulu", ad: "Hulu", adres: "https://www.hulu.com", logo: require("@/assets/platform/hulu.png"), hesapGerekir: true, vurgu: "#1CE783" },
  { kod: "crunchyroll", ad: "Crunchyroll", adres: "https://www.crunchyroll.com", logo: require("@/assets/platform/crunchyroll.png"), hesapGerekir: true, vurgu: "#F47521" },
  { kod: "apple_tv", ad: "Apple TV+", adres: "https://tv.apple.com", logo: require("@/assets/platform/apple_tv.png"), hesapGerekir: true, vurgu: "#FFFFFF" },
  { kod: "plex", ad: "Plex", adres: "https://app.plex.tv", logo: require("@/assets/platform/plex.png"), hesapGerekir: true, vurgu: "#EBAF00" },
  { kod: "google_drive", ad: "Drive", adres: "https://drive.google.com", logo: require("@/assets/platform/google_drive.png"), hesapGerekir: true, vurgu: "#00AC47" },
  { kod: "twitch", ad: "Twitch", adres: "https://www.twitch.tv", logo: require("@/assets/platform/twitch.png"), hesapGerekir: false, vurgu: "#9146FF" },
  { kod: "dailymotion", ad: "Dailymotion", adres: "https://www.dailymotion.com", logo: require("@/assets/platform/dailymotion.png"), hesapGerekir: false, vurgu: "#0066DC" },
  { kod: "reddit", ad: "Reddit", adres: "https://www.reddit.com", logo: require("@/assets/platform/reddit.png"), hesapGerekir: false, vurgu: "#FF4500" },
  { kod: "tubi", ad: "Tubi", adres: "https://tubitv.com", logo: require("@/assets/platform/tubi.png"), hesapGerekir: false, vurgu: "#FA382F" },
  { kod: "vimeo", ad: "Vimeo", adres: "https://vimeo.com", logo: require("@/assets/platform/vimeo.png"), hesapGerekir: false, vurgu: "#1AB7EA" },
  { kod: "peacock", ad: "Peacock", adres: "https://www.peacocktv.com", logo: require("@/assets/platform/peacock.png"), hesapGerekir: true, vurgu: "#000000" },
  { kod: "pluto", ad: "Pluto TV", adres: "https://pluto.tv", logo: require("@/assets/platform/pluto.png"), hesapGerekir: false, vurgu: "#FFCC00" },
  { kod: "vk", ad: "VK Video", adres: "https://vk.com/video", logo: require("@/assets/platform/vk.png"), hesapGerekir: false, vurgu: "#0077FF" },
  { kod: "rutube", ad: "Rutube", adres: "https://rutube.ru", logo: require("@/assets/platform/rutube.png"), hesapGerekir: false, vurgu: "#1D1D1D" },
  { kod: "twitter", ad: "X (Twitter)", adres: "https://x.com", logo: require("@/assets/platform/twitter.png"), hesapGerekir: false, vurgu: "#000000" },
  { kod: "exxen", ad: "Exxen", adres: "https://www.exxen.com", hesapGerekir: true, vurgu: "#00E676" },
  { kod: "blutv", ad: "BluTV", adres: "https://www.blutv.com", hesapGerekir: true, vurgu: "#00A0E9" },
  { kod: "puhutv", ad: "puhutv", adres: "https://puhutv.com", hesapGerekir: false, vurgu: "#F5C518" },
  { kod: "tabii", ad: "tabii", adres: "https://tabii.com", hesapGerekir: true, vurgu: "#E3002B" },
  { kod: "tod", ad: "TOD", adres: "https://www.todtv.com.tr", hesapGerekir: true, vurgu: "#6A1B9A" },
  { kod: "gain", ad: "Gain", adres: "https://www.gain.tv", hesapGerekir: true, vurgu: "#FF5722" },
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

const BU_CIHAZDA_YOK = new Set<PlatformKodu>([]);

export function platformDesteklenmiyor(kod?: string | null): boolean {
  if (!kod) return false;
  return BU_CIHAZDA_YOK.has(kod as PlatformKodu);
}

export function platformKilitNotu(kod: PlatformKodu): string | null {
  if (!BU_CIHAZDA_YOK.has(kod)) return null;
  return "Bu cihazda kullanılamıyor";
}

const GIRIS_DESENI = /(\/login|\/signin|\/sign-in|\/ap\/signin|\/auth(\/|\?|$)|\/identity|accounts\.google\.com|idmsa\.apple\.com|auth\.hulu\.com|sso\.crunchyroll\.com|auth\.max\.com|app\.plex\.tv\/auth|passport\.twitch\.tv|oauth\.vk\.com|\/tr\/?$|\/tr-tr\/?$)/i;

export function girisSayfasiMi(adres: string | null | undefined): boolean {
  if (!adres) return false;
  return GIRIS_DESENI.test(adres);
}
