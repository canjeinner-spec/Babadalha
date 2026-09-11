package expo.modules.aronplayer

import android.content.Context
import android.provider.Settings
import android.util.Base64
import android.util.Log
import org.json.JSONObject
import java.io.DataInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.net.URLEncoder
import java.util.UUID
import javax.crypto.Mac
import javax.crypto.spec.SecretKeySpec

object RaveOturum {
  private const val TAG = "RaveOturum"
  private const val PARSE_URL = "https://api.soborol.com/parse/users"
  private const val PARSE_APP_ID = "83a03c48-0f97-4f01-8a80-f603ea2a2270"
  private const val AUTH2_URL = "https://api.red.wemesh.ca/auth2/google/login"
  private const val AUTHLOGIN_URL = "https://api.red.wemesh.ca/auth/login"
  private const val GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
  private const val CLIENT_VERSION = "9.0.28"
  private const val API_VERSION = "4.0"
  private const val KULLANICI_AJANI = "Rave/2328 (9.0.28) (Android 14; Pixel 8; Google redfin; en)"
  private val GIZLI_ANAHTAR = "c3ab8ff13720e8ad9047dd39466b3c8974e592c2fa383d4a3960714caef0c4f2".toByteArray()

  private var appContext: Context? = null
  private var prefs: android.content.SharedPreferences? = null

  private var bearer: String? = null
  private var parseOturum: String? = null
  private var parseId: String? = null
  private var cihazId: String? = null
  private var ssaid: String = ""

  private var googleRefreshToken: String? = null
  private var googleClientId: String? = null
  private var googleClientSecret: String? = null
  private var googleAvatar: String? = null
  private var googleAd: String? = null
  private var googleEposta: String? = null

  fun yapilandir(context: Context) {
    if (appContext != null) return
    appContext = context.applicationContext
    prefs = try {
      appContext!!.getSharedPreferences("aron_rave", Context.MODE_PRIVATE)
    } catch (e: Throwable) { null }
    ssaid = try {
      Settings.Secure.getString(appContext!!.contentResolver, "android_id") ?: ""
    } catch (e: Throwable) { "" }
    cihazId = prefs?.getString("device_id", null) ?: UUID.randomUUID().toString().also {
      prefs?.edit()?.putString("device_id", it)?.apply()
    }
    bearer = prefs?.getString("bearer", null)
    parseOturum = prefs?.getString("parse_oturum", null)
    parseId = prefs?.getString("parse_id", null)
    googleRefreshToken = prefs?.getString("g_refresh", null)
    googleClientId = prefs?.getString("g_client_id", null)
    googleClientSecret = prefs?.getString("g_client_secret", null)
  }

  fun tokenAyarla(parseToken: String?, refreshToken: String?, clientId: String?, clientSecret: String?) {
    if (!parseToken.isNullOrEmpty()) {
      parseOturum = if (parseToken.startsWith("r:")) parseToken else "r:$parseToken"
      bearer = parseOturum!!.removePrefix("r:")
      prefs?.edit()?.putString("bearer", bearer)?.putString("parse_oturum", parseOturum)?.apply()
    }
    if (!refreshToken.isNullOrEmpty()) {
      googleRefreshToken = refreshToken
      prefs?.edit()?.putString("g_refresh", refreshToken)?.apply()
    }
    if (!clientId.isNullOrEmpty()) {
      googleClientId = clientId
      prefs?.edit()?.putString("g_client_id", clientId)?.apply()
    }
    if (!clientSecret.isNullOrEmpty()) {
      googleClientSecret = clientSecret
      prefs?.edit()?.putString("g_client_secret", clientSecret)?.apply()
    }
  }

  fun hazirMi(): Boolean = !bearer.isNullOrEmpty()

  fun basliklar(govdeUzunlugu: Int): Map<String, String> {
    val token = bearer ?: throw IllegalStateException("Rave oturumu yok")
    val ts = System.currentTimeMillis()
    val ozet = istekOzeti(token, ts, govdeUzunlugu)
    return mapOf(
      "Content-Type" to "application/json",
      "Accept" to "application/json",
      "Client-Version" to CLIENT_VERSION,
      "WeMesh-API-Version" to API_VERSION,
      "WeMesh-Platform" to "android",
      "User-Agent" to KULLANICI_AJANI,
      "ssaid" to ssaid,
      "Authorization" to "Bearer $token",
      "request-hash" to ozet,
      "request-ts" to ts.toString()
    )
  }

  private fun istekOzeti(token: String, ts: Long, govdeUzunlugu: Int): String {
    val girdi = "$ts:$token:$govdeUzunlugu"
    val mac = Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(GIZLI_ANAHTAR, "HmacSHA256"))
    return Base64.encodeToString(mac.doFinal(girdi.toByteArray()), Base64.NO_WRAP)
  }

  @Synchronized
  fun yenile(): Boolean {
    val refresh = googleRefreshToken
    val cid = googleClientId
    val secret = googleClientSecret
    if (refresh.isNullOrEmpty() || cid.isNullOrEmpty() || secret.isNullOrEmpty()) {
      Log.w(TAG, "yenileme icin google refresh yapilandirmasi yok")
      return false
    }
    return try {
      val idToken = googleIdTokenAl(refresh, cid, secret)
      googleIleGiris(idToken)
      true
    } catch (e: Throwable) {
      Log.e(TAG, "oturum yenilenemedi", e)
      false
    }
  }

  fun googleIleGiris(idToken: String) {
    val claims = jwtClaims(idToken)
    val sub = claims.optString("sub", "")
    googleAd = claims.optString("name", "").ifEmpty { null }
    googleEposta = claims.optString("email", "").ifEmpty { null }
    googleAvatar = claims.optString("picture", "").ifEmpty { null }

    val parseGovde = JSONObject().apply {
      put("authData", JSONObject().apply {
        put("google", JSONObject().apply {
          put("id", sub)
          put("id_token", idToken)
        })
      })
    }.toString()
    val parseBasliklar = mapOf(
      "X-Parse-Application-Id" to PARSE_APP_ID,
      "Content-Type" to "application/json"
    )
    val parseYanit = JSONObject(gonder(PARSE_URL, parseGovde.toByteArray(), parseBasliklar))
    parseOturum = parseYanit.getString("sessionToken")
    parseId = parseYanit.getString("objectId")
    bearer = parseOturum!!.removePrefix("r:")
    prefs?.edit()
      ?.putString("bearer", bearer)
      ?.putString("parse_oturum", parseOturum)
      ?.putString("parse_id", parseId)
      ?.apply()

    val kayit = JSONObject().apply {
      put("deviceId", cihazId)
      put("parseId", parseId)
      put("parseToken", parseOturum)
      googleAd?.let { put("name", it) }
      googleEposta?.let { put("email", it) }
      put("platId", sub)
      googleAvatar?.let { put("avatar", it) }
      put("lang", "en")
    }.toString().toByteArray()
    gonder(AUTH2_URL, kayit, basliklar(kayit.size))

    val cihaz = JSONObject().apply {
      put("deviceId", cihazId)
      put("lang", "en")
    }.toString().toByteArray()
    try {
      gonder(AUTHLOGIN_URL, cihaz, basliklar(cihaz.size))
    } catch (e: Throwable) {
      Log.w(TAG, "auth/login basarisiz, devam: ${e.message}")
    }
  }

  private fun googleIdTokenAl(refresh: String, cid: String, secret: String): String {
    val govde = buildString {
      append("grant_type=refresh_token")
      append("&refresh_token=").append(URLEncoder.encode(refresh, "UTF-8"))
      append("&client_id=").append(URLEncoder.encode(cid, "UTF-8"))
      append("&client_secret=").append(URLEncoder.encode(secret, "UTF-8"))
    }.toByteArray()
    val yanit = gonder(
      GOOGLE_TOKEN_URL,
      govde,
      mapOf("Content-Type" to "application/x-www-form-urlencoded")
    )
    return JSONObject(yanit).getString("id_token")
  }

  private fun jwtClaims(jwt: String): JSONObject {
    val parca = jwt.split(".")
    if (parca.size < 2) throw IllegalArgumentException("gecersiz jwt")
    val govde = Base64.decode(parca[1], Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING)
    return JSONObject(String(govde))
  }

  private fun gonder(url: String, govde: ByteArray, basliklar: Map<String, String>): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    try {
      baglanti.requestMethod = "POST"
      basliklar.forEach { (k, v) -> baglanti.setRequestProperty(k, v) }
      baglanti.doOutput = true
      baglanti.connectTimeout = 30_000
      baglanti.readTimeout = 30_000
      baglanti.outputStream.use { it.write(govde); it.flush() }
      val kod = baglanti.responseCode
      val akis = if (kod in 200..299) baglanti.inputStream else baglanti.errorStream
      val ham = akis?.use { DataInputStream(it).readBytes() } ?: ByteArray(0)
      if (kod !in 200..299) {
        throw IllegalStateException("$url HTTP $kod: ${String(ham).take(300)}")
      }
      return String(ham)
    } finally {
      baglanti.disconnect()
    }
  }
}
