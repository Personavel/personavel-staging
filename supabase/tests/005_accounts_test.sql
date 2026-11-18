-- Kiểm thử migration 005 bằng 2 tài khoản giả. Chạy trong SQL Editor: mọi thứ tự hủy ở cuối
-- (khối DO kết thúc bằng raise exception → toàn bộ giao dịch rollback, không lưu gì).
-- Kết quả hiện trong thông báo lỗi "RESULT: ...". Mỗi mục OK/FAIL.
do $$
declare
  a uuid := '11111111-1111-1111-1111-111111111111';
  b uuid := '22222222-2222-2222-2222-222222222222';
  r text := '';
  j json; n int; rid uuid; pid uuid; e text;
  procedure_ok boolean;
begin
  insert into auth.users (id, email, raw_user_meta_data) values
    (a, 'test-a@example.com', '{"full_name":"TEST An","avatar_url":"https://lh3.googleusercontent.com/a/test"}'),
    (b, 'test-b@example.com', '{"name":"đồ ngu"}');

  -- ===== người dùng A =====
  execute 'set local role authenticated';
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform set_config('request.headers', '{"x-forwarded-for":"203.0.113.7"}', true);

  select row_to_json(p) into j from public.pv_me() p;
  r := r || format('1 me name=%s avatar=%s role=%s | ', j->>'display_name', (j->>'avatar_url') is not null, j->>'role');

  r := r || format('2 update=%s | ', (select display_name || '/' || lang from public.pv_update_profile('TEST An Mới', null, 'en')));
  begin perform public.pv_update_profile('thằng ngu', null, null); r := r || '3 badname=FAIL | ';
  exception when others then r := r || '3 badname=' || sqlerrm || ' | '; end;
  begin perform public.pv_update_profile(null, 'https://evil.example.com/x.png', null); r := r || '4 badavatar=FAIL | ';
  exception when others then r := r || '4 badavatar=' || sqlerrm || ' | '; end;

  perform public.pv_save_user_data('{"journal":[{"id":"j1"}],"points":5}');
  r := r || format('5 userdata points=%s | ', public.pv_get_user_data()->>'points');

  j := public.pv_review_save('place', 'test-place', 5, true, '{}', 'Hay lắm', '{}');
  rid := (j->>'id')::uuid;
  r := r || format('6 review status=%s author=%s | ', j->>'status', j->>'author');

  begin perform public.pv_review_save('place', 'test-place-2', 4, false, '{}', 'Lần 2', '{}'); r := r || '7 rate=FAIL | ';
  exception when others then r := r || '7 rate=' || sqlerrm || ' | '; end;

  begin perform public.pv_post_save(null, 'TEST', 'đồ ngu', '{}', null); r := r || '8 badpost=FAIL | ';
  exception when others then r := r || '8 badpost=' || sqlerrm || ' | '; end;

  begin perform public.pv_review_save('place', 'x', 5, false, '{}', 'ok', array['https://evil.example.com/a.jpg']); r := r || '9 badphoto=FAIL | ';
  exception when others then r := r || '9 badphoto=' || sqlerrm || ' | '; end;

  -- xóa nhật ký gửi để thử tiếp (quyền postgres)
  execute 'reset role'; delete from public.pv_post_log; execute 'set local role authenticated';

  j := public.pv_post_save(null, 'TEST bài viết', 'Nội dung thử', array['https://bwtmunpzdxtutspdpphb.supabase.co/storage/v1/object/public/review-photos/2026-11/test.webp'], 'test-place');
  pid := (j->>'id')::uuid;
  r := r || format('10 post status=%s | ', j->>'status');
  select count(*) into n from public.pv_list_posts('test-place');
  r := r || format('11 list_posts=%s photos_public=%s | ', n, (select cardinality(photos) from public.pv_list_posts('test-place') limit 1));
  select count(*) into n from public.pv_my_content();
  r := r || format('12 my_content=%s | ', n);
  r := r || format('13 export_keys=%s | ', (select string_agg(k, ',') from jsonb_object_keys(public.pv_export_my_data()) k));
  begin perform public.pv_admin_reports('open'); r := r || '14 admin_as_user=FAIL | ';
  exception when others then r := r || '14 admin_as_user=' || sqlerrm || ' | '; end;

  -- ===== người dùng B: báo cáo, không sửa được của A =====
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  r := r || format('15 B name=%s | ', (select display_name from public.pv_me()));
  r := r || format('16 report=%s | ', public.pv_report('review', rid, 'spam', 'thử'));
  begin perform public.pv_review_delete(rid); r := r || '17 B_delete_A=FAIL | ';
  exception when others then r := r || '17 B_delete_A=' || sqlerrm || ' | '; end;
  begin perform public.pv_post_save(pid, 'Sửa trộm', '', '{}', null); r := r || '18 B_edit_A=FAIL | ';
  exception when others then r := r || '18 B_edit_A=' || sqlerrm || ' | '; end;

  -- ===== B thành admin =====
  execute 'reset role'; update public.profiles set role = 'admin' where id = b; execute 'set local role authenticated';
  select count(*) into n from public.pv_admin_reports('open') x where x.target_id = rid;
  r := r || format('19 admin_reports=%s | ', n);
  select count(*) into n from public.pv_admin_pending_photos() x where x.post_id = pid;
  r := r || format('20 pending_photos=%s | ', n);
  perform public.pv_admin_moderate('review', rid, 'hide', 'Thử ẩn');
  perform public.pv_admin_set_ban(a, true);
  select count(*) into n from public.pv_admin_log();
  r := r || format('21 moderated+banned log=%s | ', n);
  select count(*) into n from public.pv_admin_users('TEST');
  r := r || format('22 admin_users=%s | ', n);

  -- ===== A bị khóa =====
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  begin perform public.pv_post_save(null, 'Bị khóa', '', '{}', null); r := r || '23 banned=FAIL | ';
  exception when others then r := r || '23 banned=' || sqlerrm || ' | '; end;
  r := r || format('24 my_review_status=%s', (select x.status || ':' || coalesce(x.hidden_reason,'') from public.pv_my_content() x where x.id = rid));

  execute 'reset role';
  raise exception 'RESULT: %', r;
end $$;
