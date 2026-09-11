package expo.modules.aronplayer

import android.util.Base64
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.drm.ExoMediaDrm
import androidx.media3.exoplayer.drm.MediaDrmCallback
import androidx.media3.exoplayer.drm.MediaDrmCallbackException
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

@UnstableApi
class NetflixDrmGeriCagri(
  private val oturum: MslOturum,
  private val istek: MslIstek,
  private val yanit: MslYanit
) : MediaDrmCallback {

  @Volatile
  var sonLisansYaniti: String? = null
    private set

  override fun executeKeyRequest(
    uuid: UUID,
    request: ExoMediaDrm.KeyRequest
  ): ByteArray {
    try {
      val challengeB64 = MslOturum.base64Kodla(request.data)
      val yuk = istek.lisansYuku(challengeB64)
      val sonuc = mslPost(LISANS_URL, yuk)
      sonLisansYaniti = sonuc
      val cozulmus = yanit.lisansCoz(sonuc)
      val anahtarlar = anahtarlariCikar(cozulmus)
      return anahtarlar
    } catch (e: Exception) {
      throw MediaDrmCallbackException(
        request.licenseServerUrl?.let { listOf(it) } ?: emptyList(),
        request.licenseServerUrl ?: URL("https://www.netflix.com"),
        request.data?.size ?: 0,
        mapOf(),
        e
      )
    }
  }

  override fun executeProvisionRequest(
    uuid: UUID,
    request: ExoMediaDrm.ProvisionRequest
  ): ByteArray {
    throw MediaDrmCallbackException(
      listOf(URL("https://www.netflix.com")),
      URL("https://www.netflix.com"),
      0,
      mapOf(),
      UnsupportedOperationException("Netflix ClearKey provisioning desteklenmez")
    )
  }

  private fun anahtarlariCikar(lisansYaniti: String): ByteArray {
    val json = JSONObject(lisansYaniti)
    val anahtarlar = JSONArray()
    if (json.has("keys")) {
      val keys = json.getJSONArray("keys")
      for (i in 0 until keys.length()) {
        val key = keys.getJSONObject(i)
        val anahtar = JSONObject()
        anahtar.put("kty", "oct")
        anahtar.put("kid", b64ToUrlSafe(key.getString("kid")))
        anahtar.put("k", b64ToUrlSafe(key.getString("key")))
        anahtarlar.put(anahtar)
      }
    } else if (json.has("[0]") || json.optJSONArray("result") != null) {
      val sonuclar = json.optJSONArray("result") ?: return bos_jwk()
      for (i in 0 until sonuclar.length()) {
        val sonuc = sonuclar.getJSONObject(i)
        if (sonuc.has("keyId") && sonuc.has("keyValue")) {
          val anahtar = JSONObject()
          anahtar.put("kty", "oct")
          anahtar.put("kid", b64ToUrlSafe(sonuc.getString("keyId")))
          anahtar.put("k", b64ToUrlSafe(sonuc.getString("keyValue")))
          anahtarlar.put(anahtar)
        }
      }
    }

    if (anahtarlar.length() == 0) return bos_jwk()

    val jwk = JSONObject()
    jwk.put("type", "temporary")
    jwk.put("keys", anahtarlar)
    return jwk.toString().toByteArray()
  }

  private fun b64ToUrlSafe(b64: String): String {
    val bytes = Base64.decode(b64, Base64.DEFAULT or Base64.NO_WRAP or Base64.URL_SAFE)
    return Base64.encodeToString(bytes, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
  }

  private fun bos_jwk(): ByteArray {
    val jwk = JSONObject()
    jwk.put("type", "temporary")
    jwk.put("keys", JSONArray())
    return jwk.toString().toByteArray()
  }

  private fun mslPost(url: String, yuk: String): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("Content-Type", "application/json")
    baglanti.setRequestProperty("User-Agent", KULLANICI_AJANI)
    baglanti.doOutput = true
    baglanti.connectTimeout = 30_000
    baglanti.readTimeout = 30_000
    val os: OutputStream = baglanti.outputStream
    os.write(yuk.toByteArray())
    os.flush()
    os.close()
    val girdi = DataInputStream(baglanti.inputStream)
    val yanit = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    return String(yanit)
  }

  companion object {
    private const val MSL_TEMEL = "https://www.netflix.com/nq/msl_v1/cadmium/"
    const val MANIFEST_URL = "${MSL_TEMEL}pbo_manifests/%5E1.0.0/router?reqAttempt=1&reqName=manifest&clienttype=akira&uiversion=v65aacd43&browsername=edgeoss&browserversion=134.0.0&osname=Windows&osversion=10.0"
    const val LISANS_URL = "${MSL_TEMEL}pbo_licenses/%5E1.0.0/router?reqAttempt=1&reqName=license&clienttype=akira&uiversion=v65aacd43&browsername=edgeoss&browserversion=134.0.0&osname=Windows&osversion=10.0"
    const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0"
  }
}
