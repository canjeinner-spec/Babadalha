import Foundation

struct Mp4Kutu {
  let tur: String
  let bas: Int
  let govdeBas: Int
  let son: Int

  var govdeAralik: Range<Int> { govdeBas..<son }
}

struct SidxParcasi {
  let sira: Int
  let bas: Int
  let boyut: Int
  let sureSn: Double
}

struct SifreAyari {
  let varsayilanKid: Data
  let varsayilanIvBoyu: Int
  let sema: String
}

struct OrnekSifresi {
  let iv: Data
  let altOrnekler: [(temiz: Int, sifreli: Int)]
}

enum Mp4Ayristirici {
  static func kutular(_ veri: Data, _ aralik: Range<Int>) -> [Mp4Kutu] {
    var sonuc: [Mp4Kutu] = []
    var p = aralik.lowerBound
    while p + 8 <= aralik.upperBound {
      let boyut32 = Int(oku32(veri, p))
      let tur = metin(veri, p + 4, 4)
      var govdeBas = p + 8
      var boyut = boyut32
      if boyut32 == 1 {
        if p + 16 > aralik.upperBound { break }
        boyut = Int(oku64(veri, p + 8))
        govdeBas = p + 16
      } else if boyut32 == 0 {
        boyut = aralik.upperBound - p
      }
      if boyut < 8 { break }
      let son = min(p + boyut, aralik.upperBound)
      if son <= p { break }
      sonuc.append(Mp4Kutu(tur: tur, bas: p, govdeBas: govdeBas, son: son))
      p = son
    }
    return sonuc
  }

  static func bul(_ veri: Data, _ aralik: Range<Int>, _ yol: [String]) -> Mp4Kutu? {
    var mevcut = aralik
    var bulunan: Mp4Kutu?
    for ad in yol {
      guard let k = kutular(veri, mevcut).first(where: { $0.tur == ad }) else { return nil }
      bulunan = k
      mevcut = k.govdeAralik
    }
    return bulunan
  }

  static func hepsiniBul(_ veri: Data, _ aralik: Range<Int>, _ tur: String) -> [Mp4Kutu] {
    var sonuc: [Mp4Kutu] = []
    for k in kutular(veri, aralik) {
      if k.tur == tur { sonuc.append(k) }
      if kapsayici(k.tur) {
        sonuc.append(contentsOf: hepsiniBul(veri, k.govdeAralik, tur))
      }
    }
    return sonuc
  }

  private static func kapsayici(_ tur: String) -> Bool {
    return ["moov", "trak", "mdia", "minf", "stbl", "moof", "traf", "mvex", "edts",
            "stsd", "sinf", "schi", "encv", "enca", "avc1", "hvc1", "hev1", "mp4a", "ac-3", "ec-3"].contains(tur)
  }

  static func sidxCoz(_ veri: Data, _ kutu: Mp4Kutu, veriBaslangici: Int) -> [SidxParcasi] {
    var p = kutu.govdeBas
    let surum = Int(veri[veri.startIndex + p])
    p += 4
    p += 4
    let zamanOlcegi = Double(oku32(veri, p)); p += 4
    if surum == 0 {
      p += 8
    } else {
      p += 16
    }
    p += 2
    let sayi = Int(oku16(veri, p)); p += 2

    var parcalar: [SidxParcasi] = []
    var uzaklik = veriBaslangici
    for i in 0..<sayi {
      if p + 12 > kutu.son { break }
      let ilk = oku32(veri, p)
      let boyut = Int(ilk & 0x7FFF_FFFF)
      let sure = Double(oku32(veri, p + 4))
      p += 12
      parcalar.append(SidxParcasi(
        sira: i,
        bas: uzaklik,
        boyut: boyut,
        sureSn: zamanOlcegi > 0 ? sure / zamanOlcegi : 0
      ))
      uzaklik += boyut
    }
    return parcalar
  }

  static func sifreAyariCikar(_ veri: Data, _ aralik: Range<Int>) -> SifreAyari? {
    for tenc in hepsiniBul(veri, aralik, "tenc") {
      var p = tenc.govdeBas + 4
      p += 1
      p += 1
      let korumali = Int(veri[veri.startIndex + p]); p += 1
      let ivBoyu = Int(veri[veri.startIndex + p]); p += 1
      if korumali == 0 { continue }
      let kid = veri.subdata(in: (veri.startIndex + p)..<(veri.startIndex + p + 16))
      var sema = "cenc"
      if let schm = hepsiniBul(veri, aralik, "schm").first {
        sema = metin(veri, schm.govdeBas + 4, 4)
      }
      return SifreAyari(varsayilanKid: kid, varsayilanIvBoyu: ivBoyu == 0 ? 8 : ivBoyu, sema: sema)
    }
    return nil
  }

  static func initTemizle(_ veri: Data) -> Data {
    var cikti = veri
    let tamAralik = 0..<veri.count

    for encv in hepsiniBul(veri, tamAralik, "encv") {
      turDegistir(&cikti, encv, yeni: gercekTur(veri, encv) ?? "avc1")
    }
    for enca in hepsiniBul(veri, tamAralik, "enca") {
      turDegistir(&cikti, enca, yeni: gercekTur(veri, enca) ?? "mp4a")
    }
    for sinf in hepsiniBul(veri, tamAralik, "sinf") {
      kutuyuBosalt(&cikti, sinf)
    }
    return cikti
  }

  private static func gercekTur(_ veri: Data, _ kutu: Mp4Kutu) -> String? {
    guard let frma = hepsiniBul(veri, kutu.govdeAralik, "frma").first else { return nil }
    return metin(veri, frma.govdeBas, 4)
  }

  private static func turDegistir(_ veri: inout Data, _ kutu: Mp4Kutu, yeni: String) {
    let baytlar = Array(yeni.utf8)
    guard baytlar.count == 4 else { return }
    for i in 0..<4 {
      veri[veri.startIndex + kutu.bas + 4 + i] = baytlar[i]
    }
  }

  private static func kutuyuBosalt(_ veri: inout Data, _ kutu: Mp4Kutu) {
    let bos = Array("free".utf8)
    for i in 0..<4 {
      veri[veri.startIndex + kutu.bas + 4 + i] = bos[i]
    }
  }

  static func sencCoz(_ veri: Data, _ moofAralik: Range<Int>, ivBoyu: Int) -> [OrnekSifresi] {
    guard let senc = hepsiniBul(veri, moofAralik, "senc").first else { return [] }
    var p = senc.govdeBas
    p += 1
    let bayraklar = Int(oku24(veri, p)); p += 3
    let sayi = Int(oku32(veri, p)); p += 4
    let altOrnekVar = (bayraklar & 0x02) != 0

    var sonuc: [OrnekSifresi] = []
    for _ in 0..<sayi {
      if p + ivBoyu > senc.son { break }
      let iv = veri.subdata(in: (veri.startIndex + p)..<(veri.startIndex + p + ivBoyu))
      p += ivBoyu
      var altlar: [(temiz: Int, sifreli: Int)] = []
      if altOrnekVar {
        if p + 2 > senc.son { break }
        let altSayi = Int(oku16(veri, p)); p += 2
        for _ in 0..<altSayi {
          if p + 6 > senc.son { break }
          let temiz = Int(oku16(veri, p))
          let sifreli = Int(oku32(veri, p + 2))
          p += 6
          altlar.append((temiz: temiz, sifreli: sifreli))
        }
      }
      sonuc.append(OrnekSifresi(iv: iv, altOrnekler: altlar))
    }
    return sonuc
  }

  static func trunOrnekBoyutlari(_ veri: Data, _ moofAralik: Range<Int>) -> [Int] {
    var boyutlar: [Int] = []
    for traf in hepsiniBul(veri, moofAralik, "traf") {
      var varsayilanBoyut = 0
      if let tfhd = hepsiniBul(veri, traf.govdeAralik, "tfhd").first {
        var p = tfhd.govdeBas + 1
        let bayraklar = Int(oku24(veri, p)); p += 3
        p += 4
        if (bayraklar & 0x01) != 0 { p += 8 }
        if (bayraklar & 0x02) != 0 { p += 4 }
        if (bayraklar & 0x08) != 0 { p += 4 }
        if (bayraklar & 0x10) != 0 {
          varsayilanBoyut = Int(oku32(veri, p))
          p += 4
        }
      }
      for trun in hepsiniBul(veri, traf.govdeAralik, "trun") {
        var p = trun.govdeBas + 1
        let bayraklar = Int(oku24(veri, p)); p += 3
        let sayi = Int(oku32(veri, p)); p += 4
        if (bayraklar & 0x0001) != 0 { p += 4 }
        if (bayraklar & 0x0004) != 0 { p += 4 }
        let sureVar = (bayraklar & 0x0100) != 0
        let boyutVar = (bayraklar & 0x0200) != 0
        let bayrakVar = (bayraklar & 0x0400) != 0
        let ofsetVar = (bayraklar & 0x0800) != 0
        for _ in 0..<sayi {
          if sureVar { p += 4 }
          if boyutVar {
            boyutlar.append(Int(oku32(veri, p)))
            p += 4
          } else {
            boyutlar.append(varsayilanBoyut)
          }
          if bayrakVar { p += 4 }
          if ofsetVar { p += 4 }
        }
      }
    }
    return boyutlar
  }

  static func oku16(_ veri: Data, _ p: Int) -> UInt16 {
    let i = veri.startIndex + p
    guard i + 2 <= veri.endIndex else { return 0 }
    return (UInt16(veri[i]) << 8) | UInt16(veri[i + 1])
  }

  static func oku24(_ veri: Data, _ p: Int) -> UInt32 {
    let i = veri.startIndex + p
    guard i + 3 <= veri.endIndex else { return 0 }
    return (UInt32(veri[i]) << 16) | (UInt32(veri[i + 1]) << 8) | UInt32(veri[i + 2])
  }

  static func oku32(_ veri: Data, _ p: Int) -> UInt32 {
    let i = veri.startIndex + p
    guard i + 4 <= veri.endIndex else { return 0 }
    return (UInt32(veri[i]) << 24) | (UInt32(veri[i + 1]) << 16) | (UInt32(veri[i + 2]) << 8) | UInt32(veri[i + 3])
  }

  static func oku64(_ veri: Data, _ p: Int) -> UInt64 {
    var deger: UInt64 = 0
    let i = veri.startIndex + p
    guard i + 8 <= veri.endIndex else { return 0 }
    for k in 0..<8 {
      deger = (deger << 8) | UInt64(veri[i + k])
    }
    return deger
  }

  static func metin(_ veri: Data, _ p: Int, _ uzunluk: Int) -> String {
    let i = veri.startIndex + p
    guard i + uzunluk <= veri.endIndex else { return "" }
    return String(decoding: veri[i..<(i + uzunluk)], as: UTF8.self)
  }
}
