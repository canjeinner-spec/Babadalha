# Navbar ikonları: görsel üretim promptları

Dört ikon gerekiyor. Üçü çubuktaki sekmeler (altın), biri ortadaki
yükseltilmiş düğmenin içi (koyu).

| dosya | sekme | dolgu |
| --- | --- | --- |
| `assets/amblem/ev.webp` | Ev | altın |
| `assets/amblem/kapi.webp` | Partiler | altın |
| `assets/amblem/kisi.webp` | Kişi | altın |
| `assets/amblem/oynat.webp` | ortadaki düğme | koyu |

## Neden ortadaki farklı

Ortadaki düğmenin zemini zaten altın degrade (parti başlat düğmesindeki
gibi). Üstüne altın ikon konursa okunmaz; o yüzden koyu mürekkep
(`#241A05`) isteniyor.

## Neden pasif hâlini üretmeye gerek yok

Sekme ikonu iki durumda görünüyor: seçiliyken altın, seçili değilken
sönük. `tintColor` tek renge düzleştirdiği için degradeyi öldürüyor.
Bunun yerine pasif hâller `belgeler/amblem_uret.py` ile aktiften
türetiliyor (doygunluk düşürülüp karartılıyor), yani üretilecek dosya
sayısı dört.

## Ortak üslup bloğu

Her promptun başına aynen bu konur; setin birbirini tutması buna bağlı.

```
Flat vector app icon, single centred object, transparent background,
1024x1024 PNG with alpha.
Polished gold gradient fill, light coming from the top-left:
#FFF6DE highlight, into #F8D98A, #EFC25C in the middle, #D9A238,
down to #B8811F in the lower right.
Soft warm golden glow hugging the shape. No drop shadow, no ground
shadow, no reflection.
Uniform rounded stroke weight, roughly 8% of the canvas width; no
hairlines, no thin details.
Bold simple silhouette that stays readable when scaled down to 26 px.
No text, no letters, no numbers, no background elements, no frame,
no border, no card, no container, no gradient background.
```

## Tek tek promptlar

**1. Ev** — ortak blok + `A simple house seen straight on: a wide pitched
roof and a plain rectangular body with one rounded door opening in the
middle. Symmetrical, no windows, no chimney.`

**2. Partiler (kapı)** — ortak blok + `A single door seen straight on: a
tall rounded-top rectangle with a thick frame, standing slightly open,
with one small round door knob on the right side. No wall, no floor, no
handle plate, no keyhole.`

Küre yerine kapı seçildi: "oda" kelimesinin birebir karşılığı, 26 px'te
okunuyor ve Rave ile Turtle'ın küresine benzemiyor.

**3. Kişi** — ortak blok + `A single person symbol: one circle for the
head above a rounded shoulders shape. Symmetrical, no facial features,
no arms, no neck.`

**4. Ortadaki düğme** — ortak bloğun altın satırları şununla değiştirilir:
`Solid flat fill in one single dark colour #241A05, no gradient, no glow.`
sonra + `A play triangle with softly rounded corners, pointing right,
slightly optically centred. Nothing around it, no circle, no square, no
ring.`

## Set birbirini tutmazsa

Model ikonları tek tek üretirken üslubu kaydırıyorsa, dördünü tek
görselde iste:

```
One image, 2048x2048, transparent background, containing exactly four
icons in a 2x2 grid, evenly spaced, each centred in its own quadrant and
filling about 70% of that quadrant. Same drawing style, same stroke
weight and same gold gradient for all four.
Top-left: a simple house with a pitched roof and one door opening.
Top-right: a single door, tall rounded-top rectangle with a thick frame,
standing slightly open, one round knob. Bottom-left: a person symbol, circle head over rounded shoulders.
Bottom-right: a play triangle with rounded corners pointing right.
No text, no frame, no background.
```

Dördü kesilip ayrılır; ortadaki düğmenin koyu hâli ayrıca istenir.

## Dosyalar geldiğinde

PNG de olur, webp'ye çeviririm. `assets/amblem/` altına yukarıdaki adlarla
konur. Açılmazsa `AltinAmblem` eski çizgi ikona düşüyor, çubuk hiçbir
durumda boş kalmıyor.
