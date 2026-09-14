import Foundation

enum HlsUretici {
  static func anaListe(_ akislar: [Akis], taban: String) -> String {
    let uygun = akislar.filter { NetflixAkis.avplayerUyumlu($0.kodek) }
    let videolar = uygun.filter { $0.tur == "video" }.sorted { $0.bant < $1.bant }
    let sesler = uygun.filter { $0.tur == "audio" }

    var satirlar = ["#EXTM3U", "#EXT-X-VERSION:7", "#EXT-X-INDEPENDENT-SEGMENTS"]

    var sesGrubu: String?
    if !sesler.isEmpty {
      sesGrubu = "ses"
      var gorulenDiller = Set<String>()
      for ses in sesler {
        if gorulenDiller.contains(ses.dil) { continue }
        gorulenDiller.insert(ses.dil)
        let ilkMi = gorulenDiller.count == 1
        satirlar.append(
          "#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID=\"ses\",NAME=\"\(dilAdi(ses.dil))\"," +
          "LANGUAGE=\"\(ses.dil)\",DEFAULT=\(ilkMi ? "YES" : "NO"),AUTOSELECT=\(ilkMi ? "YES" : "NO")," +
          "CHANNELS=\"\(ses.kanal)\",URI=\"\(taban)/m3u8?rep=\(ses.kimlik)\""
        )
      }
    }

    let sesKodek = sesler.first?.kodek ?? "mp4a.40.2"
    for video in videolar {
      var bilgi = "#EXT-X-STREAM-INF:BANDWIDTH=\(video.bant)"
      if video.genislik > 0 && video.yukseklik > 0 {
        bilgi += ",RESOLUTION=\(video.genislik)x\(video.yukseklik)"
      }
      bilgi += ",CODECS=\"\(video.kodek),\(sesKodek)\""
      if let grup = sesGrubu { bilgi += ",AUDIO=\"\(grup)\"" }
      satirlar.append(bilgi)
      satirlar.append("\(taban)/m3u8?rep=\(video.kimlik)")
    }

    if videolar.isEmpty, let ses = sesler.first {
      satirlar.append("#EXT-X-STREAM-INF:BANDWIDTH=\(ses.bant),CODECS=\"\(ses.kodek)\"")
      satirlar.append("\(taban)/m3u8?rep=\(ses.kimlik)")
    }

    return satirlar.joined(separator: "\n") + "\n"
  }

  static func ortamListesi(_ akis: Akis, parcalar: [SidxParcasi], taban: String) -> String {
    let enUzun = parcalar.map { $0.sureSn }.max() ?? 6
    var satirlar = [
      "#EXTM3U",
      "#EXT-X-VERSION:7",
      "#EXT-X-PLAYLIST-TYPE:VOD",
      "#EXT-X-TARGETDURATION:\(Int(ceil(enUzun)))",
      "#EXT-X-MEDIA-SEQUENCE:0",
      "#EXT-X-MAP:URI=\"\(taban)/init?rep=\(akis.kimlik)\"",
    ]

    for parca in parcalar {
      satirlar.append(String(format: "#EXTINF:%.3f,", parca.sureSn))
      satirlar.append("\(taban)/seg?rep=\(akis.kimlik)&i=\(parca.sira)")
    }

    satirlar.append("#EXT-X-ENDLIST")
    return satirlar.joined(separator: "\n") + "\n"
  }

  private static func dilAdi(_ kod: String) -> String {
    let yerel = Locale(identifier: "tr")
    if let ad = yerel.localizedString(forLanguageCode: kod), !ad.isEmpty {
      return ad.prefix(1).uppercased() + ad.dropFirst()
    }
    return kod
  }
}
