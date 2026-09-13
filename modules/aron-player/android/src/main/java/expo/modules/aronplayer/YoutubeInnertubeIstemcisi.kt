package expo.modules.aronplayer

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.regex.Pattern

data class YoutubeOynatimBilgisi(
  val manifestUrl: String,
  val baslik: String,
  val yazar: String,
  val sureMs: Long,
  val streamingJson: String,
  val canli: Boolean = false,
  val userAgent: String = "",
  val istemci: String = ""
)

class YoutubeInnertubeIstemcisi(private val context: Context) {

  enum class Istemci(
    val ad: String,
    val surum: String,
    val kimlik: String,
    val userAgent: String,
    val cihazMake: String,
    val cihazModel: String,
    val osName: String,
    val osVersion: String
  ) {
    IOS(
      ad = "IOS",
      surum = "19.29.1",
      kimlik = "5",
      userAgent = "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)",
      cihazMake = "Apple",
      cihazModel = "iPhone16,2",
      osName = "iPhone",
      osVersion = "18.3.2.22D82"
    ),
    ANDROID_VR(
      ad = "ANDROID_VR",
      surum = "1.62.27",
      kimlik = "28",
      userAgent = "com.google.android.apps.youtube.vr.oculus/1.62.27 (Linux; U; Android 12L; en_US; Oculus Quest 3 Build/SQ3A.220605.009.A1)",
      cihazMake = "Meta",
      cihazModel = "Quest 3",
      osName = "Android",
      osVersion = "12"
    ),
    ANDROID_TESTSUITE(
      ad = "ANDROID_TESTSUITE",
      surum = "1.9",
      kimlik = "30",
      userAgent = "com.google.android.youtube/1.9 (Linux; U; Android 14; en_US) gzip",
      cihazMake = "Google",
      cihazModel = "Pixel 8",
      osName = "Android",
      osVersion = "14"
    ),
    MWEB(
      ad = "MWEB",
      surum = "2.20250219.01.00",
      kimlik = "2",
      userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/134.0.6998.99 Mobile/15E148 Safari/604.1,gzip(gfe)",
      cihazMake = "Apple",
      cihazModel = "iPhone",
      osName = "iPhone",
      osVersion = "18.3.2"
    ),
    WEB(
      ad = "WEB",
      surum = "2.20221122.06.00",
      kimlik = "1",
      userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
      cihazMake = "",
      cihazModel = "",
      osName = "Windows",
      osVersion = "10.0"
    )
  }

  private val manifestUretici = YoutubeManifestUretici()
  private val sigCozucu = YoutubeSignatureCozucu()
  private val poUretici = YoutubePoTokenUretici(context)

  fun oynatimBilgisiAl(videoId: String, dil: String = "en"): YoutubeOynatimBilgisi {
    val sira = listOf(Istemci.MWEB, Istemci.ANDROID_VR, Istemci.ANDROID_TESTSUITE, Istemci.WEB, Istemci.IOS)
    val hatalar = mutableListOf<String>()
    val oynaticiBilgisi = try {
      oynaticiBilgisiAl(videoId)
    } catch (e: Throwable) {
      Log.w(TAG, "oynatici bilgisi alinamadi: ${e.message}")
      null
    }
    val poToken = try {
      poUretici.uret(oynaticiBilgisi?.visitorData.orEmpty(), videoId)
    } catch (e: Throwable) {
      Log.w(TAG, "potoken atlandi: ${e.message}")
      null
    }
    Log.d(TAG, "potoken: oturum=${poToken?.oturumToken?.isNotEmpty() == true} icerik=${poToken?.icerikToken?.isNotEmpty() == true}")
    val betik = betigiCoz(oynaticiBilgisi)
    for (istemci in sira) {
      try {
        val yanit = istemciDene(istemci, videoId, dil, oynaticiBilgisi, poToken)
        val json = JSONObject(yanit)
        val ps = json.optJSONObject("playabilityStatus")
        val durum = ps?.optString("status", "") ?: ""
        if (durum != "OK" && durum != "LIVE_STREAM_OFFLINE") {
          hatalar.add("${istemci.ad}: $durum ${ps?.optString("reason", "") ?: ""}")
          Log.w(TAG, "istemci ${istemci.ad} atlandi: durum=$durum")
          continue
        }
        val streaming = json.optJSONObject("streamingData")
        if (streaming == null) {
          hatalar.add("${istemci.ad}: streamingData yok")
          continue
        }
        if (betik != null) urlleriTazele(streaming, betik)
        val eksik = akisEksigi(json, streaming, istemci)
        if (eksik != null) {
          hatalar.add("${istemci.ad}: $eksik")
          Log.w(TAG, "istemci ${istemci.ad} atlandi: $eksik")
          continue
        }
        Log.d(TAG, "istemci secildi: ${istemci.ad}")
        return bilgiOlustur(json, streaming, videoId, istemci, oynaticiBilgisi, poToken)
      } catch (e: Throwable) {
        hatalar.add("${istemci.ad}: ${e.message}")
        Log.w(TAG, "istemci ${istemci.ad} basarisiz", e)
      }
    }
    throw Exception("YouTube tum istemciler basarisiz: ${hatalar.joinToString("; ")}")
  }

  private fun reklamTemizle(json: JSONObject) {
    json.remove("adPlacements")
    json.remove("playerAds")
    json.remove("adSlots")
    json.remove("adBreakParams")
    json.remove("adBreakHeartbeatParams")
  }

  private fun bilgiOlustur(
    json: JSONObject,
    streamingData: JSONObject,
    videoId: String,
    istemci: Istemci,
    oynaticiBilgisi: OynaticiBilgisi?,
    poToken: PoTokenSonucu?
  ): YoutubeOynatimBilgisi {
    reklamTemizle(json)
    val videoDetaylari = json.optJSONObject("videoDetails")
    val baslik = videoDetaylari?.optString("title", "") ?: ""
    val yazar = videoDetaylari?.optString("author", "") ?: ""
    val sureSaniye = videoDetaylari?.optString("lengthSeconds", "0")?.toLongOrNull() ?: 0L

    poToken?.oturumToken?.takeIf { it.isNotEmpty() }?.let { potEkle(streamingData, it) }

    YoutubeYenileyici.kaydet(
      videoId = videoId,
      visitorData = oynaticiBilgisi?.visitorData.orEmpty(),
      oturumToken = poToken?.oturumToken.orEmpty(),
      uretici = poUretici,
      akisCozucu = { vid -> akisAdresleriniCoz(vid) }
    )

    val hlsAdres = streamingData.optString("hlsManifestUrl", "")
    if (canliMi(json) && hlsAdres.isNotEmpty()) {
      Log.d(TAG, "canli yayin, HLS kullaniliyor")
      return YoutubeOynatimBilgisi(
        manifestUrl = hlsAdres,
        baslik = baslik,
        yazar = yazar,
        sureMs = 0L,
        streamingJson = streamingData.toString(),
        canli = true,
        userAgent = istemci.userAgent,
        istemci = istemci.ad
      )
    }

    val mpdUri = manifestUretici.dashUret(streamingData, sureSaniye * 1000L, context)

    return YoutubeOynatimBilgisi(
      manifestUrl = mpdUri,
      baslik = baslik,
      yazar = yazar,
      sureMs = sureSaniye * 1000L,
      streamingJson = streamingData.toString(),
      userAgent = istemci.userAgent,
      istemci = istemci.ad
    )
  }

  private fun betigiCoz(oynaticiBilgisi: OynaticiBilgisi?): YoutubeSignatureCozucu.PlayerBetigi? {
    return try {
      val playerUrl = oynaticiBilgisi?.playerUrl ?: throw Exception("player.js adresi yok")
      sigCozucu.betigiHazirla(playerUrl)
    } catch (e: Throwable) {
      Log.w(TAG, "player.js hazirlanamadi, cipher/n cozulmeden devam: ${e.message}")
      null
    }
  }

  private fun canliMi(json: JSONObject): Boolean {
    return json.optJSONObject("videoDetails")?.optBoolean("isLive", false) == true ||
      json.optJSONObject("playabilityStatus")?.has("liveStreamability") == true
  }

  private fun akisEksigi(json: JSONObject, streamingData: JSONObject, istemci: Istemci): String? {
    if (canliMi(json) && streamingData.optString("hlsManifestUrl", "").isNotEmpty()) return null

    var video = 0
    var ses = 0
    var videoAdres = ""
    var sesAdres = ""
    val adaptive = streamingData.optJSONArray("adaptiveFormats") ?: JSONArray()
    for (i in 0 until adaptive.length()) {
      val f = adaptive.optJSONObject(i) ?: continue
      val url = f.optString("url", "")
      if (url.isEmpty()) continue
      val mime = f.optString("mimeType", "")
      when {
        mime.startsWith("video/") -> {
          video++
          if (videoAdres.isEmpty()) videoAdres = url
        }
        mime.startsWith("audio/") -> {
          ses++
          if (sesAdres.isEmpty()) sesAdres = url
        }
      }
    }

    var birlesik = 0
    var birlesikAdres = ""
    val progressive = streamingData.optJSONArray("formats") ?: JSONArray()
    for (i in 0 until progressive.length()) {
      val f = progressive.optJSONObject(i) ?: continue
      val url = f.optString("url", "")
      if (url.isEmpty()) continue
      if (!f.optString("mimeType", "").startsWith("video/")) continue
      birlesik++
      if (birlesikAdres.isEmpty()) birlesikAdres = url
    }

    val sinanacak = when {
      videoAdres.isNotEmpty() && sesAdres.isNotEmpty() ->
        listOf("video" to videoAdres, "ses" to sesAdres)
      birlesikAdres.isNotEmpty() -> listOf("birlesik" to birlesikAdres)
      else -> return "adreslenebilir akis yok (video=$video ses=$ses birlesik=$birlesik ham=${adaptive.length()})"
    }

    for ((ad, adres) in sinanacak) {
      val kod = try {
        akisSinamasi(adres, istemci.userAgent)
      } catch (e: Throwable) {
        return "$ad akisi sinanamadi: ${e.message}"
      }
      if (kod !in 200..299) return "$ad akisi HTTP $kod"
    }
    return null
  }

  private fun akisSinamasi(url: String, userAgent: String): Int {
    val ayrac = if (url.contains("?")) "&" else "?"
    val adres = url + ayrac + "range=0-1&rn=" + (1..100000).random()
    val baglanti = URL(adres).openConnection() as HttpURLConnection
    try {
      baglanti.requestMethod = "POST"
      baglanti.setRequestProperty("User-Agent", userAgent)
      baglanti.setRequestProperty("Origin", "https://www.youtube.com")
      baglanti.setRequestProperty("Referer", "https://www.youtube.com/")
      baglanti.setRequestProperty("Sec-Fetch-Dest", "empty")
      baglanti.setRequestProperty("Sec-Fetch-Mode", "cors")
      baglanti.setRequestProperty("Sec-Fetch-Site", "cross-site")
      baglanti.doOutput = true
      baglanti.connectTimeout = 8_000
      baglanti.readTimeout = 8_000
      val os = baglanti.outputStream
      os.write(byteArrayOf(0x78, 0x00))
      os.flush()
      os.close()
      val kod = baglanti.responseCode
      try {
        (if (kod in 200..299) baglanti.inputStream else baglanti.errorStream)?.close()
      } catch (e: Throwable) {
      }
      return kod
    } finally {
      baglanti.disconnect()
    }
  }

  private fun akisAdresleriniCoz(vid: String): Map<String, String> {
    val bilgi = oynatimBilgisiAl(vid)
    val sd = JSONObject(bilgi.streamingJson)
    val harita = LinkedHashMap<String, String>()
    for (ad in listOf("adaptiveFormats", "formats")) {
      val dizi = sd.optJSONArray(ad) ?: continue
      for (i in 0 until dizi.length()) {
        val fmt = dizi.optJSONObject(i) ?: continue
        val itag = fmt.opt("itag")?.toString() ?: continue
        val url = fmt.optString("url", "")
        if (url.isNotEmpty()) harita[itag] = url
      }
    }
    return harita
  }

  private fun potEkle(streamingData: JSONObject, pot: String) {
    for (ad in listOf("adaptiveFormats", "formats")) {
      val dizi = streamingData.optJSONArray(ad) ?: continue
      for (i in 0 until dizi.length()) {
        val fmt = dizi.optJSONObject(i) ?: continue
        val url = fmt.optString("url", "")
        if (url.isEmpty() || url.contains("&pot=") || url.contains("?pot=")) continue
        val ayrac = if (url.contains("?")) "&" else "?"
        fmt.put("url", url + ayrac + "pot=" + pot)
      }
    }
    val hls = streamingData.optString("hlsManifestUrl", "")
    if (hls.isNotEmpty() && !hls.contains("pot=")) {
      streamingData.put("hlsManifestUrl", hls + (if (hls.contains("?")) "&" else "?") + "pot=" + pot)
    }
  }

  private fun urlleriTazele(streamingData: JSONObject, betik: YoutubeSignatureCozucu.PlayerBetigi) {
    val diziAdlari = listOf("adaptiveFormats", "formats")
    for (ad in diziAdlari) {
      val dizi = streamingData.optJSONArray(ad) ?: continue
      for (i in 0 until dizi.length()) {
        val fmt = dizi.optJSONObject(i) ?: continue
        var url = fmt.optString("url", "")
        if (url.isEmpty()) {
          val cipher = fmt.optString("signatureCipher", "").ifEmpty {
            fmt.optString("cipher", "")
          }
          if (cipher.isEmpty()) continue
          try {
            url = sigCozucu.signatureCipherCoz(cipher, betik)
          } catch (e: Throwable) {
            Log.w(TAG, "signatureCipher cozulemedi: ${e.message}")
            continue
          }
        }
        val tazelenmis = try {
          sigCozucu.nCoz(url, betik)
        } catch (e: Throwable) {
          url
        }
        fmt.put("url", tazelenmis)
      }
    }
  }

  data class OynaticiBilgisi(
    val playerUrl: String,
    val sts: String,
    val visitorData: String,
    val apiKey: String
  )

  private fun ytcfgCoz(html: String): JSONObject? {
    val kalip = Pattern.compile("""ytcfg\.set\s*\(\s*(\{.+?\})\s*\)\s*;""", Pattern.DOTALL)
    val m = kalip.matcher(html)
    var enIyi: JSONObject? = null
    while (m.find()) {
      val ham = m.group(1) ?: continue
      val o = try { JSONObject(ham) } catch (e: Throwable) { continue }
      if (o.has("INNERTUBE_CONTEXT") || o.has("PLAYER_JS_URL")) {
        enIyi = if (enIyi == null) o else birlestir(enIyi, o)
      }
    }
    return enIyi
  }

  private fun birlestir(a: JSONObject, b: JSONObject): JSONObject {
    val anahtarlar = b.keys()
    while (anahtarlar.hasNext()) {
      val k = anahtarlar.next()
      if (!a.has(k)) a.put(k, b.get(k))
    }
    return a
  }

  private fun oynaticiBilgisiAl(videoId: String): OynaticiBilgisi {
    val adaylar = listOf(
      "https://www.youtube.com/watch?v=$videoId&bpctr=9999999999&has_verified=1",
      "https://www.youtube.com/embed/$videoId"
    )
    var html = ""
    var cfg: JSONObject? = null
    for (adres in adaylar) {
      html = try {
        yerlesikSayfayiIndir(adres)
      } catch (e: Throwable) {
        Log.w(TAG, "sayfa alinamadi ($adres): ${e.message}")
        continue
      }
      cfg = ytcfgCoz(html)
      val vd = cfg?.optJSONObject("INNERTUBE_CONTEXT")?.optJSONObject("client")
        ?.optString("visitorData", "").orEmpty()
      if (vd.isNotEmpty() || html.contains("/s/player/")) break
    }
    if (html.isEmpty()) throw Exception("watch ve embed sayfalarinin ikisi de alinamadi")

    var playerUrl = cfg?.optString("PLAYER_JS_URL", "").orEmpty()
    if (playerUrl.isEmpty()) {
      val kalip = Pattern.compile("""["'](\/s\/player\/[^"']+\/player_ias\.vflset\/[a-zA-Z-]+\/base\.js)["']""")
      val m = kalip.matcher(html)
      if (m.find()) playerUrl = m.group(1).orEmpty()
    }
    if (playerUrl.isEmpty()) {
      val kalip2 = Pattern.compile("""["'](\/s\/player\/[^"']+\.js)["']""")
      val m2 = kalip2.matcher(html)
      if (m2.find()) playerUrl = m2.group(1).orEmpty()
    }
    if (playerUrl.isEmpty()) throw Exception("player.js URL'si bulunamadi")
    if (playerUrl.startsWith("/")) playerUrl = "https://www.youtube.com$playerUrl"

    val visitorData = cfg?.optJSONObject("INNERTUBE_CONTEXT")
      ?.optJSONObject("client")?.optString("visitorData", "").orEmpty()
    val apiKey = cfg?.optString("INNERTUBE_API_KEY", "").orEmpty()

    val sts = stsCikar(playerUrl)
    Log.d(TAG, "oynatici bilgisi: sts=$sts visitor=${if (visitorData.isEmpty()) "yok" else "var"} player=${playerUrl.takeLast(40)}")
    return OynaticiBilgisi(playerUrl, sts, visitorData, apiKey)
  }

  private fun stsCikar(playerUrl: String): String {
    return try {
      val js = yerlesikSayfayiIndir(playerUrl)
      val m = Pattern.compile("""signatureTimestamp[=:](\d+)""").matcher(js)
      if (m.find()) m.group(1).orEmpty() else ""
    } catch (e: Throwable) {
      Log.w(TAG, "sts cikarilamadi: ${e.message}")
      ""
    }
  }

  private fun yerlesikSayfayiIndir(url: String): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    baglanti.requestMethod = "GET"
    baglanti.setRequestProperty("User-Agent", Istemci.WEB.userAgent)
    baglanti.setRequestProperty("Accept-Language", "en-US,en;q=0.9")
    baglanti.connectTimeout = 20_000
    baglanti.readTimeout = 20_000
    val girdi = DataInputStream(baglanti.inputStream)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    return String(veri)
  }

  private fun istemciDene(
    istemci: Istemci,
    videoId: String,
    dil: String,
    oynaticiBilgisi: OynaticiBilgisi?,
    poToken: PoTokenSonucu?
  ): String {
    val govde = istemciGovdesi(istemci, videoId, dil, oynaticiBilgisi, poToken)
    val baglanti = URL(PLAYER_URL).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("User-Agent", istemci.userAgent)
    baglanti.setRequestProperty("X-YouTube-Client-Name", istemci.kimlik)
    baglanti.setRequestProperty("X-YouTube-Client-Version", istemci.surum)
    baglanti.setRequestProperty("Origin", "https://www.youtube.com")
    baglanti.setRequestProperty("Referer", "https://www.youtube.com/")
    val visitor = oynaticiBilgisi?.visitorData.orEmpty()
    if (visitor.isNotEmpty()) baglanti.setRequestProperty("X-Goog-Visitor-Id", visitor)
    baglanti.setRequestProperty("Content-Type", "application/json")
    baglanti.setRequestProperty("Accept", "application/json")
    baglanti.doOutput = true
    baglanti.connectTimeout = 30_000
    baglanti.readTimeout = 30_000
    val os: OutputStream = baglanti.outputStream
    os.write(govde.toByteArray())
    os.flush()
    os.close()
    val kod = baglanti.responseCode
    val girdiAkis = if (kod in 200..299) baglanti.inputStream else baglanti.errorStream
    val girdi = DataInputStream(girdiAkis)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    val yanit = String(veri)
    if (kod !in 200..299) {
      Log.e(TAG, "${istemci.ad} hata $kod: ${yanit.take(300)}")
      throw Exception("${istemci.ad} HTTP $kod")
    }
    return yanit
  }

  private fun istemciGovdesi(
    istemci: Istemci,
    videoId: String,
    dil: String,
    oynaticiBilgisi: OynaticiBilgisi?,
    poToken: PoTokenSonucu?
  ): String {
    val govde = JSONObject()
    val istek = JSONObject()
    istek.put("internalExperimentFlags", JSONArray())
    istek.put("useSsl", true)
    govde.put("request", istek)

    val istemciJson = JSONObject()
    istemciJson.put("clientName", istemci.ad)
    istemciJson.put("clientVersion", istemci.surum)
    if (istemci.cihazMake.isNotEmpty()) istemciJson.put("deviceMake", istemci.cihazMake)
    if (istemci.cihazModel.isNotEmpty()) istemciJson.put("deviceModel", istemci.cihazModel)
    istemciJson.put("userAgent", istemci.userAgent)
    istemciJson.put("osName", istemci.osName)
    istemciJson.put("osVersion", istemci.osVersion)
    istemciJson.put("hl", dil)
    istemciJson.put("timeZone", "UTC")
    oynaticiBilgisi?.visitorData?.takeIf { it.isNotEmpty() }?.let {
      istemciJson.put("visitorData", it)
    }
    istemciJson.put("utcOffsetMinutes", 0)
    if (istemci == Istemci.WEB || istemci == Istemci.MWEB) {
      istemciJson.put("platform", if (istemci == Istemci.MWEB) "MOBILE" else "DESKTOP")
    }

    val ctx = JSONObject()
    ctx.put("client", istemciJson)
    val kullanici = JSONObject()
    kullanici.put("lockedSafetyMode", false)
    ctx.put("user", kullanici)
    govde.put("context", ctx)

    govde.put("videoId", videoId)
    govde.put("contentCheckOk", true)
    govde.put("racyCheckOk", true)

    val playbackContext = JSONObject()
    val contentPlayback = JSONObject()
    contentPlayback.put("html5Preference", "HTML5_PREF_WANTS")
    val sts = oynaticiBilgisi?.sts.orEmpty()
    if (sts.isNotEmpty()) {
      contentPlayback.put("signatureTimestamp", sts.toIntOrNull() ?: 0)
    }
    playbackContext.put("contentPlaybackContext", contentPlayback)
    govde.put("playbackContext", playbackContext)

    poToken?.icerikToken?.takeIf { it.isNotEmpty() }?.let {
      govde.put("serviceIntegrityDimensions", JSONObject().put("poToken", it))
    }

    return govde.toString()
  }

  companion object {
    private const val TAG = "YtInnertube"
    const val PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
  }
}
