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

## Ayrı görünen ad meselesi

Şemada tek ad sütunu var: `kullanici_adi`. Hem benzersiz kimlik hem de
odalarda görünen ad olarak o kullanılıyor. Serbestçe değişen ayrı bir
görünen ad istenirse `kullanicilar` tablosuna yeni bir sütun açılması ve adı
çizen her yerin (sohbet, oda listesi, sistem mesajları, profil) ona
bağlanması gerekir.
