-- Aron Parti — eksik sosyal tablolar
-- Supabase SQL düzenleyicisine yapıştırılıp çalıştırılır. Tekrar çalıştırmak güvenli.
--
-- Bu dosya yalnız veritabanında OLMAYAN üç tabloyu kuruyor.
-- arkadasliklar, sikayetler ve bildirimler zaten var; Aaron uygulamasıyla
-- ortak oldukları için şemalarına ve kurallarına dokunulmuyor. Parti
-- bildirimleri kendi tablomuza (parti_sikayetleri) yazılıyor.
-- Oturum kimliği için mevcut benim_kullanici_id() kullanılıyor.

-- ---------------------------------------------------------------- engellemeler

create table if not exists public.engellemeler (
  engelleyen_id bigint not null references public.kullanicilar(id) on delete cascade,
  engellenen_id bigint not null references public.kullanicilar(id) on delete cascade,
  tarih timestamptz not null default now(),
  primary key (engelleyen_id, engellenen_id),
  constraint engellemeler_kendini check (engelleyen_id <> engellenen_id)
);

create index if not exists engellemeler_engelleyen on public.engellemeler (engelleyen_id);

alter table public.engellemeler enable row level security;

drop policy if exists engellemeler_kendi_okur on public.engellemeler;
create policy engellemeler_kendi_okur on public.engellemeler
  for select to authenticated using (engelleyen_id = public.benim_kullanici_id());

drop policy if exists engellemeler_kendi_ekler on public.engellemeler;
create policy engellemeler_kendi_ekler on public.engellemeler
  for insert to authenticated with check (engelleyen_id = public.benim_kullanici_id());

drop policy if exists engellemeler_kendi_siler on public.engellemeler;
create policy engellemeler_kendi_siler on public.engellemeler
  for delete to authenticated using (engelleyen_id = public.benim_kullanici_id());

grant select, insert, delete on public.engellemeler to authenticated;

-- -------------------------------------------------------------------- takipler

create table if not exists public.takipler (
  takipci_id bigint not null references public.kullanicilar(id) on delete cascade,
  takip_edilen_id bigint not null references public.kullanicilar(id) on delete cascade,
  tarih timestamptz not null default now(),
  primary key (takipci_id, takip_edilen_id),
  constraint takipler_kendini check (takipci_id <> takip_edilen_id)
);

create index if not exists takipler_edilen on public.takipler (takip_edilen_id);

alter table public.takipler enable row level security;

drop policy if exists takipler_herkes_okur on public.takipler;
create policy takipler_herkes_okur on public.takipler
  for select to authenticated using (true);

drop policy if exists takipler_kendi_ekler on public.takipler;
create policy takipler_kendi_ekler on public.takipler
  for insert to authenticated with check (takipci_id = public.benim_kullanici_id());

drop policy if exists takipler_kendi_siler on public.takipler;
create policy takipler_kendi_siler on public.takipler
  for delete to authenticated using (takipci_id = public.benim_kullanici_id());

grant select, insert, delete on public.takipler to authenticated;

-- ------------------------------------------------------------------- sayaçlar

create or replace function public.takip_sayilari(p_id bigint)
returns table (takipci bigint, takip bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.takipler where takip_edilen_id = p_id),
    (select count(*) from public.takipler where takipci_id = p_id)
$$;

grant execute on function public.takip_sayilari(bigint) to authenticated;

-- ----------------------------------------------------------- parti_sikayetleri

create table if not exists public.parti_sikayetleri (
  id bigserial primary key,
  bildiren_id bigint not null references public.kullanicilar(id) on delete cascade,
  bildirilen_id bigint not null references public.kullanicilar(id) on delete cascade,
  oda_id bigint,
  neden text not null,
  detay text,
  durum text not null default 'yeni',
  tarih timestamptz not null default now(),
  constraint parti_sikayetleri_kendini check (bildiren_id <> bildirilen_id),
  constraint parti_sikayetleri_neden check (
    neden in ('taciz', 'nefret', 'cinsel', 'cocuk', 'spam', 'siddet', 'diger')),
  constraint parti_sikayetleri_durum check (durum in ('yeni', 'inceleniyor', 'kapandi'))
);

create index if not exists parti_sikayetleri_bildirilen on public.parti_sikayetleri (bildirilen_id);
create index if not exists parti_sikayetleri_durum_ix on public.parti_sikayetleri (durum, tarih desc);

alter table public.parti_sikayetleri enable row level security;

drop policy if exists parti_sikayetleri_kendi_okur on public.parti_sikayetleri;
create policy parti_sikayetleri_kendi_okur on public.parti_sikayetleri
  for select to authenticated using (bildiren_id = public.benim_kullanici_id());

drop policy if exists parti_sikayetleri_kendi_ekler on public.parti_sikayetleri;
create policy parti_sikayetleri_kendi_ekler on public.parti_sikayetleri
  for insert to authenticated with check (bildiren_id = public.benim_kullanici_id());

grant select, insert on public.parti_sikayetleri to authenticated;
grant usage on sequence public.parti_sikayetleri_id_seq to authenticated;

-- ------------------------------------------------------ beni engelledi mi

create or replace function public.beni_engelledi_mi(p_id bigint)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.engellemeler
    where engelleyen_id = p_id and engellenen_id = public.benim_kullanici_id()
  )
$$;

grant execute on function public.beni_engelledi_mi(bigint) to authenticated;
