# Navbar ikonları: görsel üretim promptları

Üç ikon gerekiyor, hepsi altın.

| dosya | sekme |
| --- | --- |
| `assets/amblem/ev.webp` | Ev |
| `assets/amblem/kapi.webp` | Partiler |
| `assets/amblem/kisi.webp` | Profil |

Ortadaki yükseltilmiş düğme üretilmeyecek: içinde zaten kendi parti
amblemimiz (`assets/marka/parti-amblem.webp`) duruyor.

## Neden pasif hâlini üretmeye gerek yok

Sekme ikonu iki durumda görünüyor: seçiliyken altın, seçili değilken
sönük. `tintColor` tek renge düzleştirdiği için degradeyi öldürüyor.
Bunun yerine pasif hâller `belgeler/amblem_uret.py` ile aktiften
türetiliyor (doygunluk düşürülüp karartılıyor), yani üretilecek dosya
sayısı dört.

## Tek prompt

Üçü tek görselde yan yana üretilir, sonra kesilip ayrılır.

```
One single image, 3072 x 1024 pixels, fully transparent background,
containing exactly three separate icons laid out side by side in one
horizontal row. Divide the canvas into three equal 1024 x 1024 squares;
place one icon dead centre in each square, each icon filling about 62%
of its own square so there is clean empty margin around every icon.
Never let an icon touch or cross the boundary between squares.

All three icons share one style:
flat vector app icons, polished gold gradient fill with the light coming
from the top-left: #FFF6DE highlight, into #F8D98A, #EFC25C in the
middle, #D9A238, down to #B8811F in the lower right. A soft warm golden
glow hugs each shape. No drop shadow, no ground shadow, no reflection.
One uniform rounded stroke weight across all three, roughly 8% of a
single square's width; no hairlines, no thin decorative details. Bold
simple silhouettes that stay readable when scaled down to 26 px.

Left square: a simple house seen straight on, a wide pitched roof over a
plain rectangular body with one rounded door opening in the middle,
symmetrical, no windows, no chimney.

Middle square: a single door seen straight on, a tall rounded-top
rectangle with a thick frame, standing slightly open, with one small
round knob on the right side, no wall, no floor, no keyhole.

Right square: a single person symbol, one circle for the head above a
rounded shoulders shape, symmetrical, no facial features, no arms,
no neck.

No text, no letters, no numbers, no dividing lines, no frames, no
borders, no cards, no containers, no background colour, no scenery.
```

Arka plan saydam çıkmazsa yeniden üretilir; beyaz zeminli olanı kabul
etme, kesince kenarlarda beyaz hâle kalıyor.

## Görsel geldiğinde

Üç kareye bölünüp `ev.webp`, `kapi.webp`, `kisi.webp` olarak kaydedilir,
pasif hâlleri de aktiften türetilir. Kesme ve dönüştürme
`belgeler/amblem_uret.py` yanında yapılır.

