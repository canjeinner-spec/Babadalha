package expo.modules.aronwebview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Color
import android.net.Uri
import android.net.http.SslError
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Message
import android.view.View
import android.view.ViewGroup
import android.webkit.ConsoleMessage
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.HttpAuthHandler
import android.webkit.JavascriptInterface
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebStorage
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import androidx.webkit.JavaScriptReplyProxy
import androidx.webkit.ScriptHandler
import androidx.webkit.UserAgentMetadata
import androidx.webkit.WebMessageCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import java.io.ByteArrayInputStream
import java.util.regex.Pattern

private const val KOPRU_ADI = "AronNative"
private const val CEREZ_ARALIK = 8000L

@SuppressLint("SetJavaScriptEnabled")
class AronWebView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  private val onMessage by EventDispatcher()
  private val onLoadStart by EventDispatcher()
  private val onLoadEnd by EventDispatcher()
  private val onError by EventDispatcher()
  private val onHttpError by EventDispatcher()
  private val onIlerleme by EventDispatcher()
  private val onKonsol by EventDispatcher()
  private val onAg by EventDispatcher()
  private val onIzin by EventDispatcher()
  private val onTamEkran by EventDispatcher()
  private val onBaslik by EventDispatcher()
  private val onPencere by EventDispatcher()
  private val onCokme by EventDispatcher()
  private val onIndirme by EventDispatcher()
  private val onSslHatasi by EventDispatcher()
  private val onKimlik by EventDispatcher()
  private val onCevap by EventDispatcher()
  private val onGorunur by EventDispatcher()
  private val onDosyaSecim by EventDispatcher()

  private var web: WebView? = WebView(context)
  private var yokEdildi = false

  private var tamEkranKatman: View? = null
  private var tamEkranGeri: WebChromeClient.CustomViewCallback? = null
  private var acilirWeb: WebView? = null

  private var kaynak: String? = null
  private var basliklar: MutableMap<String, String> = mutableMapOf()
  private var betikTutamak: ScriptHandler? = null
  private var eklenenBetik: String? = null
  private var cevapVekili: JavaScriptReplyProxy? = null

  var betikOnce: String? = null
    set(deger) {
      field = deger
      belgeBetiginiTazele()
    }
  var betikSonra: String? = null

  private var sonEnjekteNo = 0
  private var sonYenileNo = 0
  private var sonGeriNo = 0
  private var sonIleriNo = 0
  private var sonDurdurNo = 0
  private var sonTemizleNo = 0
  private var sonSorNo = 0
  private var sonMesajNo = 0
  private var duraklatildi = false

  @Volatile private var engelDesenleri: List<Pattern> = emptyList()
  @Volatile private var agDesenleri: List<Pattern> = emptyList()
  @Volatile private var agSayaci = 0
  @Volatile private var agSiniri = 300
  private var hariciDesenler: List<Pattern> = emptyList()
  private var izinler: Set<String> = setOf(
    PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID,
    PermissionRequest.RESOURCE_AUDIO_CAPTURE
  )
  private var konsolAktar = false
  private var tamEkranIzin = true
  private var sslGecersizGec = false
  private var konumIzin = false
  private var acilirPencereIzin = true

  private val cerezEli = Handler(Looper.getMainLooper())
  private var cerezIsi: Runnable? = null

  init {
    val w = web!!
    addView(w, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
    varsayilanAyarlar(w)
    w.webViewClient = istemci()
    w.webChromeClient = kabuk()
    kopruKur(w)
    cerezSaatiKur()
    w.setDownloadListener { url, ua, icerik, tur, boyut ->
      guvenliPost {
        onIndirme(mapOf(
          "url" to url.take(400),
          "ajan" to (ua ?: ""),
          "icerik" to (icerik ?: ""),
          "tur" to (tur ?: ""),
          "boyut" to boyut
        ))
      }
    }
  }

  private fun cerezleriKaydet() {
    try { CookieManager.getInstance().flush() } catch (e: Throwable) {}
  }

  private fun cerezSaatiniDurdur() {
    cerezIsi?.let { cerezEli.removeCallbacks(it) }
    cerezIsi = null
  }

  private fun cerezSaatiKur() {
    cerezSaatiniDurdur()
    if (yokEdildi) return
    val isi = object : Runnable {
      override fun run() {
        if (yokEdildi) return
        cerezleriKaydet()
        cerezEli.postDelayed(this, CEREZ_ARALIK)
      }
    }
    cerezIsi = isi
    cerezEli.postDelayed(isi, CEREZ_ARALIK)
  }

  override fun onDetachedFromWindow() {
    cerezleriKaydet()
    super.onDetachedFromWindow()
  }

  override fun onWindowVisibilityChanged(gorunurluk: Int) {
    if (gorunurluk != View.VISIBLE) cerezleriKaydet()
    super.onWindowVisibilityChanged(gorunurluk)
  }

  private fun guvenliPost(isi: () -> Unit) {
    if (yokEdildi) return
    post { if (!yokEdildi) isi() }
  }

  private inline fun webIle(crossinline isi: (WebView) -> Unit) {
    if (yokEdildi) return
    post {
      val w = web
      if (!yokEdildi && w != null) {
        try { isi(w) } catch (e: Throwable) {}
      }
    }
  }

  private fun varsayilanAyarlar(w: WebView) {
    val s = w.settings
    s.javaScriptEnabled = true
    s.domStorageEnabled = true
    s.databaseEnabled = true
    s.mediaPlaybackRequiresUserGesture = false
    s.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
    s.loadWithOverviewMode = true
    s.useWideViewPort = true
    s.builtInZoomControls = true
    s.displayZoomControls = false
    s.setSupportZoom(true)
    s.javaScriptCanOpenWindowsAutomatically = true
    s.setSupportMultipleWindows(true)
    s.cacheMode = WebSettings.LOAD_DEFAULT
    s.allowFileAccess = false
    s.allowContentAccess = false
    val cm = CookieManager.getInstance()
    cm.setAcceptCookie(true)
    cm.setAcceptThirdPartyCookies(w, true)
    w.setBackgroundColor(Color.BLACK)
  }

  private fun kopruKur(w: WebView) {
    if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
      try {
        WebViewCompat.addWebMessageListener(
          w, KOPRU_ADI, setOf("*")
        ) { _, mesaj: WebMessageCompat, kaynakAdres: Uri, anaCerceve: Boolean, vekil: JavaScriptReplyProxy ->
          if (anaCerceve) cevapVekili = vekil
          val veri = mesaj.data ?: return@addWebMessageListener
          guvenliPost {
            onMessage(mapOf(
              "data" to veri,
              "kaynak" to kaynakAdres.toString().take(120),
              "anaCerceve" to anaCerceve
            ))
          }
        }
        return
      } catch (e: Throwable) {
      }
    }
    w.addJavascriptInterface(EskiKopru(), KOPRU_ADI)
  }

  private inner class EskiKopru {
    @JavascriptInterface
    fun postMessage(mesaj: String) {
      guvenliPost { onMessage(mapOf("data" to mesaj, "kaynak" to "", "anaCerceve" to true)) }
    }
  }

  private fun belgeBetiginiTazele() {
    val w = web ?: return
    if (yokEdildi) return
    val js = betikOnce
    if (js == eklenenBetik) return
    if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) return
    try {
      betikTutamak?.remove()
    } catch (e: Throwable) {
    }
    betikTutamak = null
    eklenenBetik = js
    if (js.isNullOrEmpty()) return
    try {
      betikTutamak = WebViewCompat.addDocumentStartJavaScript(w, js, setOf("*"))
    } catch (e: Throwable) {
    }
  }

  private fun eslesir(desenler: List<Pattern>, url: String): Boolean {
    for (d in desenler) {
      try {
        if (d.matcher(url).find()) return true
      } catch (e: Throwable) {
      }
    }
    return false
  }

  private fun istemci() = object : WebViewClient() {
    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
      agSayaci = 0
      guvenliPost { onLoadStart(mapOf("url" to (url ?: ""))) }
      if (!WebViewFeature.isFeatureSupported(WebViewFeature.DOCUMENT_START_SCRIPT)) {
        betikOnce?.let { view?.evaluateJavascript(it, null) }
      }
    }

    override fun onPageCommitVisible(view: WebView?, url: String?) {
      guvenliPost { onGorunur(mapOf("url" to (url ?: ""))) }
    }

    override fun onPageFinished(view: WebView?, url: String?) {
      betikSonra?.let { js -> try { view?.evaluateJavascript(js, null) } catch (e: Throwable) {} }
      cerezleriKaydet()
      guvenliPost { onLoadEnd(mapOf("url" to (url ?: ""))) }
    }

    override fun doUpdateVisitedHistory(view: WebView?, url: String?, yenidenYukleme: Boolean) {
      cerezleriKaydet()
      super.doUpdateVisitedHistory(view, url, yenidenYukleme)
    }

    override fun onRenderProcessGone(view: WebView?, detail: RenderProcessGoneDetail?): Boolean {
      val coktu = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) detail?.didCrash() == true else false
      val aciklama = if (coktu) "WebView render süreci çöktü" else "Sistem WebView sürecini sonlandırdı"
      val adres = kaynak ?: ""
      yokEt()
      post { onCokme(mapOf("coktu" to coktu, "aciklama" to aciklama, "url" to adres)) }
      return true
    }

    override fun onReceivedError(view: WebView?, request: WebResourceRequest?, error: WebResourceError?) {
      if (request?.isForMainFrame != true) return
      val u = request.url?.toString() ?: ""
      val a = error?.description?.toString() ?: "yükleme hatası"
      val k = error?.errorCode ?: 0
      guvenliPost { onError(mapOf("url" to u, "aciklama" to a, "kod" to k)) }
    }

    override fun onReceivedHttpError(view: WebView?, request: WebResourceRequest?, response: WebResourceResponse?) {
      if (request?.isForMainFrame != true) return
      val u = request.url?.toString() ?: ""
      val d = response?.statusCode ?: 0
      guvenliPost { onHttpError(mapOf("url" to u, "durum" to d)) }
    }

    override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
      val u = error?.url ?: ""
      val k = error?.primaryError ?: -1
      val gec = sslGecersizGec
      guvenliPost { onSslHatasi(mapOf("url" to u, "kod" to k, "gecildi" to gec)) }
      if (gec) handler?.proceed() else handler?.cancel()
    }

    override fun onReceivedHttpAuthRequest(view: WebView?, handler: HttpAuthHandler?, host: String?, realm: String?) {
      val h = host ?: ""
      val r = realm ?: ""
      guvenliPost { onKimlik(mapOf("host" to h, "alan" to r)) }
      handler?.cancel()
    }

    override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
      val url = request?.url?.toString() ?: return false
      if (hariciDesenler.isNotEmpty() && eslesir(hariciDesenler, url)) {
        guvenliPost { onPencere(mapOf("url" to url, "tur" to "harici")) }
        return true
      }
      return false
    }

    override fun shouldInterceptRequest(view: WebView?, request: WebResourceRequest?): WebResourceResponse? {
      val url = request?.url?.toString() ?: return null
      if (agDesenleri.isNotEmpty() && agSayaci < agSiniri && eslesir(agDesenleri, url)) {
        agSayaci++
        val yontem = request.method ?: "GET"
        val ana = request.isForMainFrame
        guvenliPost { onAg(mapOf("url" to url.take(400), "yontem" to yontem, "anaCerceve" to ana)) }
      }
      if (engelDesenleri.isNotEmpty() && eslesir(engelDesenleri, url)) {
        return WebResourceResponse("text/plain", "utf-8", ByteArrayInputStream(ByteArray(0)))
      }
      return null
    }
  }

  private fun kabuk() = object : WebChromeClient() {
    override fun onPermissionRequest(request: PermissionRequest?) {
      request ?: return
      val istenen = request.resources.toList()
      guvenliPost { onIzin(mapOf("kaynaklar" to istenen.joinToString(","))) }
      try {
        val onaylanan = istenen.filter { izinler.contains(it) }.toTypedArray()
        if (onaylanan.isNotEmpty()) {
          request.grant(onaylanan)
        } else {
          request.deny()
        }
      } catch (e: Throwable) {
        try { request.deny() } catch (ignored: Throwable) {}
      }
    }

    override fun onProgressChanged(view: WebView?, newProgress: Int) {
      guvenliPost { onIlerleme(mapOf("yuzde" to newProgress)) }
    }

    override fun onReceivedTitle(view: WebView?, title: String?) {
      val b = title ?: ""
      guvenliPost { onBaslik(mapOf("baslik" to b)) }
    }

    override fun onConsoleMessage(consoleMessage: ConsoleMessage?): Boolean {
      if (!konsolAktar || consoleMessage == null) return false
      val sev = consoleMessage.messageLevel().name
      val met = consoleMessage.message().take(500)
      val sat = consoleMessage.lineNumber()
      guvenliPost { onKonsol(mapOf("seviye" to sev, "metin" to met, "satir" to sat)) }
      return false
    }

    override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: Message?): Boolean {
      if (yokEdildi || !acilirPencereIzin || resultMsg == null) return false
      kapatAcilir()
      val ana = web ?: return false
      val yeni = WebView(context)
      yeni.settings.javaScriptEnabled = true
      yeni.settings.domStorageEnabled = true
      yeni.settings.userAgentString = ana.settings.userAgentString
      yeni.settings.javaScriptCanOpenWindowsAutomatically = true
      yeni.settings.setSupportMultipleWindows(true)
      CookieManager.getInstance().setAcceptThirdPartyCookies(yeni, true)
      yeni.webViewClient = object : WebViewClient() {
        override fun onPageStarted(v: WebView?, url: String?, favicon: Bitmap?) {
          val u = url ?: ""
          guvenliPost { onPencere(mapOf("url" to u, "tur" to "acilir-gezinti")) }
        }
      }
      yeni.webChromeClient = object : WebChromeClient() {
        override fun onCloseWindow(window: WebView?) {
          kapatAcilir()
        }
      }
      acilirWeb = yeni
      addView(yeni, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
      val aktarma = resultMsg.obj as? WebView.WebViewTransport ?: return false
      aktarma.webView = yeni
      resultMsg.sendToTarget()
      guvenliPost { onPencere(mapOf("url" to "", "tur" to "acildi")) }
      return true
    }

    override fun onCloseWindow(window: WebView?) {
      kapatAcilir()
    }

    override fun onGeolocationPermissionsShowPrompt(origin: String?, callback: GeolocationPermissions.Callback?) {
      callback?.invoke(origin, konumIzin, false)
    }

    override fun onShowFileChooser(
      webView: WebView?,
      filePathCallback: ValueCallback<Array<Uri>>?,
      fileChooserParams: FileChooserParams?
    ): Boolean {
      val tur = fileChooserParams?.acceptTypes?.joinToString(",") ?: ""
      guvenliPost { onDosyaSecim(mapOf("tur" to tur)) }
      filePathCallback?.onReceiveValue(null)
      return true
    }

    override fun onShowCustomView(view: View?, callback: CustomViewCallback?) {
      if (yokEdildi || !tamEkranIzin || view == null) {
        callback?.onCustomViewHidden()
        return
      }
      tamEkranKatman?.let { removeView(it) }
      tamEkranKatman = view
      tamEkranGeri = callback
      web?.visibility = View.GONE
      addView(view, FrameLayout.LayoutParams(FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT))
      guvenliPost { onTamEkran(mapOf("acik" to true)) }
    }

    override fun onHideCustomView() {
      tamEkranKatman?.let {
        removeView(it)
        (it.parent as? ViewGroup)?.removeView(it)
      }
      tamEkranKatman = null
      web?.visibility = View.VISIBLE
      try {
        tamEkranGeri?.onCustomViewHidden()
      } catch (e: Throwable) {
      }
      tamEkranGeri = null
      guvenliPost { onTamEkran(mapOf("acik" to false)) }
    }
  }

  private fun kapatAcilir() {
    val a = acilirWeb ?: return
    acilirWeb = null
    try {
      removeView(a)
      a.webChromeClient = null
      a.destroy()
    } catch (e: Throwable) {
    }
    guvenliPost { onPencere(mapOf("url" to "", "tur" to "kapandi")) }
  }

  private fun desenListesi(json: String?): List<Pattern> {
    json ?: return emptyList()
    return try {
      val dizi = org.json.JSONArray(json)
      val cikti = mutableListOf<Pattern>()
      for (i in 0 until dizi.length()) {
        val d = dizi.optString(i, "")
        if (d.isEmpty()) continue
        try {
          cikti.add(Pattern.compile(d, Pattern.CASE_INSENSITIVE))
        } catch (e: Throwable) {
        }
      }
      cikti
    } catch (e: Throwable) {
      emptyList()
    }
  }

  fun engelDesenleriAyarla(json: String?) { engelDesenleri = desenListesi(json) }
  fun agDesenleriAyarla(json: String?) { agDesenleri = desenListesi(json); agSayaci = 0 }
  fun hariciDesenlerAyarla(json: String?) { hariciDesenler = desenListesi(json) }

  fun izinlerAyarla(json: String?) {
    if (json.isNullOrEmpty()) return
    try {
      val dizi = org.json.JSONArray(json)
      val yeni = mutableSetOf<String>()
      for (i in 0 until dizi.length()) {
        when (dizi.optString(i, "")) {
          "drm", "protectedMedia" -> yeni.add(PermissionRequest.RESOURCE_PROTECTED_MEDIA_ID)
          "ses", "audio" -> yeni.add(PermissionRequest.RESOURCE_AUDIO_CAPTURE)
          "kamera", "video" -> yeni.add(PermissionRequest.RESOURCE_VIDEO_CAPTURE)
          "midi" -> yeni.add(PermissionRequest.RESOURCE_MIDI_SYSEX)
        }
      }
      izinler = yeni
    } catch (e: Throwable) {
    }
  }

  fun basliklarAyarla(json: String?) {
    basliklar = mutableMapOf()
    json ?: return
    try {
      val o = org.json.JSONObject(json)
      o.keys().forEach { k -> basliklar[k] = o.optString(k, "") }
    } catch (e: Throwable) {
    }
  }

  fun ayarlariUygula(json: String?) {
    val w = web ?: return
    json ?: return
    val s = w.settings
    try {
      val o = org.json.JSONObject(json)
      if (o.has("javaScript")) s.javaScriptEnabled = o.optBoolean("javaScript", true)
      if (o.has("domDepo")) s.domStorageEnabled = o.optBoolean("domDepo", true)
      if (o.has("veritabani")) s.databaseEnabled = o.optBoolean("veritabani", true)
      if (o.has("medyaHareketGerek")) s.mediaPlaybackRequiresUserGesture = o.optBoolean("medyaHareketGerek", false)
      if (o.has("karisikIcerik")) s.mixedContentMode = o.optInt("karisikIcerik", WebSettings.MIXED_CONTENT_ALWAYS_ALLOW)
      if (o.has("onbellekKipi")) s.cacheMode = o.optInt("onbellekKipi", WebSettings.LOAD_DEFAULT)
      if (o.has("genisGorunum")) s.useWideViewPort = o.optBoolean("genisGorunum", true)
      if (o.has("genelBakis")) s.loadWithOverviewMode = o.optBoolean("genelBakis", true)
      if (o.has("yakinlastirma")) {
        val v = o.optBoolean("yakinlastirma", false)
        s.setSupportZoom(v)
        s.builtInZoomControls = v
        s.displayZoomControls = false
      }
      if (o.has("metinOlcegi")) s.textZoom = o.optInt("metinOlcegi", 100)
      if (o.has("dosyaErisim")) s.allowFileAccess = o.optBoolean("dosyaErisim", false)
      if (o.has("icerikErisim")) s.allowContentAccess = o.optBoolean("icerikErisim", false)
      if (o.has("pencereAcabilir")) s.javaScriptCanOpenWindowsAutomatically = o.optBoolean("pencereAcabilir", true)
      if (o.has("cokluPencere")) s.setSupportMultipleWindows(o.optBoolean("cokluPencere", true))
      if (o.has("gorselEngelle")) s.blockNetworkImage = o.optBoolean("gorselEngelle", false)
      if (o.has("agEngelle")) s.blockNetworkLoads = o.optBoolean("agEngelle", false)
      if (o.has("kodlama")) s.defaultTextEncodingName = o.optString("kodlama", "UTF-8")
      if (o.has("enKucukYazi")) s.minimumFontSize = o.optInt("enKucukYazi", 8)
      if (o.has("konum")) s.setGeolocationEnabled(o.optBoolean("konum", false))
      if (o.has("ekranDisiCizim")) s.offscreenPreRaster = o.optBoolean("ekranDisiCizim", false)
      if (o.has("guvenliGezinti")) s.safeBrowsingEnabled = o.optBoolean("guvenliGezinti", true)
      if (o.has("konsolAktar")) konsolAktar = o.optBoolean("konsolAktar", false)
      if (o.has("tamEkran")) tamEkranIzin = o.optBoolean("tamEkran", true)
      if (o.has("agSiniri")) agSiniri = o.optInt("agSiniri", 300)
      if (o.has("sslGecersizGec")) sslGecersizGec = o.optBoolean("sslGecersizGec", false)
      if (o.has("konumIzin")) konumIzin = o.optBoolean("konumIzin", false)
      if (o.has("acilirPencere")) acilirPencereIzin = o.optBoolean("acilirPencere", true)
      if (o.has("cerez")) CookieManager.getInstance().setAcceptCookie(o.optBoolean("cerez", true))
      if (o.has("ucuncuCerez")) CookieManager.getInstance().setAcceptThirdPartyCookies(w, o.optBoolean("ucuncuCerez", true))
      if (o.has("zemin")) {
        try { w.setBackgroundColor(Color.parseColor(o.optString("zemin", "#000000"))) } catch (e: Throwable) {}
      }
      if (o.has("karanlikIzin") && WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
        try { WebSettingsCompat.setAlgorithmicDarkeningAllowed(s, o.optBoolean("karanlikIzin", false)) } catch (e: Throwable) {}
      }
      if (o.has("istekBasligiGizle") && WebViewFeature.isFeatureSupported(WebViewFeature.REQUESTED_WITH_HEADER_ALLOW_LIST)) {
        try {
          val gizle = o.optBoolean("istekBasligiGizle", true)
          WebSettingsCompat.setRequestedWithHeaderOriginAllowList(s, if (gizle) emptySet() else setOf("*"))
        } catch (e: Throwable) {}
      }
      if (o.has("agIpuclari") && WebViewFeature.isFeatureSupported(WebViewFeature.USER_AGENT_METADATA)) {
        try { ipuclariUygula(s, o.optJSONObject("agIpuclari")) } catch (e: Throwable) {}
      }
      if (o.has("hataAyikla")) {
        try { WebView.setWebContentsDebuggingEnabled(o.optBoolean("hataAyikla", false)) } catch (e: Throwable) {}
      }
      if (o.has("katman")) {
        try { w.setLayerType(o.optInt("katman", View.LAYER_TYPE_HARDWARE), null) } catch (e: Throwable) {}
      }
    } catch (e: Throwable) {
    }
  }

  private fun ipuclariUygula(s: WebSettings, o: org.json.JSONObject?) {
    o ?: return
    val yapici = UserAgentMetadata.Builder()
    if (o.has("platform")) yapici.setPlatform(o.optString("platform", "Android"))
    if (o.has("platformSurum")) yapici.setPlatformVersion(o.optString("platformSurum", ""))
    if (o.has("mimari")) yapici.setArchitecture(o.optString("mimari", ""))
    if (o.has("model")) yapici.setModel(o.optString("model", ""))
    if (o.has("bit")) yapici.setBitness(o.optInt("bit", UserAgentMetadata.BITNESS_DEFAULT))
    if (o.has("mobil")) yapici.setMobile(o.optBoolean("mobil", false))
    if (o.has("tamSurum")) yapici.setFullVersion(o.optString("tamSurum", ""))
    if (o.has("wow64")) yapici.setWow64(o.optBoolean("wow64", false))
    val markalar = o.optJSONArray("markalar")
    if (markalar != null) {
      val liste = mutableListOf<UserAgentMetadata.BrandVersion>()
      for (i in 0 until markalar.length()) {
        val m = markalar.optJSONObject(i) ?: continue
        try {
          liste.add(
            UserAgentMetadata.BrandVersion.Builder()
              .setBrand(m.optString("marka", ""))
              .setMajorVersion(m.optString("anaSurum", ""))
              .setFullVersion(m.optString("tamSurum", ""))
              .build()
          )
        } catch (e: Throwable) {
        }
      }
      if (liste.isNotEmpty()) yapici.setBrandVersionList(liste)
    }
    WebSettingsCompat.setUserAgentMetadata(s, yapici.build())
  }

  fun kaynakYukle(url: String) {
    kaynak = url
    webIle { w ->
      belgeBetiginiTazele()
      if (basliklar.isEmpty()) w.loadUrl(url) else w.loadUrl(url, basliklar)
    }
  }

  fun ajanAyarla(ua: String?) {
    if (ua.isNullOrEmpty()) return
    web?.settings?.userAgentString = ua
  }

  fun enjekteIste(json: String?) {
    json ?: return
    try {
      val o = org.json.JSONObject(json)
      val n = o.optInt("n", 0)
      if (n <= sonEnjekteNo) return
      sonEnjekteNo = n
      val js = o.optString("js", "")
      if (js.isNotEmpty()) webIle { it.evaluateJavascript(js, null) }
    } catch (e: Throwable) {
    }
  }

  fun sorIste(json: String?) {
    json ?: return
    try {
      val o = org.json.JSONObject(json)
      val n = o.optInt("n", 0)
      if (n <= sonSorNo) return
      sonSorNo = n
      val kimlik = o.optString("id", "")
      val js = o.optString("js", "")
      if (js.isEmpty()) return
      webIle { w ->
        w.evaluateJavascript(js) { sonuc ->
          val s = (sonuc ?: "null").take(4000)
          guvenliPost { onCevap(mapOf("id" to kimlik, "sonuc" to s)) }
        }
      }
    } catch (e: Throwable) {
    }
  }

  fun sayfayaMesajIste(json: String?) {
    json ?: return
    try {
      val o = org.json.JSONObject(json)
      val n = o.optInt("n", 0)
      if (n <= sonMesajNo) return
      sonMesajNo = n
      val veri = o.optString("veri", "")
      val vekil = cevapVekili
      if (vekil != null) {
        try {
          vekil.postMessage(veri)
          return
        } catch (e: Throwable) {
        }
      }
      val kacisli = org.json.JSONObject.quote(veri)
      webIle { it.evaluateJavascript("(function(){try{window.dispatchEvent(new MessageEvent('aron-mesaj',{data:$kacisli}));}catch(e){}})();", null) }
    } catch (e: Throwable) {
    }
  }

  fun yenileIste(n: Int) {
    if (n <= sonYenileNo) return
    sonYenileNo = n
    webIle { it.reload() }
  }

  fun geriIste(n: Int) {
    if (n <= sonGeriNo) return
    sonGeriNo = n
    webIle { if (it.canGoBack()) it.goBack() }
  }

  fun ileriIste(n: Int) {
    if (n <= sonIleriNo) return
    sonIleriNo = n
    webIle { if (it.canGoForward()) it.goForward() }
  }

  fun durdurIste(n: Int) {
    if (n <= sonDurdurNo) return
    sonDurdurNo = n
    webIle { it.stopLoading() }
  }

  fun duraklatAyarla(deger: Boolean) {
    if (deger == duraklatildi) return
    duraklatildi = deger
    if (deger) cerezleriKaydet()
    webIle { w ->
      if (deger) {
        w.onPause()
        w.pauseTimers()
      } else {
        w.onResume()
        w.resumeTimers()
      }
    }
  }

  fun agDurumu(acik: Boolean) {
    webIle { it.setNetworkAvailable(acik) }
  }

  fun temizleIste(json: String?) {
    json ?: return
    try {
      val o = org.json.JSONObject(json)
      val n = o.optInt("n", 0)
      if (n <= sonTemizleNo) return
      sonTemizleNo = n
      val kapsam = o.optString("kapsam", "hepsi")
      val hepsi = kapsam == "hepsi"
      webIle { w ->
        if (hepsi || kapsam.contains("cerez")) {
          CookieManager.getInstance().removeAllCookies(null)
          CookieManager.getInstance().flush()
        }
        if (hepsi || kapsam.contains("onbellek")) w.clearCache(true)
        if (hepsi || kapsam.contains("depo")) WebStorage.getInstance().deleteAllData()
        if (hepsi || kapsam.contains("gecmis")) w.clearHistory()
        if (hepsi || kapsam.contains("ssl")) w.clearSslPreferences()
        if (hepsi || kapsam.contains("form")) w.clearFormData()
      }
    } catch (e: Throwable) {
    }
  }

  fun yokEt() {
    if (yokEdildi) return
    yokEdildi = true
    cerezSaatiniDurdur()
    cerezleriKaydet()
    kapatAcilir()
    try { betikTutamak?.remove() } catch (e: Throwable) {}
    betikTutamak = null
    cevapVekili = null
    val w = web
    web = null
    try {
      w?.stopLoading()
      w?.webChromeClient = null
      if (!WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
        w?.removeJavascriptInterface(KOPRU_ADI)
      }
      if (w != null) removeView(w)
      w?.destroy()
    } catch (e: Throwable) {
    }
  }
}
