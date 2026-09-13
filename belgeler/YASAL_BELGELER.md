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
