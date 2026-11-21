-- 006 · Chỉ người đã đăng nhập mới tải ảnh lên kho review-photos
-- ĐÃ CHẠY ngày 21/11/2026, sau khi web trên `main` tải ảnh bằng phiên đăng nhập (commit 36f2efe).
-- Thử trước: supabase/tests/006_photos_test.sql (tự rollback).
-- Hoàn tác: chạy khối "HOÀN TÁC" ở cuối file.

-- 1. Kho review-photos: bỏ quyền tải lên của khách, chỉ tài khoản đã đăng nhập (và không bị khóa) mới tải lên được
-- (người dùng không đọc được bảng profiles → kiểm tra "bị khóa" qua hàm security definer)
create or replace function public.pv_can_upload()
returns boolean language sql stable security definer set search_path = ''
as $$
  select auth.uid() is not null
     and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.banned);
$$;
revoke all on function public.pv_can_upload() from public, anon;
grant execute on function public.pv_can_upload() to authenticated;

drop policy if exists "review photos: anyone can upload" on storage.objects;
drop policy if exists "review photos: signed-in upload" on storage.objects;
create policy "review photos: signed-in upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'review-photos' and public.pv_can_upload());

-- 2. Đánh giá của khách (hàm cũ pv_upsert_review, khóa anon) không còn gắn được ảnh MỚI.
--    Ảnh cũ đã có trong đánh giá vẫn giữ nguyên khi khách sửa đánh giá của mình.
create or replace function public.pv_guest_photos_ok(p_token text, p_kind text, p_target text, p_photos text[])
returns boolean language sql stable security definer set search_path = ''
as $$
  select not exists (
    select 1 from unnest(coalesce(p_photos,'{}')) u
    where not exists (
      select 1 from public.reviews r
      where r.kind = p_kind and r.target = p_target
        and r.edit_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
        and u = any (r.photos)));
$$;
revoke all on function public.pv_guest_photos_ok(text,text,text,text[]) from public, anon, authenticated;

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
  if not public.pv_guest_photos_ok(p_token, p_kind, p_target, p_photos) then
    raise exception 'PV_AUTH: sign in to add photos';
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
revoke all on function public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[],text) from public;
grant execute on function public.pv_upsert_review(text,text,text,text,int,boolean,text[],text,text[],text) to anon, authenticated;

-- =====================================================================================================
-- HOÀN TÁC (chạy riêng khối này nếu cần mở lại cho khách tải ảnh):
--   drop policy if exists "review photos: signed-in upload" on storage.objects;
--   create policy "review photos: anyone can upload" on storage.objects
--     for insert to anon, authenticated with check (bucket_id = 'review-photos');
--   -- rồi chạy lại phần pv_upsert_review trong 004_rate_device_photo_review.sql
-- =====================================================================================================
