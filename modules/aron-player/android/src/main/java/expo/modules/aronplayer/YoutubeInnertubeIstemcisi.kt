package expo.modules.aronplayer

import android.content.Context
import android.util.Log
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL

data class YoutubeOynatimBilgisi(
  val manifestUrl: String,
  val baslik: String,
  val yazar: String,
  val sureMs: Long,
  val streamingJson: String
)

class YoutubeInnertubeIstemcisi(private val context: Context) {

  private val manifestUretici = YoutubeManifestUretici()

  fun oynatimBilgisiAl(videoId: String, dil: String = "en"): YoutubeOynatimBilgisi {
    val yuk = iosGovdesi(videoId, dil)
    val yanit = playerCagir(yuk)
    val json = JSONObject(yanit)
    val streamingData = json.optJSONObject("streamingData")
      ?: throw Exception("streamingData yok — ${playabilityDurum(json)}")

    val videoDetaylari = json.optJSONObject("videoDetails")
    val baslik = videoDetaylari?.optString("title", "") ?: ""
    val yazar = videoDetaylari?.optString("author", "") ?: ""
    val sureSaniye = videoDetaylari?.optString("lengthSeconds", "0")?.toLongOrNull() ?: 0L

    val mpdUri = manifestUretici.dashUret(streamingData, sureSaniye * 1000L, context)

    return YoutubeOynatimBilgisi(
      manifestUrl = mpdUri,
      baslik = baslik,
      yazar = yazar,
      sureMs = sureSaniye * 1000L,
      streamingJson = streamingData.toString()
    )
  }

  private fun iosGovdesi(videoId: String, dil: String): String {
    val govde = JSONObject()
    val istek = JSONObject()
    istek.put("internalExperimentFlags", org.json.JSONArray())
    istek.put("useSsl", true)
    govde.put("request", istek)

    val istemci = JSONObject()
    istemci.put("clientName", "IOS")
    istemci.put("clientVersion", ISTEMCI_SURUMU)
    istemci.put("deviceMake", "Apple")
    istemci.put("deviceModel", "iPhone16,2")
    istemci.put("userAgent", KULLANICI_AJANI)
    istemci.put("osName", "iPhone")
    istemci.put("osVersion", "18.3.2.22D82")
    istemci.put("hl", dil)
    istemci.put("timeZone", "UTC")
    istemci.put("utcOffsetMinutes", 0)

    val context = JSONObject()
    context.put("client", istemci)
    val kullanici = JSONObject()
    kullanici.put("lockedSafetyMode", false)
    context.put("user", kullanici)
    govde.put("context", context)

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

  private fun playabilityDurum(json: JSONObject): String {
    val ps = json.optJSONObject("playabilityStatus") ?: return "playabilityStatus yok"
    val durum = ps.optString("status", "?")
    val sebep = ps.optString("reason", "")
    return "$durum ${if (sebep.isNotEmpty()) "— $sebep" else ""}"
  }

  private fun playerCagir(yuk: String): String {
    val baglanti = URL(PLAYER_URL).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("User-Agent", KULLANICI_AJANI)
    baglanti.setRequestProperty("X-YouTube-Client-Name", "5")
    baglanti.setRequestProperty("X-YouTube-Client-Version", ISTEMCI_SURUMU)
    baglanti.setRequestProperty("Origin", "https://www.youtube.com")
    baglanti.setRequestProperty("Content-Type", "application/json")
    baglanti.setRequestProperty("Accept", "application/json")
    baglanti.doOutput = true
    baglanti.connectTimeout = 30_000
    baglanti.readTimeout = 30_000
    val os: OutputStream = baglanti.outputStream
    os.write(yuk.toByteArray())
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
      Log.e(TAG, "InnerTube hata: $kod — ${yanit.take(300)}")
      throw Exception("InnerTube hata: $kod")
    }
    return yanit
  }

  companion object {
    private const val TAG = "YtInnertube"
    const val PLAYER_URL = "https://www.youtube.com/youtubei/v1/player?prettyPrint=false"
    const val ISTEMCI_SURUMU = "21.02.3"
    const val KULLANICI_AJANI = "com.google.ios.youtube/21.02.3 (iPhone16,2; U; CPU iOS 18_3_2 like Mac OS X;)"
  }
}
