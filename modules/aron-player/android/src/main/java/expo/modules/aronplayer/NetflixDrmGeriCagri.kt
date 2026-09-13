package expo.modules.aronplayer

import android.net.Uri
import android.util.Base64
import android.util.Log
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.exoplayer.drm.ExoMediaDrm
import androidx.media3.exoplayer.drm.MediaDrmCallback
import androidx.media3.exoplayer.drm.MediaDrmCallbackException
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.nio.charset.StandardCharsets
import java.util.UUID

@UnstableApi
class NetflixDrmGeriCagri(
  private val yonetici: NetflixMslYonetici
) : MediaDrmCallback {

  override fun executeKeyRequest(
    uuid: UUID,
    request: ExoMediaDrm.KeyRequest
  ): MediaDrmCallback.Response {
    try {
      val jwk = yonetici.clearKeyJwk
        ?: throw IllegalStateException("ClearKey JWK hazir degil — lisans alinmamis olabilir")
      Log.d(TAG, "ClearKey JWK donuyor (${jwk.size} bayt)")
      return MediaDrmCallback.Response(jwk)
    } catch (e: Exception) {
      Log.e(TAG, "executeKeyRequest hatasi", e)
      throw MediaDrmCallbackException(
        DataSpec(Uri.EMPTY),
        Uri.EMPTY,
        emptyMap<String, List<String>>(),
        0L,
        e
      )
    }
  }

  override fun executeProvisionRequest(
    uuid: UUID,
    request: ExoMediaDrm.ProvisionRequest
  ): MediaDrmCallback.Response {
    val provUrl = request.defaultUrl
    if (provUrl.isNullOrBlank()) {
      throw MediaDrmCallbackException(
        DataSpec(Uri.EMPTY),
        Uri.EMPTY,
        emptyMap<String, List<String>>(),
        0L,
        UnsupportedOperationException("Provisioning URL bos")
      )
    }
    val govde = "{\"signedRequest\":\"".toByteArray(Charsets.UTF_8) +
      request.data +
      "\"}".toByteArray(Charsets.UTF_8)
    val baglanti = URL(provUrl).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("Content-Type", "application/json; charset=utf-8")
    baglanti.setRequestProperty("Content-Length", govde.size.toString())
    baglanti.doOutput = true
    baglanti.connectTimeout = 15_000
    baglanti.readTimeout = 15_000
    val os = baglanti.outputStream
    os.write(govde)
    os.flush()
    os.close()
    val kod = baglanti.responseCode
    if (kod !in 200..299) {
      val hataMetni = try {
        baglanti.errorStream?.let { DataInputStream(it).readBytes() }?.let { String(it) }.orEmpty()
      } catch (e: Throwable) {
        ""
      }
      baglanti.disconnect()
      throw MediaDrmCallbackException(
        DataSpec(Uri.parse(provUrl)),
        Uri.parse(provUrl),
        emptyMap<String, List<String>>(),
        0L,
        Exception("provisioning HTTP $kod ${hataMetni.take(200)}")
      )
    }
    val girdi = DataInputStream(baglanti.inputStream)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    return MediaDrmCallback.Response(veri)
  }

  companion object {
    private const val MSL_TEMEL = "https://www.netflix.com/nq/msl_v1/cadmium/"
    const val ROUTER_URL = "${MSL_TEMEL}pbo_manifests/%5E1.0.0/router"
    const val MANIFEST_URL = "${MSL_TEMEL}pbo_manifests/%5E1.0.0/router?reqAttempt=1&reqName=manifest&clienttype=akira&uiversion=v65aacd43&browsername=edgeoss&browserversion=134.0.0&osname=Windows&osversion=10.0"
    const val LISANS_URL = "${MSL_TEMEL}pbo_licenses/%5E1.0.0/router?reqAttempt=1&reqName=prefetch/license&clienttype=akira&uiversion=v65aacd43&browsername=edgeoss&browserversion=134.0.0&osname=Windows&osversion=10.0"
    const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0"

    val GENEL_PSSH = "AAAC6nBzc2gAAAAAmgTweZhAQoarkuZb4IhflQAAAsrKAgAAAQABAMACPABXAFIATQBIAEUAQQBEAEUAUgAgAHgAbQBsAG4AcwA9ACIAaAB0AHQAcAA6AC8ALwBzAGMAaABlAG0AYQBzAC4AbQBpAGMAcgBvAHMAbwBmAHQALgBjAG8AbQAvAEQAUgBNAC8AMgAwADAANwAvADAAMwAvAFAAbABhAHkAUgBlAGEAZAB5AEgAZQBhAGQAZQByACIAIAB2AGUAcgBzAGkAbwBuAD0AIgA0AC4AMgAuADAALgAwACIAPgA8AEQAQQBUAEEAPgA8AFAAUgBPAFQARQBDAFQASQBOAEYATwA+ADwASwBJAEQAUwA+ADwASwBJAEQAIABBAEwARwBJAEQAPQAiAEEARQBTAEMAVABSACIAIABWAEEATABVAEUAPQAiAEEAQQBBAEEAQQBOAG8ASQBYAEQANABBAEEAQQBBAEEAQQBBAEEAQQBBAEEAPQA9ACIAPgA8AC8ASwBJAEQAPgA8AC8ASwBJAEQAUwA+ADwALwBQAFIATwBUAEUAQwBUAEkATgBGAE8APgA8AEwAQQBfAFUAUgBMAD4AaAB0AHQAcAA6AC8ALwBjAGEAcABwAHIAcwB2AHIAMAA2AC8AcwBpAGwAdgBlAHIAbABpAGcAaAB0ADUALwByAGkAZwBoAHQAcwBtAGEAbgBhAGcAZQByAC4AYQBzAG0AeAA8AC8ATABBAF8AVQBSAEwAPgA8AEwAVQBJAF8AVQBSAEwAPgBoAHQAdABwADoALwAvAGMAYQBwAHAAcgBzAHYAcgAwADYALwBzAGkAbAB2AGUAcgBsAGkAZwBoAHQANQAvAHIAaQBnAGgAdABzAG0AYQBuAGEAZwBlAHIALgBhAHMAbQB4ADwALwBMAFUASQBfAFUAUgBMAD4APAAvAEQAQQBUAEEAPgA8AC8AVwBSAE0ASABFAEEARABFAFIAPgA="

    private const val TAG = "NetflixDrm"
    private val HEX_DESENI = Regex("^[0-9a-fA-F]+$")

    private fun hexMi(s: String): Boolean = s.length % 2 == 0 && HEX_DESENI.matches(s)

    private fun hexDenBase64Url(hex: String): String {
      val bytes = ByteArray(hex.length / 2)
      for (i in bytes.indices) bytes[i] = hex.substring(i * 2, i * 2 + 2).toInt(16).toByte()
      return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP)
    }

    private fun base64UrlNoPad(b64: String): String {
      return b64
        .replace("+", "-")
        .replace("/", "_")
        .trimEnd('=')
    }

    private fun anahtarDonustur(deger: String): String {
      return if (hexMi(deger) && deger.length in listOf(32, 48, 64)) {
        Log.d(TAG, "hex anahtar algilandi (${deger.length} karakter)")
        hexDenBase64Url(deger)
      } else {
        base64UrlNoPad(deger)
      }
    }

    fun clearKeyJwkOlustur(anahtarlar: JSONObject): ByteArray {
      val jwk = JSONObject()
      jwk.put("type", "temporary")
      val keys = JSONArray()
      val it = anahtarlar.keys()
      while (it.hasNext()) {
        val kid = it.next()
        val key = anahtarlar.getString(kid)
        Log.d(TAG, "anahtar kid=${kid.take(8)}... key=${key.take(8)}...")
        val entry = JSONObject()
        entry.put("kty", "oct")
        entry.put("kid", anahtarDonustur(kid))
        entry.put("k", anahtarDonustur(key))
        keys.put(entry)
      }
      jwk.put("keys", keys)
      Log.d(TAG, "JWK: ${jwk.toString().take(200)}")
      return jwk.toString().toByteArray(StandardCharsets.UTF_8)
    }
  }
}
