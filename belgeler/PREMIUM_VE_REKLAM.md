# Gelir modeli: reklam ve premium

## Kural

İzlemek ücretsiz. Ücretsiz kullanıcı reklam görür, **premium abone görmez.**
Reklamı kaldırmanın tek yolu abonelik; jeton, ödüllü reklam, "reklam izle
reklamsız izle" gibi bir ara yol yok.

Böyle olmasının sebebi: ödüllü reklam, ödeyebilecek kullanıcıya da bedava
çıkış veriyor ve aboneliği kendi elimizle satılamaz hâle getiriyor. Reklam
geliri ücretsiz kullanıcıdan, abonelik geliri ödemeye hazır kullanıcıdan
gelir; ikisi birbirinin yerine geçmez.

## Paketler

| Paket | Ürün kodu | Fiyat (TR) |
| --- | --- | --- |
| Aylık | `aron_premium_aylik` | ₺49,99 |
| Yıllık | `aron_premium_yillik` | ₺499,99 |

Fiyatlar `src/app/premium.tsx` içindeki `FIYATLAR` tablosunda; mağazadaki
fiyatla birebir aynı olmalı.

## Premium ne veriyor

- Reklamsız: oda listesinde ve izlerken reklam yok
- Özel ad rengi ve ona uyan sohbet baloncuğu
- Sınırsız mikrofon
- Yeni platformlar ve özellikler önce premiumda

## Satın alma nerede

`src/lib/satinalma.ts` bir köprü. Bugün arkasında sağlayıcı yok:
`satinAlmaHazirMi()` false dönüyor, premium düğmesi "mağaza açılamıyor"
diyor. Kimseden para alınmıyor, premium kendiliğinden açılmıyor.

Apple abonelik satan uygulamada satın almaları geri yüklemeyi şart koşuyor;
düğme premium ekranının dibinde duruyor ve `satinAlmalariGeriYukle()`
çağırıyor.

## Dev build alındığı gün

Reklam ve satın alma native modül istiyor. KURAL 3 gereği telefona tek
bağlanma yolumuz Expo Go olduğu sürece bu paketler depoda duramaz: kurulduğu
anda Expo Go `Cannot find native module` deyip uygulamayı hiç açmaz.

1. `react-native-purchases` (RevenueCat) ve `react-native-google-mobile-ads`
   kurulur.
2. `kopruyuBagla({ hazirla, satinAl, geriYukle })` çağrılır; `URUN_KIMLIKLERI`
   App Store Connect ve Play Console'daki kodlarla eşleşmeli.
3. Doğrulama sunucuda yapılır: RevenueCat webhook'u `kullanicilar.premium_hak`
   alanını günceller. İstemcideki `premiumuIsaretle()` yalnız arayüzü hızlı
   açmak için, yetki kaynağı değil.
4. Reklam gösterimi `premiumHak` false olan kullanıcıya açılır. Oynatıcıya ve
   oda listesine takılacak; premium kullanıcıda hiç çağrılmaz.

## Henüz yok

Uygulamada gösterilen bir reklam henüz yok; premium metni reklamsızlığı
vaat ediyor ama reklam tarafı dev build gününe kadar boş. Abonelik satışa
açılmadan önce ikisi birlikte bağlanmalı, yoksa parayla satılan şey ortada
olmaz.
