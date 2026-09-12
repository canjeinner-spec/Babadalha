package expo.modules.aronplayer

import android.util.Base64
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class MslIstek(private val oturum: MslOturum) {

  fun anahtarDegisimiYuku(yenileme: Boolean): String {
    oturum.anahtarCiftiUret()
    val mesajId = MslOturum.mesajKimligi()
    val baslik = JSONObject()
    baslik.put("sender", oturum.kimlik)
    baslik.put("renewable", true)
    val yetenekler = JSONObject()
    yetenekler.put("compressionalgos", JSONArray().put(""))
    yetenekler.put("languages", JSONArray().put(oturum.dil))
    baslik.put("capabilities", yetenekler)
    baslik.put("messageid", mesajId)
    val anahtarVeri = JSONObject()
    anahtarVeri.put("publickey", MslOturum.base64Varsayilan(oturum.anahtarCifti!!.public.encoded))
    anahtarVeri.put("mechanism", "JWK_RSA")
    anahtarVeri.put("keypairid", "rsaKeypairId")
    val anahtarIstek = JSONObject()
    anahtarIstek.put("scheme", "ASYMMETRIC_WRAPPED")
    anahtarIstek.put("keydata", anahtarVeri)
    baslik.put("keyrequestdata", JSONArray().put(anahtarIstek))

    if (yenileme) {
      if (oturum.kullaniciToken == null) throw Exception("yenileme istegi icin kullanici tokeni yok")
      baslik.put("useridtoken", oturum.kullaniciToken)
      return sifreliBaslik(baslik.toString()) + sifreliYuk("", mesajId)
    }

    val baslikB64 = MslOturum.base64Kodla(baslik.toString().toByteArray())
    val baslikSarma = JSONObject()
    baslikSarma.put("headerdata", baslikB64)
    val varlikKimlik = JSONObject()
    varlikKimlik.put("identity", oturum.kimlik)
    val varlikYetki = JSONObject()
    varlikYetki.put("authdata", varlikKimlik)
    varlikYetki.put("scheme", "NONE")
    baslikSarma.put("entityauthdata", varlikYetki)
    baslikSarma.put("signature", "")

    val yukVeri = JSONObject()
    yukVeri.put("sequencenumber", 1)
    yukVeri.put("messageid", mesajId)
    yukVeri.put("endofmsg", true)
    yukVeri.put("data", "")
    val yukB64 = MslOturum.base64Kodla(yukVeri.toString().toByteArray())
    val yukSarma = JSONObject()
    yukSarma.put("signature", "")
    yukSarma.put("payload", yukB64)
    return baslikSarma.toString() + yukSarma.toString()
  }

  fun manifestYuku(videoId: String): String {
    val mesajId = MslOturum.mesajKimligi()
    return baslik(mesajId) + manifestGovde(videoId, mesajId)
  }

  fun lisansYuku(challenge: String): String {
    val mesajId = MslOturum.mesajKimligi()
    return baslik(mesajId) + lisansGovde(challenge, mesajId)
  }

  fun sahipTokenYuku(): String {
    oturum.anahtarCiftiUret()
    val mesajId = MslOturum.mesajKimligi()
    val bl = JSONObject()
    bl.put("sender", oturum.kimlik)
    bl.put("renewable", true)
    val yet = JSONObject()
    yet.put("compressionalgos", JSONArray().put(""))
    yet.put("languages", JSONArray().put(oturum.dil))
    bl.put("capabilities", yet)
    bl.put("messageid", mesajId)
    val av = JSONObject()
    av.put("publickey", MslOturum.base64Varsayilan(oturum.anahtarCifti!!.public.encoded))
    av.put("mechanism", "JWK_RSA")
    av.put("keypairid", "rsaKeypairId")
    val ai = JSONObject()
    ai.put("scheme", "ASYMMETRIC_WRAPPED")
    ai.put("keydata", av)
    bl.put("keyrequestdata", JSONArray().put(ai))
    val kv = JSONObject()
    kv.put("netflixid", oturum.netflixId)
    kv.put("securenetflixid", oturum.netflixSecureId)
    val ky = JSONObject()
    ky.put("authdata", kv)
    ky.put("scheme", "NETFLIXID")
    bl.put("userauthdata", ky)
    return sifreliBaslik(bl.toString()) + sifreliYuk("", mesajId)
  }

  fun profilDegistirYuku(profilGuid: String): String {
    oturum.anahtarCiftiUret()
    val mesajId = MslOturum.mesajKimligi()
    val bl = JSONObject()
    bl.put("sender", oturum.kimlik)
    bl.put("renewable", true)
    val yet = JSONObject()
    yet.put("compressionalgos", JSONArray().put(""))
    yet.put("languages", JSONArray().put(oturum.dil))
    bl.put("capabilities", yet)
    bl.put("messageid", mesajId)
    val av = JSONObject()
    av.put("publickey", MslOturum.base64Varsayilan(oturum.anahtarCifti!!.public.encoded))
    av.put("mechanism", "JWK_RSA")
    av.put("keypairid", "rsaKeypairId")
    val ai = JSONObject()
    ai.put("scheme", "ASYMMETRIC_WRAPPED")
    ai.put("keydata", av)
    bl.put("keyrequestdata", JSONArray().put(ai))
    val kv = JSONObject()
    kv.put("useridtoken", oturum.sahipToken)
    kv.put("profileguid", profilGuid)
    val ky = JSONObject()
    ky.put("authdata", kv)
    ky.put("scheme", "SWITCH_PROFILE")
    bl.put("userauthdata", ky)
    return sifreliBaslik(bl.toString()) + sifreliYuk("", mesajId)
  }

  private fun baslik(mesajId: Long): String {
    val bl = JSONObject()
    bl.put("compressionalgos", JSONArray().put(""))
    bl.put("languages", JSONArray())
    val ust = JSONObject()
    ust.put("sender", oturum.kimlik)
    ust.put("renewable", false)
    ust.put("nonreplayable", true)
    ust.put("nonreplayableid", 1)
    ust.put("handshake", false)
    ust.put("capabilities", bl)
    ust.put("timestamp", System.currentTimeMillis())
    ust.put("encoderformats", JSONArray())
    ust.put("messageid", mesajId)
    if (oturum.kullaniciToken == null) {
      val kv = JSONObject()
      kv.put("netflixid", oturum.netflixId)
      kv.put("securenetflixid", oturum.netflixSecureId)
      val ky = JSONObject()
      ky.put("authdata", kv)
      ky.put("scheme", "NETFLIXID")
      ust.put("userauthdata", ky)
    } else {
      ust.put("useridtoken", oturum.kullaniciToken)
    }
    return sifreliBaslik(ust.toString())
  }

  private fun sifreliBaslik(veri: String): String {
    val sifrelenmis = oturum.sifreleMsl(veri)
    val sonuc = JSONObject()
    sonuc.put("headerdata", MslOturum.base64Kodla(sifrelenmis.toString().toByteArray()))
    sonuc.put("mastertoken", oturum.anaToken)
    sonuc.put("signature", MslOturum.base64Kodla(oturum.hmacImzala(sifrelenmis.toString().toByteArray())))
    return sonuc.toString()
  }

  private fun sifreliYuk(veri: String, mesajId: Long): String {
    val yukIc = JSONObject()
    yukIc.put("messageid", mesajId)
    yukIc.put("sequencenumber", 1)
    yukIc.put("endofmsg", true)
    yukIc.put("data", if (veri.isEmpty()) "" else MslOturum.base64Kodla(veri.toByteArray()))
    val sifrelenmis = oturum.sifreleMsl(yukIc.toString())
    val sonuc = JSONObject()
    sonuc.put("payload", MslOturum.base64Kodla(sifrelenmis.toString().toByteArray()))
    sonuc.put("signature", MslOturum.base64Kodla(oturum.hmacImzala(sifrelenmis.toString().toByteArray())))
    return sonuc.toString()
  }

  private fun manifestGovde(videoId: String, mesajId: Long): String {
    val profiller = JSONArray()
    ICERIK_PROFILLERI.forEach { profiller.put(it) }
    val govde = JSONObject()
    govde.put("type", "standard")
    govde.put("manifestVersion", "v2")
    govde.put("viewableId", videoId.toInt())
    govde.put("profiles", profiller)
    govde.put("flavor", "STANDARD")
    govde.put("drmType", "playready")
    govde.put("drmVersion", 30)
    govde.put("usePsshBox", true)
    govde.put("isBranching", false)
    govde.put("useHttpsStreams", true)
    govde.put("supportsUnequalizedDownloadables", true)
    govde.put("imageSubtitleHeight", 720)
    govde.put("uiVersion", "shakti-v43acacdd")
    govde.put("uiPlatform", "SHAKTI")
    govde.put("clientVersion", "6.0048.657.911")
    govde.put("platform", "134.0.0")
    govde.put("osVersion", "10.0")
    govde.put("osName", "windows")
    govde.put("supportsPreReleasePin", true)
    govde.put("supportsWatermark", true)
    govde.put("showAllSubDubTracks", true)

    val cikisAciklama = JSONObject()
    cikisAciklama.put("type", "DigitalVideoOutputDescriptor")
    cikisAciklama.put("outputType", "unknown")
    cikisAciklama.put("supportedHdcpVersions", JSONArray().put("2.2"))
    cikisAciklama.put("isHdcpEngaged", true)
    govde.put("videoOutputInfo", JSONArray().put(cikisAciklama))

    val baslikOzel = JSONObject()
    val baslikIc = JSONObject()
    baslikIc.put("unletterboxed", false)
    baslikOzel.put(videoId, baslikIc)
    govde.put("titleSpecificData", baslikOzel)
    govde.put("preferAssistiveAudio", false)
    govde.put("isUIAutoPlay", false)
    govde.put("isNonMember", false)
    govde.put("desiredVmaf", "plus_lts")
    govde.put("desiredSegmentVmaf", "plus_lts")
    govde.put("requestSegmentVmaf", false)
    govde.put("supportsPartialHydration", true)
    govde.put("contentPlaygraph", JSONArray().put("start"))
    govde.put("supportsAdBreakHydration", true)
    govde.put("liveMetadataFormat", "INDEXED_SEGMENT_TEMPLATE")
    govde.put("useBetterTextUrls", true)
    govde.put("liveAdsCapability", "remove")
    val profilGrup = JSONObject()
    profilGrup.put("name", "default")
    profilGrup.put("profiles", profiller)
    govde.put("profileGroups", JSONArray().put(profilGrup))
    govde.put("licenseType", "standard")
    govde.put("xid", MslOturum.manifestXidUret())

    val sarma = JSONObject()
    sarma.put("id", System.currentTimeMillis() * 10000)
    sarma.put("languages", JSONArray().put(oturum.dil))
    sarma.put("params", govde)
    sarma.put("url", "manifest")
    sarma.put("version", 2)
    return sifreliYuk(sarma.toString(), mesajId)
  }

  private fun lisansGovde(challenge: String, mesajId: Long): String {
    val govde = JSONObject()
    govde.put("drmSessionId", MslOturum.base64Kodla(MslOturum.rastgeleIv()))
    govde.put("clientTime", TimeUnit.MILLISECONDS.toSeconds(System.currentTimeMillis()))
    govde.put("challengeBase64", challenge)
    govde.put("xid", MslOturum.xidUret())
    govde.put("clientVersion", "6.0048.657.911")
    govde.put("platform", "134.0.0")
    govde.put("osVersion", "10.0")
    govde.put("osName", "windows")
    val sarma = JSONObject()
    sarma.put("version", 2)
    sarma.put("url", oturum.lisansUrl)
    sarma.put("id", System.currentTimeMillis() * 10)
    sarma.put("languages", JSONArray().put(oturum.dil))
    sarma.put("params", JSONArray().put(govde))
    sarma.put("echo", "drmSessionId")
    return sifreliYuk(sarma.toString(), mesajId)
  }

  companion object {
    val ICERIK_PROFILLERI = listOf(
      "playready-h264mpl22-dash",
      "playready-h264mpl30-dash",
      "playready-h264mpl31-dash",
      "playready-h264mpl40-dash",
      "playready-h264hpl22-dash",
      "playready-h264hpl30-dash",
      "playready-h264hpl31-dash",
      "playready-h264hpl40-dash",
      "heaac-2-dash",
      "heaac-2hq-dash",
      "dfxp-ls-sdh",
      "simplesdh",
      "webvtt-lssdh-ios8",
      "BIF240",
      "BIF320"
    )
  }
}
