/* ===== Personavel – "Nội dung của tôi" (my reviews & posts) and posts on place pages =====
   pv_my_content · pv_review_save · pv_review_delete · pv_post_save · pv_post_delete · pv_list_posts (docs/data-contract.md) */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const C = PV.cloud;
const MAXPOST = 4;   // photos per post in the editor (server allows 6)
const pname = (id) => { const p = PV.byId(id); return p ? PV.L(p.name, p.name_en || p.name) : ''; };
const when = (t) => { try { return new Date(t).toLocaleDateString(PV.lang === 'en' ? 'en-GB' : 'vi-VN'); } catch(e){ return ''; } };
const STATUS = (it) => it.status === 'hidden' ? `<span class="pvst pvst-hidden">🚫 ${T_('Bị ẩn', 'Hidden')}${it.hidden_reason ? ': ' + esc(it.hidden_reason) : ''}</span>`
  : it.status === 'pending' ? `<span class="pvst pvst-pending">⏳ ${T_('Chờ duyệt ảnh', 'Photos pending')}</span>` : `<span class="pvst pvst-public">🌐 ${T_('Công khai', 'Public')}</span>`;
const thumbs = (urls) => (urls || []).filter(u => PV.safeImg(u)).slice(0, 4).map(u => `<img src="${esc(PV.safeImg(u))}" alt="" loading="lazy">`).join('');
const starsTxt = (n) => n ? '★'.repeat(n) + '☆'.repeat(5 - n) : '';
/* upload the photos picked on this device ({k}) and return public URLs */
async function uploadAll(photos){
  const out = [];
  for (const p of photos){ if (p.u) out.push(p.u); else if (p.k){ const d = await PV.photoDB.get(p.k); if (d) out.push(await PV.community.upload(d)); } }
  return out;
}

/* ---------- edit a review (from "Nội dung của tôi") ---------- */
function reviewModal(it, done){
  const local = (it.kind === 'site' ? state.appReview : (state.reviews || {})[it.target]) || {};
  let stars = it.stars || 0, photos = (it.photos || []).map(u => ({u}));
  PV.modal(`<h3>✏️ ${T_('Sửa đánh giá', 'Edit review')}</h3><p class="small muted" style="margin-top:-4px">${esc(it.kind === 'site' ? 'Personavel' : pname(it.target))}</p>
    <div class="rv-pick" id="meStars">${[1,2,3,4,5].map(i => `<button type="button" data-s="${i}" class="${i <= stars ? 'on' : ''}" aria-label="${i} ${T_('sao', 'stars')}">★</button>`).join('')}</div>
    <label class="small" style="display:block;margin-top:8px">${T_('Nội dung', 'Text')}<textarea class="input" id="meBody" rows="4" maxlength="800">${esc(it.body || '')}</textarea></label>
    <div id="mePhWrap" style="margin-top:8px"></div><div class="au-msg" role="alert" hidden></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-close>${T_('Hủy', 'Cancel')}</button><button class="btn" id="meGo">${T_('Lưu', 'Save')}</button></div>`, (bg, close) => {
    const box = bg.querySelector('.modal');
    const paintStars = () => $$('#meStars button', bg).forEach(b => b.classList.toggle('on', +b.dataset.s <= stars));
    $$('#meStars button', bg).forEach(b => b.onclick = () => { stars = +b.dataset.s === stars ? 0 : +b.dataset.s; paintStars(); });
    const drawPh = () => { $('#mePhWrap', bg).innerHTML = PV.rvPhotos.editor(photos, 'mePh'); PV.rvPhotos.bindEditor(bg, 'mePh', photos, (next) => { photos = next; drawPh(); }); };
    drawPh();
    $('#meGo', bg).onclick = async () => { const b = $('#meGo', bg); b.disabled = true;
      try { const urls = await uploadAll(photos);
        const out = await PV.rpc('pv_review_save', {p_kind: it.kind, p_target: it.target, p_stars: stars, p_love: typeof it.love === 'boolean' ? it.love : !!(local.fav || local.love), p_tags: Array.isArray(it.tags) ? it.tags : (local.tags || []), p_body: $('#meBody', bg).value.trim(), p_photos: urls});
        if (it.kind === 'place' && state.reviews){ const r = state.reviews[it.target] = {...(state.reviews[it.target] || {fav: false, tags: []}), stars, text: out.body, photos: urls.map(u => ({u})), cloudId: out.id, cloudAt: Date.now(), at: new Date().toLocaleDateString('vi-VN')}; PV.save('reviews'); }
        close(); PV.toast(T_('Đã lưu đánh giá ✅', 'Review saved ✅')); done && done(); }
      catch(e){ b.disabled = false; const el = $('.au-msg', box); el.hidden = false; el.className = 'au-msg err'; el.textContent = e.userMsg || PV.errText('PV_UNKNOWN'); } };
  });
}

/* ---------- write / edit a post ---------- */
PV.postModal = (post = {}, done) => {
  if (!PV.requireLogin(T_('Đăng nhập để viết bài chia sẻ trải nghiệm.', 'Sign in to write a post.'))) return;
  let photos = (post.photos || []).map(u => ({u}));
  const places = PV_DATA.places.slice().sort((a, b) => pname(a.id).localeCompare(pname(b.id), 'vi'));
  const cur = post.place || post.target || '';
  PV.modal(`<h3>📝 ${post.id ? T_('Sửa bài viết', 'Edit post') : T_('Viết bài mới', 'New post')}</h3>
    <label class="small" style="display:block">${T_('Tiêu đề', 'Title')}<input class="input" id="poT" maxlength="120" value="${esc(post.title || '')}" required></label>
    <label class="small" style="display:block;margin-top:8px">${T_('Địa điểm (không bắt buộc)', 'Place (optional)')}<select class="input" id="poP"><option value="">${T_('— Không gắn địa điểm —', '— No place —')}</option>${places.map(p => `<option value="${p.id}"${p.id === cur ? ' selected' : ''}>${esc(pname(p.id))}</option>`).join('')}</select></label>
    <label class="small" style="display:block;margin-top:8px">${T_('Nội dung', 'Text')}<textarea class="input" id="poB" rows="6" maxlength="4000" placeholder="${T_('Kể về trải nghiệm của bạn: đi lúc nào, có gì hay, mẹo nhỏ…', 'Tell your story: when you went, what was great, little tips…')}">${esc(post.body || '')}</textarea></label>
    <div class="tiny muted" id="poCount" style="text-align:right"></div>
    <div id="poPhWrap"></div><p class="tiny muted">${T_('Ảnh mới hiện công khai sau khi nhóm duyệt.', 'New photos go public after the team approves them.')}</p><div class="au-msg" role="alert" hidden></div>
    <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-close>${T_('Hủy', 'Cancel')}</button><button class="btn" id="poGo">${post.id ? T_('Lưu', 'Save') : T_('Đăng bài', 'Publish')}</button></div>`, (bg, close) => {
    bg.classList.add('po-bg');
    const box = bg.querySelector('.modal'), err = (t) => { const el = $('.au-msg', box); el.hidden = !t; el.className = 'au-msg err'; el.textContent = t || ''; };
    const cnt = () => { $('#poCount', bg).textContent = `${$('#poB', bg).value.length}/4000`; }; $('#poB', bg).oninput = cnt; cnt();
    const drawPh = () => { $('#poPhWrap', bg).innerHTML = PV.rvPhotos.editor(photos.slice(0, MAXPOST), 'poPh'); PV.rvPhotos.bindEditor(bg, 'poPh', photos, (next) => { photos = next.slice(0, MAXPOST); drawPh(); }); };
    drawPh();
    $('#poGo', bg).onclick = async () => {
      const title = $('#poT', bg).value.trim(), body = $('#poB', bg).value.trim(), place = $('#poP', bg).value || null;
      if (!title) return err(T_('Bài viết cần có tiêu đề.', 'Your post needs a title.'));
      if (!body) return err(T_('Bạn viết vài dòng nội dung nhé.', 'Please write a few lines.'));
      if (PV.badText && (PV.badText(title) || PV.badText(body))) return err(PV.errText('PV_BAD_WORDS'));
      const b = $('#poGo', bg); b.disabled = true; b.textContent = T_('Đang đăng…', 'Publishing…');
      try { const urls = await uploadAll(photos);
        const out = await PV.rpc('pv_post_save', {p_id: post.id || null, p_title: title, p_body: body, p_photos: urls, p_place: place});
        photos.forEach(p => p.k && PV.photoDB.del(p.k));
        close(); PV.toast(out && out.status === 'pending' ? T_('Đã đăng bài – ảnh sẽ hiện sau khi được duyệt ⏳', 'Posted – photos appear after approval ⏳') : T_('Đã đăng bài ✅', 'Post published ✅')); done && done(out); }
      catch(e){ b.disabled = false; b.textContent = post.id ? T_('Lưu', 'Save') : T_('Đăng bài', 'Publish'); err(e.userMsg || PV.errText('PV_UNKNOWN')); }
    };
  });
};
const confirmDelete = (label, run) => PV.modal(`<h3>🗑️ ${T_('Xóa', 'Delete')} ${esc(label)}?</h3><p class="small">${T_('Nội dung sẽ bị xóa khỏi Personavel và không khôi phục được.', 'It will be removed from Personavel and cannot be recovered.')}</p><div class="au-msg" role="alert" hidden></div>
  <div class="row" style="justify-content:flex-end;gap:8px;margin-top:12px"><button class="btn ghost" data-close>${T_('Hủy', 'Cancel')}</button><button class="btn acc-del-go" id="cdGo">${T_('Xóa', 'Delete')}</button></div>`, (bg, close) => {
  $('#cdGo', bg).onclick = async () => { const b = $('#cdGo', bg); b.disabled = true; try { await run(); close(); PV.toast(T_('Đã xóa', 'Deleted')); } catch(e){ b.disabled = false; const el = $('.au-msg', bg); el.hidden = false; el.className = 'au-msg err'; el.textContent = e.userMsg || PV.errText('PV_UNKNOWN'); } };
});

/* ---------- profile: "Nội dung của tôi" ---------- */
let filter = 'all';
async function drawMine(host){
  const list = $('.mc-list', host); list.innerHTML = `<p class="small muted">⏳ ${T_('Đang tải…', 'Loading…')}</p>`;
  let items;
  try { items = await PV.rpc('pv_my_content'); }
  catch(e){ if (e.code === 'PV_MISSING'){ host.remove(); return; } list.innerHTML = `<p class="small">⚠️ ${esc(e.userMsg)}</p>`; return; }
  items = (items || []).slice().sort((a, b) => Date.parse(b.updated_at || b.created_at) - Date.parse(a.updated_at || a.created_at));
  const n = {all: items.length, review: items.filter(x => x.type === 'review').length, post: items.filter(x => x.type === 'post').length};
  $$('.mc-f button', host).forEach(b => { b.querySelector('i').textContent = n[b.dataset.f]; b.setAttribute('aria-pressed', String(b.dataset.f === filter)); });
  const shown = items.filter(x => filter === 'all' || x.type === filter);
  if (!shown.length){ list.innerHTML = `<p class="small muted">${filter === 'post' ? T_('Bạn chưa viết bài nào.', 'You have not written any posts.') : filter === 'review' ? T_('Bạn chưa có đánh giá nào trên tài khoản.', 'No reviews on your account yet.') : T_('Bạn chưa có nội dung nào. Hãy đánh giá một địa điểm hoặc viết bài đầu tiên!', 'Nothing yet. Review a place or write your first post!')}</p>`; return; }
  list.innerHTML = shown.map((it, i) => {
    const where = it.type === 'post' ? (it.target ? pname(it.target) : T_('Bài viết chung', 'General post')) : (it.kind === 'site' ? T_('Website Personavel', 'Personavel website') : pname(it.target) || it.target);
    return `<article class="mc-item" data-i="${i}">
      <div class="mc-top"><span class="mc-type">${it.type === 'post' ? '📝 ' + T_('Bài viết', 'Post') : '⭐ ' + T_('Đánh giá', 'Review')}</span>${STATUS(it)}<span class="spacer"></span><span class="tiny muted">${when(it.updated_at || it.created_at)}</span></div>
      <b class="mc-title">${esc(it.title || where)}</b>${it.type === 'post' && it.title && it.target ? `<div class="tiny muted">📍 ${esc(where)}</div>` : ''}
      ${it.stars ? `<div class="mc-stars" aria-label="${it.stars}/5">${starsTxt(it.stars)}</div>` : ''}
      ${it.body ? `<p class="mc-body">${esc(it.body)}</p>` : ''}${it.photos && it.photos.length ? `<div class="mc-ph">${thumbs(it.photos)}</div>` : ''}
      <div class="mc-act">${it.type === 'review' && it.kind === 'place' && PV.byId(it.target) ? `<button class="linkbtn tiny" data-open="${esc(it.target)}">${T_('Mở địa điểm', 'Open place')}</button>` : ''}<span class="spacer"></span>
        <button class="btn ghost sm" data-edit="${i}">✏️ ${T_('Sửa', 'Edit')}</button><button class="btn ghost sm acc-del" data-del="${i}">🗑️ ${T_('Xóa', 'Delete')}</button></div></article>`;
  }).join('');
  const again = () => drawMine(host);
  $$('[data-open]', list).forEach(b => b.onclick = () => PV.openPlace(b.dataset.open));
  $$('[data-edit]', list).forEach(b => b.onclick = () => { const it = shown[+b.dataset.edit];
    if (it.type === 'post') PV.postModal({id: it.id, title: it.title, body: it.body, photos: it.photos, place: it.target}, again); else reviewModal(it, again); });
  $$('[data-del]', list).forEach(b => b.onclick = () => { const it = shown[+b.dataset.del];
    confirmDelete(it.type === 'post' ? T_('bài viết này', 'this post') : T_('đánh giá này', 'this review'), async () => {
      await PV.rpc(it.type === 'post' ? 'pv_post_delete' : 'pv_review_delete', {p_id: it.id});
      if (it.type === 'review' && it.kind === 'place' && state.reviews && state.reviews[it.target]){ delete state.reviews[it.target].cloudAt; delete state.reviews[it.target].cloudId; PV.save('reviews'); }
      again(); }); });
}
const _profile = PV.views.profile;
PV.views.profile = (m, ...a) => {
  const r = _profile(m, ...a);
  if (C.user && !m.querySelector('#myContent') && !PV.missing('pv_my_content')){
    const after = m.querySelector('#pbadges') || m.querySelector('.grid.g2');
    after.insertAdjacentHTML('afterend', `<section class="card" id="myContent" style="margin-top:18px">
      <div class="row"><h3 style="margin:0">🗂️ ${T_('Nội dung của tôi', 'My content')}</h3><span class="spacer"></span><button class="btn sm" id="mcNew">✍️ ${T_('Viết bài', 'Write a post')}</button></div>
      <div class="mc-f" role="group" aria-label="${T_('Lọc theo loại', 'Filter by type')}"><button type="button" data-f="all">${T_('Tất cả', 'All')} <i></i></button><button type="button" data-f="review">⭐ ${T_('Đánh giá', 'Reviews')} <i></i></button><button type="button" data-f="post">📝 ${T_('Bài viết', 'Posts')} <i></i></button></div>
      <div class="mc-list"></div></section>`);
    const host = m.querySelector('#myContent');
    $$('.mc-f button', host).forEach(b => b.onclick = () => { filter = b.dataset.f; drawMine(host); });
    $('#mcNew', host).onclick = () => PV.postModal({}, () => { filter = 'post'; drawMine(host); });
    drawMine(host);
  }
  return r;
};

/* ---------- place page: posts about this place ---------- */
const postItem = (p) => `<article class="po-item" data-id="${esc(p.id)}">
    <div class="cf-top"><span class="cf-av" style="background:${PV.community.colorOf(p.author_name || '?')}">${PV.safeImg(p.author_avatar) ? `<img src="${esc(PV.safeImg(p.author_avatar))}" alt="">` : esc((p.author_name || '?')[0].toUpperCase())}</span>
      <div class="cf-who"><b>${esc(p.author_name || T_('Du khách', 'Traveller'))}</b><span class="tiny muted">${when(p.created_at)}</span></div></div>
    <b class="po-title">${esc(p.title)}</b><p class="po-body">${esc(p.body)}</p>
    ${PV.rvPhotos.grid((p.photos || []).filter(u => PV.safeImg(u)).map(u => ({u})))}
    <div class="po-act">${PV.reportModal ? `<button class="cf-report tiny" data-rep-post="${esc(p.id)}">⚑ ${T_('Báo cáo', 'Report')}</button>` : ''}</div></article>`;
PV.renderPosts = async (el, place) => {
  if (!el || PV.missing('pv_list_posts')) { if (el) el.remove(); return; }
  el.innerHTML = `<div class="cf-head"><b>📝 ${T_('Bài viết về nơi này', 'Posts about this place')}</b><span class="spacer"></span><button class="btn ghost sm" id="poNew">✍️ ${T_('Viết bài', 'Write')}</button></div><div class="po-list"><p class="tiny muted">⏳</p></div><div class="po-more"></div>`;
  $('#poNew', el).onclick = () => PV.postModal({place}, () => PV.renderPosts(el, place));
  const list = $('.po-list', el), more = $('.po-more', el); let last = null, first = true;
  const page = async () => {
    let rows; try { rows = await PV.rpc('pv_list_posts', {p_place: place, p_limit: 5, p_before: last}); }
    catch(e){ if (e.code === 'PV_MISSING'){ el.remove(); return; } list.innerHTML = `<p class="tiny muted">${esc(e.userMsg)}</p>`; return; }
    if (!document.body.contains(el)) return;
    if (first){ list.innerHTML = ''; first = false; }
    if (!rows.length && !list.children.length) list.innerHTML = `<p class="small muted">${T_('Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!', 'No posts yet. Be the first to share!')}</p>`;
    rows.forEach(p => { list.insertAdjacentHTML('beforeend', postItem(p)); const a = list.lastElementChild; PV.rvPhotos.bindGrid(a, (p.photos || []).map(u => ({u})), p.title);
      const rb = a.querySelector('[data-rep-post]'); if (rb) rb.onclick = () => PV.reportModal('post', p.id, rb); });
    if (rows.length) last = rows[rows.length - 1].created_at;
    more.innerHTML = rows.length === 5 ? `<button class="btn ghost sm" type="button">${T_('Xem thêm bài viết', 'More posts')}</button>` : '';
    const mb = more.querySelector('button'); if (mb) mb.onclick = () => { mb.disabled = true; page(); };
  };
  page();
};
const _open = PV.openPlace;
PV.openPlace = (id, opt) => {
  const r = _open(id, opt);
  const dr = document.getElementById('drawer');
  if (dr && !dr.querySelector('#poFeed') && !PV.missing('pv_list_posts') && PV.byId(id)){
    (dr.querySelector('.body') || dr).insertAdjacentHTML('beforeend', '<section class="cf po" id="poFeed"></section>');
    PV.renderPosts(dr.querySelector('#poFeed'), id);
  }
  return r;
};
})();
