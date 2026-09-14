import Foundation

final class MslIstek {
  static let icerikProfilleri = [
    "playready-h264bpl30-dash",
    "playready-h264mpl13-dash",
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
    "BIF320",
  ]

  private let oturum: MslOturum

  init(_ oturum: MslOturum) {
    self.oturum = oturum
  }

  func anahtarDegisimiYuku(yenileme: Bool) throws -> String {
    try oturum.anahtarCiftiUret()
    let mesajId = MslOturum.mesajKimligi()
    let acikB64 = MslOturum.base64Kodla(try oturum.acikAnahtarSpki())

    var baslik: [String: Any] = [
      "sender": oturum.kimlik,
      "renewable": true,
      "capabilities": ["compressionalgos": [""], "languages": [oturum.dil]],
      "messageid": mesajId,
      "keyrequestdata": [[
        "scheme": "ASYMMETRIC_WRAPPED",
        "keydata": [
          "publickey": acikB64,
          "mechanism": "JWK_RSA",
          "keypairid": "rsaKeypairId",
        ],
      ]],
    ]

    if yenileme {
      guard let kullaniciToken = oturum.kullaniciToken else {
        throw MslHatasi.protokol("yenileme istegi icin kullanici tokeni yok")
      }
      baslik["useridtoken"] = kullaniciToken
      return try sifreliBaslik(Json.metin(baslik)) + sifreliYuk("", mesajId: mesajId)
    }

    let baslikSarma: [String: Any] = [
      "headerdata": MslOturum.base64Kodla(Data(Json.metin(baslik).utf8)),
      "entityauthdata": [
        "authdata": ["identity": oturum.kimlik],
        "scheme": "NONE",
      ],
      "signature": "",
    ]

    let yukVeri: [String: Any] = [
      "sequencenumber": 1,
      "messageid": mesajId,
      "endofmsg": true,
      "data": "",
    ]
    let yukSarma: [String: Any] = [
      "signature": "",
      "payload": MslOturum.base64Kodla(Data(Json.metin(yukVeri).utf8)),
    ]

    return Json.metin(baslikSarma) + Json.metin(yukSarma)
  }

  func manifestYuku(videoId: String) throws -> String {
    let mesajId = MslOturum.mesajKimligi()
    return try baslik(mesajId) + manifestGovde(videoId: videoId, mesajId: mesajId)
  }

  func lisansYuku(challenge: String) throws -> String {
    let mesajId = MslOturum.mesajKimligi()
    return try baslik(mesajId) + lisansGovde(challenge: challenge, mesajId: mesajId)
  }

  func sahipTokenYuku() throws -> String {
    let mesajId = MslOturum.mesajKimligi()
    let acikB64 = MslOturum.base64Kodla(try oturum.acikAnahtarSpki())
    let bl: [String: Any] = [
      "sender": oturum.kimlik,
      "renewable": true,
      "capabilities": ["compressionalgos": [""], "languages": [oturum.dil]],
      "messageid": mesajId,
      "keyrequestdata": [[
        "scheme": "ASYMMETRIC_WRAPPED",
        "keydata": ["publickey": acikB64, "mechanism": "JWK_RSA", "keypairid": "rsaKeypairId"],
      ]],
      "userauthdata": [
        "authdata": ["netflixid": oturum.netflixId, "securenetflixid": oturum.netflixSecureId],
        "scheme": "NETFLIXID",
      ],
    ]
    return try sifreliBaslik(Json.metin(bl)) + sifreliYuk("", mesajId: mesajId)
  }

  func profilDegistirYuku(profilGuid: String) throws -> String {
    let mesajId = MslOturum.mesajKimligi()
    let acikB64 = MslOturum.base64Kodla(try oturum.acikAnahtarSpki())
    var kimlikVeri: [String: Any] = ["profileguid": profilGuid]
    if let sahipToken = oturum.sahipToken { kimlikVeri["useridtoken"] = sahipToken }
    let bl: [String: Any] = [
      "sender": oturum.kimlik,
      "renewable": true,
      "capabilities": ["compressionalgos": [""], "languages": [oturum.dil]],
      "messageid": mesajId,
      "keyrequestdata": [[
        "scheme": "ASYMMETRIC_WRAPPED",
        "keydata": ["publickey": acikB64, "mechanism": "JWK_RSA", "keypairid": "rsaKeypairId"],
      ]],
      "userauthdata": ["authdata": kimlikVeri, "scheme": "SWITCH_PROFILE"],
    ]
    return try sifreliBaslik(Json.metin(bl)) + sifreliYuk("", mesajId: mesajId)
  }

  private func baslik(_ mesajId: Int64) throws -> String {
    var ust: [String: Any] = [
      "sender": oturum.kimlik,
      "renewable": false,
      "nonreplayable": true,
      "nonreplayableid": 1,
      "handshake": false,
      "capabilities": ["compressionalgos": [""], "languages": [] as [String]],
      "timestamp": Int64(Date().timeIntervalSince1970 * 1000),
      "encoderformats": [] as [String],
      "messageid": mesajId,
    ]

    if let kimlikTokeni = oturum.kullaniciToken ?? oturum.sahipToken {
      ust["useridtoken"] = kimlikTokeni
    } else {
      ust["userauthdata"] = [
        "authdata": ["netflixid": oturum.netflixId, "securenetflixid": oturum.netflixSecureId],
        "scheme": "NETFLIXID",
      ]
    }

    return try sifreliBaslik(Json.metin(ust))
  }

  private func sifreliBaslik(_ veri: String) throws -> String {
    let sifrelenmis = try oturum.sifreleMsl(veri)
    let sifreliMetin = Json.metin(sifrelenmis)
    let baytlar = Data(sifreliMetin.utf8)
    var sonuc: [String: Any] = [
      "headerdata": MslOturum.base64Kodla(baytlar),
      "signature": MslOturum.base64Kodla(try oturum.hmacImzala(baytlar)),
    ]
    if let anaToken = oturum.anaToken { sonuc["mastertoken"] = anaToken }
    return Json.metin(sonuc)
  }

  private func sifreliYuk(_ veri: String, mesajId: Int64) throws -> String {
    let yukIc: [String: Any] = [
      "messageid": mesajId,
      "sequencenumber": 1,
      "endofmsg": true,
      "data": veri.isEmpty ? "" : MslOturum.base64Kodla(Data(veri.utf8)),
    ]
    let sifrelenmis = try oturum.sifreleMsl(Json.metin(yukIc))
    let sifreliMetin = Json.metin(sifrelenmis)
    let baytlar = Data(sifreliMetin.utf8)
    let sonuc: [String: Any] = [
      "payload": MslOturum.base64Kodla(baytlar),
      "signature": MslOturum.base64Kodla(try oturum.hmacImzala(baytlar)),
    ]
    return Json.metin(sonuc)
  }

  private func manifestGovde(videoId: String, mesajId: Int64) throws -> String {
    let profiller = MslIstek.icerikProfilleri
    var govde: [String: Any] = [
      "type": "standard",
      "manifestVersion": "v2",
      "viewableId": Int(videoId) ?? 0,
      "profiles": profiller,
      "flavor": "STANDARD",
      "drmType": "playready",
      "drmVersion": 30,
      "usePsshBox": true,
      "isBranching": false,
      "useHttpsStreams": true,
      "supportsUnequalizedDownloadables": true,
      "imageSubtitleHeight": 720,
      "uiVersion": "shakti-v43acacdd",
      "uiPlatform": "SHAKTI",
      "clientVersion": "6.0048.657.911",
      "platform": "134.0.0",
      "osVersion": "10.0",
      "osName": "windows",
      "supportsPreReleasePin": true,
      "supportsWatermark": true,
      "showAllSubDubTracks": true,
      "videoOutputInfo": [[
        "type": "DigitalVideoOutputDescriptor",
        "outputType": "unknown",
        "supportedHdcpVersions": ["2.2"],
        "isHdcpEngaged": true,
      ]],
      "titleSpecificData": [videoId: ["unletterboxed": false]],
      "preferAssistiveAudio": false,
      "isUIAutoPlay": false,
      "isNonMember": false,
      "desiredVmaf": "plus_lts",
      "desiredSegmentVmaf": "plus_lts",
      "requestSegmentVmaf": false,
      "supportsPartialHydration": true,
      "contentPlaygraph": ["start"],
      "supportsAdBreakHydration": true,
      "liveMetadataFormat": "INDEXED_SEGMENT_TEMPLATE",
      "useBetterTextUrls": true,
      "liveAdsCapability": "remove",
      "profileGroups": [["name": "default", "profiles": profiller]],
      "licenseType": "standard",
      "xid": MslOturum.manifestXidUret(),
    ]
    govde["showAllSubDubTracks"] = true

    let sarma: [String: Any] = [
      "id": Int64(Date().timeIntervalSince1970 * 1000) * 10000,
      "languages": [oturum.dil],
      "params": govde,
      "url": "manifest",
      "version": 2,
    ]
    return try sifreliYuk(Json.metin(sarma), mesajId: mesajId)
  }

  private func lisansGovde(challenge: String, mesajId: Int64) throws -> String {
    let govde: [String: Any] = [
      "drmSessionId": MslOturum.base64Kodla(MslOturum.rastgeleIv()),
      "clientTime": Int64(Date().timeIntervalSince1970),
      "challengeBase64": challenge,
      "xid": MslOturum.xidUret(),
      "clientVersion": "6.0048.657.911",
      "platform": "134.0.0",
      "osVersion": "10.0",
      "osName": "windows",
    ]
    let sarma: [String: Any] = [
      "version": 2,
      "url": oturum.lisansUrl,
      "id": Int64(Date().timeIntervalSince1970 * 1000) * 10,
      "languages": [oturum.dil],
      "params": [govde],
      "echo": "drmSessionId",
    ]
    return try sifreliYuk(Json.metin(sarma), mesajId: mesajId)
  }
}

enum Json {
  static func metin(_ nesne: Any) -> String {
    guard JSONSerialization.isValidJSONObject(nesne),
          let veri = try? JSONSerialization.data(withJSONObject: nesne, options: []) else {
      return "{}"
    }
    return String(decoding: veri, as: UTF8.self)
  }

  static func nesne(_ metin: String) -> [String: Any]? {
    guard let veri = metin.data(using: .utf8) else { return nil }
    return (try? JSONSerialization.jsonObject(with: veri)) as? [String: Any]
  }
}
