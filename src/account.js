/* ===== Personavel – login box, #reset-password, #account, avatar and name from pv_me() ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const C = PV.cloud;
const here = () => location.origin + location.pathname;   // = https://personavel.github.io/ on the live site (also works for a test copy in a sub-folder)
const busy = (b, on, txt) => { if (!b) return; if (on){ b._t = b.innerHTML; b.disabled = true; b.innerHTML = '⏳ ' + (txt || T_('Đang xử lý…', 'Working…')); } else { b.disabled = false; if (b._t) b.innerHTML = b._t; } };
const msg = (box, text, ok) => { const el = $('.au-msg', box); if (!el) return; el.className = 'au-msg ' + (ok ? 'ok' : 'err'); el.textContent = text || ''; el.hidden = !text; };
const WHERE = () => T_(' Không thấy thư? Xem cả mục Spam/Quảng cáo, và “Đã gửi”/“Tất cả thư” nếu bạn dùng chính địa chỉ Gmail gửi thư của Personavel.', ' No email? Check Spam/Promotions, and “Sent”/“All mail” if it is the same Gmail address that sends Personavel’s emails.');
/* confirmation email again (sign-up not finished, or "email not confirmed" at sign-in) */
const resendBtn = (box, email) => { const el = $('.au-msg', box); if (!el || el.querySelector('.au-resend')) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'linkbtn small au-resend'; b.textContent = '✉️ ' + T_('Gửi lại email xác nhận', 'Resend the confirmation email');
  b.onclick = async () => { b.disabled = true;
    try { const sb = await PV.sb(); const {error} = await sb.auth.resend({type: 'signup', email, options: {emailRedirectTo: here()}}); if (error) throw error;
      msg(box, T_(`Đã gửi lại email xác nhận tới ${email}.`, `Confirmation email sent again to ${email}.`) + WHERE(), true); }
    catch(e){ msg(box, PV.authErr(e)); } finally { setTimeout(() => resendBtn(box, email), 0); } };
  el.appendChild(document.createElement('br')); el.appendChild(b); };
const GOOGLE = `<svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;

/* ---------- login / sign-up box ---------- */
PV.authModal = (opt = {}) => {
  let mode = opt.mode || 'in';
  PV.modal(`<div class="au" id="au">
      <button type="button" class="bm-x" data-close aria-label="${T_('Đóng', 'Close')}">✕</button>
      <h3 id="auT">${T_('Đăng nhập Personavel', 'Sign in to Personavel')}</h3>
      ${opt.why ? `<p class="small muted au-why">${esc(opt.why)}</p>` : `<p class="small muted au-why">${T_('Đăng nhập để lưu dữ liệu lên tài khoản, dùng trên nhiều máy, đăng ảnh và viết bài. Không đăng nhập bạn vẫn dùng đầy đủ bản đồ, lịch trình, chatbot.', 'Sign in to keep your data in your account, use it on several devices, post photos and write posts. Without an account you can still use the map, itineraries and the chatbot.')}</p>`}
      <button type="button" class="btn au-google" id="auG">${GOOGLE}<span>${T_('Tiếp tục với Google', 'Continue with Google')}</span></button>
      <div class="au-or"><span>${T_('hoặc dùng email', 'or use email')}</span></div>
      <div class="au-tabs" role="tablist"><button type="button" role="tab" data-m="in">${T_('Đăng nhập', 'Sign in')}</button><button type="button" role="tab" data-m="up">${T_('Đăng ký', 'Sign up')}</button></div>
      <form id="auF" novalidate>
        <label class="small au-name">${T_('Tên hiển thị', 'Display name')}<input class="input" id="auN" maxlength="40" autocomplete="nickname" value="${esc((state.profile && state.profile.name) || '')}"></label>
        <label class="small">Email<input class="input" id="auE" type="email" autocomplete="email" inputmode="email" required></label>
        <label class="small">${T_('Mật khẩu', 'Password')}<input class="input" id="auP" type="password" minlength="8" autocomplete="current-password" required></label>
        <div class="au-msg" role="alert" hidden></div>
        <button class="btn au-go" id="auGo" type="submit"></button>
        <button type="button" class="linkbtn small au-forgot" id="auFg">${T_('Quên mật khẩu?', 'Forgot your password?')}</button>
      </form>
    </div>`, (bg, close) => {
    bg.classList.add('au-bg');
    const box = $('#au', bg);
    const setMode = (m) => { mode = m;
      $$('[data-m]', box).forEach(b => { b.setAttribute('aria-selected', String(b.dataset.m === m)); b.classList.toggle('on', b.dataset.m === m); });
      $('.au-name', box).hidden = m !== 'up'; $('#auP', box).autocomplete = m === 'up' ? 'new-password' : 'current-password';
      $('#auGo', box).textContent = m === 'up' ? T_('Tạo tài khoản', 'Create account') : T_('Đăng nhập', 'Sign in');
      $('#auT', box).textContent = m === 'up' ? T_('Tạo tài khoản Personavel', 'Create a Personavel account') : T_('Đăng nhập Personavel', 'Sign in to Personavel');
      $('#auFg', box).hidden = m === 'up'; msg(box, ''); };
    $$('[data-m]', box).forEach(b => b.onclick = () => setMode(b.dataset.m));
    setMode(mode);
    $('#auG', box).onclick = async () => { const b = $('#auG', box); busy(b, true, T_('Đang mở Google…', 'Opening Google…'));
      try { const sb = await PV.sb(); const {error} = await sb.auth.signInWithOAuth({provider: 'google', options: {redirectTo: here()}}); if (error) throw error; }
      catch(e){ busy(b, false); msg(box, PV.authErr(e)); } };
    $('#auFg', box).onclick = async () => {
      const email = $('#auE', box).value.trim(); if (!/^\S+@\S+\.\S+$/.test(email)){ msg(box, T_('Nhập email của bạn ở ô trên rồi bấm lại “Quên mật khẩu?”.', 'Type your email above, then tap “Forgot your password?” again.')); $('#auE', box).focus(); return; }
      const b = $('#auFg', box); b.disabled = true;
      try { const sb = await PV.sb(); const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: here() + '#reset-password'}); if (error) throw error;
        msg(box, T_(`Đã gửi email đặt lại mật khẩu tới ${email}. Mở thư và bấm vào liên kết.`, `We sent a reset link to ${email}. Open it and follow the link.`) + WHERE(), true); }
      catch(e){ msg(box, PV.authErr(e)); } finally { b.disabled = false; } };
    $('#auF', box).onsubmit = async (e) => { e.preventDefault();
      const email = $('#auE', box).value.trim(), pw = $('#auP', box).value, name = $('#auN', box).value.trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) return msg(box, T_('Địa chỉ email chưa đúng.', 'That email address is not valid.'));
      if (pw.length < (mode === 'up' ? 8 : 1)) return msg(box, T_('Mật khẩu cần ít nhất 8 ký tự.', 'The password needs at least 8 characters.'));
      if (mode === 'up' && PV.badText && PV.badText(name)) return msg(box, PV.errText('PV_BAD_WORDS'));
      const b = $('#auGo', box); busy(b, true);
      try { const sb = await PV.sb();
        if (mode === 'up'){
          const {data, error} = await sb.auth.signUp({email, password: pw, options: {emailRedirectTo: here(), data: {full_name: name || undefined}}}); if (error) throw error;
          // the email already has a confirmed account: Supabase answers OK without sending anything (identities = [])
          if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0){
            busy(b, false); setMode('in'); $('#auE', box).value = email; $('#auP', box).value = '';
            msg(box, T_('Email này đã có tài khoản. Bạn đăng nhập bằng mật khẩu, hoặc bấm “Quên mật khẩu?” nếu chưa nhớ (tài khoản tạo bằng Google thì bấm “Tiếp tục với Google”).', 'This email already has an account. Sign in with your password, or tap “Forgot your password?” (accounts made with Google: use “Continue with Google”).'));
            $('#auP', box).focus(); return; }
          if (!data.session){ msg(box, T_(`Gần xong! Mở hộp thư ${email} và bấm vào liên kết xác nhận, rồi quay lại đăng nhập.`, `Almost done! Open ${email} and click the confirmation link, then come back and sign in.`) + WHERE(), true); resendBtn(box, email); busy(b, false); return; }
        } else { const {error} = await sb.auth.signInWithPassword({email, password: pw}); if (error) throw error; }
        close(); PV.toast(T_('Đăng nhập thành công 👋', 'Signed in 👋'));
      } catch(err){ busy(b, false); msg(box, PV.authErr(err));
        if (String(err && (err.code || '')) === 'email_not_confirmed' || /not confirmed/i.test(String(err && err.message))) resendBtn(box, email); }
    };
  });
};

/* ---------- #reset-password ---------- */
PV.views['reset-password'] = async (m) => {
  m.innerHTML = `<h1 class="title">${T_('Đặt lại mật khẩu', 'Reset your password')}</h1><div class="card acc-card" id="rpBox"><p class="small muted">⏳ ${T_('Đang kiểm tra liên kết…', 'Checking the link…')}</p></div>`;
  const s = await PV.session(); const box = $('#rpBox', m); if (!box) return;
  if (!s){ box.innerHTML = `<p>${T_('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 'This reset link is invalid or has expired.')}</p><button class="btn" id="rpAgain">${T_('Gửi lại email', 'Send the email again')}</button>`;
    $('#rpAgain', box).onclick = () => PV.authModal({mode: 'in', why: T_('Nhập email rồi bấm “Quên mật khẩu?” để nhận liên kết mới.', 'Type your email and tap “Forgot your password?” to get a new link.')}); return; }
  box.innerHTML = `<form id="rpF" novalidate><p class="small">${T_('Tài khoản', 'Account')}: <b>${esc(s.user.email || '')}</b></p>
      <label class="small">${T_('Mật khẩu mới', 'New password')}<input class="input" id="rp1" type="password" minlength="8" autocomplete="new-password" required></label>
      <label class="small">${T_('Nhập lại mật khẩu mới', 'Repeat the new password')}<input class="input" id="rp2" type="password" minlength="8" autocomplete="new-password" required></label>
      <div class="au-msg" role="alert" hidden></div><button class="btn" id="rpGo" type="submit">${T_('Lưu mật khẩu mới', 'Save new password')}</button></form>`;
  $('#rpF', box).onsubmit = async (e) => { e.preventDefault();
    const a = $('#rp1', box).value, b2 = $('#rp2', box).value;
    if (a.length < 8) return msg(box, T_('Mật khẩu cần ít nhất 8 ký tự.', 'The password needs at least 8 characters.'));
    if (a !== b2) return msg(box, T_('Hai mật khẩu chưa giống nhau.', 'The two passwords do not match.'));
    const btn = $('#rpGo', box); busy(btn, true);
    try { const sb = await PV.sb(); const {error} = await sb.auth.updateUser({password: a}); if (error) throw error;
      PV.toast(T_('Đã đổi mật khẩu ✅', 'Password changed ✅')); location.hash = '#account'; }
    catch(err){ busy(btn, false); msg(box, PV.authErr(err)); } };
};

/* ---------- avatar: shrink to ≤ 512 px WebP in the browser, upload to avatars/{uid}/avatar.webp ---------- */
const toWebp = (file) => new Promise((res, rej) => {
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => { URL.revokeObjectURL(url); const k = Math.min(1, 512 / Math.max(img.width, img.height)); const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k)); c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    const tryQ = (q) => c.toBlob(b => { if (!b) return rej(new Error('PV_INVALID')); if (b.size > 500 * 1024 && q > .4) return tryQ(q - .15); res(b); }, 'image/webp', q);
    tryQ(.85); };
  img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('PV_INVALID')); };
  img.src = url;
});
async function uploadAvatar(file){
  const sb = await PV.sb(); const uid = C.user.id; const blob = await toWebp(file);
  const path = `${uid}/avatar.webp`;
  const {error} = await sb.storage.from('avatars').upload(path, blob, {upsert: true, contentType: blob.type || 'image/webp', cacheControl: '3600'});
  if (error) throw Object.assign(new Error('upload'), {userMsg: /size|large/i.test(error.message || '') ? T_('Ảnh quá lớn.', 'The photo is too large.') : PV.errText(/fetch|network/i.test(error.message || '') ? 'PV_NET' : 'PV_UNKNOWN')});
  const pub = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl;
  C.me = await PV.rpc('pv_update_profile', {p_display_name: null, p_avatar_url: pub + '?v=' + Date.now(), p_lang: null});
}

/* ---------- #account ---------- */
const providers = (u) => { const p = (u && u.app_metadata && u.app_metadata.providers) || []; return p.length ? p : ((u && u.identities) || []).map(i => i.provider); };
PV.views.account = async (m) => {
  if (!C.user){
    const s = await PV.session();
    if (!s){ m.innerHTML = `<h1 class="title">${T_('Tài khoản', 'Account')}</h1><div class="card acc-card"><p>${T_('Bạn chưa đăng nhập. Đăng nhập để quản lý tài khoản, đồng bộ dữ liệu giữa các máy, đăng ảnh và viết bài.', 'You are not signed in. Sign in to manage your account, sync your data across devices, post photos and write posts.')}</p>
      <button class="btn" id="accIn">☁️ ${T_('Đăng nhập / Đăng ký', 'Sign in / Sign up')}</button></div>`; $('#accIn', m).onclick = () => PV.authModal(); return; }
  }
  if (!C.me && !C._meTried){ C._meTried = true; await PV.refreshMe(); }
  const u = C.user || {}, me = C.me || {};
  const prov = providers(u), google = prov.includes('google'), hasPw = prov.includes('email');
  const av = PV.cloudAvatar();
  m.innerHTML = `<h1 class="title">${T_('Tài khoản', 'Account')}</h1><p class="sub">${T_('Quản lý hồ sơ, đăng nhập và dữ liệu của bạn trên Personavel.', 'Manage your profile, sign-in and data on Personavel.')}</p>
  <div class="acc-grid">
    <section class="card acc-card"><h3>👤 ${T_('Hồ sơ', 'Profile')}</h3>
      <div class="row" style="gap:14px;align-items:center"><div class="avatar acc-av" id="accAv">${av ? `<img src="${esc(av)}" alt="">` : esc((PV.cloudName()[0] || 'D').toUpperCase())}</div>
        <div><label class="btn ghost sm acc-up"><input type="file" accept="image/*" id="accFile" hidden>📷 ${T_('Đổi ảnh đại diện', 'Change photo')}</label>${me.avatar_url ? `<button class="linkbtn tiny" id="accAvDel">${T_('Bỏ ảnh', 'Remove photo')}</button>` : ''}
        <div class="tiny muted" style="margin-top:4px">${T_('Ảnh được thu nhỏ còn tối đa 512 px trước khi tải lên.', 'Photos are shrunk to 512 px before upload.')}</div></div></div>
      <label class="small" style="display:block;margin-top:12px">${T_('Tên hiển thị', 'Display name')}<input class="input" id="accName" maxlength="40" value="${esc(me.display_name || '')}"></label>
      <label class="small" style="display:block;margin-top:8px">${T_('Ngôn ngữ', 'Language')}<select class="input" id="accLang"><option value="vi"${(me.lang || PV.lang) === 'vi' ? ' selected' : ''}>Tiếng Việt</option><option value="en"${(me.lang || PV.lang) === 'en' ? ' selected' : ''}>English</option></select></label>
      <div class="au-msg" role="alert" hidden></div><button class="btn sm" id="accSave" style="margin-top:10px">${T_('Lưu hồ sơ', 'Save profile')}</button></section>
    <section class="card acc-card"><h3>✉️ ${T_('Email và mật khẩu', 'Email and password')}</h3>
      <p class="small">${T_('Email hiện tại', 'Current email')}: <b>${esc(u.email || '—')}</b>${google ? ` <span class="tag">Google</span>` : ''}</p>
      <form id="accEm" novalidate><label class="small">${T_('Đổi sang email mới', 'Change to a new email')}<input class="input" id="accEmail" type="email" autocomplete="email"></label><div class="au-msg" role="alert" hidden></div><button class="btn ghost sm" type="submit">${T_('Đổi email', 'Change email')}</button></form>
      <hr class="acc-hr">
      ${!hasPw && google ? `<p class="small muted">🔑 ${T_('Tài khoản này đăng nhập bằng Google nên không có mật khẩu riêng. Bạn có thể đặt mật khẩu dưới đây để đăng nhập thêm bằng email.', 'This account signs in with Google, so it has no password of its own. You can set one below to also sign in with email.')}</p>` : ''}
      <form id="accPw" novalidate><label class="small">${hasPw ? T_('Mật khẩu mới', 'New password') : T_('Đặt mật khẩu', 'Set a password')}<input class="input" id="accPw1" type="password" minlength="8" autocomplete="new-password"></label>
        <label class="small">${T_('Nhập lại', 'Repeat')}<input class="input" id="accPw2" type="password" minlength="8" autocomplete="new-password"></label><div class="au-msg" role="alert" hidden></div>
        <button class="btn ghost sm" type="submit">${hasPw ? T_('Đổi mật khẩu', 'Change password') : T_('Đặt mật khẩu', 'Set password')}</button></form></section>
    <section class="card acc-card"><h3>💾 ${T_('Dữ liệu của bạn', 'Your data')}</h3>
      <p class="small">${T_('Nhật ký, lịch trình, địa điểm đã ghé, yêu thích, huy hiệu và điểm được đồng bộ tự động với tài khoản.', 'Your diary, itinerary, visited places, favourites, badges and points sync with your account automatically.')}</p>
      <p class="tiny muted" id="accSync">${C.syncError ? '⚠️ ' + esc(C.syncError) : C.lastSync ? '✅ ' + T_('Đồng bộ lúc ', 'Synced at ') + new Date(C.lastSync).toLocaleTimeString(PV.lang === 'en' ? 'en-GB' : 'vi-VN') : ''}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost sm" id="accSyncNow">🔄 ${T_('Đồng bộ ngay', 'Sync now')}</button><button class="btn ghost sm" id="accExport">⬇️ ${T_('Xuất dữ liệu (JSON)', 'Export data (JSON)')}</button>${me.role === 'admin' ? `<a class="btn ghost sm" href="#admin">🛡️ ${T_('Trang quản trị', 'Admin')}</a>` : ''}</div></section>
    <section class="card acc-card acc-danger"><h3>🚪 ${T_('Đăng xuất và xóa tài khoản', 'Sign out and delete')}</h3>
      <p class="small">${T_('Đăng xuất vẫn giữ dữ liệu trên máy này. Xóa tài khoản sẽ xóa vĩnh viễn hồ sơ, dữ liệu đồng bộ, đánh giá và bài viết của bạn trên máy chủ.', 'Signing out keeps your data on this device. Deleting your account permanently removes your profile, synced data, reviews and posts from the server.')}</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn" id="accOut">${T_('Đăng xuất', 'Sign out')}</button><button class="btn ghost sm acc-del" id="accDel">🗑️ ${T_('Xóa tài khoản', 'Delete account')}</button></div></section>
  </div>`;
  const box1 = m.querySelector('.acc-card');
  $('#accFile', m).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const lb = e.target.closest('label'); lb.classList.add('busy');
    try { await uploadAvatar(f); applyHeader(); PV.toast(T_('Đã đổi ảnh đại diện', 'Photo updated')); PV.views.account(m); }
    catch(err){ msg(box1, err.userMsg || PV.errText(err.code)); } finally { lb.classList.remove('busy'); } };
  const avDel = $('#accAvDel', m); if (avDel) avDel.onclick = async () => { try { C.me = await PV.rpc('pv_update_profile', {p_display_name: null, p_avatar_url: '', p_lang: null}); if (state.profile){ state.profile.avatar = null; PV.save('profile'); } applyHeader(); PV.views.account(m); } catch(err){ msg(box1, err.userMsg); } };
  $('#accSave', m).onclick = async () => { const b = $('#accSave', m); const name = $('#accName', m).value.trim(), lang = $('#accLang', m).value;
    if (!name) return msg(box1, T_('Tên hiển thị không được để trống.', 'The display name cannot be empty.'));
    busy(b, true);
    try { C.me = await PV.rpc('pv_update_profile', {p_display_name: name, p_avatar_url: null, p_lang: lang});
      if (state.profile){ state.profile.name = C.me.display_name; PV.save('profile'); }
      if (lang !== PV.lang) PV.setLang(lang);
      applyHeader(); msg(box1, T_('Đã lưu hồ sơ ✅', 'Profile saved ✅'), true); }
    catch(err){ msg(box1, err.userMsg); } finally { busy(b, false); } };
  $('#accEm', m).onsubmit = async (e) => { e.preventDefault(); const f = e.target; const email = $('#accEmail', m).value.trim();
    if (!/^\S+@\S+\.\S+$/.test(email)) return msg(f, T_('Địa chỉ email chưa đúng.', 'That email address is not valid.'));
    try { const sb = await PV.sb(); const {error} = await sb.auth.updateUser({email}, {emailRedirectTo: here() + '#account'}); if (error) throw error;
      msg(f, T_(`Đã gửi thư xác nhận. Kiểm tra hộp thư ${email} (và cả email cũ nếu có) để xác nhận đổi email.`, `Confirmation sent. Check the inbox of ${email} (and your old email, if asked) to confirm the change.`), true); }
    catch(err){ msg(f, PV.authErr(err)); } };
  $('#accPw', m).onsubmit = async (e) => { e.preventDefault(); const f = e.target; const a = $('#accPw1', m).value, b2 = $('#accPw2', m).value;
    if (a.length < 8) return msg(f, T_('Mật khẩu cần ít nhất 8 ký tự.', 'The password needs at least 8 characters.'));
    if (a !== b2) return msg(f, T_('Hai mật khẩu chưa giống nhau.', 'The two passwords do not match.'));
    try { const sb = await PV.sb(); const {error} = await sb.auth.updateUser({password: a}); if (error) throw error; f.reset(); msg(f, T_('Đã lưu mật khẩu ✅', 'Password saved ✅'), true); }
    catch(err){ msg(f, PV.authErr(err)); } };
  $('#accSyncNow', m).onclick = async () => { const b = $('#accSyncNow', m); busy(b, true); await PV.syncNow(); busy(b, false);
    const el = $('#accSync', m); if (el) el.textContent = C.syncError ? '⚠️ ' + C.syncError : '✅ ' + T_('Đã đồng bộ', 'Synced'); };
  $('#accExport', m).onclick = async () => { const b = $('#accExport', m); busy(b, true);
    try { const data = await PV.rpc('pv_export_my_data'); const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'}));
      const a = document.createElement('a'); a.href = url; a.download = 'personavel-du-lieu.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
    catch(err){ PV.toast(err.userMsg || PV.errText('PV_UNKNOWN')); } finally { busy(b, false); } };
  $('#accOut', m).onclick = async () => { await PV.cloudSignOut(); PV.toast(T_('Đã đăng xuất khỏi tài khoản – dữ liệu vẫn còn trên máy này', 'Signed out – your data stays on this device')); location.hash = '#profile'; };
  $('#accDel', m).onclick = () => deleteModal();
};
function deleteModal(){
  PV.modal(`<h3>🗑️ ${T_('Xóa tài khoản vĩnh viễn?', 'Delete your account permanently?')}</h3>
    <p class="small">${T_('Hồ sơ, dữ liệu đồng bộ, đánh giá, bài viết và ảnh đại diện của bạn trên máy chủ sẽ bị xóa và <b>không khôi phục được</b>. Bạn nên bấm “Xuất dữ liệu” trước.', 'Your profile, synced data, reviews, posts and photo on the server will be deleted and <b>cannot be recovered</b>. Consider exporting your data first.')}</p>
    <label class="small">${T_('Gõ chữ <b>XÓA</b> để xác nhận', 'Type <b>XÓA</b> to confirm')}<input class="input" id="delTxt" autocomplete="off" autocapitalize="characters"></label>
    <div class="au-msg" role="alert" hidden></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-close>${T_('Hủy', 'Cancel')}</button><button class="btn acc-del-go" id="delGo" disabled>${T_('Xóa tài khoản', 'Delete account')}</button></div>`, (bg, close) => {
    const inp = $('#delTxt', bg), go = $('#delGo', bg), box = bg.querySelector('.modal');
    const ok = () => inp.value.normalize('NFC').trim().toUpperCase() === 'XÓA'.normalize('NFC');
    inp.oninput = () => { go.disabled = !ok(); };
    go.onclick = async () => { if (!ok()) return; busy(go, true, T_('Đang xóa…', 'Deleting…'));
      try { const s = await PV.session(); if (!s) throw Object.assign(new Error('auth'), {userMsg: PV.errText('PV_AUTH')});
        const r = await fetch(`${PV.CLOUD.url}/functions/v1/delete-account`, {method: 'POST', headers: {Authorization: 'Bearer ' + s.access_token, apikey: PV.CLOUD.key, 'content-type': 'application/json'}, body: '{}'});
        let j = {}; try { j = await r.json(); } catch(e){}
        if (!r.ok || !j.ok) throw Object.assign(new Error('del'), {userMsg: r.status === 401 ? PV.errText('PV_AUTH') : r.status === 404 ? PV.errText('PV_MISSING') : PV.errText('PV_UNKNOWN')});
        const uid = C.user && C.user.id; close();
        try { const sb = await PV.sb(); await sb.auth.signOut({scope: 'local'}); } catch(e){}
        PV.cloud.user = null; PV.cloud.me = null; if (uid) PV.store.del('claimed_' + uid);
        PV.toast(T_('Tài khoản đã được xóa.', 'Your account has been deleted.'));
        PV.logout(false);
      } catch(err){ busy(go, false); msg(box, err.userMsg || PV.errText('PV_NET')); } };
  });
}

/* ---------- header (side bar, bottom bar) and profile page show the account ---------- */
function applyHeader(){
  if (PV.drawSideUser) PV.drawSideUser();
  const tab = $('#bottom a[data-k="profile"]'); if (!tab) return;
  const av = C.user ? PV.cloudAvatar() : '';
  let el = tab.querySelector('.tab-av');
  if (C.user){
    if (!el){ el = document.createElement('span'); el.className = 'tab-av'; el.setAttribute('aria-hidden', 'true'); tab.prepend(el); }
    el.innerHTML = av ? `<img src="${esc(av)}" alt="">` : esc((PV.cloudName()[0] || 'D').toUpperCase());
    tab.classList.add('has-av');
  } else if (el){ el.remove(); tab.classList.remove('has-av'); }
}
const _side = PV.drawSideUser;
PV.drawSideUser = () => {
  _side();
  const el = $('#sideuser'); if (!el || !C.user) return;
  const av = PV.cloudAvatar(), nm = PV.cloudName();
  el.innerHTML = `<a class="avatar" href="#account" style="width:36px;height:36px;font-size:15px;border-width:2px" title="${T_('Tài khoản', 'Account')}">${av ? `<img src="${esc(av)}" alt="">` : esc((nm[0] || 'D').toUpperCase())}</a>
    <div style="min-width:0;flex:1"><b class="small" style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(nm)}</b><a class="linkbtn tiny" href="#account">☁️ ${T_('Tài khoản', 'Account')}</a>${C.me && C.me.role === 'admin' ? ` · <a class="linkbtn tiny" href="#admin">🛡️ Admin</a>` : ''}</div>`;
};
PV.onCloud(() => applyHeader());
const _profile = PV.views.profile;
PV.views.profile = (m, ...a) => {
  const r = _profile(m, ...a);
  const head = m.querySelector('.grid.g2 > .card');
  if (head && !m.querySelector('#accCard')){
    const nm = m.querySelector('.pname > span'); if (nm && C.user) nm.textContent = PV.cloudName();
    const av = m.querySelector('#av'); const src = C.user && PV.cloudAvatar(); if (av && src) av.innerHTML = `<img src="${esc(src)}" alt="">`;
    head.insertAdjacentHTML('beforeend', `<div class="acc-strip" id="accCard">${C.user
      ? `<span class="small">☁️ ${T_('Đã đăng nhập', 'Signed in')}: <b>${esc((C.user.email) || PV.cloudName())}</b></span><span class="spacer"></span><a class="btn ghost sm" href="#account">${T_('Quản lý tài khoản', 'Manage account')}</a>${C.me && C.me.role === 'admin' ? `<a class="btn ghost sm" href="#admin">🛡️ ${T_('Quản trị', 'Admin')}</a>` : ''}`
      : `<span class="small">☁️ ${T_('Đăng nhập để đồng bộ dữ liệu giữa các máy, đăng ảnh và viết bài.', 'Sign in to sync across devices, post photos and write posts.')}</span><span class="spacer"></span><button class="btn sm" id="accLogin">${T_('Đăng nhập', 'Sign in')}</button>`}</div>`);
    const b = $('#accLogin', m); if (b) b.onclick = () => PV.authModal();
  }
  return r;
};
// welcome screen (drawn by app4.js, loaded later): "already have an account?"
new MutationObserver(() => { const ov = document.getElementById('welcome');
  if (ov && !C.user && !(state.profile && state.profile.onboarded) && !ov.querySelector('#wLogin')){   /* only for brand-new visitors */
    ov.insertAdjacentHTML('beforeend', `<button type="button" class="btn ghost sm w-login" id="wLogin">☁️ ${T_('Đã có tài khoản? Đăng nhập', 'Have an account? Sign in')}</button>`);
    ov.querySelector('#wLogin').onclick = () => PV.authModal(); } }).observe(document.body, {childList: true});
// a re-render after login/logout when the page depends on it
let lastUid = null, lastRole = null;
PV.onCloud(() => { const uid = C.user && C.user.id, role = C.me && C.me.role; if (uid === lastUid && role === lastRole) return; lastUid = uid; lastRole = role;
  const h = (location.hash || '').split('?')[0]; if (/^#(account|admin|profile)$/.test(h)) { clearTimeout(PV._accT); PV._accT = setTimeout(() => PV.route(), 50); } });
})();
