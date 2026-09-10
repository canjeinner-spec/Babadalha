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

---

## 3) "Doğrudan bağlantı" markası

**Nerede duracak:** platform seçicideki ızgarada, Netflix/Prime/Disney+
logolarının yanında. Şu an orada logo yok; bir daire içinde küre ikonu ve
düz yazı var, o yüzden diğerlerinin yanında eksik duruyor.

**Teknik**

- 1024 × 512 şeffaf PNG üret (2:1 yatay), ben içeriğe kırpıp yüksekliği
  138 px'e indireceğim (ızgarada 46 px, 3x için)
- Diğer platform logolarıyla **aynı ızgarada** duracak: onlar kendi
  markalarının renkli logoları. Bu yüzden bu da bir **marka gibi**
  görünmeli — düz ikon değil, kelime + işaret bütünü
- Zemin koyu (`#08080C` civarı), o yüzden mark açık renkli olmalı
- Şeffaf zemin, kenarda boşluk bırakma

**Türkçe uyarısı:** yine `İ` harfi riski var ama bu sefer kaçamıyoruz,
kelimenin kendisi "BAĞLANTI". İki seçenek:

- **Güvenli yol (önerim):** görselde hiç yazı olmasın, yalnız işaret
  üretilsin; "Doğrudan bağlantı" yazısını uygulamada yazı tipiyle basarım,
  tıpkı ARON markasında yaptığımız gibi. Aşağıdaki prompt bu yola göre.
- Yazılı istersen ayrıca söyle, o zaman `Ğ` ve `I` harflerini de ayrı ayrı
  tarif eden bir prompt yazarım ve çıkanı harf harf kontrol etmen gerekir.

```
A brand-style emblem representing a direct video link, designed to sit in a
grid next to streaming service logos on a near-black background. Motif: a
chain link fused with a play triangle, drawn as one continuous confident
shape. Warm brushed gold body (#E8B341 to #F5CE6E) with a single thin
turquoise accent line (#2DD4BF) tracing one edge. No purple, no violet, no
lavender anywhere in the image. Flat vector look with a subtle inner bevel,
matte finish, NOT glossy, NOT 3D rendered, no reflections, no highlights
blooming into white. No text, no letters, no circle badge, no drop shadow.

Critical output requirements: fully transparent background, crisp clean
alpha edges, no white haze, no gray fringe, no semi-transparent halo around
the shape, no speckles or stray pixels anywhere, no checkerboard artifacts.
The transparent area must be completely empty. Centered, 1024x512.
```

Onceki uretimde iki sorun cikti, prompt'a bu yuzden yukaridaki iki paragraf
eklendi:

- Sekil parlak 3B render olarak geldi, oysa duz ve mat isteniyordu.
- Saydam alanda 32.392 hayalet kenar pikseli ve 5.314 beyazimsi artik
  vardi; olcup temizledim ama temizlik amblemin acik tonlarindan da bir
  miktar yedi. Bu sefer kaynak temiz gelmeli.

Varyant: aynı prompt, `chain link fused with a play triangle` yerine
`a paper-plane arrow passing through a rounded rectangle screen`. İkisini de
gönder, ızgarada diğer logoların yanında hangisi durur bakarız.

**Renk notu:** mor kullanılmıyor. Izgarada Netflix kırmızısı, Prime ve
Disney+ mavisi, Crunchyroll turuncusu var; altın gövde + turkuaz vurgu
hem ARON'un kimliğiyle uyuyor hem o dörtlünün yanında ayrışıyor.

### 3b) İkinci deneme — neden değiştiriyoruz

İlk iki üretim ızgarada sırıttı. Sebep renk ya da kalite değil, **tür
farkı**: ızgaradaki diğerlerinin hepsi kelime markası (Netflix, prime
video, Disney+, Crunchyroll) — yatay, düz, yazı ağırlıklı, hacimsiz.
Bizimki ise kompakt ve hacimli bir amblemdi. Aynı yükseklikte bile farklı
bir tür olduğu için yabancı duruyor.

Bu yüzden hedef değişti: **amblem değil, kelime markası gibi duran yatay
ve düz bir işaret** üretilecek.

Türkçe harf sorunu hâlâ var (`BAĞLANTI` içinde `Ğ` ve `I`). Çözüm: markanın
kendisi Latin harfleriyle güvenli olan **`LINK`** kelimesi olsun; altında
uygulamanın bastığı "Doğrudan bağlantı" yazısı zaten duruyor, anlamı o
veriyor. Böylece hem ızgaradaki türe uyuyor hem harf riski sıfır.

**Teknik:** 1536 × 512 (3:1 yatay), şeffaf PNG. Ben kırpıp 168 px
yüksekliğe indireceğim (ızgarada 56 px, 3x).

```
A flat wordmark logo for a streaming brand, the single word "LINK" in
uppercase, horizontal, sitting alone on a fully transparent background.
Style must match how Netflix, Disney+ and Prime Video wordmarks look: flat,
two-dimensional, no depth, no bevel, no 3D extrusion, no glow, no shadow,
no reflections, no background plate. Clean geometric sans-serif letterforms,
medium weight, slightly wide letter spacing, confident and modern. Solid
warm gold color (#E8B341), with one small solid turquoise (#2DD4BF) play
triangle placed immediately to the left of the word as a compact mark, the
same height as the capital letters. No purple, no violet, no lavender.

Critical output requirements: pure flat vector rendering, sharp clean edges,
completely empty transparent background with no haze, no halo, no fringe, no
speckles, no stray pixels. Centered, 1536x512.
```

Varyant: `LINK` yerine `ARON LINK` da denenebilir; ızgarada marka bağı
kurar ama daha dar görünür, ikisini karşılaştırmak lazım.
