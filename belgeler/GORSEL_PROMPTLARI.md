# Görsel prompt'ları — kelime markası ve başlat amblemi

Ben raster görsel üretmiyorum. Bu belge üretilecek şeyin ölçüsünü, üslubunu
ve sınırlarını tanımlar; görselleri sen ürettirip bana verirsin, kırpma,
ölçekleme, WebP'ye çevirme ve koda bağlama bende.

**Üslup çapası:** ARON'un mevcut dili — koyu zemin, altın (`#E8B341`,
`#F5CE6E`) ve mor (`#8B5CF6`, `#A78BFA`) vurgular, sıcak ışık, temiz siluet.
Aron deposundaki `belgeler/TEMA_SANAT_PROMPTLARI.md` ile aynı aile.

---

## 1) Kelime markası (`ARON`)

**Nerede duracak:** oda üst çubuğunun ortası. Şu an düz yazı:
`Txt weight="displayBold" size={23} color="#fff"`.

**Teknik**

- 2048 × 640 şeffaf PNG üret, ben içeriğe kırpıp yüksekliği 78 px'e indireceğim
  (ekranda 26 px, 3x için)
- Arkasında **temanın üst görseli** var — kalabalık, altın, parlak. Bu yüzden
  markanın kendi kenar ışığı ya da hafif koyu dış hattı olmalı; düz beyaz
  kelime o zeminde kayboluyor
- Yatay lockup, tek satır
- Şeffaf zemin, kenarlarda boşluk bırakma

**Türkçe uyarısı:** görsel üreticiler `İ` (noktalı büyük i) harfini
neredeyse her zaman yanlış çiziyor. Bu yüzden **yalnız `ARON` yazdır**;
"Parti" kelimesini uygulamada yazı tipiyle basacağım. Böylece hem harf riski
biter hem de alt satırın rengi temayla değişebilir.

```
Wordmark logo of the single word "ARON", horizontal single line, uppercase.
Premium nightlife feel: brushed gold letterforms with a warm inner glow and
a subtle darker outline so the mark stays readable over a busy bright gold
background. Slight geometric sans, tight but not condensed, confident and
modern, no serif flourishes. A faint violet rim light on the lower left
edges of the letters. Transparent background, no box, no frame, no shadow
plate, no tagline, no extra text. Vector-clean edges, centered, 2048x640.
```

Varyant istersen ikinci bir üretim: aynı prompt, `brushed gold` yerine
`polished cream white with gold rim light` — tema koyu olduğunda o daha iyi
oturabilir. İkisini de gönder, cihazda karşılaştırırız.

---

## 2) "Parti başlat" düğme amblemi

**Nerede duracak:** ana ekranın altındaki altın degradeli düğme. Şu an
`Icon name="evParty" size={17}`, mürekkep rengi `#241A05`.

**Önce bir uyarı:** 17 px'te resimlenmiş bir amblemin detayı tamamen
kaybolur. Bu iş yapılacaksa düğmedeki amblemi **26 px**'e çıkarmam lazım,
onu ben ayarlarım. Aron'un hediye ikonları da 54 px'te çiziliyor, altına
inince siluet dışında hiçbir şey görünmüyor.

**Teknik**

- 1024 × 1024 şeffaf PNG, ben içeriğe kırpıp 128 px'e indireceğim
- **Altın degradenin üstünde** duracak, yani amblem koyu olmalı — açık renk
  amblem altın zeminde kaybolur
- Kalın, tek parça siluet; ince çizgi, ince kuyruk, küçük yıldız serpintisi
  koydurma
- Şeffaf zemin

```
A single compact emblem icon for starting a watch party. Dark espresso-brown
silhouette (#241A05) with subtle warm highlights, designed to sit on top of a
bright gold surface. Motif: a play triangle nested inside a rounded confetti
burst, reading instantly at small size. Thick simple shapes, generous
negative space, no thin lines, no sparkle dust, no text, no circle badge
behind it. Flat with a soft inner bevel, not glossy 3D. Transparent
background, centered, 1024x1024.
```

---

## Bana verdiğinde ne yapacağım

1. İçeriğe kırpma (şeffaf kenar payını atma)
2. Hedef boyuta indirme, kelime markası için 78 px yükseklik, amblem için
   128 px kare
3. WebP'ye çevirme (`assets/marka/` altına)
4. Koda bağlama: kelime markası `parti-oda` üst çubuğuna, amblem
   `index.tsx`'teki başlat düğmesine; düğmedeki ikon boyutunu 26'ya çıkarma
5. Tema yokken/görsel yüklenemezse eski yazı ve ikona düşen yedek yol

**Not:** bu iki dosya depoya girecek, yani boyutları küçük tutulacak.
Kelime markası ~15 KB, amblem ~10 KB civarını hedefliyorum.
