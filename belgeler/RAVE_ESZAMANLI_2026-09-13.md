# Rave eşzamanlı izleme akışı — kazı notları (13 Eylül 2026)

Kaynak: Rave 9.0.28-2328 prodRelease, jadx ile açılmış Java kaynağı.
Aşağıdaki her sayı ve uç adresi doğrudan koddan okundu. Okunamayan
yerler "ÇIKARILAMADI" diye işaretli, tahmin yok.

---

## 1. Taşıma katmanı

Her oda (mesh) kendi gerçek zamanlı sunucusunu taşıyor: `Mesh.server`.
İstemci oraya **protoo** (mediasoup'un sinyalleşme protokolü) ile
bağlanıyor.

`SocketManager.createRequest()`:

```
Sec-WebSocket-Protocol: protoo
Authorization: <auth token>
API-Version: <kanal>
```

- OkHttp `pingInterval` = **15 sn**
- Yeniden bağlanma: `initialBackoff * 1.5^retryCount`, `maxBackoffMs` ile
  sınırlı (üstel geri çekilme)
- Soket durumu `WebSocketState` akışıyla yayılıyor
- `migrate(newUrl)` var: sunucu taşınırsa oda yeni adrese göç ediyor
  (`ROOM_MOVED`)

Soket hem WebRTC sinyalleşmesini hem sohbeti taşıyor
(`sendChatMessage`, `sendChatTypingState`).

**ÇIKARILAMADI:** `RoomClient.handleProtooNotification` jadx ile
decompile olmadı ("Method not decompiled"). Durum anlık gönderiminin
protoo bildirim adı bu yüzden doğrulanamadı. APK ve dex dosyaları disk
temizliğinde silindiği için yeniden decompile edilemedi.

---

## 2. Uygulama seviyesi kalp atışı ve kopma

`ClientPinger`:
- `heartbeatIntervalMs` = **5000 ms**
- `failCount` sayacı tutuyor, her başarılı turda sıfırlanıyor

`RTCUtils.DisconnectionReasons`:
`CLIENT_PING_TIMEOUT`, `FULLYJOINED_TIMEOUT`, `MANUAL_LEAVE`,
`MESH_DIED`, `KICKED`, `NEW_PEER`

Diğer sabitler:
- `VOIP_BUTTON_DEBOUNCE_MS` = 1500
- `voipPollRate` = yüksek hızı destekleyen cihazda **125 ms**, diğerinde
  **200 ms**

**ÇIKARILAMADI:** `failCount` kaç olunca kopma sayıldığı
`RoomClient$buildPinger$1$1.invokeSuspend` içinde ve o metot decompile
olmadı (352 komut atlandı). Yani "kaç saniyede atılıyor" sorusunun
istemci tarafındaki eşiği okunamadı. Sunucu tarafındaki gerçek zaman
aşımı zaten APK'da yok.

---

## 3. Durum mesajı — tek anlık görüntü

Rave artımlı olay göndermiyor. Tek bir mesajda her şey geliyor
(`StateMessageModel`):

```json
{
  "__metadata": {},
  "mesh_state": {},
  "users": [],
  "kicks": [],
  "votes": [],
  "cleared_votes": [],
  "vote_originator": 0,
  "likeskips": []
}
```

`mesh_state` (`MeshState`):

| alan | tür | not |
|---|---|---|
| `video_url` | string | |
| `video_instance_id` | string | aynı videonun yeni oynatımı |
| `status` | PLAY / PAUS | |
| `time` | double, **saniye** | durumun üretildiği sunucu anı |
| `position` | double, **saniye** | o andaki oynatım konumu |
| `server` | string | |
| `privacy_mode`, `play_mode`, `voip_mode` | string | oda ayarları |
| `maturity` | string | |
| `url` | string | sağlayıcı adresi |
| `playback_speed` | float | |
| `pitch_corrected`, `auto_pitch_corrected` | bool | |

`users` içindeki `Participant`: `user`, `whenJoined`, `isLeader`,
`voipEnabled`, `whenLeft`, `wasKicked`.

Atılma ayrı bir olay değil: `kicks` listesi ve katılımcının
`wasKicked` bayrağı anlık görüntünün parçası.

---

## 4. Saat — kendi NTP istemcisi

`ClockManager` cihaz saatine güvenmiyor, `libwemesh-ndk.so` içinde
native bir NTP istemcisi çalıştırıyor:

- `getCurrentSyncTime(clock)` → NTP ile hizalanmış saniye
- Üzerine sabit `HACK_OFFSET` ekleniyor: API ≥ 24 için **0.044 sn**,
  altı için **0.081 sn** (ses/görüntü hattı gecikmesi telafisi)
- Kütüphane yüklenemezse `System.currentTimeMillis()/1000 + offset`

Bu olmadan senkron tutmaz: iki telefonun saati arasındaki fark doğrudan
oynatım farkı olarak yansır.

---

## 5. Konum matematiği

```
calculatePosition(state) = state.position + simdi - state.time
calculateDesiredPosition(t) = max(currentPosition,
                                  currentPosition + (t - currentTime) * hiz)
```

`currentPosition` / `currentTime` son gelen `MeshState`'in `position` ve
`time` alanları (ms'ye çevrilmiş). Yani her istemci son anlık görüntüden
kendi saatiyle ileri sarıp nerede olması gerektiğini hesaplıyor.

`macroSync` hedefi: `calculateDesiredPosition(simdi + 100 ms)`,
`[0, duration]` aralığına kırpılıyor. O 100 ms, `seekTo` çağrısının
kendi gecikmesi için.

---

## 6. Senkron döngüsü — `PlayerSynchronizer`

Sabitler (hepsi kurucu metotta sabit yazılı):

| sabit | değer |
|---|---|
| `syncIntervalMs` | 5000 |
| `quickResyncDelayMs` | 500 |
| `deadbandMs` | 20 |
| `minorSyncThresholdMs` | 3000 |
| `microSyncSlowFactor` | 0.75 |
| `microSyncFastFactor` | 1.25 |
| `minNudgeSpeed` | 0.25 |
| `maxNudgeSpeed` | 3.0 |
| `speedEpsilon` | 0.001 |
| `minClosureRate` | 0.01 |

Döngü: `sync()` çağrılır, sonra `requestQuickResync` doğruysa 500 ms,
değilse 5000 ms beklenir. Oynatıcı `STATE_READY` değilse ya da hesaplanan
konum 0 çıkarsa `requestQuickResync` kurulur — yani içerik yüklenirken
döngü 500 ms'ye iniyor.

`sync()` kararı:

1. Mikro senkron sürüyorsa hiçbir şey yapma.
2. `status == PAUS` → `pause()`, içerik OnDemand ise `seekTo(position)`.
3. `status == PLAY`, içerik Live/LiveDvr → oynamıyorsa
   `seekToDefaultPosition()`, sonra `play()`.
4. `status == PLAY`, içerik OnDemand:
   - taban hızı uygula
   - `offset = oynaticiKonumu - istenenKonum`
   - `|offset| > 3000 ms` **veya** oynatıcı çalmıyorsa → **makro
     senkron**: `seekTo` + `play`
   - `20 ms <= |offset| <= 3000 ms` → **mikro senkron**
   - `|offset| < 20 ms` → dokunma (ölü bant)

**Mikro senkron** sıçrama yapmadan kapatıyor: hız
`hiz * 0.75` (öndeysen yavaşla) veya `hiz * 1.25` (geridesen hızlan),
`[0.25, 3.0]` aralığına kırpılır. Kapanma hızı `minClosureRate` (0.01)
altındaysa vazgeçip makro senkrona düşer. Hız farkı Δ ise
`offset / Δ` ms sonra eski hıza dönülüyor. Perde düzeltmesi
`pitchFor()` ile ayrı yönetiliyor (müzikte hız 1 değilse perde korunmuyor).

Bizim için önemli olan: **3 saniyeye kadar olan kaymayı seek ile değil
hız oynatarak kapatıyor.** İzleyici sıçrama görmüyor.

---

## 7. Gatekeeper REST uçları

Durum **yayınlama** REST ile, **alma** soketle:

| uç | iş |
|---|---|
| `POST meshes` | oda kur |
| `GET meshes/{id}` | oda bilgisi |
| `GET meshes/self`, `GET meshes/search` | listeleme/arama |
| `PUT meshes/{id}/state` | durum yayınla (`RaveStateUpdate`) |
| `PUT meshes/{id}/devices/{deviceId}/state` | cihaz durumu (yükleniyor/hata) |
| `POST meshes/{id}/invites` | davet et (`IdsRequest`) |
| `DELETE meshes/{id}/invites` | daveti geri al |
| `POST meshes/{id}/kick` | odadan at (`IdsRequest`) |
| `DELETE meshes/{id}/devices/{deviceId}/leave` | odadan çık |
| `POST meshes/{id}/transferleadership` | liderliği devret |
| `POST meshes/{id}/mute/{userId}` / `unmute` | sustur |
| `POST meshes/{id}/state/endstream` | yayını bitir |

`RaveStateUpdate` gövdesi: `state`, `time`, `position`, `playbackSpeed`,
`pitchCorrected`, `autoPitchCorrected`.

---

## 8. Arkadaş ve davet akışı

Uçlar:

| uç | iş |
|---|---|
| `GET friendships?limit=&cursor=` | arkadaş sayfası (imleçli) |
| `GET friendships/count?friends=&recents=` | sayaçlar |
| `GET friendships/requests`, `/requests/count` | gelen istekler |
| `GET friendships/{userId}` | arkadaşlık durumu |
| `GET users/search?q=&friends=&recents=&all=` | arama, üç kapsam |
| `POST friendships` | istek gönder |
| `PUT friendships` | isteği güncelle/kabul et |
| `DELETE friendships` / `DELETE friendships/unfriend` | sil |

`InviteFragment` arayüzü: arama kutusu, çoklu seçim listesi, "Tümü /
Hiçbiri" düğmesi (`InviteAllMode` = ALL | NONE), seçim bitince **tek**
`POST meshes/{id}/invites` çağrısı, gövdede kimlik listesi.
`hideOrShowAllNoneButton` ve `updateAllOrNoneTextState` düğmeyi listenin
durumuna göre yönetiyor.

Liste kaynağı arkadaşlar + son görüşülenler (`recents`); arama üçünü de
kapsayabiliyor (`all`).

Doğrudan mesaj ekranından tek kişilik davet ayrı yol:
`DMFragment` içinde `inviteToMesh(meshId, [otherUserId], ...)`.

---

## 9. Liderlik

- `ParticipantsManager.iAmLeader()`, `iAmOrWillBeLeader()`
- `StateMachine.canSkip()` = lider **ve** durum PLAY/PAUS
- `isRaveLeaderOnly` bayrağı + `play_mode` alanı kontrolün herkeste mi
  yalnız liderde mi olduğunu belirliyor
- Lider ayrılırsa liderlik devri `POST transferleadership` ile

---

## 10. Bizim tarafa çıkarımlar

Uygulanabilir olanlar, öncelik sırasıyla:

1. **Ölü bant + mikro senkron.** Şu an kayma olunca seek atıyoruz.
   Rave 3 sn'ye kadar hız oynatarak kapatıyor, 20 ms altını hiç
   kurcalamıyor. Sıçramasız izleme farkı buradan geliyor.
2. **Sunucu saati.** Cihaz saatine güvenmek senkronu bozuyor. Rave
   native NTP çalıştırıyor; bizde en azından sunucu ile bir offset
   ölçümü gerekiyor.
3. **Tek anlık görüntü.** Artımlı olay yerine `mesh_state + users +
   kicks` tek mesajda; yeniden bağlanmada durum kendiliğinden toparlanır.
4. **`video_instance_id`.** Aynı videonun yeniden başlatılmasını ayırt
   ediyor; bizde bu yok, aynı adrese dönünce eski konum yapışıyor.
5. **Hazırlık geri bildirimi.** `PUT devices/{id}/state` ile kim
   yükleniyor/hata alıyor sunucuya bildiriliyor; "herkes hazır mı"
   bunun üzerinden kuruluyor.

## Doğrulanmayanlar

- Ping başarısızlık eşiği (atılma süresi) — decompile olmadı
- protoo bildirim adları — `handleProtooNotification` decompile olmadı
- `IdsRequest`'in üçüncü alanının anlamı — sınıf kaynağı bulunamadı

---

## 11. iOS tarafı — Rave 8.0 IPA (decrypted)

Kaynak: `Rave - [v8.0].ipa`, bundle `sh.weme.wemesh`, sürüm 8.0 (2620),
en düşük iOS 10.0. Ana ikili `cryptid=0`, yani jailbreak'li cihazdan
alınmış şifresiz dump; kod ve kaynaklar tamamen okunabiliyor.

Elimizdeki APK 9.0.28-2328 olduğu için **bu IPA daha eski** ve Android'de
gördüğümüz mimarinin (DisconnectionReasons, PlayerSynchronizer) öncesi.
Karşılaştırırken bu fark akılda tutulmalı.

### 11.1 protoo bildirim adları

Belgenin 1. bölümünde "ÇIKARILAMADI" diye işaretlenen protoo bildirim
adları iOS ikilisinde düz metin olarak duruyor:

`meshState`, `chatMessage`, `peerClosed`, `consumerClosed`,
`newConsumer`, `fullyJoined`, `kicked`

İstek tarafı: `getRouterRtpCapabilities`, `createWebRtcTransport`,
`connectWebRtcTransport`, `produce`, `resume`.

Yani durum anlık görüntüsü **`meshState`** bildirimiyle geliyor ve
atılma ayrıca **`kicked`** bildirimiyle de duyuruluyor. Bunlar 8.0
sürümünden; 9.0.28'de aynı kaldığı doğrulanmadı.

### 11.2 Arka plan kipleri

`Info.plist` → `UIBackgroundModes: ["audio", "voip"]`. Ses arka planda
devam ediyor ve sesli sohbet için VoIP kipi açık.

### 11.3 Enjekte edilen betikler

Paket kökünde düz metin: `netflix.js`, `amazon.js`, `disney.js`,
`max.js`, `hbomax.js`, `web.js`.

Android'dekilerin aksine platform betikleri çoğunlukla **CSS ile arayüz
temizliği** yapıyor, mantık içermiyor:

| dosya | ne gizliyor |
|---|---|
| `netflix.js` | e-posta formu, reklamlı plan afişi, netflix.shop bağlantısı, giriş düğmesi; arama kutusunu görünür kılıyor; dizi sayfasında action-button'ı gizliyor |
| `amazon.js` | kirala/satın al vitrini, satın alma formları, "diğer satın alma seçenekleri", hesap oluştur bağlantısı, kayıt akordeonu |
| `disney.js` | kaydol bağlantıları; ayrıca 100 ms'de bir adres değişimini izleyip `DisneyJSInterface` ile native'e bildiriyor ve PIN alanlarındaki `readonly` kilidini kaldırıyor |
| `max.js` | promosyon afişi, plan seçici |
| `hbomax.js` | abonelik afişleri, paywall düğmesi |

### 11.4 `web.js` — asıl iOS yolu

İki parçadan oluşuyor:

1. `iphone-inline-video` kütüphanesi — eski iOS'ta `<video>` etiketinin
   tam ekrana kaçmasını engelleyip satır içi oynatmayı zorluyor.
2. Rave'in kendi kancası. Davranış şu:

- 1000 ms'de bir tüm `<video>` ve `<audio>` elemanları yeniden
  kancalanıyor, iframe'lerin içindekiler dahil
- Her elemana: `pause()`, `autoplay = false`, `muted = true`,
  `playsinline`, ve tekrar kancalanmasın diye `raveHooked` niteliği
- `click` ve `play` olayları yakalanıyor: `preventDefault()`,
  `stopPropagation()`, eleman duraklatılıyor ve
  `jsinterface://startVideo` ile native'e devrediliyor
- Adres değişimi 100 ms'de bir yoklanıp
  `jsinterface://pageChanged?<adres>` ile bildiriliyor

Yani **iOS'ta sayfanın kendi videosu hiç oynamıyor.** Android'deki
Amazon tıklama devralmasıyla aynı felsefe, ama bağlantı yerine doğrudan
video elemanına uygulanmış ve tüm platformlarda geçerli.

### 11.5 `user-agents.json`

4.8 MB'lık gerçek tarayıcı parmak izi havuzu. Her kayıtta `userAgent`,
`platform`, `vendor`, `appName`, `pluginsLength`, ekran ve görünüm
alanı ölçüleri, `deviceCategory` ve bir `weight` (gerçek dünyadaki
yaygınlık payı) var. Sabit bir user agent yerine ağırlıklı seçimle
gerçekçi parmak izi üretmek için.

### 11.6 `acorn.js`

JavaScript ayrıştırıcısı. Android tarafında YouTube `player.js`
içindeki imza çözme fonksiyonlarını ayrıştırmak için kullanılan
yaklaşımın iOS karşılığı olması muhtemel.

### Bizim iOS yolumuz için çıkarımlar

1. **Video devralma.** Bizim köprümüz videoyu tespit edip kontrol
   ediyor ama sayfanın kendi oynatmasını engellemiyor. Rave her `play`
   olayını kesiyor. Prime'da yaşadığımız "sayfa kendi oynatıcısına
   gidiyor" sorununun iOS'taki genel çözümü bu.
2. **Arayüz temizliği.** Platform WebView'lerinde üyelik, ödeme ve
   reklam bölümleri duruyor. Yukarıdaki CSS seçicileri doğrudan
   kullanılabilir.
3. **Arka plan kipleri.** `audio` ve `voip` bizde de gerekiyor.
