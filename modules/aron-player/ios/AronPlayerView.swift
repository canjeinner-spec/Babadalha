import AVFoundation
import ExpoModulesCore
import UIKit

final class AronPlayerView: ExpoView {
  let onDurum = EventDispatcher()
  let onIlerleme = EventDispatcher()
  let onHata = EventDispatcher()
  let onBoyut = EventDispatcher()
  let onDrm = EventDispatcher()

  private var oynatici: AVPlayer?
  private var katman: AVPlayerLayer?
  private var oge: AVPlayerItem?
  private var yapilandirma: OynatimYapilandirma?
  private var zamanGozlemcisi: Any?
  private var gozlemler: [NSKeyValueObservation] = []
  private var sonDurum = ""
  private var sonBoyut = CGSize.zero
  private var yokEdildi = false
  private var baslangicUygulandi = false
  private var sesDeger: Float = 1
  private var hizDeger: Float = 1

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
    backgroundColor = .black
    let k = AVPlayerLayer()
    k.videoGravity = .resizeAspect
    layer.addSublayer(k)
    katman = k
  }

  override func layoutSubviews() {
    super.layoutSubviews()
    katman?.frame = bounds
  }

  func yapilandir(_ json: String?) {
    guard let ayar = OynatimYapilandirma.coz(json) else {
      if json == nil || json?.isEmpty == true { birak() }
      return
    }
    if let mevcut = yapilandirma, mevcut.kimlik == ayar.kimlik, oynatici != nil { return }
    kur(ayar)
  }

  private func kur(_ ayar: OynatimYapilandirma) {
    temizle()
    yapilandirma = ayar
    baslangicUygulandi = false
    durumYayinla("hazirlaniyor")

    guard let url = URL(string: ayar.manifestUrl) else {
      hataYayinla(kod: -1, kodAdi: "adres", mesaj: "Gecersiz adres", drm: false, sebep: ayar.manifestUrl)
      return
    }

    var secenekler: [String: Any] = [:]
    if !ayar.basliklar.isEmpty {
      secenekler["AVURLAssetHTTPHeaderFieldsKey"] = ayar.basliklar
    }

    let varlik = AVURLAsset(url: url, options: secenekler)
    let yeniOge = AVPlayerItem(asset: varlik)
    let yeniOynatici = AVPlayer(playerItem: yeniOge)
    yeniOynatici.volume = sesDeger
    yeniOynatici.automaticallyWaitsToMinimizeStalling = true

    oge = yeniOge
    oynatici = yeniOynatici
    katman?.player = yeniOynatici

    gozlemleriKur(yeniOge, yeniOynatici)
    zamanGozlemcisiKur(yeniOynatici)

    if ayar.otomatikBasla {
      yeniOynatici.playImmediately(atRate: hizDeger)
    }
  }

  private func gozlemleriKur(_ oge: AVPlayerItem, _ oynatici: AVPlayer) {
    gozlemler.append(oge.observe(\.status, options: [.new]) { [weak self] o, _ in
      guard let self else { return }
      switch o.status {
      case .readyToPlay:
        self.baslangiciUygula()
        self.boyutYayinla()
        self.durumYayinla(oynatici.timeControlStatus == .playing ? "oynuyor" : "hazir")
      case .failed:
        let h = o.error as NSError?
        self.hataYayinla(
          kod: h?.code ?? -1,
          kodAdi: "oge",
          mesaj: h?.localizedDescription ?? "Oynatilamadi",
          drm: false,
          sebep: (h?.userInfo[NSUnderlyingErrorKey] as? NSError)?.localizedDescription ?? ""
        )
        self.durumYayinla("hata")
      default:
        self.durumYayinla("bos")
      }
    })

    gozlemler.append(oynatici.observe(\.timeControlStatus, options: [.new]) { [weak self] o, _ in
      guard let self else { return }
      switch o.timeControlStatus {
      case .playing: self.durumYayinla("oynuyor")
      case .paused: self.durumYayinla(self.oge?.status == .readyToPlay ? "durakladi" : "bos")
      case .waitingToPlayAtSpecifiedRate: self.durumYayinla("arabellek")
      default: break
      }
    })

    gozlemler.append(oge.observe(\.presentationSize, options: [.new]) { [weak self] _, _ in
      self?.boyutYayinla()
    })

    NotificationCenter.default.addObserver(
      self,
      selector: #selector(bittiGeldi),
      name: .AVPlayerItemDidPlayToEndTime,
      object: oge
    )
  }

  @objc private func bittiGeldi() {
    durumYayinla("bitti")
  }

  private func zamanGozlemcisiKur(_ oynatici: AVPlayer) {
    let aralik = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
    zamanGozlemcisi = oynatici.addPeriodicTimeObserver(forInterval: aralik, queue: .main) { [weak self] _ in
      self?.ilerlemeYayinla()
    }
  }

  private func baslangiciUygula() {
    guard !baslangicUygulandi, let ayar = yapilandirma, ayar.baslangicMs > 0 else { return }
    baslangicUygulandi = true
    ara(Double(ayar.baslangicMs))
  }

  func oynat() {
    oynatici?.playImmediately(atRate: hizDeger)
  }

  func duraklat() {
    oynatici?.pause()
  }

  func ara(_ ms: Double) {
    let hedef = CMTime(seconds: max(0, ms) / 1000.0, preferredTimescale: 1000)
    oynatici?.seek(to: hedef, toleranceBefore: .zero, toleranceAfter: .zero)
  }

  func durdur() {
    oynatici?.pause()
    oynatici?.seek(to: .zero)
    durumYayinla("bos")
  }

  func birak() {
    temizle()
    yapilandirma = nil
    durumYayinla("bos")
  }

  func sesSeviyesi(_ deger: Float) {
    sesDeger = max(0, min(1, deger))
    oynatici?.volume = sesDeger
  }

  func hiz(_ deger: Float) {
    hizDeger = max(0.25, min(4, deger))
    if oynatici?.timeControlStatus == .playing {
      oynatici?.rate = hizDeger
    }
  }

  func oranKipi(_ kip: String?) {
    switch kip {
    case "doldur": katman?.videoGravity = .resize
    case "yakinlastir": katman?.videoGravity = .resizeAspectFill
    case "genislik", "yukseklik": katman?.videoGravity = .resizeAspect
    default: katman?.videoGravity = .resizeAspect
    }
  }

  func konumBilgisi() -> [String: Any] {
    return [
      "konumMs": konumMs(),
      "sureMs": sureMs(),
      "tamponMs": tamponMs(),
      "oynuyor": oynatici?.timeControlStatus == .playing,
      "durum": sonDurum,
    ]
  }

  func izler() -> [String: Any] {
    var sesler: [[String: Any]] = []
    var altyazilar: [[String: Any]] = []
    var altyaziAcik = false

    if let varlik = oge?.asset {
      if let grup = varlik.mediaSelectionGroup(forMediaCharacteristic: .audible) {
        let secili = oge?.currentMediaSelection.selectedMediaOption(in: grup)
        for secenek in grup.options {
          sesler.append([
            "kod": secenek.extendedLanguageTag ?? "und",
            "ad": secenek.displayName,
            "secili": secenek == secili,
          ])
        }
      }
      if let grup = varlik.mediaSelectionGroup(forMediaCharacteristic: .legible) {
        let secili = oge?.currentMediaSelection.selectedMediaOption(in: grup)
        altyaziAcik = secili != nil
        for secenek in grup.options {
          altyazilar.append([
            "kod": secenek.extendedLanguageTag ?? "und",
            "ad": secenek.displayName,
            "secili": secenek == secili,
          ])
        }
      }
    }

    return [
      "ses": sesler,
      "altyazi": altyazilar,
      "kalite": kaliteler(),
      "altyaziAcik": altyaziAcik,
    ]
  }

  private func kaliteler() -> [[String: Any]] {
    let mevcut = oge?.preferredPeakBitRate ?? 0
    var liste: [[String: Any]] = [["yukseklik": 0, "ad": "Otomatik", "secili": mevcut == 0]]
    let boy = Int(oge?.presentationSize.height ?? 0)
    if boy > 0 {
      liste.append(["yukseklik": boy, "ad": "\(boy)p", "secili": mevcut != 0])
    }
    return liste
  }

  func sesDiliSec(_ kod: String) {
    guard let varlik = oge?.asset,
          let grup = varlik.mediaSelectionGroup(forMediaCharacteristic: .audible) else { return }
    for secenek in grup.options where secenek.extendedLanguageTag == kod {
      oge?.select(secenek, in: grup)
      return
    }
  }

  func altyaziSec(_ kod: String?) {
    guard let varlik = oge?.asset,
          let grup = varlik.mediaSelectionGroup(forMediaCharacteristic: .legible) else { return }
    guard let kod else {
      oge?.select(nil, in: grup)
      return
    }
    for secenek in grup.options where secenek.extendedLanguageTag == kod {
      oge?.select(secenek, in: grup)
      return
    }
  }

  func kaliteSec(_ yukseklik: Int) {
    guard let oge else { return }
    if yukseklik <= 0 {
      oge.preferredPeakBitRate = 0
      oge.preferredMaximumResolution = .zero
      return
    }
    oge.preferredMaximumResolution = CGSize(width: 0, height: CGFloat(yukseklik))
  }

  private func konumMs() -> Double {
    guard let t = oynatici?.currentTime(), t.isNumeric else { return 0 }
    return max(0, t.seconds * 1000)
  }

  private func sureMs() -> Double {
    guard let s = oge?.duration, s.isNumeric, !s.seconds.isNaN, s.seconds.isFinite else { return 0 }
    return max(0, s.seconds * 1000)
  }

  private func tamponMs() -> Double {
    guard let araliklar = oge?.loadedTimeRanges, let ilk = araliklar.first?.timeRangeValue else { return 0 }
    let son = ilk.start.seconds + ilk.duration.seconds
    if son.isNaN || !son.isFinite { return 0 }
    return max(0, son * 1000)
  }

  private func canliMi() -> Bool {
    guard let s = oge?.duration else { return false }
    return !s.isNumeric || s.seconds.isNaN || !s.seconds.isFinite
  }

  private func durumYayinla(_ durum: String) {
    if yokEdildi || durum == sonDurum { return }
    sonDurum = durum
    onDurum([
      "durum": durum,
      "oynuyor": oynatici?.timeControlStatus == .playing,
      "konumMs": konumMs(),
      "sureMs": sureMs(),
      "canliYayin": canliMi(),
    ])
  }

  private func ilerlemeYayinla() {
    if yokEdildi { return }
    let konum = konumMs()
    let sure = sureMs()
    onIlerleme([
      "konumMs": konum,
      "sureMs": sure,
      "tamponMs": tamponMs(),
      "yuzde": sure > 0 ? min(100, max(0, konum / sure * 100)) : 0,
    ])
  }

  private func boyutYayinla() {
    guard let boyut = oge?.presentationSize, boyut.width > 0, boyut.height > 0 else { return }
    if boyut == sonBoyut { return }
    sonBoyut = boyut
    onBoyut([
      "genislik": Int(boyut.width),
      "yukseklik": Int(boyut.height),
      "oran": boyut.height > 0 ? Double(boyut.width / boyut.height) : 0,
    ])
  }

  private func hataYayinla(kod: Int, kodAdi: String, mesaj: String, drm: Bool, sebep: String) {
    if yokEdildi { return }
    onHata([
      "kod": kod,
      "kodAdi": kodAdi,
      "mesaj": mesaj,
      "drm": drm,
      "sebep": sebep,
    ])
  }

  private func temizle() {
    if let g = zamanGozlemcisi {
      oynatici?.removeTimeObserver(g)
      zamanGozlemcisi = nil
    }
    gozlemler.forEach { $0.invalidate() }
    gozlemler.removeAll()
    NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: nil)
    oynatici?.pause()
    katman?.player = nil
    oynatici = nil
    oge = nil
    sonBoyut = .zero
  }

  deinit {
    yokEdildi = true
    if let g = zamanGozlemcisi {
      oynatici?.removeTimeObserver(g)
    }
    gozlemler.forEach { $0.invalidate() }
    NotificationCenter.default.removeObserver(self)
  }
}
