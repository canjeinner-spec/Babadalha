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

## 8. IPA durumu — BLOKE

Verilen Drive IPA bağlantısı **herkese açık paylaşımlı değil**; indirmeye çalışınca dosya
yerine "Google Drive: Sign-in" sayfası dönüyor. APK sorunsuz indi (o "bağlantıya sahip
herkes"). IPA'yı kazabilmek için dosya **"Bağlantıya sahip herkes"** olarak yeniden
paylaşılmalı. Ayrıca App Store IPA'sının ikili dosyası şifreli gelir; sınıf/metot çıkarımı
için jailbreak'li cihazdan alınmış **decrypted** bir sürüm gerekir — App Store kopyası
yeterli olmayabilir.
