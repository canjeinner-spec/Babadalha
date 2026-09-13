# Premium ayrıcalık amblemleri

`assets/premium/` altındaki beş webp, premium ekranındaki ayrıcalık
satırlarının simgesi. `src/components/PremiumAmblem.tsx` bunları yüklüyor;
dosya açılamazsa aynı çizgi ikonuna düşüyor, ekran hiçbir durumda boş
kalmıyor.

| dosya | satır | yedek ikon |
| --- | --- | --- |
| `reklamsiz.webp` | Reklamsız | `ban` |
| `ad-rengi.webp` | Özel ad rengin | `evStar` |
| `mikrofon.webp` | Sınırsız mikrofon | `mic` |
| `erken.webp` | Önce sen denersin | `bolt` |
| `daha.webp` | Ve çok daha fazlası | `evDiamond` |

## Şu anki üretim

`src/icons/paths.ts` içindeki kendi ikon yollarımız cairosvg ile 192×192
raster'a basıldı. Çizgi ve dolgu düz altın yerine dikey degrade
(`#FFF0CC → #F5CE6E → #E8B341 → #C8922B`), altında yumuşak altın hale var.
Parti başlat düğmesindeki amblemle aynı altın ailesi.

## Yerine başka görsel konacaksa

Dosya adları ve yolları aynı kalmalı, kod onları arıyor. İstenen biçim:

- 192×192, saydam arka plan, webp
- Kenarlardan ~%8 boşluk; amblem kutunun içinde nefes almalı
- Tek renk ailesi: altın (`#FFF0CC`–`#C8922B`). Beyaz, gri, mavi girmesin
- Beşi aynı üslupta olmalı: aynı çizgi kalınlığı, aynı dolgu kararı,
  aynı perspektif. Biri düz ikon biri 3B render olursa liste dağılıyor
- Gölge gömülmesin; koyu zemine oturuyorlar, kendi halesi yeterli
- 38pt kutunun içinde 24pt çiziliyor, yani telefonda küçük görünüyor.
  İnce detay kaybolur, silüet okunaklı olmalı

Dosyaları değiştirdikten sonra Metro'yu yeniden başlat, expo-image
önbelleği eski görseli tutabiliyor.
