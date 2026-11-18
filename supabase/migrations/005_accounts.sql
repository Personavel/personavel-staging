-- 005 · Tài khoản (Supabase Auth): hồ sơ, đồng bộ dữ liệu cá nhân, nội dung của tôi, bài viết, báo cáo, admin
-- Chỉ THÊM MỚI. Các hàm cũ (pv_list_reviews, pv_list_reviews_page, pv_upsert_review, pv_delete_review) giữ nguyên;
-- pv_report_review giữ tên + tham số, chỉ ghi thêm vào bảng reports. Chạy lại nhiều lần không lỗi.
-- Hợp đồng với giao diện: xem docs/data-contract.md. Lỗi trả về luôn bắt đầu bằng PV_ (PV_AUTH, PV_BANNED,
-- PV_RATE_LIMIT, PV_BAD_WORDS, PV_NOT_OWNER, PV_NOT_FOUND, PV_TOO_LONG, PV_INVALID, PV_FORBIDDEN).

-- =====================================================================================================
-- 1. Bảng
-- =====================================================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default 'Du khách' check (char_length(btrim(display_name)) between 1 and 40),
  avatar_url    text,
  lang          text not null default 'vi' check (lang in ('vi','en')),
  role          text not null default 'user' check (role in ('user','admin')),
  banned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.user_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);

alter table public.reviews add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.reviews add column if not exists hidden_reason text;
create index if not exists reviews_user_idx on public.reviews (user_id, updated_at desc) where user_id is not null;

create table if not exists public.posts (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  place          text check (place is null or char_length(place) between 1 and 40),
  title          text not null check (char_length(btrim(title)) between 1 and 120),
  body           text not null default '' check (char_length(body) <= 4000),
  photos         text[] not null default '{}' check (cardinality(photos) <= 6),
  hidden         boolean not null default false,
  hidden_reason  text,
  reports        integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists posts_list_idx on public.posts (created_at desc) where not hidden;
create index if not exists posts_place_idx on public.posts (place, created_at desc) where not hidden;
create index if not exists posts_user_idx on public.posts (user_id, updated_at desc);

-- ảnh của bài viết cũng phải chờ duyệt như ảnh đánh giá
alter table public.review_photos add column if not exists id uuid not null default gen_random_uuid();
create unique index if not exists review_photos_id_uq on public.review_photos (id);
alter table public.review_photos alter column review_id drop not null;
alter table public.review_photos add column if not exists post_id uuid references public.posts(id) on delete cascade;
do $$ begin
  alter table public.review_photos add constraint review_photos_owner_chk check (review_id is not null or post_id is not null);
exception when duplicate_object then null; end $$;

create table if not exists public.reports (
  id             uuid primary key default gen_random_uuid(),
  type           text not null check (type in ('review','post')),
  target_id      uuid not null,
  reporter_id    uuid references auth.users(id) on delete set null,
  reporter_hash  text not null,
  reason         text not null check (reason in ('abuse','spam','false_info','bad_photo','other')),
  note           text not null default '' check (char_length(note) <= 300),
  status         text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at     timestamptz not null default now(),
  resolved_by    uuid references auth.users(id) on delete set null,
  resolved_at    timestamptz,
  unique (type, target_id, reporter_hash)
);
create index if not exists reports_open_idx on public.reports (status, created_at desc);

create table if not exists public.mod_log (
  id           bigint generated always as identity primary key,
  admin_id     uuid references auth.users(id) on delete set null,
  action       text not null,
  target_type  text not null,
  target_id    text not null,
  reason       text,
  created_at   timestamptz not null default now()
);

-- mọi bảng đóng với API công khai: chỉ đi qua các hàm pv_* bên dưới
alter table public.profiles  enable row level security;
alter table public.user_data enable row level security;
alter table public.posts     enable row level security;
alter table public.reports   enable row level security;
alter table public.mod_log   enable row level security;
revoke all on public.profiles, public.user_data, public.posts, public.reports, public.mod_log from anon, authenticated;

-- báo cáo cũ (review_reports) chép sang bảng reports để trang admin thấy
insert into public.reports (type, target_id, reporter_hash, reason, created_at)
select 'review', rr.review_id, rr.reporter, 'other', rr.created_at from public.review_reports rr
on conflict (type, target_id, reporter_hash) do nothing;

-- =====================================================================================================
-- 2. Hàm phụ (không gọi được từ web)
-- =====================================================================================================
create or replace function public.pv_user_hash(p_uid uuid)
returns text language sql immutable set search_path = ''
as $$ select encode(extensions.digest('user:' || p_uid::text, 'sha256'), 'hex'); $$;

create or replace function public.pv_valid_avatar(p text)
returns boolean language sql immutable set search_path = ''
as $$
  select p is null or (p !~ '[[:space:]"''<>\\]' and char_length(p) <= 500 and p ~ ('^https://([a-z0-9-]+\.googleusercontent\.com/'
         || '|bwtmunpzdxtutspdpphb\.supabase\.co/storage/v1/object/public/avatars/)'));
$$;

create or replace function public.pv_photos_ok(p text[])
returns boolean language sql immutable set search_path = ''
as $$
  select not exists (select 1 from unnest(coalesce(p,'{}')) u
    where u !~ '^https://bwtmunpzdxtutspdpphb\.supabase\.co/storage/v1/object/public/review-photos/[A-Za-z0-9/_.-]+$');
$$;

create or replace function public.pv_default_name(meta jsonb)
returns text language plpgsql stable set search_path = ''
as $$
declare n text := btrim(left(coalesce(meta->>'full_name', meta->>'name', ''), 40));
begin
  if n = '' or public.pv_is_bad(n) then return 'Du khách'; end if;
  return n;
end $$;

create or replace function public.pv_default_avatar(meta jsonb)
returns text language plpgsql stable set search_path = ''
as $$
declare a text := coalesce(meta->>'avatar_url', meta->>'picture');
begin
  if a is not null and a ~ '^https://[a-z0-9-]+\.googleusercontent\.com/' and public.pv_valid_avatar(a) then return a; end if;
  return null;
end $$;

-- trạng thái hiển thị: hidden > pending (còn ảnh chưa duyệt) > public
create or replace function public.pv_status(p_hidden boolean, p_photos text[])
returns text language sql stable security definer set search_path = ''
as $$
  select case when p_hidden then 'hidden'
              when exists (select 1 from unnest(coalesce(p_photos,'{}')) u
                           where not exists (select 1 from public.review_photos rp where rp.url = u and rp.approved)) then 'pending'
              else 'public' end;
$$;

create or replace function public.pv_approved(p_photos text[])
returns text[] language sql stable security definer set search_path = ''
as $$
  select array(select u from unnest(coalesce(p_photos,'{}')) u
               where exists (select 1 from public.review_photos rp where rp.url = u and rp.approved));
$$;

-- tạo hồ sơ khi đăng ký (không bao giờ làm hỏng việc đăng ký)
create or replace function public.pv_on_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  begin
    insert into public.profiles (id, display_name, avatar_url)
    values (new.id, public.pv_default_name(new.raw_user_meta_data), public.pv_default_avatar(new.raw_user_meta_data))
    on conflict (id) do nothing;
  exception when others then null;
  end;
  return new;
end $$;
drop trigger if exists pv_on_auth_user_created on auth.users;
create trigger pv_on_auth_user_created after insert on auth.users for each row execute function public.pv_on_new_user();

-- người dùng hiện tại; p_write = true thì chặn tài khoản bị khóa
create or replace function public.pv_require_user(p_write boolean default false)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v uuid := auth.uid(); b boolean;
begin
  if v is null then raise exception 'PV_AUTH'; end if;
  insert into public.profiles (id, display_name, avatar_url)
  select u.id, public.pv_default_name(u.raw_user_meta_data), public.pv_default_avatar(u.raw_user_meta_data)
  from auth.users u where u.id = v
  on conflict (id) do nothing;
  if p_write then
    select banned into b from public.profiles where id = v;
    if b then raise exception 'PV_BANNED'; end if;
  end if;
  return v;
end $$;

create or replace function public.pv_require_admin()
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v uuid := auth.uid();
begin
  if v is null then raise exception 'PV_AUTH'; end if;
  if not exists (select 1 from public.profiles where id = v and role = 'admin') then raise exception 'PV_FORBIDDEN'; end if;
  return v;
end $$;

-- giới hạn gửi khi đã đăng nhập: 10 lần/giờ và cách nhau ≥ 20 giây mỗi tài khoản, 40 lần/giờ mỗi mạng
create or replace function public.pv_rate_user(p_uh text)
returns void language plpgsql security definer set search_path = ''
as $$
declare v_ip text := public.pv_client_hash();
begin
  if exists (select 1 from public.pv_post_log l where l.device_hash = p_uh and l.at > now() - interval '20 seconds')
     or (select count(*) from public.pv_post_log l where l.device_hash = p_uh and l.at > now() - interval '1 hour') >= 10
     or (select count(*) from public.pv_post_log l where l.ip_hash = v_ip and l.at > now() - interval '1 hour') >= 40 then
    raise exception 'PV_RATE_LIMIT';
  end if;
  insert into public.pv_post_log (ip_hash, device_hash) values (v_ip, p_uh);
  delete from public.pv_post_log where at < now() - interval '2 days';
end $$;

create or replace function public.pv_review_json(p_id uuid)
returns json language sql stable security definer set search_path = ''
as $$
  select json_build_object('id', r.id, 'kind', r.kind, 'target', r.target, 'author', r.author, 'stars', r.stars, 'love', r.love,
           'tags', r.tags, 'body', r.body, 'photos', r.photos, 'status', public.pv_status(r.hidden, r.photos),
           'hidden_reason', r.hidden_reason, 'created_at', r.created_at, 'updated_at', r.updated_at)
  from public.reviews r where r.id = p_id;
$$;

create or replace function public.pv_post_json(p_id uuid)
returns json language sql stable security definer set search_path = ''
as $$
  select json_build_object('id', p.id, 'place', p.place, 'title', p.title, 'body', p.body, 'photos', p.photos,
           'status', public.pv_status(p.hidden, p.photos), 'hidden_reason', p.hidden_reason,
           'author_name', pr.display_name, 'author_avatar', pr.avatar_url, 'created_at', p.created_at, 'updated_at', p.updated_at)
  from public.posts p left join public.profiles pr on pr.id = p.user_id where p.id = p_id;
$$;

-- =====================================================================================================
-- 3. Hồ sơ và dữ liệu cá nhân 🔒
-- =====================================================================================================
create or replace function public.pv_me()
returns public.profiles language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false); p public.profiles;
begin
  select * into p from public.profiles where id = v_uid;
  return p;
end $$;

create or replace function public.pv_update_profile(p_display_name text default null, p_avatar_url text default null, p_lang text default null)
returns public.profiles language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false); v_name text := btrim(p_display_name); p public.profiles;
begin
  if v_name is not null then
    if char_length(v_name) = 0 then raise exception 'PV_INVALID'; end if;
    if char_length(v_name) > 40 then raise exception 'PV_TOO_LONG'; end if;
    if public.pv_is_bad(v_name) then raise exception 'PV_BAD_WORDS'; end if;
  end if;
  if p_avatar_url is not null and p_avatar_url <> '' and not public.pv_valid_avatar(p_avatar_url) then raise exception 'PV_INVALID'; end if;
  if p_lang is not null and p_lang not in ('vi','en') then raise exception 'PV_INVALID'; end if;
  update public.profiles
     set display_name = coalesce(v_name, display_name),
         avatar_url   = case when p_avatar_url is null then avatar_url when p_avatar_url = '' then null else p_avatar_url end,
         lang         = coalesce(p_lang, lang),
         updated_at   = now()
   where id = v_uid returning * into p;
  if v_name is not null then update public.reviews set author = v_name where user_id = v_uid; end if;
  return p;
end $$;

-- nhận các đánh giá cũ đã viết bằng "mã bí mật" của máy (pv_cloudToken) về tài khoản
create or replace function public.pv_claim_reviews(p_token text)
returns integer language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false); v_uh text := public.pv_user_hash(v_uid); v_h text; n integer;
begin
  if p_token is null or char_length(p_token) < 32 then return 0; end if;
  v_h := encode(extensions.digest(p_token, 'sha256'), 'hex');
  update public.reviews r set user_id = v_uid, edit_hash = v_uh,
         author = coalesce((select display_name from public.profiles where id = v_uid), r.author)
   where r.edit_hash = v_h and r.user_id is null
     and not exists (select 1 from public.reviews x where x.kind = r.kind and x.target = r.target and x.edit_hash = v_uh);
  get diagnostics n = row_count;
  return n;
end $$;

create or replace function public.pv_get_user_data()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false);
begin
  return (select d.data || jsonb_build_object('updated_at', d.updated_at) from public.user_data d where d.user_id = v_uid);
end $$;

create or replace function public.pv_save_user_data(p_data jsonb)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false); v_at timestamptz := now();
begin
  if p_data is null or jsonb_typeof(p_data) <> 'object' then raise exception 'PV_INVALID'; end if;
  if pg_column_size(p_data) > 1048576 then raise exception 'PV_TOO_LONG'; end if;
  insert into public.user_data (user_id, data, updated_at) values (v_uid, p_data - 'updated_at', v_at)
  on conflict (user_id) do update set data = excluded.data, updated_at = excluded.updated_at;
  return jsonb_build_object('updated_at', v_at);
end $$;

create or replace function public.pv_export_my_data()
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false);
begin
  return jsonb_build_object(
    'exported_at', now(),
    'account',   (select jsonb_build_object('email', u.email, 'created_at', u.created_at, 'providers', u.raw_app_meta_data->'providers')
                  from auth.users u where u.id = v_uid),
    'profile',   (select to_jsonb(p) - 'role' - 'banned' from public.profiles p where p.id = v_uid),
    'user_data', (select d.data from public.user_data d where d.user_id = v_uid),
    'reviews',   coalesce((select jsonb_agg(public.pv_review_json(r.id)::jsonb order by r.updated_at desc) from public.reviews r where r.user_id = v_uid), '[]'),
    'posts',     coalesce((select jsonb_agg(public.pv_post_json(p.id)::jsonb order by p.created_at desc) from public.posts p where p.user_id = v_uid), '[]'),
    'reports',   coalesce((select jsonb_agg(jsonb_build_object('type', r.type, 'target_id', r.target_id, 'reason', r.reason, 'note', r.note,
                                  'status', r.status, 'created_at', r.created_at) order by r.created_at desc)
                           from public.reports r where r.reporter_id = v_uid), '[]'));
end $$;

-- =====================================================================================================
-- 4. Nội dung 🔒 (trừ pv_list_posts)
-- =====================================================================================================
create or replace function public.pv_review_save(p_kind text, p_target text, p_stars int, p_love boolean, p_tags text[], p_body text, p_photos text[])
returns json language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(true); v_uh text := public.pv_user_hash(v_uid); v_id uuid; v_name text;
begin
  if p_kind is null or p_kind not in ('place','site') or p_target is null or char_length(p_target) not between 1 and 40
     or coalesce(p_stars,0) not between 0 and 5 then raise exception 'PV_INVALID'; end if;
  if char_length(coalesce(p_body,'')) > 800 or cardinality(coalesce(p_tags,'{}')) > 10 or cardinality(coalesce(p_photos,'{}')) > 4 then
    raise exception 'PV_TOO_LONG'; end if;
  if public.pv_is_bad(p_body) or public.pv_is_bad(array_to_string(p_tags, ' ')) then raise exception 'PV_BAD_WORDS'; end if;
  if not public.pv_photos_ok(p_photos) then raise exception 'PV_INVALID'; end if;
  perform public.pv_rate_user(v_uh);
  select display_name into v_name from public.profiles where id = v_uid;
  insert into public.reviews (kind, target, author, stars, love, tags, body, photos, edit_hash, ip_hash, device_hash, user_id)
  values (p_kind, p_target, v_name, coalesce(p_stars,0), coalesce(p_love,false), coalesce(p_tags,'{}'), coalesce(p_body,''),
          coalesce(p_photos,'{}'), v_uh, public.pv_client_hash(), v_uh, v_uid)
  on conflict (kind, target, edit_hash) do update
    set author = excluded.author, stars = excluded.stars, love = excluded.love, tags = excluded.tags, body = excluded.body,
        photos = excluded.photos, ip_hash = excluded.ip_hash, user_id = excluded.user_id, updated_at = now()
  returning id into v_id;
  insert into public.review_photos (url, review_id) select u, v_id from unnest(coalesce(p_photos,'{}')) u on conflict (url) do nothing;
  delete from public.review_photos rp where rp.review_id = v_id and not (rp.url = any (coalesce(p_photos,'{}')));
  return public.pv_review_json(v_id);
end $$;

create or replace function public.pv_review_delete(p_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false);
begin
  if not exists (select 1 from public.reviews where id = p_id) then raise exception 'PV_NOT_FOUND'; end if;
  delete from public.reviews where id = p_id and user_id = v_uid;
  if not found then raise exception 'PV_NOT_OWNER'; end if;
  return true;
end $$;

create or replace function public.pv_post_save(p_id uuid, p_title text, p_body text, p_photos text[], p_place text)
returns json language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(true); v_uh text := public.pv_user_hash(v_uid); v_id uuid; v_title text := btrim(p_title);
begin
  if v_title is null or char_length(v_title) = 0 or (p_place is not null and char_length(p_place) not between 1 and 40) then
    raise exception 'PV_INVALID'; end if;
  if char_length(v_title) > 120 or char_length(coalesce(p_body,'')) > 4000 or cardinality(coalesce(p_photos,'{}')) > 6 then
    raise exception 'PV_TOO_LONG'; end if;
  if public.pv_is_bad(v_title) or public.pv_is_bad(p_body) then raise exception 'PV_BAD_WORDS'; end if;
  if not public.pv_photos_ok(p_photos) then raise exception 'PV_INVALID'; end if;
  if p_id is not null then
    if not exists (select 1 from public.posts where id = p_id) then raise exception 'PV_NOT_FOUND'; end if;
    if not exists (select 1 from public.posts where id = p_id and user_id = v_uid) then raise exception 'PV_NOT_OWNER'; end if;
  end if;
  perform public.pv_rate_user(v_uh);
  if p_id is null then
    insert into public.posts (user_id, place, title, body, photos)
    values (v_uid, p_place, v_title, coalesce(p_body,''), coalesce(p_photos,'{}')) returning id into v_id;
  else
    update public.posts set place = p_place, title = v_title, body = coalesce(p_body,''), photos = coalesce(p_photos,'{}'), updated_at = now()
     where id = p_id returning id into v_id;
  end if;
  insert into public.review_photos (url, post_id) select u, v_id from unnest(coalesce(p_photos,'{}')) u on conflict (url) do nothing;
  delete from public.review_photos rp where rp.post_id = v_id and not (rp.url = any (coalesce(p_photos,'{}')));
  return public.pv_post_json(v_id);
end $$;

create or replace function public.pv_post_delete(p_id uuid)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false);
begin
  if not exists (select 1 from public.posts where id = p_id) then raise exception 'PV_NOT_FOUND'; end if;
  delete from public.posts where id = p_id and user_id = v_uid;
  if not found then raise exception 'PV_NOT_OWNER'; end if;
  return true;
end $$;

create or replace function public.pv_list_posts(p_place text default null, p_limit int default 10, p_before timestamptz default null)
returns table (id uuid, author_name text, author_avatar text, place text, title text, body text, photos text[],
               created_at timestamptz, updated_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.id, pr.display_name, pr.avatar_url, p.place, p.title, p.body, public.pv_approved(p.photos), p.created_at, p.updated_at
  from public.posts p left join public.profiles pr on pr.id = p.user_id
  where not p.hidden and (p_place is null or p.place = p_place) and p.created_at < coalesce(p_before, 'infinity'::timestamptz)
  order by p.created_at desc
  limit least(greatest(coalesce(p_limit,10),1),30);
$$;

create or replace function public.pv_my_content()
returns table (type text, id uuid, kind text, target text, title text, body text, stars smallint, photos text[],
               status text, hidden_reason text, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false);
begin
  return query
  select x.* from (
    select 'review'::text as t, r.id as i, r.kind as k, r.target as tg, null::text as ti, r.body as b, r.stars as s, r.photos as ph,
           public.pv_status(r.hidden, r.photos) as st, r.hidden_reason as hr, r.created_at as ca, r.updated_at as ua
    from public.reviews r where r.user_id = v_uid
    union all
    select 'post'::text, p.id, null::text, p.place, p.title, p.body, null::smallint, p.photos,
           public.pv_status(p.hidden, p.photos), p.hidden_reason, p.created_at, p.updated_at
    from public.posts p where p.user_id = v_uid
  ) x order by x.ua desc;
end $$;

-- =====================================================================================================
-- 5. Báo cáo
-- =====================================================================================================
create or replace function public.pv_report(p_type text, p_id uuid, p_reason text, p_note text default '')
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false); n integer;
begin
  if p_type not in ('review','post') or p_reason not in ('abuse','spam','false_info','bad_photo','other') then raise exception 'PV_INVALID'; end if;
  if char_length(coalesce(p_note,'')) > 300 then raise exception 'PV_TOO_LONG'; end if;
  if (p_type = 'review' and not exists (select 1 from public.reviews where id = p_id))
     or (p_type = 'post' and not exists (select 1 from public.posts where id = p_id)) then raise exception 'PV_NOT_FOUND'; end if;
  insert into public.reports (type, target_id, reporter_id, reporter_hash, reason, note)
  values (p_type, p_id, v_uid, public.pv_user_hash(v_uid), p_reason, coalesce(p_note,''))
  on conflict (type, target_id, reporter_hash) do nothing;
  select count(*) into n from public.reports where type = p_type and target_id = p_id and status = 'open';
  if p_type = 'review' then
    update public.reviews set reports = n, hidden = hidden or n >= 3,
           hidden_reason = case when not hidden and n >= 3 then 'Tự ẩn: 3 lượt báo cáo' else hidden_reason end where id = p_id;
  else
    update public.posts set reports = n, hidden = hidden or n >= 3,
           hidden_reason = case when not hidden and n >= 3 then 'Tự ẩn: 3 lượt báo cáo' else hidden_reason end where id = p_id;
  end if;
  return true;
end $$;

-- hàm cũ của web chưa đăng nhập: giữ nguyên tên + tham số, ghi thêm vào reports
create or replace function public.pv_report_review(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare n int; v_rep text := public.pv_client_hash();
begin
  if not exists (select 1 from public.reviews where id = p_id) then return; end if;
  insert into public.review_reports (review_id, reporter) values (p_id, v_rep) on conflict do nothing;
  insert into public.reports (type, target_id, reporter_hash, reason) values ('review', p_id, v_rep, 'other')
  on conflict (type, target_id, reporter_hash) do nothing;
  select count(*) into n from public.review_reports where review_id = p_id;
  update public.reviews set reports = n, hidden = hidden or n >= 3,
         hidden_reason = case when not hidden and n >= 3 then 'Tự ẩn: 3 lượt báo cáo' else hidden_reason end where id = p_id;
end $$;

-- =====================================================================================================
-- 6. Admin 👑
-- =====================================================================================================
create or replace function public.pv_admin_reports(p_status text default 'open')
returns table (id uuid, type text, target_id uuid, reason text, note text, reporter_name text, created_at timestamptz,
               content json, report_count bigint)
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.pv_require_admin();
  return query
  select rp.id, rp.type, rp.target_id, rp.reason, rp.note,
         coalesce(pr.display_name, 'Khách (chưa đăng nhập)'), rp.created_at,
         case when rp.type = 'review' then (select json_build_object('kind', r.kind, 'target', r.target, 'author', r.author, 'stars', r.stars,
                    'body', r.body, 'photos', r.photos, 'hidden', r.hidden, 'hidden_reason', r.hidden_reason, 'user_id', r.user_id)
                    from public.reviews r where r.id = rp.target_id)
              else (select json_build_object('place', p.place, 'title', p.title, 'body', p.body, 'photos', p.photos, 'hidden', p.hidden,
                    'hidden_reason', p.hidden_reason, 'author', a.display_name, 'user_id', p.user_id)
                    from public.posts p left join public.profiles a on a.id = p.user_id where p.id = rp.target_id) end,
         (select count(*) from public.reports x where x.type = rp.type and x.target_id = rp.target_id and x.status = 'open')
  from public.reports rp left join public.profiles pr on pr.id = rp.reporter_id
  where rp.status = coalesce(p_status, 'open')
  order by rp.created_at desc limit 200;
end $$;

create or replace function public.pv_admin_moderate(p_type text, p_id uuid, p_action text, p_reason text default null)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_admin uuid := public.pv_require_admin(); v_reason text := nullif(btrim(coalesce(p_reason,'')), '');
begin
  if p_type not in ('review','post') or p_action not in ('hide','delete','restore','dismiss') then raise exception 'PV_INVALID'; end if;
  if p_type = 'review' then
    if not exists (select 1 from public.reviews where id = p_id) and p_action <> 'dismiss' then raise exception 'PV_NOT_FOUND'; end if;
    if p_action = 'hide' then
      update public.reviews set hidden = true, hidden_reason = coalesce(v_reason, 'Vi phạm quy định cộng đồng') where id = p_id;
    elsif p_action = 'delete' then
      delete from public.reviews where id = p_id;
    else -- restore / dismiss: hiện lại, xóa lượt báo cáo
      update public.reviews set hidden = false, hidden_reason = null, reports = 0 where id = p_id;
      delete from public.review_reports where review_id = p_id;
    end if;
  else
    if not exists (select 1 from public.posts where id = p_id) and p_action <> 'dismiss' then raise exception 'PV_NOT_FOUND'; end if;
    if p_action = 'hide' then
      update public.posts set hidden = true, hidden_reason = coalesce(v_reason, 'Vi phạm quy định cộng đồng') where id = p_id;
    elsif p_action = 'delete' then
      delete from public.posts where id = p_id;
    else
      update public.posts set hidden = false, hidden_reason = null, reports = 0 where id = p_id;
    end if;
  end if;
  update public.reports set status = case when p_action = 'dismiss' then 'dismissed' else 'resolved' end,
         resolved_by = v_admin, resolved_at = now()
   where type = p_type and target_id = p_id and status = 'open';
  insert into public.mod_log (admin_id, action, target_type, target_id, reason) values (v_admin, p_action, p_type, p_id::text, v_reason);
  return true;
end $$;

create or replace function public.pv_admin_pending_photos()
returns table (id uuid, url text, review_id uuid, post_id uuid, author_name text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.pv_require_admin();
  return query
  select rp.id, rp.url, rp.review_id, rp.post_id, coalesce(r.author, a.display_name), rp.uploaded_at
  from public.review_photos rp
  left join public.reviews r on r.id = rp.review_id
  left join public.posts p on p.id = rp.post_id
  left join public.profiles a on a.id = p.user_id
  where not rp.approved order by rp.uploaded_at limit 200;
end $$;

create or replace function public.pv_admin_photo(p_id uuid, p_approve boolean)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_admin uuid := public.pv_require_admin(); v public.review_photos;
begin
  select * into v from public.review_photos where id = p_id;
  if not found then raise exception 'PV_NOT_FOUND'; end if;
  if p_approve then
    update public.review_photos set approved = true, approved_at = now() where id = p_id;
  else
    -- bỏ ảnh khỏi đánh giá / bài viết (file vẫn nằm trong Storage, xóa tay nếu cần)
    update public.reviews set photos = array_remove(photos, v.url) where id = v.review_id;
    update public.posts   set photos = array_remove(photos, v.url) where id = v.post_id;
    delete from public.review_photos where id = p_id;
  end if;
  insert into public.mod_log (admin_id, action, target_type, target_id, reason)
  values (v_admin, case when p_approve then 'photo_approve' else 'photo_reject' end, 'photo', v.url, null);
  return true;
end $$;

create or replace function public.pv_admin_users(p_query text default null)
returns table (id uuid, display_name text, email text, avatar_url text, role text, banned boolean, created_at timestamptz, review_count bigint)
language plpgsql security definer set search_path = ''
as $$
declare q text := nullif(btrim(coalesce(p_query,'')), '');
begin
  perform public.pv_require_admin();
  return query
  select p.id, p.display_name, u.email::text, p.avatar_url, p.role, p.banned, p.created_at,
         (select count(*) from public.reviews r where r.user_id = p.id)
  from public.profiles p join auth.users u on u.id = p.id
  where q is null or p.display_name ilike '%' || q || '%' or u.email ilike '%' || q || '%'
  order by p.created_at desc limit 50;
end $$;

create or replace function public.pv_admin_set_ban(p_user uuid, p_banned boolean)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_admin uuid := public.pv_require_admin();
begin
  if not exists (select 1 from public.profiles where id = p_user) then raise exception 'PV_NOT_FOUND'; end if;
  if exists (select 1 from public.profiles where id = p_user and role = 'admin') then raise exception 'PV_FORBIDDEN'; end if;
  update public.profiles set banned = coalesce(p_banned, false), updated_at = now() where id = p_user;
  insert into public.mod_log (admin_id, action, target_type, target_id) values (v_admin, case when p_banned then 'ban' else 'unban' end, 'user', p_user::text);
  return true;
end $$;

create or replace function public.pv_admin_log(p_limit int default 50)
returns table (id bigint, admin_name text, action text, target_type text, target_id text, reason text, created_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
begin
  perform public.pv_require_admin();
  return query
  select l.id, coalesce(p.display_name, '(đã xóa)'), l.action, l.target_type, l.target_id, l.reason, l.created_at
  from public.mod_log l left join public.profiles p on p.id = l.admin_id
  order by l.created_at desc limit least(greatest(coalesce(p_limit,50),1),500);
end $$;

-- =====================================================================================================
-- 7. Kho ảnh đại diện: công khai để xem, mỗi người chỉ ghi vào thư mục {uid}/ của mình, ≤ 512 KB
-- =====================================================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 524288, array['image/webp','image/png','image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 524288, allowed_mime_types = array['image/webp','image/png','image/jpeg'];

drop policy if exists "avatars: owner read"   on storage.objects;
drop policy if exists "avatars: owner insert" on storage.objects;
drop policy if exists "avatars: owner update" on storage.objects;
drop policy if exists "avatars: owner delete" on storage.objects;
create policy "avatars: owner read" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- =====================================================================================================
-- 8. Quyền gọi hàm
-- =====================================================================================================
do $$
declare f text;
begin
  -- hàm phụ: không ai gọi được qua API
  foreach f in array array[
    'pv_user_hash(uuid)', 'pv_valid_avatar(text)', 'pv_photos_ok(text[])', 'pv_default_name(jsonb)', 'pv_default_avatar(jsonb)',
    'pv_status(boolean,text[])', 'pv_approved(text[])', 'pv_on_new_user()', 'pv_require_user(boolean)', 'pv_require_admin()',
    'pv_rate_user(text)', 'pv_review_json(uuid)', 'pv_post_json(uuid)'] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', f);
  end loop;
  -- cần đăng nhập (hàm tự kiểm tra lại auth.uid() và quyền admin)
  foreach f in array array[
    'pv_me()', 'pv_update_profile(text,text,text)', 'pv_claim_reviews(text)', 'pv_get_user_data()', 'pv_save_user_data(jsonb)',
    'pv_export_my_data()', 'pv_review_save(text,text,integer,boolean,text[],text,text[])', 'pv_review_delete(uuid)',
    'pv_post_save(uuid,text,text,text[],text)', 'pv_post_delete(uuid)', 'pv_my_content()', 'pv_report(text,uuid,text,text)',
    'pv_admin_reports(text)', 'pv_admin_moderate(text,uuid,text,text)', 'pv_admin_pending_photos()', 'pv_admin_photo(uuid,boolean)',
    'pv_admin_users(text)', 'pv_admin_set_ban(uuid,boolean)', 'pv_admin_log(integer)'] loop
    execute format('revoke all on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
  -- ai cũng gọi được
  revoke all on function public.pv_list_posts(text,integer,timestamptz) from public;
  grant execute on function public.pv_list_posts(text,integer,timestamptz) to anon, authenticated;
  revoke all on function public.pv_report_review(uuid) from public;
  grant execute on function public.pv_report_review(uuid) to anon, authenticated;
end $$;

-- =====================================================================================================
-- Gán quyền admin (chạy tay sau khi người đó đã đăng nhập web ít nhất 1 lần):
--   update public.profiles set role = 'admin' where id = (select id from auth.users where email = '<email>');
-- =====================================================================================================
