package expo.modules.aronplayer

import android.content.Context
import android.util.Base64
import android.util.Log
import androidx.media3.common.util.UnstableApi
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder

data class PrimeAltyazi(
  val kod: String,
  val ad: String,
  val url: String
)

data class PrimeOynatimBilgisi(
  val manifestUrl: String,
  val lisansUrl: String,
  val atvUrl: String,
  val cerezler: String,
  val videoId: String,
  val marketplaceId: String,
  val altyazilar: List<PrimeAltyazi> = emptyList()
)

@UnstableApi
class PrimeApiYonetici(private val context: Context) {

  fun oynatimBilgisiAl(videoId: String, cerezler: String, marketplaceId: String): PrimeOynatimBilgisi {
    val atvUrl = atvUrlBul(marketplaceId)
    val kaynaklar = listOf(
      "PlaybackUrls",
      "SubtitleUrls",
      "ForcedNarratives",
      "TrickplayUrls",
      "CatalogMetadata",
      "TransitionTimecodes",
      "PlaybackSettings",
      "XRayMetadata",
      "ForcedNarratives"
    ).joinToString(",")

    val yanit = playbackResources(atvUrl, videoId, kaynaklar, cerezler, null, marketplaceId)
    val json = JSONObject(yanit)
    val playbackUrls = json.optJSONObject("playbackUrls")
      ?: throw Exception("Prime playbackUrls yok — ${json.optString("errorCode", "?")}: ${json.optString("errorMessage", "")}")

    val defaultSetId = playbackUrls.optString("defaultUrlSetId", "")
    val urlSets = playbackUrls.optJSONObject("urlSets")
      ?: throw Exception("Prime urlSets yok")

    var manifestAdresi = ""
    val hedefSet = urlSets.optJSONObject(defaultSetId)
    if (hedefSet != null) {
      manifestAdresi = hedefSet.optJSONObject("urls")
        ?.optJSONObject("manifest")
        ?.optString("url", "") ?: ""
    }
    if (manifestAdresi.isEmpty()) {
      val anahtarlar = urlSets.keys()
      while (anahtarlar.hasNext()) {
        val ad = anahtarlar.next()
        val alt = urlSets.getJSONObject(ad)
        val u = alt.optJSONObject("urls")?.optJSONObject("manifest")?.optString("url", "") ?: ""
        if (u.isNotEmpty()) { manifestAdresi = u; break }
      }
    }
    if (manifestAdresi.isEmpty()) throw Exception("Prime manifest URL bulunamadi")

    return PrimeOynatimBilgisi(
      manifestUrl = manifestAdresi,
      lisansUrl = "$atvUrl/cdp/catalog/GetPlaybackResources",
      atvUrl = atvUrl,
      cerezler = cerezler,
      videoId = videoId,
      marketplaceId = marketplaceId,
      altyazilar = altyazilariCoz(json)
    )
  }

  private fun altyazilariCoz(json: JSONObject): List<PrimeAltyazi> {
    val sonuc = mutableListOf<PrimeAltyazi>()
    val gorulen = mutableSetOf<String>()
    for (alan in listOf("subtitleUrls", "forcedNarratives")) {
      val dizi = json.optJSONArray(alan) ?: continue
      for (i in 0 until dizi.length()) {
        val o = dizi.optJSONObject(i) ?: continue
        val url = o.optString("url", "")
        if (url.isEmpty()) continue
        val kod = o.optString("languageCode", o.optString("language", "und"))
        if (!gorulen.add("$kod|$url")) continue
        val ad = o.optString("displayName", "").ifEmpty { kod }
        sonuc.add(PrimeAltyazi(kod, if (alan == "forcedNarratives") "$ad (zorunlu)" else ad, url))
      }
    }
    return sonuc
  }

  fun widevineLisansAl(bilgi: PrimeOynatimBilgisi, challenge: ByteArray): ByteArray {
    val challengeB64 = Base64.encodeToString(challenge, Base64.NO_WRAP)
    val yanit = playbackResources(
      bilgi.atvUrl,
      bilgi.videoId,
      "Widevine2License",
      bilgi.cerezler,
      "widevine2Challenge=" + URLEncoder.encode(challengeB64, "UTF-8"),
      bilgi.marketplaceId
    )
    val json = JSONObject(yanit)
    val wv = json.optJSONObject("widevine2License")
      ?: throw Exception("Prime widevine2License yok — ${json.optString("errorCode", "?")}")
    val lisansB64 = wv.optString("license", "")
    if (lisansB64.isEmpty()) throw Exception("Prime lisans bos")
    return Base64.decode(lisansB64, Base64.DEFAULT)
  }

  private fun playbackResources(
    atvUrl: String,
    videoId: String,
    desiredResources: String,
    cerezler: String,
    formGovde: String?,
    marketplaceId: String
  ): String {
    val paramlar = tabanParametreler(videoId, desiredResources, marketplaceId)
    val sorgu = paramlar.entries.joinToString("&") { (k, v) -> "$k=" + URLEncoder.encode(v, "UTF-8") }
    val tamAdres = "$atvUrl/cdp/catalog/GetPlaybackResources?$sorgu"
    val baglanti = URL(tamAdres).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("User-Agent", KULLANICI_AJANI)
    baglanti.setRequestProperty("Content-Type", "application/x-www-form-urlencoded")
    baglanti.setRequestProperty("Accept", "application/json")
    if (cerezler.isNotEmpty()) baglanti.setRequestProperty("Cookie", cerezler)
    baglanti.doOutput = true
    baglanti.connectTimeout = 30_000
    baglanti.readTimeout = 30_000
    val os: OutputStream = baglanti.outputStream
    os.write((formGovde ?: "").toByteArray())
    os.flush()
    os.close()
    val kod = baglanti.responseCode
    val girdiAkis = if (kod in 200..299) baglanti.inputStream else baglanti.errorStream
    val girdi = DataInputStream(girdiAkis)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    val metin = String(veri)
    if (kod !in 200..299) {
      Log.e(TAG, "Prime API hata: $kod — ${metin.take(300)}")
      throw Exception("Prime API hata: $kod")
    }
    return metin
  }

  private fun tabanParametreler(videoId: String, desiredResources: String, marketplaceId: String): Map<String, String> {
    return linkedMapOf(
      "asin" to videoId,
      "consumptionType" to "Streaming",
      "desiredResources" to desiredResources,
      "deviceID" to CIHAZ_KIMLIGI,
      "deviceTypeID" to CIHAZ_TIPI,
      "firmware" to "1",
      "gascEnabled" to "true",
      "marketplaceID" to marketplaceId,
      "audioTrackId" to "all",
      "resourceUsage" to "CacheResources",
      "videoMaterialType" to "Feature",
      "playerType" to "html5",
      "deviceDrmOverride" to "CENC",
      "deviceStreamingTechnologyOverride" to "DASH",
      "deviceProtocolOverride" to "Https",
      "supportedDRMKeyScheme" to "DUAL_KEY",
      "liveManifestType" to "live,accumulating",
      "deviceBitrateAdaptationsOverride" to "CBR",
      "titleDecorationScheme" to "primary-content",
      "subtitleFormat" to "TTMLv2",
      "languageFeature" to "MLFv2",
      "playbackSettingsFormatVersion" to "1.0.0",
      "playerAttributes" to "{\"frameRate\":\"HFR\"}"
    )
  }

  private fun atvUrlBul(marketplaceId: String): String {
    return ATV_URLS[marketplaceId] ?: ATV_VARSAYILAN
  }

  companion object {
    private const val TAG = "PrimeApi"
    private const val CIHAZ_KIMLIGI = "93aa62b4ec5d52b8db3e0af4854a5ca7507e8622348981bf33998a95"
    private const val CIHAZ_TIPI = "AOAGZA014O5RE"
    private const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
    const val VARSAYILAN_MARKETPLACE = "ATVPDKIKX0DER"
    private const val ATV_VARSAYILAN = "https://atv-ps.primevideo.com"
    private val ATV_URLS = mapOf(
      "A1PA6795UKMFR9" to "https://atv-ps-eu.amazon.de",
      "A1F83G8C2ARO7P" to "https://atv-ps-eu.amazon.co.uk",
      "ATVPDKIKX0DER" to "https://atv-ps.amazon.com",
      "A1VC38T7YXB528" to "https://atv-ps-fe.amazon.co.jp",
      "A3K6Y4MI8GDYMT" to "https://atv-ps-eu.primevideo.com",
      "A2MFUE2XK8ZSSY" to "https://atv-ps-eu.primevideo.com",
      "A15PK738MTQHSO" to "https://atv-ps-fe.primevideo.com"
    )
  }
}
