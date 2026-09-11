import { Platform } from "react-native";

import { type PlatformKodu } from "@/oda/platform";

const MASAUSTU_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const MASAUSTU_SAFARI =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";

const DRM_PLATFORMLARI = new Set<PlatformKodu>([
  "netflix",
  "prime_video",
  "disney_plus",
  "hbo_max",
  "hulu",
  "crunchyroll",
  "apple_tv",
]);

const MASAUSTU_LINUX_CHROME =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.172 Safari/537.36";

const CHROMEOS_CHROME =
  "Mozilla/5.0 (X11; CrOS aarch64 16503.74.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.172 Safari/537.36";

export function masaustuIcerikMi(platform: PlatformKodu): boolean {
  return DRM_PLATFORMLARI.has(platform);
}

export function kullaniciAjani(platform: PlatformKodu): string {
  if (Platform.OS === "ios" && DRM_PLATFORMLARI.has(platform)) return MASAUSTU_SAFARI;
  if (Platform.OS === "android" && platform === "netflix") return CHROMEOS_CHROME;
  if (Platform.OS === "android" && DRM_PLATFORMLARI.has(platform)) return MASAUSTU_LINUX_CHROME;
  return MASAUSTU_CHROME;
}

export type OynaticiOlayi =
  | { tur: "hazir"; sure: number; konum: number; izleme: boolean }
  | { tur: "oynat"; konum: number; izleme: boolean }
  | { tur: "duraklat"; konum: number }
  | { tur: "atla"; konum: number }
  | { tur: "bitti"; konum: number }
  | { tur: "bekliyor"; konum: number }
  | { tur: "konum"; konum: number }
  | { tur: "sure"; sure: number }
  | { tur: "bilgi"; baslik: string | null; yazar: string | null; adres: string; kapak?: string | null; izleme?: boolean }
  | { tur: "engel"; sebep: string }
  | { tur: "tani"; sistemler: Record<string, string>; eskiEme: boolean; mse: string; ajan: string; platform: string; dokunma: number }
  | { tur: "gunluk"; seviye: string; metin: string }
  | { tur: "durum"; adres: string; baslik: string; videoVar: boolean; hazirDurum: string }
  | { tur: "renk"; renk: string }
  | { tur: "netflix-yerel"; videoId: string }
  | { tur: "yok" };

function masaustuOrtami(safari: boolean, platformAdi = "MacIntel"): string {
  return `
(function () {
  if (window.__aronOrtam) return;
  window.__aronOrtam = true;

  function tanimla(nesne, ad, deger) {
    try {
      Object.defineProperty(nesne, ad, { get: function () { return deger; }, configurable: true });
    } catch (e) {}
  }

  tanimla(navigator, 'platform', '${platformAdi}');
  tanimla(navigator, 'maxTouchPoints', 0);
  tanimla(navigator, 'vendor', ${safari ? "'Apple Computer, Inc.'" : "'Google Inc.'"});
  tanimla(navigator, 'standalone', undefined);

  ${safari ? "try { delete Navigator.prototype.userAgentData; } catch (e) {} tanimla(navigator, 'userAgentData', undefined);" : ""}

  try {
    Object.defineProperty(window, 'ontouchstart', { get: function () { return undefined; }, configurable: true });
  } catch (e) {}

  try {
    if (window.matchMedia) {
      var esle = window.matchMedia.bind(window);
      window.matchMedia = function (sorgu) {
        var s = esle(sorgu);
        if (/pointer\s*:\s*coarse|hover\s*:\s*none/.test(String(sorgu))) {
          return { matches: false, media: s.media, onchange: null,
            addListener: function () {}, removeListener: function () {},
            addEventListener: function () {}, removeEventListener: function () {},
            dispatchEvent: function () { return false; } };
        }
        return s;
      };
    }
  } catch (e) {}

  ${safari ? "" : "try { if (!window.chrome) window.chrome = { runtime: {} }; } catch (e) {}"}
})();
`;
}

const TURTLE_ORTAM = `
(function () {
  if (window.__aronOrtam) return;
  window.__aronOrtam = true;
  try { window.localStorage.removeItem('clientInformation'); } catch (e) {}
  try {
    var eski = window.matchMedia;
    window.matchMedia = function (sorgu) {
      if (sorgu === '(hover: hover)' || /hover\\s*:\\s*hover/.test(String(sorgu))) {
        return { matches: true, media: sorgu, onchange: null, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return false; } };
      }
      if (/pointer\\s*:\\s*coarse|hover\\s*:\\s*none/.test(String(sorgu))) {
        return { matches: false, media: sorgu, onchange: null, addListener: function () {}, removeListener: function () {}, addEventListener: function () {}, removeEventListener: function () {}, dispatchEvent: function () { return false; } };
      }
      return eski(sorgu);
    };
  } catch (e) {}
  function sifir(ad) { try { Object.defineProperty(navigator, ad, { get: function () { return 0; }, configurable: true }); } catch (e) {} }
  sifir('maxTouchPoints');
  sifir('msMaxTouchPoints');
  try { window.ontouchstart = undefined; } catch (e) {}
})();
`;

const MSE = `
(function () {
  if (window.__aronMse) return;
  window.__aronMse = true;
  var MMS = window.ManagedMediaSource;
  if (!MMS) return;
  var gercek = window.MediaSource;
  if (gercek && gercek !== MMS) return;

  var Vekil = new Proxy(MMS, {
    construct: function (hedef, args) { return new hedef(...args); }
  });
  try { Vekil.prototype = MMS.prototype; } catch (e) {}
  try {
    Object.defineProperty(window, 'MediaSource', { configurable: true, get: function () { return Vekil; } });
  } catch (e) {
    try { window.MediaSource = Vekil; } catch (e2) {}
  }
})();
`;

const MEDYA = `
(function () {
  if (window.__aronMedya) return;
  window.__aronMedya = true;

  var kalan = 220;
  function ustCerceve() { try { return window.top === window; } catch (e) { return false; } }
  function bildir(metin) {
    if (kalan-- <= 0) return;
    var ust = ustCerceve();
    if (!ust && !document.querySelector('video,audio')) return;
    var on = ust ? '' : '[altcerceve ' + String(location.pathname).slice(0, 40) + '] ';
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ tur: 'gunluk', seviye: 'medya', metin: on + String(metin).slice(0, 280) })); } catch (e) {}
  }

  function kisalt(t) { return String(t || '').replace(/\\s+/g, ' ').slice(0, 90); }

  function tipiSar(K, ad) {
    if (!K || !K.isTypeSupported || K.__aronTipLog) return;
    K.__aronTipLog = true;
    var eski = K.isTypeSupported.bind(K);
    var gorulen = {};
    K.isTypeSupported = function (t) {
      var r = eski(t);
      var anahtar = ad + '|' + t;
      if (!gorulen[anahtar]) { gorulen[anahtar] = 1; bildir('tip ' + ad + ' ' + (r ? 'EVET' : 'HAYIR') + ' ' + kisalt(t)); }
      return r;
    };
  }
  tipiSar(window.MediaSource, 'MS');
  tipiSar(window.ManagedMediaSource, 'MMS');

  function oturumSar(oturum, ks) {
    if (!oturum || oturum.__aronOturum) return oturum;
    oturum.__aronOturum = true;
    try {
      oturum.addEventListener('keystatuseschange', function () {
        var parcalar = [];
        try {
          oturum.keyStatuses.forEach(function (durum) { parcalar.push(durum); });
        } catch (e) {}
        bildir('anahtar durum ' + ks + ' -> ' + (parcalar.join(',') || 'bos'));
      });
      oturum.addEventListener('message', function (m) {
        bildir('anahtar mesaj ' + ks + ' tur=' + (m && m.messageType) + ' boyut=' + ((m && m.message && m.message.byteLength) || 0));
      });
      oturum.closed && oturum.closed.then(function () { bildir('anahtar oturum kapandi ' + ks); });
      var eskiGuncelle = oturum.update.bind(oturum);
      oturum.update = function (lisans) {
        return eskiGuncelle(lisans).then(function (r) {
          bildir('lisans TAMAM ' + ks + ' boyut=' + ((lisans && lisans.byteLength) || 0));
          return r;
        }, function (e) {
          bildir('lisans RET ' + ks + ' -> ' + ((e && (e.name + ': ' + e.message)) || e));
          throw e;
        });
      };
    } catch (e) {}
    return oturum;
  }

  try {
    var eskiAta = HTMLMediaElement.prototype.setMediaKeys;
    if (eskiAta && !HTMLMediaElement.prototype.__aronKeys) {
      HTMLMediaElement.prototype.__aronKeys = true;
      HTMLMediaElement.prototype.setMediaKeys = function (mk) {
        try {
          var ks = (mk && mk.keySystem) || (mk && mk.__ks) || '?';
          bildir('anahtar takildi ' + ks);
          if (mk && mk.createSession && !mk.__aronMk) {
            mk.__aronMk = true;
            var eskiOlustur = mk.createSession.bind(mk);
            mk.createSession = function (tur) {
              bildir('oturum acildi ' + ks + ' tur=' + (tur || 'temporary'));
              return oturumSar(eskiOlustur(tur), ks);
            };
          }
        } catch (e) {}
        return eskiAta.call(this, mk);
      };
    }
  } catch (e) {}

  function eskiOturumSar(oturum, nereden) {
    if (!oturum || oturum.__aronEskiOturum) return oturum;
    oturum.__aronEskiOturum = true;
    try {
      oturum.addEventListener('webkitkeymessage', function (e) {
        bildir('eski-fps mesaj ' + nereden + ' boyut=' + ((e && e.message && e.message.byteLength) || 0));
      });
      oturum.addEventListener('webkitkeyadded', function () { bildir('eski-fps anahtar EKLENDI ' + nereden); });
      oturum.addEventListener('webkitkeyerror', function () {
        bildir('eski-fps anahtar HATA ' + nereden + ' kod=' + ((oturum.error && oturum.error.code) || '-') + '/' + ((oturum.error && oturum.error.systemCode) || '-'));
      });
      if (oturum.update) {
        var eskiGun = oturum.update.bind(oturum);
        oturum.update = function (lisans) {
          bildir('eski-fps lisans yollandi ' + nereden + ' boyut=' + ((lisans && lisans.byteLength) || 0));
          return eskiGun(lisans);
        };
      }
    } catch (e) {}
    return oturum;
  }

  try {
    var WMK = window.WebKitMediaKeys;
    if (WMK && !WMK.__aronEski) {
      WMK.__aronEski = true;
      if (WMK.isTypeSupported) {
        var eskiDestek = WMK.isTypeSupported.bind(WMK);
        WMK.isTypeSupported = function (ks, tip) {
          var r = eskiDestek(ks, tip);
          bildir('eski-fps destek ' + ks + ' ' + kisalt(tip) + ' -> ' + (r ? 'EVET' : 'HAYIR'));
          return r;
        };
      }
      if (WMK.prototype && WMK.prototype.createSession) {
        var eskiOlusturOt = WMK.prototype.createSession;
        WMK.prototype.createSession = function (tip, init) {
          try {
            var o = eskiOlusturOt.call(this, tip, init);
            bildir('eski-fps oturum acildi ' + kisalt(tip) + ' init=' + ((init && init.byteLength) || 0));
            return eskiOturumSar(o, kisalt(tip));
          } catch (e) {
            bildir('eski-fps oturum HATA ' + kisalt(tip) + ' -> ' + ((e && (e.name + ': ' + e.message)) || e));
            throw e;
          }
        };
      }
    }
  } catch (e) {}

  try {
    var eskiSet = HTMLMediaElement.prototype.webkitSetMediaKeys;
    if (eskiSet && !HTMLMediaElement.prototype.__aronEskiSet) {
      HTMLMediaElement.prototype.__aronEskiSet = true;
      HTMLMediaElement.prototype.webkitSetMediaKeys = function (mk) {
        bildir('eski-fps anahtar takildi ' + ((mk && mk.keySystem) || '?'));
        try { return eskiSet.call(this, mk); }
        catch (e) { bildir('eski-fps takma HATA -> ' + ((e && (e.name + ': ' + e.message)) || e)); throw e; }
      };
    }
  } catch (e) {}

  try {
    var isim = ['MediaSource', 'ManagedMediaSource', 'SourceBuffer', 'ManagedSourceBuffer'];
    var mevcut = [];
    for (var q = 0; q < isim.length; q++) if (window[isim[q]]) mevcut.push(isim[q]);
    bildir('ortam mse=' + mevcut.join(',') + ' worker=' + (typeof Worker) + ' vekil=' + (window.__aronMse ? 'evet' : 'hayir')
      + ' eskiFps=' + (window.WebKitMediaKeys ? 'var' : 'yok') + ' yol=' + location.pathname.slice(0, 40));
  } catch (e) {}

  try {
    var P = (window.ManagedMediaSource || window.MediaSource || {}).prototype;
    if (P && P.addSourceBuffer && !P.__aronSbLog) {
      P.__aronSbLog = true;
      var eskiSb = P.addSourceBuffer;
      P.addSourceBuffer = function (t) {
        try {
          var sb = eskiSb.call(this, t);
          bildir('tampon acildi ' + kisalt(t));
          return sb;
        } catch (e) {
          bildir('tampon HATA ' + kisalt(t) + ' -> ' + ((e && e.message) || e));
          throw e;
        }
      };
    }
  } catch (e) {}

  try {
    if (navigator.requestMediaKeySystemAccess && !navigator.__aronEmeLog) {
      navigator.__aronEmeLog = true;
      var eskiEme = navigator.requestMediaKeySystemAccess.bind(navigator);
      navigator.requestMediaKeySystemAccess = function (ks, cfg) {
        if (window.__aronSonda) return eskiEme(ks, cfg);
        var ozet = '';
        try {
          var c0 = cfg && cfg[0];
          var v0 = c0 && c0.videoCapabilities && c0.videoCapabilities[0];
          ozet = (v0 ? kisalt(v0.contentType) + (v0.robustness ? ' rob=' + v0.robustness : '') : 'video yok');
        } catch (e) {}
        bildir('eme istek ' + ks + ' ' + ozet);
        return eskiEme(ks, cfg).then(function (a) {
          bildir('eme TAMAM ' + ks);
          try {
            if (a && a.createMediaKeys && !a.__aronMka) {
              a.__aronMka = true;
              var eskiMk = a.createMediaKeys.bind(a);
              a.createMediaKeys = function () {
                bildir('anahtar uretiliyor ' + ks);
                return eskiMk().then(function (mk) {
                  try { mk.__ks = ks; } catch (e) {}
                  bildir('anahtar URETILDI ' + ks);
                  return mk;
                }, function (h) {
                  bildir('anahtar URETILEMEDI ' + ks + ' -> ' + ((h && (h.name + ': ' + h.message)) || h));
                  throw h;
                });
              };
            }
          } catch (e) {}
          return a;
        }, function (e) {
          bildir('eme RET ' + ks + ' -> ' + ((e && e.name) || e));
          throw e;
        });
      };
    }
  } catch (e) {}

  try {
    document.addEventListener('encrypted', function (e) {
      bildir('sifreli olay initDataType=' + (e && e.initDataType) + ' boyut=' + ((e && e.initData && e.initData.byteLength) || 0));
    }, true);
    document.addEventListener('waitingforkey', function () { bildir('anahtar bekleniyor'); }, true);
    ['loadstart', 'loadedmetadata', 'canplay', 'stalled', 'abort', 'emptied', 'ended'].forEach(function (ad) {
      document.addEventListener(ad, function (e) {
        var t = e && e.target;
        if (!t || t.tagName !== 'VIDEO') return;
        var ek = '';
        if (ad === 'loadedmetadata' || ad === 'loadstart') {
          var src = t.currentSrc || t.src || '';
          ek = ' kaynak=' + (src.indexOf('blob:') === 0 ? 'blob(MSE)' : kisalt(src.slice(0, 70)));
        }
        bildir('video ' + ad + ' sure=' + Math.round(t.duration || 0) + ' hazir=' + t.readyState + ' ag=' + t.networkState + ek);
      }, true);
    });
    ['webkitkeyerror', 'webkitkeyadded', 'webkitkeymessage', 'webkitneedkey'].forEach(function (ad) {
      document.addEventListener(ad, function (e) {
        var t = e && e.target;
        bildir('eski-fps ' + ad + ' hata=' + ((t && t.error && t.error.code) || '-'));
      }, true);
    });
    document.addEventListener('error', function (e) {
      var t = e && e.target;
      if (!t || t.tagName !== 'VIDEO') return;
      var er = t.error;
      bildir('video hata kod=' + (er ? er.code : '-') + ' ' + kisalt(er && er.message) + ' src=' + kisalt((t.currentSrc || '').slice(0, 60)));
    }, true);
  } catch (e) {}
})();
`;

const TEMEL = `
(function () {
  if (window.__aronTemel) return;
  window.__aronTemel = true;

  window.__aronVideolar = window.__aronVideolar || [];

  function yamala(v) {
    if (!v || v.__aronVideo) return;
    v.__aronVideo = true;
    try { window.__aronVideolar.push(v); } catch (e) {}
    try {
      v.disableRemotePlayback = true;
      v.setAttribute('disableRemotePlayback', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.playsInline = true;
      if (!v.getAttribute('preload')) v.setAttribute('preload', 'auto');
    } catch (e) {}
    if (window.__aronBagla) window.__aronBagla(v);
  }
  window.__aronYamala = yamala;

  var olustur = Document.prototype.createElement;
  Document.prototype.createElement = function (ad) {
    var el = olustur.apply(this, arguments);
    if (String(ad).toLowerCase() === 'video') yamala(el);
    return el;
  };

  var ekle = Node.prototype.appendChild;
  Node.prototype.appendChild = function (cocuk) {
    if (cocuk && cocuk.tagName === 'VIDEO') yamala(cocuk);
    return ekle.call(this, cocuk);
  };

  var ozn = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (ad, deger) {
    if (this && this.tagName === 'VIDEO') {
      var n = String(ad).toLowerCase();
      if (n === 'src' || n === 'autoplay' || n === 'muted' || n === 'playsinline') yamala(this);
    }
    return ozn.call(this, ad, deger);
  };

  var v = document.querySelectorAll ? document.querySelectorAll('video') : [];
  for (var i = 0; i < v.length; i++) yamala(v[i]);
})();
`;

const ORTAK = `
(function () {
  if (window.__aronKopru) return;
  window.__aronKopru = true;

  var sonKonum = 0;
  var video = null;
  var sonSure = 0;
  var sonAdres = '';
  var t0 = 0;
  var tVideo = 0;
  var tOynat = 0;
  var izlemeBekci = 0;
  var IZLEME_BEKLE = 4500;

  function bekciDurdur() {
    if (izlemeBekci) { clearTimeout(izlemeBekci); izlemeBekci = 0; }
  }

  function bekciKur() {
    bekciDurdur();
    izlemeBekci = setTimeout(function () {
      izlemeBekci = 0;
      if (video || tVideo || !izlemeSayfasi()) return;
      var su = location.href;
      var onceki = null;
      try { onceki = sessionStorage.getItem('__aronTamYukleme'); } catch (e) {}
      if (onceki === su) { zaman('izleme-video-yok yeniden-denendi'); return; }
      try { sessionStorage.setItem('__aronTamYukleme', su); } catch (e) {}
      zaman('izleme-video-yok tam-yuklemeye-geciliyor');
      try { location.replace(su); } catch (e) { try { location.reload(); } catch (e2) {} }
    }, IZLEME_BEKLE);
  }

  function simdi() { try { return performance.now(); } catch (e) { return Date.now(); } }
  function zaman(asama) {
    if (!t0) return;
    yolla({ tur: 'gunluk', seviye: 'zaman', metin: asama + ' +' + Math.round(simdi() - t0) + 'ms yol=' + location.pathname });
  }

  function yolla(v) {
    try { if (window.top !== window) return; } catch (e) { return; }
    try { window.ReactNativeWebView.postMessage(JSON.stringify(v)); } catch (e) {}
  }
  window.__aronYolla = yolla;

  function sayi(x) { return typeof x === 'number' && isFinite(x) && x > 0 ? x : 0; }
  function konum() { return video ? sayi(video.currentTime) : 0; }

  function derinTara(kok, cikti, derinlik) {
    if (!kok || derinlik > 12) return;
    var yigin = [kok];
    var sayac = 0;
    while (yigin.length && sayac < 12000) {
      var n = yigin.pop();
      sayac++;
      if (!n) continue;
      try {
        if (n.tagName === 'VIDEO') { cikti.push(n); continue; }
        if (n.tagName === 'IFRAME') {
          try { if (n.contentDocument) derinTara(n.contentDocument, cikti, derinlik + 1); } catch (e) {}
          continue;
        }
        if (n.shadowRoot) yigin.push(n.shadowRoot);
        var c = n.children;
        if (c) for (var i = 0; i < c.length; i++) yigin.push(c[i]);
      } catch (e) {}
    }
  }

  function cerceveleriTara(hepsi) {
    var cerceveler;
    try { cerceveler = document.getElementsByTagName('iframe'); } catch (e) { return; }
    for (var i = 0; i < cerceveler.length && i < 12; i++) {
      var belge = null;
      try { belge = cerceveler[i].contentDocument; } catch (e) { belge = null; }
      if (!belge) continue;
      try {
        var vs = belge.getElementsByTagName('video');
        for (var j = 0; j < vs.length; j++) {
          if (hepsi.indexOf(vs[j]) === -1) hepsi.push(vs[j]);
        }
      } catch (e) {}
    }
    if (hepsi.length) {
      try { yolla({ tur: 'gunluk', seviye: 'medya', metin: 'video alt cercevede bulundu (' + hepsi.length + ')' }); } catch (e) {}
    }
  }

  var KAP_ONEKLERI = ['watch-video', 'webPlayerContainer', 'atvwebplayersdk', 'btm-media-client'];

  function oynaticiKabinda(v) {
    var node = v && v.parentElement;
    var derinlik = 0;
    while (node && derinlik < 40) {
      var sinif = node.classList;
      if (sinif && sinif.length) {
        for (var i = 0; i < sinif.length; i++) {
          for (var j = 0; j < KAP_ONEKLERI.length; j++) {
            if (String(sinif[i]).indexOf(KAP_ONEKLERI[j]) === 0) return true;
          }
        }
      }
      node = node.parentElement;
      derinlik++;
    }
    return false;
  }

  function enBuyukVideo() {
    var hepsi = [];
    try {
      var duz = document.getElementsByTagName('video');
      for (var d = 0; d < duz.length; d++) hepsi.push(duz[d]);
    } catch (e) {}
    try {
      var kayitli = window.__aronVideolar || [];
      for (var i = 0; i < kayitli.length; i++) {
        var k = kayitli[i];
        if (k && hepsi.indexOf(k) === -1 && k.isConnected !== false) hepsi.push(k);
      }
    } catch (e) {}
    if (!hepsi.length) {
      try { cerceveleriTara(hepsi); } catch (e) {}
    }
    if (!hepsi.length) {
      try { derinTara(document.documentElement || document, hepsi, 0); } catch (e) {}
    }
    if (!hepsi.length) return null;
    var kapta = [];
    for (var q = 0; q < hepsi.length; q++) {
      try { if (oynaticiKabinda(hepsi[q])) kapta.push(hepsi[q]); } catch (e) {}
    }
    if (kapta.length) hepsi = kapta;
    hepsi.sort(function (a, b) {
      var ab = (a.clientWidth || 0) * (a.clientHeight || 0);
      var bb = (b.clientWidth || 0) * (b.clientHeight || 0);
      if (bb !== ab) return bb - ab;
      return (b.duration || 0) - (a.duration || 0);
    });
    return hepsi[0];
  }

  function izlemeSayfasi() {
    if (window.__aronIzleme) {
      try { return !!window.__aronIzleme(); } catch (e) {}
    }
    var s = video ? sayi(video.duration) : 0;
    return s > 90;
  }
  window.__aronIzlemeSayfasi = izlemeSayfasi;

  function sesiAc() {
    if (!video) return;
    try { video.muted = false; if (video.volume < 0.05) video.volume = 1; } catch (e) {}
  }
  window.__aronSesiAc = sesiAc;

  var izlemeBildirildi = false;
  function bagla(v) {
    if (!v || v.__aronDinleniyor) return;
    v.__aronDinleniyor = true;
    try { v.disablePictureInPicture = true; } catch (e) {}
    try { v.setAttribute('disablepictureinpicture', ''); } catch (e) {}
    v.addEventListener('enterpictureinpicture', function () {
      zaman('pip-acildi kapatiliyor');
      try { if (document.exitPictureInPicture) document.exitPictureInPicture(); } catch (e) {}
    });
    v.addEventListener('play', function () {
      var iz = izlemeSayfasi();
      izlemeBildirildi = iz;
      yolla({ tur: 'oynat', konum: sayi(v.currentTime), izleme: iz });
    });
    v.addEventListener('playing', function () {
      if (!tOynat) { tOynat = simdi(); zaman('oynuyor'); }
    });
    v.addEventListener('loadedmetadata', function () { zaman('meta'); });
    v.addEventListener('canplay', function () { zaman('canplay'); });
    v.addEventListener('pause', function () { izlemeBildirildi = false; yolla({ tur: 'duraklat', konum: sayi(v.currentTime) }); });
    v.addEventListener('seeked', function () { yolla({ tur: 'atla', konum: sayi(v.currentTime) }); });
    v.addEventListener('ended', function () { yolla({ tur: 'bitti', konum: sayi(v.currentTime) }); });
    v.addEventListener('waiting', function () { yolla({ tur: 'bekliyor', konum: sayi(v.currentTime) }); });
    v.addEventListener('loadedmetadata', function () { if (video !== v) tazele(); sureBildir(); });
    v.addEventListener('play', function () { if (video !== v) tazele(); });
    setTimeout(function () { if (video !== v) tazele(); }, 0);
  }
  window.__aronBagla = bagla;

  function sureBildir() {
    var s = video ? sayi(video.duration) : 0;
    if (s && Math.abs(s - sonSure) > 0.5) { sonSure = s; yolla({ tur: 'sure', sure: s }); }
  }

  function kapakBul() {
    if (window.__aronKapak) {
      try { var o = window.__aronKapak(); if (o) return o; } catch (e) {}
    }
    try {
      if (video && video.poster && video.poster.indexOf('http') === 0) return video.poster;
    } catch (e) {}
    var secim = ['meta[property="og:image"]', 'meta[name="og:image"]', 'meta[name="twitter:image"]'];
    for (var i = 0; i < secim.length; i++) {
      try {
        var m = document.querySelector(secim[i]);
        var v = m && m.getAttribute('content');
        if (v && v.indexOf('http') === 0 && !/seo|logo|favicon|icon/i.test(v)) return v;
      } catch (e) {}
    }
    return null;
  }

  var sonBaslik = '';
  var sonOzel = false;
  function bilgiBildir() {
    var adres = location.href;
    var b0 = null;
    try { b0 = window.__aronBaslik ? window.__aronBaslik() : null; } catch (e) {}
    var ozel = !!(b0 && b0.baslik);
    var baslik = ozel ? b0.baslik : (document.title || '');
    if (!ozel && sonOzel && adres === sonAdres) return;
    if (adres === sonAdres && baslik === sonBaslik) return;
    if (adres !== sonAdres && izlemeSayfasi() && !video) { t0 = simdi(); tVideo = 0; tOynat = 0; zaman('izleme-adresi'); bekciKur(); }
    sonAdres = adres;
    sonBaslik = baslik;
    sonOzel = ozel;
    yolla({
      tur: 'bilgi',
      baslik: baslik || null,
      yazar: (b0 && b0.yazar) || null,
      adres: adres,
      kapak: kapakBul(),
      izleme: izlemeSayfasi()
    });
  }

  var tuval = null;
  var tuvalCtx = null;
  var renkKapali = false;
  var renkBildirildi = false;
  var renkHata = 0;
  var renkSayaci = 0;
  var sonRenk = null;

  function sahneRengi() {
    if (renkKapali || !video) return;
    try {
      if (video.readyState < 2 || video.videoWidth === 0) return;
      if (!tuval) {
        tuval = document.createElement('canvas');
        tuval.width = 8;
        tuval.height = 5;
        tuvalCtx = tuval.getContext('2d', { willReadFrequently: true });
      }
      if (!tuvalCtx) { renkKapali = true; return; }
      tuvalCtx.drawImage(video, 0, 0, 8, 5);
      var d = tuvalCtx.getImageData(0, 0, 8, 5).data;
      var r = 0, g = 0, b = 0, n = 0;
      for (var i = 0; i < d.length; i += 4) {
        var a = d[i + 3];
        if (a < 8) continue;
        r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
      }
      if (!n) return;
      r = r / n; g = g / n; b = b / n;
      if (sonRenk) {
        r = sonRenk[0] + (r - sonRenk[0]) * 0.3;
        g = sonRenk[1] + (g - sonRenk[1]) * 0.3;
        b = sonRenk[2] + (b - sonRenk[2]) * 0.3;
      }
      sonRenk = [r, g, b];
      var p = function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); };
      var kod = '#' + p(r) + p(g) + p(b);
      if (!renkBildirildi) {
        renkBildirildi = true;
        yolla({ tur: 'gunluk', seviye: 'renk', metin: 'sahne rengi okunuyor, ilk deger ' + kod });
      }
      renkSayaci++;
      if (renkSayaci % 25 === 0) {
        yolla({ tur: 'gunluk', seviye: 'renk', metin: 'ornek ' + renkSayaci + ' -> ' + kod });
      }
      yolla({ tur: 'renk', renk: kod });
      renkHata = 0;
    } catch (e) {
      renkHata++;
      if (renkHata === 1) {
        yolla({ tur: 'gunluk', seviye: 'renk', metin: 'sahne rengi su an okunamiyor, denemeye devam' });
      }
      if (renkHata >= 12) {
        renkKapali = true;
        yolla({ tur: 'gunluk', seviye: 'renk', metin: 'sahne rengi 12 denemede okunamadi, birakildi' });
      }
    }
  }
  var kapakDenendi = '';
  var kapakBildirildi = false;

  function ortalamaCiz(kaynak) {
    if (!tuval) {
      tuval = document.createElement('canvas');
      tuval.width = 8;
      tuval.height = 5;
      tuvalCtx = tuval.getContext('2d', { willReadFrequently: true });
    }
    if (!tuvalCtx) return null;
    tuvalCtx.drawImage(kaynak, 0, 0, 8, 5);
    var d = tuvalCtx.getImageData(0, 0, 8, 5).data;
    var r = 0, g = 0, b = 0, n = 0;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      r += d[i]; g += d[i + 1]; b += d[i + 2]; n++;
    }
    if (!n) return null;
    return [r / n, g / n, b / n];
  }

  function renkKodu(c) {
    var p = function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); };
    return '#' + p(c[0]) + p(c[1]) + p(c[2]);
  }

  function kapakRengi() {
    if (!renkKapali) return;
    var u = null;
    try { u = kapakBul(); } catch (e) { u = null; }
    if (!u || u === kapakDenendi) return;
    kapakDenendi = u;
    try {
      var im = new Image();
      im.crossOrigin = 'anonymous';
      im.onload = function () {
        try {
          var c = ortalamaCiz(im);
          if (!c) return;
          var kod = renkKodu(c);
          yolla({ tur: 'renk', renk: kod });
          if (!kapakBildirildi) {
            kapakBildirildi = true;
            yolla({ tur: 'gunluk', seviye: 'renk', metin: 'kapak gorselinden renk alindi ' + kod });
          }
        } catch (e) {
          if (!kapakBildirildi) {
            kapakBildirildi = true;
            yolla({ tur: 'gunluk', seviye: 'renk', metin: 'kapak rengi okunamadi (cors)' });
          }
        }
      };
      im.onerror = function () {
        if (!kapakBildirildi) {
          kapakBildirildi = true;
          yolla({ tur: 'gunluk', seviye: 'renk', metin: 'kapak gorseli yuklenemedi' });
        }
      };
      im.src = u;
    } catch (e) {}
  }

  setInterval(function () { sahneRengi(); kapakRengi(); }, 1200);

  function tazele() {
    var v = enBuyukVideo();
    if (!v) {
      if (video) { video = null; yolla({ tur: 'yok' }); }
      return;
    }
    if (v !== video) {
      video = v;
      izlemeBildirildi = false;
      bekciDurdur();
      if (!tVideo) { tVideo = simdi(); zaman('video-bulundu hazir=' + v.readyState); }
      bagla(v);
      sesiAc();
      sonSure = 0;
      sureBildir();
      yolla({ tur: 'hazir', sure: sayi(v.duration), konum: sayi(v.currentTime), izleme: izlemeSayfasi() });
    }
  }
  window.__aronTazele = tazele;
  window.__aronBilgiTazele = function () { sonAdres = ''; bilgiBildir(); };

  window.__aron = {
    oynat: function () { tazele(); if (video) { sesiAc(); var p = video.play(); if (p && p.catch) p.catch(function () {}); } },
    duraklat: function () { if (video) video.pause(); },
    atla: function (t) {
      var once = video ? sayi(video.currentTime) : -1;
      var yol = 'video';
      var ozel = false;
      try { ozel = !!(window.__aronAtla && window.__aronAtla(t)); } catch (e) { yol = 'ozel-hata:' + ((e && e.message) || e); }
      if (ozel) yol = 'ozel';
      else if (video) {
        try { video.currentTime = Math.max(0, t); } catch (e) { yol = 'video-hata:' + ((e && e.message) || e); }
        if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      } else yol = 'video-yok';
      setTimeout(function () {
        yolla({ tur: 'gunluk', seviye: 'atla', metin: 'istek=' + Math.round(t) + ' yol=' + yol + ' once=' + Math.round(once)
          + ' sonra=' + (video ? Math.round(sayi(video.currentTime)) : -1) + ' sure=' + (video ? Math.round(sayi(video.duration)) : -1)
          + ' hazir=' + (video ? video.readyState : '-') });
      }, 900);
    },
    ses: function (s) { if (video) { try { video.muted = false; video.volume = Math.max(0, Math.min(1, s)); } catch (e) {} } },
    konum: function () { return konum(); },
    sadelestir: function () {
      var izleme = izlemeSayfasi();
      yolla({ tur: 'gunluk', seviye: 'sade', metin: 'istek izleme=' + izleme + ' yol=' + location.pathname + ' tanimli=' + !!window.__aronSadelestir });
      if (!izleme || !window.__aronSadelestir) return;
      try { window.__aronSadelestir(); }
      catch (e) { yolla({ tur: 'gunluk', seviye: 'sade', metin: 'HATA ' + ((e && e.message) || e) }); }
    }
  };

  var itPush = history.pushState;
  history.pushState = function () {
    var r = itPush.apply(this, arguments);
    setTimeout(function () { tazele(); bilgiBildir(); if (window.__aronSadelestir) window.__aronSadelestir(); }, 60);
    return r;
  };
  var itRep = history.replaceState;
  history.replaceState = function () {
    var r = itRep.apply(this, arguments);
    setTimeout(function () { tazele(); bilgiBildir(); }, 60);
    return r;
  };
  window.addEventListener('popstate', function () {
    setTimeout(function () { tazele(); bilgiBildir(); if (window.__aronSadelestir) window.__aronSadelestir(); }, 60);
  });

  var sonEngel = '';
  function engelBildir() {
    if (!window.__aronEngel) return;
    var e = '';
    try { e = window.__aronEngel() || ''; } catch (h) {}
    if (e === sonEngel) return;
    sonEngel = e;
    if (e) yolla({ tur: 'engel', sebep: e });
  }

  function dongu() {
    try {
      tazele();
      bilgiBildir();
      engelBildir();
      if (video) {
        var k = konum();
        if (Math.abs(k - sonKonum) >= 0.75) { sonKonum = k; yolla({ tur: 'konum', konum: k }); }
        sureBildir();
        if (!video.paused && !izlemeBildirildi && izlemeSayfasi()) {
          izlemeBildirildi = true;
          yolla({ tur: 'oynat', konum: k, izleme: true });
        }
      }
    } catch (e) {}
    setTimeout(dongu, video ? 1000 : (izlemeSayfasi() ? 600 : 2500));
  }

  dongu();
})();
`;

const TANI = `
(function () {
  if (window.__aronTani) return;
  window.__aronTani = true;
  var yolla = window.__aronYolla || function () {};

  var kalan = 60;
  function gunluk(seviye, args) {
    if (kalan-- <= 0) return;
    var parcalar = [];
    for (var i = 0; i < args.length; i++) {
      var a = args[i];
      try { parcalar.push(typeof a === 'string' ? a : (a && a.message) ? a.message : JSON.stringify(a)); }
      catch (e) { parcalar.push(String(a)); }
    }
    yolla({ tur: 'gunluk', seviye: seviye, metin: parcalar.join(' ').slice(0, 600) });
  }
  try {
    var ce = console.error, cw = console.warn;
    console.error = function () { gunluk('error', arguments); return ce.apply(console, arguments); };
    console.warn = function () { gunluk('warn', arguments); return cw.apply(console, arguments); };
  } catch (e) {}
  window.addEventListener('error', function (e) {
    gunluk('onerror', [(e && e.message) || 'hata', (e && e.filename) || '', String(e && e.lineno)]);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    var ozet = String((r && (r.message || r.name)) || r);
    try {
      if (r && typeof r === 'object') {
        var alanlar = [];
        ['code', 'subCode', 'extCode', 'mslCode', 'errorCode', 'category', 'reason', 'fatal'].forEach(function (k) {
          if (r[k] !== undefined) alanlar.push(k + '=' + r[k]);
        });
        if (alanlar.length) ozet += ' {' + alanlar.join(' ') + '}';
      }
    } catch (h) {}
    gunluk('promise', [ozet.slice(0, 260)]);
  });

  var sondaYapildi = false;
  try { sondaYapildi = sessionStorage.getItem('aronSonda') === '1'; } catch (e) {}

  var sistemler = ['com.apple.fps.1_0', 'com.apple.fps.2_0', 'com.apple.fps.3_0', 'com.apple.fps',
                   'com.widevine.alpha', 'com.microsoft.playready', 'org.w3.clearkey'];
  var sonuc = {};
  var bekleyen = sistemler.length;
  function bitir() {
    yolla({ tur: 'tani', sistemler: sonuc, eskiEme: !!window.WebKitMediaKeys,
      mse: (window.MediaSource ? 'MediaSource' : '-') + '/' + (window.ManagedMediaSource ? 'Managed' : '-') + (window.__aronMse ? '/vekil' : ''),
      ajan: navigator.userAgent, platform: navigator.platform, dokunma: navigator.maxTouchPoints });
  }
  var yap = [{
    initDataTypes: ['cenc', 'sinf', 'skd', 'keyids'],
    audioCapabilities: [{ contentType: 'audio/mp4; codecs="mp4a.40.2"' }],
    videoCapabilities: [{ contentType: 'video/mp4; codecs="avc1.42E01E"' }]
  }];
  var ustBelge = true;
  try { ustBelge = window.top === window; } catch (e) { ustBelge = false; }
  if (!ustBelge) {
    for (var u = 0; u < sistemler.length; u++) sonuc[sistemler[u]] = 'alt-cerceve';
    bitir();
  } else if (sondaYapildi) {
    for (var i = 0; i < sistemler.length; i++) sonuc[sistemler[i]] = 'atlandi';
    bitir();
  } else if (!navigator.requestMediaKeySystemAccess) {
    for (var j = 0; j < sistemler.length; j++) sonuc[sistemler[j]] = 'api-yok';
    bitir();
  } else {
    try { sessionStorage.setItem('aronSonda', '1'); } catch (e) {}
    window.__aronSonda = true;
    setTimeout(function () {
      if (!window.__aronSonda) return;
      window.__aronSonda = false;
      for (var k = 0; k < sistemler.length; k++) if (!sonuc[sistemler[k]]) sonuc[sistemler[k]] = 'zaman-asimi';
      bitir();
    }, 8000);
    sistemler.forEach(function (ks) {
      navigator.requestMediaKeySystemAccess(ks, yap).then(function () { sonuc[ks] = 'VAR'; },
        function (e) { sonuc[ks] = 'yok:' + ((e && e.name) || e); }).then(function () {
          if (--bekleyen === 0) { window.__aronSonda = false; bitir(); }
        });
    });
  }

  function sayfaZamani() { try { return Math.round(performance.now()); } catch (e) { return -1; } }
  function sayfa(asama) {
    yolla({ tur: 'gunluk', seviye: 'sayfa', metin: asama + ' +' + sayfaZamani() + 'ms hazir=' + document.readyState + ' yol=' + location.pathname });
  }
  sayfa('enjekte');
  document.addEventListener('DOMContentLoaded', function () { sayfa('dom'); });
  window.addEventListener('load', function () {
    sayfa('load');
    setTimeout(function () {
      try {
        var n = performance.getEntriesByType('navigation')[0];
        if (!n) return;
        var r = Math.round;
        var kb = function (b) { return r((b || 0) / 1024) + 'KB'; };
        var betik = 0, betikB = 0, toplamB = 0, adet = 0;
        var kaynaklar = performance.getEntriesByType('resource');
        for (var i = 0; i < kaynaklar.length; i++) {
          var e = kaynaklar[i];
          adet++;
          toplamB += e.transferSize || e.encodedBodySize || 0;
          if (e.initiatorType === 'script') { betik++; betikB += e.transferSize || e.encodedBodySize || 0; }
        }
        yolla({ tur: 'gunluk', seviye: 'ag', metin:
          'yonlendirme=' + n.redirectCount + '/' + r(n.redirectEnd - n.redirectStart) + 'ms'
          + ' dns=' + r(n.domainLookupEnd - n.domainLookupStart) + 'ms'
          + ' tcp=' + r(n.connectEnd - n.connectStart) + 'ms'
          + ' ilkbayt=' + r(n.responseStart - n.requestStart) + 'ms'
          + ' indirme=' + r(n.responseEnd - n.responseStart) + 'ms/' + kb(n.transferSize)
          + ' domHazir=' + r(n.domInteractive) + 'ms tamam=' + r(n.domComplete) + 'ms'
          + ' kaynak=' + adet + '/' + kb(toplamB) + ' betik=' + betik + '/' + kb(betikB)
          + ' onbellek=' + (n.transferSize === 0 ? 'evet' : 'hayir') });
      } catch (e) {}
    }, 1200);
  });
  var esik = [10, 40];
  var gorselTur = 0;
  function gorselSay() {
    if (gorselTur++ > 80 || !esik.length) return;
    var n = 0;
    try {
      var imgs = document.images;
      for (var i = 0; i < imgs.length; i++) if (imgs[i].complete && imgs[i].naturalWidth > 0) n++;
    } catch (e) {}
    while (esik.length && n >= esik[0]) sayfa('gorsel>=' + esik.shift() + ' (' + n + ')');
    setTimeout(gorselSay, 250);
  }
  gorselSay();

  var sayac = 0;
  setInterval(function () {
    var v = null;
    try { v = document.querySelector('video'); } catch (e) {}
    if (v && v.readyState > 0) return;
    if (sayac++ > 24) return;
    yolla({ tur: 'durum', adres: location.href.slice(0, 200), baslik: (document.title || '').slice(0, 120),
      videoVar: !!v, hazirDurum: v ? String(v.readyState) + '/' + String(v.networkState) + (v.error ? '/err' + v.error.code : '') : '-' });
  }, 5000);
})();
`;

const YOUTUBE = `
(function () {
  window.__aronIzleme = function () {
    return /^\\/(watch|shorts)/.test(location.pathname);
  };

  window.__aronAtla = function (t) {
    try {
      var p = document.getElementById('movie_player');
      if (p && typeof p.seekTo === 'function') {
        var d = typeof p.getDuration === 'function' ? p.getDuration() : 0;
        var hedef = Math.max(0, t);
        if (d > 0) hedef = Math.min(hedef, Math.max(0, d - 1));
        p.seekTo(hedef, true);
        if (typeof p.playVideo === 'function') p.playVideo();
        return true;
      }
    } catch (e) {}
    return false;
  };

  window.__aronKapak = function () {
    var m = location.href.match(/[?&]v=([\\w-]{6,})/) || location.pathname.match(/\\/shorts\\/([\\w-]{6,})/);
    if (m) return 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg';
    try {
      var p = document.getElementById('movie_player');
      var d = p && p.getVideoData ? p.getVideoData() : null;
      if (d && d.video_id) return 'https://i.ytimg.com/vi/' + d.video_id + '/hqdefault.jpg';
    } catch (e) {}
    return null;
  };

  window.__aronBaslik = function () {
    try {
      var p = document.querySelector('#movie_player');
      var d = p && p.getVideoData ? p.getVideoData() : null;
      if (d) return { baslik: d.title || null, yazar: d.author || null };
    } catch (e) {}
    return null;
  };

  function stilKur() {
    if (document.getElementById('aron-yt-stil')) return true;
    var kok = document.head || document.documentElement;
    if (!kok) return false;
    var st = document.createElement('style');
    st.id = 'aron-yt-stil';
    st.textContent = [
      'html.aron-sade, html.aron-sade body { margin:0 !important; padding:0 !important; overflow:hidden !important; background:#000 !important; }',
      'html.aron-sade #player-container-id, html.aron-sade #full-bleed-container, html.aron-sade #player-container, html.aron-sade #player-container-inner {',
      '  position:fixed !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important;',
      '  margin:0 !important; padding:0 !important; z-index:2147483000 !important; background:#000 !important; }',
      'html.aron-sade #player, html.aron-sade #movie_player, html.aron-sade .html5-video-container {',
      '  position:absolute !important; top:0 !important; left:0 !important; width:100vw !important; height:100vh !important; }',
      'html.aron-sade video.html5-main-video {',
      '  position:absolute !important; top:50% !important; left:50% !important; width:100vw !important; height:100vh !important;',
      '  transform:translate(-50%,-50%) !important; object-fit:contain !important; }',
      'html.aron-sade .ytp-chrome-bottom, html.aron-sade .ytp-gradient-bottom, html.aron-sade .ytp-chrome-top, html.aron-sade .ytp-gradient-top,',
      'html.aron-sade .ytp-pause-overlay, html.aron-sade .ytp-ce-element, html.aron-sade .ytp-cards-teaser, html.aron-sade #masthead-container { display:none !important; }'
    ].join('\\n');
    kok.appendChild(st);
    return true;
  }
  stilKur();

  function gizle(n, k, v) {
    try { if (n && n.style && typeof n.style.setProperty === 'function') n.style.setProperty(k, v, 'important'); } catch (e) {}
  }

  var GIZLI = 'data-aron-gizli';
  function gizliyiAc() {
    var acilan = 0;
    try {
      var liste = document.querySelectorAll('[' + GIZLI + ']');
      for (var i = 0; i < liste.length; i++) {
        liste[i].style.removeProperty('display');
        liste[i].removeAttribute(GIZLI);
        acilan++;
      }
    } catch (e) {}
    return acilan;
  }

  function videonunKabi(v) {
    var k = v;
    while (k && k !== document.body) {
      if (k.id === 'player-container-id' || k.id === 'full-bleed-container') return k;
      k = k.parentElement;
    }
    return null;
  }

  var sonKap = null;
  var sonUygulama = 0;

  window.__aronSadelestir = function () {
    if (!/\\/watch|\\/shorts/.test(location.pathname)) return;
    stilKur();
    var v = document.querySelector('video.html5-main-video');
    if (v && !(v.isConnected && document.body && document.body.contains(v))) return;
    var kap = (v && videonunKabi(v))
      || document.getElementById('player-container-id')
      || document.getElementById('full-bleed-container')
      || document.getElementById('movie_player');
    if (!kap || !document.body || !document.body.contains(kap)) return;
    var acilan = gizliyiAc();
    if (acilan && window.__aronYolla) {
      window.__aronYolla({ tur: 'gunluk', seviye: 'yerlesim', metin: 'onceki gizleme geri alindi: ' + acilan + ' dugum' });
    }
    if (kap !== sonKap && window.__aronYolla) {
      window.__aronYolla({ tur: 'gunluk', seviye: 'yerlesim', metin: 'kap degisti: ' + (sonKap ? sonKap.id : '-') + ' -> ' + kap.id });
    }
    sonKap = kap;
    sonUygulama = Date.now();
    var kalsin = new Set([kap]);
    kap.querySelectorAll('*').forEach(function (n) { kalsin.add(n); });
    var ust = kap.parentElement;
    while (ust) {
      kalsin.add(ust);
      if (ust !== document.documentElement && ust !== document.body) {
        ['margin:0', 'padding:0', 'transform:none', 'max-width:none', 'min-height:0', 'top:0', 'left:0',
         'position:static', 'overflow:visible', 'height:auto', 'width:auto'].forEach(function (kv) {
          var q = kv.split(':'); gizle(ust, q[0], q[1]);
        });
      }
      ust = ust.parentElement;
    }
    var tum = document.body.querySelectorAll('*');
    for (var i = 0; i < tum.length; i++) {
      var n = tum[i];
      if (kalsin.has(n)) continue;
      gizle(n, 'display', 'none');
      try { n.setAttribute(GIZLI, '1'); } catch (e) {}
    }
    ['position:fixed', 'top:0', 'left:0', 'right:0', 'bottom:0', 'width:100vw', 'height:100vh',
     'margin:0', 'padding:0', 'transform:none', 'z-index:2147483000', 'background:#000', 'border-radius:0']
      .forEach(function (kv) { var q = kv.split(':'); gizle(kap, q[0], q[1]); });
    document.documentElement.classList.add('aron-sade');
    try { window.dispatchEvent(new Event('resize')); } catch (e) {}
  };

  function gorunurluk(n) {
    var zincir = [];
    var k = n;
    while (k && k !== document.documentElement && zincir.length < 12) {
      var cs = getComputedStyle(k);
      if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) {
        zincir.push((k.id ? '#' + k.id : k.tagName.toLowerCase()) + '{' + cs.display + '/' + cs.visibility + '/' + cs.opacity + '}');
      }
      k = k.parentElement;
    }
    return zincir.length ? zincir.join('>') : 'acik';
  }

  var sonTani = '';
  window.__aronYtTani = function (sebep) {
    try {
      var v = document.querySelector('video.html5-main-video') || document.querySelector('video');
      var mp = document.getElementById('movie_player');
      var kap = document.getElementById('player-container-id') || document.getElementById('full-bleed-container');
      var vr = v ? v.getBoundingClientRect() : null;
      var metin = 'sebep=' + sebep
        + ' video=' + (v ? (v.isConnected ? 'bagli' : 'KOPUK') : 'yok')
        + ' kare=' + (v ? v.videoWidth + 'x' + v.videoHeight : '-')
        + ' kutu=' + (vr ? [vr.left, vr.top, vr.width, vr.height].map(Math.round).join(',') : '-')
        + ' hazir=' + (v ? v.readyState : '-') + ' duraklatildi=' + (v ? v.paused : '-')
        + ' gorunur=' + (v ? gorunurluk(v) : '-')
        + ' movie_player=' + (mp ? (mp.isConnected ? 'bagli' : 'KOPUK') : 'yok')
        + ' kap=' + (kap ? kap.id + (kap === sonKap ? '' : '(YENI)') : 'yok');
      if (metin === sonTani && sebep === 'dongu') return;
      sonTani = metin;
      if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'yerlesim', metin: metin });
    } catch (e) {}
  };

  function hazirOlunca() {
    if (!/\\/watch|\\/shorts/.test(location.pathname)) return;
    if (window.__aronSadelestir) window.__aronSadelestir();
    setTimeout(function () { window.__aronYtTani && window.__aronYtTani('hazir'); }, 600);
  }

  var bagliVideo = null;
  function videoyaBagla() {
    var v = document.querySelector('video.html5-main-video');
    if (!v || v === bagliVideo) return;
    bagliVideo = v;
    ['playing', 'canplay', 'loadedmetadata'].forEach(function (ad) { v.addEventListener(ad, hazirOlunca); });
    v.addEventListener('pause', function () { setTimeout(function () { window.__aronYtTani && window.__aronYtTani('pause'); }, 300); });
    if (v.readyState > 0) hazirOlunca();
  }

  setInterval(function () {
    videoyaBagla();
    if (!/\\/watch|\\/shorts/.test(location.pathname)) return;
    var kap = document.getElementById('player-container-id') || document.getElementById('full-bleed-container');
    if (kap && kap !== sonKap && window.__aronSadelestir) window.__aronSadelestir();
    if (window.__aronYtTani) window.__aronYtTani('dongu');
  }, 1000);
})();
`;

const NETFLIX = `
(function () {
  window.__aronIzleme = function () {
    return /^\\/watch\\//.test(location.pathname);
  };

  var mslHatasi = '';
  function mslAnahtarMi(ad) {
    return /msl|nrdp|(^|[^a-z])esn([^a-z]|$)/i.test(String(ad || ''));
  }

  function mslVeritabaniMi(ad) {
    return /msl|nrdp|netflix\.player|cadmium/i.test(String(ad || ''));
  }

  function ilgincAnahtarMi(ad) {
    return /msl|nrdp|esn|cadmium|playdata|drm|widevine/i.test(String(ad || ''));
  }

  function depoDok(kod) {
    var satir = [];
    try {
      var ly = [];
      for (var i = 0; i < localStorage.length; i++) ly.push(localStorage.key(i));
      satir.push('yerel(' + ly.length + ')=' + ly.filter(ilgincAnahtarMi).join(','));
    } catch (e) { satir.push('yerel=okunamadi'); }
    try {
      var sy = [];
      for (var j = 0; j < sessionStorage.length; j++) sy.push(sessionStorage.key(j));
      satir.push('oturum(' + sy.length + ')=' + sy.filter(ilgincAnahtarMi).join(','));
    } catch (e) { satir.push('oturum=okunamadi'); }
    if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'msl', metin: (kod + ' depo ' + satir.join(' ')).slice(0, 600) });
    try {
      if (indexedDB && indexedDB.databases) {
        indexedDB.databases().then(function (ds) {
          var adlar = (ds || []).map(function (d) { return d && d.name; }).filter(Boolean);
          if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'msl', metin: (kod + ' idb=' + adlar.join(',')).slice(0, 400) });
        }, function () {});
      }
    } catch (e) {}
  }

  function mslDepoTemizle() {
    var silinen = 0;
    try {
      var ly = [];
      for (var i = 0; i < localStorage.length; i++) ly.push(localStorage.key(i));
      for (var a = 0; a < ly.length; a++) {
        if (mslAnahtarMi(ly[a])) { try { localStorage.removeItem(ly[a]); silinen++; } catch (e) {} }
      }
    } catch (e) {}
    try {
      var sy = [];
      for (var j = 0; j < sessionStorage.length; j++) sy.push(sessionStorage.key(j));
      for (var b = 0; b < sy.length; b++) {
        if (mslAnahtarMi(sy[b])) { try { sessionStorage.removeItem(sy[b]); silinen++; } catch (e) {} }
      }
    } catch (e) {}
    try {
      if (indexedDB && indexedDB.databases) {
        indexedDB.databases().then(function (ds) {
          for (var c = 0; c < (ds || []).length; c++) {
            var ad = ds[c] && ds[c].name;
            if (ad && mslVeritabaniMi(ad)) {
              try {
                indexedDB.deleteDatabase(ad);
                if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'msl', metin: 'veritabani silindi: ' + ad });
              } catch (e) {}
            }
          }
        }, function () {});
      }
    } catch (e) {}
    return silinen;
  }

  function mslSifirlaVeYenile(kod) {
    if (mslHatasi === kod) return;
    mslHatasi = kod;
    if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'msl', metin: 'cihaz durumu hatasi ' + kod });
    depoDok(kod);
    var simdi = Date.now();
    var sonAn = 0;
    try { sonAn = parseInt(localStorage.getItem('aron_kurtarma_an') || '0', 10) || 0; } catch (e) {}
    if (sonAn && simdi - sonAn < 600000) {
      if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'msl', metin: kod + ' temizlik ' + Math.round((simdi - sonAn) / 1000) + ' sn once denendi, tekrar edilmiyor' });
      return;
    }
    try { localStorage.setItem('aron_kurtarma_an', String(simdi)); } catch (e) {}
    var silinen = mslDepoTemizle();
    if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'msl', metin: kod + ' msl anahtarlari silindi (' + silinen + '), sayfa yenileniyor. Cerezlere dokunulmadi.' });
    setTimeout(function () { try { location.reload(); } catch (e) {} }, 900);
  }
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    var m = '';
    try { m = (r && (r.message || '')) + ' ' + (r && r.subCode ? r.subCode : '') + ' ' + (r && r.extCode ? r.extCode : ''); } catch (h) {}
    if (/Invalid device state|\\b1957\\b/.test(m)) mslSifirlaVeYenile('1957' + (r && r.extCode ? '-' + r.extCode : ''));
  });
  function nfIcSonda(kod) {
    try {
      var pa = window.netflix && window.netflix.appContext && window.netflix.appContext.state && window.netflix.appContext.state.playerApp;
      var d = pa && pa.getState && pa.getState();
      var vp = d && d.videoPlayer;
      if (!vp) { if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfic', metin: kod + ' videoPlayer yok' }); return; }
      var parcalar = [];
      function ozet(x, derin) {
        if (x == null || derin > 3) return String(x);
        if (typeof x !== 'object') return String(x).slice(0, 80);
        var o = [];
        for (var k in x) {
          try {
            var v = x[k];
            if (/error|code|reason|message|fatal|status|category|subCode|extCode|nrdp|esn|blocklist|quality|cdm|robust|support|drm|keySystem/i.test(k)) o.push(k + '=' + (typeof v === 'object' ? ozet(v, derin + 1) : String(v).slice(0, 90)));
          } catch (e) {}
        }
        return '{' + o.join(' ') + '}';
      }
      try { var ce = vp.creationErrorBySessionId; if (ce) parcalar.push('olusturmaHatasi=' + ozet(ce, 0)); } catch (e) {}
      try { var ps = vp.playbackStateBySessionId; if (ps) parcalar.push('durum=' + ozet(ps, 0)); } catch (e) {}
      try { var cp = vp.clientPlaybackCapabilities; if (cp) parcalar.push('yetenek=' + ozet(cp, 0)); } catch (e) {}
      try { var su = vp.playbackSupportFromUA; if (su) parcalar.push('uaDestek=' + ozet(su, 0)); } catch (e) {}
      try { var vse = vp.videoSessionError; if (vse) parcalar.push('oturumHatasi=' + ozet(vse, 0)); } catch (e) {}
      try { var vs = vp.videoSession; if (vs) parcalar.push('oturum=' + ozet(vs, 0)); } catch (e) {}
      if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfic', metin: (kod + ' ' + parcalar.join(' ')).slice(0, 850) });
      function tumDok(ad, x) {
        if (!x || typeof x !== 'object') return;
        var o = [];
        for (var k in x) {
          try {
            var v = x[k];
            o.push(k + '=' + (v && typeof v === 'object' ? '{' + Object.keys(v).slice(0, 12).join(',') + '}' : String(v).slice(0, 60)));
          } catch (e) {}
        }
        if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfyetenek', metin: (kod + ' ' + ad + ' ' + o.join(' ')).slice(0, 900) });
      }
      try { tumDok('yetenekTam', vp.clientPlaybackCapabilities); } catch (e) {}
      try { tumDok('uaDestekTam', vp.playbackSupportFromUA); } catch (e) {}
      try {
        if (pa.getPlaybackSupport) {
          var gps = pa.getPlaybackSupport();
          tumDok('oynatmaDestek', gps);
        }
      } catch (e) {}
    } catch (e) {
      if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfic', metin: kod + ' sonda hatasi ' + ((e && e.message) || e) });
    }
  }

  var icSondaYapildi = false;
  var ekranHatasi = '';
  var videoyokSayac = 0;
  var videoyokBildirildi = false;
  setInterval(function () {
    if (mslHatasi) return;
    try {
      if (location.pathname.indexOf('/watch/') === 0) {
        var vv = null;
        try { vv = document.querySelector('video'); } catch (e) {}
        if (!vv) {
          videoyokSayac++;
          if (videoyokSayac >= 6 && !videoyokBildirildi) {
            videoyokBildirildi = true;
            nfIcSonda('videoyok');
          }
        } else {
          videoyokSayac = 0;
        }
      }
    } catch (e) {}
    try {
      var t = (document.body && document.body.innerText) || '';
      var m = t.match(/[A-Z]\\d{4}-\\d{4}-[0-9A-Z]+/);
      if (m && /-1957-/.test(m[0])) { if (!icSondaYapildi) { icSondaYapildi = true; nfIcSonda(m[0]); } mslSifirlaVeYenile(m[0]); return; }
      var k = t.match(/(?:NSES|UI)-[\\d-]+|[A-Z]\\d{4}-\\d{4}-[0-9A-Z]+|[Kk]od[u]?\\s*[:\\-]?\\s*(\\d{4,5})\\b|\\-\\s*(1044|1001|1002|11800|5\\d{3})\\b/);
      var hataMetni = /Kesinti|özür dileriz|mevcut değil|Something went wrong|Sorry for the interruption|Sorry/i.test(t);
      if (!k && hataMetni && location.pathname.indexOf('/watch/') === 0) {
        var vk = null;
        try { vk = document.querySelector('video'); } catch (e) {}
        if (!vk && ekranHatasi !== 'kodsuz') {
          ekranHatasi = 'kodsuz';
          if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfhata', metin: 'ekranda kodsuz hata sayfasi yol=' + location.pathname });
          if (!icSondaYapildi) { icSondaYapildi = true; nfIcSonda('kodsuz'); }
        }
        return;
      }
      if (k && hataMetni) {
        var yeni = k[0].replace(/^\\-\\s*/, '');
        if (yeni !== ekranHatasi) {
          ekranHatasi = yeni;
          if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfhata', metin: 'ekranda hata kodu ' + yeni + ' yol=' + location.pathname });
          if (!icSondaYapildi) { icSondaYapildi = true; nfIcSonda(yeni); }
        }
      } else ekranHatasi = '';
    } catch (e) {}
  }, 2000);

  window.__aronEngel = function () {
    if (/^\\/unsupported/.test(location.pathname)) {
      return 'Netflix bu cihazın tarayıcısını desteklemiyor.';
    }
    if (mslHatasi) return 'Netflix bu cihazda DRM oturumunu reddetti (' + mslHatasi + ').';
    if (ekranHatasi === 'kodsuz') return 'Netflix bu içeriği bu tarayıcıda oynatmadı. Prime, Disney+ ve YouTube çalışıyor.';
    if (ekranHatasi) return 'Netflix bu içeriği bu cihazda oynatmadı (' + ekranHatasi + ').';
    return '';
  };

  var stil = document.createElement('style');
  stil.textContent = [
    'div[class*="watch-video--back-container"],',
    'div[class*="watch-video--flag-container"],',
    'div[class*="watch-video--bottom-controls-container"] { display: none !important; }'
  ].join('\\n');
  (document.head || document.documentElement).appendChild(stil);

  function nfKimlik() {
    var m = location.pathname.match(/\\/watch\\/(\\d+)/);
    return m ? m[1] : null;
  }

  function nfVeri() {
    try {
      var s = window.netflix && window.netflix.appContext && window.netflix.appContext.state;
      var d = s && s.playerApp && s.playerApp.getState && s.playerApp.getState();
      var vm = d && d.videoPlayer && d.videoPlayer.videoMetadata;
      if (vm) {
        for (var k in vm) {
          var m = vm[k] && vm[k]._metadata && vm[k]._metadata.video;
          if (m) return m;
        }
      }
    } catch (e) {}
    try {
      var fc = window.netflix && window.netflix.falcorCache;
      var v = fc && fc.videos;
      if (v) {
        var kod = nfKimlik();
        if (kod && v[kod]) return v[kod];
        for (var a in v) return v[a];
      }
    } catch (e) {}
    return null;
  }

  var KAPAK_ONEK = 'aronKapak:';
  function nfMetaKapak(payload) {
    try {
      var video = payload && payload.video;
      if (!video) return '';
      var kovalar = [video.artwork, video.storyart, video.boxart];
      for (var i = 0; i < kovalar.length; i++) {
        var liste = kovalar[i];
        if (!Array.isArray(liste)) continue;
        for (var j = 0; j < liste.length; j++) {
          var u = liste[j] && typeof liste[j].url === 'string' ? liste[j].url.trim() : '';
          if (u) return u;
        }
      }
    } catch (e) {}
    return '';
  }
  (function () {
    if (window.__aronNfFetch || typeof window.fetch !== 'function') return;
    window.__aronNfFetch = true;
    var eskiFetch = window.fetch.bind(window);
    window.fetch = function () {
      var bilgi = arguments[0];
      var adres = typeof bilgi === 'string' ? bilgi : (bilgi && typeof bilgi.url === 'string' ? bilgi.url : '');
      var sonuc = eskiFetch.apply(window, arguments);
      if (adres.indexOf('/memberapi/release/metadata') === -1 || adres.indexOf('movieid=') === -1) return sonuc;
      var m = adres.match(/[?&]movieid=(\\d+)/);
      var kod = m ? m[1] : null;
      sonuc.then(function (r) {
        if (!r || typeof r.clone !== 'function' || !kod) return;
        r.clone().json().then(function (p) {
          var u = nfMetaKapak(p);
          if (!u) return;
          nfKapakSakla(kod, u);
          if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfkapak', metin: 'metadata id=' + kod + ' gorsel=' + u.slice(0, 80) });
          if (window.__aronTazele) setTimeout(function () { try { window.__aronBilgiTazele && window.__aronBilgiTazele(); } catch (e) {} }, 0);
        }).catch(function () {});
      }).catch(function () {});
      return sonuc;
    };
  })();
  function nfKapakSakla(kod, url) {
    if (!kod || !url) return;
    try { sessionStorage.setItem(KAPAK_ONEK + kod, url); } catch (e) {}
  }
  function nfKapakOku(kod) {
    if (!kod) return null;
    try { return sessionStorage.getItem(KAPAK_ONEK + kod); } catch (e) { return null; }
  }
  function nfEnBuyukGorsel(kok) {
    var enIyi = null, enAlan = 0;
    try {
      var imgs = (kok || document).getElementsByTagName('img');
      for (var i = 0; i < imgs.length; i++) {
        var im = imgs[i];
        var src = im.currentSrc || im.src || '';
        if (src.indexOf('nflxso.net') === -1) continue;
        var r = im.getBoundingClientRect();
        var alan = r.width * r.height;
        if (alan > enAlan) { enAlan = alan; enIyi = src; }
      }
    } catch (e) {}
    return enAlan >= 4000 ? enIyi : null;
  }
  document.addEventListener('click', function (e) {
    try {
      var n = e.target;
      var derinlik = 0;
      while (n && derinlik++ < 12) {
        var href = n.getAttribute && (n.getAttribute('href') || '');
        var m = href && href.match(/\\/watch\\/(\\d+)/);
        if (m) {
          var kap = n;
          var bulunan = null;
          for (var i = 0; i < 6 && kap; i++) {
            bulunan = nfEnBuyukGorsel(kap);
            if (bulunan) break;
            kap = kap.parentElement;
          }
          if (!bulunan) bulunan = nfEnBuyukGorsel(document);
          nfKapakSakla(m[1], bulunan);
          if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'nfkapak', metin: 'tik id=' + m[1] + ' gorsel=' + (bulunan ? bulunan.slice(0, 90) : 'yok') });
          return;
        }
        n = n.parentElement;
      }
    } catch (e2) {}
  }, true);

  var nfTaniSayisi = 0;
  function nfTani() {
    if (nfTaniSayisi >= 2 || !window.__aronYolla) return;
    if (nfTaniSayisi === 0) setTimeout(nfTani, 9000);
    nfTaniSayisi++;
    try {
      var pa2 = window.netflix && window.netflix.appContext && window.netflix.appContext.state && window.netflix.appContext.state.playerApp;
      if (pa2 && typeof pa2.getState === 'function') {
        var d2 = pa2.getState();
        var vp = d2 && d2.videoPlayer;
        var ek = 'paState=' + (d2 ? Object.keys(d2).slice(0, 20).join(',') : '-');
        ek += ' videoPlayer=' + (vp ? Object.keys(vp).slice(0, 20).join(',') : '-');
        var vm = vp && vp.videoMetadata;
        if (vm) {
          var ks = Object.keys(vm);
          ek += ' videoMetadata=' + ks.slice(0, 3).join(',');
          if (ks.length) {
            var ilk = vm[ks[0]];
            ek += ' ilk=' + (ilk && typeof ilk === 'object' ? Object.keys(ilk).slice(0, 20).join(',') : typeof ilk);
            var md = ilk && ilk._metadata;
            if (md) ek += ' _metadata=' + Object.keys(md).slice(0, 20).join(',');
            var vd = md && md.video;
            if (vd) ek += ' video=' + Object.keys(vd).slice(0, 30).join(',');
          }
        }
        window.__aronYolla({ tur: 'gunluk', seviye: 'nf' + nfTaniSayisi, metin: ek.slice(0, 900) });
      }
    } catch (e3) {}
    var satir = '';
    function ekle(ad, o) {
      try { satir += ' ' + ad + '=' + (o && typeof o === 'object' ? Object.keys(o).slice(0, 16).join(',') : typeof o); }
      catch (e) { satir += ' ' + ad + '=hata'; }
    }
    try {
      var nf = window.netflix;
      ekle('nf', nf);
      var ac = nf && nf.appContext;
      ekle('appContext', ac);
      ekle('state', ac && ac.state);
      var pa = ac && ac.state && ac.state.playerApp;
      ekle('playerApp', pa);
      if (pa && typeof pa.getState === 'function') {
        var d = pa.getState();
        ekle('paState', d);
        ekle('videoPlayer', d && d.videoPlayer);
      }
      ekle('reactContext', nf && nf.reactContext);
      ekle('models', nf && nf.reactContext && nf.reactContext.models);
    } catch (e) { satir += ' hata=' + ((e && e.message) || e); }
    window.__aronYolla({ tur: 'gunluk', seviye: 'nf', metin: satir.slice(0, 560) });
  }

  function nfGorsel(kok) {
    var yigin = [kok];
    var sayac = 0;
    while (yigin.length && sayac < 4000) {
      var n = yigin.pop();
      sayac++;
      if (!n || typeof n !== 'object') continue;
      if (typeof n.url === 'string' && /^https?:\\/\\/.*(jpg|jpeg|png|webp)/i.test(n.url)) return n.url;
      for (var a in n) {
        var v = n[a];
        if (v && typeof v === 'object') yigin.push(v);
      }
    }
    return null;
  }

  function nfMetin(x) {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object') {
      if (typeof x.value === 'string') return x.value;
      if (x.value && typeof x.value === 'object' && typeof x.value.title === 'string') return x.value.title;
    }
    return null;
  }

  window.__aronBaslik = function () {
    nfTani();
    var m = nfVeri();
    if (m) {
      var ad = nfMetin(m.title);
      var bolum = null;
      try {
        if (m.seasons && m.seasons.length) {
          var se = m.seasons[0];
          var ep = se && se.episodes && se.episodes.length ? se.episodes[0] : null;
          if (ep && ep.title) bolum = (se.seq ? 'S' + se.seq : '') + (ep.seq ? 'B' + ep.seq : '') + ' · ' + ep.title;
        }
      } catch (e) {}
      if (ad) return { baslik: bolum ? ad + ' — ' + bolum : ad, yazar: null };
    }
    try {
      var e1 = document.querySelector('div[data-uia="video-title"]');
      if (e1) {
        var h4 = e1.querySelector('h4');
        var ana = ((h4 ? h4.textContent : '') || '').replace(/\\s+/g, ' ').trim();
        if (!ana) ana = (e1.textContent || '').replace(/\\s+/g, ' ').trim();
        var altlar = [];
        var sp = e1.querySelectorAll('span');
        for (var i = 0; i < sp.length; i++) {
          var t = (sp[i].textContent || '').replace(/\\s+/g, ' ').trim();
          if (t) altlar.push(t);
        }
        if (ana) return { baslik: (altlar.length ? ana + ' — ' + altlar.join(' - ') : ana).slice(0, 120), yazar: null };
      }
    } catch (e) {}
    return null;
  };

  window.__aronKapak = function () {
    var saklanan = nfKapakOku(nfKimlik());
    if (saklanan) return saklanan;
    var m = nfVeri();
    if (!m) return null;
    var oncelik = [m.storyArt, m.boxart, m.boxarts, m.artwork, m.artWorkByType, m.backgroundArt, m.interestingMoments];
    for (var i = 0; i < oncelik.length; i++) {
      if (!oncelik[i]) continue;
      var u = nfGorsel(oncelik[i]);
      if (u) return u;
    }
    return nfGorsel(m);
  };

  window.__aronAtla = function (t) {
    try {
      var ms = window.netflix && window.netflix.player && window.netflix.player.MediaSession;
      if (!ms) return false;
      var anahtarlar = Object.keys(ms);
      for (var i = 0; i < anahtarlar.length; i++) {
        var a = ms[anahtarlar[i]];
        if (a && typeof a.seek === 'function') { a.seek(Math.max(0, t) * 1000); return true; }
      }
    } catch (e) {}
    return false;
  };
})();
`;

const DISNEY = `
(function () {
  window.__aronIzleme = function () {
    return /\\/(video|play)\\//.test(location.pathname);
  };

  var stil = document.createElement('style');
  stil.textContent = 'disney-web-player-ui, .btm-media-overlays-container { opacity: 0 !important; pointer-events: none !important; }';
  (document.head || document.documentElement).appendChild(stil);
})();
`;

const PRIME = `
(function () {
  if (window.__aronPrime) return;
  window.__aronPrime = true;

  function av1(t) { return typeof t === 'string' && /av01|av1/i.test(t); }

  try {
    var kaynaklar = [window.MediaSource, window.ManagedMediaSource, window.WebKitMediaSource];
    for (var i = 0; i < kaynaklar.length; i++) {
      (function (K) {
        if (!K || !K.isTypeSupported || K.__aronAv1) return;
        var eski = K.isTypeSupported.bind(K);
        K.isTypeSupported = function (t) { return av1(t) ? false : eski(t); };
        K.__aronAv1 = true;
      })(kaynaklar[i]);
    }
  } catch (e) {}

  try {
    var proto = HTMLMediaElement.prototype;
    var eskiCan = proto.canPlayType;
    proto.canPlayType = function (t) { return av1(t) ? '' : eskiCan.call(this, t); };
  } catch (e) {}

  try {
    var mc = navigator.mediaCapabilities;
    if (mc && mc.decodingInfo) {
      var eskiBilgi = mc.decodingInfo.bind(mc);
      mc.decodingInfo = function (cfg) {
        var t = cfg && cfg.video && cfg.video.contentType;
        if (av1(t)) return Promise.resolve({ supported: false, smooth: false, powerEfficient: false });
        return eskiBilgi(cfg);
      };
    }
  } catch (e) {}

  function metin(sec) {
    try {
      var e = document.querySelector(sec);
      var t = e && (e.innerText || e.textContent);
      return t ? t.replace(/\\s+/g, ' ').trim() : '';
    } catch (e) { return ''; }
  }

  window.__aronIzleme = function () {
    try {
      var vs = document.getElementsByTagName('video');
      for (var i = 0; i < vs.length; i++) {
        var v = vs[i];
        var d = v.duration;
        if (typeof d === 'number' && isFinite(d) && d > 600) return true;
        var r = v.getBoundingClientRect();
        if (r.width >= innerWidth * 0.9 && r.height >= innerHeight * 0.6) return true;
      }
    } catch (e) {}
    return false;
  };

  window.__aronBaslik = function () {
    var ad = metin('.atvwebplayersdk-title-text');
    if (ad) {
      var alt = metin('.atvwebplayersdk-subtitle-text');
      return { baslik: (alt ? ad + ' — ' + alt : ad).slice(0, 120), yazar: null };
    }
    var d = (document.title || '').replace(/^Prime Video:\\s*/i, '').trim();
    if (!d || /Filmleri, TV dizilerini|Watch Movies|^Prime Video$|Temporarily Unavailable/i.test(d)) return null;
    return { baslik: d.slice(0, 120), yazar: null };
  };

  window.__aronKapak = function () {
    var enIyi = null;
    var enAlan = 0;
    try {
      var imgs = document.images;
      for (var i = 0; i < imgs.length; i++) {
        var im = imgs[i];
        var src = im.currentSrc || im.src || '';
        if (src.indexOf('pv-target-images') === -1) continue;
        var alan = (im.naturalWidth || im.clientWidth || 0) * (im.naturalHeight || im.clientHeight || 0);
        if (alan > enAlan) { enAlan = alan; enIyi = src; }
      }
    } catch (e) {}
    return enAlan >= 20000 ? enIyi : null;
  };

  function primeVideoBul() {
    var v = null, enPuan = -1;
    try {
      var vs = document.getElementsByTagName('video');
      for (var i = 0; i < vs.length; i++) {
        var d = vs[i].duration;
        var r = vs[i].getBoundingClientRect();
        var puan = r.width * r.height + (typeof d === 'number' && isFinite(d) && d > 600 ? 1e9 : 0);
        if (puan > enPuan) { enPuan = puan; v = vs[i]; }
      }
    } catch (e) {}
    return v;
  }

  function primeKatmanlariGizle(v) {
    var kap = null;
    try {
      kap = v.closest('.atvwebplayersdk-player-container')
        || v.closest('div[id*="dv-web-player"]')
        || v.closest('[class*="dv-player"]')
        || v.closest('[class*="webPlayer"]');
    } catch (e) {}
    if (!kap) return 'kap-yok';
    var kalsin = [v];
    try { kalsin = kalsin.concat(Array.prototype.slice.call(kap.querySelectorAll('.atvwebplayersdk-captions-overlay'))); } catch (e) {}
    var hepsi = kap.querySelectorAll('*');
    var gizlenen = 0;
    for (var i = 0; i < hepsi.length; i++) {
      var el = hepsi[i];
      var tut = false;
      for (var k = 0; k < kalsin.length; k++) {
        var m = kalsin[k];
        if (el === m || m.contains(el) || el.contains(m)) { tut = true; break; }
      }
      try {
        if (tut) el.style.removeProperty('display');
        else if (el.style.display !== 'none') { el.style.setProperty('display', 'none', 'important'); gizlenen++; }
      } catch (e) {}
    }
    try { kap.style.removeProperty('display'); } catch (e) {}
    return 'gizlenen=' + gizlenen;
  }

  window.__aronSadelestir = function () {
    if (!window.__aronIzleme || !window.__aronIzleme()) return;
    var v = primeVideoBul();
    if (!v) return;
    var sonuc = primeKatmanlariGizle(v);
    setTimeout(function () {
      try {
        var vr = v.getBoundingClientRect();
        var cs = getComputedStyle(v);
        var cx = Math.round(vr.left + vr.width / 2), cy = Math.round(vr.top + vr.height / 2);
        var ust = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, cx)), Math.max(0, Math.min(innerHeight - 1, cy)));
        var ustAd = ust ? (ust.tagName + (ust.id ? '#' + ust.id : '') + (ust.className && typeof ust.className === 'string' ? '.' + ust.className.split(' ').slice(0, 2).join('.') : '')) : '-';
        var ustBg = ust && ust !== v ? getComputedStyle(ust).backgroundColor : '';
        var tam = null;
        try { tam = document.querySelector('div[id*="dv-web-player"].dv-player-fullscreen'); } catch (e) {}
        var yigin = [];
        try {
          var liste = document.elementsFromPoint(Math.max(0, Math.min(innerWidth - 1, cx)), Math.max(0, Math.min(innerHeight - 1, cy)));
          for (var q = 0; q < Math.min(8, liste.length); q++) {
            var el = liste[q];
            var st = getComputedStyle(el);
            yigin.push((el === v ? 'VIDEO*' : el.tagName) + (el.id ? '#' + el.id.slice(0, 16) : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0].slice(0, 14) : '')
              + '{bg=' + st.backgroundColor.replace(/\\s/g, '') + ' op=' + st.opacity + (st.filter && st.filter !== 'none' ? ' filt' : '') + (st.backdropFilter && st.backdropFilter !== 'none' ? ' bdf' : '') + '}');
          }
        } catch (e) {}
        var atalar = [];
        try {
          var a = v.parentElement, derin = 0;
          while (a && derin++ < 8) {
            var as = getComputedStyle(a);
            var not = [];
            if (as.opacity !== '1') not.push('op=' + as.opacity);
            if (as.filter && as.filter !== 'none') not.push('filt');
            if (as.backdropFilter && as.backdropFilter !== 'none') not.push('bdf');
            if (as.mixBlendMode && as.mixBlendMode !== 'normal') not.push('blend');
            if (as.transform && as.transform !== 'none') not.push('tf');
            if (as.visibility !== 'visible') not.push('vis=' + as.visibility);
            if (not.length) atalar.push(a.tagName + (a.id ? '#' + a.id.slice(0, 14) : '') + '[' + not.join(',') + ']');
            a = a.parentElement;
          }
        } catch (e) {}
        if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'yerlesim', metin:
          'gorunum=' + innerWidth + 'x' + innerHeight + ' video=' + Math.round(vr.left) + ',' + Math.round(vr.top) + ' ' + Math.round(vr.width) + 'x' + Math.round(vr.height)
          + ' kare=' + v.videoWidth + 'x' + v.videoHeight + ' duraklatildi=' + v.paused + ' hazir=' + v.readyState
          + ' opak=' + cs.opacity + ' gorunur=' + cs.visibility + ' display=' + cs.display
          + ' ustte=' + ustAd.slice(0, 60) + (ustBg ? ' zemin=' + ustBg : '') + ' tamEkran=' + (tam ? 'evet' : 'hayir') + ' ' + sonuc
          + ' yigin=' + yigin.join(' > ') + ' atalar=' + (atalar.join(' ') || 'temiz') });
      } catch (e) {}
    }, 800);
  };

  var oynananKimlik = null;
  function detayKimligi(yol) {
    var m = String(yol || '').match(/\\/detail\\/([A-Z0-9]+)/i);
    return m ? m[1] : null;
  }
  document.addEventListener('playing', function (e) {
    var t = e && e.target;
    if (!t || t.tagName !== 'VIDEO') return;
    var d = t.duration;
    if (typeof d === 'number' && isFinite(d) && d > 600) oynananKimlik = detayKimligi(location.pathname) || oynananKimlik || '?';
  }, true);
  function baskaBasligaGecildi() {
    if (!oynananKimlik) return;
    var yeni = detayKimligi(location.pathname);
    if (!yeni || yeni === oynananKimlik) return;
    if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'prime', metin: 'baska baslik ' + oynananKimlik + ' -> ' + yeni + ', sayfa tazeleniyor' });
    oynananKimlik = null;
    setTimeout(function () { location.reload(); }, 0);
  }
  var pPush = history.pushState;
  history.pushState = function () {
    var r = pPush.apply(this, arguments);
    setTimeout(baskaBasligaGecildi, 0);
    return r;
  };
  var pRep = history.replaceState;
  history.replaceState = function () {
    var r = pRep.apply(this, arguments);
    setTimeout(baskaBasligaGecildi, 0);
    return r;
  };
  window.addEventListener('popstate', function () { setTimeout(baskaBasligaGecildi, 0); });

  var anahtar = 'aronPrimeDeneme';
  function deneme() { try { return parseInt(sessionStorage.getItem(anahtar) || '0', 10) || 0; } catch (e) { return 0; } }
  function denemeYaz(n) { try { sessionStorage.setItem(anahtar, String(n)); } catch (e) {} }
  function engelMi() {
    try {
      var t = (document.title || '') + ' ' + ((document.body && document.body.innerText) || '').slice(0, 400);
      return /Website Temporarily Unavailable|Service is temporarily unavailable/i.test(t);
    } catch (e) { return false; }
  }
  function bak() {
    if (engelMi()) {
      var n = deneme();
      if (n < 2) {
        denemeYaz(n + 1);
        if (window.__aronYolla) window.__aronYolla({ tur: 'gunluk', seviye: 'engel', metin: 'prime engel sayfasi, yeniden yukleniyor (' + (n + 1) + ')' });
        setTimeout(function () { location.reload(); }, 700 * (n + 1));
      }
      return;
    }
    denemeYaz(0);
  }
  setTimeout(bak, 1200);
})();
`;

const AV1_ENGEL = `
(function () {
  if (window.__aronAv1Engel) return;
  window.__aronAv1Engel = true;

  function av1(t) { return typeof t === 'string' && /av01|(^|[^a-z])av1([^a-z]|$)/i.test(t); }

  try {
    var kaynaklar = [window.MediaSource, window.ManagedMediaSource, window.WebKitMediaSource];
    for (var i = 0; i < kaynaklar.length; i++) {
      (function (K) {
        if (!K || !K.isTypeSupported || K.__aronAv1) return;
        var eski = K.isTypeSupported.bind(K);
        K.isTypeSupported = function (t) { return av1(t) ? false : eski(t); };
        K.__aronAv1 = true;
      })(kaynaklar[i]);
    }
  } catch (e) {}

  try {
    var proto = HTMLMediaElement.prototype;
    var eskiCan = proto.canPlayType;
    proto.canPlayType = function (t) { return av1(t) ? '' : eskiCan.call(this, t); };
  } catch (e) {}

  try {
    var mc = navigator.mediaCapabilities;
    if (mc && mc.decodingInfo) {
      var eskiBilgi = mc.decodingInfo.bind(mc);
      mc.decodingInfo = function (cfg) {
        var t = cfg && cfg.video && cfg.video.contentType;
        if (av1(t)) return Promise.resolve({ supported: false, smooth: false, powerEfficient: false });
        return eskiBilgi(cfg);
      };
    }
  } catch (e) {}
})();
`;

const TWITCH = `
(function () {
  window.__aronIzleme = function () {
    var p = location.pathname;
    if (/^\\/videos\\/\\d+/.test(p)) return true;
    if (/\\/clip\\//.test(p)) return true;
    if (/^\\/[a-zA-Z0-9_]+$/.test(p) && !/^\\/(directory|search|settings|subscriptions|inventory|drops|wallet|downloads|p|u)$/i.test(p)) {
      try { if (document.querySelector('video')) return true; } catch (e) {}
    }
    return false;
  };
  window.__aronBaslik = function () {
    try {
      var t = document.querySelector('[data-a-target="stream-title"]');
      if (t) {
        var kanal = '';
        try { var k = document.querySelector('h1[data-a-target="stream-title"]'); if (!k) k = document.querySelector('[data-a-target="channel-header-display-name"]'); kanal = k ? (k.textContent || '').trim() : ''; } catch (e) {}
        return { baslik: (t.textContent || '').trim().slice(0, 120), yazar: kanal || null };
      }
    } catch (e) {}
    var d = (document.title || '').replace(/ - Twitch$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const DAILYMOTION = `
(function () {
  window.__aronIzleme = function () {
    return /^\\/video\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/ - Dailymotion$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const REDDIT = `
(function () {
  window.__aronIzleme = function () {
    if (/\\/comments\\//.test(location.pathname)) {
      try { if (document.querySelector('video, shreddit-player')) return true; } catch (e) {}
    }
    return false;
  };
  window.__aronBaslik = function () {
    try { var h = document.querySelector('h1'); if (h) return { baslik: (h.textContent || '').trim().slice(0, 120), yazar: null }; } catch (e) {}
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    return null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const TUBI = `
(function () {
  window.__aronIzleme = function () {
    return /^\\/(movies|tv-shows|video)\\/\\d+/.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Tubi$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const VIMEO = `
(function () {
  window.__aronIzleme = function () {
    return /^\\/\\d+/.test(location.pathname) || /^\\/[^/]+\\/[^/]+/.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/ on Vimeo$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const PEACOCK = `
(function () {
  window.__aronIzleme = function () {
    return /\\/watch\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Peacock$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const PLUTO = `
(function () {
  window.__aronIzleme = function () {
    return /\\/(on-demand|live-tv)\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Pluto TV$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const VK = `
(function () {
  window.__aronIzleme = function () {
    return /\\/video-?\\d+_\\d+/.test(location.pathname) || /\\/clip-?\\d+_\\d+/.test(location.pathname) || /^\\/video$/.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    return null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const RUTUBE = `
(function () {
  window.__aronIzleme = function () {
    return /^\\/(video|stream|live\\/video|shorts|embed|play\\/embed)\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) { var t = m.content.replace(/\\s*[-—]\\s*[Сс]мотреть онлайн.*$/i, '').trim(); return t ? { baslik: t.slice(0, 120), yazar: null } : null; } } catch (e) {}
    var d = (document.title || '').replace(/\\s*[-—]\\s*[Сс]мотреть.*$/i, '').replace(/\\s*[-|]\\s*Rutube$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const TWITTER = `
(function () {
  window.__aronIzleme = function () {
    if (/\\/status\\/\\d+/.test(location.pathname)) {
      try { if (document.querySelector('video')) return true; } catch (e) {}
    }
    if (/\\/i\\/broadcasts\\//.test(location.pathname)) return true;
    return false;
  };
  window.__aronBaslik = function () {
    try {
      var a = document.querySelector('article');
      if (a) {
        var divs = a.querySelectorAll('div[data-testid="tweetText"]');
        if (divs.length) { var t = (divs[0].textContent || '').trim(); if (t) return { baslik: t.slice(0, 120), yazar: null }; }
      }
    } catch (e) {}
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    return null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const HBO_MAX = `
(function () {
  window.__aronIzleme = function () {
    return /\\/video\\/watch\\//.test(location.pathname) || /\\/player\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Max$/i, '').replace(/[|-] HBO Max$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const HULU = `
(function () {
  window.__aronIzleme = function () {
    return /\\/watch\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Hulu$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const CRUNCHYROLL = `
(function () {
  window.__aronIzleme = function () {
    return /\\/watch\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Crunchyroll$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const APPLE_TV = `
(function () {
  window.__aronIzleme = function () {
    return /\\/play\\//.test(location.pathname) || /\\/episode\\//.test(location.pathname) || /\\/movie\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    try { var m = document.querySelector('meta[property="og:title"]'); if (m && m.content) return { baslik: m.content.trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Apple TV[+]?$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const PLEX = `
(function () {
  window.__aronIzleme = function () {
    return /\\/player/.test(location.hash || location.pathname);
  };
  window.__aronBaslik = function () {
    try { var t = document.querySelector('[class*="MetadataPosterTitle"]'); if (t) return { baslik: (t.textContent || '').trim().slice(0, 120), yazar: null }; } catch (e) {}
    var d = (document.title || '').replace(/[|-] Plex$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () {
    try { var m = document.querySelector('meta[property="og:image"]'); if (m && m.content) return m.content; } catch (e) {}
    return null;
  };
})();
`;

const GOOGLE_DRIVE = `
(function () {
  window.__aronIzleme = function () {
    return /\\/file\\/d\\//.test(location.pathname);
  };
  window.__aronBaslik = function () {
    var d = (document.title || '').replace(/ - Google Drive$/i, '').trim();
    return d ? { baslik: d.slice(0, 120), yazar: null } : null;
  };
  window.__aronKapak = function () { return null; };
})();
`;

const EKLER: Partial<Record<PlatformKodu, string>> = {
  youtube: YOUTUBE,
  netflix: NETFLIX,
  disney_plus: DISNEY,
  prime_video: PRIME,
  twitch: TWITCH,
  dailymotion: DAILYMOTION,
  reddit: REDDIT,
  tubi: TUBI,
  vimeo: VIMEO,
  peacock: PEACOCK,
  pluto: PLUTO,
  vk: VK,
  rutube: RUTUBE,
  twitter: TWITTER,
  hbo_max: HBO_MAX,
  hulu: HULU,
  crunchyroll: CRUNCHYROLL,
  apple_tv: APPLE_TV,
  plex: PLEX,
  google_drive: GOOGLE_DRIVE,
};

const ORTAM_YAMASIZ = new Set<PlatformKodu>(["prime_video"]);

const NETFLIX_ANDROID_EK = `
(function () {
  if (window.__aronNfYerel) return;
  window.__aronNfYerel = true;
  var yolla = window.__aronYolla || function () {};
  var gonderildi = '';
  setInterval(function () {
    try {
      var m = location.pathname.match(/^\\/watch\\/(\\d+)/);
      if (!m) { gonderildi = ''; return; }
      var kod = m[1];
      if (kod === gonderildi) return;
      gonderildi = kod;
      yolla({ tur: 'netflix-yerel', videoId: kod });
    } catch (e) {}
  }, 1500);
})();
`;

export function kopruBetigi(platform: PlatformKodu): string {
  const ajan = kullaniciAjani(platform);
  const safari = ajan === MASAUSTU_SAFARI;
  const netflixAndroid = Platform.OS === "android" && platform === "netflix";
  let ortam: string;
  if (netflixAndroid) ortam = TURTLE_ORTAM;
  else if (ORTAM_YAMASIZ.has(platform)) ortam = "";
  else ortam = masaustuOrtami(safari, ajan === MASAUSTU_LINUX_CHROME ? "Linux x86_64" : "MacIntel");
  const av1 = Platform.OS === "android" ? AV1_ENGEL : "";
  const nfYerel = netflixAndroid ? NETFLIX_ANDROID_EK : "";
  return `${ortam}\n${MSE}\n${av1}\n${MEDYA}\n${TEMEL}\n${EKLER[platform] ?? ""}\n${nfYerel}\n${ORTAK}\n${TANI}\ntrue;`;
}

function komut(kod: string): string {
  return `try { ${kod} } catch (e) {} true;`;
}

export const KOMUT = {
  oynat: komut("window.__aron && window.__aron.oynat()"),
  duraklat: komut("window.__aron && window.__aron.duraklat()"),
  sadelestir: komut("window.__aron && window.__aron.sadelestir()"),
  atla: (saniye: number) => komut(`window.__aron && window.__aron.atla(${saniye})`),
  ses: (deger: number) => komut(`window.__aron && window.__aron.ses(${deger})`),
};

export function olayCoz(ham: string): OynaticiOlayi | null {
  try {
    const o = JSON.parse(ham) as OynaticiOlayi;
    return o && typeof o.tur === "string" ? o : null;
  } catch {
    return null;
  }
}
