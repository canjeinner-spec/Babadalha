import { requireOptionalNativeModule } from "expo";
import { requireNativeViewManager } from "expo-modules-core";
import { type ComponentType, type Ref } from "react";
import { Platform, type ViewProps } from "react-native";

export type DrmDestek = {
  sema: "widevine";
  var: boolean;
  androidSurum: number;
  seviye?: string;
  vendor?: string;
  surum?: string;
  hdcp?: string;
  oturumSiniri?: string;
  hata?: string;
};

type AronPlayerModulu = {
  drmDestegi(): Promise<DrmDestek>;
  raveTokenAyarla(parseToken: string | null, refreshToken: string | null, clientId: string | null, clientSecret: string | null): Promise<{ hazir: boolean }>;
  raveGoogleGiris(idToken: string): Promise<{ hazir: boolean }>;
  netflixManifestAl(netflixId: string, secureId: string, videoId: string, dil: string): Promise<{ manifestUrl: string; manifestJson: string }>;
  maxManifestAl(oturumToken: string, icerikId: string): Promise<{ manifestUrl: string; lisansUrl: string; manifestJson: string }>;
  youtubeManifestAl(videoId: string, dil: string): Promise<{ manifestUrl: string; baslik: string; yazar: string; sureMs: number; streamingJson: string; canli: boolean; userAgent: string }>;
  netflixUstveri(videoId: string, netflixId: string, secureId: string): Promise<{ baslik?: string; kapak?: string }>;
  primeManifestAl(videoId: string, cerezler: string, marketplaceId: string): Promise<{ manifestUrl: string; lisansUrl: string; atvUrl: string; videoId: string; marketplaceId: string; altyazilar?: { kod: string; ad: string; url: string }[] }>;
};

export type NativeOlay<T> = { nativeEvent: T };

export type NativeDurumOlayi = {
  durum: string;
  oynuyor: boolean;
  konumMs: number;
  sureMs: number;
  canliYayin: boolean;
};

export type NativeIlerlemeOlayi = {
  konumMs: number;
  sureMs: number;
  tamponMs: number;
  yuzde: number;
};

export type NativeHataOlayi = {
  kod: number;
  kodAdi: string;
  mesaj: string;
  drm: boolean;
  sebep: string;
};

export type NativeBoyutOlayi = { genislik: number; yukseklik: number; oran: number };

export type NativeDrmOlayi = { olay: string; mesaj: string };

export type NativeOynaticiProps = ViewProps & {
  ref?: Ref<NativeOynaticiRef | null>;
  kaynak?: string;
  oranKipi?: string;
  ses?: number;
  hizi?: number;
  onDurum?: (e: NativeOlay<NativeDurumOlayi>) => void;
  onIlerleme?: (e: NativeOlay<NativeIlerlemeOlayi>) => void;
  onHata?: (e: NativeOlay<NativeHataOlayi>) => void;
  onBoyut?: (e: NativeOlay<NativeBoyutOlayi>) => void;
  onDrm?: (e: NativeOlay<NativeDrmOlayi>) => void;
};

export type NativeOynaticiRef = {
  yukle(json: string): Promise<void>;
  oynat(): Promise<void>;
  duraklat(): Promise<void>;
  ara(ms: number): Promise<void>;
  durdur(): Promise<void>;
  birak(): Promise<void>;
  sesSeviyesi(deger: number): Promise<void>;
  hiz(deger: number): Promise<void>;
  konum(): Promise<{
    konumMs: number;
    sureMs: number;
    tamponMs: number;
    oynuyor: boolean;
    durum: string;
  }>;
  izler(): Promise<{
    ses: { kod: string; ad: string; secili: boolean }[];
    altyazi: { kod: string; ad: string; secili: boolean }[];
    kalite: { yukseklik: number; ad: string; secili: boolean }[];
    altyaziAcik: boolean;
  }>;
  sesDiliSec(kod: string): Promise<void>;
  altyaziSec(kod: string | null): Promise<void>;
  kaliteSec(yukseklik: number): Promise<void>;
};

const modul = requireOptionalNativeModule<AronPlayerModulu>("AronPlayer");

export function nativeOynaticiVar(): boolean {
  return Platform.OS === "android" && !!modul;
}

export async function drmDestegi(): Promise<DrmDestek | null> {
  if (!nativeOynaticiVar()) return null;
  try {
    return await modul!.drmDestegi();
  } catch {
    return null;
  }
}

export async function raveTokenAyarla(
  parseToken: string | null,
  refreshToken: string | null = null,
  clientId: string | null = null,
  clientSecret: string | null = null,
): Promise<boolean> {
  if (!nativeOynaticiVar()) return false;
  try {
    const sonuc = await modul!.raveTokenAyarla(parseToken, refreshToken, clientId, clientSecret);
    return sonuc.hazir;
  } catch {
    return false;
  }
}

export async function raveGoogleGiris(idToken: string): Promise<boolean> {
  if (!nativeOynaticiVar()) throw new Error("Yerel oynatici yok");
  const sonuc = await modul!.raveGoogleGiris(idToken);
  return sonuc.hazir;
}

export async function netflixManifestAl(
  netflixId: string,
  secureId: string,
  videoId: string,
  dil = "tr",
): Promise<{ manifestUrl: string; manifestJson: string }> {
  if (!nativeOynaticiVar()) throw new Error("Yerel oynatici yok");
  return modul!.netflixManifestAl(netflixId, secureId, videoId, dil);
}

export async function maxManifestAl(
  oturumToken: string,
  icerikId: string,
): Promise<{ manifestUrl: string; lisansUrl: string; manifestJson: string }> {
  if (!nativeOynaticiVar()) throw new Error("Yerel oynatici yok");
  return modul!.maxManifestAl(oturumToken, icerikId);
}

export async function youtubeManifestAl(
  videoId: string,
  dil = "en",
): Promise<{ manifestUrl: string; baslik: string; yazar: string; sureMs: number; streamingJson: string; canli: boolean; userAgent: string }> {
  if (!nativeOynaticiVar()) throw new Error("Yerel oynatici yok");
  return modul!.youtubeManifestAl(videoId, dil);
}

export async function netflixUstveri(
  videoId: string,
  netflixId: string,
  secureId: string,
): Promise<{ baslik?: string; kapak?: string }> {
  if (!nativeOynaticiVar()) return {};
  try {
    return await modul!.netflixUstveri(videoId, netflixId, secureId);
  } catch {
    return {};
  }
}

export async function primeManifestAl(
  videoId: string,
  cerezler: string,
  marketplaceId = "",
): Promise<{ manifestUrl: string; lisansUrl: string; atvUrl: string; videoId: string; marketplaceId: string; altyazilar?: { kod: string; ad: string; url: string }[] }> {
  if (!nativeOynaticiVar()) throw new Error("Yerel oynatici yok");
  return modul!.primeManifestAl(videoId, cerezler, marketplaceId);
}

export const NativeOynatici: ComponentType<NativeOynaticiProps> | null = nativeOynaticiVar()
  ? requireNativeViewManager<NativeOynaticiProps>("AronPlayer")
  : null;
