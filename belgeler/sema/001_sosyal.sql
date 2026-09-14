-- Aron Parti — sosyal tablolar
-- Supabase SQL düzenleyicisine olduğu gibi yapıştırılıp çalıştırılır.
-- Tekrar çalıştırmak güvenlidir.

create or replace function public.benim_id()
returns bigint
language sql stable security definer set search_path = public as $$
  select id from public.kullanicilar where auth_uid = auth.uid()
$$;

grant execute on function public.benim_id() to authenticated;

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
  for select to authenticated using (engelleyen_id = public.benim_id());

drop policy if exists engellemeler_kendi_ekler on public.engellemeler;
create policy engellemeler_kendi_ekler on public.engellemeler
  for insert to authenticated with check (engelleyen_id = public.benim_id());

drop policy if exists engellemeler_kendi_siler on public.engellemeler;
create policy engellemeler_kendi_siler on public.engellemeler
  for delete to authenticated using (engelleyen_id = public.benim_id());

grant select, insert, delete on public.engellemeler to authenticated;

-- --------------------------------------------------------------- arkadasliklar

create table if not exists public.arkadasliklar (
  isteyen_id bigint not null references public.kullanicilar(id) on delete cascade,
  istenen_id bigint not null references public.kullanicilar(id) on delete cascade,
  durum text not null default 'bekliyor',
  tarih timestamptz not null default now(),
  primary key (isteyen_id, istenen_id),
  constraint arkadasliklar_kendini check (isteyen_id <> istenen_id),
  constraint arkadasliklar_durum check (durum in ('bekliyor', 'kabul', 'red'))
);

create index if not exists arkadasliklar_istenen on public.arkadasliklar (istenen_id, durum);

alter table public.arkadasliklar enable row level security;

drop policy if exists arkadasliklar_taraf_okur on public.arkadasliklar;
create policy arkadasliklar_taraf_okur on public.arkadasliklar
  for select to authenticated
  using (isteyen_id = public.benim_id() or istenen_id = public.benim_id());

drop policy if exists arkadasliklar_isteyen_ekler on public.arkadasliklar;
create policy arkadasliklar_isteyen_ekler on public.arkadasliklar
  for insert to authenticated with check (isteyen_id = public.benim_id());

drop policy if exists arkadasliklar_istenen_yanitlar on public.arkadasliklar;
create policy arkadasliklar_istenen_yanitlar on public.arkadasliklar
  for update to authenticated
  using (istenen_id = public.benim_id()) with check (istenen_id = public.benim_id());

drop policy if exists arkadasliklar_taraf_siler on public.arkadasliklar;
create policy arkadasliklar_taraf_siler on public.arkadasliklar
  for delete to authenticated
  using (isteyen_id = public.benim_id() or istenen_id = public.benim_id());

grant select, insert, update, delete on public.arkadasliklar to authenticated;

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
  for insert to authenticated with check (takipci_id = public.benim_id());

drop policy if exists takipler_kendi_siler on public.takipler;
create policy takipler_kendi_siler on public.takipler
  for delete to authenticated using (takipci_id = public.benim_id());

grant select, insert, delete on public.takipler to authenticated;

-- ----------------------------------------------------------------- bildirimler

create table if not exists public.bildirimler (
  id bigserial primary key,
  bildiren_id bigint not null references public.kullanicilar(id) on delete cascade,
  bildirilen_id bigint not null references public.kullanicilar(id) on delete cascade,
  oda_id bigint,
  sebep text not null,
  aciklama text,
  durum text not null default 'yeni',
  tarih timestamptz not null default now(),
  constraint bildirimler_kendini check (bildiren_id <> bildirilen_id),
  constraint bildirimler_sebep check (sebep in ('taciz', 'nefret', 'cinsel', 'cocuk', 'spam', 'siddet', 'diger')),
  constraint bildirimler_durum check (durum in ('yeni', 'inceleniyor', 'kapandi'))
);

create index if not exists bildirimler_bildirilen on public.bildirimler (bildirilen_id, tarih desc);

alter table public.bildirimler enable row level security;

drop policy if exists bildirimler_kendi_okur on public.bildirimler;
create policy bildirimler_kendi_okur on public.bildirimler
  for select to authenticated using (bildiren_id = public.benim_id());

drop policy if exists bildirimler_kendi_ekler on public.bildirimler;
create policy bildirimler_kendi_ekler on public.bildirimler
  for insert to authenticated with check (bildiren_id = public.benim_id());

grant select, insert on public.bildirimler to authenticated;

-- ------------------------------------------------------------------- sayaçlar

create or replace function public.takip_sayilari(p_id bigint)
returns table (takipci bigint, takip bigint)
language sql stable security definer set search_path = public as $$
  select
    (select count(*) from public.takipler where takip_edilen_id = p_id),
    (select count(*) from public.takipler where takipci_id = p_id)
$$;

grant execute on function public.takip_sayilari(bigint) to authenticated;
