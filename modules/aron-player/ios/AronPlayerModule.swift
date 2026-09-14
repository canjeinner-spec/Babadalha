import AVFoundation
import ExpoModulesCore
import UIKit

public class AronPlayerModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AronPlayer")

    AsyncFunction("drmDestegi") { () -> [String: Any] in
      return [
        "sema": "clearkey",
        "var": true,
        "androidSurum": 0,
        "seviye": "AVPlayer",
        "vendor": "Apple",
        "surum": UIDevice.current.systemVersion,
        "hdcp": "",
        "oturumSiniri": "",
      ]
    }

    AsyncFunction("raveTokenAyarla") { (_: String?, _: String?, _: String?, _: String?) -> [String: Any] in
      return ["hazir": false]
    }

    AsyncFunction("raveGoogleGiris") { (_: String) -> [String: Any] in
      return ["hazir": false]
    }

    AsyncFunction("netflixOturumBaslat") { (_: String, _: String, _: String) -> [String: Any] in
      throw HenuzYokHatasi("netflixOturumBaslat")
    }

    AsyncFunction("netflixManifestAl") { (_: String, _: String, _: String, _: String) -> [String: Any] in
      throw HenuzYokHatasi("netflixManifestAl")
    }

    AsyncFunction("maxManifestAl") { (_: String, _: String) -> [String: Any] in
      throw HenuzYokHatasi("maxManifestAl")
    }

    AsyncFunction("youtubeManifestAl") { (_: String, _: String) -> [String: Any] in
      throw HenuzYokHatasi("youtubeManifestAl")
    }

    AsyncFunction("netflixUstveri") { (_: String, _: String, _: String) -> [String: Any] in
      throw HenuzYokHatasi("netflixUstveri")
    }

    AsyncFunction("primeManifestAl") { (_: String, _: String, _: String) -> [String: Any] in
      throw HenuzYokHatasi("primeManifestAl")
    }

    View(AronPlayerView.self) {
      Events("onDurum", "onIlerleme", "onHata", "onBoyut", "onDrm")

      Prop("kaynak") { (view: AronPlayerView, json: String?) in view.yapilandir(json) }
      Prop("oranKipi") { (view: AronPlayerView, kip: String?) in view.oranKipi(kip) }
      Prop("ses") { (view: AronPlayerView, deger: Double?) in view.sesSeviyesi(Float(deger ?? 1)) }
      Prop("hizi") { (view: AronPlayerView, deger: Double?) in view.hiz(Float(deger ?? 1)) }

      AsyncFunction("yukle") { (view: AronPlayerView, json: String) in view.yapilandir(json) }
      AsyncFunction("oynat") { (view: AronPlayerView) in view.oynat() }
      AsyncFunction("duraklat") { (view: AronPlayerView) in view.duraklat() }
      AsyncFunction("ara") { (view: AronPlayerView, ms: Double) in view.ara(ms) }
      AsyncFunction("durdur") { (view: AronPlayerView) in view.durdur() }
      AsyncFunction("birak") { (view: AronPlayerView) in view.birak() }
      AsyncFunction("sesSeviyesi") { (view: AronPlayerView, deger: Double) in view.sesSeviyesi(Float(deger)) }
      AsyncFunction("hiz") { (view: AronPlayerView, deger: Double) in view.hiz(Float(deger)) }
      AsyncFunction("konum") { (view: AronPlayerView) -> [String: Any] in view.konumBilgisi() }
      AsyncFunction("izler") { (view: AronPlayerView) -> [String: Any] in view.izler() }
      AsyncFunction("sesDiliSec") { (view: AronPlayerView, kod: String) in view.sesDiliSec(kod) }
      AsyncFunction("altyaziSec") { (view: AronPlayerView, kod: String?) in view.altyaziSec(kod) }
      AsyncFunction("kaliteSec") { (view: AronPlayerView, yukseklik: Int) in view.kaliteSec(yukseklik) }
    }
  }
}

final class HenuzYokHatasi: GenericException<String> {
  override var reason: String {
    return "\(param) iOS'ta henuz yok"
  }
}
