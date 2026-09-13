package expo.modules.aronplayer

import android.net.Uri
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.exoplayer.drm.ExoMediaDrm
import androidx.media3.exoplayer.drm.MediaDrmCallback
import androidx.media3.exoplayer.drm.MediaDrmCallbackException
import java.io.DataInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

@UnstableApi
class PrimeDrmGeriCagri(
  private val api: PrimeApiYonetici,
  private val bilgi: PrimeOynatimBilgisi
) : MediaDrmCallback {

  override fun executeKeyRequest(
    uuid: UUID,
    request: ExoMediaDrm.KeyRequest
  ): MediaDrmCallback.Response {
    try {
      val veri = api.widevineLisansAl(bilgi, request.data)
      return MediaDrmCallback.Response(veri)
    } catch (e: Exception) {
      throw MediaDrmCallbackException(
        DataSpec(Uri.parse(bilgi.lisansUrl)),
        Uri.parse(bilgi.lisansUrl),
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
}
