-- 004 · Fairer rate limits (per network + per device) and photo approval
--   • 20 posts / hour per network (IP) – a whole class on one wifi can still post
--   • 5 posts / hour and 20 s between posts per device (random id kept in the browser; old clients: per review token)
--   • new photos are hidden from everyone except their author until a team member approves them
-- Compatible with the site on `main`: same function names and parameter names; new parameters have defaults.

create table if not exists public.pv_post_log (
  at          timestamptz not null default now(),
  ip_hash     text not null,
  device_hash text not null
);
create index if not exists pv_post_log_ip_idx  on public.pv_post_log (ip_hash, at desc);
create index if not exists pv_post_log_dev_idx on public.pv_post_log (device_hash, at desc);
alter table public.pv_post_log enable row level security;
revoke all on public.pv_post_log from anon, authenticated;

alter table public.reviews add column if not exists device_hash text;

create table if not exists public.review_photos (
  url          text primary key,
  review_id    uuid not null references public.reviews(id) on delete cascade,
  approved     boolean not null default false,
  uploaded_at  timestamptz not null default now(),
  approved_at  timestamptz
);
create index if not exists review_photos_pending_idx on public.review_photos (uploaded_at desc) where not approved;
alter table public.review_photos enable row level security;
revoke all on public.review_photos from anon, authenticated;
-- photos that were already public stay public
insert into public.review_photos (url, review_id, approved, approved_at)
select u, r.id, true, now() from public.reviews r, unnest(r.photos) u on conflict (url) do nothing;

-- ---------- write ----------
drop function if exists public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[]);
create or replace function public.pv_upsert_review(p_token text, p_kind text, p_target text, p_author text,
  p_stars int, p_love boolean, p_tags text[], p_body text, p_photos text[], p_device text default null)
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_hash text; v_ip text := public.pv_client_hash(); v_dev text;
begin
  if p_token is null or char_length(p_token) < 32 then raise exception 'bad token'; end if;
  if public.pv_is_bad(p_body) or public.pv_is_bad(p_author) or public.pv_is_bad(array_to_string(p_tags, ' ')) then
    raise exception 'inappropriate content';
  end if;
  if exists (select 1 from unnest(coalesce(p_photos,'{}')) u where u not like '%/storage/v1/object/public/review-photos/%') then
    raise exception 'photos must be uploaded to review-photos';
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  v_dev  := case when p_device ~ '^[0-9a-f]{32,64}$' then encode(extensions.digest(p_device, 'sha256'), 'hex') else v_hash end;
  if exists (select 1 from public.pv_post_log l where l.device_hash = v_dev and l.at > now() - interval '20 seconds')
     or (select count(*) from public.pv_post_log l where l.device_hash = v_dev and l.at > now() - interval '1 hour') >= 5
     or (select count(*) from public.pv_post_log l where l.ip_hash = v_ip and l.at > now() - interval '1 hour') >= 20 then
    raise exception 'rate limit';
  end if;
  insert into public.reviews (kind, target, author, stars, love, tags, body, photos, edit_hash, ip_hash, device_hash)
  values (p_kind, p_target, btrim(p_author), coalesce(p_stars,0), coalesce(p_love,false), coalesce(p_tags,'{}'), coalesce(p_body,''), coalesce(p_photos,'{}'), v_hash, v_ip, v_dev)
  on conflict (kind, target, edit_hash) do update
    set author = excluded.author, stars = excluded.stars, love = excluded.love, tags = excluded.tags, body = excluded.body,
        photos = excluded.photos, ip_hash = excluded.ip_hash, device_hash = excluded.device_hash, updated_at = now()
  returning id into v_id;
  insert into public.review_photos (url, review_id) select u, v_id from unnest(coalesce(p_photos,'{}')) u on conflict (url) do nothing;
  delete from public.review_photos rp where rp.review_id = v_id and not (rp.url = any (coalesce(p_photos,'{}')));
  insert into public.pv_post_log (ip_hash, device_hash) values (v_ip, v_dev);
  delete from public.pv_post_log where at < now() - interval '2 days';
  return v_id;
end $$;

-- ---------- read ----------
-- old list (used by the site on main): approved photos only
create or replace function public.pv_list_reviews(p_kind text, p_target text)
returns table (id uuid, author text, stars smallint, love boolean, tags text[], body text, photos text[], updated_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select r.id, r.author, r.stars, r.love, r.tags, r.body,
         array(select u from unnest(r.photos) u where exists (select 1 from public.review_photos rp where rp.url = u and rp.approved)),
         r.updated_at
  from public.reviews r
  where r.kind = p_kind and r.target = p_target and not r.hidden
  order by r.updated_at desc limit 60;
$$;

-- paged list: approved photos for everyone; the author (p_token) also sees their own photos waiting for approval
drop function if exists public.pv_list_reviews_page(text,text,int,int);
create or replace function public.pv_list_reviews_page(p_kind text, p_target text, p_limit int default 10, p_offset int default 0, p_token text default null)
returns table (id uuid, author text, stars smallint, love boolean, tags text[], body text, photos text[], pending text[], mine boolean,
               updated_at timestamptz, total bigint, avg_stars numeric, loves bigint)
language sql stable security definer set search_path = ''
as $$
  with me as (select case when char_length(coalesce(p_token,'')) >= 32 then encode(extensions.digest(p_token, 'sha256'), 'hex') end as h),
       v as (select * from public.reviews r where r.kind = p_kind and r.target = p_target and not r.hidden),
       s as (select count(*) as total, round(avg(nullif(stars,0))::numeric, 2) as avg_stars, count(*) filter (where love) as loves from v)
  select v.id, v.author, v.stars, v.love, v.tags, v.body,
         array(select u from unnest(v.photos) u where exists (select 1 from public.review_photos rp where rp.url = u and rp.approved)),
         case when v.edit_hash = me.h then array(select u from unnest(v.photos) u where not exists (select 1 from public.review_photos rp where rp.url = u and rp.approved)) else '{}'::text[] end,
         (v.edit_hash = me.h) is true,
         v.updated_at, s.total, s.avg_stars, s.loves
  from v, s, me order by v.updated_at desc
  limit least(greatest(coalesce(p_limit,10),1),30) offset greatest(coalesce(p_offset,0),0);
$$;

-- ---------- team: approve photos (run in the SQL editor; not callable from the site) ----------
create or replace function public.pv_approve_photo(p_url text, p_ok boolean default true)
returns void language sql security definer set search_path = ''
as $$
  update public.review_photos set approved = p_ok, approved_at = case when p_ok then now() end where url = p_url;
$$;

revoke all on function public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[],text), public.pv_list_reviews(text,text),
  public.pv_list_reviews_page(text,text,int,int,text), public.pv_approve_photo(text,boolean) from public;
grant execute on function public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[],text), public.pv_list_reviews(text,text),
  public.pv_list_reviews_page(text,text,int,int,text) to anon, authenticated;
revoke all on function public.pv_approve_photo(text,boolean) from anon, authenticated;
