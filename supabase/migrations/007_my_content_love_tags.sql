-- 007 · pv_my_content() trả thêm love + tags (yêu cầu 1 trong docs/data-requests.md)
-- Đổi kiểu kết quả nên phải drop rồi tạo lại; chỉ giao diện v3-ui dùng hàm này (main chưa dùng).
begin;
drop function if exists public.pv_my_content();
create function public.pv_my_content()
returns table (type text, id uuid, kind text, target text, title text, body text, stars smallint, love boolean, tags text[],
               photos text[], status text, hidden_reason text, created_at timestamptz, updated_at timestamptz)
language plpgsql security definer set search_path = ''
as $$
declare v_uid uuid := public.pv_require_user(false);
begin
  return query
  select x.* from (
    select 'review'::text as t, r.id as i, r.kind as k, r.target as tg, null::text as ti, r.body as b, r.stars as s,
           r.love as lv, r.tags as tgs, r.photos as ph,
           public.pv_status(r.hidden, r.photos) as st, r.hidden_reason as hr, r.created_at as ca, r.updated_at as ua
    from public.reviews r where r.user_id = v_uid
    union all
    select 'post'::text, p.id, null::text, p.place, p.title, p.body, null::smallint, null::boolean, null::text[], p.photos,
           public.pv_status(p.hidden, p.photos), p.hidden_reason, p.created_at, p.updated_at
    from public.posts p where p.user_id = v_uid
  ) x order by x.ua desc;
end $$;
revoke all on function public.pv_my_content() from public, anon;
grant execute on function public.pv_my_content() to authenticated;
commit;
