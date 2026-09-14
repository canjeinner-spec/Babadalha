import Foundation
import Network

struct YerelYanit {
  let durum: Int
  let tur: String
  let govde: Data
  var ekBasliklar: [String: String] = [:]
  var araliklanabilir: Bool = true

  static func metin(_ icerik: String, tur: String) -> YerelYanit {
    return YerelYanit(durum: 200, tur: tur, govde: Data(icerik.utf8), araliklanabilir: false)
  }

  static func veri(_ govde: Data, tur: String) -> YerelYanit {
    return YerelYanit(durum: 200, tur: tur, govde: govde)
  }

  static func yok() -> YerelYanit {
    return YerelYanit(durum: 404, tur: "text/plain", govde: Data("yok".utf8), araliklanabilir: false)
  }

  static func hata(_ mesaj: String) -> YerelYanit {
    return YerelYanit(durum: 500, tur: "text/plain", govde: Data(mesaj.utf8), araliklanabilir: false)
  }
}

final class YerelSunucu {
  typealias Isleyici = (_ yol: String, _ sorgu: [String: String]) -> YerelYanit

  private var dinleyici: NWListener?
  private let kuyruk = DispatchQueue(label: "aron.yerelsunucu", qos: .userInitiated, attributes: .concurrent)
  private let isleyici: Isleyici
  private(set) var port: UInt16 = 0

  init(isleyici: @escaping Isleyici) {
    self.isleyici = isleyici
  }

  var taban: String {
    return "http://127.0.0.1:\(port)"
  }

  func baslat() throws {
    if dinleyici != nil { return }
    let ayar = NWParameters.tcp
    ayar.allowLocalEndpointReuse = true
    ayar.requiredInterfaceType = .loopback

    let yeni = try NWListener(using: ayar, on: .any)
    let bekle = DispatchSemaphore(value: 0)
    var acildi = false

    yeni.stateUpdateHandler = { [weak self] durum in
      switch durum {
      case .ready:
        self?.port = yeni.port?.rawValue ?? 0
        if !acildi { acildi = true; bekle.signal() }
      case .failed, .cancelled:
        if !acildi { acildi = true; bekle.signal() }
      default:
        break
      }
    }

    yeni.newConnectionHandler = { [weak self] baglanti in
      self?.baglantiAc(baglanti)
    }

    dinleyici = yeni
    yeni.start(queue: kuyruk)
    _ = bekle.wait(timeout: .now() + 5)

    if port == 0 {
      yeni.cancel()
      dinleyici = nil
      throw NSError(domain: "AronPlayer", code: -2, userInfo: [NSLocalizedDescriptionKey: "Yerel sunucu acilamadi"])
    }
  }

  func durdur() {
    dinleyici?.cancel()
    dinleyici = nil
    port = 0
  }

  private func baglantiAc(_ baglanti: NWConnection) {
    baglanti.start(queue: kuyruk)
    istekOku(baglanti, birikmis: Data())
  }

  private func istekOku(_ baglanti: NWConnection, birikmis: Data) {
    baglanti.receive(minimumIncompleteLength: 1, maximumLength: 16 * 1024) { [weak self] parca, _, bitti, hata in
      guard let self else { return }
      if hata != nil {
        baglanti.cancel()
        return
      }
      var veri = birikmis
      if let parca { veri.append(parca) }

      if let sinir = self.baslikSonu(veri) {
        let baslikMetni = String(decoding: veri[veri.startIndex..<sinir], as: UTF8.self)
        self.istegiIsle(baglanti, baslikMetni)
        return
      }

      if bitti || veri.count > 64 * 1024 {
        baglanti.cancel()
        return
      }
      self.istekOku(baglanti, birikmis: veri)
    }
  }

  private func baslikSonu(_ veri: Data) -> Data.Index? {
    let isaret = Data("\r\n\r\n".utf8)
    guard let aralik = veri.range(of: isaret) else { return nil }
    return aralik.upperBound
  }

  private func istegiIsle(_ baglanti: NWConnection, _ baslikMetni: String) {
    let satirlar = baslikMetni.split(separator: "\r\n", omittingEmptySubsequences: false)
    guard let ilk = satirlar.first else {
      baglanti.cancel()
      return
    }
    let parcalar = ilk.split(separator: " ")
    guard parcalar.count >= 2 else {
      baglanti.cancel()
      return
    }

    let yontem = String(parcalar[0]).uppercased()
    let hedef = String(parcalar[1])
    let (yol, sorgu) = adresCoz(hedef)

    var aralik: String?
    for satir in satirlar.dropFirst() {
      let alt = satir.lowercased()
      if alt.hasPrefix("range:") {
        aralik = String(satir.dropFirst("range:".count)).trimmingCharacters(in: .whitespaces)
      }
    }

    if yontem != "GET" && yontem != "HEAD" {
      gonder(baglanti, YerelYanit(durum: 405, tur: "text/plain", govde: Data("yontem".utf8), araliklanabilir: false), aralik: nil, govdeliMi: true)
      return
    }

    let yanit = isleyici(yol, sorgu)
    gonder(baglanti, yanit, aralik: aralik, govdeliMi: yontem == "GET")
  }

  private func adresCoz(_ hedef: String) -> (String, [String: String]) {
    guard let soru = hedef.firstIndex(of: "?") else {
      return (hedef.removingPercentEncoding ?? hedef, [:])
    }
    let yol = String(hedef[hedef.startIndex..<soru])
    let kuyrukMetni = String(hedef[hedef.index(after: soru)...])
    var sorgu: [String: String] = [:]
    for ikili in kuyrukMetni.split(separator: "&") {
      let parcalar = ikili.split(separator: "=", maxSplits: 1)
      guard let ad = parcalar.first else { continue }
      let anahtar = String(ad).removingPercentEncoding ?? String(ad)
      let deger = parcalar.count > 1 ? (String(parcalar[1]).removingPercentEncoding ?? String(parcalar[1])) : ""
      sorgu[anahtar] = deger
    }
    return (yol.removingPercentEncoding ?? yol, sorgu)
  }

  private func gonder(_ baglanti: NWConnection, _ yanit: YerelYanit, aralik: String?, govdeliMi: Bool) {
    var durum = yanit.durum
    var govde = yanit.govde
    var ekBaslik = ""
    let tam = yanit.govde.count

    if yanit.araliklanabilir, durum == 200, let aralik, let (bas, son) = araligiCoz(aralik, toplam: tam) {
      govde = yanit.govde.subdata(in: bas..<(son + 1))
      durum = 206
      ekBaslik += "Content-Range: bytes \(bas)-\(son)/\(tam)\r\n"
    }

    var basliklar = "HTTP/1.1 \(durum) \(durumAdi(durum))\r\n"
    basliklar += "Content-Type: \(yanit.tur)\r\n"
    basliklar += "Content-Length: \(govde.count)\r\n"
    basliklar += yanit.araliklanabilir ? "Accept-Ranges: bytes\r\n" : "Accept-Ranges: none\r\n"
    basliklar += "Cache-Control: no-store\r\n"
    basliklar += "Connection: close\r\n"
    basliklar += ekBaslik
    for (ad, deger) in yanit.ekBasliklar {
      basliklar += "\(ad): \(deger)\r\n"
    }
    basliklar += "\r\n"

    var paket = Data(basliklar.utf8)
    if govdeliMi { paket.append(govde) }

    baglanti.send(content: paket, completion: .contentProcessed { _ in
      baglanti.cancel()
    })
  }

  private func araligiCoz(_ ham: String, toplam: Int) -> (Int, Int)? {
    guard toplam > 0, ham.lowercased().hasPrefix("bytes=") else { return nil }
    let govde = String(ham.dropFirst("bytes=".count))
    guard let ilk = govde.split(separator: ",").first else { return nil }
    let parcalar = ilk.split(separator: "-", maxSplits: 1, omittingEmptySubsequences: false)
    guard parcalar.count == 2 else { return nil }

    let basMetin = String(parcalar[0]).trimmingCharacters(in: .whitespaces)
    let sonMetin = String(parcalar[1]).trimmingCharacters(in: .whitespaces)

    if basMetin.isEmpty {
      guard let uzunluk = Int(sonMetin), uzunluk > 0 else { return nil }
      let bas = max(0, toplam - uzunluk)
      return (bas, toplam - 1)
    }

    guard let bas = Int(basMetin), bas < toplam else { return nil }
    let son = sonMetin.isEmpty ? toplam - 1 : min(Int(sonMetin) ?? (toplam - 1), toplam - 1)
    if son < bas { return nil }
    return (bas, son)
  }

  private func durumAdi(_ kod: Int) -> String {
    switch kod {
    case 200: return "OK"
    case 206: return "Partial Content"
    case 404: return "Not Found"
    case 405: return "Method Not Allowed"
    default: return "Internal Server Error"
    }
  }
}
