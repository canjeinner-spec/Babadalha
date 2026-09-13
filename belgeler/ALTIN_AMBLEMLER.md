# Altın amblemler

`assets/amblem/` altındaki webp'ler premium ve kutlama ekranlarının
simgeleri. `src/components/AltinAmblem.tsx` bunları yüklüyor; dosya
açılamazsa aynı çizgi ikonuna düşüyor, ekran hiçbir durumda boş kalmıyor.

| dosya | çizim | nerede | yedek ikon |
| --- | --- | --- | --- |
| `tac.webp` | taç | premium ekranının tepesi | `crown` |
| `onay.webp` | onay | kutlama ekranının tepesi | `check` |
| `yasak.webp` | yasak | premium: Reklamsız | `ban` |
| `yildiz.webp` | yıldız | premium: Özel ad rengin | `evStar` |
| `mikrofon.webp` | mikrofon | premium: Sınırsız mikrofon · adım: Sesini aç | `mic` |
| `simsek.webp` | şimşek | premium: Önce sen denersin · adım: Aynı saniyede izleyin | `bolt` |
| `elmas.webp` | elmas | premium: Ve çok daha fazlası | `evDiamond` |
| `parti.webp` | parti patlangacı | adım: Odanı aç | `evParty` |
| `kisi-ekle.webp` | kişi ekle | adım: Sevdiklerini çağır | `userAdd` |

Dosyalar anlamlarına göre değil çizdikleri şeye göre adlandırılıyor, böylece
aynı çizim birden fazla yerde kullanılabiliyor. Mikrofon ve şimşek hem
premium ayrıcalığı hem karşılama adımı olarak aynı dosyayı okuyor.

## Şu anki üretim

`src/icons/paths.ts` içindeki kendi ikon yollarımız cairosvg ile 192×192
(taç ve onay 320×320) raster'a basıldı. Üreten betik
`belgeler/amblem_uret.py`. Çizgi ve dolgu düz altın yerine dikey degrade
(`#FFF0CC → #F5CE6E → #E8B341 → #C8922B`), altında yumuşak altın hale var.
Parti başlat düğmesindeki amblemle aynı altın ailesi.

## Yerine başka görsel konacaksa

Dosya adları ve yolları aynı kalmalı, kod onları arıyor. İstenen biçim:

- 192×192 (taç 320×320), saydam arka plan, webp
- Kenarlardan ~%8 boşluk; amblem kutunun içinde nefes almalı
- Tek renk ailesi: altın (`#FFF0CC`–`#C8922B`). Beyaz, gri, mavi girmesin
- Beşi aynı üslupta olmalı: aynı çizgi kalınlığı, aynı dolgu kararı,
  aynı perspektif. Biri düz ikon biri 3B render olursa liste dağılıyor
- Gölge gömülmesin; koyu zemine oturuyorlar, kendi halesi yeterli
- 38pt kutunun içinde 24pt çiziliyor, yani telefonda küçük görünüyor.
  İnce detay kaybolur, silüet okunaklı olmalı

Dosyaları değiştirdikten sonra Metro'yu yeniden başlat, expo-image
önbelleği eski görseli tutabiliyor.

## Taç ve onay

Taç diğerlerinden ayrı üretildi: çizgi değil dolu. Gövde soldan sağa açılan
altın degrade, alt bandında hafif beyaz aydınlanma, üç ucunda inci var.
Kenar çizgisi yok; denendi, koyu zeminde gri bir hale bırakıyordu.
80pt koyu kutunun içinde 46pt çiziliyor.

Kutlama ekranının onay işareti aynı degradeyle ama kalın çizgi olarak
basıldı (2.9 birim, yuvarlak uç). 86pt kutunun içinde 48pt çiziliyor.
