import Foundation

final class MslYanit {
  private let oturum: MslOturum
  private(set) var sonBaslikTani = "-"

  init(_ oturum: MslOturum) {
    self.oturum = oturum
  }

  private func netflixHatasiKontrol(_ yanit: String, _ etiket: String) throws {
    let sinir = jsonSiniriBul(yanit)
    guard sinir > 0, sinir <= yanit.count else { return }
    let ilkParca = String(yanit.prefix(sinir))
    guard let json = Json.nesne(ilkParca), let hataB64 = json["errordata"] as? String else { return }
    guard let ham = MslOturum.base64Coz(hataB64),
          let hataVeri = (try? JSONSerialization.jsonObject(with: ham)) as? [String: Any] else {
      throw MslHatasi.protokol("Netflix MSL hata yaniti cozulemedi [\(etiket)]: \(yanit.prefix(200))")
    }
    let kod = (hataVeri["errorcode"] as? NSNumber)?.intValue ?? -1
    let ic = (hataVeri["internalcode"] as? NSNumber)?.intValue ?? -1
    let mesaj = (hataVeri["errormsg"] as? String) ?? (hataVeri["usermsg"] as? String) ?? ""
    throw MslHatasi.netflix(kod: kod, icKod: ic, mesaj: "[\(etiket)] \(mesaj)")
  }

  func aesCozJson(_ sifreli: [String: Any]) -> [String: Any]? {
    guard let ivB64 = sifreli["iv"] as? String,
          let metinB64 = sifreli["ciphertext"] as? String,
          let iv = MslOturum.base64Coz(ivB64),
          let sifrelenmis = MslOturum.base64Coz(metinB64),
          let cozulmus = try? oturum.aesCoz(sifrelenmis, iv: iv) else { return nil }
    return (try? JSONSerialization.jsonObject(with: cozulmus)) as? [String: Any]
  }

  private func jsonSiniriBul(_ metin: String, baslangic: Int = 0) -> Int {
    let baytlar = Array(metin.utf8)
    var derinlik = 0
    var dizgiIcinde = false
    var oncekiKacis = false
    var i = baslangic
    while i < baytlar.count {
      let c = baytlar[i]
      if oncekiKacis {
        oncekiKacis = false
        i += 1
        continue
      }
      switch c {
      case 0x5C: if dizgiIcinde { oncekiKacis = true }
      case 0x22: dizgiIcinde.toggle()
      case 0x7B: if !dizgiIcinde { derinlik += 1 }
      case 0x7D:
        if !dizgiIcinde {
          derinlik -= 1
          if derinlik == 0 { return i + 1 }
        }
      default: break
      }
      i += 1
    }
    return baytlar.count
  }

  private func baslikVeYukAyir(_ yanit: String) -> (String, String) {
    let sinir = jsonSiniriBul(yanit)
    let baytlar = Array(yanit.utf8)
    guard sinir <= baytlar.count else { return (yanit, "") }
    let bas = String(decoding: baytlar[0..<sinir], as: UTF8.self)
    let kuyruk = String(decoding: baytlar[sinir...], as: UTF8.self)
    return (bas, kuyruk)
  }

  private func cokluJsonAyir(_ metin: String) -> [String] {
    var parcalar: [String] = []
    var kalanMetin = metin
    while !kalanMetin.isEmpty {
      if kalanMetin.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { break }
      let sinir = jsonSiniriBul(kalanMetin)
      let baytlar = Array(kalanMetin.utf8)
      if sinir <= 0 || sinir > baytlar.count { break }
      if sinir == baytlar.count, baytlar.first != 0x7B { break }
      parcalar.append(String(decoding: baytlar[0..<sinir], as: UTF8.self))
      kalanMetin = String(decoding: baytlar[sinir...], as: UTF8.self)
    }
    return parcalar
  }

  func mslVerisiCoz(_ yanit: String, etiket: String = "msl") throws -> String {
    try netflixHatasiKontrol(yanit, etiket)
    let (baslikMetni, yukMetni) = baslikVeYukAyir(yanit)

    guard let baslikJson = Json.nesne(baslikMetni),
          let baslikB64 = baslikJson["headerdata"] as? String,
          let baslikHam = MslOturum.base64Coz(baslikB64),
          let baslikVeri = (try? JSONSerialization.jsonObject(with: baslikHam)) as? [String: Any] else {
      throw MslHatasi.protokol("yanit basligi cozulemedi [\(etiket)]")
    }

    let sifreliMi = baslikVeri["ciphertext"] != nil
    let cozulmusBaslik = sifreliMi ? aesCozJson(baslikVeri) : baslikVeri
    let alanlar = (cozulmusBaslik ?? baslikVeri).keys.sorted().joined(separator: ",")
    sonBaslikTani = "\(etiket):sifreli=\(sifreliMi ? 1 : 0) coz=\(cozulmusBaslik == nil ? "NULL" : "ok") alanlar=[\(alanlar)]"

    if let cozulmusBaslik, let tokenMetni = cozulmusBaslik["useridtoken"] as? String {
      oturum.kullaniciToken = Json.nesne(tokenMetni)
    }

    var birikmis = ""
    for parca in cokluJsonAyir(yukMetni) {
      guard let yukJson = Json.nesne(parca),
            let yukB64 = yukJson["payload"] as? String,
            let yukHam = MslOturum.base64Coz(yukB64),
            let yukIc = (try? JSONSerialization.jsonObject(with: yukHam)) as? [String: Any],
            let cozulmusYuk = aesCozJson(yukIc),
            let veriB64 = cozulmusYuk["data"] as? String,
            let veri = MslOturum.base64Coz(veriB64) else { continue }
      birikmis += String(decoding: veri, as: UTF8.self)
    }
    return birikmis
  }

  func anahtarDegisimiCoz(_ yanit: String, etiket: String = "keyexchange") throws {
    try netflixHatasiKontrol(yanit, etiket)
    guard let kok = Json.nesne(yanit),
          let baslikB64 = kok["headerdata"] as? String,
          let baslikHam = MslOturum.base64Coz(baslikB64),
          let baslikVeri = (try? JSONSerialization.jsonObject(with: baslikHam)) as? [String: Any] else {
      throw MslHatasi.protokol("anahtar degisimi basligi cozulemedi")
    }

    let cozulmus: [String: Any]
    if baslikVeri["ciphertext"] != nil {
      guard let c = aesCozJson(baslikVeri) else {
        throw MslHatasi.protokol("anahtar degisimi basligi acilamadi")
      }
      cozulmus = c
    } else {
      cozulmus = baslikVeri
    }

    guard let anahtarYanit = cozulmus["keyresponsedata"] as? [String: Any],
          let anahtarVeri = anahtarYanit["keydata"] as? [String: Any],
          let aesB64 = anahtarVeri["encryptionkey"] as? String,
          let hmacB64 = anahtarVeri["hmackey"] as? String,
          let sifreliAes = MslOturum.base64Coz(aesB64),
          let sifreliHmac = MslOturum.base64Coz(hmacB64) else {
      throw MslHatasi.protokol("keyresponsedata eksik")
    }

    let aesJsonHam = try oturum.rsaCoz(sifreliAes)
    let hmacJsonHam = try oturum.rsaCoz(sifreliHmac)

    guard let aesJson = (try? JSONSerialization.jsonObject(with: aesJsonHam)) as? [String: Any],
          let hmacJson = (try? JSONSerialization.jsonObject(with: hmacJsonHam)) as? [String: Any],
          let aesK = aesJson["k"] as? String,
          let hmacK = hmacJson["k"] as? String,
          let aesAnahtar = MslOturum.base64UrlCoz(aesK),
          let hmacAnahtar = MslOturum.base64UrlCoz(hmacK) else {
      throw MslHatasi.protokol("oturum anahtarlari cozulemedi")
    }

    oturum.sifrelemeAnahtari = aesAnahtar
    oturum.hmacAnahtari = hmacAnahtar

    guard let anaTokenJson = anahtarYanit["mastertoken"] as? [String: Any],
          let tokenB64 = anaTokenJson["tokendata"] as? String,
          let tokenHam = MslOturum.base64Coz(tokenB64),
          let tokenVeri = (try? JSONSerialization.jsonObject(with: tokenHam)) as? [String: Any] else {
      throw MslHatasi.protokol("mastertoken cozulemedi")
    }

    oturum.anaToken = anaTokenJson
    oturum.siraNo = (tokenVeri["sequencenumber"] as? NSNumber)?.intValue ?? 0
    oturum.anahtarKimligi = "\(oturum.kimlik)_\(oturum.siraNo)"
  }

  func manifestCoz(_ yanit: String) throws -> String {
    let ham = try mslVerisiCoz(yanit, etiket: "manifest")
    guard let cozulmus = Json.nesne(ham) else {
      throw MslHatasi.protokol("manifest yaniti okunamadi: \(ham.prefix(200))")
    }
    guard let sonuc = cozulmus["result"] as? [String: Any] else {
      throw MslHatasi.protokol("Netflix manifest beklenmeyen yanit: \(ham.prefix(200))")
    }
    if let baglantilar = sonuc["links"] as? [String: Any],
       let lisans = baglantilar["license"] as? [String: Any],
       let href = lisans["href"] as? String {
      oturum.lisansUrl = href
    }
    return Json.metin(sonuc)
  }

  func lisansCoz(_ yanit: String) throws -> String {
    return try mslVerisiCoz(yanit, etiket: "lisans")
  }

  func sahipTokenCoz(_ yanit: String) throws {
    try netflixHatasiKontrol(yanit, "sahiptoken")
    let (baslikMetni, _) = baslikVeYukAyir(yanit)
    guard let kok = Json.nesne(baslikMetni),
          let baslikB64 = kok["headerdata"] as? String,
          let baslikHam = MslOturum.base64Coz(baslikB64),
          let baslikVeri = (try? JSONSerialization.jsonObject(with: baslikHam)) as? [String: Any],
          let cozulmus = aesCozJson(baslikVeri),
          let tokenMetni = cozulmus["useridtoken"] as? String else {
      throw MslHatasi.protokol("sahip tokeni cozulemedi")
    }
    oturum.sahipToken = Json.nesne(tokenMetni)
  }

  func profilDegistirCoz(_ yanit: String) throws {
    let (baslikMetni, _) = baslikVeYukAyir(yanit)
    guard let kok = Json.nesne(baslikMetni),
          let baslikB64 = kok["headerdata"] as? String,
          let baslikHam = MslOturum.base64Coz(baslikB64),
          let baslikVeri = (try? JSONSerialization.jsonObject(with: baslikHam)) as? [String: Any],
          let cozulmus = aesCozJson(baslikVeri),
          let tokenMetni = cozulmus["useridtoken"] as? String else {
      throw MslHatasi.protokol("profil degisimi cozulemedi")
    }
    oturum.kullaniciToken = Json.nesne(tokenMetni)
  }
}
