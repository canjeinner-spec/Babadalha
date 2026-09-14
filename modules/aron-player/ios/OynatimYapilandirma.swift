import Foundation

struct AltyaziAyari {
  let kod: String
  let ad: String
  let url: String
}

struct DrmAyari {
  let sema: String
  let lisansUrl: String
  let basliklar: [String: String]
  let cokluOturum: Bool
  let anahtarsizOynat: Bool
  let netflixMsl: Bool
  let netflixId: String
  let netflixSecureId: String
  let netflixVideoId: String
  let altyazilar: [AltyaziAyari]
  let primeAmazon: Bool
  let primeVideoId: String
  let primeCerezler: String
  let primeMarketplaceId: String
}

struct OynatimYapilandirma {
  let manifestUrl: String
  let mimeTuru: String?
  let drm: DrmAyari?
  let basliklar: [String: String]
  let baslangicMs: Int64
  let otomatikBasla: Bool
  let arkaPlandaDevam: Bool

  var kimlik: String {
    let parcalar = [
      manifestUrl,
      mimeTuru ?? "-",
      drm?.sema ?? "-",
      drm?.lisansUrl ?? "-",
      drm.map { String($0.cokluOturum) } ?? "-",
      drm.map { String($0.anahtarsizOynat) } ?? "-",
      OynatimYapilandirma.basliklarOzeti(drm?.basliklar),
      OynatimYapilandirma.basliklarOzeti(basliklar),
    ]
    return OynatimYapilandirma.ozet(parcalar.joined(separator: " "))
  }

  static func coz(_ json: String?) -> OynatimYapilandirma? {
    guard let json, !json.isEmpty, let veri = json.data(using: .utf8) else { return nil }
    guard let kok = (try? JSONSerialization.jsonObject(with: veri)) as? [String: Any] else { return nil }
    let url = (kok["manifestUrl"] as? String) ?? ""
    if url.isEmpty { return nil }
    let mime = kok["mimeType"] as? String
    return OynatimYapilandirma(
      manifestUrl: url,
      mimeTuru: (mime?.isEmpty ?? true) ? nil : mime,
      drm: drmCoz(kok["drm"] as? [String: Any]),
      basliklar: haritaCoz(kok["headers"] as? [String: Any]),
      baslangicMs: max(0, (kok["baslangicMs"] as? NSNumber)?.int64Value ?? 0),
      otomatikBasla: (kok["otomatikBasla"] as? Bool) ?? true,
      arkaPlandaDevam: (kok["arkaPlandaDevam"] as? Bool) ?? false
    )
  }

  private static func drmCoz(_ o: [String: Any]?) -> DrmAyari? {
    guard let o else { return nil }
    let lisans = (o["licenseUrl"] as? String) ?? ""
    let netflixMsl = (o["netflixMsl"] as? Bool) ?? false
    if lisans.isEmpty && !netflixMsl { return nil }

    var altyazilar: [AltyaziAyari] = []
    if let dizi = o["altyazilar"] as? [[String: Any]] {
      for a in dizi {
        let url = (a["url"] as? String) ?? ""
        if url.isEmpty { continue }
        altyazilar.append(AltyaziAyari(
          kod: (a["kod"] as? String) ?? "und",
          ad: (a["ad"] as? String) ?? "",
          url: url
        ))
      }
    }

    return DrmAyari(
      sema: ((o["scheme"] as? String) ?? "widevine").lowercased(),
      lisansUrl: lisans,
      basliklar: haritaCoz(o["headers"] as? [String: Any]),
      cokluOturum: (o["cokluOturum"] as? Bool) ?? false,
      anahtarsizOynat: (o["anahtarsizOynat"] as? Bool) ?? false,
      netflixMsl: netflixMsl,
      netflixId: (o["netflixId"] as? String) ?? "",
      netflixSecureId: (o["netflixSecureId"] as? String) ?? "",
      netflixVideoId: (o["netflixVideoId"] as? String) ?? "",
      altyazilar: altyazilar,
      primeAmazon: (o["primeAmazon"] as? Bool) ?? false,
      primeVideoId: (o["primeVideoId"] as? String) ?? "",
      primeCerezler: (o["primeCerezler"] as? String) ?? "",
      primeMarketplaceId: (o["primeMarketplaceId"] as? String) ?? ""
    )
  }

  private static func haritaCoz(_ o: [String: Any]?) -> [String: String] {
    guard let o else { return [:] }
    var harita: [String: String] = [:]
    for (k, v) in o {
      if let s = v as? String {
        harita[k] = s
      } else {
        harita[k] = String(describing: v)
      }
    }
    return harita
  }

  private static func basliklarOzeti(_ basliklar: [String: String]?) -> String {
    guard let basliklar, !basliklar.isEmpty else { return "-" }
    let duz = basliklar.keys.sorted().map { "\($0)=\(basliklar[$0] ?? "")" }.joined(separator: ";")
    return ozet(duz)
  }

  private static func ozet(_ metin: String) -> String {
    var toplam: UInt64 = 1469598103934665603
    for bayt in Array(metin.utf8) {
      toplam ^= UInt64(bayt)
      toplam = toplam &* 1099511628211
    }
    return String(toplam, radix: 16)
  }
}
