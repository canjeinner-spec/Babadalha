# Turtle (com.turtle.turtletv) sökümü — 10 Eylül 2026

XAPK, 160 MB. **Flutter** uygulaması (`libflutter.so`, `libapp.so` 14 MB
Dart AOT), oynatıcı `media_kit` (`libmpv.so`), WebView
`flutter_inappwebview`. Ses **Agora** (`libagora-rtc-sdk.so` 28 MB) —
bizimle aynı.

Köprü script'leri paketin içinde **şifresiz** duruyor:

```
assets/flutter_assets/lib/assets/js/
  netflix_bridge.js       58 KB
  disney_plus_bridge.js   54 KB
  prime_video_bridge.js   53 KB
  crunchyroll_bridge.js   33 KB
  hbo_max_bridge.js       32 KB
  google_drive_bridge.js  22 KB
  provider_picture_in_picture.js  18 KB
  plex_bridge.js          14 KB
  youtube_bridge.js       12 KB
  apple_tv_bridge.js       6 KB
  media_source.js          3 KB
```

Bizim `src/parti/kopru.ts`'in birebir karşılığı, platform başına ayrılmış.

---

## 1. Video ögesini nasıl buluyorlar — bizim hatamızın kaynağı

Biz sayfadaki **en geniş alanlı** videoyu seçiyorduk. Turtle DOM'da
yukarı yürüyüp oynatıcı kabını arıyor:

```js
function isInsideWatchVideoContainer(video) {
  var node = video.parentElement;
  while (node) {
    if (node.tagName === "DIV" && node.classList) {
      for (...) if (classes[i].indexOf("watch-video") === 0) return true;
    }
    node = node.parentElement;
  }
  return false;
}
```

Sayfada kalan fragman/önizleme ögeleri bu testi geçemiyor.

Kendi yorumları, reklam konusunda: *reklam ile içeriği ayırmak için
`duration` KULLANILMIYOR, çünkü reklam da aynı oynatıcı yüzeyini kullanıyor
ve ilk yüklenen medya reklamsa süreyle eleme oynatıcıyı hiç hazır
saymamaya yol açıyor.*

Bizim logdaki `atla: istek=33 ... sure=2663` satırlarının sebebi buydu.
Düzeltildi: `kopru.ts` → `oynaticiKabinda()`.

## 2. Yeni içerik açılınca ne kadar bekliyorlar

```
setupWithRetry:  250 ms × 60   (15 sn)
              →  1500 ms × 30  (45 sn daha)
              →  5000 ms       sonsuza kadar
```

Üstüne MutationObserver (hem `attributes` hem `addedNodes`). **Pes
etmiyorlar.** Bizde tek atışlık 4,5 sn bekçi var.

## 3. Kontrol yüzeyi

Flutter'ın sürdüğü API — `window.__netflix_player_control`:

```
play(source)  pause(source)  seek(saniye)  setRate(oran)
getCurrentTime()  getDuration()  probeNextRenderedFrame(timeoutMs)
selectSubtitles(ad)  selectAudio(ad)  refreshTrackInfo()
getPictureInPictureAvailability()
```

**`setContent` yok.** İçerik değişimi Flutter tarafında WebView'e URL
yükleyerek yapılıyor; köprü yalnız oynatmayı sürüyor. (Dooram'da
`appboot → prepare → setContent` boru hattı vardı — iki farklı tasarım.)

`probeNextRenderedFrame` dikkat çekici: `readyState`'e güvenmeyip gerçek
bir karenin çizilmesini bekliyorlar.

---

## 4. Senkron

Dart tarafındaki dizgiler:

```
canSendPlaybackSync            _canAuthorPlaybackSync
setPlaybackSyncSuspended       _resumePlaybackSyncAfterTransportSuspension
waitUntilPlaybackSyncReady     _syncPlaybackFromEvent
PlaybackSyncLifecycleHelper    playback_reconnect_state_requested
```

Ve şu kayıt satırları, tasarımı doğrudan anlatıyor:

```
[WatchEventService.update] Playback sync suspended; skipping update.
[WatchPage] Ignored Netflix playback sync while app is backgrounded.
[WatchPage] Ignored playback sync while the transport is suspended.
[WatchPage] Suppressed lifecycle/teardown pause while preserving host playback state.
[WatchPage] Error reconciling playback after resume:
```

Bizde olmayanlar:

- **Yazma yetkisi ayrı kavram** (`canSendPlaybackSync`) — herkes durum
  yayınlayamıyor.
- **Askıya alma** (`setPlaybackSyncSuspended`) — Dooram'daki 750 ms
  soğumanın daha genel hâli.
- **Arka plandayken senkronu yok sayma** — uygulama arkaplandayken gelen
  senkron uygulanmıyor.
- **Yaşam döngüsü duraklatmasını odaya sızdırmama** — uygulama kapanırken
  oluşan `pause` odaya "duraklat" diye gitmiyor. Bizde bu sızıntı olur.
- **Yeniden bağlanınca durum isteme** (`playback_reconnect_state_requested`).

## 5. Odadan atma

```
ban_watch_session_user     _banUser
watchBanUserTitle / Body / Action / Success / Error / Tooltip
```

Sunucu tarafında bir çağrı; arayüzde onay metni, başarı ve hata durumu
ayrı ayrı tanımlı. Yani atma istemcide değil arka uçta zorlanıyor.

## 6. Sahiplik devri — en olgun kısım

```
HostReassignmentEvent          HostReconciliationPolicy
hostReassignmentDelay          _cancelPendingHostReassignment
_attemptWatchSessionHostReassignment    _applyHostReassignment
_loadAutomaticHostReassignmentPreference
_publishAutomaticHostReassignmentPreference
_buildAutomaticHostReassignmentTile
hostWatchTokenBlocked
```

Atlama sebepleri, kendi metinleriyle:

```
Skipping host reassignment: current client is not an eligible self-promote candidate.
Skipping host reassignment: no active clients support host churn.
Skipping host reassignment: the departed host disabled automatic reassignment.
```

Buradan çıkanlar:

- Sahip düşünce sahiplik **anında** devredilmiyor; bir gecikme var ve
  bekleyen devir **iptal edilebiliyor** (`_cancelPendingHostReassignment`)
  — sahip geri gelirse devir olmuyor.
- Devralan **kendini terfi ettiriyor** ("self-promote candidate"), yani
  istemciler arasında bir seçim var, sunucu tek başına atamıyor.
- Sahip, odadan çıkmadan önce **otomatik devri kapatabiliyor**; o zaman
  kimse odayı devralmıyor. Bunun ayarlar ekranında bir anahtarı var
  (`_buildAutomaticHostReassignmentTile`) ve tercih kalıcı.

Oda görünürlüğü: `OwnershipType` = `Public` / `Private` / `Friends` /
`Invite`.

---

## Bizim yol haritamıza girenler

1. Video bulucu kap odaklı — **yapıldı** (`143fa2a`).
2. Kademeli, pes etmeyen kurulum denemesi (250 ms → 1,5 sn → 5 sn).
3. `probeNextRenderedFrame` benzeri gerçek kare doğrulaması.
4. Senkron yazma yetkisi + askıya alma + arka planda yok sayma.
5. Yaşam döngüsü duraklatmasının odaya sızmaması.
6. Yeniden bağlanınca durum isteme.
7. Sahiplik devri: gecikme, iptal, kendini terfi, sahibin kapatabilmesi.
8. Odadan atmanın arka uçta zorlanması.

Netflix'in içerik başına reddine dair hiçbir şey yok; Turtle da o duvarla
karşılaşıyor (`homeNetflixAndroidUnsupported`).
