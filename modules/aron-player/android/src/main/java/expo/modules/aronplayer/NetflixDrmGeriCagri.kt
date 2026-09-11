package expo.modules.aronplayer

import android.net.Uri
import android.util.Base64
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
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

  override fun executeKeyRequest(
    uuid: UUID,
    request: ExoMediaDrm.KeyRequest
  ): MediaDrmCallback.Response {
    val lisansAdresi = oturum.lisansUrl.ifEmpty { LISANS_URL }
    try {
      val challengeB64 = MslOturum.base64Kodla(request.data)
      val yuk = istek.lisansYuku(challengeB64)
      val sonuc = mslPost(lisansAdresi, yuk)
      val cozulmus = yanit.lisansCoz(sonuc)
      return MediaDrmCallback.Response(lisansVerisiniCikar(cozulmus))
    } catch (e: Exception) {
      throw MediaDrmCallbackException(
        DataSpec(Uri.parse(lisansAdresi)),
        Uri.parse(lisansAdresi),
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
    val baglanti = URL(provUrl).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("Content-Type", "application/octet-stream")
    baglanti.doOutput = true
    baglanti.connectTimeout = 15_000
    baglanti.readTimeout = 15_000
    val os = baglanti.outputStream
    os.write(request.data)
    os.flush()
    os.close()
    val girdi = DataInputStream(baglanti.inputStream)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    return MediaDrmCallback.Response(veri)
  }

  private fun lisansVerisiniCikar(cozulmus: String): ByteArray {
    try {
      val dizi = JSONArray(cozulmus)
      if (dizi.length() > 0) {
        val ilk = dizi.getJSONObject(0)
        val sonuclar = ilk.optJSONArray("result")
        if (sonuclar != null && sonuclar.length() > 0) {
          val sonuc = sonuclar.getJSONObject(0)
          val lisanslar = sonuc.optJSONArray("licenses")
          if (lisanslar != null && lisanslar.length() > 0) {
            val veri = lisanslar.getJSONObject(0).optString("data", "")
            if (veri.isNotEmpty()) return Base64.decode(veri, Base64.DEFAULT)
          }
          val veri = sonuc.optString("data", "")
          if (veri.isNotEmpty()) return Base64.decode(veri, Base64.DEFAULT)
        }
      }
    } catch (_: Exception) { }

    try {
      val json = JSONObject(cozulmus)
      val sonuclar = json.optJSONArray("result")
      if (sonuclar != null && sonuclar.length() > 0) {
        val sonuc = sonuclar.getJSONObject(0)
        val veri = sonuc.optString("data", "")
        if (veri.isNotEmpty()) return Base64.decode(veri, Base64.DEFAULT)
      }
      val veri = json.optString("data", "")
      if (veri.isNotEmpty()) return Base64.decode(veri, Base64.DEFAULT)
    } catch (_: Exception) { }

    return Base64.decode(cozulmus, Base64.DEFAULT or Base64.NO_WRAP)
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
    val sonuc = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    return String(sonuc)
  }

  companion object {
    private const val MSL_TEMEL = "https://www.netflix.com/nq/msl_v1/cadmium/"
    const val MANIFEST_URL = "${MSL_TEMEL}pbo_manifests/%5E1.0.0/router?reqAttempt=1&reqName=manifest&clienttype=akira&uiversion=v65aacd43&browsername=chrome&browserversion=134.0.0&osname=Windows&osversion=10.0"
    const val LISANS_URL = "${MSL_TEMEL}pbo_licenses/%5E1.0.0/router?reqAttempt=1&reqName=license&clienttype=akira&uiversion=v65aacd43&browsername=chrome&browserversion=134.0.0&osname=Windows&osversion=10.0"
    const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
  }
}
