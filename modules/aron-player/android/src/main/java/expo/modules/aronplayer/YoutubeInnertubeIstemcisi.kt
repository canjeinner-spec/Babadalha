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
  val streamingJson: String
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
      surum = "2.20250219.01.00",
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

  fun oynatimBilgisiAl(videoId: String, dil: String = "en"): YoutubeOynatimBilgisi {
    val sira = listOf(Istemci.IOS, Istemci.ANDROID_VR, Istemci.ANDROID_TESTSUITE)
    val hatalar = mutableListOf<String>()
    var enSonJson: JSONObject? = null
    for (istemci in sira) {
      try {
        val yanit = istemciDene(istemci, videoId, dil)
        val json = JSONObject(yanit)
        val ps = json.optJSONObject("playabilityStatus")
        val durum = ps?.optString("status", "") ?: ""
        if (durum == "OK" || durum == "LIVE_STREAM_OFFLINE") {
          val streaming = json.optJSONObject("streamingData")
          if (streaming != null && (streaming.optJSONArray("adaptiveFormats")?.length() ?: 0) > 0) {
            return bilgiOlustur(json, streaming, videoId)
          }
        }
        hatalar.add("${istemci.ad}: $durum ${ps?.optString("reason", "") ?: ""}")
        enSonJson = json
      } catch (e: Throwable) {
        hatalar.add("${istemci.ad}: ${e.message}")
        Log.w(TAG, "istemci ${istemci.ad} basarisiz", e)
      }
    }
    if (enSonJson != null) {
      val streaming = enSonJson!!.optJSONObject("streamingData")
      if (streaming != null) return bilgiOlustur(enSonJson!!, streaming, videoId)
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

  private fun bilgiOlustur(json: JSONObject, streamingData: JSONObject, videoId: String): YoutubeOynatimBilgisi {
    reklamTemizle(json)
    val videoDetaylari = json.optJSONObject("videoDetails")
    val baslik = videoDetaylari?.optString("title", "") ?: ""
    val yazar = videoDetaylari?.optString("author", "") ?: ""
    val sureSaniye = videoDetaylari?.optString("lengthSeconds", "0")?.toLongOrNull() ?: 0L

    val betik = try {
      val playerUrl = playerUrluBul(videoId)
      sigCozucu.betigiHazirla(playerUrl)
    } catch (e: Throwable) {
      Log.w(TAG, "player.js hazirlanamadi, cipher/n cozulmeden devam: ${e.message}")
      null
    }

    if (betik != null) urlleriTazele(streamingData, betik)

    val mpdUri = manifestUretici.dashUret(streamingData, sureSaniye * 1000L, context)

    return YoutubeOynatimBilgisi(
      manifestUrl = mpdUri,
      baslik = baslik,
      yazar = yazar,
      sureMs = sureSaniye * 1000L,
      streamingJson = streamingData.toString()
    )
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

  private fun playerUrluBul(videoId: String): String {
    val yerlesikUrl = "https://www.youtube.com/embed/$videoId"
    val html = yerlesikSayfayiIndir(yerlesikUrl)
    val kalip = Pattern.compile("""["\'](\/s\/player\/[^"']+\/player_ias\.vflset\/[a-zA-Z-]+\/base\.js)["\']""")
    val m = kalip.matcher(html)
    if (m.find()) return "https://www.youtube.com" + m.group(1)
    val kalip2 = Pattern.compile("""["\'](\/s\/player\/[^"']+\.js)["\']""")
    val m2 = kalip2.matcher(html)
    if (m2.find()) return "https://www.youtube.com" + m2.group(1)
    throw Exception("player.js URL'si bulunamadi")
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

  private fun istemciDene(istemci: Istemci, videoId: String, dil: String): String {
    val govde = istemciGovdesi(istemci, videoId, dil)
    val baglanti = URL(PLAYER_URL).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("User-Agent", istemci.userAgent)
    baglanti.setRequestProperty("X-YouTube-Client-Name", istemci.kimlik)
    baglanti.setRequestProperty("X-YouTube-Client-Version", istemci.surum)
    baglanti.setRequestProperty("Origin", "https://www.youtube.com")
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

  private fun istemciGovdesi(istemci: Istemci, videoId: String, dil: String): String {
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
    playbackContext.put("contentPlaybackContext", contentPlayback)
    govde.put("playbackContext", playbackContext)

    return govde.toString()
  }

  companion object {
    private const val TAG = "YtInnertube"
    const val PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
  }
}
