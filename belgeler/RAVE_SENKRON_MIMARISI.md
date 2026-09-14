# Rave senkron / oda / atma / ping mimarisi — kazı raporu

Kaynak: Rave 9.0.28-2328 prod APK (`base.apk` + `split_config.arm64_v8a.apk`).
jadx ile `classes11.dex` ve `classes12.dex` decompile edildi; `com.wemesh.android.legacy.*`
paketleri okundu. **IPA indirilemedi** (aşağıda "iOS" bölümü).

Rave dilinde bir izleme odasına **mesh** deniyor. Aşağıda "oda" = mesh.

---

## 1. Katmanlar

| Katman | Nerede | İş |
| --- | --- | --- |
| Merkezi sunucu (Gatekeeper) | `api.red.wemesh.ca`, Retrofit | Oda oluştur/katıl/ayrıl/at/davet, state yaz |
| Switchboard | `libswitchboard_client.so` (native C++) | Gerçek zamanlı state yayını + **saat senkronu (ping/offset)** |
| mediasoup | `libmediasoupclient_so.so` (native) | Sesli sohbet (VOIP), SFU |
| State makinesi | `legacy/state/*` (Kotlin) | Gelen state'i oynatıcıya uygular, lider giden state üretir |
| WebView köprüleri | `assets/*.js` | Platform sayfalarına enjekte edilen scriptler |

**Önemli:** Senkronun kalbi (saat offseti, yayın soketi) **native C++**. Byte-byte
kopyalanamaz; ama protokolün **veri şeması ve matematiği** okunabilir ve birebir taklit
edilebilir. Bizim tarafta transport zaten Supabase realtime; Switchboard'a ihtiyaç yok.

---

## 2. Oda state şeması (sunucu → istemci)

`StateMessageModel` — soketten gelen tam JSON:

```
{
  "__metadata":     { ... },          // oda bilgisi (Metadata)
  "mesh_state":     { ... },          // OYNATIM DURUMU (MeshState) — senkronun özü
  "users":          [ User, ... ],    // katılımcılar
  "votes":          [ Vote, ... ],    // sıradaki video oylaması
  "likeskips":      [ Likeskip, ... ],
  "kicks":          [ <userId>, ... ],// ATILAN kullanıcı id'leri
  "cleared_votes":  [ "<url>", ... ],
  "vote_originator": <userId | null>
}
```

### MeshState (oynatım durumu) — `mesh_state`

```
{
  "position":              <double>,  // videodaki saniye
  "time":                  <double>,  // bu durumun konduğu SUNUCU SAATİ (saniye)
  "status":                "PLAY" | "PAUS" | "WAIT" | ...,
  "playback_speed":        <float>,   // 1.0 vb
  "play_mode":             <string>,
  "url" / "video_url":     <string>,  // ne oynuyor
  "server":                <string>,  // platform (netflix/youtube/...)
  "video_instance_id":     <string>,
  "privacy_mode":          <string>,
  "voip_mode":             <string>,
  "maturity":              <string>,
  "pitch_corrected":       <bool>,
  "auto_pitch_corrected":  <bool>
}
```

---

## 3. Senkron matematiği (kaz: `StateMachine.java`)

Efektif konum, `position` + geçen süre × hız ile hesaplanır. Kaynaktaki formül aynen:

```
efektifKonum = mesh_state.position
             + (suSunucuSaati - mesh_state.time) * mesh_state.playback_speed
```

`suSunucuSaati` = `ClockManager.getCurrentTime()`.

### Sunucu saati ve ping (kaz: `ClockManager.java`)

- `getCurrentTime()` = **native** `getCurrentSyncTime(handle)` + `HACK_OFFSET`.
- `HACK_OFFSET` = SDK ≥ 24 için **0.044 s**, altı için **0.081 s** — ses/görüntü gecikme telafisi.
- Native lib soket gidiş-dönüşüyle (ping) yerel saat ile sunucu saati arasındaki **offset**i
  sürekli ölçer; `getCurrentSyncOffset(handle)` bunu verir. Bağlantı yoksa yerel saate düşer.
- Yani "ping" = Switchboard'ın sürekli RTT/offset ölçümü. NTP mantığı.

### Değişimi geleceğe zamanlama (kritik ayrıntı)

Lider bir değişiklik yolladığında (hız, pitch), değişim **anında** değil, bir sonraki
yuvarlanmış sunucu-saati anında uygulanır:

```
ceil = Math.ceil(suSunucuSaati + 0.25)     // ~çeyrek saniye sonrası, tam saniyeye yuvarlı
yeniState.time     = ceil
yeniState.position = efektifKonum + (ceil - suSunucuSaati) * hiz
```

Böylece bütün istemciler aynı **mutlak an**da aynı konuma atlar; kimse önce/sonra kaymaz.
Bizim senkronumuza koymamız gereken en önemli davranış budur.

---

## 4. Lider (host) modeli (kaz: `ParticipantsManager.java`)

- Her katılımcının `isLeader` bayrağı var. `getLeader()` = `isLeader` olan katılımcı.
- Sıralama (`participantComparator`): lider en üstte, sonra **`whenJoined`** (en erken katılan).
- Lider ayrılırsa `onLeaderChanged` ile **en erken katılan** lider olur.
- `iAmLeader()` = `leader.id == benimId`.
- Oynatım denetimi lidere bağlı: `sendPlaybackSpeedChange`, `sendPitchModeChange` lider
  değilse **reddediliyor** ("Rejected: not the leader"). Play/Pause herkeste; hız/pitch/mod
  liderde. Sıradaki video ise `play_mode`'a göre (oy/lider/otomatik).

---

## 5. Oda REST sözleşmesi (kaz: `GatekeeperService.java`, `GatekeeperServer.java`)

Taban: `api.red.wemesh.ca`. Retrofit, Bearer oturum. Tüm yazan çağrılar `uuid` (cihaz) taşır.

| İş | Yöntem + yol | Gövde |
| --- | --- | --- |
| Oda oluştur | `POST meshes` | `UrlRequest(url)` → `Mesh` |
| Oynatım state yaz | `PUT meshes/{mesh-id}/state` | `RaveStateUpdate` |
| Yayını bitir | `POST meshes/{mesh-id}/state/endstream` | — |
| **Odadan at** | `POST meshes/{mesh-id}/kick` | `IdsRequest([userId...], uuid)` |
| Odadan ayrıl | `DELETE meshes/{mesh-id}/devices/{device-id}/leave` | — (cihaz bazlı) |
| Davet | `POST meshes/{mesh-id}/invites` / `DELETE .../invites` | `IdsRequest` |
| Engelli listesi | `GET meshes/{mesh-id}/blockedusers` | — |
| Sıraya oy | `POST meshes/{mesh-id}/votes` / `votes/clear` | — |
| Oda listesi | `GET meshes` (sayfalı) | — |
| Kullanıcı engelle | `POST users/self/blocks` | — |
| Video kaynağı üret | `POST videos/{platform}` | url |

Notlar:
- **Atma iki yerde:** REST `kick` çağrısı + gelen state'teki `kicks` listesi. İstemci
  `kicks` içinde kendi id'sini görürse odadan atılır; başkalarını listeden düşürür.
- **Ayrılma cihaz bazlı** (`devices/{device-id}/leave`) — bir kullanıcı birden çok cihazdan
  aynı odada olabilir, her biri ayrı. Bizim `oda_hareket_log` giriş/çıkışıyla örtüşüyor.
- State yazımı REST (`PUT .../state`), state alımı Switchboard soketi. Lider REST'e yazar,
  sunucu sokete fan-out yapar.

### Oda ayarları (kaz: `PlaybackSetting`, `PrivacySetting`)

- **Gizlilik** (`privacy_mode`): `PUBLIC`, `FRIENDS`, `INVITE`.
- **Oynatım/sıra modu** (`play_mode`): `VOTE` (oyla), `QUICKPLAY`, `AUTOPLAY`, `LEADER`.
- **VOIP** (`voip_mode`): sesli sohbet açık/kapalı/kime.

---

## 6. Platformlar (kaz: `assets/*.js`, `videos/{platform}` uçları, dizeler)

Rave'in desteklediği ve **enjekte script**i olan platformlar:

| Platform | Script | Oynatım yolu |
| --- | --- | --- |
| YouTube | `youtubejs.extractor.js`, `po_token.html`, `web.js` | JS çıkarıcı → yerel |
| Netflix | `netflix.js` | **MSL → yerel** (bizde Android'de var) |
| Amazon Prime | `amazon.js` | tıklama yakalama → yerel |
| Disney+ | `disney.js` | sayfa izleme |
| HBO/Max | `hbomax.js` (MediaSource stub) | yerel |
| Crunchyroll | `crunchyroll.js/css` | history hook |
| Pluto TV | `pluto.js/css` | splash izleme |
| Tubi | (`videos/tubi`) | web |
| Twitch | `videos/twitch` | web |
| X/Twitter | `x.js/css`, `x_auth_error_watcher.js` | web |
| VK | `vk.css` | web |
| Rutube | `rutube.js/css` | cookie izleme |
| Google Drive | `googledrive.js/css/values` | initData çıkarımı |
| Google Photos | `googlephoto.js` | web |
| Web (doğrudan) | `web.js` | url izleme |

Ortak köprü: WebView'e `JSInterface` enjekte edilir; scriptler `pageChanged`,
`onPlayClicked`, `saveLogin`, `onCookiesChanged`, `splashFinished` çağırır.

---

## 7. Bizim uygulamaya çıkarımlar

### Senkron (uygulanacak)
Bizde sync Supabase realtime broadcast (`kanalRef.sohbetYolla`, `oynatimYayinla`). Şu an
yayınlanan konum ham; Rave'in **drift düzeltmesi + sunucu saati + geleceğe zamanlama** yok.
Eklenmesi gereken:
1. Yayına `{ position, time(sunucu saati), status, speed }` koy.
2. Alıcı efektif konumu §3 formülüyle hesaplasın.
3. Değişimleri §3'teki gibi bir sonraki ortak ana zamanla (herkes aynı anda atlasın).
4. Sunucu saati offseti: Supabase `now()` ya da hafif bir zaman ucu ile ölç (native gerekmez).

### Lider modeli (uygulanacak)
Oda sahibi = lider; ayrılırsa en erken katılan. Oynatım denetimini lidere bağla. Bizde
oda sahibi/rol var (`roomsRepo`, yetki); üstüne "yalnız lider oynat/duraklat yayar" kuralı.

### Atma (kısmen var)
Bizde `oda_yasaklari` + `banRoomUser` var (REST karşılığı). Eksik: atılanın state akışında
anında düşürülmesi/çıkarılması — Rave'in `kicks` listesi mantığı. Realtime "kick" olayı
yayınlanmalı.

### iOS — ASIL EKSİK (kaz: `parti-oda.tsx`, `modules/aron-player`)
- `aron-player` yerel modülü **yalnız Android** (ExoPlayer + MSL, Kotlin).
- `parti-oda.tsx` içinde `netflix-yerel`, `max-yerel`, `youtube-yerel`, `prime-yerel`
  yollarının **hepsi** `Platform.OS === "android" && nativeOynaticiVar()` ile kapalı.
- iOS'te bu platformlar WebView'e (`PartiOynatici`) düşüyor. KURAL 1: iOS'te WebView + EME +
  FairPlay çalışıyor deniyor; ama yerel çıkarım yolu iOS'te hiç yok, dolayısıyla Android'de
  yerel açılan içerikler iOS'te yalnız WebView'in izin verdiği kadar açılıyor.
- **iOS binary (IPA) gerekiyor:** Rave iOS'te hangi platformu WebView mi yerel AVPlayer +
  FairPlay mi açtığını, hangi JS'i enjekte ettiğini görmeden iOS par.itesini birebir
  kuramayız. IPA şu an indirilemedi (bkz. aşağı).

---

## 8. iOS binary kazısı (IPA 8.1.1, decrypted)

IPA indirildi: **Rave 8.1.1 (build 2697), iOS 15+, arm64.** Mach-O `cryptid=0` — yani
**şifresiz**, semboller/stringler doğrudan okunabildi. **Sürüm notu:** IPA (8.1.1,
Temmuz 2025) APK'dan (9.0.28) ~13 ay eski; platform seti aynı ama yeni özellikler
Android'de daha ileri olabilir.

### iOS oynatım mimarisi (frameworks + binary sembolleri)

iOS'te oynatım **WebView değil**, Android'deki gibi **yerel oynatıcı**. Kanıtlar:

| Bileşen | Framework / sembol | İş |
| --- | --- | --- |
| Yerel oynatıcı | `AVPlayer`, `avPlayerLayer`, `CustomAVPlayer` | Video oynatma |
| DRM | `AVAssetResourceLoadingRequest`, `FairPlayLicense`, `fairPlayCertificateBytes`, `fetchCert…withFairPlayKeyId`, `drmKeySystem: fairplay` | FairPlay SPC/CKC anahtar değişimi |
| HLS ayrıştırma | `mamba.framework` | m3u8 manifest çözümleme |
| Yerel sunucu | `GCDWebServer`, `Criollo`, `Swifter` | Yeniden yazılmış manifesti AVPlayer'a yerelden servis |
| Manifest/DRM köprü | `ManifestoClient.framework` | (Android'deki `libmanifesto_client.so` karşılığı) |
| Altyazı | `SwiftWebVTT.framework` | WebVTT altyazı |
| Senkron | `SwitchboardClient.framework` | Android ile **aynı** sync katmanı |
| Sesli sohbet | `Mediasoup.framework` + `WebRTC.framework` | VOIP |
| Kısmi UI | `Flutter.framework` + `App.framework` | Bazı ekranlar Flutter |

### iOS Netflix akışı (kaz: `getMslData`, `mslKey`, `hlsManifestURL`)

iOS'te Netflix de **MSL** kullanıyor (Swift sembolleri `%MslData`, `getMslData`, `mslKey`):

1. WKWebView netflix.com'u açar, kullanıcı giriş yapar; `netflix.js` yalnız **kozmetik**
   (e-posta formu/reklam gizler) — Android'deki gibi ağır iş JS'te değil.
2. Yerel Swift MSL ile manifest ister: `…&deviceType=ios&drmCapabilities=fairplay`.
   Yanıt `serializedHouseBrandPlayerResponse` içinde **`hlsManifestURL`** + FairPlay anahtar
   bilgisi taşır.
3. `mamba` HLS'i ayrıştırır, `GCDWebServer` yeniden yazılmış manifesti yerelden servis eder.
4. `AVPlayer` oynatır; `AVAssetResourceLoaderDelegate` anahtar isteklerini yakalar →
   FairPlay SPC/CKC → şifre çözülür. Altyazı `SwiftWebVTT` ile.
5. **`hlsManifestURL` yoksa** binary'deki mesaj: *"No hlsManifestUrl found, falling back to
   web client"* — yani WebView oynatımına düşer. WebView yalnız **yedek**.

Diğer platformlar (Prime `amazon.js`, Disney `disney.js`, Max `max.js`, YouTube
`po_token.js`+`sighelper.js`+`acorn.js`, Pluto/Tubi/Twitch/VK/Rutube/Drive/Photos) aynı
kalıpta: WKWebView + kozmetik/çıkarım JS, sonra mümkünse yerel AVPlayer, değilse WebView.

### iOS platform seti (`videos/{platform}`, 8.1.1)

gdrive, gphotos, youtube, web, twitter, twitch, tubi, pluto, netflix, hbomax, discomax(Max),
disney, crunchy, amazon (+ dizelerde vimeo, vk, dailymotion, soundcloud, kick). **Android
9.0.28 ile esas aynı** — fark platform listesi değil, oynatım yolunun olgunluğu.

### Bizim iOS için sonuç

Rave iOS'te DRM'li içeriği **WebView EME/FairPlay ile değil**, yerel **AVPlayer +
AVAssetResourceLoaderDelegate + FairPlay ContentKey + yerel HLS sunucu (mamba/GCDWebServer)
+ ManifestoClient** ile oynatıyor; WebView yalnızca manifest bulunamazsa yedek. Bizim
`aron-player` yerel modülümüz yalnız Android (ExoPlayer). **iOS paritesi için Swift tarafında
eş bir yerel oynatıcı gerekiyor:** MSL/manifest çıkar → HLS'i AVPlayer'a yerel sunucudan besle
→ AVAssetResourceLoaderDelegate ile FairPlay anahtarını çöz. KURAL 1'deki "iOS WebView + EME +
FairPlay çalışıyor" ifadesi eksik/yanıltıcı: Rave'de iOS asıl yol yerel, WebView yedek.

> Not: IPA 8.1.1 decrypted geldi (jailbreak/sideload kaynağı). Kod birebir kopya için
> değil, mimari/akış çıkarımı için kullanıldı — FairPlay ve MSL'in kendisi bizim
> hesabımızla, kendi sunucumuzla kurulacak.
