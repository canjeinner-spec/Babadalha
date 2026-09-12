package expo.modules.aronplayer

import android.content.Context
import android.util.Base64
import org.json.JSONObject
import java.io.File
import java.util.UUID

class NetflixManifestUretici {

  fun jsonDanMpd(manifestJson: String, context: Context): String {
    val json = JSONObject(manifestJson)
    val sb = StringBuilder()
    sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
    sb.append("<MPD xmlns=\"urn:mpeg:dash:schema:mpd:2011\" ")
    sb.append("xmlns:cenc=\"urn:mpeg:cenc:2013\" ")
    sb.append("type=\"static\" ")

    val sureMs = json.optLong("duration", 0)
    if (sureMs > 0) sb.append("mediaPresentationDuration=\"PT${sureMs / 1000}S\" ")
    sb.append("minBufferTime=\"PT10S\" ")
    sb.append("profiles=\"urn:mpeg:dash:profile:isoff-on-demand:2011\">\n")

    sb.append("<Period>\n")

    val videolar = json.optJSONArray("video_tracks")
    if (videolar != null && videolar.length() > 0) {
      val videoIz = videolar.getJSONObject(0)
      val akislar = videoIz.optJSONArray("streams") ?: videoIz.optJSONArray("downloadables")
      if (akislar != null) {
        sb.append("<AdaptationSet mimeType=\"video/mp4\" contentType=\"video\" segmentAlignment=\"true\">\n")
        ekleKoruma(sb)
        ekleRol(sb)
        for (i in 0 until akislar.length()) {
          val akis = akislar.getJSONObject(i)
          val genislik = akis.optInt("res_w", akis.optInt("width", 1920))
          val yukseklik = akis.optInt("res_h", akis.optInt("height", 1080))
          val bant = bantGenisligi(akis, 5000000)
          val profil = akis.optString("content_profile", "")
          val codec = kodekBul(profil, "video")
          val cdnUrl = cdnUrlBul(akis)
          sb.append("<Representation id=\"video_$i\" bandwidth=\"$bant\" startWithSAP=\"1\" ")
          sb.append("width=\"$genislik\" height=\"$yukseklik\" codecs=\"$codec\">\n")
          if (cdnUrl.isNotEmpty()) {
            sb.append("<BaseURL>$cdnUrl</BaseURL>\n")
            val (sidxBas, sidxSon, initUz) = sidxAralik(akis)
            sb.append("<SegmentBase indexRange=\"$sidxBas-$sidxSon\">\n")
            sb.append("<Initialization range=\"0-$initUz\"/>\n")
            sb.append("</SegmentBase>\n")
          }
          sb.append("</Representation>\n")
        }
        sb.append("</AdaptationSet>\n")
      }
    }

    val sesler = json.optJSONArray("audio_tracks")
    if (sesler != null) {
      for (j in 0 until sesler.length()) {
        val sesIz = sesler.getJSONObject(j)
        val dil = sesIz.optString("language", "und")
        val akislar = sesIz.optJSONArray("streams") ?: sesIz.optJSONArray("downloadables")
        if (akislar == null || akislar.length() == 0) continue
        sb.append("<AdaptationSet mimeType=\"audio/mp4\" contentType=\"audio\" lang=\"$dil\">\n")
        ekleRol(sb)
        for (i in 0 until akislar.length()) {
          val akis = akislar.getJSONObject(i)
          val bant = bantGenisligi(akis, 128000)
          val profil = akis.optString("content_profile", "")
          val codec = kodekBul(profil, "audio")
          val cdnUrl = cdnUrlBul(akis)
          sb.append("<Representation id=\"audio_${j}_$i\" bandwidth=\"$bant\" startWithSAP=\"1\" codecs=\"$codec\">\n")
          if (cdnUrl.isNotEmpty()) {
            sb.append("<BaseURL>$cdnUrl</BaseURL>\n")
            val (sidxBas, sidxSon, initUz) = sidxAralik(akis)
            sb.append("<SegmentBase indexRange=\"$sidxBas-$sidxSon\">\n")
            sb.append("<Initialization range=\"0-$initUz\"/>\n")
            sb.append("</SegmentBase>\n")
          }
          sb.append("</Representation>\n")
        }
        sb.append("</AdaptationSet>\n")
      }
    }

    val altyazilar = json.optJSONArray("timedtexttracks") ?: json.optJSONArray("text_tracks")
    if (altyazilar != null) {
      for (i in 0 until altyazilar.length()) {
        val alt = altyazilar.getJSONObject(i)
        val dil = alt.optString("language", alt.optString("bcp47", "und"))
        val turler = alt.optJSONObject("ttDownloadables") ?: alt.optJSONObject("downloadables")
        if (turler == null) continue
        val anahtarlar = turler.keys()
        while (anahtarlar.hasNext()) {
          val ad = anahtarlar.next()
          val veri = turler.getJSONObject(ad)
          val urlAlani = veri.optJSONArray("urls") ?: continue
          if (urlAlani.length() == 0) continue
          val url = urlAlani.getJSONObject(0).optString("url", "")
          if (url.isEmpty()) continue
          sb.append("<AdaptationSet mimeType=\"text/vtt\" contentType=\"text\" lang=\"$dil\">\n")
          sb.append("<Representation id=\"text_$i\" bandwidth=\"0\">\n")
          sb.append("<BaseURL>${xmlKacis(url)}</BaseURL>\n")
          sb.append("</Representation>\n")
          sb.append("</AdaptationSet>\n")
          break
        }
      }
    }

    sb.append("</Period>\n")
    sb.append("</MPD>")

    val dosya = File(context.cacheDir, "netflix_dash_manifest.xml")
    dosya.writeText(sb.toString())
    return dosya.toURI().toString()
  }

  private fun sidxAralik(akis: JSONObject): Triple<Long, Long, Long> {
    val sidx = akis.optJSONObject("sidx")
    if (sidx == null) {
      var basByte = akis.optLong("startByteOffset", 0)
      if (basByte == 0L) basByte = 100000
      return Triple(0L, basByte, basByte)
    }
    val offset = sidx.getLong("offset")
    val sidxSon = sidx.getLong("size") + offset - 1
    val moov = akis.optJSONObject("moov")
    val initUzunluk = if (moov != null) moov.getLong("offset") + moov.getLong("size") - 1
      else akis.optLong("startByteOffset", 100000)
    return Triple(offset, sidxSon, initUzunluk)
  }

  private fun bantGenisligi(akis: JSONObject, varsayilan: Long): Long {
    val bitoran = akis.optLong("bitrate", 0)
    if (bitoran > 0) return bitoran * 1000
    return akis.optLong("avg_bitrate", varsayilan)
  }

  private fun ekleKoruma(sb: StringBuilder) {
    sb.append("<ContentProtection schemeIdUri=\"urn:uuid:e2719d58-a985-b3c9-781a-b030af78d30e\"/>\n")
    sb.append("<ContentProtection schemeIdUri=\"urn:mpeg:dash:mp4protection:2011\" value=\"cenc\" cenc:default_KID=\"9eb4050d-e44b-4802-932e-27d75083e266\"/>\n")
  }

  private fun ekleRol(sb: StringBuilder) {
    sb.append("<Role schemeIdUri=\"urn:mpeg:DASH:role:2011\" value=\"main\"/>\n")
  }

  private fun kidUuid(ham: String): String {
    val s = ham.trim()
    if (s.isEmpty()) return ""
    if (s.length == 36 && s.count { it == '-' } == 4) return s.lowercase()
    val hexMi = s.length == 32 && s.all { it.isDigit() || it in 'a'..'f' || it in 'A'..'F' }
    val bytes: ByteArray = if (hexMi) {
      ByteArray(16) { s.substring(it * 2, it * 2 + 2).toInt(16).toByte() }
    } else {
      try {
        Base64.decode(s, Base64.DEFAULT)
      } catch (e: Throwable) {
        try { Base64.decode(s, Base64.URL_SAFE) } catch (e2: Throwable) { return "" }
      }
    }
    if (bytes.size != 16) return ""
    val hex = bytes.joinToString("") { "%02x".format(it) }
    return "${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}"
  }

  private fun kodekBul(profil: String, tur: String): String {
    return when {
      profil.contains("h264") -> "avc1"
      profil.contains("vp9") -> "vp9"
      profil.contains("av1") -> "av01.0.04M.08"
      profil.contains("heaac-5.1") -> "mp4a.40.29"
      profil.contains("heaac") -> "mp4a.40.29"
      profil.contains("ddplus") || profil.contains("dd5.1") -> "ec-3"
      profil.contains("dd-") -> "ac-3"
      profil.contains("vorbis") -> "vorbis"
      profil.contains("opus") -> "opus"
      tur == "audio" -> "mp4a.40.2"
      else -> "avc1.42E01E"
    }
  }

  private fun cdnUrlBul(akis: JSONObject): String {
    val cdnlar = akis.optJSONObject("urls") ?: akis.optJSONArray("urls")
    if (cdnlar is org.json.JSONArray && cdnlar.length() > 0) {
      for (i in 0 until cdnlar.length()) {
        val cdn = cdnlar.getJSONObject(i)
        val url = cdn.optString("url", "")
        if (url.isNotEmpty() && url.matches(Regex("^https?://\\d+\\.\\d+\\.\\d+\\.\\d+.*"))) {
          return xmlKacis(url)
        }
      }
      return xmlKacis(cdnlar.getJSONObject(0).optString("url", ""))
    }
    if (cdnlar is JSONObject) {
      val anahtarlar = cdnlar.keys()
      while (anahtarlar.hasNext()) {
        val ad = anahtarlar.next()
        val cdn = cdnlar.getJSONObject(ad)
        val url = cdn.optString("url", cdn.optString("downloadUrl", ""))
        if (url.isNotEmpty()) return xmlKacis(url)
      }
    }
    return ""
  }

  private fun xmlKacis(metin: String): String {
    return metin.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&apos;")
  }
}
