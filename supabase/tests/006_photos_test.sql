-- Thử migration 006 mà KHÔNG lưu gì: dán NGAY SAU nội dung 006_photos_login_only.sql, cả hai nằm sau một dòng `begin;`.
-- Khối DO kết thúc bằng raise exception → cả giao dịch (gồm 006) bị hủy. Kết quả nằm trong "RESULT: ...".
do $$
declare
  a uuid := '33333333-3333-3333-3333-333333333333';
  r text := ''; tok text := repeat('ab', 20);
  ph text := 'https://bwtmunpzdxtutspdpphb.supabase.co/storage/v1/object/public/review-photos/2026-11/test006.webp';
begin
  insert into auth.users (id, email, raw_user_meta_data) values (a, 'test-006@example.com', '{"full_name":"TEST 006"}');
  perform set_config('request.headers', '{"x-forwarded-for":"198.51.100.9"}', true);

  -- khách (anon)
  execute 'set local role anon';
  begin insert into storage.objects (bucket_id, name) values ('review-photos', '2026-11/anon006.webp'); r := r || '1 anon_upload=FAIL | ';
  exception when others then r := r || '1 anon_upload=blocked(' || left(sqlerrm, 40) || ') | '; end;
  begin perform public.pv_upsert_review(tok, 'place', 'test006', 'Khách', 4, false, '{}', 'Không ảnh', '{}'); r := r || '2 anon_review_no_photo=ok | ';
  exception when others then r := r || '2 anon_review_no_photo=FAIL ' || sqlerrm || ' | '; end;
  execute 'reset role'; delete from public.pv_post_log; execute 'set local role anon';
  begin perform public.pv_upsert_review(tok, 'place', 'test006', 'Khách', 4, false, '{}', 'Có ảnh', array[ph]); r := r || '3 anon_review_new_photo=FAIL | ';
  exception when others then r := r || '3 anon_review_new_photo=' || sqlerrm || ' | '; end;

  -- tài khoản đăng nhập
  execute 'reset role'; execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.pv_me();
  begin insert into storage.objects (bucket_id, name, owner_id) values ('review-photos', '2026-11/user006.webp', a::text); r := r || '4 user_upload=ok | ';
  exception when others then r := r || '4 user_upload=FAIL ' || sqlerrm || ' | '; end;

  -- tài khoản bị khóa
  execute 'reset role'; update public.profiles set banned = true where id = a; execute 'set local role authenticated';
  begin insert into storage.objects (bucket_id, name, owner_id) values ('review-photos', '2026-11/banned006.webp', a::text); r := r || '5 banned_upload=FAIL | ';
  exception when others then r := r || '5 banned_upload=blocked(' || left(sqlerrm, 40) || ') | '; end;

  execute 'reset role';
  raise exception 'RESULT: %', r;
end $$;
