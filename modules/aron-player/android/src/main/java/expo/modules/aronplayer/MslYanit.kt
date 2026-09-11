package expo.modules.aronplayer

import android.util.Base64
import org.json.JSONObject
import javax.crypto.Cipher
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

class MslYanit(private val oturum: MslOturum) {

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

  fun mslVerisiCoz(yanit: String): String {
    val parcalar = yanit.split("}}")
    val baslikMetni = parcalar[0] + "}}"
    val baslikJson = JSONObject(baslikMetni)
    val baslikVeri = JSONObject(String(Base64.decode(baslikJson.getString("headerdata"), Base64.DEFAULT)))
    val cozulmusBaslik = if (baslikVeri.has("ciphertext")) aesCozJson(baslikVeri) else baslikVeri
    if (cozulmusBaslik != null && cozulmusBaslik.has("useridtoken")) {
      oturum.kullaniciToken = JSONObject(cozulmusBaslik.getString("useridtoken"))
    }

    val yukMetni = parcalar[1]
    val yukParcalari = yukMetni.split("}{").toMutableList()
    if (yukParcalari.size > 1) {
      for (i in yukParcalari.indices) {
        yukParcalari[i] = when (i) {
          0 -> yukParcalari[i] + "}"
          yukParcalari.size - 1 -> "{" + yukParcalari[i]
          else -> "{" + yukParcalari[i] + "}"
        }
      }
    }

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

  fun anahtarDegisimiCoz(yanit: String): Int {
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
    val cozulmus = JSONObject(mslVerisiCoz(yanit))
    if (cozulmus.has("result")) {
      val sonuc = cozulmus.getJSONObject("result")
      if (sonuc.has("links")) {
        val baglantilar = sonuc.getJSONObject("links")
        if (baglantilar.has("license")) {
          oturum.lisansUrl = baglantilar.getJSONObject("license").getString("href")
        }
      }
      return sonuc.toString()
    }
    return cozulmus.toString()
  }

  fun lisansCoz(yanit: String): String = mslVerisiCoz(yanit)

  fun sahipTokenCoz(yanit: String) {
    val parcalar = yanit.split("}}")
    val baslikMetni = parcalar[0] + "}}"
    val baslikVeri = JSONObject(String(Base64.decode(JSONObject(baslikMetni).getString("headerdata"), Base64.DEFAULT)))
    val cozulmus = aesCozJson(baslikVeri)!!
    oturum.sahipToken = JSONObject(cozulmus.getString("useridtoken"))
  }

  fun profilDegistirCoz(yanit: String) {
    val parcalar = yanit.split("}}")
    val baslikMetni = parcalar[0] + "}}"
    val baslikVeri = JSONObject(String(Base64.decode(JSONObject(baslikMetni).getString("headerdata"), Base64.DEFAULT)))
    val cozulmus = aesCozJson(baslikVeri)!!
    oturum.kullaniciToken = JSONObject(cozulmus.getString("useridtoken"))
  }
}
