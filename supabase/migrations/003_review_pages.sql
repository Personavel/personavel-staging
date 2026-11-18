-- 003 · Paged review list (10 per page) with the total count and average rating
create or replace function public.pv_list_reviews_page(p_kind text, p_target text, p_limit int default 10, p_offset int default 0)
returns table (id uuid, author text, stars smallint, love boolean, tags text[], body text, photos text[], updated_at timestamptz, total bigint, avg_stars numeric, loves bigint)
language sql stable security definer set search_path = ''
as $$
  with v as (select * from public.reviews r where r.kind = p_kind and r.target = p_target and not r.hidden),
       s as (select count(*) as total, round(avg(nullif(stars,0))::numeric, 2) as avg_stars, count(*) filter (where love) as loves from v)
  select v.id, v.author, v.stars, v.love, v.tags, v.body, v.photos, v.updated_at, s.total, s.avg_stars, s.loves
  from v, s order by v.updated_at desc
  limit least(greatest(coalesce(p_limit,10),1),30) offset greatest(coalesce(p_offset,0),0);
$$;
revoke all on function public.pv_list_reviews_page(text,text,int,int) from public;
grant execute on function public.pv_list_reviews_page(text,text,int,int) to anon, authenticated;
