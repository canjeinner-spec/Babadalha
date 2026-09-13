package expo.modules.aronplayer

import android.util.Base64
import android.util.Log
import org.json.JSONObject
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

class MslHatasi(val kod: Int, val icKod: Int, mesaj: String) : IllegalStateException(mesaj)

class MslYanit(private val oturum: MslOturum) {

  private fun netflixHatasiKontrol(yanit: String, etiket: String) {
    val ilkParca = try { yanit.substring(0, jsonSiniriBul(yanit)) } catch (e: Throwable) { return }
    val json = try { JSONObject(ilkParca) } catch (e: Throwable) { return }
    if (!json.has("errordata")) return
    val hataVeri = try {
      JSONObject(String(Base64.decode(json.getString("errordata"), Base64.DEFAULT)))
    } catch (e: Throwable) {
      Log.e(TAG, "Netflix MSL hata yaniti cozulemedi [$etiket]: ${yanit.take(300)}")
      throw IllegalStateException("Netflix MSL hata yaniti cozulemedi [$etiket]: ${yanit.take(200)}")
    }
    val kod = hataVeri.optInt("errorcode", -1)
    val ic = hataVeri.optInt("internalcode", -1)
    val mesaj = hataVeri.optString("errormsg", hataVeri.optString("usermsg", ""))
    Log.e(TAG, "Netflix MSL hatasi [$etiket]: errorcode=$kod internalcode=$ic msg=$mesaj")
    throw MslHatasi(kod, ic, "Netflix MSL hatasi [$etiket]: errorcode=$kod internalcode=$ic msg=$mesaj")
  }

  private fun anahtarAdlari(o: JSONObject): String {
    val sb = StringBuilder()
    val it = o.keys()
    while (it.hasNext()) {
      if (sb.isNotEmpty()) sb.append(",")
      sb.append(it.next())
    }
    return sb.toString()
  }

  fun aesCozJson(sifreli: JSONObject): JSONObject? {
    val iv = Base64.decode(sifreli.getString("iv"), Base64.DEFAULT)
    val sifrelenmis = Base64.decode(sifreli.getString("ciphertext"), Base64.DEFAULT)
    return try {
      val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
      cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(oturum.sifrelemeAnahtari, "AES"), IvParameterSpec(iv))
      JSONObject(String(cipher.doFinal(sifrelenmis)))
    } catch (e: Throwable) {
      null
    }
  }

  private fun jsonSiniriBul(metin: String, baslangic: Int = 0): Int {
    var derinlik = 0
    var dizgiIcinde = false
    var oncekiKacis = false
    for (i in baslangic until metin.length) {
      val c = metin[i]
      if (oncekiKacis) {
        oncekiKacis = false
        continue
      }
      when (c) {
        '\\' -> if (dizgiIcinde) oncekiKacis = true
        '"' -> dizgiIcinde = !dizgiIcinde
        '{' -> if (!dizgiIcinde) derinlik++
        '}' -> if (!dizgiIcinde) {
          derinlik--
          if (derinlik == 0) return i + 1
        }
      }
    }
    return metin.length
  }

  private fun baslikVeYukAyir(yanit: String): Pair<String, String> {
    val sinir = jsonSiniriBul(yanit)
    return Pair(yanit.substring(0, sinir), yanit.substring(sinir))
  }

  private fun cokluJsonAyir(metin: String): List<String> {
    val parcalar = mutableListOf<String>()
    var pos = 0
    while (pos < metin.length) {
      val kalan = metin.substring(pos)
      if (kalan.isBlank()) break
      val sinir = jsonSiniriBul(kalan)
      if (sinir <= 0 || sinir == kalan.length && kalan[0] != '{') break
      parcalar.add(kalan.substring(0, sinir))
      pos += sinir
    }
    return parcalar
  }

  fun mslVerisiCoz(yanit: String, etiket: String = "msl"): String {
    netflixHatasiKontrol(yanit, etiket)
    val (baslikMetni, yukMetni) = baslikVeYukAyir(yanit)
    val baslikJson = JSONObject(baslikMetni)
    val baslikVeri = JSONObject(String(Base64.decode(baslikJson.getString("headerdata"), Base64.DEFAULT)))
    val sifreliMi = baslikVeri.has("ciphertext")
    val cozulmusBaslik = if (sifreliMi) aesCozJson(baslikVeri) else baslikVeri
    oturum.sonBaslikTani = "$etiket:sifreli=${if (sifreliMi) 1 else 0}" +
      " coz=${if (cozulmusBaslik == null) "NULL" else "ok"}" +
      " alanlar=[${anahtarAdlari(cozulmusBaslik ?: baslikVeri)}]"
    Log.d(TAG, "yanit baslik tani -> ${oturum.sonBaslikTani}")
    if (cozulmusBaslik != null && cozulmusBaslik.has("useridtoken")) {
      oturum.kullaniciToken = JSONObject(cozulmusBaslik.getString("useridtoken"))
    }

    val yukParcalari = cokluJsonAyir(yukMetni)

    val sb = StringBuilder()
    for (parca in yukParcalari) {
      val yukJson = JSONObject(parca)
      val yukB64 = yukJson.getString("payload")
      val yukIc = JSONObject(String(Base64.decode(yukB64, Base64.DEFAULT)))
      val cozulmusYuk = aesCozJson(yukIc) ?: continue
      val veri = String(Base64.decode(cozulmusYuk.getString("data"), Base64.DEFAULT))
      sb.append(veri)
    }
    return sb.toString()
  }

  fun anahtarDegisimiCoz(yanit: String, etiket: String = "keyexchange"): Int {
    netflixHatasiKontrol(yanit, etiket)
    val baslikVeri = JSONObject(String(Base64.decode(JSONObject(yanit).getString("headerdata"), Base64.DEFAULT)))
    val cozulmus = if (baslikVeri.has("ciphertext")) {
      val c = aesCozJson(baslikVeri)!!
      oturum.kullaniciToken = c.getJSONObject("useridtoken")
      c
    } else {
      baslikVeri
    }

    val anahtarYanit = cozulmus.getJSONObject("keyresponsedata").getJSONObject("keydata")
    val sifrelenmisAes = Base64.decode(anahtarYanit.getString("encryptionkey"), Base64.DEFAULT)
    val sifrelenmisHmac = Base64.decode(anahtarYanit.getString("hmackey"), Base64.DEFAULT)

    val cipher = Cipher.getInstance("RSA/ECB/OAEPPadding")
    cipher.init(Cipher.DECRYPT_MODE, oturum.anahtarCifti!!.private)
    val aesJson = JSONObject(String(cipher.doFinal(sifrelenmisAes)))
    val hmacJson = JSONObject(String(cipher.doFinal(sifrelenmisHmac)))

    oturum.sifrelemeAnahtari = Base64.decode(aesJson.getString("k"), Base64.URL_SAFE)
    oturum.hmacAnahtari = Base64.decode(hmacJson.getString("k"), Base64.URL_SAFE)

    val anaTokenJson = cozulmus.getJSONObject("keyresponsedata").getJSONObject("mastertoken")
    oturum.anaToken = anaTokenJson
    val tokenVeri = JSONObject(String(Base64.decode(anaTokenJson.getString("tokendata"), Base64.NO_WRAP)))
    oturum.siraNo = tokenVeri.getInt("sequencenumber")
    oturum.anahtarKimligi = "${oturum.kimlik}_${oturum.siraNo}"
    return 0
  }

  fun manifestCoz(yanit: String): String {
    val cozulmus = JSONObject(mslVerisiCoz(yanit, "manifest"))
    if (cozulmus.has("result")) {
      val sonuc = cozulmus.getJSONObject("result")
      if (sonuc.has("links")) {
        val baglantilar = sonuc.getJSONObject("links")
        oturum.sonBaslikTani += " links=[${anahtarAdlari(baglantilar)}]"
        if (baglantilar.has("license")) {
          oturum.lisansUrl = baglantilar.getJSONObject("license").getString("href")
        }
      }
      oturum.sonBaslikTani += " kulToken=${if (oturum.kullaniciToken != null) "VAR" else "yok"}"
      return sonuc.toString()
    }
    Log.e(TAG, "manifest yanitinda 'result' yok, ham icerik: ${cozulmus.toString().take(400)}")
    throw IllegalStateException("Netflix manifest beklenmeyen yanit: ${cozulmus.toString().take(200)}")
  }

  fun lisansCoz(yanit: String): String = mslVerisiCoz(yanit, "lisans")

  fun sahipTokenCoz(yanit: String) {
    netflixHatasiKontrol(yanit, "sahiptoken")
    val (baslikMetni, _) = baslikVeYukAyir(yanit)
    val baslikVeri = JSONObject(String(Base64.decode(JSONObject(baslikMetni).getString("headerdata"), Base64.DEFAULT)))
    val cozulmus = aesCozJson(baslikVeri)!!
    oturum.sahipToken = JSONObject(cozulmus.getString("useridtoken"))
  }

  fun profilDegistirCoz(yanit: String) {
    val (baslikMetni, _) = baslikVeYukAyir(yanit)
    val baslikVeri = JSONObject(String(Base64.decode(JSONObject(baslikMetni).getString("headerdata"), Base64.DEFAULT)))
    val cozulmus = aesCozJson(baslikVeri)!!
    oturum.kullaniciToken = JSONObject(cozulmus.getString("useridtoken"))
  }

  companion object {
    private const val TAG = "NetflixMslYanit"
  }
}
