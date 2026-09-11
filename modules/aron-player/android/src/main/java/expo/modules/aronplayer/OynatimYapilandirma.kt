package expo.modules.aronplayer

import org.json.JSONObject
import java.security.MessageDigest

data class DrmAyari(
  val sema: String,
  val lisansUrl: String,
  val basliklar: Map<String, String>,
  val cokluOturum: Boolean,
  val anahtarsizOynat: Boolean,
  val netflixMsl: Boolean = false,
  val netflixId: String = "",
  val netflixSecureId: String = "",
  val netflixVideoId: String = "",
  val primeAmazon: Boolean = false,
  val primeVideoId: String = "",
  val primeCerezler: String = "",
  val primeMarketplaceId: String = ""
)

data class OynatimYapilandirma(
  val manifestUrl: String,
  val mimeTuru: String?,
  val drm: DrmAyari?,
  val basliklar: Map<String, String>,
  val baslangicMs: Long,
  val otomatikBasla: Boolean,
  val arkaPlandaDevam: Boolean
) {
  val kimlik: String = ozet(
    listOf(
      manifestUrl,
      mimeTuru ?: "-",
      drm?.sema ?: "-",
      drm?.lisansUrl ?: "-",
      drm?.cokluOturum?.toString() ?: "-",
      drm?.anahtarsizOynat?.toString() ?: "-",
      basliklarOzeti(drm?.basliklar),
      basliklarOzeti(basliklar)
    ).joinToString(" ")
  )

  companion object {
    fun coz(json: String?): OynatimYapilandirma? {
      if (json.isNullOrBlank()) return null
      return try {
        val o = JSONObject(json)
        val url = o.optString("manifestUrl")
        if (url.isBlank()) return null
        OynatimYapilandirma(
          manifestUrl = url,
          mimeTuru = o.optString("mimeType").ifBlank { null },
          drm = drmCoz(o.optJSONObject("drm")),
          basliklar = haritaCoz(o.optJSONObject("headers")),
          baslangicMs = o.optLong("baslangicMs", 0L).coerceAtLeast(0L),
          otomatikBasla = o.optBoolean("otomatikBasla", true),
          arkaPlandaDevam = o.optBoolean("arkaPlandaDevam", false)
        )
      } catch (e: Throwable) {
        null
      }
    }

    private fun drmCoz(o: JSONObject?): DrmAyari? {
      o ?: return null
      val lisans = o.optString("licenseUrl")
      val netflixMsl = o.optBoolean("netflixMsl", false)
      if (lisans.isBlank() && !netflixMsl) return null
      return DrmAyari(
        sema = o.optString("scheme", "widevine").lowercase(),
        lisansUrl = lisans,
        basliklar = haritaCoz(o.optJSONObject("headers")),
        cokluOturum = o.optBoolean("cokluOturum", false),
        anahtarsizOynat = o.optBoolean("anahtarsizOynat", false),
        netflixMsl = o.optBoolean("netflixMsl", false),
        netflixId = o.optString("netflixId", ""),
        netflixSecureId = o.optString("netflixSecureId", ""),
        netflixVideoId = o.optString("netflixVideoId", ""),
        primeAmazon = o.optBoolean("primeAmazon", false),
        primeVideoId = o.optString("primeVideoId", ""),
        primeCerezler = o.optString("primeCerezler", ""),
        primeMarketplaceId = o.optString("primeMarketplaceId", "")
      )
    }

    private fun haritaCoz(o: JSONObject?): Map<String, String> {
      o ?: return emptyMap()
      val harita = LinkedHashMap<String, String>()
      val anahtarlar = o.keys()
      while (anahtarlar.hasNext()) {
        val k = anahtarlar.next()
        val v = o.opt(k) ?: continue
        harita[k] = v.toString()
      }
      return harita
    }

    private fun basliklarOzeti(basliklar: Map<String, String>?): String {
      if (basliklar.isNullOrEmpty()) return "-"
      val duz = basliklar.entries
        .sortedBy { it.key }
        .joinToString(";") { it.key + "=" + it.value }
      return ozet(duz)
    }

    private fun ozet(metin: String): String {
      return try {
        val h = MessageDigest.getInstance("SHA-256").digest(metin.toByteArray(Charsets.UTF_8))
        buildString { for (i in 0 until 8) append(String.format("%02x", h[i])) }
      } catch (e: Throwable) {
        Integer.toHexString(metin.hashCode())
      }
    }
  }
}
