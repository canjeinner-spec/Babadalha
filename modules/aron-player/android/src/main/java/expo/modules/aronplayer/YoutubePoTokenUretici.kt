package expo.modules.aronplayer

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.util.Log
import android.webkit.WebView
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.CountDownLatch
import java.util.concurrent.TimeUnit

data class PoTokenSonucu(
  val oturumToken: String,
  val icerikToken: String
)

class YoutubePoTokenUretici(private val context: Context) {

  private val anaIplik = Handler(Looper.getMainLooper())

  @Volatile private var web: WebView? = null
  @Volatile private var integrityToken: String? = null
  @Volatile private var gecerlilikSonu: Long = 0L
  @Volatile var sonHata: String? = null
    private set

  fun uret(visitorData: String, videoId: String): PoTokenSonucu? {
    if (visitorData.isEmpty()) return null
    sonHata = null
    return try {
      hazirla()
      val oturum = tokenBas(visitorData)
      val icerik = tokenBas(videoId)
      if (oturum.isEmpty() && icerik.isEmpty()) null
      else PoTokenSonucu(oturum, icerik)
    } catch (e: Throwable) {
      sonHata = e.message ?: e.javaClass.simpleName
      Log.w(TAG, "potoken uretilemedi: ${e.message}")
      null
    }
  }

  private fun hazirla() {
    if (integrityToken != null && System.currentTimeMillis() < gecerlilikSonu && web != null) return
    val meydan = meydanAl()
    val yorumlayici = yorumlayiciAl(meydan)
    val sayfaSonucu = webViewdeCalistir(meydan, yorumlayici)
    val botguardYanit = sayfaSonucu.optString("botguardResponse", "")
    if (botguardYanit.isEmpty()) throw Exception("botguardResponse bos")
    val jeton = integrityTokenAl(botguardYanit)
    integrityToken = jeton.first
    gecerlilikSonu = System.currentTimeMillis() + (jeton.second * 1000L) - 60_000L
  }

  private fun meydanAl(): JSONObject {
    val govde = JSONObject().apply {
      put("engagementType", "ENGAGEMENT_TYPE_UNBOUND")
      put("context", JSONObject().apply {
        put("client", JSONObject().apply {
          put("clientName", "WEB")
          put("clientVersion", ISTEMCI_SURUM)
          put("hl", "en")
        })
      })
    }
    val yanit = postJson("$INNERTUBE_KOK/att/get?key=$GOOGLE_API_KEY&prettyPrint=false", govde.toString(), true)
    val o = JSONObject(yanit)

    val bg = o.optJSONObject("bgChallenge")
    if (bg != null) {
      val sarmal = bg.optJSONObject("interpreterUrl")
        ?.optString("privateDoNotAccessOrElseTrustedResourceUrlWrappedValue", "")
        .orEmpty()
      val adres = when {
        sarmal.startsWith("//") -> "https:$sarmal"
        else -> sarmal
      }
      return JSONObject().apply {
        put("interpreterUrl", adres)
        put("interpreterHash", bg.optString("interpreterHash", ""))
        put("program", bg.optString("program", ""))
        put("globalName", bg.optString("globalName", ""))
        put("clientExperimentsStateBlob", bg.optString("clientExperimentsStateBlob", ""))
      }
    }

    val duz = o.optString("challenge", "")
    if (duz.isEmpty()) throw Exception("attestation challenge yok (bgChallenge de yok)")
    val cozulmus = String(Base64.decode(duz.replace('-', '+').replace('_', '/'), Base64.DEFAULT), Charsets.UTF_8)
    val dizi = JSONArray(cozulmus)
    val icerik = dizi.optJSONArray(1) ?: throw Exception("challenge bicimi taninmadi")
    return JSONObject().apply {
      put("messageId", icerik.optString(0))
      put("interpreterHash", icerik.optString(3))
      put("program", icerik.optString(4))
      put("globalName", icerik.optString(5))
      put("clientExperimentsStateBlob", icerik.optString(7))
    }
  }

  private fun yorumlayiciAl(meydan: JSONObject): String {
    val adres = meydan.optString("interpreterUrl", "").ifEmpty {
      "https://www.google.com/js/th/${meydan.optString("interpreterHash", "")}.js"
    }
    return try {
      getMetin(adres)
    } catch (e: Throwable) {
      Log.w(TAG, "yorumlayici indirilemedi ($adres): ${e.message}")
      ""
    }
  }

  @SuppressLint("SetJavaScriptEnabled")
  private fun webViewdeCalistir(meydan: JSONObject, yorumlayici: String): JSONObject {
    val kilit = CountDownLatch(1)
    var sonuc = JSONObject()
    var hata: String? = null

    anaIplik.post {
      try {
        val w = web ?: WebView(context).also { web = it }
        w.settings.javaScriptEnabled = true
        w.settings.domStorageEnabled = true
        w.settings.userAgentString = TARAYICI_AJANI
        val html = context.assets.open("aron_potoken.html").use { String(it.readBytes(), Charsets.UTF_8) }
        w.loadDataWithBaseURL("https://www.youtube.com", html, "text/html", "utf-8", null)

        val hazirlikBitis = System.currentTimeMillis() + HAZIRLIK_SURESI
        val sonucBitis = System.currentTimeMillis() + SONUC_SURESI
        val sonucYokla = object : Runnable {
          override fun run() {
            w.evaluateJavascript("window.__potSonuc") { ham ->
              val duz = cozJs(ham)
              when {
                duz.isNotEmpty() && duz != "null" && duz != "undefined" -> {
                  try {
                    sonuc = JSONObject(duz)
                    if (sonuc.has("error")) hata = sonuc.optString("error")
                    else if (sonuc.optString("botguardResponse", "").isEmpty()) {
                      hata = "botguardResponse bos (sayfa sonucu: ${duz.take(120)})"
                    }
                  } catch (e: Throwable) {
                    hata = "js sonucu ayristirilamadi: ${e.message} ham=${duz.take(120)}"
                  }
                  kilit.countDown()
                }
                System.currentTimeMillis() > sonucBitis -> {
                  hata = "botguard sonucu ${SONUC_SURESI} ms icinde gelmedi"
                  kilit.countDown()
                }
                else -> anaIplik.postDelayed(this, 250)
              }
            }
          }
        }
        val calistir = {
          val veri = JSONObject(meydan.toString()).apply {
            put("interpreterJavascript", yorumlayici)
          }
          w.evaluateJavascript("botguardBaslat(" + veri.toString() + ")", null)
          anaIplik.postDelayed(sonucYokla, 300)
        }
        val bekle = object : Runnable {
          override fun run() {
            w.evaluateJavascript("(typeof botguardBaslat)") { tur ->
              val hazir = tur != null && tur.contains("function")
              when {
                hazir -> calistir()
                System.currentTimeMillis() > hazirlikBitis -> {
                  hata = "botguardBaslat sayfada tanimlanmadi (${HAZIRLIK_SURESI} ms beklendi)"
                  kilit.countDown()
                }
                else -> anaIplik.postDelayed(this, 200)
              }
            }
          }
        }
        anaIplik.postDelayed(bekle, 200)
      } catch (e: Throwable) {
        hata = e.message
        kilit.countDown()
      }
    }

    if (!kilit.await(55, TimeUnit.SECONDS)) throw Exception("botguard zaman asimi")
    hata?.let { throw Exception("botguard hatasi: $it") }
    return sonuc
  }

  private fun tokenBas(kimlik: String): String {
    val jeton = integrityToken ?: return ""
    val kilit = CountDownLatch(1)
    var cikti = ""
    anaIplik.post {
      val w = web
      if (w == null) { kilit.countDown(); return@post }
      val js = "(function(){try{" +
        "var t = poTokenUret(webPoSignalOutputGlobal, " + JSONObject.quote(jeton) + ", " + JSONObject.quote(kimlik) + ");" +
        "return JSON.stringify(Array.from(t));" +
        "}catch(e){return JSON.stringify({error:String(e)});}})()"
      w.evaluateJavascript(js) { ham ->
        try {
          val duz = cozJs(ham)
          if (duz.startsWith("[")) {
            val dizi = JSONArray(duz)
            val bayt = ByteArray(dizi.length()) { dizi.getInt(it).toByte() }
            cikti = Base64.encodeToString(bayt, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
          } else {
            Log.w(TAG, "potoken basilamadi: ${duz.take(140)}")
          }
        } catch (e: Throwable) {
          Log.w(TAG, "potoken ayristirilamadi: ${e.message}")
        }
        kilit.countDown()
      }
    }
    kilit.await(15, TimeUnit.SECONDS)
    return cikti
  }

  private fun integrityTokenAl(botguardYanit: String): Pair<String, Long> {
    val govde = JSONArray().apply {
      put(ISTEK_ANAHTARI)
      put(botguardYanit)
    }
    val yanit = postJson(GENERATE_IT_URL, govde.toString(), false)
    val dizi = JSONArray(yanit)
    val jeton = dizi.optString(0, "")
    val sure = dizi.optLong(1, 43200L)
    if (jeton.isEmpty()) throw Exception("integrity token bos")
    return Pair(jeton, sure)
  }

  private fun cozJs(ham: String?): String {
    if (ham.isNullOrEmpty() || ham == "null") return ""
    return if (ham.startsWith("\"")) {
      JSONArray("[$ham]").getString(0)
    } else ham
  }

  private fun postJson(adres: String, govde: String, innertube: Boolean): String {
    val b = URL(adres).openConnection() as HttpURLConnection
    b.requestMethod = "POST"
    b.setRequestProperty("Content-Type", "application/json+protobuf")
    b.setRequestProperty("User-Agent", TARAYICI_AJANI)
    b.setRequestProperty("Origin", "https://www.youtube.com")
    b.setRequestProperty("Referer", "https://www.youtube.com/")
    if (innertube) {
      b.setRequestProperty("Content-Type", "application/json")
      b.setRequestProperty("X-Goog-Api-Key", GOOGLE_API_KEY)
    } else {
      b.setRequestProperty("X-Goog-Api-Key", GOOGLE_API_KEY)
    }
    b.doOutput = true
    b.connectTimeout = 20_000
    b.readTimeout = 20_000
    val os: OutputStream = b.outputStream
    os.write(govde.toByteArray())
    os.flush(); os.close()
    val kod = b.responseCode
    val akis = if (kod in 200..299) b.inputStream else b.errorStream
    val veri = DataInputStream(akis).readBytes()
    b.disconnect()
    val metin = String(veri)
    if (kod !in 200..299) throw Exception("HTTP $kod: ${metin.take(180)}")
    return metin
  }

  private fun getMetin(adres: String): String {
    val b = URL(adres).openConnection() as HttpURLConnection
    b.requestMethod = "GET"
    b.setRequestProperty("User-Agent", TARAYICI_AJANI)
    b.connectTimeout = 20_000
    b.readTimeout = 20_000
    val veri = DataInputStream(b.inputStream).readBytes()
    b.disconnect()
    return String(veri)
  }

  fun yokEt() {
    anaIplik.post {
      try { web?.destroy() } catch (e: Throwable) {}
      web = null
    }
  }

  companion object {
    private const val HAZIRLIK_SURESI = 20_000L
    private const val SONUC_SURESI = 30_000L
    private const val TAG = "YtPoToken"
    private const val GOOGLE_API_KEY = "AIzaSyDyT5W0Jh49F30Pqqtyfdf7pDLFKLJoAnw"
    private const val ISTEK_ANAHTARI = "O43z0dpjhgX20SCx4KAo"
    private const val GENERATE_IT_URL = "https://www.youtube.com/api/jnn/v1/GenerateIT"
    private const val INNERTUBE_KOK = "https://www.youtube.com/youtubei/v1"
    private const val ISTEMCI_SURUM = "2.20240726.00.00"
    private const val TARAYICI_AJANI =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
  }
}
