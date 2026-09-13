package expo.modules.aronplayer

import androidx.media3.common.C
import androidx.media3.common.util.UnstableApi
import androidx.media3.datasource.DataSpec
import androidx.media3.datasource.ResolvingDataSource
import java.util.concurrent.atomic.AtomicLong

@UnstableApi
class YoutubeVeriCozucu : ResolvingDataSource.Resolver {
  private val istekNo = AtomicLong(0)

  override fun resolveDataSpec(dataSpec: DataSpec): DataSpec {
    val sunucu = dataSpec.uri.host?.lowercase() ?: return dataSpec
    if (!sunucu.endsWith("googlevideo.com") && !sunucu.endsWith("youtube.com")) return dataSpec

    val basliklar = LinkedHashMap(dataSpec.httpRequestHeaders)
    basliklar["Origin"] = YOUTUBE_KOK
    basliklar["Referer"] = YOUTUBE_KOK
    basliklar["Sec-Fetch-Dest"] = "empty"
    basliklar["Sec-Fetch-Mode"] = "cors"
    basliklar["Sec-Fetch-Site"] = "cross-site"

    val sorgu = dataSpec.uri.query
    if (dataSpec.uri.path != "/videoplayback" || sorgu.isNullOrEmpty()) {
      return dataSpec.buildUpon().setHttpRequestHeaders(basliklar).build()
    }

    var adres = dataSpec.uri.toString()
    if (!adres.contains(RN_PARAMETRESI)) {
      adres = adres + RN_PARAMETRESI + istekNo.getAndIncrement()
    }

    val yapici = dataSpec.buildUpon()
      .setHttpRequestHeaders(basliklar)
      .setHttpMethod(DataSpec.HTTP_METHOD_POST)
      .setHttpBody(GOVDE)

    val aralik = aralikParametresi(dataSpec.position, dataSpec.length)
    if (aralik == null) return yapici.setUri(adres).build()

    return yapici
      .setUri(adres + aralik)
      .setPosition(0L)
      .setLength(C.LENGTH_UNSET.toLong())
      .build()
  }

  private fun aralikParametresi(konum: Long, uzunluk: Long): String? {
    if (konum == 0L && uzunluk == C.LENGTH_UNSET.toLong()) return null
    val sb = StringBuilder(ARALIK_PARAMETRESI).append(konum).append("-")
    if (uzunluk != C.LENGTH_UNSET.toLong()) sb.append(konum + uzunluk - 1)
    return sb.toString()
  }

  companion object {
    private const val YOUTUBE_KOK = "https://www.youtube.com"
    private const val RN_PARAMETRESI = "&rn="
    private const val ARALIK_PARAMETRESI = "&range="
    private val GOVDE = byteArrayOf(0x78, 0x00)

    fun youtubeMu(adres: String): Boolean {
      val kucuk = adres.lowercase()
      return kucuk.contains("googlevideo.com") || kucuk.contains("yt_dash_")
    }
  }
}
