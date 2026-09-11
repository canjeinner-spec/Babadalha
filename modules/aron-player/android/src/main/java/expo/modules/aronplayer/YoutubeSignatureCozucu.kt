package expo.modules.aronplayer

import android.util.Log
import org.mozilla.javascript.Context
import org.mozilla.javascript.Scriptable
import java.io.DataInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLDecoder
import java.util.regex.Pattern

class YoutubeSignatureCozucu {

  data class PlayerBetigi(
    val sigFonksiyonu: String,
    val sigFonksiyonAdi: String,
    val nFonksiyonu: String,
    val nFonksiyonAdi: String
  )

  private var onbellekliBetik: PlayerBetigi? = null
  private var onbellekliUrl: String = ""
  private val nOnbellek = LinkedHashMap<String, String>()
  private val nOnbellekMaks = 512

  fun betigiHazirla(playerUrl: String): PlayerBetigi {
    val tam = if (playerUrl.startsWith("//")) "https:$playerUrl"
    else if (playerUrl.startsWith("/")) "https://www.youtube.com$playerUrl"
    else playerUrl
    if (onbellekliBetik != null && onbellekliUrl == tam) return onbellekliBetik!!

    val betikKaynak = betigiIndir(tam)
    val sigAdi = sigFonksiyonAdiCikar(betikKaynak)
      ?: throw Exception("player.js icinde sig fonksiyonu bulunamadi")
    val sigGovde = fonksiyonGovdesiCikar(betikKaynak, sigAdi)
      ?: throw Exception("sig fonksiyonu govdesi cikarilamadi: $sigAdi")
    val sigYardimciAd = yardimciNesneAdiCikar(sigGovde)
    val sigYardimci = if (sigYardimciAd != null) yardimciNesneCikar(betikKaynak, sigYardimciAd) ?: "" else ""
    val sigTam = "$sigYardimci\nvar $sigAdi=function(a){$sigGovde};"

    val nAdi = nFonksiyonAdiCikar(betikKaynak)
      ?: throw Exception("player.js icinde n fonksiyonu bulunamadi")
    val nGovde = nFonksiyonGovdesiCikar(betikKaynak, nAdi)
      ?: throw Exception("n fonksiyonu govdesi cikarilamadi: $nAdi")
    val nTam = "var $nAdi=function(a){$nGovde};"

    val sonuc = PlayerBetigi(sigTam, sigAdi, nTam, nAdi)
    onbellekliBetik = sonuc
    onbellekliUrl = tam
    return sonuc
  }

  fun signatureCipherCoz(signatureCipher: String, betik: PlayerBetigi): String {
    val alanlar = HashMap<String, String>()
    for (parca in signatureCipher.split("&")) {
      val esittir = parca.indexOf('=')
      if (esittir <= 0) continue
      val ad = parca.substring(0, esittir)
      val deger = parca.substring(esittir + 1)
      alanlar[ad] = URLDecoder.decode(deger, "UTF-8")
    }
    val s = alanlar["s"] ?: throw Exception("signatureCipher icinde s yok")
    val sp = alanlar["sp"] ?: "signature"
    val url = alanlar["url"] ?: throw Exception("signatureCipher icinde url yok")
    val cozulmusS = jsCalistir(betik.sigFonksiyonu, betik.sigFonksiyonAdi, s)
    val ayrac = if (url.contains('?')) "&" else "?"
    return "$url$ayrac$sp=${encode(cozulmusS)}"
  }

  fun nCoz(url: String, betik: PlayerBetigi): String {
    val urlNesnesi = try { URL(url) } catch (e: Throwable) { return url }
    val sorgu = urlNesnesi.query ?: return url
    val parcalar = ArrayList<Pair<String, String>>()
    var nParametresi = ""
    var nIndex = -1
    var i = 0
    for (kv in sorgu.split("&")) {
      val esittir = kv.indexOf('=')
      if (esittir <= 0) { parcalar.add(kv to ""); i++; continue }
      val ad = kv.substring(0, esittir)
      val deger = URLDecoder.decode(kv.substring(esittir + 1), "UTF-8")
      if (ad == "n") { nParametresi = deger; nIndex = i }
      parcalar.add(ad to deger)
      i++
    }
    if (nIndex < 0 || nParametresi.isEmpty()) return url

    val onbellekli = synchronized(nOnbellek) { nOnbellek[nParametresi] }
    val cozulmusN = onbellekli ?: try {
      val sonuc = jsCalistir(betik.nFonksiyonu, betik.nFonksiyonAdi, nParametresi)
      synchronized(nOnbellek) {
        if (nOnbellek.size >= nOnbellekMaks) nOnbellek.remove(nOnbellek.keys.first())
        nOnbellek[nParametresi] = sonuc
      }
      sonuc
    } catch (e: Throwable) {
      Log.w(TAG, "n cozulemedi: ${e.message}")
      return url
    }

    parcalar[nIndex] = "n" to cozulmusN
    val yeniSorgu = parcalar.joinToString("&") { (ad, deger) ->
      if (deger.isEmpty()) ad else "$ad=${encode(deger)}"
    }
    val temel = url.substringBefore('?')
    return "$temel?$yeniSorgu"
  }

  private fun jsCalistir(fonksiyon: String, ad: String, giris: String): String {
    val cx = Context.enter()
    return try {
      cx.optimizationLevel = -1
      cx.languageVersion = Context.VERSION_ES6
      val scope = cx.initStandardObjects() as Scriptable
      cx.evaluateString(scope, fonksiyon, "yt", 1, null)
      val fn = scope.get(ad, scope)
      if (fn !is org.mozilla.javascript.Function) throw Exception("fonksiyon degil: $ad")
      val sonuc = fn.call(cx, scope, scope, arrayOf<Any>(giris))
      Context.toString(sonuc)
    } finally {
      Context.exit()
    }
  }

  private fun betigiIndir(url: String): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    baglanti.requestMethod = "GET"
    baglanti.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36")
    baglanti.connectTimeout = 20_000
    baglanti.readTimeout = 20_000
    val girdi = DataInputStream(baglanti.inputStream)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    return String(veri)
  }

  private fun encode(deger: String): String {
    return java.net.URLEncoder.encode(deger, "UTF-8").replace("+", "%20")
  }

  private fun sigFonksiyonAdiCikar(betik: String): String? {
    val kaliplar = listOf(
      """\bm=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(h\.s\)\)""",
      """\bc&&\(c=([a-zA-Z0-9$]{2,})\(decodeURIComponent\(c\)\)""",
      """(?:\b|[^a-zA-Z0-9$])([a-zA-Z0-9$]{2,})\s*=\s*function\(\s*a\s*\)\s*\{\s*a\s*=\s*a\.split\(\s*""\s*\)""",
      """([a-zA-Z0-9$]+)\s*=\s*function\(\s*a\s*\)\s*\{\s*a\s*=\s*a\.split\(\s*""\s*\)\s*;""",
      """(?:\bc\s*&&\s*\(c\s*=\s*|\bsig\|\|)([a-zA-Z0-9$]+)\(""",
      """\.sig\|\|([a-zA-Z0-9$]+)\("""
    )
    for (kalip in kaliplar) {
      val m = Pattern.compile(kalip).matcher(betik)
      if (m.find()) return m.group(1)
    }
    return null
  }

  private fun nFonksiyonAdiCikar(betik: String): String? {
    val kaliplar = listOf(
      """\.get\("n"\)\)&&\(b=([a-zA-Z0-9$]+)(?:\[(\d+)\])?\([a-zA-Z0-9]\)""",
      """\(b=String\.fromCharCode\(110\),c=a\.get\(b\)\)&&\(c=([a-zA-Z0-9$]+)(?:\[(\d+)\])?\([a-zA-Z]\)""",
      """b=a\.get\("n"\)\)&&\(b=([a-zA-Z0-9$]+)(?:\[(\d+)\])?\([a-zA-Z]\)""",
      """\.get\("n"\)\)&&\(b=([a-zA-Z0-9$]+)\[(\d+)\]"""
    )
    for (kalip in kaliplar) {
      val m = Pattern.compile(kalip).matcher(betik)
      if (m.find()) {
        val ad = m.group(1) ?: continue
        val indeks = if (m.groupCount() >= 2) m.group(2) else null
        return if (indeks != null) diziIndeksindenAd(betik, ad, indeks.toInt()) ?: ad
        else ad
      }
    }
    return null
  }

  private fun diziIndeksindenAd(betik: String, dizi: String, indeks: Int): String? {
    val kalip = Pattern.compile("""var\s+""" + Pattern.quote(dizi) + """\s*=\s*\[([^\]]+)\]""")
    val m = kalip.matcher(betik)
    if (!m.find()) return null
    val ic = m.group(1) ?: return null
    val parcalar = ic.split(",").map { it.trim() }
    return parcalar.getOrNull(indeks)
  }

  private fun fonksiyonGovdesiCikar(betik: String, ad: String): String? {
    val kalip1 = Pattern.compile(Pattern.quote(ad) + """\s*=\s*function\s*\(\s*a\s*\)\s*\{([^}]*)\}""")
    val m1 = kalip1.matcher(betik)
    if (m1.find()) return m1.group(1)
    val kalip2 = Pattern.compile("""function\s+""" + Pattern.quote(ad) + """\s*\(\s*a\s*\)\s*\{([^}]*)\}""")
    val m2 = kalip2.matcher(betik)
    if (m2.find()) return m2.group(1)
    return null
  }

  private fun nFonksiyonGovdesiCikar(betik: String, ad: String): String? {
    val kacisAd = Pattern.quote(ad)
    val kaliplar = listOf(
      Pattern.compile(kacisAd + """\s*=\s*function\s*\(\s*a\s*\)\s*\{(.*?return\s+[a-zA-Z0-9_$.]+\.join\(""\)\s*};)""", Pattern.DOTALL),
      Pattern.compile("""function\s+""" + kacisAd + """\s*\(\s*a\s*\)\s*\{(.*?return\s+[a-zA-Z0-9_$.]+\.join\(""\)\s*};)""", Pattern.DOTALL)
    )
    for (kalip in kaliplar) {
      val m = kalip.matcher(betik)
      if (m.find()) {
        val govde = m.group(1) ?: continue
        return govde.removeSuffix("};").trimEnd()
      }
    }
    val genelKalip = Pattern.compile(kacisAd + """\s*=\s*function\s*\(\s*a\s*\)\s*\{""")
    val m = genelKalip.matcher(betik)
    if (!m.find()) return null
    val baslangic = m.end()
    return kucukParantezliGovdeCikar(betik, baslangic)
  }

  private fun yardimciNesneAdiCikar(sigGovde: String): String? {
    val m = Pattern.compile("""([a-zA-Z0-9$]+)\s*\.\s*[a-zA-Z0-9$]+\s*\(\s*a""").matcher(sigGovde)
    return if (m.find()) m.group(1) else null
  }

  private fun yardimciNesneCikar(betik: String, ad: String): String? {
    val kalip = Pattern.compile("""var\s+""" + Pattern.quote(ad) + """\s*=\s*\{""")
    val m = kalip.matcher(betik)
    if (!m.find()) return null
    val baslangic = m.start()
    val icBaslangic = m.end() - 1
    val icBitis = eslesenKapaticiParantez(betik, icBaslangic)
    if (icBitis < 0) return null
    return betik.substring(baslangic, icBitis + 1) + ";"
  }

  private fun kucukParantezliGovdeCikar(betik: String, baslangic: Int): String? {
    var derinlik = 1
    var i = baslangic
    while (i < betik.length && derinlik > 0) {
      val c = betik[i]
      if (c == '{') derinlik++
      else if (c == '}') derinlik--
      i++
    }
    if (derinlik != 0) return null
    return betik.substring(baslangic, i - 1)
  }

  private fun eslesenKapaticiParantez(betik: String, baslangic: Int): Int {
    var derinlik = 0
    var i = baslangic
    while (i < betik.length) {
      val c = betik[i]
      if (c == '{') derinlik++
      else if (c == '}') { derinlik--; if (derinlik == 0) return i }
      i++
    }
    return -1
  }

  companion object {
    private const val TAG = "YtSigCozucu"
  }
}
