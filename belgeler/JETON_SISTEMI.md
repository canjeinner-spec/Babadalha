# İzleme jetonları ve premium

## Ne işe yarıyor

Aron'da izlemek ücretsiz. Reklam, jetonu olmayan kullanıcıya gösteriliyor.
Bir **jeton**, 30 dakikalık reklamsız izleme veriyor.

- `JETON_DAKIKA = 30`
- `REKLAM_ODULU = 1` — bir ödüllü reklam bir jeton
- `GUNLUK_HEDIYE = 1` — ücretsiz kullanıcıya her gün bir jeton
- `PREMIUM_DOLUM = 50` — premium kullanıcının bakiyesi her gün 50'ye dolar

Sayılar `src/lib/jeton.ts` içinde tek yerde duruyor.

## Neden bu sayılar

İki saatlik bir film, jetonla izlenirse dört ödüllü reklam demek. Ücretsiz
kullanıcı başına oturumda dört gösterim, bir kullanıcıyı ödemeye zorlamadan
elde ettiğimiz gelir. Bakiye için tavan koymadık: biriktiren kullanıcı bizim
için daha çok reklam izleyen kullanıcı demek.

Günlük hediye, uygulamayı ilk açan kişinin reklam duvarına çarpmadan bir
bölüm izleyebilmesi için. Maliyeti günde bir gösterim, karşılığı ertesi gün
geri gelmesi.

Premium'un satışı buradan yürüyor: jeton ekranı, bakiyesi biten kullanıcıya
"her gün 50 jeton" teklifini tam ihtiyaç anında gösteriyor.

## Kod nerede

| Dosya | İş |
| --- | --- |
| `src/lib/jeton.ts` | Bakiye, günlük hediye, premium dolumu, harcama sayacı |
| `src/lib/reklam.ts` | Ödüllü reklam köprüsü |
| `src/lib/satinalma.ts` | Mağaza köprüsü |
| `src/app/jetonlar.tsx` | Jeton ekranı |
| `src/components/JetonGorseli.tsx` | Jeton çizimi |

Profil başlığındaki jeton düğmesi bu ekrana gidiyor, üstünde bakiye yazıyor.

## Bağlanmayı bekleyen iki köprü

Ödüllü reklam ve mağaza, native modül istiyor. KURAL 3 gereği telefona tek
bağlanma yolumuz Expo Go olduğu sürece bu modüller depoda duramaz: kurulduğu
anda Expo Go `Cannot find native module` deyip uygulamayı hiç açmaz.

Bu yüzden ikisi de arkasına gerçek sağlayıcı takılabilen birer arayüz olarak
yazıldı. Bugün:

- `REKLAM_SAGLAYICI_BAGLI = false` — `odulluReklamGoster()` kısa bir bekleme
  sonrası `"odul"` dönüyor, akış uçtan uca denenebiliyor.
- `satinAlmaHazirMi()` false — premium düğmesi "mağaza açılamıyor" diyor,
  kimseden para alınmıyor, premium kendiliğinden açılmıyor.

### Dev build alındığı gün

1. Reklam için `react-native-google-mobile-ads`, satın alma için
   `react-native-purchases` (RevenueCat) kurulur.
2. `src/lib/reklam.ts` içinde `REKLAM_SAGLAYICI_BAGLI` true yapılır ve
   `odulluReklamGoster` gerçek ödüllü reklamı gösterir.
3. Mağaza tarafında `kopruyuBagla({ hazirla, satinAl, geriYukle })` çağrılır;
   `URUN_KIMLIKLERI` App Store Connect ve Play Console'daki ürün kodlarıyla
   eşleşmeli.
4. Satın alma doğrulaması sunucuda yapılır: RevenueCat webhook'u
   `kullanicilar.premium_hak` alanını günceller. İstemcideki
   `premiumuIsaretle()` yalnız arayüzü hızlı açmak için, yetki kaynağı değil.
5. Apple, abonelik satan uygulamada "satın almaları geri yükle" istiyor;
   düğme premium ekranının dibinde duruyor, `satinAlmalariGeriYukle()`
   çağırıyor.

### Ürün kodları

| Paket | Kod |
| --- | --- |
| Aylık | `aron_premium_aylik` |
| Yıllık | `aron_premium_yillik` |

## Henüz bağlanmamış

Jeton harcaması `izlemeBaslat()` olarak hazır ama oynatıcı henüz çağırmıyor,
çünkü gösterilecek reklamımız yok. Reklam sağlayıcısı bağlandığında oynatıcı
izlemeye başlarken bu işlevi çağıracak: jeton varsa düşecek ve 30 dakika
reklamsız sayacı başlayacak, yoksa araya reklam girecek.
