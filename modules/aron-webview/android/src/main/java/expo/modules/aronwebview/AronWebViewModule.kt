package expo.modules.aronwebview

import android.media.MediaCodecList
import android.media.MediaDrm
import android.os.Build
import android.webkit.CookieManager
import android.webkit.WebStorage
import android.webkit.WebView
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.UUID

private val WIDEVINE = UUID(-0x121074568629b532L, -0x5c37d8232ae2de13L)
private val PLAYREADY = UUID(-0x65fb0f8667bfbd7aL, -0x546d19a41f77e479L)
private val CLEARKEY = UUID(0x1077efecc0b24d02L, -0x531cc3e1ad1d04b5L)

class AronWebViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AronWebView")

    AsyncFunction("widevineSeviyesi") { drmOku(WIDEVINE, "widevine") }

    AsyncFunction("drmBilgi") { ad: String ->
      when (ad.lowercase()) {
        "playready" -> drmOku(PLAYREADY, "playready")
        "clearkey" -> drmOku(CLEARKEY, "clearkey")
        else -> drmOku(WIDEVINE, "widevine")
      }
    }

    AsyncFunction("webBilgi") {
      val bilgi = mutableMapOf<String, Any>(
        "androidSurum" to Build.VERSION.SDK_INT,
        "uretici" to (Build.MANUFACTURER ?: "-"),
        "model" to (Build.MODEL ?: "-"),
        "cihaz" to (Build.DEVICE ?: "-")
      )
      try {
        val paket = WebViewCompat.getCurrentWebViewPackage(appContext.reactContext!!)
        bilgi["webViewPaket"] = paket?.packageName ?: "-"
        bilgi["webViewSurum"] = paket?.versionName ?: "-"
      } catch (e: Throwable) {
        bilgi["webViewPaket"] = "okunamadi"
      }
      bilgi
    }

    AsyncFunction("kodekler") { yalnizGuvenli: Boolean ->
      val cikti = mutableListOf<Map<String, Any>>()
      try {
        val liste = MediaCodecList(MediaCodecList.ALL_CODECS).codecInfos
        for (k in liste) {
          if (k.isEncoder) continue
          val guvenli = k.name.contains("secure", true)
          if (yalnizGuvenli && !guvenli) continue
          for (tip in k.supportedTypes) {
            if (!tip.startsWith("video/") && !tip.startsWith("audio/")) continue
            var donanim = true
            try {
              if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) donanim = k.isHardwareAccelerated
            } catch (e: Throwable) {
            }
            cikti.add(mapOf(
              "ad" to k.name,
              "tip" to tip,
              "guvenli" to guvenli,
              "donanim" to donanim
            ))
          }
        }
      } catch (e: Throwable) {
      }
      cikti
    }

    AsyncFunction("cerezAl") { url: String ->
      try {
        CookieManager.getInstance().getCookie(url) ?: ""
      } catch (e: Throwable) {
        ""
      }
    }

    AsyncFunction("cerezKaydet") {
      try {
        CookieManager.getInstance().flush()
        true
      } catch (e: Throwable) {
        false
      }
    }

    AsyncFunction("cerezDurum") { url: String ->
      val cikti = mutableMapOf<String, Any>("adet" to 0, "adlar" to emptyList<String>())
      try {
        val ham = CookieManager.getInstance().getCookie(url)
        val adlar = (ham ?: "").split(";")
          .map { it.trim().substringBefore("=") }
          .filter { it.isNotEmpty() }
        cikti["adet"] = adlar.size
        cikti["adlar"] = adlar
        cikti["kabul"] = CookieManager.getInstance().acceptCookie()
      } catch (e: Throwable) {
        cikti["hata"] = e.javaClass.simpleName
      }
      cikti
    }

    AsyncFunction("cerezYaz") { url: String, deger: String ->
      try {
        CookieManager.getInstance().setCookie(url, deger)
        CookieManager.getInstance().flush()
        true
      } catch (e: Throwable) {
        false
      }
    }

    AsyncFunction("cerezTemizle") {
      try {
        CookieManager.getInstance().removeAllCookies(null)
        CookieManager.getInstance().flush()
        true
      } catch (e: Throwable) {
        false
      }
    }

    AsyncFunction("depoTemizle") {
      try {
        WebStorage.getInstance().deleteAllData()
        true
      } catch (e: Throwable) {
        false
      }
    }

    AsyncFunction("modulSurum") {
      mapOf(
        "ad" to "aron-webview",
        "surum" to 2,
        "belgeBetigi" to WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT),
        "mesajDinleyici" to WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER),
        "ajanUstverisi" to WebViewFeature.isFeatureSupported(WebViewFeature.USER_AGENT_METADATA),
        "istekBasligi" to WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)
      )
    }

    AsyncFunction("hataAyiklama") { acik: Boolean ->
      try {
        WebView.setWebContentsDebuggingEnabled(acik)
        true
      } catch (e: Throwable) {
        false
      }
    }

    View(AronWebView::class) {
      Events(
        "onMessage", "onLoadStart", "onLoadEnd", "onError", "onHttpError",
        "onIlerleme", "onKonsol", "onAg", "onIzin", "onTamEkran", "onBaslik", "onPencere",
        "onCokme", "onIndirme", "onSslHatasi", "onKimlik", "onCevap", "onGorunur", "onDosyaSecim"
      )

      Prop("userAgent") { view: AronWebView, ua: String? -> view.ajanAyarla(ua) }
      Prop("injectBefore") { view: AronWebView, js: String? -> view.betikOnce = js }
      Prop("injectAfter") { view: AronWebView, js: String? -> view.betikSonra = js }
      Prop("ayarlar") { view: AronWebView, json: String? -> view.ayarlariUygula(json) }
      Prop("izinler") { view: AronWebView, json: String? -> view.izinlerAyarla(json) }
      Prop("basliklar") { view: AronWebView, json: String? -> view.basliklarAyarla(json) }
      Prop("engelDesenleri") { view: AronWebView, json: String? -> view.engelDesenleriAyarla(json) }
      Prop("agDesenleri") { view: AronWebView, json: String? -> view.agDesenleriAyarla(json) }
      Prop("hariciDesenler") { view: AronWebView, json: String? -> view.hariciDesenlerAyarla(json) }
      Prop("enjekte") { view: AronWebView, json: String? -> view.enjekteIste(json) }
      Prop("temizle") { view: AronWebView, json: String? -> view.temizleIste(json) }
      Prop("yenileNo") { view: AronWebView, n: Int -> view.yenileIste(n) }
      Prop("geriNo") { view: AronWebView, n: Int -> view.geriIste(n) }
      Prop("ileriNo") { view: AronWebView, n: Int -> view.ileriIste(n) }
      Prop("durdurNo") { view: AronWebView, n: Int -> view.durdurIste(n) }
      Prop("sor") { view: AronWebView, json: String? -> view.sorIste(json) }
      Prop("sayfayaMesaj") { view: AronWebView, json: String? -> view.sayfayaMesajIste(json) }
      Prop("duraklat") { view: AronWebView, deger: Boolean -> view.duraklatAyarla(deger) }
      Prop("agAcik") { view: AronWebView, deger: Boolean -> view.agDurumu(deger) }
      Prop("source") { view: AronWebView, url: String -> view.kaynakYukle(url) }

      OnViewDestroys { view: AronWebView -> view.yokEt() }
    }
  }

  private fun drmOku(uuid: UUID, ad: String): Map<String, Any> {
    return try {
      val drm = MediaDrm(uuid)
      val bilgi = mutableMapOf<String, Any>(
        "sistem" to ad,
        "var" to true,
        "seviye" to ozellik(drm, "securityLevel"),
        "vendor" to ozellik(drm, "vendor"),
        "surum" to ozellik(drm, "version"),
        "aciklama" to ozellik(drm, "description"),
        "algoritmalar" to ozellik(drm, "algorithms"),
        "hdcp" to ozellik(drm, "maxHdcpLevel"),
        "oturumSiniri" to ozellik(drm, "maxNumberOfSessions"),
        "sistemKimligi" to ozellik(drm, "systemId")
      )
      kapat(drm)
      bilgi
    } catch (e: Throwable) {
      mapOf("sistem" to ad, "var" to false, "hata" to (e.message ?: "desteklenmiyor"))
    }
  }

  private fun ozellik(drm: MediaDrm, ad: String): String {
    return try {
      drm.getPropertyString(ad)
    } catch (e: Throwable) {
      "-"
    }
  }

  private fun kapat(drm: MediaDrm) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) drm.close() else @Suppress("DEPRECATION") drm.release()
    } catch (e: Throwable) {
    }
  }
}
