-- Personavel – public reviews (places + website) with photos
-- Run once in Supabase → SQL Editor. Visitors are anonymous: they can only read through pv_list_reviews
-- and write through the pv_* functions below; the table itself is closed to the public API.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  kind        text not null check (kind in ('place','site')),
  target      text not null check (char_length(target) between 1 and 40),
  author      text not null check (char_length(btrim(author)) between 1 and 40),
  stars       smallint not null default 0 check (stars between 0 and 5),
  love        boolean not null default false,
  tags        text[] not null default '{}' check (cardinality(tags) <= 10),
  body        text not null default '' check (char_length(body) <= 800),
  photos      text[] not null default '{}' check (cardinality(photos) <= 4),
  hidden      boolean not null default false,
  reports     integer not null default 0,
  edit_hash   text not null                       -- sha256 of the device's secret token, never returned
);
-- one review per device/profile per place (or for the site); fast listing per place
create unique index if not exists reviews_owner_uq on public.reviews (kind, target, edit_hash);
create index if not exists reviews_list_idx on public.reviews (kind, target, updated_at desc) where not hidden;

alter table public.reviews enable row level security;   -- no policies: no direct table access for anon/authenticated
revoke all on public.reviews from anon, authenticated;

-- read: public columns only
create or replace function public.pv_list_reviews(p_kind text, p_target text)
returns table (id uuid, author text, stars smallint, love boolean, tags text[], body text, photos text[], updated_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.author, r.stars, r.love, r.tags, r.body, r.photos, r.updated_at
  from public.reviews r
  where r.kind = p_kind and r.target = p_target and not r.hidden
  order by r.updated_at desc
  limit 60;
$$;

-- create or update my review (identified by my secret token)
create or replace function public.pv_upsert_review(p_token text, p_kind text, p_target text, p_author text,
  p_stars int, p_love boolean, p_tags text[], p_body text, p_photos text[])
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_hash text;
begin
  if p_token is null or char_length(p_token) < 32 then raise exception 'bad token'; end if;
  if exists (select 1 from unnest(coalesce(p_photos,'{}')) u where u not like '%/storage/v1/object/public/review-photos/%') then
    raise exception 'photos must be uploaded to review-photos';
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  insert into public.reviews (kind, target, author, stars, love, tags, body, photos, edit_hash)
  values (p_kind, p_target, btrim(p_author), coalesce(p_stars,0), coalesce(p_love,false), coalesce(p_tags,'{}'), coalesce(p_body,''), coalesce(p_photos,'{}'), v_hash)
  on conflict (kind, target, edit_hash) do update
    set author = excluded.author, stars = excluded.stars, love = excluded.love, tags = excluded.tags,
        body = excluded.body, photos = excluded.photos, updated_at = now()
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.pv_delete_review(p_token text, p_kind text, p_target text)
returns void language sql security definer set search_path = ''
as $$
  delete from public.reviews
  where kind = p_kind and target = p_target and edit_hash = encode(extensions.digest(p_token, 'sha256'), 'hex');
$$;

-- anyone can report; 3 reports hide a review until a team member checks it in the dashboard
create or replace function public.pv_report_review(p_id uuid)
returns void language sql security definer set search_path = ''
as $$
  update public.reviews set reports = reports + 1, hidden = (reports + 1 >= 3) where id = p_id;
$$;

revoke all on function public.pv_list_reviews(text,text), public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[]),
  public.pv_delete_review(text,text,text), public.pv_report_review(uuid) from public;
grant execute on function public.pv_list_reviews(text,text), public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[]),
  public.pv_delete_review(text,text,text), public.pv_report_review(uuid) to anon, authenticated;

-- photos: public bucket, images only, max 1 MB each; visitors may upload but never overwrite or delete
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 1048576, array['image/webp','image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 1048576, allowed_mime_types = array['image/webp','image/jpeg'];

drop policy if exists "review photos: anyone can upload" on storage.objects;
create policy "review photos: anyone can upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'review-photos');
