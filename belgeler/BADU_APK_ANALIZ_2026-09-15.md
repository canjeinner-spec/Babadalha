# Badu APK Derinlemesine Analiz Raporu

**Tarih:** 15 Eylul 2026
**APK:** Badu – Live Chatroom Party v1.0.6 (com.badu.live)
**Kaynak:** APKPure (XAPK, 229MB)
**Yapi:** Flutter (Dart) + Kotlin Android katmani

---

## 1. UYGULAMA KIMLIGI

Badu aslinda **Lumar Live** altyapisinin beyaz etiketli (white-label) bir
kopyasi. Dart paket adi `package:lumar/`, tum servisler `lumar.live`
domaininde.

### Altyapi Haritasi

| Servis | Adres | Durum |
|--------|-------|-------|
| Ana API | `https://api.lumar.live/` | DNS cozulmuyor (kapali) |
| WebSocket (Socket.IO) | `https://socket.lumar.live/` | DNS cozulmuyor |
| Oyun CDN | `https://cdn-bvuuxyc3s.quantum-nexus.net/` | 504 Gateway Timeout |
| Web Odasi | `https://badu.lumar.live/room/` | DNS cozulmuyor |
| Firebase | `badu-e90ca` | Kismen aktif |
| IP Tespiti | `http://ip-api.com/json`, `https://ipapi.co/json`, `https://api.ipify.org` | Harici |

---

## 2. GOMULU VE CDN VARLIKLAR

### 2.1 Gomulu Varliklar (APK Icinde — 112MB)

| Klasor | Boyut | Icerik |
|--------|-------|--------|
| `assets/images/` | 55MB | VIP arkaplanlari (28 PNG, 18MB), gunluk giris, oyun |
| `assets/game/` | 23MB | 18 oyun kapak gorseli |
| `assets/image/` | 24MB | Elmas, coin, VIP, magaza ikonlari, profil videosu |
| `assets/icons/` | 1.6MB | 217 webp UI ikonu |
| `assets/fonts/` | 5.9MB | SF-Pro (6.1MB), FontAwesome |
| `assets/lottie/` | 248KB | 5 Lottie animasyonu (pk, like, gift, upload, wave) |
| `assets/sounds/` | 244KB | 4 MP3 (mesaj, takip, bildirim, canli) |
| `assets/language/` | 168KB | tr.json, en.json, ar.json |
| `assets/splash/` | 1.9MB | Acilis ekrani |

### 2.2 Gomulu SVGA Dosyalari (Sadece 2 Tane)

- `assets/images/audio/mc_svip_05.svga` — sesli oda SVIP efekti
- `assets/image/gifticon.svga` — hediye ikonu animasyonu

### 2.3 Runtime'da Indirilen Varliklar (CDN)

Hediye animasyonlari (SVGA), giris efektleri, avatar cerceveleri ve
profil cerceveleri **CDN'den runtime'da indirilip** `/svga_cache`
dizininde onbellege aliniyor.

Ilgili Dart siniflari:
- `GiftCacheService` — hediye SVGA'larini onbellege alir
- `SvgaCacheService` — genel SVGA onbellek yonetimi
- `EntrySvgaPlayer` — giris efekti SVGA oynaticisi
- `AssetSvgaPlayer` — gomulu SVGA oynaticisi

API endpoint'leri:
- `GET /gift/all` — tum hediyeleri (SVGA URL'leriyle) dondurur
- `GET /svga/get` — satin alinabilir SVGA'lari dondurur
- `POST /svga/purchase?type=svga` — SVGA satin alma
- `POST /svga/select` — aktif SVGA secimi

**Sonuc:** Hediye SVGA'larini indirmek icin `api.lumar.live` yanit vermeli.
Servis su anda tamamen kapali, bu yuzden runtime varliklarina erisilemiyor.

### 2.4 Oyunlar (CDN — Quantum Nexus)

33 oyun URL'si tespit edildi. CDN: `cdn-bvuuxyc3s.quantum-nexus.net`

Oyun listesi: 3kingdoms2, animal_match, baccarat, crash, dragon_tiger3,
fish4, fortune_gems, fruit_party, gatesOfOlympus, greedy_lion, luck77,
mexican_restaurant, mrrich, sweet_feast, wheel, wheel2, world_cup, zhuanpan2

Her oyunun `_medium` (dusuk kalite) versiyonu da var. Parametre: `?pl=lumarlive`

---

## 3. EKONOMI MODELI

### Uclu Para Birimi

```
Diamond (Elmas) → Satin alinir (Stripe / Google Play / Apple)
     ↓ hediye gonderilince
Coin → Alicinin bakiyesine eklenir
     ↓ donusturulunce
R-Coin (Bcoin) → Nakde cevrilir
```

### VIP Sistemi

- **VIP**: 7 kademeli uyelik, elmasla satin alinir
  - Faydalar: tac, ekstra token, tum seviyelere erisim
- **SVIP**: Premium uyelik
  - Avatar cercevesi, sohbet cercevesi, renkli kullanici adi,
    giris efekti, giris bildirimi, mini profil karti,
    oda arka plan yukleme, ozel rozet, ID etiketi

### Magaza Ogeleri

- Giris efektleri (entrance effects) — SVGA animasyonlari
- Profil cerceveleri (profile frames)
- Avatar cerceveleri

---

## 4. CIKARILAN KIMLIK BILGILERI

### 4.1 Firebase Yapilandirmasi

```
API Key:         AIzaSyCpa9OySUPez1qpNSvkcqmLgbRUNjLin_U
App ID:          1:119969049205:android:b604e5d7f53fa172dee63c
Project ID:      badu-e90ca
Project Number:  119969049205
OAuth Client ID: 119969049205-nfr9hbrk5fq032ierrnrsme7c06gr3g1.apps.googleusercontent.com
Storage Bucket:  badu-e90ca.firebasestorage.app (404 donduruyor)
```

### 4.2 Firebase Servisleri Durumu

| Servis | Durum |
|--------|-------|
| Authentication | ACIK (e-posta kayit calisiyor!) |
| Analytics | Aktif |
| Crashlytics | Aktif |
| Cloud Messaging (FCM) | Aktif |
| Remote Config | Bos yanit |
| Performance | Aktif |
| Installations | Aktif |
| Cloud Firestore | KAPALI (SERVICE_DISABLED) |
| Realtime Database | YOK (404) |
| Storage | 404 (bucket bulunamiyor) |

### 4.3 Agora RTC

Agora App ID backend'den (`/setting`) cekiliyor, APK'da hardcoded degil.
Ilgili alanlar: `agoraId`, `agoraKey`, `agoraUID`
Fonksiyon: `_fetchAgoraAppId`, `_getAgoraAppId`, `_generateSafeUid`,
`_generateRandomChannelId`, `generateAgoraToken` (sunucu tarafi)

### 4.4 Stripe

Stripe publishable key backend'den cekiliyor (`stripePublishableKey`).
Debug kalintisi: `=== STRIPE DEBUG (FLUTTER) ===`
Hardcoded plan: `PlanId: 8` (Google Play odeme)

### 4.5 Olusturulan Test Hesabi

```
E-posta:      test_audit_temp_7382@tempmail.dev
Firebase UID: UHDVursQtWWiYFIj8XNmXL80BJJ3
```

---

## 5. API ENDPOINT HARITASI (71 Endpoint)

### Kullanici & Kimlik Dogrulama
```
POST /user/login
POST /user/loginSignup
POST /user/register
GET  /user/getUser
PUT  /user/profile
POST /user/update-fcm-token
POST /user/logout-other-devices
```

### Canli Yayin & Sesli Oda
```
GET  /liveUser
GET  /liveUser/checkLive
GET  /liveUser/checkUserLiveStatus
POST /liveUser/live
POST /liveUser/generateAgoraToken
GET  /liveUser/getKickedUsers
POST /liveUser/updateRoomImage
POST /videoLive/kick
GET  /videoLive/viewers
POST /videoLive/stop
POST /videoLive/pk/sendRequest
POST /videoLive/pk/cancelRequest
POST /videoLive/pk/end
GET  /videoLive/pk/availableUsers
```

### Hediyeler & SVGA
```
GET  /gift/all
GET  /svga/get
POST /svga/purchase?type=svga
POST /svga/purchase?type=11
POST /svga/select
GET  /storage/rose.png
```

### Ekonomi & Odeme
```
GET  /coinPlan
POST /coinPlan/purchase/stripe
POST /coinPlan/purchase/googlePlay
POST /coinPlan/purchase/appleStore
POST /coinPlan/stripe/createCustomer
GET  /coinSeller/getAll/?userId=
POST /coinSeller/coinByCoinSeller
GET  /vipPlan
POST /vipPlan/purchase
GET  /svipPlan
POST /svipPlan/purchase/diamond
GET  /history
POST /history/convertRcoinToDiamond
```

### Sosyal
```
POST /follower/followUnfollow
GET  /follower/followerList
GET  /follower/followingList
POST /block/blockOrUnblockUser?userId=
GET  /block/getBlockedUsers
GET  /favorite
POST /complain
POST /report
POST /reportVideo
POST /comment
GET  /reaction/getReaction
```

### Sohbet
```
GET  /chat/getOldChat
POST /chat/uploadImage
GET  /chatTopic/chatList
POST /chatTopic/createRoom
DELETE /chatTopic/deleteChatTopic
```

### Icerik & Paylasim
```
GET  /post/getMixedFeed
POST /post/uploadPost
POST /post/uploadVideo
DELETE /post/deletePost
```

### Ajans & Host
```
GET  /agency
GET  /agency/getAgency
POST /agencyRedeem/store
GET  /host
POST /hostRequest/createRequest
GET  /hostRequest/getRequestStatus
```

### Diger
```
GET  /setting
GET  /banner/all
GET  /splashScreen
GET  /level
GET  /theme
POST /dailyGame/user/claim
```

---

## 6. SOCKET.IO EVENT'LERI

### Sunucuya Gonderilen (Emit)
```
sendGift / sendGiftToSingleUser / sendGiftToMultipleUsers
sendMessage / sendCoin / sendAnnouncement
joinRoom / leaveRoom
inviteToSeat / kickFromSeat / kickFromRoom / kickViewer
muteSeat / muteLocalAudio
updateProfile / requestUserCoinUpdate
sendAudioLevelUpdate
```

### Sunucudan Alinan (Listen)
```
videoLiveGiftReceived / videoLiveCommentReceived / videoLiveEnded
userCoinUpdate / viewerCount / audioLevelUpdate
seatUpdate / hostMicMuted / userMicMuted
typing / announcement / notification
svipEntryNotification / vipEntryBanner
kickedFromVideoLive / liveEndByEnd
```

---

## 7. GUVENLIK ANALIZI

### 7.1 KRITIK ACIKLAR

#### A. Firebase Auth Acik Kayit (KRITIK)
Uygulama girisi "kapali" olmasina ragmen Firebase Authentication
e-posta/sifre kaydi acik. Herkes hesap olusturabilir ve JWT token alabilir.
Bu token backend API'ye `Bearer` olarak gonderildiginde muhtemelen tam
erisim saglar.

#### B. Root/Jailbreak Algilama YOK (YUKSEK)
Uygulamada hicbir root/jailbreak algilama mekanizmasi yok. Frida, Xposed,
Magisk gibi araclarla mudahale tamamen acik.

#### C. Sertifika Pinning YOK (YUKSEK)
SSL/TLS sertifika sabitleme (certificate pinning) bulunamadi.
MITM (man-in-the-middle) saldirisiyla tum API trafigi yakalanabilir.

#### D. Stripe Debug Kalintisi (ORTA)
`=== STRIPE DEBUG (FLUTTER) ===` stringi production build'de kalmis.
Debug modunda hassas odeme bilgileri loglaniyor olabilir.

#### E. IP Takibi Guvensiz (ORTA)
Uc farkli harici servis kullanarak IP ve konum tespiti yapiliyor:
- `http://ip-api.com/json` (HTTP — sifrelenmemis!)
- `https://ipapi.co/json`
- `https://api.ipify.org?format=json`

Ilk servis HTTP uzerinden cagriliyor, MITM ile degistirilebilir.

#### F. `RfBypass` Stringi (ORTA)
Compiled kodda `RfBypass` adinda bir string bulundu. Bu muhtemelen
bir rate-limiting veya guvenlik bypass mekanizmasinin kalintisi.

#### G. Hardcoded Plan ID (DUSUK)
`[DiamondWallet] Starting Google Play payment - PlanId: 8` — debug
log satiri production'da kalmis.

### 7.2 MIMARI ZAFIYETLER

#### A. White-Label Yapi Riski
Badu, Lumar Live'in beyaz etiketli kopyasi. Lumar'daki herhangi bir
guvenlik acigi tum kopyalari etkiler. Lumar backend'i tek nokta (SPOF).

#### B. Agora Token Uretimi Sunucu Tarafi
`/liveUser/generateAgoraToken` — Agora tokenlari sunucuda uretiliyor.
Sunucu ele gecirilirse tum canli yayin oturumlari kontrol edilebilir.

#### C. Firebase Servis Daginikligi
Firestore ve RTDB kullanilmiyor. Tum veri Lumar backend'inde. Ama
Firebase Auth, FCM, Analytics ve Crashlytics acik kaliyor, gereksiz
saldiri yuzeyi olusturuyor.

#### D. IDOR Potansiyeli
API'de `?userId=` parametresiyle dogrudan kullanici sorgusu yapiliyor.
Yetkilendirme kontrolu olmadan baska kullanicilarin verilerine
erisilebilir (IDOR — Insecure Direct Object Reference).

#### E. Cihazdan Diger Cihazlari Cikarma
`/user/logout-other-devices` — hesap ele gecirildiginde orijinal
kullanicinin tum oturumlari kapatilabilir.

### 7.3 SALDIRI YUZEYI OZETI

```
Saldiri Vektoru               Zorluk    Etki
-----------------------------------------------------
Firebase Auth spam             Cok kolay KRITIK (hesap veritabani sisirme)
MITM API trafigi               Kolay     KRITIK (token calma)
Root+Frida ile bellek okuma    Kolay     YUKSEK (tum veriye erisim)
IDOR ile baska kullanici       Orta      YUKSEK (veri sizintisi)
Socket.IO event taklit         Orta      YUKSEK (sahte hediye, mesaj)
IP-API MITM                   Kolay     ORTA (konum sahteciligi)
Stripe debug log sizintisi    Kolay     ORTA (kart bilgisi riski)
```

---

## 8. NATIVE KUTUPHANELERI (arm64-v8a)

| Kutuphane | Boyut | Amac |
|-----------|-------|------|
| libagora-rtc-sdk.so | 27MB | Agora RTC ana SDK |
| libapp.so | 13MB | Derlenmis Dart kodu |
| libflutter.so | 11MB | Flutter engine |
| libagora_lip_sync_extension.so | 6.8MB | Dudak senkronizasyonu |
| libagora-ffmpeg.so | 5.8MB | Medya codec |
| libagora_spatial_audio_extension.so | 4.5MB | Uzamsal ses |
| libagora_clear_vision_extension.so | 4.2MB | Video iyilestirme |
| libagora_face_capture_extension.so | 2.7MB | Yuz yakalama |
| libagora_segmentation_extension.so | 2.7MB | Arka plan segmentasyonu |
| libagora_audio_beauty_extension.so | 2.0MB | Ses guzellestirme |
| + 21 diger Agora/Flutter kutuphanesi | | |

---

## 9. UYGULAMA KAYNAK DOSYA YAPISI

```
package:lumar/
├── main.dart
├── splash_screen.dart
├── splash_banner_screen.dart
├── models/
│   ├── daily_login_model.dart
│   ├── fetch_available_live_user_for_pk_model.dart
│   ├── live_comment_model.dart
│   ├── live_stream_comment.dart
│   ├── reaction.dart
│   ├── video_live_model.dart
│   └── wallet_history_item.dart
├── providers/
│   └── party_tab_provider.dart
├── screens/
│   ├── chat/ (chat_detail, chat_list, system_message, user_search)
│   ├── feed/ (feed_container, feed_detail, feed_page, reels_upload, reels, user_reels)
│   ├── home/ (home, following_tab, live_tab, party_tab, search)
│   ├── live/
│   │   ├── audio/ (audio_room_participant, audio_room, audio_room_settings, room_contribution)
│   │   ├── starlive/ (start_audio_live)
│   │   └── video/ (go_live, video_live, video_viewer + widget'lar)
│   ├── login/ (login, email_login, complete_profile, edit_profile, profile_details)
│   ├── profile/
│   │   ├── agency/ (agency_dashboard + sekmeler)
│   │   ├── backpack/
│   │   ├── host/ (host_dashboard, withdraw)
│   │   ├── settings/ (about, complaints, privacy, report, terms)
│   │   ├── store/ (entrance_effect, profile_frame, store)
│   │   ├── user_profile/ (gift_wall, user_profile)
│   │   └── (blocked_users, diamond_wallet, history, host_request, level, profile, settings, svip, vip)
│   ├── device_music_browser.dart
│   ├── music_library.dart
│   └── user_list.dart
├── services/
│   ├── agora_service.dart (Agora RTC yonetimi)
│   ├── auth_service.dart (kimlik dogrulama)
│   ├── background_audio_service.dart (arka plan muzigi)
│   ├── background_payment_service.dart (arka plan odemeleri)
│   ├── chat_service.dart (sohbet)
│   ├── daily_login_service.dart (gunluk giris odulleri)
│   ├── device_service.dart (cihaz bilgisi)
│   ├── email_auth_service.dart (e-posta dogrulama)
│   ├── firebase_messaging_service.dart (FCM)
│   ├── floating_bubble_manager.dart (mini oynatici)
│   ├── gift_cache_service.dart (hediye SVGA onbellek)
│   ├── google_signin_service.dart (Google ile giris)
│   ├── http_client_service.dart (API istemcisi)
│   ├── jank_watchdog.dart (performans izleme)
│   ├── live_streaming_service.dart (canli yayin)
│   ├── localization_service.dart (coklu dil)
│   ├── lucky_reward_manager.dart (sans odulleri)
│   ├── post_service.dart (gonderi/reels)
│   ├── profile_service.dart (profil)
│   ├── purchase_service.dart (satin alma)
│   ├── reaction_service.dart (tepkiler)
│   ├── socket_service.dart (Socket.IO baglantisi)
│   ├── splash_service.dart (acilis)
│   ├── svga_cache_service.dart (SVGA onbellek)
│   ├── system_message_service.dart (sistem mesajlari)
│   ├── user_profile_service.dart (kullanici profili)
│   ├── video_live_service.dart (video yayini)
│   ├── video_live_socket_service.dart (yayin Socket.IO)
│   └── wallet_service.dart (cuzdan)
├── utils/
│   ├── app_urls.dart (API URL'leri)
│   ├── error_message_helper.dart
│   └── string_utils.dart
└── widgets/ (40+ widget dosyasi)
```

---

## 10. SONUC

### Hediyeler Nerede?
Hediye animasyonlari (SVGA formati) **CDN'de**, APK'da degil. Sadece 2 SVGA
gomulu. Geri kalani `/gift/all` API'sinden URL olarak alinip runtime'da
indiriliyor. Ancak `api.lumar.live` DNS cozulmuyor — servis tamamen kapali.

### Indirilebilir mi?
Servis acik olsaydi, Firebase Auth ile token alip (`/user/loginSignup`),
`Bearer` header'iyla `/gift/all` ve `/svga/get` cagirarak tum SVGA
URL'lerini alip indirmek mumkundu. Su anda imkansiz.

### Hacklenebilir mi?
**Evet**, ciddi guvenlik aciklari var:
1. SSL pinning yok → MITM kolay
2. Root/jailbreak algilama yok → Frida ile tam mudahale
3. Firebase Auth acik → bot hesap ordusu olusturulabilir
4. IDOR potansiyeli → baska kullanicilarin verilerine erisim
5. Debug kalintilari → hassas bilgi sizintisi
6. HTTP uzerinden IP tespiti → konum sahteciligi
