import { requireOptionalNativeModule } from "expo";
import { requireNativeViewManager } from "expo-modules-core";
import { type ComponentType } from "react";
import { Platform, type ViewProps } from "react-native";

export type DrmBilgi = {
  sistem: string;
  var: boolean;
  seviye?: string;
  vendor?: string;
  surum?: string;
  aciklama?: string;
  algoritmalar?: string;
  hdcp?: string;
  oturumSiniri?: string;
  sistemKimligi?: string;
  hata?: string;
};

export type WebBilgi = {
  androidSurum: number;
  uretici: string;
  model: string;
  cihaz: string;
  webViewPaket: string;
  webViewSurum?: string;
};

export type KodekBilgi = { ad: string; tip: string; guvenli: boolean; donanim: boolean };

export type WebAyarlari = {
  javaScript?: boolean;
  domDepo?: boolean;
  veritabani?: boolean;
  medyaHareketGerek?: boolean;
  karisikIcerik?: number;
  onbellekKipi?: number;
  genisGorunum?: boolean;
  genelBakis?: boolean;
  yakinlastirma?: boolean;
  metinOlcegi?: number;
  dosyaErisim?: boolean;
  icerikErisim?: boolean;
  pencereAcabilir?: boolean;
  cokluPencere?: boolean;
  gorselEngelle?: boolean;
  agEngelle?: boolean;
  kodlama?: string;
  enKucukYazi?: number;
  konum?: boolean;
  ekranDisiCizim?: boolean;
  guvenliGezinti?: boolean;
  konsolAktar?: boolean;
  tamEkran?: boolean;
  agSiniri?: number;
  cerez?: boolean;
  ucuncuCerez?: boolean;
  zemin?: string;
  karanlikIzin?: boolean;
  hataAyikla?: boolean;
  katman?: number;
  sslGecersizGec?: boolean;
  konumIzin?: boolean;
  acilirPencere?: boolean;
  istekBasligiGizle?: boolean;
  agIpuclari?: AgIpuclari;
};

export type AgIpuclari = {
  platform?: string;
  platformSurum?: string;
  mimari?: string;
  model?: string;
  bit?: number;
  mobil?: boolean;
  tamSurum?: string;
  wow64?: boolean;
  markalar?: { marka: string; anaSurum: string; tamSurum?: string }[];
};

export type WebIzni = "drm" | "ses" | "kamera" | "midi";

export type CerezDurum = {
  adet: number;
  adlar: string[];
  kabul?: boolean;
  hata?: string;
};

export type ModulSurum = {
  ad: string;
  surum: number;
  belgeBetigi: boolean;
  mesajDinleyici: boolean;
  ajanUstverisi: boolean;
  istekBasligi: boolean;
};

type AronWebViewModulu = {
  widevineSeviyesi(): Promise<DrmBilgi>;
  drmBilgi(ad: string): Promise<DrmBilgi>;
  webBilgi(): Promise<WebBilgi>;
  kodekler(yalnizGuvenli: boolean): Promise<KodekBilgi[]>;
  cerezAl(url: string): Promise<string>;
  cerezKaydet(): Promise<boolean>;
  cerezDurum(url: string): Promise<CerezDurum>;
  modulSurum(): Promise<ModulSurum>;
  cerezYaz(url: string, deger: string): Promise<boolean>;
  cerezTemizle(): Promise<boolean>;
  depoTemizle(): Promise<boolean>;
  hataAyiklama(acik: boolean): Promise<boolean>;
};

export type NativeWebOlay<T> = { nativeEvent: T };

export type NativeWebProps = ViewProps & {
  source: string;
  userAgent?: string;
  injectBefore?: string;
  injectAfter?: string;
  ayarlar?: string;
  izinler?: string;
  basliklar?: string;
  engelDesenleri?: string;
  agDesenleri?: string;
  hariciDesenler?: string;
  enjekte?: string;
  temizle?: string;
  sor?: string;
  sayfayaMesaj?: string;
  duraklat?: boolean;
  agAcik?: boolean;
  yenileNo?: number;
  geriNo?: number;
  ileriNo?: number;
  durdurNo?: number;
  onMessage?: (e: NativeWebOlay<{ data: string; kaynak: string; anaCerceve: boolean }>) => void;
  onLoadStart?: (e: NativeWebOlay<{ url: string }>) => void;
  onLoadEnd?: (e: NativeWebOlay<{ url: string }>) => void;
  onError?: (e: NativeWebOlay<{ url: string; aciklama: string; kod: number }>) => void;
  onHttpError?: (e: NativeWebOlay<{ url: string; durum: number }>) => void;
  onIlerleme?: (e: NativeWebOlay<{ yuzde: number }>) => void;
  onKonsol?: (e: NativeWebOlay<{ seviye: string; metin: string; satir: number }>) => void;
  onAg?: (e: NativeWebOlay<{ url: string; yontem: string; anaCerceve: boolean }>) => void;
  onIzin?: (e: NativeWebOlay<{ kaynaklar: string }>) => void;
  onTamEkran?: (e: NativeWebOlay<{ acik: boolean }>) => void;
  onBaslik?: (e: NativeWebOlay<{ baslik: string }>) => void;
  onPencere?: (e: NativeWebOlay<{ url: string; tur: string }>) => void;
  onCokme?: (e: NativeWebOlay<{ coktu: boolean; aciklama: string; url: string }>) => void;
  onIndirme?: (e: NativeWebOlay<{ url: string; ajan: string; icerik: string; tur: string; boyut: number }>) => void;
  onSslHatasi?: (e: NativeWebOlay<{ url: string; kod: number; gecildi: boolean }>) => void;
  onKimlik?: (e: NativeWebOlay<{ host: string; alan: string }>) => void;
  onCevap?: (e: NativeWebOlay<{ id: string; sonuc: string }>) => void;
  onGorunur?: (e: NativeWebOlay<{ url: string }>) => void;
  onDosyaSecim?: (e: NativeWebOlay<{ tur: string }>) => void;
};

const modul = requireOptionalNativeModule<AronWebViewModulu>("AronWebView");

export function nativeWebVar(): boolean {
  return Platform.OS === "android" && !!modul;
}

async function guvenli<T>(cagri: () => Promise<T>, yedek: T): Promise<T> {
  if (!nativeWebVar()) return yedek;
  try {
    return await cagri();
  } catch {
    return yedek;
  }
}

export const widevineSeviyesi = () =>
  guvenli<DrmBilgi | null>(() => modul!.widevineSeviyesi(), null);
export const drmBilgi = (ad: string) => guvenli<DrmBilgi | null>(() => modul!.drmBilgi(ad), null);
export const webBilgi = () => guvenli<WebBilgi | null>(() => modul!.webBilgi(), null);
export const kodekler = (yalnizGuvenli = false) => guvenli<KodekBilgi[]>(() => modul!.kodekler(yalnizGuvenli), []);
export const cerezAl = (url: string) => guvenli<string>(() => modul!.cerezAl(url), "");
export const cerezKaydet = () => guvenli<boolean>(() => modul!.cerezKaydet(), false);
export const cerezDurum = (url: string) =>
  guvenli<CerezDurum>(() => modul!.cerezDurum(url), { adet: 0, adlar: [] });
export const modulSurum = () => guvenli<ModulSurum | null>(() => modul!.modulSurum(), null);
export const cerezYaz = (url: string, deger: string) => guvenli<boolean>(() => modul!.cerezYaz(url, deger), false);
export const cerezTemizle = () => guvenli<boolean>(() => modul!.cerezTemizle(), false);
export const depoTemizle = () => guvenli<boolean>(() => modul!.depoTemizle(), false);
export const hataAyiklama = (acik: boolean) => guvenli<boolean>(() => modul!.hataAyiklama(acik), false);

export const AronNativeWeb: ComponentType<NativeWebProps> | null = nativeWebVar()
  ? requireNativeViewManager<NativeWebProps>("AronWebView")
  : null;
