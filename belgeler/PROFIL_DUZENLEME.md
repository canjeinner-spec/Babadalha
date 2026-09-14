# Profil düzenleme

`src/app/profil-duzenle.tsx`. Profil kartındaki oktan açılıyor.

## Çalışanlar

- **Fotoğraf.** `expo-image-picker` ile galeriden seçiliyor, kare kırpılıyor,
  Supabase Storage'daki `avatars` kovasına `<auth-uid>/<zaman>.jpg` olarak
  yükleniyor, dönen genel adres `profil_resmi`ne yazılıyor. Yol düzeni
  uydurulmadı; veritabanındaki mevcut kayıtlar zaten bu biçimde.
- **Kullanıcı adı.** Yazarken duraklayınca `kullanici_adi_musait` RPC'siyle
  sunucuya soruluyor, alınmışsa kaydet kapanıyor. Uzunluk 3-32, izinli
  karakterler harf, rakam, alt çizgi ve nokta.
- **Ad rengi.** Yalnız Premium'da açık. Gökkuşağı ve altı amblem paleti
  (Altın, Yakut, Ametist, Buz, Zümrüt, Çelik) arasından seçiliyor, üstünde
  canlı önizleme var. Seçim `ozel_id_tema` sütununa yazılıyor.
- Hakkında, ülke, şehir.

## Ad rengi neden `ozel_id_tema`'ya yazılıyor

`OzelIdGosterim`, tip `premium` olduğunda amblemi kimliğin basamak
düzeninden türetiyor (`amblemSec`), `ozel_id_tema`'ya bakmıyor. Yani bu
sütun premium kullanıcılarda boşta duruyordu. `RenkliAd` de premium için
sabit gökkuşağı çiziyordu; artık `ozel_id_tema` doluysa o paletten akıyor,
boşsa gökkuşağına düşüyor. Böylece yeni sütun açmadan, mevcut kullanıcıların
kimlik kapsülünü bozmadan çalışıyor.

## 7 gün kuralı şu an cihazda

`src/lib/adKilidi.ts` son değişim zamanını AsyncStorage'a yazıyor ve süre
dolana kadar alanı kilitliyor. **Bu sunucu tarafında zorlanmıyor**;
uygulamayı silip kuran ya da isteği elle atan kuralı aşar. Gerçekten
uygulanması için `kullanicilar` tablosuna bir sütun ve güncellemeyi
denetleyen bir kural gerekiyor:

```sql
alter table public.kullanicilar
  add column if not exists kullanici_adi_degisim timestamptz;

create or replace function public.kullanici_adi_degistir(p_ad text)
returns public.kullanicilar
language plpgsql security definer set search_path = public as $$
declare k public.kullanicilar;
begin
  select * into k from public.kullanicilar where auth_uid = auth.uid();
  if k is null then raise exception 'Oturum yok.'; end if;
  if k.kullanici_adi_degisim is not null
     and k.kullanici_adi_degisim > now() - interval '7 days' then
    raise exception 'Kullanıcı adı 7 günde bir değiştirilebilir.';
  end if;
  update public.kullanicilar
     set kullanici_adi = p_ad, kullanici_adi_degisim = now()
   where auth_uid = auth.uid()
  returning * into k;
  return k;
end $$;
```

Sütun ve fonksiyon açıldığında `profil-duzenle` kaydetme yolu
`updateMyProfile` yerine bu RPC'yi çağıracak biçimde değiştirilir, cihazdaki
bayrak da kaldırılır.

## Görünen ad şu an cihazda

Kullanıcı adının üstündeki "Ad" alanı serbestçe değişiyor ve
`src/lib/gorunenAd.ts` ile AsyncStorage'a yazılıyor. Şu an yalnız kendi
cihazında görünüyor: profil kartında ve düzenleme önizlemesinde okunuyor,
sohbete ve odalara gitmiyor.

Gerçekten herkese görünmesi için şema ve bağlantı gerekiyor:

```sql
alter table public.kullanicilar
  add column if not exists gorunen_ad text;
```

Görünüm de aynı sütunu yayınlamalı:

```sql
create or replace view public.profiller as
  select id, public_id, kullanici_adi, gorunen_ad, profil_resmi, biyografi,
         cinsiyet, ulke, sehir, seviye_id, deneyim_puani, durum, ekonomi_rolu,
         olusturulma_tarihi, ozel_id, ozel_id_tip, ozel_id_tema, kusanilan_rozet
    from public.kullanicilar;
```

Sonra `Profile` tipine, `SELF_COLS`'a ve `updateMyProfile` yamasına eklenir;
adı çizen yerler (sohbet mesajı, sistem mesajı, oda listesi, kişi paneli)
`gorunen_ad ?? kullanici_adi` okuyacak biçimde bağlanır. `useGorunenAd`
o zaman kaldırılır.
