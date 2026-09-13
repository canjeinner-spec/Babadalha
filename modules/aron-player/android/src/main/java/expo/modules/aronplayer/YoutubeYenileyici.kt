package expo.modules.aronplayer

import android.util.Log
import java.util.regex.Pattern

object YoutubeYenileyici {

  private val kilit = Any()

  @Volatile private var videoId: String = ""
  @Volatile private var visitorData: String = ""
  @Volatile private var oturumToken: String = ""
  @Volatile private var uretici: YoutubePoTokenUretici? = null
  @Volatile private var akisCozucu: ((String) -> Map<String, String>)? = null
  @Volatile private var itagAdres: MutableMap<String, String> = mutableMapOf()
  @Volatile private var sonTazeleme: Long = 0L

  fun kaydet(
    videoId: String,
    visitorData: String,
    oturumToken: String,
    uretici: YoutubePoTokenUretici,
    akisCozucu: (String) -> Map<String, String>
  ) {
    synchronized(kilit) {
      this.videoId = videoId
      this.visitorData = visitorData
      this.oturumToken = oturumToken
      this.uretici = uretici
      this.akisCozucu = akisCozucu
      this.itagAdres = mutableMapOf()
      this.sonTazeleme = 0L
    }
  }

  fun suresiDoldu(adres: String): Boolean {
    val m = SURE_KALIBI.matcher(adres)
    if (!m.find()) return false
    val sn = m.group(1)?.toLongOrNull() ?: return false
    return System.currentTimeMillis() / 1000L >= sn - GUVENLIK_PAYI_SN
  }

  fun itagAl(adres: String): String? {
    val m = ITAG_KALIBI.matcher(adres)
    return if (m.find()) m.group(1) else null
  }

  fun potTazele(): String {
    synchronized(kilit) {
      val u = uretici ?: return oturumToken
      val vd = visitorData
      if (vd.isEmpty() || videoId.isEmpty()) return oturumToken
      val yeni = try {
        u.uret(vd, videoId)?.oturumToken.orEmpty()
      } catch (e: Throwable) {
        Log.w(TAG, "pot tazelenemedi: ${e.message}")
        ""
      }
      if (yeni.isNotEmpty()) {
        oturumToken = yeni
        Log.d(TAG, "pot tazelendi")
      }
      return oturumToken
    }
  }

  fun adresTazele(eskiAdres: String): String? {
    val itag = itagAl(eskiAdres) ?: return null
    synchronized(kilit) {
      val onbellek = itagAdres[itag]
      if (onbellek != null && !suresiDoldu(onbellek)) return onbellek

      val simdi = System.currentTimeMillis()
      if (simdi - sonTazeleme < EN_AZ_ARA_MS) return itagAdres[itag]
      sonTazeleme = simdi

      val cozucu = akisCozucu ?: return null
      val vid = videoId
      if (vid.isEmpty()) return null
      return try {
        val harita = cozucu(vid)
        if (harita.isEmpty()) return null
        itagAdres = harita.toMutableMap()
        Log.d(TAG, "akis adresleri tazelendi (${harita.size} itag)")
        itagAdres[itag]
      } catch (e: Throwable) {
        Log.w(TAG, "akis adresleri tazelenemedi: ${e.message}")
        null
      }
    }
  }

  fun guncelPot(): String = oturumToken

  fun temizle() {
    synchronized(kilit) {
      videoId = ""; visitorData = ""; oturumToken = ""
      uretici = null; akisCozucu = null
      itagAdres = mutableMapOf(); sonTazeleme = 0L
    }
  }

  private const val TAG = "YtYenileyici"
  private const val GUVENLIK_PAYI_SN = 60L
  private const val EN_AZ_ARA_MS = 20_000L
  private val SURE_KALIBI: Pattern = Pattern.compile("expire[=/]([0-9]+)")
  private val ITAG_KALIBI: Pattern = Pattern.compile("[?&/]itag[=/]([0-9]+)")
}
