package expo.modules.aronplayer

import android.content.Context
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.SurfaceView
import android.view.ViewGroup
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackException
import androidx.media3.common.Player
import androidx.media3.common.VideoSize
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.exoplayer.DefaultLoadControl
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.analytics.AnalyticsListener
import androidx.media3.exoplayer.drm.DefaultDrmSessionManager
import androidx.media3.exoplayer.drm.DrmSessionManager
import androidx.media3.exoplayer.drm.DrmSessionManagerProvider
import androidx.media3.exoplayer.drm.FrameworkMediaDrm
import androidx.media3.exoplayer.drm.HttpMediaDrmCallback
import androidx.media3.exoplayer.drm.MediaDrmCallback
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSource
import androidx.media3.ui.AspectRatioFrameLayout
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.lang.ref.WeakReference

private const val ILERLEME_ARALIK = 500L
private const val OYNATICI_AJANI = "AronPlayer/1.0 (Linux; Android)"

@androidx.annotation.OptIn(UnstableApi::class)
class AronPlayerView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onDurum by EventDispatcher()
  private val onIlerleme by EventDispatcher()
  private val onHata by EventDispatcher()
  private val onBoyut by EventDispatcher()
  private val onDrm by EventDispatcher()

  private val cerceve = AspectRatioFrameLayout(context)
  private val yuzey = SurfaceView(context)

  private var oynatici: ExoPlayer? = null
  private var yapilandirma: OynatimYapilandirma? = null
  private var sonKimlik: String? = null
  private var sonDurum: String = "bos"
  private var netflixYonetici: NetflixMslYonetici? = null
  private var yokEdildi = false
  private var arkaPlandaydi = false
  private var arkaPlanOncesiOynuyordu = false
  private var yuzeyBagli = false

  private val elci = Handler(Looper.getMainLooper())
  private val ilerlemeIsi = object : Runnable {
    override fun run() {
      ilerlemeYayinla()
      if (!yokEdildi) elci.postDelayed(this, ILERLEME_ARALIK)
    }
  }

  override val shouldUseAndroidLayout: Boolean = true

  init {
    setBackgroundColor(Color.BLACK)
    gravity = Gravity.CENTER
    cerceve.setResizeMode(AspectRatioFrameLayout.RESIZE_MODE_FIT)
    cerceve.setBackgroundColor(Color.BLACK)
    yuzey.layoutParams = ViewGroup.LayoutParams(
      ViewGroup.LayoutParams.MATCH_PARENT,
      ViewGroup.LayoutParams.MATCH_PARENT
    )
    cerceve.addView(yuzey)
    addView(
      cerceve,
      ViewGroup.LayoutParams(
        ViewGroup.LayoutParams.MATCH_PARENT,
        ViewGroup.LayoutParams.MATCH_PARENT
      )
    )
    kayitAc(this)
  }

  private val dinleyici = object : Player.Listener {
    override fun onPlaybackStateChanged(durum: Int) {
      when (durum) {
        Player.STATE_IDLE -> durumYayinla("bos")
        Player.STATE_BUFFERING -> durumYayinla("arabellek")
        Player.STATE_READY -> durumYayinla(if (oynatici?.isPlaying == true) "oynuyor" else "hazir")
        Player.STATE_ENDED -> {
          durumYayinla("bitti")
          ilerlemeDurdur()
        }
      }
    }

    override fun onIsPlayingChanged(oynuyor: Boolean) {
      if (oynuyor) {
        durumYayinla("oynuyor")
        ilerlemeBaslat()
      } else {
        if (oynatici?.playbackState == Player.STATE_READY) durumYayinla("durakladi")
        ilerlemeDurdur()
        ilerlemeYayinla()
      }
    }

    override fun onVideoSizeChanged(boyut: VideoSize) {
      if (boyut.width == 0 || boyut.height == 0) return
      val oran = boyut.width * boyut.pixelWidthHeightRatio / boyut.height
      cerceve.setAspectRatio(oran)
      onBoyut(
        mapOf(
          "genislik" to boyut.width,
          "yukseklik" to boyut.height,
          "oran" to oran.toDouble()
        )
      )
    }

    override fun onPlayerError(hata: PlaybackException) {
      val kod = hata.errorCode
      val drmHatasi = kod in PlaybackException.ERROR_CODE_DRM_UNSPECIFIED..PlaybackException.ERROR_CODE_DRM_LICENSE_EXPIRED
      durumYayinla("hata")
      ilerlemeDurdur()
      onHata(
        mapOf(
          "kod" to kod,
          "kodAdi" to hata.errorCodeName,
          "mesaj" to (hata.message ?: hata.errorCodeName),
          "drm" to drmHatasi,
          "sebep" to (hata.cause?.javaClass?.simpleName ?: "-")
        )
      )
    }
  }

  private val cozumleyici = object : AnalyticsListener {
    override fun onDrmSessionAcquired(olayAni: AnalyticsListener.EventTime, durum: Int) {
      drmYayinla("oturumAlindi", "durum=$durum")
    }

    override fun onDrmKeysLoaded(olayAni: AnalyticsListener.EventTime) {
      drmYayinla("anahtarYuklendi", null)
    }

    override fun onDrmKeysRestored(olayAni: AnalyticsListener.EventTime) {
      drmYayinla("anahtarGeriYuklendi", null)
    }

    override fun onDrmKeysRemoved(olayAni: AnalyticsListener.EventTime) {
      drmYayinla("anahtarSilindi", null)
    }

    override fun onDrmSessionReleased(olayAni: AnalyticsListener.EventTime) {
      drmYayinla("oturumBirakildi", null)
    }

    override fun onDrmSessionManagerError(olayAni: AnalyticsListener.EventTime, hata: Exception) {
      drmYayinla("hata", hata.javaClass.simpleName + ": " + (hata.message ?: "-"))
    }
  }

  fun yapilandir(json: String?) = anaIplikte {
    if (yokEdildi) return@anaIplikte
    val yeni = OynatimYapilandirma.coz(json) ?: return@anaIplikte
    if (yeni.kimlik == sonKimlik && oynatici != null) {
      yapilandirma = yeni
      return@anaIplikte
    }
    yapilandirma = yeni
    sonKimlik = yeni.kimlik
    val exo = oynaticiVer()
    val kaynak = try {
      kaynakUret(yeni)
    } catch (e: Throwable) {
      durumYayinla("hata")
      onHata(
        mapOf(
          "kod" to -1,
          "kodAdi" to "KAYNAK_KURULAMADI",
          "mesaj" to (e.message ?: e.javaClass.simpleName),
          "drm" to (yeni.drm != null),
          "sebep" to e.javaClass.simpleName
        )
      )
      return@anaIplikte
    }
    durumYayinla("hazirlaniyor")
    if (yeni.baslangicMs > 0L) {
      exo.setMediaSource(kaynak, yeni.baslangicMs)
    } else {
      exo.setMediaSource(kaynak)
    }
    exo.playWhenReady = yeni.otomatikBasla && !arkaPlandaydi
    exo.prepare()
  }

  fun oynat() = anaIplikte {
    oynatici?.let {
      it.playWhenReady = true
      if (it.playbackState == Player.STATE_IDLE) it.prepare()
    }
  }

  fun duraklat() = anaIplikte {
    oynatici?.playWhenReady = false
  }

  fun ara(ms: Long) = anaIplikte {
    oynatici?.seekTo(ms.coerceAtLeast(0L))
    ilerlemeYayinla()
  }

  fun durdur() = anaIplikte {
    oynatici?.stop()
    ilerlemeDurdur()
    durumYayinla("bos")
  }

  fun sesSeviyesi(deger: Float) = anaIplikte {
    oynatici?.volume = deger.coerceIn(0f, 1f)
  }

  fun hiz(deger: Float) = anaIplikte {
    oynatici?.setPlaybackSpeed(deger.coerceIn(0.25f, 4f))
  }

  fun oranKipi(kip: String?) = anaIplikte {
    cerceve.setResizeMode(
      when (kip) {
        "doldur" -> AspectRatioFrameLayout.RESIZE_MODE_FILL
        "yakinlastir" -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
        "genislik" -> AspectRatioFrameLayout.RESIZE_MODE_FIXED_WIDTH
        "yukseklik" -> AspectRatioFrameLayout.RESIZE_MODE_FIXED_HEIGHT
        else -> AspectRatioFrameLayout.RESIZE_MODE_FIT
      }
    )
  }

  fun konumBilgisi(): Map<String, Any> {
    val p = oynatici
    val sure = p?.duration ?: C.TIME_UNSET
    return mapOf(
      "konumMs" to (p?.currentPosition ?: 0L).toDouble(),
      "sureMs" to (if (sure == C.TIME_UNSET) 0L else sure).toDouble(),
      "tamponMs" to (p?.bufferedPosition ?: 0L).toDouble(),
      "oynuyor" to (p?.isPlaying ?: false),
      "durum" to sonDurum
    )
  }

  fun onArkaPlan() = anaIplikte {
    if (arkaPlandaydi) return@anaIplikte
    arkaPlandaydi = true
    val p = oynatici ?: return@anaIplikte
    if (yapilandirma?.arkaPlandaDevam == true) return@anaIplikte
    arkaPlanOncesiOynuyordu = p.playWhenReady
    p.playWhenReady = false
    ilerlemeDurdur()
    yuzeyiCoz()
  }

  fun onOnPlan() = anaIplikte {
    if (!arkaPlandaydi) return@anaIplikte
    arkaPlandaydi = false
    val p = oynatici ?: return@anaIplikte
    if (yapilandirma?.arkaPlandaDevam == true) return@anaIplikte
    yuzeyiBagla()
    if (arkaPlanOncesiOynuyordu) p.playWhenReady = true
    arkaPlanOncesiOynuyordu = false
  }

  fun birak() = anaIplikte {
    ilerlemeDurdur()
    val p = oynatici
    oynatici = null
    sonKimlik = null
    yuzeyBagli = false
    try {
      p?.removeListener(dinleyici)
      p?.removeAnalyticsListener(cozumleyici)
      p?.stop()
      p?.clearVideoSurface()
      p?.release()
    } catch (e: Throwable) {
    }
    durumYayinla("bos")
  }

  fun yokEt() = anaIplikte {
    if (yokEdildi) return@anaIplikte
    yokEdildi = true
    kayitSil(this)
    birak()
    elci.removeCallbacksAndMessages(null)
    try {
      cerceve.removeAllViews()
      removeAllViews()
    } catch (e: Throwable) {
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    if (!yokEdildi && yapilandirma?.arkaPlandaDevam != true) duraklat()
  }

  private fun oynaticiVer(): ExoPlayer {
    oynatici?.let { return it }
    val yukleme = DefaultLoadControl.Builder()
      .setBufferDurationsMs(
        DefaultLoadControl.DEFAULT_MIN_BUFFER_MS,
        DefaultLoadControl.DEFAULT_MAX_BUFFER_MS,
        DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_MS,
        DefaultLoadControl.DEFAULT_BUFFER_FOR_PLAYBACK_AFTER_REBUFFER_MS
      )
      .build()
    val exo = ExoPlayer.Builder(context)
      .setLoadControl(yukleme)
      .setSeekBackIncrementMs(10_000L)
      .setSeekForwardIncrementMs(10_000L)
      .build()
    exo.setAudioAttributes(
      AudioAttributes.Builder()
        .setUsage(C.USAGE_MEDIA)
        .setContentType(C.AUDIO_CONTENT_TYPE_MOVIE)
        .build(),
      true
    )
    exo.setWakeMode(C.WAKE_MODE_NETWORK)
    exo.addListener(dinleyici)
    exo.addAnalyticsListener(cozumleyici)
    oynatici = exo
    yuzeyiBagla()
    return exo
  }

  private fun anaIplikte(is1: () -> Unit) {
    if (Looper.myLooper() == Looper.getMainLooper()) is1() else elci.post(is1)
  }

  private fun yuzeyiBagla() {
    val p = oynatici ?: return
    if (yuzeyBagli) return
    p.setVideoSurfaceView(yuzey)
    yuzeyBagli = true
  }

  private fun yuzeyiCoz() {
    val p = oynatici ?: return
    if (!yuzeyBagli) return
    p.clearVideoSurface()
    yuzeyBagli = false
  }

  private fun kaynakUret(y: OynatimYapilandirma): MediaSource {
    val http = DefaultHttpDataSource.Factory()
      .setUserAgent(OYNATICI_AJANI)
      .setAllowCrossProtocolRedirects(true)
      .setConnectTimeoutMs(15_000)
      .setReadTimeoutMs(15_000)
    if (y.basliklar.isNotEmpty()) http.setDefaultRequestProperties(y.basliklar)

    var manifestUri = y.manifestUrl
    var drmAyari = y.drm

    if (drmAyari?.netflixMsl == true && drmAyari.netflixVideoId.isNotEmpty()) {
      val yonetici = NetflixMslYonetici(context)
      yonetici.baslat(drmAyari.netflixId, drmAyari.netflixSecureId, "tr")
      yonetici.anahtarDegisimi()
      val manifestJson = yonetici.manifestAl(drmAyari.netflixVideoId)
      manifestUri = yonetici.mpdOlustur(manifestJson)
      if (drmAyari.cdmProxyUrl.isNotEmpty()) {
        yonetici.lisansAlVeAnahtarCikar(drmAyari.cdmProxyUrl)
      }
      netflixYonetici = yonetici
    }

    val veri: DataSource.Factory = DefaultDataSource.Factory(context, http)
    val parca = MediaItem.Builder().setUri(manifestUri)
    y.mimeTuru?.let { parca.setMimeType(it) }

    val uretici = DefaultMediaSourceFactory(veri)
    val d = drmAyari
    if (d != null) {
      val yonetici = drmYoneticisi(d)
      uretici.setDrmSessionManagerProvider(object : DrmSessionManagerProvider {
        override fun get(parcaOgesi: MediaItem): DrmSessionManager = yonetici
      })
    }
    return uretici.createMediaSource(parca.build())
  }

  private fun drmYoneticisi(d: DrmAyari): DrmSessionManager {
    if (d.netflixMsl && netflixYonetici != null) {
      val nfGeriCagri = netflixYonetici!!.drmGeriCagri
        ?: throw IllegalStateException("Netflix DRM geri cagrisi hazir degil")
      return DefaultDrmSessionManager.Builder()
        .setUuidAndExoMediaDrmProvider(C.CLEARKEY_UUID, FrameworkMediaDrm.DEFAULT_PROVIDER)
        .setMultiSession(false)
        .setPlayClearSamplesWithoutKeys(true)
        .build(nfGeriCagri)
    }

    if (d.primeAmazon) {
      val yonetici = PrimeApiYonetici(context)
      val marketplace = d.primeMarketplaceId.ifEmpty { PrimeApiYonetici.VARSAYILAN_MARKETPLACE }
      val bilgi = PrimeOynatimBilgisi(
        manifestUrl = "",
        lisansUrl = d.lisansUrl,
        atvUrl = d.lisansUrl.substringBefore("/cdp/"),
        cerezler = d.primeCerezler,
        videoId = d.primeVideoId,
        marketplaceId = marketplace
      )
      val primeGeriCagri = PrimeDrmGeriCagri(yonetici, bilgi)
      return DefaultDrmSessionManager.Builder()
        .setUuidAndExoMediaDrmProvider(C.WIDEVINE_UUID, FrameworkMediaDrm.DEFAULT_PROVIDER)
        .setMultiSession(d.cokluOturum)
        .setPlayClearSamplesWithoutKeys(d.anahtarsizOynat)
        .build(primeGeriCagri)
    }

    if (d.sema != "widevine") {
      throw IllegalArgumentException("desteklenmeyen DRM semasi: " + d.sema)
    }
    if (!FrameworkMediaDrm.isCryptoSchemeSupported(C.WIDEVINE_UUID)) {
      throw IllegalStateException("cihazda Widevine yok")
    }
    val lisansAgi = DefaultHttpDataSource.Factory()
      .setUserAgent(OYNATICI_AJANI)
      .setAllowCrossProtocolRedirects(true)
      .setConnectTimeoutMs(15_000)
      .setReadTimeoutMs(15_000)
    val geriCagri = HttpMediaDrmCallback(d.lisansUrl, false, lisansAgi)
    for ((ad, deger) in d.basliklar) geriCagri.setKeyRequestProperty(ad, deger)
    return DefaultDrmSessionManager.Builder()
      .setUuidAndExoMediaDrmProvider(C.WIDEVINE_UUID, FrameworkMediaDrm.DEFAULT_PROVIDER)
      .setMultiSession(d.cokluOturum)
      .setPlayClearSamplesWithoutKeys(d.anahtarsizOynat)
      .build(geriCagri)
  }

  private fun durumYayinla(durum: String) {
    if (yokEdildi) return
    if (durum == sonDurum) return
    sonDurum = durum
    val p = oynatici
    val sure = p?.duration ?: C.TIME_UNSET
    onDurum(
      mapOf(
        "durum" to durum,
        "oynuyor" to (p?.isPlaying ?: false),
        "konumMs" to (p?.currentPosition ?: 0L).toDouble(),
        "sureMs" to (if (sure == C.TIME_UNSET) 0L else sure).toDouble(),
        "canliYayin" to (p?.isCurrentMediaItemLive ?: false)
      )
    )
  }

  private fun drmYayinla(olay: String, mesaj: String?) {
    if (yokEdildi) return
    onDrm(mapOf("olay" to olay, "mesaj" to (mesaj ?: "")))
  }

  private fun ilerlemeBaslat() {
    elci.removeCallbacks(ilerlemeIsi)
    if (yokEdildi) return
    elci.postDelayed(ilerlemeIsi, ILERLEME_ARALIK)
  }

  private fun ilerlemeDurdur() {
    elci.removeCallbacks(ilerlemeIsi)
  }

  private fun ilerlemeYayinla() {
    if (yokEdildi) return
    val p = oynatici ?: return
    val hamSure = p.duration
    val sure = if (hamSure == C.TIME_UNSET) 0L else hamSure
    val konum = p.currentPosition
    onIlerleme(
      mapOf(
        "konumMs" to konum.toDouble(),
        "sureMs" to sure.toDouble(),
        "tamponMs" to p.bufferedPosition.toDouble(),
        "yuzde" to (if (sure > 0L) (konum.toDouble() / sure.toDouble()) else 0.0)
      )
    )
  }

  companion object {
    private val canlilar = mutableListOf<WeakReference<AronPlayerView>>()

    private fun kayitAc(view: AronPlayerView) {
      synchronized(canlilar) {
        canlilar.removeAll { it.get() == null }
        canlilar.add(WeakReference(view))
      }
    }

    private fun kayitSil(view: AronPlayerView) {
      synchronized(canlilar) {
        canlilar.removeAll { it.get() == null || it.get() === view }
      }
    }

    fun hepsi(): List<AronPlayerView> {
      synchronized(canlilar) {
        return canlilar.mapNotNull { it.get() }
      }
    }
  }
}
