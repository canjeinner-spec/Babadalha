package expo.modules.aronplayer

import android.content.Context
import android.util.Base64
import android.util.Log
import androidx.media3.common.util.UnstableApi
import org.json.JSONArray
import org.json.JSONObject
import java.io.DataInputStream
import java.net.ConnectException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL
import java.util.concurrent.TimeUnit

@UnstableApi
class NetflixMslYonetici(private val context: Context) {
  val oturum = MslOturum()
  val istek = MslIstek(oturum)
  val yanit = MslYanit(oturum)
  val manifestUretici = NetflixManifestUretici()
  var sonKeYolu = "?"
  var zincirDurum = "-"
  var drmGeriCagri: NetflixDrmGeriCagri? = null
    private set
  var clearKeyJwk: ByteArray? = null
    private set

  private val prefs = try {
    context.getSharedPreferences("aron_netflix_msl", Context.MODE_PRIVATE)
  } catch (e: Throwable) { null }

  fun baslat(netflixId: String, secureNetflixId: String, dil: String = "tr") {
    RaveOturum.yapilandir(context)
    val esn = kalitciEsn()
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
          yanit.anahtarDegisimiCoz(sonuc, "keyexchange-renew")
          sonKeYolu = "renew"
          kaydet()
          return true
        } catch (e: Throwable) {
          Log.w(TAG, "yenileme basarisiz, bayat kayit temizlenip taze anahtar degisimi: ${e.message}")
          temizle(false)
        }
      } else if (!durum.getBoolean("expired")) {
        Log.d(TAG, "kayitli ana token gecerli")
        sonKeYolu = "kayitli-gecerli"
        return true
      } else {
        temizle(false)
      }
    }
    Log.d(TAG, "yeni anahtar cifti uretiliyor")
    val yuk = istek.anahtarDegisimiYuku(false)
    val sonuc = mslPost(NetflixDrmGeriCagri.ROUTER_URL, yuk, "anahtar-degisimi")
    yanit.anahtarDegisimiCoz(sonuc, "keyexchange-fresh")
    Log.d(TAG, "anahtar degisimi tamam")
    sonKeYolu = "fresh"
    kaydet()
    return true
  }

  fun sahipTokenAl() {
    val mevcut = oturum.sahipToken
    if (mevcut != null && !oturum.tokenGecerliMi(mevcut).getBoolean("expired")) {
      zincirDurum = "sahip:kayitli"
      return
    }
    oturum.sahipToken = null
    try {
      val yuk = istek.sahipTokenYuku()
      val sonuc = mslPost(NetflixDrmGeriCagri.ROUTER_URL, yuk, "sahip-token")
      yanit.sahipTokenCoz(sonuc)
      zincirDurum = if (oturum.sahipToken != null) "sahip:ok" else "sahip:bos"
      Log.d(TAG, "sahip tokeni alindi")
    } catch (e: Throwable) {
      zincirDurum = "sahip:HATA(${e.message?.take(60)})"
      Log.w(TAG, "sahip tokeni alinamadi, devam ediliyor: ${e.message}")
    }
  }

  fun kullaniciTokenHazirla() {
    val mevcut = oturum.kullaniciToken
    if (mevcut != null && !oturum.tokenGecerliMi(mevcut).getBoolean("expired")) return
    if (mevcut != null) {
      Log.d(TAG, "kullanici tokeninin suresi dolmus, yeniden aliniyor")
      oturum.kullaniciToken = null
    }
    sahipTokenAl()
    if (oturum.sahipToken == null) return
    kaydet()
    val guid = profilGuidAl()
    if (guid == null) {
      zincirDurum += " guid:YOK"
      return
    }
    try {
      val yuk = istek.profilDegistirYuku(guid)
      val sonuc = mslPost(NetflixDrmGeriCagri.ROUTER_URL, yuk, "profil-degistir")
      yanit.profilDegistirCoz(sonuc)
      kaydet()
      zincirDurum += if (oturum.kullaniciToken != null) " profil:ok" else " profil:bos"
      Log.d(TAG, "kullanici tokeni alindi, manifest artik useridtoken ile gidecek")
    } catch (e: Throwable) {
      zincirDurum += " profil:HATA(${e.message?.take(60)})"
      Log.w(TAG, "profil degistirme basarisiz, sahip tokeniyle devam: ${e.message}")
    }
  }

  private fun profilGuidAl(): String? {
    val kayitli = prefs?.getString(PROFIL_ANAHTARI, null)
    if (!kayitli.isNullOrBlank()) return kayitli
    return try {
      val baglanti = URL(GOZAT_URL).openConnection() as HttpURLConnection
      try {
        baglanti.setRequestProperty(
          "Cookie",
          "NetflixId=${oturum.netflixId}; SecureNetflixId=${oturum.netflixSecureId}"
        )
        baglanti.setRequestProperty("User-Agent", KULLANICI_AJANI)
        baglanti.setRequestProperty("Accept", "text/html")
        baglanti.connectTimeout = 20_000
        baglanti.readTimeout = 20_000
        val govde = baglanti.inputStream.use { String(DataInputStream(it).readBytes()) }
        val guid = Regex("\"userGuid\"\\s*:\\s*\"([^\"]+)\"").find(govde)?.groupValues?.get(1)
        if (guid.isNullOrBlank()) {
          Log.w(TAG, "profil guid sayfada bulunamadi (${govde.length} bayt)")
          null
        } else {
          prefs?.edit()?.putString(PROFIL_ANAHTARI, guid)?.apply()
          Log.d(TAG, "profil guid alindi: $guid")
          guid
        }
      } finally {
        baglanti.disconnect()
      }
    } catch (e: Throwable) {
      Log.w(TAG, "profil guid alinamadi: ${e.message}")
      null
    }
  }

  fun manifestAl(videoId: String): String {
    Log.d(TAG, "manifest isteniyor videoId=$videoId")
    val yuk = istek.manifestYuku(videoId)
    try {
      val sonuc = mslPost(NetflixDrmGeriCagri.MANIFEST_URL, yuk, "manifest")
      val manifestJson = yanit.manifestCoz(sonuc)
      Log.d(TAG, "manifest alindi (${manifestJson.length} bayt)")
      prefs?.edit()?.putString(SON_BASARILI_ANAHTARI, oturum.sonBaslikTani)?.apply()
      kaydet()
      return manifestJson
    } catch (e: Throwable) {
      val ozet = tokenDurumOzeti()
      val varlikReddi = e is MslHatasi && (e.kod == VARLIK_YENIDEN_KIMLIK || e.kod == VARLIK_VERISI_YENIDEN_KIMLIK)
      Log.e(TAG, "manifest basarisiz, msl_data temizleniyor (esnYenile=$varlikReddi) | $ozet", e)
      temizle(varlikReddi)
      throw IllegalStateException("${e.message} || TANI: $ozet", e)
    }
  }

  private fun tokenDurumOzeti(): String {
    val ek = " || SON=${oturum.sonBaslikTani}" +
      " || BASARILI=${prefs?.getString(SON_BASARILI_ANAHTARI, "-")}"
    return try {
      val simdi = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis())
      val kullanici = if (oturum.kullaniciToken != null) "var" else "yok"
      val sahip = if (oturum.sahipToken != null) "var" else "yok"
      val t = oturum.anaToken
        ?: return "keYolu=$sonKeYolu esn=${oturum.kimlik} token=YOK kullaniciToken=$kullanici now=$simdi$ek"
      val td = JSONObject(String(Base64.decode(t.getString("tokendata"), Base64.NO_WRAP)))
      "keYolu=$sonKeYolu esn=${oturum.kimlik} seq=${oturum.siraNo} renewalwindow=${td.optLong("renewalwindow")} expiration=${td.optLong("expiration")} now=$simdi kullaniciToken=$kullanici sahipToken=$sahip zincir=[$zincirDurum]$ek"
    } catch (e: Throwable) {
      "tani-uretilemedi: ${e.message}$ek"
    }
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

    val lisansAdresi = NetflixDrmGeriCagri.LISANS_URL
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

  private fun kalitciEsn(): String {
    val kayitli = prefs?.getString(ESN_ANAHTARI, null)
    if (kayitli != null && kayitli.startsWith("NFCDIE-03")) return kayitli
    val yeni = oturum.esnUret()
    prefs?.edit()?.putString(ESN_ANAHTARI, yeni)?.apply()
    return yeni
  }

  private fun kimlikYenile() {
    val yeni = oturum.esnUret()
    prefs?.edit()?.putString(ESN_ANAHTARI, yeni)?.apply()
    oturum.kimlik = yeni
    oturum.anahtarKimligi = ""
    oturum.siraNo = 0
    Log.d(TAG, "cihaz kimligi yenilendi: $yeni")
  }

  fun temizle(kimlikYenilensin: Boolean = true) {
    prefs?.edit()?.remove("msl_data")?.apply()
    oturum.sifrelemeAnahtari = null
    oturum.hmacAnahtari = null
    oturum.anaToken = null
    oturum.kullaniciToken = null
    oturum.sahipToken = null
    clearKeyJwk = null
    if (kimlikYenilensin) kimlikYenile()
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
    private const val ESN_ANAHTARI = "netflix_esn"
    private const val PROFIL_ANAHTARI = "netflix_profil_guid"
    private const val GOZAT_URL = "https://www.netflix.com/browse"
    private const val VARLIK_YENIDEN_KIMLIK = 3
    private const val VARLIK_VERISI_YENIDEN_KIMLIK = 6
    private const val SON_BASARILI_ANAHTARI = "son_basarili_baslik"
    private const val KULLANICI_AJANI = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36 Edg/134.0.0.0"
  }
}
