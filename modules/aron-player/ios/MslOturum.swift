import CommonCrypto
import Foundation
import Security

final class MslOturum {
  var kimlik = ""
  var dil = "tr"
  var sifrelemeAnahtari: Data?
  var hmacAnahtari: Data?
  var anaToken: [String: Any]?
  var kullaniciToken: [String: Any]?
  var sahipToken: [String: Any]?
  var siraNo = 0
  var anahtarKimligi = ""
  var ozelAnahtar: SecKey?
  var acikAnahtar: SecKey?
  var lisansUrl = ""
  var netflixId = ""
  var netflixSecureId = ""

  func baslat(esn: String, dilKodu: String) {
    kimlik = esn
    dil = dilKoduNormalle(dilKodu)
  }

  private func dilKoduNormalle(_ kod: String) -> String {
    if kod.contains("-") { return kod }
    let ulke = Locale.current.regionCode ?? ""
    if !ulke.isEmpty { return "\(kod)-\(ulke)" }
    return "\(kod)-\(kod.uppercased())"
  }

  func esnUret() -> String {
    let karakterler = Array("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    var metin = "NFCDIE-03-"
    for _ in 0..<30 {
      metin.append(karakterler[Int.random(in: 0..<karakterler.count)])
    }
    return metin
  }

  func anahtarCiftiUret() throws {
    if ozelAnahtar != nil { return }
    let ozellikler: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecAttrKeySizeInBits as String: 2048,
    ]
    var hata: Unmanaged<CFError>?
    guard let ozel = SecKeyCreateRandomKey(ozellikler as CFDictionary, &hata) else {
      throw MslHatasi.kripto("RSA anahtar cifti uretilemedi")
    }
    ozelAnahtar = ozel
    acikAnahtar = SecKeyCopyPublicKey(ozel)
  }

  func acikAnahtarSpki() throws -> Data {
    guard let acikAnahtar else { throw MslHatasi.kripto("acik anahtar yok") }
    var hata: Unmanaged<CFError>?
    guard let pkcs1 = SecKeyCopyExternalRepresentation(acikAnahtar, &hata) as Data? else {
      throw MslHatasi.kripto("acik anahtar disa aktarilamadi")
    }
    return Der.spkiSar(pkcs1)
  }

  func rsaCoz(_ sifreli: Data) throws -> Data {
    guard let ozelAnahtar else { throw MslHatasi.kripto("ozel anahtar yok") }
    var hata: Unmanaged<CFError>?
    guard let cozulmus = SecKeyCreateDecryptedData(
      ozelAnahtar,
      .rsaEncryptionOAEPSHA1,
      sifreli as CFData,
      &hata
    ) as Data? else {
      throw MslHatasi.kripto("RSA cozulemedi")
    }
    return cozulmus
  }

  func sifreleMsl(_ veri: String) throws -> [String: Any] {
    let iv = MslOturum.rastgeleIv()
    let sifrelenmis = try aesSifrele(Data(veri.utf8), iv: iv)
    return [
      "keyid": anahtarKimligi,
      "sha256": "AA==",
      "iv": MslOturum.base64Kodla(iv),
      "ciphertext": MslOturum.base64Kodla(sifrelenmis),
    ]
  }

  func aesSifrele(_ veri: Data, iv: Data) throws -> Data {
    guard let anahtar = sifrelemeAnahtari else { throw MslHatasi.kripto("sifreleme anahtari yok") }
    return try aes(veri, anahtar: anahtar, iv: iv, islem: CCOperation(kCCEncrypt))
  }

  func aesCoz(_ sifreli: Data, iv: Data) throws -> Data {
    guard let anahtar = sifrelemeAnahtari else { throw MslHatasi.kripto("sifreleme anahtari yok") }
    return try aes(sifreli, anahtar: anahtar, iv: iv, islem: CCOperation(kCCDecrypt))
  }

  private func aes(_ veri: Data, anahtar: Data, iv: Data, islem: CCOperation) throws -> Data {
    var cikti = Data(count: veri.count + kCCBlockSizeAES128)
    var tasinan = 0
    let ciktiSayisi = cikti.count

    let durum = cikti.withUnsafeMutableBytes { c in
      veri.withUnsafeBytes { g in
        anahtar.withUnsafeBytes { a in
          iv.withUnsafeBytes { i in
            CCCrypt(
              islem,
              CCAlgorithm(kCCAlgorithmAES),
              CCOptions(kCCOptionPKCS7Padding),
              a.baseAddress, anahtar.count,
              i.baseAddress,
              g.baseAddress, veri.count,
              c.baseAddress, ciktiSayisi,
              &tasinan
            )
          }
        }
      }
    }

    guard durum == kCCSuccess else { throw MslHatasi.kripto("AES islemi basarisiz: \(durum)") }
    cikti.removeSubrange(tasinan..<cikti.count)
    return cikti
  }

  func hmacImzala(_ veri: Data) throws -> Data {
    guard let anahtar = hmacAnahtari else { throw MslHatasi.kripto("hmac anahtari yok") }
    var ozet = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
    veri.withUnsafeBytes { v in
      anahtar.withUnsafeBytes { a in
        CCHmac(CCHmacAlgorithm(kCCHmacAlgSHA256), a.baseAddress, anahtar.count, v.baseAddress, veri.count, &ozet)
      }
    }
    return Data(ozet)
  }

  func tokenGecerliMi(_ token: [String: Any]?) -> (yenilenebilir: Bool, suresiBitti: Bool) {
    guard let token,
          let tokenVeriB64 = token["tokendata"] as? String,
          let ham = Data(base64Encoded: tokenVeriB64, options: [.ignoreUnknownCharacters]),
          let veri = (try? JSONSerialization.jsonObject(with: ham)) as? [String: Any] else {
      return (false, true)
    }
    let simdi = Int64(Date().timeIntervalSince1970)
    let yenilenme = (veri["renewalwindow"] as? NSNumber)?.int64Value ?? 0
    let bitis = (veri["expiration"] as? NSNumber)?.int64Value ?? 0
    return (yenilenme < simdi, bitis <= simdi)
  }

  func durumKaydet() -> String? {
    guard let sifrelemeAnahtari, let hmacAnahtari, let ozelAnahtar else { return nil }
    var hata: Unmanaged<CFError>?
    guard let ozelHam = SecKeyCopyExternalRepresentation(ozelAnahtar, &hata) as Data? else { return nil }

    var oturumAnahtarlari: [String: Any] = [
      "encryptionKey": MslOturum.base64Kodla(sifrelemeAnahtari),
      "hmacKey": MslOturum.base64Kodla(hmacAnahtari),
      "sequenceNumber": siraNo,
    ]
    if let anaToken { oturumAnahtarlari["masterToken"] = anaToken }
    if let kullaniciToken { oturumAnahtarlari["userIdToken"] = kullaniciToken }
    if let sahipToken { oturumAnahtarlari["ownerUserIdToken"] = sahipToken }

    let kok: [String: Any] = [
      "identity": kimlik,
      "sessionKeys": oturumAnahtarlari,
      "keypair": ["privateKey": MslOturum.base64Kodla(ozelHam)],
    ]
    guard let veri = try? JSONSerialization.data(withJSONObject: kok) else { return nil }
    return String(decoding: veri, as: UTF8.self)
  }

  func durumYukle(_ json: String) -> Bool {
    guard let ham = json.data(using: .utf8),
          let kok = (try? JSONSerialization.jsonObject(with: ham)) as? [String: Any],
          let anahtarlar = kok["sessionKeys"] as? [String: Any],
          let cift = kok["keypair"] as? [String: Any],
          let kaydedilenKimlik = kok["identity"] as? String else { return false }

    let esnOneki = kaydedilenKimlik.split(separator: "-").dropLast().joined(separator: "-")
    let mevcutOneki = kimlik.split(separator: "-").dropLast().joined(separator: "-")
    if esnOneki != mevcutOneki { return false }

    guard let sifreB64 = anahtarlar["encryptionKey"] as? String,
          let hmacB64 = anahtarlar["hmacKey"] as? String,
          let sifre = Data(base64Encoded: sifreB64, options: [.ignoreUnknownCharacters]),
          let hmac = Data(base64Encoded: hmacB64, options: [.ignoreUnknownCharacters]),
          let ozelB64 = cift["privateKey"] as? String,
          let ozelHam = Data(base64Encoded: ozelB64, options: [.ignoreUnknownCharacters]) else { return false }

    let ozellikler: [String: Any] = [
      kSecAttrKeyType as String: kSecAttrKeyTypeRSA,
      kSecAttrKeyClass as String: kSecAttrKeyClassPrivate,
      kSecAttrKeySizeInBits as String: 2048,
    ]
    var hata: Unmanaged<CFError>?
    guard let ozel = SecKeyCreateWithData(ozelHam as CFData, ozellikler as CFDictionary, &hata) else { return false }

    sifrelemeAnahtari = sifre
    hmacAnahtari = hmac
    siraNo = (anahtarlar["sequenceNumber"] as? NSNumber)?.intValue ?? 0
    anaToken = anahtarlar["masterToken"] as? [String: Any]
    kullaniciToken = anahtarlar["userIdToken"] as? [String: Any]
    sahipToken = anahtarlar["ownerUserIdToken"] as? [String: Any]
    kimlik = kaydedilenKimlik
    anahtarKimligi = "\(kimlik)_\(siraNo)"
    ozelAnahtar = ozel
    acikAnahtar = SecKeyCopyPublicKey(ozel)
    return true
  }

  static func base64Kodla(_ veri: Data) -> String {
    return veri.base64EncodedString()
  }

  static func base64Coz(_ metin: String) -> Data? {
    return Data(base64Encoded: metin, options: [.ignoreUnknownCharacters])
  }

  static func base64UrlCoz(_ metin: String) -> Data? {
    return CencCozucu.base64UrlCoz(metin)
  }

  static func rastgeleIv() -> Data {
    var iv = [UInt8](repeating: 0, count: 16)
    _ = SecRandomCopyBytes(kSecRandomDefault, iv.count, &iv)
    return Data(iv)
  }

  static func mesajKimligi() -> Int64 {
    return Int64(Double.random(in: 0..<1) * pow(2.0, 52.0))
  }

  static func manifestXidUret() -> String {
    return String(Int32(truncatingIfNeeded: Int64(Date().timeIntervalSince1970 * 1000 * 100_000_000)))
  }

  static func xidUret() -> String {
    return String(Int64(Date().timeIntervalSince1970 * 1000) * 10 + 1610)
  }
}

enum MslHatasi: Error, LocalizedError {
  case kripto(String)
  case protokol(String)
  case netflix(kod: Int, icKod: Int, mesaj: String)

  var errorDescription: String? {
    switch self {
    case .kripto(let m): return "MSL kripto: \(m)"
    case .protokol(let m): return "MSL: \(m)"
    case .netflix(let kod, let icKod, let m):
      return "Netflix MSL hatasi: errorcode=\(kod) internalcode=\(icKod) msg=\(m)"
    }
  }
}

enum Der {
  static func spkiSar(_ pkcs1: Data) -> Data {
    let algoritma = Data([
      0x30, 0x0d,
      0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
      0x05, 0x00,
    ])
    var bitDizisi = Data([0x00])
    bitDizisi.append(pkcs1)
    let bitKutusu = kutu(0x03, bitDizisi)

    var govde = algoritma
    govde.append(bitKutusu)
    return kutu(0x30, govde)
  }

  private static func kutu(_ etiket: UInt8, _ govde: Data) -> Data {
    var sonuc = Data([etiket])
    sonuc.append(uzunluk(govde.count))
    sonuc.append(govde)
    return sonuc
  }

  private static func uzunluk(_ n: Int) -> Data {
    if n < 0x80 { return Data([UInt8(n)]) }
    var baytlar: [UInt8] = []
    var kalan = n
    while kalan > 0 {
      baytlar.insert(UInt8(kalan & 0xFF), at: 0)
      kalan >>= 8
    }
    return Data([0x80 | UInt8(baytlar.count)] + baytlar)
  }
}
