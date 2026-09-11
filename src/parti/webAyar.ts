import { type PlatformKodu } from "@/oda/platform";
import { kullaniciAjani } from "@/parti/kopru";
import type { AgIpuclari, WebAyarlari, WebIzni } from "../../modules/aron-webview";

export type NativeWebYapilandirma = {
  ayarlar: WebAyarlari;
  izinler: WebIzni[];
  engelDesenleri: string[];
  agDesenleri: string[];
  basliklar: Record<string, string>;
};

const ORTAK_AYAR: WebAyarlari = {
  javaScript: true,
  domDepo: true,
  veritabani: true,
  medyaHareketGerek: false,
  karisikIcerik: 0,
  onbellekKipi: -1,
  genisGorunum: true,
  genelBakis: true,
  yakinlastirma: false,
  dosyaErisim: false,
  icerikErisim: false,
  pencereAcabilir: true,
  cokluPencere: true,
  guvenliGezinti: false,
  ekranDisiCizim: true,
  tamEkran: true,
  cerez: true,
  ucuncuCerez: true,
  zemin: "#000000",
  konsolAktar: true,
  agSiniri: 250,
  hataAyikla: true,
  istekBasligiGizle: true,
  acilirPencere: true,
  sslGecersizGec: false,
  konumIzin: false,
};

function ipuclari(ua: string): AgIpuclari {
  const surum = ua.match(/Chrome\/(\d+)[\d.]*/)?.[1] ?? "126";
  const tam = ua.match(/Chrome\/([\d.]+)/)?.[1] ?? `${surum}.0.0.0`;
  const edgeSurum = ua.match(/Edg\/(\d+)/)?.[1];
  const markalar = edgeSurum
    ? [
        { marka: "Chromium", anaSurum: surum, tamSurum: tam },
        { marka: "Not:A-Brand", anaSurum: "24", tamSurum: "24.0.0.0" },
        { marka: "Microsoft Edge", anaSurum: edgeSurum, tamSurum: `${edgeSurum}.0.0.0` },
      ]
    : [
        { marka: "Chromium", anaSurum: surum, tamSurum: tam },
        { marka: "Google Chrome", anaSurum: surum, tamSurum: tam },
        { marka: "Not?A_Brand", anaSurum: "24", tamSurum: "24.0.0.0" },
      ];
  if (ua.includes("Windows NT")) {
    return { platform: "Windows", platformSurum: "15.0.0", mimari: "x86", bit: 64, mobil: false, model: "", tamSurum: tam, markalar };
  }
  if (ua.includes("CrOS")) {
    return { platform: "Chrome OS", platformSurum: "16503.74.0", mimari: "arm", bit: 64, mobil: false, model: "", tamSurum: tam, markalar };
  }
  if (ua.includes("X11; Linux")) {
    return { platform: "Linux", platformSurum: "6.6.0", mimari: "x86", bit: 64, mobil: false, model: "", tamSurum: tam, markalar };
  }
  if (ua.includes("Macintosh")) {
    return { platform: "macOS", platformSurum: "14.5.0", mimari: "x86", bit: 64, mobil: false, model: "", tamSurum: tam, markalar };
  }
  return { platform: "Android", platformSurum: "14.0.0", mimari: "arm", bit: 64, mobil: true, model: "", tamSurum: tam, markalar };
}

const ORTAK_ENGEL = [
  "doubleclick\\.net",
  "googlesyndication\\.com",
  "google-analytics\\.com",
  "googletagmanager\\.com",
  "scorecardresearch\\.com",
  "adservice\\.google",
];

const PLATFORM_YAPI: Partial<Record<PlatformKodu, Partial<NativeWebYapilandirma>>> = {
  netflix: {
    ayarlar: { istekBasligiGizle: false },
    agDesenleri: [
      "/msl_v1/cadmium/pbo_manifests",
      "/msl_v1/cadmium/pbo_licenses",
      "/memberapi/release/metadata",
      "/nq/website/memberapi",
      "\\.nflxvideo\\.net",
    ],
    basliklar: {
      "Sec-Ch-Ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Microsoft Edge\";v=\"134\"",
      "Sec-Ch-Ua-Mobile": "?0",
      "Sec-Ch-Ua-Platform": "\"Windows\"",
    },
  },
  prime_video: {
    agDesenleri: [
      "/cdp/catalog/GetPlaybackResources",
      "atv-ps[^/]*\\.(primevideo|amazon)",
      "vod-hls[^/]*\\.amazon",
      "/GetAppStartupConfig",
    ],
  },
  disney_plus: {
    agDesenleri: ["/media/[^/]+/scenarios", "\\.bamgrid\\.com", "/playback/", "widevine"],
  },
  crunchyroll: {
    agDesenleri: ["/play/", "/drm/", "widevine", "\\.vrv\\.co"],
  },
  hbo_max: {
    agDesenleri: ["/playbackInfo", "/drm/", "widevine", "\\.hbo"],
  },
  hulu: {
    agDesenleri: ["/playlist", "/drm/", "widevine"],
  },
  apple_tv: {
    agDesenleri: ["/playbackVerification", "fps", "\\.apple\\.com/.*license"],
  },
  plex: {
    agDesenleri: ["/video/:/transcode", "/library/parts"],
  },
  google_drive: {
    agDesenleri: ["/videoplayback", "/get_video_info"],
  },
  youtube: {
    ayarlar: { agSiniri: 80 },
    agDesenleri: ["/api/timedtext", "/videoplayback"],
    engelDesenleri: ["/pagead/", "/api/stats/ads", "youtube\\.com/ptracking"],
  },
};

export function nativeWebYapilandirma(platform: PlatformKodu): NativeWebYapilandirma {
  const ozel = PLATFORM_YAPI[platform] ?? {};
  const ua = kullaniciAjani(platform);
  return {
    ayarlar: { ...ORTAK_AYAR, agIpuclari: ipuclari(ua), ...(ozel.ayarlar ?? {}) },
    izinler: ozel.izinler ?? ["drm", "ses"],
    engelDesenleri: [...ORTAK_ENGEL, ...(ozel.engelDesenleri ?? [])],
    agDesenleri: ozel.agDesenleri ?? [],
    basliklar: ozel.basliklar ?? {},
  };
}
