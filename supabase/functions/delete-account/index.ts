// Edge Function: delete-account
// Người dùng tự xóa tài khoản của mình: xóa ảnh đại diện trong kho `avatars`, rồi xóa tài khoản auth.
// Hồ sơ, dữ liệu cá nhân, đánh giá, bài viết bị xóa theo (on delete cascade – migration 005).
// Khóa service_role do Supabase tự cấp cho Edge Function (biến SUPABASE_SERVICE_ROLE_KEY), không nằm trong code web.
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ORIGINS = ["https://personavel.github.io"];

function cors(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow = ORIGINS.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ? origin : ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const json = (req: Request, status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors(req), "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(req) });
  if (req.method !== "POST") return json(req, 405, { ok: false, error: "PV_INVALID" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return json(req, 401, { ok: false, error: "PV_AUTH" });

  // xác định người gọi bằng chính phiên đăng nhập của họ
  const asUser = createClient(url, anon, { global: { headers: { Authorization: auth } } });
  const { data: { user }, error } = await asUser.auth.getUser();
  if (error || !user) return json(req, 401, { ok: false, error: "PV_AUTH" });

  const admin = createClient(url, service, { auth: { persistSession: false } });

  // xóa mọi file trong avatars/{uid}/
  const { data: files } = await admin.storage.from("avatars").list(user.id, { limit: 100 });
  if (files && files.length) {
    await admin.storage.from("avatars").remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
  if (delErr) return json(req, 500, { ok: false, error: "PV_DELETE_FAILED" });
  return json(req, 200, { ok: true });
});
