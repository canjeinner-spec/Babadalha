# Android düzen denetimi — 14 Eylül 2026

Expo 57 / React Native 0.86 ile Android'de **kenardan kenara çizim zorunlu**.
Uygulama sistem çubuklarının altına çiziyor; her ekran kendi boşluğunu
kendisi uygulamak zorunda. Android 16 bunu kapatma seçeneğini kaldırdı.

## Düzeltilenler

### 1. Yatayda içerik gezinme çubuğunun altında kalıyordu

Telefon yatay tutulduğunda Android'in gezinme çubuğu ekranın **yanına**
geçiyor. On sekiz ekranın hiçbiri `left` ve `right` kenar boşluğunu
uygulamıyordu, bu yüzden sağdaki sütun çubuğun altında kalıyordu.

Hepsinin `edges` listesine `left` ve `right` eklendi.

### 2. Oda ekranının yatay tam ekranı

`yatayGovde` hiç kenar boşluğu uygulamıyordu: sohbet sütunu ve oynatıcı
denetimleri gezinme çubuğunun altına giriyordu. Yatay gövdeye sol, sağ ve
alt boşluk verildi. Kullanıcı tam ekrana basmadan telefonu çevirirse diye
dikey gövdeye ve üst çubuğa da yan boşluk kondu.

### 3. Alt çubuğun gerçek yüksekliği

`CUBUK_YUKSEKLIGI = 74` sabitti ama çubuk kendine alt boşluk ekliyor, yani
gerçek yüksekliği 74 + alt boşluk. Jest çubuğu olan Android'de bu 120'ye
çıkıyor; listeler 74'e göre doldurulduğu için **son satır çubuğun altında
kalıyordu**. `useCubukPayi()` eklendi, üç ekran ona bağlandı. Çubuk ayrıca
yan boşlukları uyguluyor, yoksa yatayda en soldaki sekme çubuğun altında
kalıyordu.

### 4. Üst üste binen katmanlar

Kullanıcı kartının alt sayfası, oda yan paneli ve orta pencere yatayda yan
çubuğun altına giriyordu. Üçüne de yan boşluk verildi.

### 5. Tablet ve geniş ekran

`orientation: "default"` olduğu için tablet varsayılan olarak yatay açılıyor
ve içerik 1200 piksele yayılıyordu; metin satırları okunmaz uzunluğa
çıkıyordu. `src/theme/duzen.ts` içindeki `icerikKapsul` ile içerik 640'ta
ortalanıyor.

### 6. Yazı büyütmesi

React Native varsayılanı sistem yazı boyutunu sınırsız uyguluyor. Android'de
"Görüntü boyutu + yazı tipi boyutu" 2 katına kadar çıkabiliyor; sabit
yükseklikli kutularımızda (banner 96, alt çubuk 74, rozetler) yazı taşıyordu.
`Txt` ve bütün girdiler en çok **1.25 kat** büyüyor. Erişilebilirlik tamamen
kapatılmadı, yalnız sınırlandı.

### 7. Banner taşması

Ölçüm bitmeden slaytlar çiziliyordu; genişlik tanımsız olunca yazı sarmayıp
taşıyordu. Artık genişlik ölçülmeden çizilmiyor.

## Denetlenip sorun bulunmayanlar

- `Dimensions.get` hiç kullanılmıyor, dönmede bayatlayan ölçü yok;
  gereken yerlerde `useWindowDimensions` var.
- Pencereler `statusBarTranslucent` ve `navigationBarTranslucent` taşıyor.
- Klavye için `KeyboardAvoidingView` var; Android'de `height`, iOS'ta
  `padding` kipinde.
- `predictiveBackGestureEnabled` açık, geri hareketi expo-router ile
  çalışıyor.

## Hâlâ açık

- **Kamera izni** `app.json` içinde duruyor ama kamerayı kullanmıyoruz;
  avatar galeriden seçiliyor. Play Console kullanılmayan izni soruyor.
- **Yatay onboarding**: karşılama ve premium ekranları yatayda çalışıyor ama
  tasarlanmadı. Tablette ilk açılışta yatay geliyor.
- Test edilmesi gerekenler: jest çubuğu ve üç tuş açıkken, yazı boyutu en
  büyükken, görüntü boyutu en büyükken, katlanabilir cihaz açık ve kapalıyken,
  tablette yatay ve dikeyde.
