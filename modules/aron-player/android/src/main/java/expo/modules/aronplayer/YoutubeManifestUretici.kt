package expo.modules.aronplayer

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

class YoutubeManifestUretici {

  fun dashUret(streamingData: JSONObject, sureMs: Long, context: Context): String {
    val adaptive = streamingData.optJSONArray("adaptiveFormats") ?: JSONArray()
    val videolar = mutableListOf<JSONObject>()
    val sesler = mutableListOf<JSONObject>()

    for (i in 0 until adaptive.length()) {
      val f = adaptive.getJSONObject(i)
      val url = f.optString("url", "")
      if (url.isEmpty()) continue
      val mime = f.optString("mimeType", "")
      when {
        mime.startsWith("video/") -> videolar.add(f)
        mime.startsWith("audio/") -> sesler.add(f)
      }
    }

    if (videolar.isEmpty() && sesler.isEmpty()) {
      val progressive = streamingData.optJSONArray("formats") ?: JSONArray()
      if (progressive.length() > 0) {
        for (i in 0 until progressive.length()) {
          val f = progressive.getJSONObject(i)
          if (f.optString("url", "").isEmpty()) continue
          val mime = f.optString("mimeType", "")
          if (mime.startsWith("video/")) videolar.add(f)
        }
      }
    }

    if (videolar.isEmpty() && sesler.isEmpty()) {
      throw IllegalStateException("DASH uretilemedi: adreslenebilir format yok")
    }

    val sb = StringBuilder()
    val sureSaniye = sureMs / 1000.0
    sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
    sb.append("<MPD xmlns=\"urn:mpeg:dash:schema:mpd:2011\" ")
    sb.append("type=\"static\" ")
    sb.append("mediaPresentationDuration=\"PT${sureSaniye}S\" ")
    sb.append("minBufferTime=\"PT2S\" ")
    sb.append("profiles=\"urn:mpeg:dash:profile:isoff-on-demand:2011\">\n")
    sb.append("<Period>\n")

    if (videolar.isNotEmpty()) {
      videolar.sortByDescending { it.optLong("bitrate", 0) }
      val gruplar = videolar.groupBy { mimeKok(it.optString("mimeType", "")) }
      for ((mimeTuru, listeAkis) in gruplar) {
        sb.append("<AdaptationSet mimeType=\"$mimeTuru\" contentType=\"video\" ")
        sb.append("segmentAlignment=\"true\" subsegmentAlignment=\"true\" ")
        sb.append("startWithSAP=\"1\" subsegmentStartsWithSAP=\"1\" bitstreamSwitching=\"true\">\n")
        for ((i, f) in listeAkis.withIndex()) {
          representationYaz(sb, f, "video_$i")
        }
        sb.append("</AdaptationSet>\n")
      }
    }

    if (sesler.isNotEmpty()) {
      sesler.sortByDescending { it.optLong("bitrate", 0) }
      val gruplar = sesler.groupBy { mimeKok(it.optString("mimeType", "")) }
      for ((mimeTuru, listeAkis) in gruplar) {
        sb.append("<AdaptationSet mimeType=\"$mimeTuru\" contentType=\"audio\" ")
        sb.append("segmentAlignment=\"true\" subsegmentAlignment=\"true\" ")
        sb.append("startWithSAP=\"1\" subsegmentStartsWithSAP=\"1\">\n")
        for ((i, f) in listeAkis.withIndex()) {
          representationYaz(sb, f, "audio_$i")
        }
        sb.append("</AdaptationSet>\n")
      }
    }

    sb.append("</Period>\n")
    sb.append("</MPD>")

    val dosya = File(context.cacheDir, "yt_dash_${System.nanoTime()}.mpd")
    dosya.writeText(sb.toString())
    return dosya.toURI().toString()
  }

  private fun representationYaz(sb: StringBuilder, f: JSONObject, id: String) {
    val url = f.optString("url", "")
    val bitrate = f.optLong("bitrate", 0)
    val itag = f.optInt("itag", 0)
    val mime = f.optString("mimeType", "")
    val codec = kodekCikar(mime)
    val width = f.optInt("width", 0)
    val height = f.optInt("height", 0)
    val fps = f.optInt("fps", 0)
    val audioSampleRate = f.optString("audioSampleRate", "").toIntOrNull()
    val audioChannels = f.optInt("audioChannels", 0)

    sb.append("<Representation id=\"${id}_$itag\" ")
    sb.append("bandwidth=\"$bitrate\" ")
    sb.append("codecs=\"$codec\"")
    if (width > 0) sb.append(" width=\"$width\"")
    if (height > 0) sb.append(" height=\"$height\"")
    if (fps > 0) sb.append(" frameRate=\"$fps\"")
    if (audioSampleRate != null) sb.append(" audioSamplingRate=\"$audioSampleRate\"")
    sb.append(">\n")

    if (audioChannels > 0) {
      sb.append("<AudioChannelConfiguration ")
      sb.append("schemeIdUri=\"urn:mpeg:dash:23003:3:audio_channel_configuration:2011\" ")
      sb.append("value=\"$audioChannels\"/>\n")
    }

    sb.append("<BaseURL>${xmlKacis(url)}</BaseURL>\n")

    val initRange = f.optJSONObject("initRange")
    val indexRange = f.optJSONObject("indexRange")
    if (initRange != null && indexRange != null) {
      val initStart = initRange.optString("start", "0")
      val initEnd = initRange.optString("end", "0")
      val indexStart = indexRange.optString("start", "0")
      val indexEnd = indexRange.optString("end", "0")
      sb.append("<SegmentBase indexRange=\"$indexStart-$indexEnd\" indexRangeExact=\"true\">\n")
      sb.append("<Initialization range=\"$initStart-$initEnd\"/>\n")
      sb.append("</SegmentBase>\n")
    }

    sb.append("</Representation>\n")
  }

  private fun mimeKok(mime: String): String {
    val idx = mime.indexOf(';')
    return if (idx > 0) mime.substring(0, idx).trim() else mime.trim()
  }

  private fun kodekCikar(mime: String): String {
    val eslesme = Regex("codecs=\"([^\"]+)\"").find(mime)
    return eslesme?.groupValues?.get(1) ?: "avc1.42E01E"
  }

  private fun xmlKacis(metin: String): String {
    return metin
      .replace("&", "&amp;")
      .replace("<", "&lt;")
      .replace(">", "&gt;")
      .replace("\"", "&quot;")
      .replace("'", "&apos;")
  }
}
