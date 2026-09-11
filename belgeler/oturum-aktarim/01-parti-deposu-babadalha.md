# Oturum aktarımı — 10 Eylül 2026

## Depo ve dal

Bu proje artık **`canjeinner-spec/Babadalha`** deposunda, `main` dalında.
Depo bu tarihe kadar uzaksızdı; 88 commit yalnız konteynerde duruyordu.
İlk push bu oturumda yapıldı, son commit `f286846`.

Sesli sohbet uygulaması ayrı depoda: `canjeinner-spec/Aaron`,
dal `claude/claude-md-ajans-transferi-c354kl`. İkisi karıştırılmaz
(Aaron tarafındaki KURAL 7).

Depo **herkese açık**. Gizli anahtar taraması temiz: `.env` izlenmiyor,
`.expo/` izlenmiyor, kaynakta token yok. Expo ve Pexels belirteçleri
depo dışında (`~/.aron-expo-token`, `~/.aron-pexels-token`).

## Bu oturumda tamamlananlar

- **Eşzaman katmanı** — `src/parti/saat.ts` (NTP tarzı sapma kestirimi,
  en hızlı yarının ortancası), `src/parti/senkron.ts` (sıra numarası,
  bayat paket süzgeci, 750 ms yankı soğuma penceresi, presence katıl/ayrıl
  tekilleştirme), `src/parti/devir.ts` (sahiplik devri, 8 sn gecikme,
  sayı duyarlı anahtar karşılaştırma), `src/parti/icerik.ts` (oynatma
  bağlantısındaki oynak parametreler yeniden yükleme tetiklemesin diye
  içerik kimliği). 71 sınama: `npm run senkron:sinama`.
- **Giriş ve karşılama ekranları** — akan afiş duvarı, daktilo başlık,
  dil seçici, üç parçalı karşılama metni, ilk açılışta bir kez gösterilen
  teşekkür sayfası.
- **YouTube siyah ekran** — üç ayrı sebep bulundu ve düzeltildi:
  Android'in AV1 pazarlığı, misafirin içerik paketi başına WebView'ı
  yeniden kurması, ve bizim sadeleştirme taramamızın `ytd-app`'i
  `display:none` yapıp bir daha açmaması. Tarama artık geri
  alınabilir (`data-aron-gizli`) ve kök, videonun gerçek atasından
  seçiliyor.
- **Netflix Android'de gizli** — oda listesinden de eleniyor.

- **sebebi açık işlerde var** - Android için **Native modül yazıldı, her şey hazırlandı**

## Açık işler

- **Her şeyden önce** - Netflix'in Android'de EME desteği yok (KURAL 1); native modüller DRM bilgisi okuyor ama oynatma kurulamıyor.

- YouTube görüntü düzeltmesi ölçümle doğru görünüyor
  (`gorunur=acik kutu=0,0,430,242 kare=1280x720 hazir=4`) ama
  **kullanıcı gözle onaylamadı**.
- Parti odası `odayaKatil`/`odadanAyril` çağırmıyor: sunucu tarafında
  üyelik yok, `oda_hareket_log` yazılmıyor, profil sayaçları boş kalıyor,
  yasak sunucuda zorlanmıyor.
- Misafirde (`dbId == null`) oda yetkilendirmesi tamamen istemci tarafında.
- **AdMob** yazılmadı; paket ve uygulama kimliği gerekiyor, Expo Go'da
  çalışmaz.
- **Premium** ve ada renk seçimi yazılmadı. Karşılama metni bu üç özelliği
  (reklamsız, renkli ad, sınırsız mikrofon) vaat ediyor ama hiçbiri yok.
- **`k.adi` migration'ı** yazılmadı. Aaron'daki KURAL 1 gereği canlı
  veritabanı okunmadan yazılmayacak; okuma sorguları
  `Aaron/db/CANLI_KULLANICI_ADI_KONTROL.sql` içinde hazır.
- Agora mikrofonu Expo Go'da denenemez, dev build gerekiyor.

## Bu depoya özel kurallar

Ayrıntısı `CLAUDE.md` içinde. Özet:

- `expo-dev-client` **kurulmaz**. Kurulduğunda Metro dev-build kipine
  geçiyor ve Expo Go `Cannot find native module 'ExpoAsset'` ile düşüyor.
- Metro yalnız Bolt tüneliyle açılır ve her zaman `EXPO_TOKEN` ile:
  `. "$HOME/.aron-expo-token"` sonra
  `EXPO_TOKEN="$EXPO_TOKEN" EXPO_FORCE_WEBCONTAINER_ENV=1 npx expo start`.
  ngrok ve cloudflared denenmiş, ikisi de çalışmıyor.
- `pkill -f` kullanılmaz, çağıran kabuğu öldürüyor.
- Kod yorumu yazılmaz; gerekçe commit mesajına ve `belgeler/`e gider.
