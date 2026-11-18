/* ===== Personavel – your own reviews: stars, favourite heart, notes for places you visited ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const RV = () => (state.reviews && typeof state.reviews === 'object' && !Array.isArray(state.reviews)) ? state.reviews : (state.reviews = PV.store.get('reviews', {}) || {});
RV();
if (PV.USER_KEYS && !PV.USER_KEYS.includes('reviews')) PV.USER_KEYS.push('reviews');

const TAGS = [['Đáng quay lại','Worth returning'],['Cảnh đẹp','Beautiful'],['Ngon','Tasty'],['Giá hợp lý','Good value'],['Phục vụ tốt','Great service'],['Hơi đông','A bit crowded'],['Hợp chụp ảnh','Photogenic'],['Yên tĩnh','Quiet']];
const MOODS = ['', '😕', '😐', '🙂', '😊', '🤩'];
const MOODTXT = [['',''],['Chưa ưng','Not great'],['Tạm được','Okay'],['Khá ổn','Good'],['Rất thích','Loved it'],['Tuyệt vời!','Amazing!']];
const pname = id => { const p = PV.byId(id); return p ? (PV.lang==='en' && p.name_en ? p.name_en : p.name) : ''; };
const starsHTML = (n, cls='') => `<span class="rv-stars ${cls}" aria-label="${n}/5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;

function save(id, patch){
  const all = RV(); const first = !all[id];
  all[id] = {...(all[id]||{stars:0, fav:false, text:'', tags:[]}), ...patch, at: new Date().toLocaleDateString('vi-VN')};
  PV.save('reviews');
  if (first) PV.addPoints(5);
}

/* ---------- review box inside the place drawer ---------- */
function reviewBox(id){
  const r = RV()[id] || {stars:0, fav:false, text:'', tags:[]};
  if (!state.visited[id]) return `<div class="rv-box locked"><b>⭐ ${PV.L('Đánh giá của bạn','Your review')}</b><div class="tiny muted">${PV.L('Bấm “Tôi đã ghé thăm” để chấm sao, thả tim và viết nhận xét cho nơi này.','Mark this place as visited to rate it, add it to favourites and write a note.')}</div></div>`;
  return `<div class="rv-box" id="rvBox">
    <div class="rv-head"><b>⭐ ${PV.L('Đánh giá của bạn','Your review')}</b>
      <button class="rv-heart ${r.fav?'on':''}" id="rvFav" aria-pressed="${r.fav}" title="${PV.L('Yêu thích','Favourite')}"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.6l1 1.4 1-1.4C14 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg><span>${r.fav?PV.L('Đã yêu thích','Favourited'):PV.L('Yêu thích','Favourite')}</span></button></div>
    <div class="rv-rate"><div class="rv-pick" id="rvStars">${[1,2,3,4,5].map(i=>`<button data-s="${i}" class="${i<=r.stars?'on':''}" aria-label="${i} ${PV.L('sao','stars')}">★</button>`).join('')}</div>
      <span class="rv-mood" id="rvMood">${r.stars?`${MOODS[r.stars]} ${PV.L(...MOODTXT[r.stars])}`:PV.L('Chạm để chấm sao','Tap to rate')}</span></div>
    <div class="rv-tags">${TAGS.map(([vi,en])=>`<button class="chip ${(r.tags||[]).includes(vi)?'on':''}" data-t="${esc(vi)}">${PV.L(vi,en)}</button>`).join('')}</div>
    <textarea class="input" id="rvText" rows="3" maxlength="800" placeholder="${PV.L('Cảm nhận của bạn về nơi này… (món nên thử, thời điểm đẹp, mẹo nhỏ)','Your thoughts… (what to try, best time, tips)')}">${esc(r.text||'')}</textarea>
    ${PV.rvPhotos.editor(r.photos||[], 'rvPh')}
    <label class="rv-pub"><input type="checkbox" id="rvPub" ${r.pub!==false?'checked':''}> <span>🌐 ${PV.L('Hiển thị công khai','Show publicly')} <span class="tiny muted">${PV.L('với tên','as')} “${esc(state.profile?.name||PV.L('Du khách','Traveller'))}”</span></span></label>
    <div class="rv-actions"><span class="tiny muted" id="rvAt">${r.at?PV.L('Cập nhật ','Updated ')+esc(r.at):''}${r.cloudAt?' · 🌐 '+PV.L('đã chia sẻ','shared'):''}</span>
      <div class="row" style="gap:6px">${RV()[id]?`<button class="btn ghost sm" id="rvDel">${PV.L('Xóa','Delete')}</button>`:''}<button class="btn sm" id="rvSave">${PV.L('Lưu nhận xét','Save review')}</button></div></div>
  </div>`;
}
function bindBox(dr, id){
  const box = $('#rvBox', dr); if (!box) return;
  const refresh = () => { const old = $('#rvBox', dr); if (!old) return; old.outerHTML = reviewBox(id); bindBox(dr, id); };
  $('#rvFav', box).onclick = () => { const f = !(RV()[id]?.fav); save(id, {fav:f}); refresh(); PV.toast(f ? PV.L('Đã thêm vào Yêu thích ❤️','Added to favourites ❤️') : PV.L('Đã bỏ khỏi Yêu thích','Removed from favourites')); };
  const btns = $$('#rvStars button', box), mood = $('#rvMood', box);
  btns.forEach(b => {
    b.onmouseenter = () => { const n = +b.dataset.s; btns.forEach(x => x.classList.toggle('hov', +x.dataset.s <= n)); mood.textContent = `${MOODS[n]} ${PV.L(...MOODTXT[n])}`; };
    b.onmouseleave = () => { btns.forEach(x => x.classList.remove('hov')); const s = RV()[id]?.stars||0; mood.textContent = s ? `${MOODS[s]} ${PV.L(...MOODTXT[s])}` : PV.L('Chạm để chấm sao','Tap to rate'); };
    b.onclick = () => { save(id, {stars:+b.dataset.s, text: $('#rvText', box).value.trim()}); refresh(); };
  });
  $$('.rv-tags .chip', box).forEach(c => c.onclick = () => { const cur = new Set(RV()[id]?.tags||[]); cur.has(c.dataset.t) ? cur.delete(c.dataset.t) : cur.add(c.dataset.t); save(id, {tags:[...cur], text: $('#rvText', box).value.trim()}); refresh(); });
  PV.rvPhotos.bindEditor(box, 'rvPh', RV()[id]?.photos || [], (ph) => { save(id, {photos: ph, text: $('#rvText', box).value.trim()}); refresh(); });
  $('#rvPub', box).onchange = () => save(id, {pub: $('#rvPub', box).checked, text: $('#rvText', box).value.trim()});
  $('#rvSave', box).onclick = async () => {
    const btn = $('#rvSave', box); save(id, {text: $('#rvText', box).value.trim(), pub: $('#rvPub', box).checked});
    const r = RV()[id];
    if (r.pub !== false && PV.community.enabled()){
      btn.disabled = true; btn.textContent = PV.L('Đang chia sẻ…','Sharing…');
      try { const out = await PV.community.publish('place', id, r); if (out){ r.photos = out.photos; r.cloudId = out.id; r.cloudAt = Date.now(); PV.save('reviews'); } PV.toast(PV.L('Đã lưu và chia sẻ đánh giá 🌐','Review saved and shared 🌐')); }
      catch(e){ PV.toast(e.userMsg || PV.L('Đã lưu trên máy – chưa chia sẻ được (kiểm tra mạng)','Saved on this device – could not share (check your connection)')); }
    } else {
      if (r.pub === false && r.cloudAt && PV.community.enabled()){ PV.community.remove('place', id, r.cloudId).catch(()=>{}); delete r.cloudAt; PV.save('reviews'); }
      PV.toast(PV.L('Đã lưu nhận xét ✍️','Review saved ✍️'));
    }
    refresh(); const f = document.getElementById('rvFeed'); if (f) PV.renderFeed(f, 'place', id);
  };
  const del = $('#rvDel', box); if (del) del.onclick = () => { if (!del.dataset.sure){ del.dataset.sure = 1; del.textContent = PV.L('Bấm lần nữa để xóa','Tap again to delete'); return; } const old = RV()[id]; (old?.photos||[]).forEach(p => p.k && PV.photoDB.del(p.k)); if (old?.cloudAt) PV.community.remove('place', id, old.cloudId).catch(()=>{}); delete RV()[id]; PV.save('reviews'); refresh(); const f = document.getElementById('rvFeed'); if (f) PV.renderFeed(f, 'place', id); };
}
const _open = PV.openPlace;
PV.openPlace = (id, opt) => {
  const r = _open(id, opt);
  const dr = document.getElementById('drawer'); const v = dr && dr.querySelector('#d-visit');
  if (v && !dr.querySelector('.rv-box')){
    const anchor = dr.querySelector('.lk-strip') || v.parentElement;
    anchor.insertAdjacentHTML('afterend', reviewBox(id)); bindBox(dr, id);
    (dr.querySelector('.body') || dr).insertAdjacentHTML('beforeend', '<section class="cf" id="rvFeed"></section>');
    PV.renderFeed(dr.querySelector('#rvFeed'), 'place', id);
  }
  return r;
};

/* ---------- little heart / stars in place lists ---------- */
const _pitem = PV.pitem;
PV.pitem = (p) => {
  let h = _pitem(p); const r = p && RV()[p.id];
  if (r && (r.fav || r.stars)) h = h.replace('</b>', `</b>${r.fav?'<span class="rv-favmark" title="Yêu thích">❤</span>':''}${r.stars?`<span class="rv-mini">★${r.stars}</span>`:''}`);
  return h;
};

/* ---------- profile: favourites & my reviews ---------- */
const _profile = PV.views.profile;
PV.views.profile = (m) => {
  _profile(m);
  const all = RV(); const ids = Object.keys(all).filter(id => PV.byId(id));
  const favs = ids.filter(id => all[id].fav), rated = ids.filter(id => all[id].stars || all[id].text);
  const avg = rated.length ? (rated.reduce((s,id)=>s+(all[id].stars||0),0) / Math.max(1, rated.filter(id=>all[id].stars).length)) : 0;
  const card = document.createElement('div'); card.className = 'card rv-card'; card.style.marginTop = '18px';
  card.innerHTML = `<div class="row"><h3 style="margin:0">❤️ ${PV.L('Yêu thích & đánh giá của tôi','My favourites & reviews')}</h3><span class="spacer"></span>
      <span class="tiny muted">${favs.length} ${PV.L('yêu thích','favourites')} · ${rated.length} ${PV.L('nhận xét','reviews')}${avg?` · ${PV.L('trung bình','avg')} ★${avg.toFixed(1)}`:''}</span></div>
    ${favs.length ? `<div class="rv-favs">${favs.map(id => `<button class="rv-fav" data-pid="${id}">${PV.img(id)?`<img src="${PV.thumb(id)}" alt="" loading="lazy" decoding="async">`:`<span class="rv-ph">❤</span>`}<span>${esc(pname(id))}</span></button>`).join('')}</div>` : ''}
    <div class="rv-list">${rated.sort((a,b)=>(all[b].stars||0)-(all[a].stars||0)).map(id => { const r = all[id]; return `<div class="rv-item" data-pid="${id}">
        <div class="row" style="gap:8px;align-items:center"><b>${esc(pname(id))}</b>${r.fav?'<span class="rv-favmark">❤</span>':''}<span class="spacer"></span>${r.stars?starsHTML(r.stars):''}</div>
        ${r.tags&&r.tags.length?`<div class="rv-tagline">${r.tags.map(t=>{const e=TAGS.find(x=>x[0]===t);return `<span>${esc(e?PV.L(e[0],e[1]):t)}</span>`;}).join('')}</div>`:''}
        ${r.text?`<p class="small" style="margin:6px 0 0">“${esc(r.text)}”</p>`:''}
        ${PV.rvPhotos.grid(r.photos)}
        <div class="tiny muted" style="margin-top:4px">${esc(r.at||'')}</div></div>`; }).join('') ||
      `<div class="empty small">${PV.L('Chưa có đánh giá. Mở một địa điểm bạn đã ghé thăm để chấm sao, thả tim và viết cảm nhận.','No reviews yet. Open a place you visited to rate it, favourite it and write a note.')}</div>`}</div>`;
  m.appendChild(card);
  $$('.rv-item', card).forEach(el => PV.rvPhotos.bindGrid(el, all[el.dataset.pid]?.photos||[], pname(el.dataset.pid)));
  $$('[data-pid]', card).forEach(el => el.onclick = (e) => { if (e.target.closest('[data-zoom]')) return; PV.openPlace(el.dataset.pid); });
};
PV.myReview = id => RV()[id] || null;
})();
