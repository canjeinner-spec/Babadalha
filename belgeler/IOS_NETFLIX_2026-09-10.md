# iOS'ta Netflix — 10 Eylül 2026 ölçümleri

Cihaz: iPhone, Expo Go, `react-native-webview` (yerel modül yok).
Kimlik: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15
Version/17.4 Safari/605.1.15`, `platform=MacIntel`, `dokunma=0`.

Bütün satırlar `parti-metro.log`'dan; tahmin yok.

## Android'den farkı: iOS'ta EME açık

Netflix'in kendi `clientPlaybackCapabilities` nesnesi:

```
supportsHTML5=maybe supportsHTML5withDRM=maybe determinedCapabilities=true
canPlayHTML5=true canPlayHTML5WithDRM=true
TAG=yes TAG_UA=maybe H264=yes WEBM=yes HLS=yes
MSE=yes MSE_MP4_AUDIO=yes MSE_MP4=yes MSE_WEBM=yes MSE_EME_TYPE_MP4=yes
SILVERLIGHT=no FLASH=no
EME_UA=maybe READ_ONLY_AUDIO=no EME=yes
```

**`EME=yes`.** Android'de bu satır `no` idi ve duvar oradaydı
(`ANDROID_WEBVIEW_DRM_2026-09-09.md`). iOS'ta motor "yapabilirim" diyor:

- `eme istek com.apple.fps.3_0` → `eme TAMAM com.apple.fps.3_0`
- `anahtar URETILDI com.apple.fps.3_0`
- avc1, hevc, dvhe, av01 tamponları açılıyor
- `medya: eski-fps destek com.apple.fps.2_0 -> EVET`

Yani iOS'ta FairPlay kuruluyor. Sorun DRM yeteneği değil.

## Asıl bulgu: içerik başına karar

Aynı oturumda, aynı kimlikle, aynı WebView'de:

| İzleme adresi | Sonuç |
|---|---|
| `/watch/80126264` | `video-bulundu hazir=4 +119ms` ✅ (tam sayfa yükleme) |
| `/watch/82699336` | `video-bulundu hazir=4 +1887ms` ✅ (SPA gezintisi) |
| `/watch/70301862` | video ögesi hiç oluşmadı ❌ |
| `/watch/81323556` | video ögesi hiç oluşmadı ❌ |
| `/watch/81035908` | tam sayfa yüklemesinden sonra da oluşmadı ❌ |

Başarısızlarda ekranda **kodsuz** hata sayfası çıkıyor ve Netflix'in iç
hata nesnelerinin hepsi boş:

```
nfhata: ekranda kodsuz hata sayfasi yol=/watch/81035908
nfic: kodsuz olusturmaHatasi={} durum={} yetenek={...} uaDestek={...} oturum={}
```

Sonu `_UA` olan alanların hepsi `maybe`: Netflix gönderdiğimiz kimliği
sınıflandıramıyor.

## DÜZELTME (aynı gün, Turtle sökümünden sonra)

Yukarıdaki tablodan "Netflix içerik başına ret veriyor" diye hüküm
vermiştim. **Fazla genişti.** Başarısızlıkların bir kısmı bizim kendi
hatamızmış: `enBuyukVideo()` sayfadaki en geniş alanlı videoyu seçiyordu
ve izleme sayfasında bir önceki sayfadan kalan fragman ögesine yapışıp
kalıyordu. Turtle'ın `isInsideWatchVideoContainer` yaklaşımı alınıp
oynatıcı kabı testi eklendikten sonra (`143fa2a`) tablo değişti:

| | Düzeltmeden önce | Düzeltmeden sonra |
|---|---|---|
| Açılan | 2 | **6** |
| Açılmayan | 3 | 3 |

Açılan: `80126264`, `80241208`, `81237996`, `81282956`, `81786017`,
`82699336` — hepsi `hazir=4`, 1383–1890 ms arası.
Açılmayan: `80014298`, `81035908`, `82716765`.

**Açılmayan sayısı hiç artmadı, açılan sayısı üçe katlandı.** Yani
"Netflix reddediyor" sandığımız vakaların çoğu bizim yanlış ögeye
yapışmamızmış.

Geriye kalan üç içerikte Netflix'in kendi kodsuz hata sayfası çıkıyor ve
iç hata nesneleri boş geliyor; bunlar gerçek ret. **O ret aşılmaya
çalışılmaz.** Ama "içeriklerin çoğu reddediliyor" demek yanlıştı, kayda
geçsin.

## Çürütülen ara hüküm

Oturumun ortasında "izleme adresine tam sayfa yükleme çalışıyor, servisin
kendi SPA gezintisi çalışmıyor" diye yazmıştım. **Yanlıştı.**
`/watch/82699336` SPA gezintisiyle açıldı; `/watch/81035908` tam sayfa
yüklemesinden sonra da açılmadı. Gezinti biçimi belirleyici değil.

## Kalan düzeltme: izleme bekçisi

Yine de yerinde bırakıldı, çünkü ölçülen bir işe yarıyor: video bulunması
1887 ms sürebiliyor ve daha yavaş geçişlerde eşiği aşan içerik olabilir.

`src/parti/kopru.ts`: adres izleme sayfasına dönünce bekçi kuruluyor;
4,5 sn içinde YENİ video ögesi bağlanmazsa aynı adrese `location.replace`
ile tam sayfa yüklemesi yapılıyor. `sessionStorage` damgası her adres için
tek deneme veriyor. Cihazda doğrulandı:

```
izleme-video-yok tam-yuklemeye-geciliyor +4501ms
izleme-video-yok yeniden-denendi +4502ms      <- dongu yok
```

Ayrıca eski sayfadan kalan fragman ögesine yapışma sorunu vardı; loglarda
`atla: istek=33 ... sure=2663` satırları izlenen içeriğin değil o ögenin
süresini gösteriyordu. Bekçi `tVideo` üzerinden çalıştığı için o durum da
kapsanıyor.

## Arayüz tarafı

`parti-sec` izleme sayfasına gidilip 14 sn içinde oynatma başlamazsa ya da
`engel` olayı gelirse artık sessizce odaya dönmüyor; seçim ekranında
kalıp "Bu içerik burada açılmadı" uyarısını gösteriyor. Eskiden kuyruk boş
kaldığı için oda eski içeriği oynatmaya devam ediyordu ve kullanıcı ne
olduğunu anlamıyordu.

## Çalışan platformlar

Prime Video, Disney+, YouTube iOS'ta sorunsuz. Android'de Netflix hariç
hepsi çalışıyor (`platform.ts` → `BU_CIHAZDA_YOK`).

---

# ASIL KÖK SEBEP: S7020 — iki WebView

Yukarıdaki bütün "içerik açılmıyor" ölçümleri, aynı gün akşam bulunan tek
bir sebebe dayanıyordu. Cihazda Netflix şu hatayı bastı:

```
Hata Kodu S7020
Netflix'i birden fazla tarayıcıda veya sekmede izliyorsunuz.
```

Kullanıcının tespiti doğru yeri gösterdi: *"ilk oda oluştururken her film
sorunsuz ama oda içindeki akış sorunlu."*

`parti-oda` kendi WebView'ini monte tutuyordu; odadan büyüteçe basınca
`parti-sec` **ikinci** bir WebView açıyordu. İki Netflix oturumu aynı anda
açık kalınca Netflix ikincisini S7020 ile reddediyor, ardından kodsuz hata
sayfası basıyordu.

## Bu yüzden çürüyen üç hükmüm

Aynı gün üç kez "burada duvar var" dedim, üçü de yanlış çıktı:

1. **"Tam sayfa yükleme çalışır, SPA gezintisi çalışmaz."**
   Çürüdü: `/watch/82699336` SPA ile açıldı, `/watch/81035908` tam
   yüklemeden sonra da açılmadı.
2. **"Netflix içerik başına ret veriyor."**
   Çürüdü: oynatıcı kabı düzeltmesinden sonra açılan sayısı 2'den 6'ya
   çıktı, açılmayan hiç artmadı.
3. **"Kalan üç içerik gerçek ret."**
   Çürüdü: `70301862`, `81257204` ve `82026389` sonradan açıldı.

## Son tablo (aynı oturum, tüm düzeltmelerden sonra)

```
Açılan (en az bir kez):     11
Hiç açılmayan:               3   (80014298, 81035908, 82716765)
Önce takılıp sonra açılan:   3   (70301862, 81257204, 82026389)
```

Hiç açılmayan üçü için de "Netflix reddediyor" denemez; diğer üçü de bir
süre öyle görünüp sonra açıldı.

## Alınan ders

Bu depoda ölçüme dayanmayan hüküm vermek üç kez yanlış sonuç üretti ve
her seferinde suç servise atıldı, oysa hata bizim kodumuzdaydı. Bir
içerik açılmıyorsa önce şunlar elenir:

1. Aynı anda ikinci bir WebView açık mı (S7020 ve benzerleri)
2. Doğru video ögesine mi bağlıyız (oynatıcı kabı testi)
3. Yeterince bekledik mi (Turtle 250 ms → 1,5 sn → 5 sn ile pes etmiyor)

## Yapılan düzeltmeler

| Commit | Ne |
|---|---|
| `1b8424b` | izleme bekçisi — video yoksa bir kez tam sayfa yükleme |
| `143fa2a` | video ögesi kap testiyle seçiliyor (Turtle'dan) |
| `f9f7e62` | odak dışında oynatıcı sökülüyor (ilk S7020 düzeltmesi) |
| `08f1cbf` | bekçi oynayan videoyu kesmesin |
| `5578d91` | söküm yalnız seçim ekranı açıkken |
| `612318b` | **tek WebView** — seçim ekranı kaldırıldı, gezinme odada |
