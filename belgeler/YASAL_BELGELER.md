# Kullanım Koşulları ve Gizlilik Politikası

Metinler `src/data/belgeler.ts` içinde, Türkçe ve İngilizce. Uygulama
`/belge?tur=kosullar` ve `/belge?tur=gizlilik` ile gösteriyor. İki yerden
ulaşılıyor: odaya ilk girişteki topluluk bildiriminin altındaki bağlantılar
ve profildeki YASAL kutusu.

## Neden bu içerik

Gizlilik politikası tahminle değil, depodaki gerçek veri akışına bakılarak
yazıldı:

- `profiller` sütunları: kullanıcı adı, e-posta, profil resmi, biyografi,
  cinsiyet, ülke, şehir, doğum tarihi, seviye, deneyim puanı, özel id
- oda tarafı: `odalar`, `oda_katilimcilar`, `oda_mesajlari`,
  `oda_ziyaretleri`, `oda_hareket_log`, `oda_yasaklari`
- cihazda yalnız beş anahtar: `aron.dil`, `aron.giris.atlandi`,
  `aron.karsilama.goruldu`, `aron.kurallar.goruldu`, `aron.premium.goruldu`
- ses: Agora, kayıtsız gerçek zamanlı akış
- platform oturumları: `cerezAl` ile WebView'den okunup yerel oynatıcıya
  veriliyor, cihazdan çıkmıyor
- bağımlılıklarda reklam ağı, analitik ya da izleme paketi yok

Bu listelerden biri değişirse politika da değişmeli.

## Turtle'ın metinleri neden alınmadı

13 Eylül'de Turtle'ın Kullanım Koşulları ve Gizlilik Politikası örnek
olarak getirildi. Koşulların yapısı alındı: uygulamada değişiklik hakkı,
cihaz güvenliği ve jailbreak/root uyarısı, internet ve veri kullanımı,
güncelleme ile erişimin sona ermesi, yürürlük tarihi. Gizlilik tarafında
güvenlik önlemleri, onay ve bağlanırken görülen teknik veriler eklendi.

Turtle'ın gizlilik metni olduğu gibi alınamaz, çünkü bizi anlatmıyor.
O metin "hesap ya da giriş gerekmez", "ad, e-posta, telefon, parola
toplanmaz", "kimlikler geçici ve gerçek kimliğe bağlı değil" diyor.
Aron'da Apple ve Google girişi var, `profiller` tablosunda e-posta,
kullanıcı adı, doğum tarihi duruyor ve `oda_mesajlari`'nda sohbet
saklanıyor. O metni koyarsak gizlilik politikamız yanlış beyan olur;
App Store gizlilik etiketiyle de çelişir, KVKK ve GDPR tarafında da
sorun çıkarır. Ayrıca metin Turtle'ın kendi belgesi.

## Kapanmamış işler

1. **İletişim adresi.** `ARON_ILETISIM` boş. Boşken ekran o satıra kırmızı
   "İletişim adresi henüz eklenmedi." yazıyor, yani fark edilmeden
   yayınlanamıyor. Bir destek adresi yazılmalı.
2. **Gizlilik politikası için genel adres.** App Store Connect ve Play
   Console gizlilik politikası olarak bir web adresi istiyor; uygulama içi
   kopya tek başına yetmiyor. `src/data/belgeler.ts` içindeki metnin aynısı
   bir sayfaya konup adresi oraya girilmeli.
3. **Kullanılmayan CAMERA izni.** `app.json` içinde
   `android.permission.CAMERA` var ama depoda kamerayı kullanan kod yok.
   Play Console kullanılmayan izinleri sorguluyor; kamera gerçekten
   gerekmiyorsa satır silinmeli.
4. **Hesap kapatma.** Politika "hesabını uygulamadan kapatabilirsin" diyor.
   Profilde çıkış var, hesap silme yok. Apple 5.1.1(v) hesap oluşturan
   uygulamalarda uygulama içi hesap silme istiyor; eklenmeli.
5. **Saklama süresi.** Politika oda mesajlarının "sınırlı bir süre"
   saklandığını söylüyor. Sürenin kaç gün olduğu kararlaştırılıp hem
   metne hem sunucuya yazılmalı.

Metinler hukukçu incelemesinden geçmedi; yayına çıkmadan önce okutulmalı.
