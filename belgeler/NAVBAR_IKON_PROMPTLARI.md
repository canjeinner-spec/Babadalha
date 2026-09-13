# Navbar ikonları: görsel üretim promptları

Üç ikon gerekiyor, hepsi altın.

| dosya | sekme |
| --- | --- |
| `assets/amblem/ev.webp` | Ev |
| `assets/amblem/kapi.webp` | Partiler |
| `assets/amblem/kisi.webp` | Profil |

Başlat da dördüncü dosya: `assets/amblem/baslat.webp`. Yükseltilmiş altın
düğme kaldırıldı, Başlat artık diğer üçüyle aynı kalıpta duruyor, o yüzden
o da altın.

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

```bash
python3 belgeler/amblem_kes.py <gorsel.png> "ev,kapi,kisi" assets/amblem
```

Betik saydam kanala bakıp kümeleri kendi buluyor, eşit üçe bölmeye
güvenmiyor. Yaptıkları: eşiğin altındaki tozu ve en büyük parçanın
%2'sinden küçük lekeleri siliyor (üretilen görselde ikonların çevresinde
kırmızı ve sarı serpintiler vardı), kalan yarı saydam kenardan bir tık
kırpıp renk saçağını inceltiyor, her ikonu kendi sınırına göre kesip
kareye ortalıyor, %8 kenar payı bırakıp 192×192 webp yazıyor.

Pasif hâller dosya olarak üretilmiyor; `AltinAmblem` sönük istendiğinde
aynı görseli düşük saydamlıkla çiziyor.

## Başlat için ayrı prompt

Üç sekme üretildikten sonra istendiği için tek başına, ama aynı üslupla.

```
One single icon, 1024 x 1024 pixels, fully transparent background.
Flat vector app icon, polished gold gradient fill with the light coming
from the top-left: #FFF6DE highlight, into #F8D98A, #EFC25C in the
middle, #D9A238, down to #B8811F in the lower right. A soft warm golden
glow hugs the shape. No drop shadow, no ground shadow, no reflection.
A party popper: a short thick cone tilted towards the upper right with a
play triangle sitting inside its mouth, and four or five thick rounded
confetti shards flying out above it. Bold rounded shapes, one uniform
stroke weight roughly 8% of the canvas, no hairlines, no thin streamers.
Reads as one compact silhouette that stays legible at 26 px, with the
same visual weight as a solid house or person icon.
Centred, filling about 62% of the canvas.
No text, no letters, no numbers, no frame, no border, no circle or
square container, no background colour.
```

Gelince `belgeler/amblem_kes.py` ile tek ikon olarak kesilip
`assets/amblem/baslat.webp` üstüne yazılır.
