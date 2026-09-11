package expo.modules.aronplayer

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.io.File
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

data class MaxOynatimBilgisi(
  val manifestUrl: String,
  val lisansUrl: String,
  val manifestJson: String
)

class MaxApiYonetici(private val context: Context) {
  private val cihazKimligi = UUID.randomUUID().toString()

  fun oynatimBilgisiAl(oturumToken: String, icerikId: String): MaxOynatimBilgisi {
    val yuk = oynatimYuku(icerikId)
    val sonuc = apiPost(OYNATIM_URL, yuk, oturumToken)
    val json = JSONObject(sonuc)
    val manifesto = json.optJSONObject("manifesto")
      ?: json.optJSONObject("manifest")
      ?: throw Exception("Max manifest bulunamadi")

    val dashUrl = dashUrlBul(manifesto)
    val lisans = lisansUrlBul(json)

    val mpdUri = if (dashUrl.endsWith(".mpd") || dashUrl.contains("manifest")) {
      dashUrl
    } else {
      dashUrl
    }

    return MaxOynatimBilgisi(
      manifestUrl = mpdUri,
      lisansUrl = lisans,
      manifestJson = json.toString()
    )
  }

  private fun oynatimYuku(icerikId: String): String {
    val govde = JSONObject()
    govde.put("editId", icerikId)
    govde.put("appBundle", "beam")
    val cihaz = JSONObject()
    val bilgi = JSONObject()
    bilgi.put("make", "LGE")
    bilgi.put("model", "OLED55C1PVB")
    bilgi.put("platform", "webos")
    val os = JSONObject()
    os.put("name", "webos")
    os.put("version", "6.0")
    bilgi.put("os", os)
    val oynatici = JSONObject()
    val sdk = JSONObject()
    sdk.put("version", "5.2.0")
    oynatici.put("sdk", sdk)
    bilgi.put("player", oynatici)
    cihaz.put("deviceInfo", bilgi)
    govde.put("device", cihaz)
    val drm = JSONObject()
    drm.put("type", "WIDEVINE")
    drm.put("version", "L3")
    govde.put("drm", drm)
    val format = JSONObject()
    format.put("streaming", JSONArray().put("DASH"))
    govde.put("format", format)
    return govde.toString()
  }

  private fun dashUrlBul(manifesto: JSONObject): String {
    val url = manifesto.optJSONObject("url")
    if (url != null) {
      val dash = url.optString("dash", "")
      if (dash.isNotEmpty()) return dash
    }
    val urls = manifesto.optJSONArray("urls")
    if (urls != null) {
      for (i in 0 until urls.length()) {
        val u = urls.getJSONObject(i)
        val tur = u.optString("type", "")
        if (tur.contains("dash", ignoreCase = true) || tur.contains("mpd", ignoreCase = true)) {
          return u.optString("url", "")
        }
      }
      if (urls.length() > 0) return urls.getJSONObject(0).optString("url", "")
    }
    val dogrudan = manifesto.optString("url", "")
    if (dogrudan.isNotEmpty()) return dogrudan
    throw Exception("DASH manifest URL bulunamadi")
  }

  private fun lisansUrlBul(json: JSONObject): String {
    val drm = json.optJSONObject("drm")
      ?: json.optJSONObject("protection")
    if (drm != null) {
      val widevine = drm.optJSONObject("widevine")
      if (widevine != null) {
        val url = widevine.optString("licenseUrl", widevine.optString("license_url", ""))
        if (url.isNotEmpty()) return url
      }
      val url = drm.optString("licenseUrl", drm.optString("license_url", ""))
      if (url.isNotEmpty()) return url
    }
    val manifesto = json.optJSONObject("manifesto") ?: json.optJSONObject("manifest")
    if (manifesto != null) {
      val prot = manifesto.optJSONObject("protection")
      if (prot != null) {
        val wv = prot.optJSONObject("widevine")
        if (wv != null) {
          val url = wv.optString("licenseUrl", wv.optString("license_url", ""))
          if (url.isNotEmpty()) return url
        }
      }
    }
    return ""
  }

  private fun basliklar(token: String): Map<String, String> {
    val sdkSurum = "5.2.0"
    val marka = "LGE"
    val model = "OLED55C1PVB"
    val osSurum = "6.0"
    return mapOf(
      "User-Agent" to KULLANICI_AJANI,
      "x-device-info" to "beam/$sdkSurum ($marka/$model; webos/$osSurum; $cihazKimligi/beam)",
      "x-disco-client" to "webos-$osSurum:beam:$sdkSurum",
      "x-disco-params" to "bid=beam,features=ar",
      "authorization" to "Bearer $token",
      "Content-Type" to "application/json"
    )
  }

  private fun apiPost(url: String, yuk: String, token: String): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    for ((ad, deger) in basliklar(token)) {
      baglanti.setRequestProperty(ad, deger)
    }
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
    val sonuc = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    val yanitMetni = String(sonuc)
    if (kod !in 200..299) {
      Log.e(TAG, "Max API hata: $kod — $yanitMetni")
      throw Exception("Max API hata: $kod")
    }
    return yanitMetni
  }

  companion object {
    private const val TAG = "MaxApi"
    private const val OYNATIM_URL = "https://default.any-any.prd.api.max.com/any/playback/v1/playbackInfo"
    private const val KULLANICI_AJANI = "Mozilla/5.0 (Web0S; Linux/SmartTV) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.5359.97 Safari/537.36 WebAppManager"
  }
}
