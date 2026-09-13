import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { AppState, Platform, type StyleProp, StyleSheet, type ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

import { ayiklamaYaz } from "@/lib/ayiklamaGunluk";
import { type PlatformKodu, platformBul } from "@/oda/platform";
import { nativeWebYapilandirma } from "@/parti/webAyar";
import {
  AronNativeWeb,
  cerezAl,
  cerezDurum,
  cerezKaydet,
  cerezYaz,
  drmBilgi,
  kodekler,
  modulSurum,
  nativeWebVar,
  webBilgi,
} from "../../modules/aron-webview";

export type KopruWebKolu = {
  enjekte: (js: string) => void;
  yenile: () => void;
  geri: () => void;
  durdur: () => void;
  temizle: (kapsam?: string) => void;
  sor: (js: string) => Promise<string>;
  duraklat: (deger: boolean) => void;
};

type Props = {
  uri: string;
  userAgent: string;
  betik: string;
  masaustu: boolean;
  platform: PlatformKodu;
  onMesaj: (veri: string) => void;
  onYukleBasla?: (url: string) => void;
  onYukleBit?: (url: string) => void;
  onHata?: (aciklama: string, url: string) => void;
  style?: StyleProp<ViewStyle>;
};

const SHIM =
  "window.ReactNativeWebView=window.ReactNativeWebView||{postMessage:function(m){try{AronNative.postMessage(String(m));}catch(e){}}};";

let cihazDokuldu = false;

function cerezAdresi(platform: PlatformKodu): string | null {
  const adres = platformBul(platform)?.adres;
  if (!adres) return null;
  try {
    return new URL(adres).origin;
  } catch {
    return null;
  }
}

async function cerezAdlari(adres: string): Promise<{ adet: number; adlar: string[] }> {
  const d = await cerezDurum(adres);
  if (d.adet > 0 || d.adlar.length > 0) return { adet: d.adet, adlar: d.adlar };
  const ham = await cerezAl(adres);
  const adlar = ham
    .split(";")
    .map((p) => p.trim().split("=")[0])
    .filter((a) => a.length > 0);
  return { adet: adlar.length, adlar };
}

export async function cerezleriDiskeYaz(platform: PlatformKodu) {
  if (!nativeWebVar()) return;
  const adres = cerezAdresi(platform);
  const oldu = await cerezKaydet();
  if (oldu || !adres) return;
  await cerezYaz(adres, "aron_kalici=1; Path=/; Max-Age=0");
}

async function cihazDok(platform: PlatformKodu) {
  if (cihazDokuldu) return;
  cihazDokuldu = true;
  try {
    if (!nativeWebVar()) {
      console.warn(
        `[kopru-web] yerel modul yok, react-native-webview kullaniliyor (${Platform.OS})`,
      );
      return;
    }
    const sur = await modulSurum();
    if (sur) {
      console.warn(
        `[kopru-web] modul ${sur.ad} s${sur.surum} belgeBetigi=${sur.belgeBetigi} mesaj=${sur.mesajDinleyici} ipucu=${sur.ajanUstverisi} baslik=${sur.istekBasligi}`,
      );
    } else {
      console.warn("[kopru-web] modul yuklu, surum okunamadi (APK eski, yeniden build gerek)");
    }
    const [wv, wd, pr, ck, kod] = await Promise.all([
      webBilgi(),
      drmBilgi("widevine"),
      drmBilgi("playready"),
      drmBilgi("clearkey"),
      kodekler(true),
    ]);
    if (wv) {
      console.warn(
        `[kopru-web] cihaz ${wv.uretici} ${wv.model} android=${wv.androidSurum} webview=${wv.webViewPaket} ${wv.webViewSurum ?? "-"}`,
      );
    }
    for (const d of [wd, pr, ck]) {
      if (!d) continue;
      console.warn(
        `[kopru-web] drm ${d.sistem} var=${d.var} seviye=${d.seviye ?? "-"} hdcp=${d.hdcp ?? "-"} vendor=${d.vendor ?? "-"} ${d.hata ? "hata=" + d.hata : ""}`,
      );
    }
    const guvenliTipler = Array.from(new Set(kod.map((k) => k.tip))).join(",");
    console.warn(`[kopru-web] guvenli kodek (${kod.length}): ${guvenliTipler || "yok"}`);
  } catch (e) {
    console.warn(`[kopru-web] cihaz dokumu basarisiz: ${String(e)}`);
  }
  try {
    const adres = cerezAdresi(platform);
    if (adres) {
      const c = await cerezAdlari(adres);
      console.warn(
        `[kopru-web] cerez ${platform} adet=${c.adet} adlar=${c.adlar.slice(0, 14).join(",") || "yok"}`,
      );
    }
  } catch (e) {
    console.warn(`[kopru-web] cerez okunamadi: ${String(e)}`);
  }
}

export const KopruWeb = forwardRef<KopruWebKolu, Props>(function KopruWeb(
  { uri, userAgent, betik, masaustu, platform, onMesaj, onYukleBasla, onYukleBit, onHata, style },
  ref,
) {
  const native = nativeWebVar() && !!AronNativeWeb;
  const web = useRef<WebView>(null);
  const [enjekte, setEnjekte] = useState<{ n: number; js: string } | null>(null);
  const [temizleIstek, setTemizleIstek] = useState<{ n: number; kapsam: string } | null>(null);
  const [sor, setSor] = useState<{ n: number; id: string; js: string } | null>(null);
  const [duraklat, setDuraklat] = useState(false);
  const [yenileNo, setYenileNo] = useState(0);
  const [geriNo, setGeriNo] = useState(0);
  const [durdurNo, setDurdurNo] = useState(0);
  const sayac = useRef(0);
  const temizleSayac = useRef(0);
  const sorSayac = useRef(0);
  const bekleyen = useRef(new Map<string, (v: string) => void>());
  const [dirilisNo, setDirilisNo] = useState(0);

  const sorCalistir = (js: string): Promise<string> => {
    if (!native) return Promise.resolve("null");
    sorSayac.current += 1;
    const id = `s${sorSayac.current}`;
    return new Promise<string>((coz) => {
      bekleyen.current.set(id, coz);
      setSor({ n: sorSayac.current, id, js });
      setTimeout(() => {
        if (bekleyen.current.delete(id)) coz("zaman-asimi");
      }, 8000);
    });
  };

  useImperativeHandle(ref, () => ({
    enjekte: (js: string) => {
      if (native) {
        sayac.current += 1;
        setEnjekte({ n: sayac.current, js });
      } else web.current?.injectJavaScript(js);
    },
    yenile: () => {
      if (native) setYenileNo((n) => n + 1);
      else web.current?.reload();
    },
    geri: () => {
      if (native) setGeriNo((n) => n + 1);
      else web.current?.goBack();
    },
    durdur: () => {
      if (native) setDurdurNo((n) => n + 1);
      else web.current?.stopLoading();
    },
    temizle: (kapsam = "hepsi") => {
      if (!native) return;
      temizleSayac.current += 1;
      setTemizleIstek({ n: temizleSayac.current, kapsam });
    },
    sor: sorCalistir,
    duraklat: (deger: boolean) => setDuraklat(deger),
  }));

  useEffect(() => {
    cihazDok(platform);
  }, [platform]);

  useEffect(() => {
    if (!native) return;
    const abone = AppState.addEventListener("change", (durum) => {
      if (durum !== "active") cerezleriDiskeYaz(platform);
    });
    return () => {
      cerezleriDiskeYaz(platform);
      abone.remove();
    };
  }, [native, platform]);

  const yapi = useMemo(() => nativeWebYapilandirma(platform), [platform]);

  const gorulenAg = useRef(new Set<string>());
  const agYaz = (yontem: string, url: string) => {
    let anahtar = url;
    try {
      const u = new URL(url);
      anahtar = u.host + u.pathname;
    } catch {
      anahtar = url.slice(0, 120);
    }
    if (gorulenAg.current.has(anahtar)) return;
    gorulenAg.current.add(anahtar);
    ayiklamaYaz(`ag ${yontem} ${anahtar.slice(0, 130)}`);
  };

  const anahtarDokuldu = useRef(false);
  const anahtarDok = () => {
    if (anahtarDokuldu.current) return;
    anahtarDokuldu.current = true;
    const js =
      "(function(){try{" +
      "var c=document.cookie.split(';').map(function(p){return p.trim().split('=')[0];}).filter(Boolean);" +
      "var l=[];try{for(var i=0;i<localStorage.length;i++){l.push(localStorage.key(i));}}catch(e){l=['ERISIM-YOK'];}" +
      "return JSON.stringify({c:c,l:l});" +
      "}catch(e){return JSON.stringify({hata:String(e)});}})()";
    sorCalistir(js)
      .then((ham) => {
        try {
          const o = JSON.parse(ham) as { c?: string[]; l?: string[]; hata?: string };
          if (o.hata) { ayiklamaYaz(`anahtar hatasi: ${o.hata.slice(0, 90)}`); return; }
          ayiklamaYaz(`cerez(${o.c?.length ?? 0}): ${(o.c ?? []).join(",").slice(0, 150) || "yok"}`);
          ayiklamaYaz(`yerel(${o.l?.length ?? 0}): ${(o.l ?? []).join(",").slice(0, 150) || "yok"}`);
        } catch {
          ayiklamaYaz(`anahtar okunamadi: ${String(ham).slice(0, 90)}`);
        }
      })
      .catch(() => {});
  };
  const nativeBetik = useMemo(() => SHIM + betik, [betik]);

  if (native && AronNativeWeb) {
    return (
      <AronNativeWeb
        key={`aron-web-${dirilisNo}`}
        style={style ?? StyleSheet.absoluteFill}
        source={uri}
        userAgent={userAgent}
        injectBefore={nativeBetik}
        injectAfter={betik}
        ayarlar={JSON.stringify(yapi.ayarlar)}
        izinler={JSON.stringify(yapi.izinler)}
        engelDesenleri={JSON.stringify(yapi.engelDesenleri)}
        agDesenleri={JSON.stringify(yapi.agDesenleri)}
        basliklar={JSON.stringify(yapi.basliklar)}
        enjekte={enjekte ? JSON.stringify(enjekte) : undefined}
        sor={sor ? JSON.stringify(sor) : undefined}
        duraklat={duraklat}
        temizle={temizleIstek ? JSON.stringify(temizleIstek) : undefined}
        yenileNo={yenileNo}
        geriNo={geriNo}
        durdurNo={durdurNo}
        onMessage={(e) => { if (e.nativeEvent.data) onMesaj(e.nativeEvent.data); }}
        onLoadStart={(e) => onYukleBasla?.(e.nativeEvent.url)}
        onLoadEnd={(e) => { onYukleBit?.(e.nativeEvent.url); if (yapi.kesif) anahtarDok(); }}
        onError={(e) => onHata?.(e.nativeEvent.aciklama, e.nativeEvent.url)}
        onHttpError={(e) => console.warn(`[kopru-web] http ${e.nativeEvent.durum} ${e.nativeEvent.url}`)}
        onKonsol={(e) => console.warn(`[sayfa-konsol] ${platform} ${e.nativeEvent.seviye}: ${e.nativeEvent.metin}`)}
        onAg={(e) => {
          console.warn(`[sayfa-ag] ${platform} ${e.nativeEvent.yontem} ${e.nativeEvent.url}`);
          if (yapi.kesif) agYaz(e.nativeEvent.yontem, e.nativeEvent.url);
        }}
        onIzin={(e) => console.warn(`[kopru-web] izin istendi: ${e.nativeEvent.kaynaklar}`)}
        onTamEkran={(e) => console.warn(`[kopru-web] tam ekran ${e.nativeEvent.acik ? "acildi" : "kapandi"}`)}
        onPencere={(e) => console.warn(`[kopru-web] pencere ${e.nativeEvent.tur} ${e.nativeEvent.url}`)}
        onGorunur={(e) => console.warn(`[kopru-web] ilk piksel ${e.nativeEvent.url}`)}
        onIndirme={(e) => console.warn(`[kopru-web] indirme istegi ${e.nativeEvent.tur} ${e.nativeEvent.url}`)}
        onSslHatasi={(e) => console.warn(`[kopru-web] ssl hata kod=${e.nativeEvent.kod} gecildi=${e.nativeEvent.gecildi} ${e.nativeEvent.url}`)}
        onKimlik={(e) => console.warn(`[kopru-web] kimlik dogrulama istendi ${e.nativeEvent.host}`)}
        onDosyaSecim={(e) => console.warn(`[kopru-web] dosya secimi istendi ${e.nativeEvent.tur}`)}
        onCevap={(e) => {
          const coz = bekleyen.current.get(e.nativeEvent.id);
          if (coz) { bekleyen.current.delete(e.nativeEvent.id); coz(e.nativeEvent.sonuc); }
        }}
        onCokme={(e) => {
          console.warn(`[kopru-web] RENDER COKTU coktu=${e.nativeEvent.coktu} ${e.nativeEvent.aciklama} ${e.nativeEvent.url}`);
          bekleyen.current.clear();
          setDirilisNo((n) => n + 1);
        }}
      />
    );
  }

  return (
    <WebView
      ref={web}
      key={`rnw-${dirilisNo}`}
      source={{ uri }}
      userAgent={userAgent}
      injectedJavaScriptBeforeContentLoaded={betik}
      injectedJavaScript={betik}
      onMessage={(e) => onMesaj(e.nativeEvent.data)}
      onContentProcessDidTerminate={() => {
        console.warn(`[kopru-web] ${Platform.OS} icerik sureci sonlandi, oynatici yeniden kuruluyor`);
        bekleyen.current.clear();
        setDirilisNo((n) => n + 1);
      }}
      onRenderProcessGone={() => {
        console.warn(`[kopru-web] ${Platform.OS} render sureci gitti, oynatici yeniden kuruluyor`);
        setDirilisNo((n) => n + 1);
      }}
      onFileDownload={(e) => console.warn(`[kopru-web] indirme istegi ${e.nativeEvent.downloadUrl}`)}
      webviewDebuggingEnabled={__DEV__}
      onLoadStart={(e) => onYukleBasla?.(e.nativeEvent.url)}
      onLoadEnd={(e) => onYukleBit?.(e.nativeEvent.url)}
      onError={(e) => onHata?.(e.nativeEvent.description || "Sayfa açılamadı", e.nativeEvent.url)}
      onHttpError={(e) => console.warn("[kopru-web] http:", e.nativeEvent.statusCode, e.nativeEvent.url)}
      javaScriptEnabled
      domStorageEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
      allowsInlineMediaPlayback
      androidLayerType="hardware"
      mediaPlaybackRequiresUserAction={false}
      allowsFullscreenVideo
      allowsAirPlayForMediaPlayback={false}
      allowsPictureInPictureMediaPlayback={false}
      mixedContentMode="always"
      allowsProtectedMedia
      contentMode={masaustu && Platform.OS === "ios" ? "desktop" : "recommended"}
      cacheEnabled
      setSupportMultipleWindows={false}
      style={style ?? StyleSheet.absoluteFill}
      containerStyle={style ? undefined : StyleSheet.absoluteFill}
    />
  );
});
