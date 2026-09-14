import Foundation

struct Akis {
  let kimlik: String
  let tur: String
  let cdnUrl: String
  let initSon: Int
  let sidxBas: Int
  let sidxSon: Int
  let toplamBoyut: Int
  let kodek: String
  let bant: Int
  let genislik: Int
  let yukseklik: Int
  let dil: String
  let kanal: Int
}

enum NetflixAkis {
  static func coz(_ manifestJson: String) -> [Akis] {
    guard let veri = manifestJson.data(using: .utf8),
          let kok = (try? JSONSerialization.jsonObject(with: veri)) as? [String: Any] else { return [] }

    var sonuc: [Akis] = []

    if let videolar = kok["video_tracks"] as? [[String: Any]], let ilk = videolar.first {
      let akislar = (ilk["streams"] as? [[String: Any]]) ?? (ilk["downloadables"] as? [[String: Any]]) ?? []
      for (i, a) in akislar.enumerated() {
        guard let akis = akisCoz(a, kimlik: "video_\(i)", tur: "video", dil: "und") else { continue }
        sonuc.append(akis)
      }
    }

    if let sesler = kok["audio_tracks"] as? [[String: Any]] {
      for (j, iz) in sesler.enumerated() {
        let dil = (iz["language"] as? String) ?? "und"
        let kanal = Int((iz["channels"] as? NSNumber)?.doubleValue ?? 2)
        let akislar = (iz["streams"] as? [[String: Any]]) ?? (iz["downloadables"] as? [[String: Any]]) ?? []
        for (i, a) in akislar.enumerated() {
          guard let akis = akisCoz(a, kimlik: "audio_\(j)_\(i)", tur: "audio", dil: dil, kanal: max(1, kanal)) else { continue }
          sonuc.append(akis)
        }
      }
    }

    return sonuc
  }

  private static func akisCoz(
    _ a: [String: Any],
    kimlik: String,
    tur: String,
    dil: String,
    kanal: Int = 2
  ) -> Akis? {
    let url = cdnUrlBul(a)
    if url.isEmpty { return nil }

    let boyut = Int((a["size"] as? NSNumber)?.int64Value ?? 0)
    if boyut <= 0 { return nil }

    let (sidxBas, sidxSon, initSon) = sidxAralik(a)
    let profil = (a["content_profile"] as? String) ?? ""

    return Akis(
      kimlik: kimlik,
      tur: tur,
      cdnUrl: url,
      initSon: initSon,
      sidxBas: sidxBas,
      sidxSon: sidxSon,
      toplamBoyut: boyut,
      kodek: kodekBul(profil, tur),
      bant: bantGenisligi(a, tur == "video" ? 5_000_000 : 128_000),
      genislik: Int((a["res_w"] as? NSNumber)?.intValue ?? (a["width"] as? NSNumber)?.intValue ?? 0),
      yukseklik: Int((a["res_h"] as? NSNumber)?.intValue ?? (a["height"] as? NSNumber)?.intValue ?? 0),
      dil: dil,
      kanal: kanal
    )
  }

  private static func sidxAralik(_ a: [String: Any]) -> (Int, Int, Int) {
    guard let sidx = a["sidx"] as? [String: Any],
          let uzaklik = (sidx["offset"] as? NSNumber)?.intValue,
          let sidxBoyut = (sidx["size"] as? NSNumber)?.intValue else {
      var bas = (a["startByteOffset"] as? NSNumber)?.intValue ?? 0
      if bas == 0 { bas = 100_000 }
      return (0, bas, bas)
    }
    let sidxSon = uzaklik + sidxBoyut - 1
    var initSon = (a["startByteOffset"] as? NSNumber)?.intValue ?? 100_000
    if let moov = a["moov"] as? [String: Any],
       let mUzaklik = (moov["offset"] as? NSNumber)?.intValue,
       let mBoyut = (moov["size"] as? NSNumber)?.intValue {
      initSon = mUzaklik + mBoyut - 1
    }
    return (uzaklik, sidxSon, initSon)
  }

  private static func bantGenisligi(_ a: [String: Any], _ varsayilan: Int) -> Int {
    if let bitoran = (a["bitrate"] as? NSNumber)?.intValue, bitoran > 0 { return bitoran * 1000 }
    return (a["avg_bitrate"] as? NSNumber)?.intValue ?? varsayilan
  }

  private static func cdnUrlBul(_ a: [String: Any]) -> String {
    if let dizi = a["urls"] as? [[String: Any]] {
      for cdn in dizi {
        let url = (cdn["url"] as? String) ?? ""
        if !url.isEmpty { return url }
      }
    }
    if let harita = a["urls"] as? [String: Any] {
      for (_, deger) in harita {
        guard let cdn = deger as? [String: Any] else { continue }
        let url = (cdn["url"] as? String) ?? (cdn["downloadUrl"] as? String) ?? ""
        if !url.isEmpty { return url }
      }
    }
    return ""
  }

  static func kodekBul(_ profil: String, _ tur: String) -> String {
    let p = profil.lowercased()
    if p.contains("h264") { return "avc1.640028" }
    if p.contains("hevc") || p.contains("h265") { return "hvc1.1.6.L93.B0" }
    if p.contains("vp9") { return "vp9" }
    if p.contains("av1") { return "av01.0.04M.08" }
    if p.contains("heaac") { return "mp4a.40.5" }
    if p.contains("ddplus") || p.contains("dd5.1") { return "ec-3" }
    if p.contains("dd-") { return "ac-3" }
    if p.contains("vorbis") { return "vorbis" }
    if p.contains("opus") { return "opus" }
    return tur == "audio" ? "mp4a.40.2" : "avc1.640028"
  }

  static func avplayerUyumlu(_ kodek: String) -> Bool {
    let k = kodek.lowercased()
    if k.hasPrefix("vp9") || k.hasPrefix("av01") || k.hasPrefix("vorbis") || k.hasPrefix("opus") { return false }
    return true
  }
}
