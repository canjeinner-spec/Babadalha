package expo.modules.aronplayer

import android.content.Context
import android.util.Log
import androidx.media3.common.util.UnstableApi
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL

@UnstableApi
class NetflixMslYonetici(private val context: Context) {
  val oturum = MslOturum()
  val istek = MslIstek(oturum)
  val yanit = MslYanit(oturum)
  val manifestUretici = NetflixManifestUretici()
  var drmGeriCagri: NetflixDrmGeriCagri? = null
    private set
  var clearKeyJwk: ByteArray? = null
    private set

  private val prefs = try {
    context.getSharedPreferences("aron_netflix_msl", Context.MODE_PRIVATE)
  } catch (e: Throwable) { null }

  fun baslat(netflixId: String, secureNetflixId: String, dil: String = "tr") {
    val esn = oturum.esnUret()
    oturum.baslat(esn, dil)
    oturum.netflixId = netflixId
    oturum.netflixSecureId = secureNetflixId
    val kaydedilmis = prefs?.getString("msl_data", null)
    if (kaydedilmis != null && oturum.durumYukle(kaydedilmis)) {
      Log.d(TAG, "MSL oturumu diskten yuklendi")
    }
    drmGeriCagri = NetflixDrmGeriCagri(this)
  }

  fun anahtarDegisimi(): Boolean {
    val kaydedilmis = prefs?.getString("msl_data", null)
    if (kaydedilmis != null && oturum.durumYukle(kaydedilmis)) {
      val durum = oturum.tokenGecerliMi(oturum.anaToken)
      if (durum.getBoolean("renewable")) {
        val yuk = istek.anahtarDegisimiYuku(true)
        val sonuc = mslPost(NetflixDrmGeriCagri.MANIFEST_URL, yuk)
        yanit.anahtarDegisimiCoz(sonuc)
        kaydet()
        return true
      }
      if (!durum.getBoolean("expired")) {
        return true
      }
    }
    oturum.anahtarCiftiUret()
    val yuk = istek.anahtarDegisimiYuku(false)
    val sonuc = mslPost(NetflixDrmGeriCagri.MANIFEST_URL, yuk)
    yanit.anahtarDegisimiCoz(sonuc)
    kaydet()
    return true
  }

  fun manifestAl(videoId: String): String {
    val yuk = istek.manifestYuku(videoId)
    val sonuc = mslPost(NetflixDrmGeriCagri.MANIFEST_URL, yuk)
    val manifestJson = yanit.manifestCoz(sonuc)
    kaydet()
    return manifestJson
  }

  fun mpdOlustur(manifestJson: String): String {
    return manifestUretici.jsonDanMpd(manifestJson, context)
  }

  fun lisansAlVeAnahtarCikar(cdmProxyUrl: String, apiAnahtar: String = "") {
    val temiz = cdmProxyUrl.trimEnd('/')
    val challengeYaniti = cdmPost(
      "$temiz/challenge",
      """{"pssh":"${NetflixDrmGeriCagri.GENEL_PSSH}"}""",
      apiAnahtar
    )
    val challengeJson = JSONObject(challengeYaniti)
    if (challengeJson.has("error")) {
      throw IllegalStateException("CDM proxy challenge hatasi: ${challengeJson.getString("error")}")
    }
    val challenge = challengeJson.getString("challenge")
    val oturumKimligi = challengeJson.getString("session_id")

    val lisansAdresi = oturum.lisansUrl.ifEmpty { NetflixDrmGeriCagri.LISANS_URL }
    val mslYuk = istek.lisansYuku(challenge)
    val mslYaniti = mslPost(lisansAdresi, mslYuk)
    val cozulmus = yanit.lisansCoz(mslYaniti)

    val lisansB64 = lisansVerisiCikar(cozulmus)

    val govde = JSONObject()
    govde.put("session_id", oturumKimligi)
    govde.put("license", lisansB64)
    val anahtarYaniti = cdmPost("$temiz/keys", govde.toString(), apiAnahtar)
    val anahtarlar = JSONObject(anahtarYaniti)
    if (anahtarlar.has("error")) {
      throw IllegalStateException("CDM proxy keys hatasi: ${anahtarlar.getString("error")}")
    }
    if (anahtarlar.length() == 0) {
      throw IllegalStateException("CDM proxy'den anahtar donmedi")
    }
    clearKeyJwk = NetflixDrmGeriCagri.clearKeyJwkOlustur(anahtarlar)
    Log.d(TAG, "ClearKey JWK hazirlandi, ${anahtarlar.length()} anahtar")
  }

  private fun lisansVerisiCikar(cozulmus: String): String {
    try {
      val dizi = JSONArray(cozulmus)
      if (dizi.length() > 0) {
        val ilk = dizi.getJSONObject(0)
        val sonuclar = ilk.optJSONArray("result")
        if (sonuclar != null && sonuclar.length() > 0) {
          val sonuc = sonuclar.getJSONObject(0)
          val b64 = sonuc.optString("licenseResponseBase64", "")
          if (b64.isNotEmpty()) return b64
        }
      }
    } catch (_: Exception) { }
    try {
      val json = JSONObject(cozulmus)
      val sonuclar = json.optJSONArray("result")
      if (sonuclar != null && sonuclar.length() > 0) {
        val sonuc = sonuclar.getJSONObject(0)
        val b64 = sonuc.optString("licenseResponseBase64", "")
        if (b64.isNotEmpty()) return b64
      }
    } catch (_: Exception) { }
    throw IllegalStateException("Netflix lisans yanıtından licenseResponseBase64 çıkarılamadı")
  }

  private fun kaydet() {
    try {
      val veri = oturum.durumKaydet()
      prefs?.edit()?.putString("msl_data", veri)?.apply()
    } catch (e: Throwable) {
      Log.w(TAG, "MSL durumu kaydedilemedi", e)
    }
  }

  fun temizle() {
    prefs?.edit()?.remove("msl_data")?.apply()
    oturum.sifrelemeAnahtari = null
    oturum.hmacAnahtari = null
    oturum.anaToken = null
    oturum.kullaniciToken = null
    oturum.sahipToken = null
    clearKeyJwk = null
  }

  private fun mslPost(url: String, yuk: String): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("Content-Type", "text/plain")
    baglanti.setRequestProperty("User-Agent", KULLANICI_AJANI)
    baglanti.setRequestProperty("Accept", "*/*")
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

  private fun cdmPost(url: String, body: String, apiAnahtar: String = ""): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("Content-Type", "application/json")
    baglanti.setRequestProperty("Accept", "application/json")
    if (apiAnahtar.isNotEmpty()) baglanti.setRequestProperty("X-Api-Key", apiAnahtar)
    baglanti.doOutput = true
    baglanti.connectTimeout = 30_000
    baglanti.readTimeout = 45_000
    val os: OutputStream = baglanti.outputStream
    os.write(body.toByteArray())
    os.flush()
    os.close()
    val kod = baglanti.responseCode
    val girdiAkis = if (kod in 200..299) baglanti.inputStream else baglanti.errorStream
    val girdi = DataInputStream(girdiAkis)
    val veri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()
    val yanit = String(veri)
    if (kod !in 200..299) {
      throw IllegalStateException("CDM proxy HTTP $kod: ${yanit.take(300)}")
    }
    return yanit
  }

  companion object {
    private const val TAG = "NetflixMsl"
    private const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0"
  }
}
