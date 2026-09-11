import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  type Ref,
} from "react";
import { View, type ViewProps } from "react-native";
import {
  NativeOynatici,
  drmDestegi,
  maxManifestAl,
  netflixManifestAl,
  nativeOynaticiVar,
  type DrmDestek,
  type NativeBoyutOlayi,
  type NativeDrmOlayi,
  type NativeDurumOlayi,
  type NativeHataOlayi,
  type NativeIlerlemeOlayi,
  type NativeOlay,
  type NativeOynaticiRef,
} from "./native";

export { drmDestegi, maxManifestAl, netflixManifestAl, nativeOynaticiVar, type DrmDestek };

export type DrmSemasi = "widevine";

export type DrmYapilandirma = {
  scheme: DrmSemasi;
  licenseUrl: string;
  headers?: Record<string, string>;
  cokluOturum?: boolean;
  anahtarsizOynat?: boolean;
  netflixMsl?: boolean;
  netflixId?: string;
  netflixSecureId?: string;
  netflixVideoId?: string;
};

export type PlaybackConfig = {
  manifestUrl: string;
  mimeType?: string;
  drm?: DrmYapilandirma;
  headers?: Record<string, string>;
  baslangicMs?: number;
  otomatikBasla?: boolean;
  arkaPlandaDevam?: boolean;
};

export type AcikKaynak = Omit<PlaybackConfig, "drm" | "headers"> & {
  drm?: Omit<DrmYapilandirma, "headers">;
};

export type OynaticiDurum =
  | "bos"
  | "hazirlaniyor"
  | "arabellek"
  | "hazir"
  | "oynuyor"
  | "durakladi"
  | "bitti"
  | "hata";

export type DurumOlayi = {
  durum: OynaticiDurum;
  oynuyor: boolean;
  konumMs: number;
  sureMs: number;
  canliYayin: boolean;
};

export type IlerlemeOlayi = NativeIlerlemeOlayi;
export type HataOlayi = NativeHataOlayi;
export type BoyutOlayi = NativeBoyutOlayi;
export type DrmOlayi = { olay: string; mesaj: string };

export type OranKipi = "sigdir" | "doldur" | "yakinlastir" | "genislik" | "yukseklik";

export type AronOynaticiKumanda = {
  yukle(config: PlaybackConfig): Promise<void>;
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
    durum: OynaticiDurum;
  }>;
};

export type AronOynaticiProps = ViewProps & {
  kaynak?: AcikKaynak;
  oranKipi?: OranKipi;
  ses?: number;
  hizi?: number;
  onDurum?: (olay: DurumOlayi) => void;
  onIlerleme?: (olay: IlerlemeOlayi) => void;
  onHata?: (olay: HataOlayi) => void;
  onBoyut?: (olay: BoyutOlayi) => void;
  onDrm?: (olay: DrmOlayi) => void;
};

const ORAN_KODU: Record<OranKipi, string> = {
  sigdir: "sigdir",
  doldur: "doldur",
  yakinlastir: "yakinlastir",
  genislik: "genislik",
  yukseklik: "yukseklik",
};

const YOK_HATASI: HataOlayi = {
  kod: -100,
  kodAdi: "NATIVE_OYNATICI_YOK",
  mesaj: "AronPlayer yalnız Android dev build'de çalışır; Expo Go'da native modül yüklü değil.",
  drm: false,
  sebep: "-",
};

export function yapilandirmayaJson(config: PlaybackConfig): string {
  const govde: Record<string, unknown> = { manifestUrl: config.manifestUrl };
  if (config.mimeType) govde.mimeType = config.mimeType;
  if (config.headers && Object.keys(config.headers).length > 0) govde.headers = config.headers;
  if (typeof config.baslangicMs === "number") govde.baslangicMs = Math.max(0, Math.round(config.baslangicMs));
  if (typeof config.otomatikBasla === "boolean") govde.otomatikBasla = config.otomatikBasla;
  if (typeof config.arkaPlandaDevam === "boolean") govde.arkaPlandaDevam = config.arkaPlandaDevam;
  if (config.drm) {
    const drm: Record<string, unknown> = {
      scheme: config.drm.scheme,
      licenseUrl: config.drm.licenseUrl,
    };
    if (config.drm.headers && Object.keys(config.drm.headers).length > 0) {
      drm.headers = config.drm.headers;
    }
    if (typeof config.drm.cokluOturum === "boolean") drm.cokluOturum = config.drm.cokluOturum;
    if (typeof config.drm.anahtarsizOynat === "boolean") drm.anahtarsizOynat = config.drm.anahtarsizOynat;
    if (config.drm.netflixMsl) drm.netflixMsl = true;
    if (config.drm.netflixId) drm.netflixId = config.drm.netflixId;
    if (config.drm.netflixSecureId) drm.netflixSecureId = config.drm.netflixSecureId;
    if (config.drm.netflixVideoId) drm.netflixVideoId = config.drm.netflixVideoId;
    govde.drm = drm;
  }
  return JSON.stringify(govde);
}

function durumCevir(ham: string): OynaticiDurum {
  switch (ham) {
    case "hazirlaniyor":
    case "arabellek":
    case "hazir":
    case "oynuyor":
    case "durakladi":
    case "bitti":
    case "hata":
      return ham;
    default:
      return "bos";
  }
}

function yokKumanda(onHata?: (olay: HataOlayi) => void): AronOynaticiKumanda {
  const bildir = () => {
    onHata?.(YOK_HATASI);
  };
  return {
    async yukle() {
      bildir();
    },
    async oynat() {
      bildir();
    },
    async duraklat() {},
    async ara() {},
    async durdur() {},
    async birak() {},
    async sesSeviyesi() {},
    async hiz() {},
    async konum() {
      return { konumMs: 0, sureMs: 0, tamponMs: 0, oynuyor: false, durum: "bos" as OynaticiDurum };
    },
  };
}

function AronOynaticiIc(props: AronOynaticiProps, disRef: Ref<AronOynaticiKumanda>) {
  const {
    kaynak,
    oranKipi = "sigdir",
    ses,
    hizi,
    onDurum,
    onIlerleme,
    onHata,
    onBoyut,
    onDrm,
    ...kalan
  } = props;

  const nativeRef = useRef<NativeOynaticiRef | null>(null);

  const kaynakJson = useMemo(() => {
    if (!kaynak) return undefined;
    return yapilandirmayaJson(kaynak as PlaybackConfig);
  }, [kaynak]);

  const kumanda = useMemo<AronOynaticiKumanda>(() => {
    const canli = () => nativeRef.current;
    return {
      async yukle(config: PlaybackConfig) {
        const hedef = canli();
        if (!hedef) {
          onHata?.(YOK_HATASI);
          return;
        }
        await hedef.yukle(yapilandirmayaJson(config));
      },
      async oynat() {
        await canli()?.oynat();
      },
      async duraklat() {
        await canli()?.duraklat();
      },
      async ara(ms: number) {
        await canli()?.ara(ms);
      },
      async durdur() {
        await canli()?.durdur();
      },
      async birak() {
        await canli()?.birak();
      },
      async sesSeviyesi(deger: number) {
        await canli()?.sesSeviyesi(deger);
      },
      async hiz(deger: number) {
        await canli()?.hiz(deger);
      },
      async konum() {
        const bilgi = await canli()?.konum();
        if (!bilgi) return { konumMs: 0, sureMs: 0, tamponMs: 0, oynuyor: false, durum: "bos" as OynaticiDurum };
        return { ...bilgi, durum: durumCevir(bilgi.durum) };
      },
    };
  }, [onHata]);

  const yokluk = useMemo(() => yokKumanda(onHata), [onHata]);

  useImperativeHandle(disRef, () => (NativeOynatici ? kumanda : yokluk), [kumanda, yokluk]);

  const durumGeldi = useCallback(
    (e: NativeOlay<NativeDurumOlayi>) => {
      const n = e.nativeEvent;
      onDurum?.({
        durum: durumCevir(n.durum),
        oynuyor: n.oynuyor,
        konumMs: n.konumMs,
        sureMs: n.sureMs,
        canliYayin: n.canliYayin,
      });
    },
    [onDurum],
  );

  const ilerlemeGeldi = useCallback(
    (e: NativeOlay<NativeIlerlemeOlayi>) => onIlerleme?.(e.nativeEvent),
    [onIlerleme],
  );
  const hataGeldi = useCallback((e: NativeOlay<NativeHataOlayi>) => onHata?.(e.nativeEvent), [onHata]);
  const boyutGeldi = useCallback((e: NativeOlay<NativeBoyutOlayi>) => onBoyut?.(e.nativeEvent), [onBoyut]);
  const drmGeldi = useCallback((e: NativeOlay<NativeDrmOlayi>) => onDrm?.(e.nativeEvent), [onDrm]);

  if (!NativeOynatici) {
    return <View {...kalan} />;
  }

  return (
    <NativeOynatici
      {...kalan}
      ref={nativeRef}
      kaynak={kaynakJson}
      oranKipi={ORAN_KODU[oranKipi]}
      ses={ses}
      hizi={hizi}
      onDurum={durumGeldi}
      onIlerleme={ilerlemeGeldi}
      onHata={hataGeldi}
      onBoyut={boyutGeldi}
      onDrm={drmGeldi}
    />
  );
}

export const AronOynatici = forwardRef<AronOynaticiKumanda, AronOynaticiProps>(AronOynaticiIc);
