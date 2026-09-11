package expo.modules.aronplayer

import android.content.Context
import android.util.Log
import androidx.media3.common.util.UnstableApi
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
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
    RaveOturum.yapilandir(context)
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
    Log.d(TAG, "anahtar degisimi baslıyor")
    val kaydedilmis = prefs?.getString("msl_data", null)
    if (kaydedilmis != null && oturum.durumYukle(kaydedilmis)) {
      val durum = oturum.tokenGecerliMi(oturum.anaToken)
      if (durum.getBoolean("renewable")) {
        try {
          Log.d(TAG, "ana token yenileniyor")
          val yuk = istek.anahtarDegisimiYuku(true)
          val sonuc = mslPost(NetflixDrmGeriCagri.ROUTER_URL, yuk, "anahtar-yenileme")
          yanit.anahtarDegisimiCoz(sonuc)
          sahipTokenAl()
          kaydet()
          return true
        } catch (e: Throwable) {
          Log.w(TAG, "yenileme basarisiz, bayat kayit temizlenip taze anahtar degisimi: ${e.message}")
          temizle()
        }
      } else if (!durum.getBoolean("expired")) {
        Log.d(TAG, "kayitli ana token gecerli")
        return true
      } else {
        temizle()
      }
    }
    Log.d(TAG, "yeni anahtar cifti uretiliyor")
    oturum.anahtarCiftiUret()
    val yuk = istek.anahtarDegisimiYuku(false)
    val sonuc = mslPost(NetflixDrmGeriCagri.ROUTER_URL, yuk, "anahtar-degisimi")
    yanit.anahtarDegisimiCoz(sonuc)
    Log.d(TAG, "anahtar degisimi tamam")
    sahipTokenAl()
    kaydet()
    return true
  }

  private fun sahipTokenAl() {
    if (oturum.sahipToken != null) return
    if (oturum.kullaniciToken == null) return
    try {
      val yuk = istek.sahipTokenYuku()
      val sonuc = mslPost(NetflixDrmGeriCagri.ROUTER_URL, yuk, "sahip-token")
      yanit.sahipTokenCoz(sonuc)
      Log.d(TAG, "sahip tokeni alindi")
    } catch (e: Throwable) {
      Log.w(TAG, "sahip tokeni alinamadi, devam ediliyor: ${e.message}")
    }
  }

  fun manifestAl(videoId: String): String {
    Log.d(TAG, "manifest isteniyor videoId=$videoId")
    val yuk = istek.manifestYuku(videoId)
    val sonuc = mslPost(NetflixDrmGeriCagri.MANIFEST_URL, yuk, "manifest")
    val manifestJson = yanit.manifestCoz(sonuc)
    Log.d(TAG, "manifest alindi (${manifestJson.length} bayt)")
    kaydet()
    return manifestJson
  }

  fun mpdOlustur(manifestJson: String): String {
    return manifestUretici.jsonDanMpd(manifestJson, context)
  }

  fun lisansAlVeAnahtarCikar() {
    if (!RaveOturum.hazirMi()) {
      throw IllegalStateException("Rave token yok (EXPO_PUBLIC_RAVE_TOKEN ayarlanmamis) — logblob3 cagrilmaz")
    }
    Log.d(TAG, "logblob3 challenge isteniyor")
    val challenge = RaveLogblob.challengeAl(NetflixDrmGeriCagri.GENEL_PSSH)

    val lisansAdresi = oturum.lisansUrl.ifEmpty { NetflixDrmGeriCagri.LISANS_URL }
    val mslYuk = istek.lisansYuku(challenge)
    val mslYaniti = mslPost(lisansAdresi, mslYuk, "lisans")
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
    throw IllegalStateException("Netflix lisans yanitindan licenseResponseBase64 cikarilamadi: ${cozulmus.take(200)}")
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

  private fun mslPost(url: String, yuk: String, etiket: String = "msl"): String {
    val yukBytes = yuk.toByteArray()
    var sonHata: Throwable? = null
    for (deneme in 1..MAKS_DENEME) {
      try {
        return mslGonder(url, yukBytes, etiket)
      } catch (e: SocketTimeoutException) {
        Log.w(TAG, "MSL[$etiket] zaman asimi, deneme $deneme/$MAKS_DENEME")
        sonHata = e
      } catch (e: ConnectException) {
        Log.w(TAG, "MSL[$etiket] baglanti hatasi, deneme $deneme/$MAKS_DENEME")
        sonHata = e
      }
      if (deneme < MAKS_DENEME) Thread.sleep(deneme * 2000L)
    }
    throw IllegalStateException("MSL[$etiket] $MAKS_DENEME denemede basarisiz: $url", sonHata)
  }

  private fun mslGonder(url: String, yukBytes: ByteArray, etiket: String): String {
    val baglanti = URL(url).openConnection() as HttpURLConnection
    try {
      baglanti.requestMethod = "POST"
      baglanti.setRequestProperty("Content-Type", "text/plain")
      baglanti.setRequestProperty("User-Agent", KULLANICI_AJANI)
      baglanti.setRequestProperty("Accept", "*/*")
      baglanti.doOutput = true
      baglanti.connectTimeout = 30_000
      baglanti.readTimeout = 30_000
      baglanti.outputStream.use { os ->
        os.write(yukBytes)
        os.flush()
      }
      val kod = baglanti.responseCode
      if (kod !in 200..299) {
        val hataVeri = baglanti.errorStream?.use { DataInputStream(it).readBytes() }
          ?.let { String(it).take(300) } ?: ""
        Log.e(TAG, "MSL[$etiket] HTTP $kod: $hataVeri")
        throw IllegalStateException("MSL[$etiket] HTTP $kod: $hataVeri")
      }
      Log.d(TAG, "MSL[$etiket] HTTP $kod tamam")
      return baglanti.inputStream.use { String(DataInputStream(it).readBytes()) }
    } finally {
      baglanti.disconnect()
    }
  }

  companion object {
    private const val TAG = "NetflixMsl"
    private const val MAKS_DENEME = 3
    private const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0"
  }
}
