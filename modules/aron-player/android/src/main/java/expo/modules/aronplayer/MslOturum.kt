package expo.modules.aronplayer

import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.security.KeyFactory
import java.security.KeyPair
import java.security.KeyPairGenerator
import java.security.spec.PKCS8EncodedKeySpec
import java.security.spec.X509EncodedKeySpec
import java.security.SecureRandom
import java.util.concurrent.TimeUnit
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

class MslOturum {
  var kimlik: String = ""
  var dil: String = "tr"
  var sifrelemeAnahtari: ByteArray? = null
  var hmacAnahtari: ByteArray? = null
  var anaToken: JSONObject? = null
  var kullaniciToken: JSONObject? = null
  var sahipToken: JSONObject? = null
  var siraNo: Int = 0
  var anahtarKimligi: String = ""
  var anahtarCifti: KeyPair? = null
  var lisansUrl: String = ""
  var anahtarIstegi: String = ""
  var netflixId: String = ""
  var netflixSecureId: String = ""

  fun baslat(esn: String, dilKodu: String) {
    kimlik = esn
    dil = dilKodu
  }

  fun esnUret(): String {
    val karakterler = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    val sb = StringBuilder("NFCDIE-03-")
    val r = SecureRandom()
    repeat(30) { sb.append(karakterler[r.nextInt(karakterler.length)]) }
    return sb.toString()
  }

  fun anahtarCiftiUret() {
    if (anahtarCifti == null) {
      val gen = KeyPairGenerator.getInstance("RSA")
      gen.initialize(2048)
      anahtarCifti = gen.genKeyPair()
    }
  }

  fun sifreleMsl(veri: String): JSONObject {
    val iv = rastgeleIv()
    val sifrelenmis = aessifrele(veri.toByteArray(), iv)
    val sonuc = JSONObject()
    sonuc.put("keyid", anahtarKimligi)
    sonuc.put("sha256", "AA==")
    sonuc.put("iv", base64Kodla(iv))
    sonuc.put("ciphertext", base64Kodla(sifrelenmis))
    return sonuc
  }

  fun aessifrele(veri: ByteArray, iv: ByteArray): ByteArray {
    val anahtar = sifrelemeAnahtari ?: throw IllegalStateException("sifreleme anahtari yok")
    val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
    cipher.init(Cipher.ENCRYPT_MODE, SecretKeySpec(anahtar, "AES"), IvParameterSpec(iv))
    return cipher.doFinal(veri)
  }

  fun aesCoz(sifreli: ByteArray, iv: ByteArray): ByteArray {
    val anahtar = sifrelemeAnahtari ?: throw IllegalStateException("sifreleme anahtari yok")
    val cipher = Cipher.getInstance("AES/CBC/PKCS5PADDING")
    cipher.init(Cipher.DECRYPT_MODE, SecretKeySpec(anahtar, "AES"), IvParameterSpec(iv))
    return cipher.doFinal(sifreli)
  }

  fun hmacImzala(veri: ByteArray): ByteArray {
    val anahtar = hmacAnahtari ?: throw IllegalStateException("hmac anahtari yok")
    val mac = Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(anahtar, "HmacSHA256"))
    return mac.doFinal(veri)
  }

  fun tokenGecerliMi(token: JSONObject?): JSONObject {
    val sonuc = JSONObject()
    if (token == null) {
      sonuc.put("renewable", false)
      sonuc.put("expired", true)
      return sonuc
    }
    val simdi = TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis())
    val tokenVeri = JSONObject(String(Base64.decode(token.getString("tokendata"), Base64.DEFAULT)))
    val yenilenme = tokenVeri.getLong("renewalwindow")
    val bitis = tokenVeri.getLong("expiration")
    sonuc.put("renewable", yenilenme < simdi)
    sonuc.put("expired", bitis <= simdi)
    return sonuc
  }

  fun durumKaydet(): String {
    val oturumAnahtarlari = JSONObject()
    oturumAnahtarlari.put("masterToken", anaToken)
    oturumAnahtarlari.put("userIdToken", kullaniciToken)
    oturumAnahtarlari.put("ownerUserIdToken", sahipToken)
    oturumAnahtarlari.put("encryptionKey", base64Kodla(sifrelemeAnahtari!!))
    oturumAnahtarlari.put("hmacKey", base64Kodla(hmacAnahtari!!))
    oturumAnahtarlari.put("sequenceNumber", siraNo)
    val cifti = anahtarCifti!!
    val ciftJson = JSONObject()
    ciftJson.put("publicKey", base64Kodla(cifti.public.encoded))
    ciftJson.put("privateKey", base64Kodla(cifti.private.encoded))
    val kok = JSONObject()
    kok.put("identity", kimlik)
    kok.put("sessionKeys", oturumAnahtarlari)
    kok.put("keypair", ciftJson)
    return kok.toString()
  }

  fun durumYukle(json: String): Boolean {
    return try {
      val kok = JSONObject(json)
      val anahtarlar = kok.getJSONObject("sessionKeys")
      val cift = kok.getJSONObject("keypair")
      val kaydedilenKimlik = kok.getString("identity")
      val esnOneki = kaydedilenKimlik.split("-").dropLast(1).joinToString("-")
      val mevcutOneki = kimlik.split("-").dropLast(1).joinToString("-")
      if (esnOneki != mevcutOneki) return false
      sifrelemeAnahtari = Base64.decode(anahtarlar.getString("encryptionKey"), Base64.DEFAULT)
      hmacAnahtari = Base64.decode(anahtarlar.getString("hmacKey"), Base64.DEFAULT)
      siraNo = anahtarlar.getInt("sequenceNumber")
      anaToken = anahtarlar.getJSONObject("masterToken")
      if (anahtarlar.has("userIdToken")) kullaniciToken = anahtarlar.getJSONObject("userIdToken")
      if (anahtarlar.has("ownerUserIdToken")) sahipToken = anahtarlar.getJSONObject("ownerUserIdToken")
      kimlik = kaydedilenKimlik
      anahtarKimligi = "${kimlik}_${siraNo}"
      val acikBytes = Base64.decode(cift.getString("publicKey"), Base64.DEFAULT)
      val ozelBytes = Base64.decode(cift.getString("privateKey"), Base64.DEFAULT)
      val fabrika = KeyFactory.getInstance("RSA")
      anahtarCifti = KeyPair(
        fabrika.generatePublic(X509EncodedKeySpec(acikBytes)),
        fabrika.generatePrivate(PKCS8EncodedKeySpec(ozelBytes))
      )
      true
    } catch (e: Throwable) {
      false
    }
  }

  companion object {
    fun base64Kodla(veri: ByteArray): String = Base64.encodeToString(veri, Base64.NO_WRAP)

    fun base64Varsayilan(veri: ByteArray): String = Base64.encodeToString(veri, Base64.DEFAULT)

    fun manifestXidUret(): String = (System.currentTimeMillis() * 1.000000000008E8).toInt().toString()

    fun rastgeleIv(): ByteArray {
      val iv = ByteArray(16)
      SecureRandom().nextBytes(iv)
      return iv
    }

    fun mesajKimligi(): Long = (Math.random() * Math.pow(2.0, 52.0)).toLong()

    fun xidUret(): String = ((System.currentTimeMillis() * 10) + 1610).toString()
  }
}
