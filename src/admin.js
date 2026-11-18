/* ===== Personavel – "⚑ Báo cáo" box (pv_report) and the #admin page (only shown when pv_me().role === 'admin';
   the real permission check is in the database) ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const C = PV.cloud;
const REASONS = () => [['abuse', T_('Xúc phạm, quấy rối', 'Abuse or harassment')], ['spam', T_('Spam, quảng cáo', 'Spam or advertising')], ['false_info', T_('Sai sự thật', 'False information')],
  ['bad_photo', T_('Ảnh không phù hợp', 'Inappropriate photo')], ['other', T_('Lý do khác', 'Something else')]];
const reasonText = (r) => (REASONS().find(x => x[0] === r) || [r, r])[1];
const when = (t) => { try { return new Date(t).toLocaleString(PV.lang === 'en' ? 'en-GB' : 'vi-VN', {dateStyle: 'short', timeStyle: 'short'}); } catch(e){ return ''; } };
const pname = (id) => { const p = PV.byId(id); return p ? PV.L(p.name, p.name_en || p.name) : (id === 'personavel' ? 'Personavel' : (id || '')); };
const errBox = (root, t, ok) => { const el = $('.au-msg', root); if (!el) return; el.hidden = !t; el.className = 'au-msg ' + (ok ? 'ok' : 'err'); el.textContent = t || ''; };

/* ---------- report box ---------- */
PV.reportModal = (type, id, btn) => {
  if (!PV.requireLogin(T_('Đăng nhập để báo cáo nội dung không phù hợp.', 'Sign in to report inappropriate content.'))) return;
  PV.modal(`<h3>⚑ ${T_('Báo cáo nội dung', 'Report content')}</h3><p class="small muted" style="margin-top:-4px">${T_('Nhóm Personavel sẽ xem lại. Nội dung bị 3 người báo cáo sẽ tạm ẩn.', 'The Personavel team will review it. Content reported by 3 people is hidden automatically.')}</p>
    <fieldset class="rp-reasons"><legend class="small">${T_('Lý do', 'Reason')}</legend>${REASONS().map(([k, t], i) => `<label class="rp-r"><input type="radio" name="rpR" value="${k}"${i === 0 ? ' checked' : ''}> <span>${t}</span></label>`).join('')}</fieldset>
    <label class="small" style="display:block;margin-top:8px">${T_('Ghi chú (không bắt buộc)', 'Note (optional)')}<textarea class="input" id="rpN" rows="3" maxlength="300"></textarea></label>
    <div class="au-msg" role="alert" hidden></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-close>${T_('Hủy', 'Cancel')}</button><button class="btn" id="rpGo">${T_('Gửi báo cáo', 'Send report')}</button></div>`, (bg, close) => {
    const box = bg.querySelector('.modal');
    $('#rpGo', bg).onclick = async () => { const go = $('#rpGo', bg); go.disabled = true;
      try { await PV.rpc('pv_report', {p_type: type, p_id: id, p_reason: (bg.querySelector('input[name=rpR]:checked') || {}).value || 'other', p_note: $('#rpN', bg).value.trim()});
        close(); PV.toast(T_('Đã gửi báo cáo – cảm ơn bạn 💙', 'Report sent – thank you 💙'));
        if (btn){ btn.disabled = true; btn.textContent = T_('Đã báo cáo – cảm ơn bạn', 'Reported – thank you'); } }
      catch(e){ go.disabled = false; errBox(box, e.userMsg || PV.errText('PV_UNKNOWN')); } };
  });
};

/* ---------- #admin ---------- */
let tab = 'reports', repStatus = 'open';
const TABS = () => [['reports', '⚑ ' + T_('Báo cáo', 'Reports')], ['photos', '🖼️ ' + T_('Duyệt ảnh', 'Photos')], ['users', '👥 ' + T_('Người dùng', 'Users')], ['log', '📜 ' + T_('Nhật ký', 'Log')]];
PV.views.admin = async (m) => {
  m.innerHTML = `<h1 class="title">🛡️ ${T_('Quản trị', 'Admin')}</h1><div class="card"><p class="small muted">⏳ ${T_('Đang kiểm tra quyền…', 'Checking permission…')}</p></div>`;
  if (!C.user){ const s = await PV.session(); if (!s){ m.innerHTML = `<h1 class="title">🛡️ ${T_('Quản trị', 'Admin')}</h1><div class="card"><p>${T_('Bạn cần đăng nhập bằng tài khoản quản trị.', 'Please sign in with an admin account.')}</p><button class="btn" id="adIn">${T_('Đăng nhập', 'Sign in')}</button></div>`; $('#adIn', m).onclick = () => PV.authModal(); return; } }
  if (!C.me) await PV.refreshMe();
  if (!C.me || C.me.role !== 'admin'){ m.innerHTML = `<h1 class="title">🛡️ ${T_('Quản trị', 'Admin')}</h1><div class="card"><p>${T_('Trang này chỉ dành cho quản trị viên của nhóm Personavel.', 'This page is only for Personavel team admins.')}</p><a class="btn ghost" href="#profile">${T_('Về trang cá nhân', 'Back to profile')}</a></div>`; return; }
  m.innerHTML = `<h1 class="title">🛡️ ${T_('Quản trị', 'Admin')}</h1><p class="sub">${T_('Xử lý báo cáo, duyệt ảnh, quản lý người dùng. Mọi thao tác đều được ghi nhật ký.', 'Handle reports, approve photos, manage users. Every action is logged.')}</p>
    <div class="ad-tabs" role="tablist">${TABS().map(([k, t]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${k === tab}">${t}</button>`).join('')}</div>
    <div class="ad-body" id="adBody" role="tabpanel"></div>`;
  $$('[data-tab]', m).forEach(b => b.onclick = () => { tab = b.dataset.tab; $$('[data-tab]', m).forEach(x => x.setAttribute('aria-selected', String(x === b))); draw($('#adBody', m)); });
  draw($('#adBody', m));
};
const loading = (el) => { el.innerHTML = `<p class="small muted">⏳ ${T_('Đang tải…', 'Loading…')}</p>`; };
const failed = (el, e) => { el.innerHTML = `<div class="card"><p class="small">⚠️ ${esc(e.userMsg || PV.errText('PV_UNKNOWN'))}</p></div>`; };
function draw(el){ ({reports: drawReports, photos: drawPhotos, users: drawUsers, log: drawLog})[tab](el); }
/* ask for a reason (hide) or a confirmation (delete) */
const ask = (title, needReason, run) => PV.modal(`<h3>${title}</h3>${needReason ? `<label class="small">${T_('Lý do (người đăng sẽ thấy)', 'Reason (shown to the author)')}<textarea class="input" id="adR" rows="2" maxlength="200"></textarea></label>` : `<p class="small">${T_('Thao tác này không hoàn tác được.', 'This cannot be undone.')}</p>`}
  <div class="au-msg" role="alert" hidden></div><div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-close>${T_('Hủy', 'Cancel')}</button><button class="btn" id="adGo">${T_('Xác nhận', 'Confirm')}</button></div>`, (bg, close) => {
  $('#adGo', bg).onclick = async () => { const b = $('#adGo', bg); b.disabled = true; try { await run(needReason ? $('#adR', bg).value.trim() : null); close(); } catch(e){ b.disabled = false; errBox(bg.querySelector('.modal'), e.userMsg); } };
});

async function drawReports(el){
  el.innerHTML = `<div class="ad-bar"><label class="small">${T_('Trạng thái', 'Status')} <select class="input" id="adSt">${[['open', T_('Đang mở', 'Open')], ['resolved', T_('Đã xử lý', 'Resolved')], ['dismissed', T_('Đã bỏ qua', 'Dismissed')]].map(([k, t]) => `<option value="${k}"${k === repStatus ? ' selected' : ''}>${t}</option>`).join('')}</select></label><button class="btn ghost sm" id="adRe">🔄</button></div><div class="ad-list"></div>`;
  $('#adSt', el).onchange = (e) => { repStatus = e.target.value; drawReports(el); }; $('#adRe', el).onclick = () => drawReports(el);
  const list = $('.ad-list', el); loading(list);
  let rows; try { rows = await PV.rpc('pv_admin_reports', {p_status: repStatus}); } catch(e){ return failed(list, e); }
  if (!rows.length){ list.innerHTML = `<p class="small muted">${T_('Không có báo cáo nào.', 'No reports.')}</p>`; return; }
  list.innerHTML = rows.map((r, i) => { const c = r.content;
    return `<article class="ad-item">
      <div class="mc-top"><span class="mc-type">${r.type === 'post' ? '📝 ' + T_('Bài viết', 'Post') : '⭐ ' + T_('Đánh giá', 'Review')}</span><span class="st st-pending">${esc(reasonText(r.reason))}</span>${r.report_count > 1 ? `<span class="st st-hidden">${r.report_count} ${T_('báo cáo', 'reports')}</span>` : ''}${c && c.hidden ? `<span class="st st-hidden">🚫 ${T_('đang ẩn', 'hidden')}</span>` : ''}<span class="spacer"></span><span class="tiny muted">${when(r.created_at)}</span></div>
      <div class="tiny muted">${T_('Người báo cáo', 'Reporter')}: ${esc(r.reporter_name || '?')}${r.note ? ` · “${esc(r.note)}”` : ''}</div>
      ${c ? `<div class="ad-content"><b>${esc(c.title || (c.kind === 'site' ? 'Personavel' : pname(c.target || c.place)))}</b> <span class="tiny muted">— ${esc(c.author || '')}${c.stars ? ' · ' + '★'.repeat(c.stars) : ''}</span>
        ${c.body ? `<p class="mc-body">${esc(c.body)}</p>` : ''}${(c.photos || []).length ? `<div class="mc-ph">${c.photos.filter(u => PV.safeImg(u)).map(u => `<a href="${esc(PV.safeImg(u))}" target="_blank" rel="noopener"><img src="${esc(PV.safeImg(u))}" alt=""></a>`).join('')}</div>` : ''}${c.hidden_reason ? `<div class="tiny">🚫 ${esc(c.hidden_reason)}</div>` : ''}</div>`
        : `<p class="small muted">${T_('Nội dung đã bị xóa.', 'The content has been deleted.')}</p>`}
      ${repStatus === 'open' ? `<div class="mc-act"><span class="spacer"></span>${c && !c.hidden ? `<button class="btn ghost sm" data-a="hide" data-i="${i}">🙈 ${T_('Ẩn', 'Hide')}</button>` : ''}${c && c.hidden ? `<button class="btn ghost sm" data-a="restore" data-i="${i}">↩️ ${T_('Khôi phục', 'Restore')}</button>` : ''}${c ? `<button class="btn ghost sm acc-del" data-a="delete" data-i="${i}">🗑️ ${T_('Xóa', 'Delete')}</button>` : ''}<button class="btn ghost sm" data-a="dismiss" data-i="${i}">✔️ ${T_('Bỏ qua', 'Dismiss')}</button></div>`
        : (c && c.hidden ? `<div class="mc-act"><span class="spacer"></span><button class="btn ghost sm" data-a="restore" data-i="${i}">↩️ ${T_('Khôi phục', 'Restore')}</button></div>` : '')}
    </article>`; }).join('');
  $$('[data-a]', list).forEach(b => b.onclick = () => { const r = rows[+b.dataset.i], a = b.dataset.a;
    const run = async (reason) => { await PV.rpc('pv_admin_moderate', {p_type: r.type, p_id: r.target_id, p_action: a, p_reason: reason || null}); PV.toast(T_('Đã xử lý', 'Done')); drawReports(el); };
    if (a === 'hide') ask('🙈 ' + T_('Ẩn nội dung này', 'Hide this content'), true, run);
    else if (a === 'delete') ask('🗑️ ' + T_('Xóa vĩnh viễn nội dung này?', 'Delete this content permanently?'), false, run);
    else { b.disabled = true; run().catch(e => { b.disabled = false; PV.toast(e.userMsg); }); } });
}
async function drawPhotos(el){
  el.innerHTML = `<div class="ad-bar"><span class="small muted">${T_('Ảnh mới chờ duyệt – chỉ người đăng thấy cho tới khi được duyệt.', 'New photos waiting – only their author sees them until approved.')}</span><span class="spacer"></span><button class="btn ghost sm" id="adRe">🔄</button></div><div class="ad-grid"></div>`;
  $('#adRe', el).onclick = () => drawPhotos(el);
  const grid = $('.ad-grid', el); loading(grid);
  let rows; try { rows = await PV.rpc('pv_admin_pending_photos'); } catch(e){ return failed(grid, e); }
  if (!rows.length){ grid.innerHTML = `<p class="small muted">${T_('Không có ảnh nào chờ duyệt 🎉', 'No photos waiting 🎉')}</p>`; return; }
  grid.innerHTML = rows.map((r, i) => `<figure class="ad-ph" data-i="${i}"><a href="${esc(PV.safeImg(r.url) || '#')}" target="_blank" rel="noopener"><img src="${esc(PV.safeImg(r.url) || '')}" alt="${T_('Ảnh chờ duyệt', 'Pending photo')}" loading="lazy"></a>
      <figcaption><span class="tiny">${r.post_id ? '📝 ' + T_('Bài viết', 'Post') : '⭐ ' + T_('Đánh giá', 'Review')} · ${esc(r.author_name || '?')}</span><span class="tiny muted">${when(r.created_at)}</span>
      <span class="row" style="gap:6px"><button class="btn sm" data-ok="1" data-i="${i}">✅ ${T_('Duyệt', 'Approve')}</button><button class="btn ghost sm acc-del" data-ok="0" data-i="${i}">✕ ${T_('Từ chối', 'Reject')}</button></span></figcaption></figure>`).join('');
  $$('[data-ok]', grid).forEach(b => b.onclick = async () => { const r = rows[+b.dataset.i], fig = b.closest('.ad-ph'); $$('button', fig).forEach(x => x.disabled = true);
    try { await PV.rpc('pv_admin_photo', {p_id: r.id, p_approve: b.dataset.ok === '1'}); fig.classList.add('done'); fig.querySelector('figcaption .row').innerHTML = `<b class="small">${b.dataset.ok === '1' ? '✅ ' + T_('Đã duyệt', 'Approved') : '✕ ' + T_('Đã từ chối', 'Rejected')}</b>`; }
    catch(e){ $$('button', fig).forEach(x => x.disabled = false); PV.toast(e.userMsg); } });
}
async function drawUsers(el, q = ''){
  el.innerHTML = `<form class="ad-bar" id="adQ"><input class="input" id="adQi" type="search" placeholder="${T_('Tìm theo tên hoặc email', 'Search by name or email')}" value="${esc(q)}"><button class="btn sm" type="submit">${T_('Tìm', 'Search')}</button></form><div class="ad-list"></div>`;
  $('#adQ', el).onsubmit = (e) => { e.preventDefault(); drawUsers(el, $('#adQi', el).value.trim()); };
  const list = $('.ad-list', el); loading(list);
  let rows; try { rows = await PV.rpc('pv_admin_users', {p_query: q || null}); } catch(e){ return failed(list, e); }
  if (!rows.length){ list.innerHTML = `<p class="small muted">${T_('Không tìm thấy ai.', 'Nobody found.')}</p>`; return; }
  list.innerHTML = rows.map((u, i) => `<article class="ad-item ad-user"><span class="cf-av" style="background:${PV.community.colorOf(u.display_name || '?')}">${PV.safeImg(u.avatar_url) ? `<img src="${esc(PV.safeImg(u.avatar_url))}" alt="">` : esc((u.display_name || '?')[0].toUpperCase())}</span>
      <div style="min-width:0;flex:1"><b>${esc(u.display_name || '?')}</b> ${u.role === 'admin' ? '<span class="st st-public">admin</span>' : ''}${u.banned ? `<span class="st st-hidden">${T_('bị khóa', 'blocked')}</span>` : ''}
        <div class="tiny muted ad-mail">${esc(u.email || '')}</div><div class="tiny muted">${u.review_count || 0} ${T_('đánh giá', 'reviews')} · ${T_('từ', 'since')} ${when(u.created_at)}</div></div>
      ${u.role === 'admin' ? '' : `<button class="btn ghost sm${u.banned ? '' : ' acc-del'}" data-ban="${i}">${u.banned ? '🔓 ' + T_('Mở khóa', 'Unblock') : '🔒 ' + T_('Khóa đăng bài', 'Block posting')}</button>`}</article>`).join('');
  $$('[data-ban]', list).forEach(b => b.onclick = async () => { const u = rows[+b.dataset.ban]; b.disabled = true;
    try { await PV.rpc('pv_admin_set_ban', {p_user: u.id, p_banned: !u.banned}); PV.toast(!u.banned ? T_('Đã khóa quyền đăng bài', 'Posting blocked') : T_('Đã mở khóa', 'Unblocked')); drawUsers(el, q); }
    catch(e){ b.disabled = false; PV.toast(e.userMsg); } });
}
async function drawLog(el){
  el.innerHTML = `<div class="ad-bar"><span class="spacer"></span><button class="btn ghost sm" id="adRe">🔄</button></div><div class="ad-list"></div>`;
  $('#adRe', el).onclick = () => drawLog(el);
  const list = $('.ad-list', el); loading(list);
  let rows; try { rows = await PV.rpc('pv_admin_log', {p_limit: 50}); } catch(e){ return failed(list, e); }
  if (!rows.length){ list.innerHTML = `<p class="small muted">${T_('Chưa có thao tác nào.', 'No actions yet.')}</p>`; return; }
  list.innerHTML = `<ol class="ad-log">${rows.map(r => `<li><span class="tiny muted">${when(r.created_at)}</span> <b>${esc(r.admin_name || '?')}</b> · <code>${esc(r.action)}</code> ${esc(r.target_type || '')}${r.reason ? ` · “${esc(r.reason)}”` : ''}<span class="tiny muted ad-id"> ${esc(String(r.target_id || '').slice(0, 8))}</span></li>`).join('')}</ol>`;
}

/* reviews in the community feed: the old one-tap report becomes the report box (with reasons) */
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-rep]'); if (!b || b.disabled) return;
  e.preventDefault(); e.stopImmediatePropagation(); PV.reportModal('review', b.dataset.rep, b);
}, true);
})();
