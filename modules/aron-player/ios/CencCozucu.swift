import CommonCrypto
import Foundation

enum CencCozucu {
  static func anahtarlariCoz(_ jwkJson: Data) -> [Data: Data] {
    var harita: [Data: Data] = [:]
    guard let kok = (try? JSONSerialization.jsonObject(with: jwkJson)) as? [String: Any],
          let dizi = kok["keys"] as? [[String: Any]] else { return harita }
    for girdi in dizi {
      guard let kidB64 = girdi["kid"] as? String,
            let kB64 = girdi["k"] as? String,
            let kid = base64UrlCoz(kidB64),
            let anahtar = base64UrlCoz(kB64) else { continue }
      harita[kid] = anahtar
    }
    return harita
  }

  static func base64UrlCoz(_ metin: String) -> Data? {
    var duz = metin.replacingOccurrences(of: "-", with: "+").replacingOccurrences(of: "_", with: "/")
    let artan = duz.count % 4
    if artan == 2 { duz += "==" } else if artan == 3 { duz += "=" } else if artan == 1 { return nil }
    return Data(base64Encoded: duz)
  }

  static func parcayiCoz(
    _ parca: Data,
    anahtarlar: [Data: Data],
    ayar: SifreAyari
  ) -> Data {
    guard let anahtar = anahtarlar[ayar.varsayilanKid] ?? anahtarlar.values.first else { return parca }

    var cikti = parca
    let tamAralik = 0..<parca.count
    let moofKutulari = Mp4Ayristirici.kutular(parca, tamAralik).filter { $0.tur == "moof" }
    guard !moofKutulari.isEmpty else { return parca }

    for moof in moofKutulari {
      let sifreler = Mp4Ayristirici.sencCoz(parca, moof.govdeAralik, ivBoyu: ayar.varsayilanIvBoyu)
      if sifreler.isEmpty { continue }
      let boyutlar = Mp4Ayristirici.trunOrnekBoyutlari(parca, moof.govdeAralik)
      guard let mdat = Mp4Ayristirici.kutular(parca, moof.son..<parca.count).first(where: { $0.tur == "mdat" }) else { continue }

      var p = mdat.govdeBas
      for (i, sifre) in sifreler.enumerated() {
        let ornekBoyu = i < boyutlar.count ? boyutlar[i] : 0
        if ornekBoyu <= 0 || p + ornekBoyu > mdat.son { break }

        if sifre.altOrnekler.isEmpty {
          ctrCoz(&cikti, aralik: p..<(p + ornekBoyu), anahtar: anahtar, iv: sifre.iv, sayacBaslangic: 0)
        } else {
          var yerel = p
          var blokSayaci = 0
          for alt in sifre.altOrnekler {
            yerel += alt.temiz
            if alt.sifreli > 0 {
              if yerel + alt.sifreli > mdat.son { break }
              ctrCoz(&cikti, aralik: yerel..<(yerel + alt.sifreli), anahtar: anahtar, iv: sifre.iv, sayacBaslangic: blokSayaci)
              blokSayaci += (alt.sifreli + 15) / 16
              yerel += alt.sifreli
            }
          }
        }
        p += ornekBoyu
      }

      sencBosalt(&cikti, parca, moof.govdeAralik)
    }

    return cikti
  }

  private static func sencBosalt(_ cikti: inout Data, _ kaynak: Data, _ moofAralik: Range<Int>) {
    let bos = Array("free".utf8)
    for ad in ["senc", "saiz", "saio"] {
      for kutu in Mp4Ayristirici.hepsiniBul(kaynak, moofAralik, ad) {
        for i in 0..<4 {
          cikti[cikti.startIndex + kutu.bas + 4 + i] = bos[i]
        }
      }
    }
  }

  private static func ctrCoz(
    _ veri: inout Data,
    aralik: Range<Int>,
    anahtar: Data,
    iv: Data,
    sayacBaslangic: Int
  ) {
    var sayac = [UInt8](repeating: 0, count: 16)
    let ivBaytlar = [UInt8](iv)
    for i in 0..<min(16, ivBaytlar.count) { sayac[i] = ivBaytlar[i] }
    if sayacBaslangic > 0 { sayaciArtir(&sayac, sayacBaslangic) }

    let anahtarBaytlar = [UInt8](anahtar)
    var blok = [UInt8](repeating: 0, count: 16)
    var p = aralik.lowerBound

    while p < aralik.upperBound {
      guard aesEcb(anahtarBaytlar, sayac, &blok) else { return }
      let uzunluk = min(16, aralik.upperBound - p)
      for k in 0..<uzunluk {
        veri[veri.startIndex + p + k] ^= blok[k]
      }
      sayaciArtir(&sayac, 1)
      p += uzunluk
    }
  }

  private static func sayaciArtir(_ sayac: inout [UInt8], _ adet: Int) {
    if adet <= 0 { return }
    var tasima = UInt64(adet)
    var i = 15
    while i >= 0 && tasima > 0 {
      let toplam = UInt64(sayac[i]) + (tasima & 0xFF)
      sayac[i] = UInt8(toplam & 0xFF)
      tasima = (tasima >> 8) + (toplam > 0xFF ? 1 : 0)
      i -= 1
    }
  }

  private static func aesEcb(_ anahtar: [UInt8], _ girdi: [UInt8], _ cikti: inout [UInt8]) -> Bool {
    var tasinan = 0
    let durum = anahtar.withUnsafeBufferPointer { a in
      girdi.withUnsafeBufferPointer { g in
        cikti.withUnsafeMutableBufferPointer { c in
          CCCrypt(
            CCOperation(kCCEncrypt),
            CCAlgorithm(kCCAlgorithmAES),
            CCOptions(kCCOptionECBMode),
            a.baseAddress, a.count,
            nil,
            g.baseAddress, g.count,
            c.baseAddress, c.count,
            &tasinan
          )
        }
      }
    }
    return durum == kCCSuccess
  }
}
