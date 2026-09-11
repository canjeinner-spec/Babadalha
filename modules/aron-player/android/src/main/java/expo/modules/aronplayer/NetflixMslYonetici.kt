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

  fun lisansAlVeAnahtarCikar() {
    val challenge = RaveLogblob.challengeAl(NetflixDrmGeriCagri.GENEL_PSSH)

    val lisansAdresi = oturum.lisansUrl.ifEmpty { NetflixDrmGeriCagri.LISANS_URL }
    val mslYuk = istek.lisansYuku(challenge)
    val mslYaniti = mslPost(lisansAdresi, mslYuk)
    val cozulmus = yanit.lisansCoz(mslYaniti)

    val lisansB64 = lisansVerisiCikar(cozulmus)

    val anahtarlar = RaveLogblob.anahtarlariCikar(lisansB64)
    if (anahtarlar.length() == 0) {
      throw IllegalStateException("logblob3'den anahtar donmedi")
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

  companion object {
    private const val TAG = "NetflixMsl"
    private const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0"
  }
}
