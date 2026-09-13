package expo.modules.aronplayer

import android.media.MediaDrm
import android.os.Build
import android.os.Handler
import android.os.Looper
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.drm.FrameworkMediaDrm
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

@androidx.annotation.OptIn(UnstableApi::class)
class AronPlayerModule : Module() {
  private val elci = Handler(Looper.getMainLooper())

  override fun definition() = ModuleDefinition {
    Name("AronPlayer")

    AsyncFunction("drmDestegi") {
      val destek = try {
        FrameworkMediaDrm.isCryptoSchemeSupported(C.WIDEVINE_UUID)
      } catch (e: Throwable) {
        false
      }
      val bilgi = mutableMapOf<String, Any>(
        "sema" to "widevine",
        "var" to destek,
        "androidSurum" to Build.VERSION.SDK_INT
      )
      
      var drm: MediaDrm? = null
      if (destek) {
        try {
          drm = MediaDrm(C.WIDEVINE_UUID)
          bilgi["seviye"] = ozellik(drm, "securityLevel")
          bilgi["vendor"] = ozellik(drm, "vendor")
          bilgi["surum"] = ozellik(drm, "version")
          bilgi["hdcp"] = ozellik(drm, "maxHdcpLevel")
          bilgi["oturumSiniri"] = ozellik(drm, "maxNumberOfSessions")
        } catch (e: Throwable) {
          bilgi["hata"] = e.javaClass.simpleName
        } finally {
          drm?.let { kapat(it) }
        }
      }
      bilgi
    }

    AsyncFunction("raveTokenAyarla") { parseToken: String?, refreshToken: String?, clientId: String?, clientSecret: String? ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      RaveOturum.yapilandir(ctx)
      RaveOturum.tokenAyarla(parseToken, refreshToken, clientId, clientSecret)
      mapOf("hazir" to RaveOturum.hazirMi())
    }

    AsyncFunction("raveGoogleGiris") { idToken: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      RaveOturum.yapilandir(ctx)
      RaveOturum.googleIleGiris(idToken)
      mapOf("hazir" to RaveOturum.hazirMi())
    }

    AsyncFunction("netflixOturumBaslat") { netflixId: String, secureId: String, dil: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      val yonetici = NetflixMslYonetici(ctx)
      yonetici.baslat(netflixId, secureId, dil)
      yonetici.anahtarDegisimi()
      mapOf("esn" to yonetici.oturum.kimlik, "basarili" to true)
    }

    AsyncFunction("netflixManifestAl") { netflixId: String, secureId: String, videoId: String, dil: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      val yonetici = NetflixMslYonetici(ctx)
      yonetici.baslat(netflixId, secureId, dil)
      yonetici.anahtarDegisimi()
      val manifestJson = yonetici.manifestAl(videoId)
      val mpdUri = yonetici.mpdOlustur(manifestJson)
      mapOf("manifestUrl" to mpdUri, "manifestJson" to manifestJson)
    }

    AsyncFunction("maxManifestAl") { oturumToken: String, icerikId: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      val yonetici = MaxApiYonetici(ctx)
      val bilgi = yonetici.oynatimBilgisiAl(oturumToken, icerikId)
      mapOf(
        "manifestUrl" to bilgi.manifestUrl,
        "lisansUrl" to bilgi.lisansUrl,
        "manifestJson" to bilgi.manifestJson
      )
    }

    AsyncFunction("youtubeManifestAl") { videoId: String, dil: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      val istemci = YoutubeInnertubeIstemcisi(ctx)
      val bilgi = istemci.oynatimBilgisiAl(videoId, dil)
      mapOf(
        "manifestUrl" to bilgi.manifestUrl,
        "baslik" to bilgi.baslik,
        "yazar" to bilgi.yazar,
        "sureMs" to bilgi.sureMs.toDouble(),
        "streamingJson" to bilgi.streamingJson
      )
    }

    AsyncFunction("netflixUstveri") { videoId: String, netflixId: String, secureId: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      val yonetici = NetflixMslYonetici(ctx)
      yonetici.oturum.netflixId = netflixId
      yonetici.oturum.netflixSecureId = secureId
      yonetici.baslikBilgisiAl(videoId)
    }

    AsyncFunction("primeManifestAl") { videoId: String, cerezler: String, marketplaceId: String ->
      val ctx = appContext.reactContext ?: throw IllegalStateException("context yok")
      val yonetici = PrimeApiYonetici(ctx)
      val pazar = if (marketplaceId.isNotEmpty()) marketplaceId else PrimeApiYonetici.VARSAYILAN_MARKETPLACE
      val bilgi = yonetici.oynatimBilgisiAl(videoId, cerezler, pazar)
      mapOf(
        "manifestUrl" to bilgi.manifestUrl,
        "lisansUrl" to bilgi.lisansUrl,
        "atvUrl" to bilgi.atvUrl,
        "videoId" to bilgi.videoId,
        "marketplaceId" to bilgi.marketplaceId,
        "altyazilar" to bilgi.altyazilar.map {
          mapOf("kod" to it.kod, "ad" to it.ad, "url" to it.url)
        }
      )
    }

    OnActivityEntersBackground {
      elci.post { AronPlayerView.hepsi().forEach { it.onArkaPlan() } }
    }

    OnActivityEntersForeground {
      elci.post { AronPlayerView.hepsi().forEach { it.onOnPlan() } }
    }

    OnDestroy {
      elci.post { AronPlayerView.hepsi().forEach { it.yokEt() } }
    }

    View(AronPlayerView::class) {
      Events("onDurum", "onIlerleme", "onHata", "onBoyut", "onDrm")

      Prop("kaynak") { view: AronPlayerView, json: String? -> view.yapilandir(json) }
      Prop("oranKipi") { view: AronPlayerView, kip: String? -> view.oranKipi(kip) }
      Prop("ses") { view: AronPlayerView, deger: Float? -> view.sesSeviyesi(deger ?: 1f) }
      Prop("hizi") { view: AronPlayerView, deger: Float? -> view.hiz(deger ?: 1f) }

      AsyncFunction("yukle") { view: AronPlayerView, json: String -> view.yapilandir(json) }
      AsyncFunction("oynat") { view: AronPlayerView -> view.oynat() }
      AsyncFunction("duraklat") { view: AronPlayerView -> view.duraklat() }
      AsyncFunction("ara") { view: AronPlayerView, ms: Double -> view.ara(ms.toLong()) }
      AsyncFunction("durdur") { view: AronPlayerView -> view.durdur() }
      AsyncFunction("birak") { view: AronPlayerView -> view.birak() }
      AsyncFunction("sesSeviyesi") { view: AronPlayerView, deger: Double -> view.sesSeviyesi(deger.toFloat()) }
      AsyncFunction("hiz") { view: AronPlayerView, deger: Double -> view.hiz(deger.toFloat()) }
      AsyncFunction("konum") { view: AronPlayerView -> view.konumBilgisi() }
      AsyncFunction("izler") { view: AronPlayerView -> view.izler() }
      AsyncFunction("sesDiliSec") { view: AronPlayerView, kod: String -> view.sesDiliSec(kod) }
      AsyncFunction("altyaziSec") { view: AronPlayerView, kod: String? -> view.altyaziSec(kod) }
      AsyncFunction("kaliteSec") { view: AronPlayerView, yukseklik: Int -> view.kaliteSec(yukseklik) }

      OnViewDestroys { view: AronPlayerView -> view.yokEt() }
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
