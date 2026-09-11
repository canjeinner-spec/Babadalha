package expo.modules.aronplayer

import android.util.Base64
import android.util.Log
import org.json.JSONObject
import java.io.DataInputStream
import java.io.OutputStream
import java.net.HttpURLConnection
import java.net.URL
import javax.crypto.Cipher
import javax.crypto.Mac
import javax.crypto.spec.IvParameterSpec
import javax.crypto.spec.SecretKeySpec

object RaveLogblob {
  private const val TAG = "RaveLogblob"
  private const val LOGBLOB3_URL = "https://api.red.wemesh.ca/videos/netflix/logblob3"
  private val ANAHTAR = Base64.decode("zry2uQGqhnWuKqCywY2WoQ==", Base64.NO_WRAP)

  fun istek(duzMetin: String): String {
    val sifre = Cipher.getInstance("AES/CBC/PKCS5Padding")
    sifre.init(Cipher.ENCRYPT_MODE, SecretKeySpec(ANAHTAR, "AES"))
    val sifreli = sifre.doFinal(duzMetin.toByteArray())
    val iv = sifre.iv

    val mac = Mac.getInstance("HmacSHA256")
    mac.init(SecretKeySpec(ANAHTAR, "HmacSHA256"))
    val imza = mac.doFinal(duzMetin.toByteArray())

    val govde = JSONObject()
    govde.put("data", Base64.encodeToString(sifreli, Base64.NO_WRAP))
    govde.put("iv", Base64.encodeToString(iv, Base64.NO_WRAP))
    govde.put("signature", Base64.encodeToString(imza, Base64.NO_WRAP))

    val baglanti = URL(LOGBLOB3_URL).openConnection() as HttpURLConnection
    baglanti.requestMethod = "POST"
    baglanti.setRequestProperty("Content-Type", "application/json")
    baglanti.setRequestProperty("Accept", "application/json")
    baglanti.doOutput = true
    baglanti.connectTimeout = 30_000
    baglanti.readTimeout = 30_000
    val os: OutputStream = baglanti.outputStream
    os.write(govde.toString().toByteArray())
    os.flush()
    os.close()

    val kod = baglanti.responseCode
    val akis = if (kod in 200..299) baglanti.inputStream else baglanti.errorStream
    val girdi = DataInputStream(akis)
    val hamVeri = girdi.readBytes()
    girdi.close()
    baglanti.disconnect()

    if (kod !in 200..299) {
      throw IllegalStateException("logblob3 HTTP $kod: ${String(hamVeri).take(300)}")
    }

    val yanitJson = JSONObject(String(hamVeri))
    val sifreliVeri = Base64.decode(yanitJson.getString("data"), Base64.DEFAULT)
    val yanitIv = Base64.decode(yanitJson.getString("iv"), Base64.DEFAULT)
    val cozucu = Cipher.getInstance("AES/CBC/PKCS5Padding")
    cozucu.init(Cipher.DECRYPT_MODE, SecretKeySpec(ANAHTAR, "AES"), IvParameterSpec(yanitIv))
    val cozulmus = cozucu.doFinal(sifreliVeri)
    return String(cozulmus)
  }

  fun challengeAl(psshB64: String): String {
    val duz = """{"init_data": "$psshB64"}"""
    Log.d(TAG, "challenge isteniyor")
    val yanit = istek(duz)
    Log.d(TAG, "challenge alindi")
    val json = JSONObject(yanit)
    return json.getString("challenge")
  }

  fun anahtarlariCikar(lisansB64: String): JSONObject {
    val duz = """{"license": "$lisansB64"}"""
    Log.d(TAG, "anahtarlar isteniyor")
    val yanit = istek(duz)
    Log.d(TAG, "anahtarlar alindi")
    return JSONObject(yanit)
  }
}
