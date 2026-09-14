import Foundation

final class AkisVekili {
  private var sunucu: YerelSunucu?
  private var akislar: [String: Akis] = [:]
  private var anahtarlar: [Data: Data] = [:]
  private var initOnbellek: [String: Data] = [:]
  private var parcaOnbellek: [String: [SidxParcasi]] = [:]
  private var sifreOnbellek: [String: SifreAyari] = [:]
  private let kilit = NSLock()
  private let oturum: URLSession

  init() {
    let ayar = URLSessionConfiguration.ephemeral
    ayar.timeoutIntervalForRequest = 20
    ayar.requestCachePolicy = .reloadIgnoringLocalCacheData
    oturum = URLSession(configuration: ayar)
  }

  var anaAdres: String? {
    guard let sunucu, sunucu.port != 0 else { return nil }
    return "\(sunucu.taban)/master.m3u8"
  }

  func baslat(manifestJson: String, jwk: Data) throws {
    durdur()

    let liste = NetflixAkis.coz(manifestJson)
    if liste.isEmpty {
      throw NSError(domain: "AronPlayer", code: -3, userInfo: [NSLocalizedDescriptionKey: "Netflix manifestinden akis cikarilamadi"])
    }

    kilit.lock()
    akislar = Dictionary(uniqueKeysWithValues: liste.map { ($0.kimlik, $0) })
    anahtarlar = CencCozucu.anahtarlariCoz(jwk)
    initOnbellek = [:]
    parcaOnbellek = [:]
    sifreOnbellek = [:]
    kilit.unlock()

    let yeni = YerelSunucu { [weak self] yol, sorgu in
      guard let self else { return YerelYanit.yok() }
      return self.istegiKarsila(yol, sorgu)
    }
    try yeni.baslat()
    sunucu = yeni
  }

  func durdur() {
    sunucu?.durdur()
    sunucu = nil
    kilit.lock()
    akislar = [:]
    anahtarlar = [:]
    initOnbellek = [:]
    parcaOnbellek = [:]
    sifreOnbellek = [:]
    kilit.unlock()
  }

  private func istegiKarsila(_ yol: String, _ sorgu: [String: String]) -> YerelYanit {
    guard let sunucu else { return YerelYanit.yok() }
    let taban = sunucu.taban

    switch yol {
    case "/master.m3u8":
      kilit.lock()
      let liste = Array(akislar.values)
      kilit.unlock()
      return YerelYanit.metin(HlsUretici.anaListe(liste, taban: taban), tur: "application/vnd.apple.mpegurl")

    case "/m3u8":
      guard let kimlik = sorgu["rep"], let akis = akisAl(kimlik) else { return YerelYanit.yok() }
      do {
        let parcalar = try parcalariAl(akis)
        return YerelYanit.metin(
          HlsUretici.ortamListesi(akis, parcalar: parcalar, taban: taban),
          tur: "application/vnd.apple.mpegurl"
        )
      } catch {
        return YerelYanit.hata("liste: \(error.localizedDescription)")
      }

    case "/init":
      guard let kimlik = sorgu["rep"], let akis = akisAl(kimlik) else { return YerelYanit.yok() }
      do {
        let veri = try initAl(akis)
        return YerelYanit.veri(veri, tur: "video/mp4")
      } catch {
        return YerelYanit.hata("init: \(error.localizedDescription)")
      }

    case "/seg":
      guard let kimlik = sorgu["rep"], let akis = akisAl(kimlik),
            let siraMetin = sorgu["i"], let sira = Int(siraMetin) else { return YerelYanit.yok() }
      do {
        let veri = try parcaAl(akis, sira: sira)
        return YerelYanit.veri(veri, tur: "video/mp4")
      } catch {
        return YerelYanit.hata("parca: \(error.localizedDescription)")
      }

    default:
      return YerelYanit.yok()
    }
  }

  private func akisAl(_ kimlik: String) -> Akis? {
    kilit.lock()
    defer { kilit.unlock() }
    return akislar[kimlik]
  }

  private func initAl(_ akis: Akis) throws -> Data {
    kilit.lock()
    if let hazir = initOnbellek[akis.kimlik] {
      kilit.unlock()
      return hazir
    }
    kilit.unlock()

    let ham = try aralikIndir(akis.cdnUrl, bas: 0, son: akis.initSon)
    if let ayar = Mp4Ayristirici.sifreAyariCikar(ham, 0..<ham.count) {
      kilit.lock()
      sifreOnbellek[akis.kimlik] = ayar
      kilit.unlock()
    }
    let temiz = Mp4Ayristirici.initTemizle(ham)

    kilit.lock()
    initOnbellek[akis.kimlik] = temiz
    kilit.unlock()
    return temiz
  }

  private func parcalariAl(_ akis: Akis) throws -> [SidxParcasi] {
    kilit.lock()
    if let hazir = parcaOnbellek[akis.kimlik] {
      kilit.unlock()
      return hazir
    }
    kilit.unlock()

    _ = try initAl(akis)

    let sidxVerisi = try aralikIndir(akis.cdnUrl, bas: akis.sidxBas, son: akis.sidxSon)
    guard let sidx = Mp4Ayristirici.kutular(sidxVerisi, 0..<sidxVerisi.count).first(where: { $0.tur == "sidx" }) else {
      throw NSError(domain: "AronPlayer", code: -4, userInfo: [NSLocalizedDescriptionKey: "sidx bulunamadi"])
    }
    let parcalar = Mp4Ayristirici.sidxCoz(sidxVerisi, sidx, veriBaslangici: akis.sidxSon + 1)
    if parcalar.isEmpty {
      throw NSError(domain: "AronPlayer", code: -5, userInfo: [NSLocalizedDescriptionKey: "sidx bos"])
    }

    kilit.lock()
    parcaOnbellek[akis.kimlik] = parcalar
    kilit.unlock()
    return parcalar
  }

  private func parcaAl(_ akis: Akis, sira: Int) throws -> Data {
    let parcalar = try parcalariAl(akis)
    guard sira >= 0, sira < parcalar.count else {
      throw NSError(domain: "AronPlayer", code: -6, userInfo: [NSLocalizedDescriptionKey: "parca sirasi disarida"])
    }
    let parca = parcalar[sira]
    let ham = try aralikIndir(akis.cdnUrl, bas: parca.bas, son: parca.bas + parca.boyut - 1)

    kilit.lock()
    let ayar = sifreOnbellek[akis.kimlik]
    let anahtarKopya = anahtarlar
    kilit.unlock()

    guard let ayar, !anahtarKopya.isEmpty else { return ham }
    return CencCozucu.parcayiCoz(ham, anahtarlar: anahtarKopya, ayar: ayar)
  }

  private func aralikIndir(_ adres: String, bas: Int, son: Int) throws -> Data {
    guard let url = URL(string: adres) else {
      throw NSError(domain: "AronPlayer", code: -7, userInfo: [NSLocalizedDescriptionKey: "Gecersiz CDN adresi"])
    }
    var istek = URLRequest(url: url)
    istek.setValue("bytes=\(bas)-\(son)", forHTTPHeaderField: "Range")
    istek.setValue("*/*", forHTTPHeaderField: "Accept")

    var sonuc: Data?
    var hata: Error?
    let bekle = DispatchSemaphore(value: 0)

    oturum.dataTask(with: istek) { veri, yanit, ag in
      if let ag {
        hata = ag
      } else if let http = yanit as? HTTPURLResponse, http.statusCode >= 400 {
        hata = NSError(
          domain: "AronPlayer",
          code: http.statusCode,
          userInfo: [NSLocalizedDescriptionKey: "CDN \(http.statusCode)"]
        )
      } else {
        sonuc = veri
      }
      bekle.signal()
    }.resume()

    _ = bekle.wait(timeout: .now() + 25)

    if let hata { throw hata }
    guard let sonuc, !sonuc.isEmpty else {
      throw NSError(domain: "AronPlayer", code: -8, userInfo: [NSLocalizedDescriptionKey: "CDN bos yanit"])
    }
    return sonuc
  }
}
