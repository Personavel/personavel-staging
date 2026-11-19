/* ===== Personavel – Supabase account layer: client, RPC with readable errors, login state, sync =====
   Contract: docs/data-contract.md. The site keeps working without an account (and without these functions):
   a function that does not exist yet (PGRST202 / HTTP 404) hides its feature and is logged once with console.info.
   supabase-js v2 (src/vendor/supabase-js-2.119.1.js) is loaded only when needed: an existing session,
   a login redirect (?code=…) or the visitor opening the login box. */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const BASE = PV.CLOUD.url, KEY = PV.CLOUD.key;
const REF = (BASE.match(/https:\/\/([a-z0-9]+)\./) || [])[1];
const SKEY = `sb-${REF}-auth-token`;
const C = PV.cloud = {user: null, me: null, synced: false, missing: new Set(), listeners: []};
PV.onCloud = (fn) => { C.listeners.push(fn); };
const emit = () => { document.body && document.body.classList.toggle('pv-in', !!C.user); C.listeners.forEach(fn => { try { fn(C); } catch(e){ console.info('[cloud]', e); } }); };

/* ---------- readable errors ---------- */
const MSG = {
  PV_AUTH: ['Bạn cần đăng nhập để làm việc này.', 'Please sign in to do this.'],
  PV_BANNED: ['Tài khoản của bạn tạm bị khóa đăng bài.', 'Your account is temporarily blocked from posting.'],
  PV_RATE_LIMIT: ['Bạn gửi hơi nhanh, thử lại sau ít phút nhé.', 'You are posting a bit fast – try again in a few minutes.'],
  PV_BAD_WORDS: ['Nội dung có từ ngữ không phù hợp. Bạn sửa lại giúp mình nhé.', 'The text contains inappropriate words. Please edit it.'],
  PV_NOT_OWNER: ['Đây không phải nội dung của bạn.', 'This is not your content.'],
  PV_NOT_FOUND: ['Nội dung này không còn tồn tại.', 'This item no longer exists.'],
  PV_TOO_LONG: ['Nội dung quá dài hoặc quá nhiều ảnh.', 'Too long, or too many photos.'],
  PV_INVALID: ['Thông tin chưa hợp lệ, bạn kiểm tra lại nhé.', 'Something is not valid – please check and try again.'],
  PV_FORBIDDEN: ['Bạn không có quyền làm việc này.', 'You are not allowed to do this.'],
  PV_MISSING: ['Tính năng này chưa sẵn sàng trên máy chủ.', 'This feature is not available on the server yet.'],
  PV_NET: ['Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 'Cannot reach the server. Check your connection and try again.'],
  PV_UNKNOWN: ['Có lỗi xảy ra, bạn thử lại sau nhé.', 'Something went wrong – please try again later.']
};
PV.errText = (code) => T_(...(MSG[code] || MSG.PV_UNKNOWN));
const mkErr = (code, raw) => { const e = new Error(code); e.code = code; e.raw = raw; e.userMsg = PV.errText(code); return e; };
const toCode = (error, status) => {
  const m = String((error && (error.message || error.error)) || '');
  const pv = m.match(/PV_[A-Z_]+/); if (pv) return MSG[pv[0]] ? pv[0] : (pv[0] === 'PV_DELETE_FAILED' ? 'PV_UNKNOWN' : pv[0]);
  if (status === 401 || (error && error.code === '42501') || /jwt expired|invalid jwt|not authenticated/i.test(m)) return 'PV_AUTH';
  if ((error && error.code === 'PGRST202') || status === 404) return 'PV_MISSING';
  if (!status || /failed to fetch|networkerror|load failed|network/i.test(m)) return 'PV_NET';
  return 'PV_UNKNOWN';
};
let expiredShown = false;
const handle = (fn, code, raw) => {
  if (code === 'PV_MISSING' && !C.missing.has(fn)){ C.missing.add(fn); console.info(`[Personavel] Hàm ${fn} chưa có trên máy chủ – tạm ẩn tính năng này.`); emit(); }
  if (code === 'PV_AUTH' && C.user){   // we thought we were signed in: the session has expired
    sessionExpired();
  }
  return mkErr(code, raw);
};
const sessionExpired = async () => {
  try { const r = sb && await sb.auth.refreshSession(); if (r && r.data && r.data.session) return; } catch(e){}
  if (expiredShown) return; expiredShown = true;
  try { sb && await sb.auth.signOut({scope: 'local'}); } catch(e){}
  setUser(null);
  PV.toast(T_('Phiên đăng nhập đã hết – bạn đăng nhập lại nhé.', 'Your session has expired – please sign in again.'));
};
PV.missing = (fn) => C.missing.has(fn);

/* ---------- supabase-js (lazy) ---------- */
let sb = null, libP = null, sbP = null;
const loadLib = () => {
  if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
  const src = window.PV_SUPABASE; if (!src) return Promise.reject(mkErr('PV_NET'));
  return libP = libP || new Promise((ok, fail) => { const s = document.createElement('script'); s.src = src; s.async = true;
    s.onload = () => ok(window.supabase); s.onerror = () => { libP = null; fail(mkErr('PV_NET')); }; document.head.appendChild(s); });
};
PV.sb = () => sbP = sbP || loadLib().then(lib => {
  sb = lib.createClient(BASE, KEY, {auth: {flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true}});
  sb.auth.onAuthStateChange((ev, session) => setTimeout(() => onAuth(ev, session), 0));   // never call supabase inside the callback itself
  return sb;
}).catch(e => { sbP = null; throw e; });
const hasSession = () => { try { return !!localStorage.getItem(SKEY); } catch(e){ return false; } };
const redirected = () => /[?&](code|error_description|error)=/.test(location.search) || /access_token=|error_description=/.test(location.hash);

/* ---------- RPC ---------- */
PV.rpc = async (fn, args = {}) => {
  if (C.missing.has(fn)) throw mkErr('PV_MISSING');
  if (sb || hasSession()){
    let client; try { client = sb || await PV.sb(); } catch(e){ client = null; }
    if (client){
      let res; try { res = await client.rpc(fn, args); } catch(e){ throw handle(fn, 'PV_NET', e); }
      if (res.error) throw handle(fn, toCode(res.error, res.status), res.error);
      return res.data;
    }
  }
  let r; try { r = await fetch(`${BASE}/rest/v1/rpc/${fn}`, {method: 'POST', headers: {apikey: KEY, Authorization: 'Bearer ' + KEY, 'content-type': 'application/json'}, body: JSON.stringify(args)}); }
  catch(e){ throw handle(fn, 'PV_NET', e); }
  let body = null; try { body = await r.json(); } catch(e){}
  if (!r.ok) throw handle(fn, toCode(body || {}, r.status), body);
  return body;
};
PV.session = async () => { if (!sb && !hasSession()) return null; try { const c = await PV.sb(); const {data} = await c.auth.getSession(); return data.session; } catch(e){ return null; } };

/* ---------- auth errors ---------- */
PV.authErr = (error) => {
  const c = String((error && (error.code || error.error_code)) || ''), m = String((error && error.message) || '');
  const pick = (vi, en) => T_(vi, en);
  if (c === 'invalid_credentials' || /invalid login credentials/i.test(m)) return pick('Email hoặc mật khẩu chưa đúng.', 'Wrong email or password.');
  if (c === 'email_not_confirmed' || /email not confirmed/i.test(m)) return pick('Email chưa được xác nhận. Mở hộp thư và bấm vào liên kết xác nhận trước nhé.', 'Your email is not confirmed yet. Open your inbox and click the confirmation link first.');
  if (/rate_limit|over_email_send_rate_limit|over_request_rate_limit|too many/i.test(c + ' ' + m) || (error && error.status === 429)) return pick('Bạn thử quá nhiều lần. Đợi vài phút rồi thử lại nhé.', 'Too many attempts. Please wait a few minutes and try again.');
  if (c === 'session_expired' || c === 'refresh_token_not_found' || c === 'bad_jwt' || /expired|refresh token/i.test(m)) return pick('Phiên đăng nhập đã hết hoặc liên kết đã hết hạn. Bạn đăng nhập (hoặc gửi lại email) nhé.', 'Your session or link has expired. Please sign in again (or resend the email).');
  if (c === 'user_already_exists' || c === 'email_exists' || /already registered/i.test(m)) return pick('Email này đã có tài khoản. Bạn chọn “Đăng nhập” nhé.', 'This email already has an account. Choose “Sign in”.');
  if (c === 'weak_password' || /password should be|weak password/i.test(m)) return pick('Mật khẩu quá yếu – dùng ít nhất 8 ký tự, có chữ và số.', 'Password too weak – use at least 8 characters with letters and numbers.');
  if (c === 'same_password') return pick('Mật khẩu mới phải khác mật khẩu cũ.', 'The new password must be different.');
  if (c === 'email_address_invalid' || /invalid.*email|email.*invalid/i.test(m)) return pick('Địa chỉ email chưa đúng.', 'That email address is not valid.');
  if (c === 'signup_disabled') return pick('Hiện chưa mở đăng ký bằng email.', 'Email sign-up is not open right now.');
  if (/failed to fetch|network/i.test(m)) return PV.errText('PV_NET');
  return pick('Chưa đăng nhập được, bạn thử lại nhé.', 'Could not sign in – please try again.') + (m ? ` (${m.slice(0, 80)})` : '');
};

/* ---------- login state ---------- */
const setUser = (u) => { C.user = u || null; if (!u){ C.me = null; C.synced = false; } emit(); };
PV.refreshMe = async () => { try { C.me = await PV.rpc('pv_me'); } catch(e){ if (e.code === 'PV_MISSING') C.me = null; } applyMe(); emit(); return C.me; };
const displayName = () => (C.me && C.me.display_name) || (state.profile && state.profile.name) || T_('Du khách', 'Traveller');
PV.cloudName = displayName;
PV.cloudAvatar = () => (C.me && PV.safeImg(C.me.avatar_url)) || (state.profile && PV.safeImg(state.profile.avatar)) || '';
/* the device profile follows the account (name, photo) */
function applyMe(){
  const me = C.me; if (!me) return;
  const today = new Date().toLocaleDateString('vi-VN');
  if (!state.profile || !state.profile.onboarded){
    state.profile = {name: me.display_name || T_('Du khách', 'Traveller'), avatar: me.avatar_url || null, joined: today, onboarded: true, cloudUid: me.id};
    $$('.overlay').forEach(o => { if (!o.classList.contains('modal-bg')) o.remove(); });   // close the welcome / language screens
    state.settings.langChosen = true; PV.save('settings');
  } else {
    state.profile.name = me.display_name || state.profile.name; state.profile.avatar = me.avatar_url || state.profile.avatar; state.profile.cloudUid = me.id;
  }
  PV.save('profile');
  if (me.lang && me.lang !== PV.lang && PV.setLang && !C._langApplied){ C._langApplied = true; PV.setLang(me.lang); }
}
let started = null;
async function onAuth(ev, session){
  if (ev === 'PASSWORD_RECOVERY'){ setUser(session && session.user); location.hash = '#reset-password'; return; }
  if (ev === 'SIGNED_OUT'){ setUser(null); return; }
  if (!session){ if (ev === 'INITIAL_SESSION') setUser(null); return; }
  const fresh = !C.user || C.user.id !== session.user.id;
  C.user = session.user;
  if (ev === 'USER_UPDATED' || ev === 'TOKEN_REFRESHED'){ emit(); return; }
  if (fresh || !started) started = afterLogin();
  if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname + location.hash);
}
async function afterLogin(){
  expiredShown = false;
  await PV.refreshMe();
  if (!C.user) return;
  // reviews written on this device before signing in → the account (once per account and device)
  const flag = 'claimed_' + C.user.id;
  const tok = PV.store.get('cloudToken', null);
  if (tok && !PV.store.get(flag, false)){
    try { const n = await PV.rpc('pv_claim_reviews', {p_token: tok}); PV.store.set(flag, true);
      if (n > 0) PV.toast(T_(`Đã chuyển ${n} đánh giá cũ vào tài khoản của bạn.`, `Moved ${n} earlier review(s) into your account.`)); } catch(e){}
  }
  await PV.syncNow(true);
  emit();
  if (/^#(profile|account|reset-password|admin)/.test(location.hash) || !location.hash || location.hash === '#home') PV.route();
}

/* ---------- personal data sync ---------- */
const SYNC_KEYS = ['diaries', 'trip', 'visited', 'reviews', 'points', 'readStreets', 'listened', 'badgesSeen'];
let stamps = PV.store.get('syncStamps', {}) || {};
const hash = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };
const stamp = (coll, id, obj) => {
  const h = hash(JSON.stringify(obj)); const m = stamps[coll] || (stamps[coll] = {}); const s = m[id];
  if (!s || s[0] !== h) m[id] = [h, Date.now()];
  return new Date(m[id][1]).toISOString();
};
const smallImg = (u) => !u ? null : (/^https:\/\//.test(u) ? u : (String(u).length < 60000 ? u : null));   // keep the 1 MB limit
/* this device's data in the shape stored in the account */
PV.userData = () => {
  const out = {v: 1};
  out.journal = (state.diaries || []).filter(d => d && d.id).map(d => { const o = {...d, img: smallImg(d.img)}; return {...o, updated_at: stamp('journal', d.id, o)}; });
  const t = state.trip || {}; const tr = {...t, id: 'current'}; delete tr.updated_at;
  out.trips = [{...tr, updated_at: stamp('trips', 'current', tr)}];
  const rv = state.reviews || {};
  out.favorites = Object.keys(rv).filter(id => rv[id] && rv[id].fav).map(id => ({id, updated_at: stamp('favorites', id, 1)}));
  out.visited = Object.entries(state.visited || {}).map(([id, date]) => ({id, date, updated_at: stamp('visited', id, date)}));
  const bd = PV.store.get('badgeDates', {}) || {}; const seen = PV.store.get('badgesSeen', []) || [];
  out.badges = [...new Set([...seen, ...Object.keys(bd)])].map(id => ({id, date: bd[id] || null, updated_at: stamp('badges', id, bd[id] || 1)}));
  out.streets = Object.keys(state.readStreets || {}).map(id => ({id, updated_at: stamp('streets', id, 1)}));
  out.points = +state.points || 0; out.listened = +state.listened || 0;
  try { PV.store.set('syncStamps', stamps); } catch(e){}
  return out;
};
const newer = (a, b) => (Date.parse((a && a.updated_at) || 0) || 0) > (Date.parse((b && b.updated_at) || 0) || 0);
/* union of both lists by id; for the same id keep the most recently updated copy */
PV.mergeUserData = (local, remote) => {
  if (!remote) return local;
  const out = {...remote, ...local};
  for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])){
    const a = local[k], b = remote[k];
    if (Array.isArray(a) || Array.isArray(b)){
      const m = new Map(); (b || []).forEach(x => x && x.id != null && m.set(String(x.id), x));
      (a || []).forEach(x => { if (!x || x.id == null) return; const o = m.get(String(x.id)); if (!o || !newer(o, x)) m.set(String(x.id), x); });
      out[k] = [...m.values()];
    } else if (typeof a === 'number' || typeof b === 'number') out[k] = Math.max(+a || 0, +b || 0);
    else out[k] = a !== undefined ? a : b;
  }
  delete out.updated_at; return out;
};
let applying = false;
const applyUserData = (d) => {
  applying = true;
  try {
    const strip = (x) => { const o = {...x}; delete o.updated_at; return o; };
    state.diaries = (d.journal || []).map(strip).sort((a, b) => String(b.id).localeCompare(String(a.id))); PV.save('diaries');
    const tr = (d.trips || []).find(x => x.id === 'current'); if (tr){ const o = strip(tr); delete o.id; if (Array.isArray(o.stops)){ state.trip = o; PV.save('trip'); } }
    const vis = {}; (d.visited || []).forEach(x => { vis[x.id] = x.date || new Date().toLocaleDateString('vi-VN'); }); state.visited = vis; PV.save('visited');
    const rv = state.reviews || (state.reviews = {}); (d.favorites || []).forEach(x => { if (PV.byId(x.id)){ rv[x.id] = {...(rv[x.id] || {stars: 0, text: '', tags: []}), fav: true}; } }); PV.save('reviews');
    const bd = PV.store.get('badgeDates', {}) || {}; (d.badges || []).forEach(x => { if (x.date && !bd[x.id]) bd[x.id] = x.date; });
    PV.store.set('badgeDates', bd); PV.store.set('badgesSeen', [...new Set([...(PV.store.get('badgesSeen', []) || []), ...(d.badges || []).map(x => x.id)])]);
    const rs = {}; (d.streets || []).forEach(x => { rs[x.id] = 1; }); state.readStreets = {...(state.readStreets || {}), ...rs}; PV.save('readStreets');
    state.points = +d.points || 0; PV.save('points'); state.listened = +d.listened || 0; PV.save('listened');
  } finally { applying = false; }
};
let pushT = null, pushing = null;
const push = async () => {
  if (!C.user || !C.synced) return;
  clearTimeout(pushT); pushT = null;
  try { pushing = PV.rpc('pv_save_user_data', {p_data: PV.userData()}); await pushing; C.lastSync = Date.now(); emit(); }
  catch(e){ if (e.code !== 'PV_AUTH') C.syncError = e.userMsg; }
  finally { pushing = null; }
};
PV.syncNow = async (first = false) => {
  if (!C.user) return;
  try {
    const remote = await PV.rpc('pv_get_user_data');
    const merged = PV.mergeUserData(PV.userData(), remote || null);
    applyUserData(merged);
    C.synced = true; C.syncError = null;
    await push();
    if (first && remote) PV.toast(T_('Đã đồng bộ dữ liệu với tài khoản ☁️', 'Your data is synced with your account ☁️'));
  } catch(e){ C.syncError = e.userMsg; if (e.code === 'PV_MISSING') C.synced = false; }
};
const _save = PV.save;
PV.save = (k) => { const r = _save(k); if (!applying && C.user && C.synced && SYNC_KEYS.includes(k)){ clearTimeout(pushT); pushT = setTimeout(push, 3000); } return r; };
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && pushT) push(); });

/* ---------- sign out ---------- */
PV.cloudSignOut = async () => {
  if (pushT) await push();
  try { const c = await PV.sb(); await c.auth.signOut(); } catch(e){ try { localStorage.removeItem(SKEY); } catch(_){} }
  setUser(null);
};
// signing out of the device profile also signs out of the account
const _logout = PV.logout;
PV.logout = async (keep) => { if (C.user){ await PV.cloudSignOut(); } return _logout(keep); };

/* ---------- login gate for posting photos, writing posts and reporting ---------- */
PV.requireLogin = (why) => {
  if (C.user) return true;
  if (PV.authModal) PV.authModal({why}); else PV.toast(PV.errText('PV_AUTH'));
  return false;
};

/* ---------- start ---------- */
// coming back from Google / an email link with an error (?error=…&error_description=…): tell the visitor and clean the address
const backErr = (() => { const q = new URLSearchParams(location.search); const h = new URLSearchParams((location.hash.split('?')[1]) || ''); return q.get('error_description') || q.get('error') ? {code: q.get('error_code') || q.get('error'), desc: q.get('error_description') || ''} : (h.get('error_description') ? {code: h.get('error_code') || h.get('error'), desc: h.get('error_description')} : null); })();
if (backErr){
  history.replaceState(null, '', location.pathname + (location.hash.split('?')[0] || ''));
  const expired = /otp_expired|expired|invalid.*link/i.test(backErr.code + ' ' + backErr.desc);
  const denied = /access_denied/i.test(backErr.code) && !expired;
  const msg = expired ? T_('Liên kết trong email đã hết hạn hoặc đã được dùng. Bạn gửi lại email mới nhé.', 'The email link has expired or was already used. Please request a new one.')
    : denied ? T_('Bạn đã hủy đăng nhập.', 'Sign-in was cancelled.')
    : T_('Đăng nhập chưa thành công do lỗi máy chủ đăng nhập. Bạn thử lại sau, hoặc đăng nhập bằng email.', 'Sign-in failed because of a sign-in server error. Please try again later, or sign in with email.');
  console.info('[Personavel] Lỗi đăng nhập trả về:', backErr.code, backErr.desc);
  setTimeout(() => { PV.toast(msg); if (!denied && PV.authModal) PV.authModal({why: msg}); }, 900);
} else if (hasSession() || redirected()){
  const viaCode = /[?&]code=/.test(location.search);
  PV.sb().then(async (c) => {
    if (!viaCode) return;
    // an email link opened in another browser: the email is confirmed but this browser cannot finish the sign-in (no PKCE verifier)
    await new Promise(r => setTimeout(r, 2500));
    const {data} = await c.auth.getSession();
    if (data && data.session) return;
    history.replaceState(null, '', location.pathname + (location.hash.split('?')[0] || ''));
    const m = T_('Email của bạn đã được xác nhận ✅ Bạn đăng nhập bằng email và mật khẩu nhé.', 'Your email is confirmed ✅ Please sign in with your email and password.');
    PV.toast(m); if (PV.authModal) PV.authModal({why: m});
  }).catch(() => {});
}
})();
