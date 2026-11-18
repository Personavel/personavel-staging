-- 002 · Moderation: offensive words, posting rate limit, one report per person
-- Applied on top of 001_reviews.sql.

alter table public.reviews add column if not exists ip_hash text;
create index if not exists reviews_ip_recent_idx on public.reviews (ip_hash, updated_at desc);

-- hash of the caller's IP (from the API gateway headers) – used only for rate limits, never shown
create or replace function public.pv_client_hash()
returns text language sql stable set search_path = ''
as $$
  select encode(extensions.digest(coalesce(split_part((current_setting('request.headers', true))::json->>'x-forwarded-for', ',', 1), 'local'), 'sha256'), 'hex');
$$;

-- true when the text contains an offensive word, matched as whole words:
--   with tones (cặc ≠ các, lồn ≠ lớn, buồi ≠ buổi, đéo ≠ đeo) and, for unambiguous words, without tones + English
create or replace function public.pv_is_bad(p text)
returns boolean language sql immutable set search_path = ''
as $$
  select (' ' || regexp_replace(lower(normalize(coalesce(p,''), NFC)), '[^[:alnum:]]+', ' ', 'g') || ' ') ~ ' (địt|đụ|đụ má|đéo|cặc|lồn|buồi|óc chó|đồ ngu|thằng ngu|con ngu|mất dạy|khốn nạn|chó chết|con đĩ|đĩ) '
      or (' ' || regexp_replace(regexp_replace(translate(lower(normalize(coalesce(p,''), NFC)), 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ', 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd'), '[^a-z0-9]+', ' ', 'g'), '(.)\1{2,}', '\1', 'g') || ' ')
         ~ ' (dit me|dit cu|dmm|dcm|dkm|vcl|vkl|oc cho|do ngu|thang ngu|con ngu|ngu nhu bo|ngu nhu cho|mat day|khon nan|cho chet|do khon|fuck|fucking|fucker|motherfucker|shit|bitch|cunt|asshole|dickhead|bastard|slut|whore|retard|stfu|nigger|nigga|faggot) ';
$$;

create or replace function public.pv_upsert_review(p_token text, p_kind text, p_target text, p_author text,
  p_stars int, p_love boolean, p_tags text[], p_body text, p_photos text[])
returns uuid language plpgsql security definer set search_path = ''
as $$
declare v_id uuid; v_hash text; v_ip text := public.pv_client_hash();
begin
  if p_token is null or char_length(p_token) < 32 then raise exception 'bad token'; end if;
  if public.pv_is_bad(p_body) or public.pv_is_bad(p_author) or public.pv_is_bad(array_to_string(p_tags, ' ')) then
    raise exception 'inappropriate content';
  end if;
  if exists (select 1 from unnest(coalesce(p_photos,'{}')) u where u not like '%/storage/v1/object/public/review-photos/%') then
    raise exception 'photos must be uploaded to review-photos';
  end if;
  v_hash := encode(extensions.digest(p_token, 'sha256'), 'hex');
  -- rate limits: 5 posts per hour per network, 20 s between two posts of the same person
  if (select count(*) from public.reviews r where r.ip_hash = v_ip and r.updated_at > now() - interval '1 hour') >= 5
     or exists (select 1 from public.reviews r where r.edit_hash = v_hash and r.updated_at > now() - interval '20 seconds') then
    raise exception 'rate limit';
  end if;
  insert into public.reviews (kind, target, author, stars, love, tags, body, photos, edit_hash, ip_hash)
  values (p_kind, p_target, btrim(p_author), coalesce(p_stars,0), coalesce(p_love,false), coalesce(p_tags,'{}'), coalesce(p_body,''), coalesce(p_photos,'{}'), v_hash, v_ip)
  on conflict (kind, target, edit_hash) do update
    set author = excluded.author, stars = excluded.stars, love = excluded.love, tags = excluded.tags,
        body = excluded.body, photos = excluded.photos, ip_hash = excluded.ip_hash, updated_at = now()
  returning id into v_id;
  return v_id;
end $$;

-- one report per person (network) per review; 3 different reporters hide the review until a team member checks it
create table if not exists public.review_reports (
  review_id   uuid not null references public.reviews(id) on delete cascade,
  reporter    text not null,
  created_at  timestamptz not null default now(),
  primary key (review_id, reporter)
);
alter table public.review_reports enable row level security;
revoke all on public.review_reports from anon, authenticated;

create or replace function public.pv_report_review(p_id uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare n int;
begin
  insert into public.review_reports (review_id, reporter) values (p_id, public.pv_client_hash()) on conflict do nothing;
  select count(*) into n from public.review_reports where review_id = p_id;
  update public.reviews set reports = n, hidden = hidden or n >= 3 where id = p_id;
end $$;

revoke all on function public.pv_client_hash(), public.pv_is_bad(text) from public, anon, authenticated;
revoke all on function public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[]), public.pv_report_review(uuid) from public;
grant execute on function public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[]), public.pv_report_review(uuid) to anon, authenticated;
