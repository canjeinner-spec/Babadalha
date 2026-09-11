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
  netflixManifestAl(netflixId: string, secureId: string, videoId: string, dil: string): Promise<{ manifestUrl: string; manifestJson: string }>;
  maxManifestAl(oturumToken: string, icerikId: string): Promise<{ manifestUrl: string; lisansUrl: string; manifestJson: string }>;
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

export const NativeOynatici: ComponentType<NativeOynaticiProps> | null = nativeOynaticiVar()
  ? requireNativeViewManager<NativeOynaticiProps>("AronPlayer")
  : null;
