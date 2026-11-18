/* ===== Personavel – "Địa điểm đã khám phá": tap the visited count to see every place you have been ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const L = (vi, en) => PV.L(vi, en);
const nm = p => (PV.lang === 'en' && p.name_en) ? p.name_en : p.name;
const toTime = (s) => { const m = String(s||'').match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/); return m ? new Date(+m[3], +m[2]-1, +m[1]).getTime() : 0; };
const shortAddr = (a) => String(a||'').split(',').slice(0, 2).join(',').trim();

function items(){
  return Object.entries(state.visited || {})
    .map(([id, date]) => ({p: PV.byId(id), date}))
    .filter(x => x.p)
    .sort((a, b) => toTime(b.date) - toTime(a.date));
}

PV.visitedSheet = () => {
  const all = items();
  const cats = [...new Set(all.map(x => PV.mainCat(x.p)))];
  let filter = 'all', q = '';
  const row = ({p, date}) => {
    const c = PV.CATS[PV.mainCat(p)] || {emoji:'📍', color:'#5B9BD5', name:''};
    const r = PV.myReview ? PV.myReview(p.id) : null;
    return `<li class="vs-item" data-pid="${p.id}">
      <button class="vs-main" data-open="${p.id}" aria-label="${esc(nm(p))}">
        ${PV.img(p.id) ? `<img class="vs-thumb" src="${PV.thumb(p.id)}" alt="" loading="lazy" decoding="async">` : `<span class="vs-thumb vs-ph" style="background:${c.color}22;color:${c.color}">${c.emoji}</span>`}
        <span class="vs-txt"><b>${esc(nm(p))}</b>
          <span class="vs-addr">📍 ${esc(shortAddr(p.address))}</span>
          <span class="vs-meta"><span class="vs-cat" style="--c:${c.color}">${c.emoji} ${esc(PV.tr ? PV.tr(c.name.split(' –')[0]) : c.name)}</span>${date ? `<span>🗓️ ${esc(date)}</span>` : ''}${r && r.stars ? `<span class="vs-star">★ ${r.stars}</span>` : ''}${r && r.fav ? '<span>❤</span>' : ''}</span>
        </span>
      </button>
      <button class="vs-map" data-map="${p.id}" aria-label="${L('Xem trên bản đồ','Show on map')}" title="${L('Xem trên bản đồ','Show on map')}"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg></button>
    </li>`;
  };
  const list = () => {
    const nq = PV.norm(q);
    const xs = all.filter(x => (filter === 'all' || PV.mainCat(x.p) === filter) && (!nq || PV.norm(x.p.name + ' ' + (x.p.name_en||'') + ' ' + x.p.address).includes(nq)));
    return xs.length ? `<ul class="vs-list">${xs.map(row).join('')}</ul>` : `<div class="vs-empty">${L('Không có địa điểm nào khớp.','No matching places.')}</div>`;
  };
  const html = all.length ? `
    <div class="vs-head">
      <div class="vs-grab" aria-hidden="true"></div>
      <div class="row" style="align-items:center;gap:8px"><h3 style="margin:0">🧭 ${L('Địa điểm đã khám phá','Places you have visited')}</h3><span class="spacer"></span><button class="vs-x" data-close aria-label="${L('Đóng','Close')}">✕</button></div>
      <p class="tiny muted" style="margin:4px 0 10px">${all.length} ${L('địa điểm','places')} · ${cats.length} ${L('nhóm','categories')} · ${L('chạm vào một nơi để xem chi tiết','tap a place for details')}</p>
      ${all.length > 5 ? `<input class="input vs-search" id="vsQ" type="search" placeholder="${L('Tìm trong danh sách…','Search the list…')}" autocomplete="off">` : ''}
      <div class="vs-chips" role="tablist">${[['all', '✨ ' + L('Tất cả','All') + ` (${all.length})`], ...cats.map(k => [k, `${PV.CATS[k].emoji} ${PV.tr ? PV.tr(PV.CATS[k].name.split(' –')[0]) : PV.CATS[k].name.split(' –')[0]} (${all.filter(x=>PV.mainCat(x.p)===k).length})`])].map(([k, t]) => `<button class="chip ${k==='all'?'on':''}" data-f="${k}">${esc(t)}</button>`).join('')}</div>
    </div>
    <div class="vs-body" id="vsBody">${list()}</div>`
  : `<div class="vs-head"><div class="vs-grab" aria-hidden="true"></div><div class="row"><h3 style="margin:0">🧭 ${L('Địa điểm đã khám phá','Places you have visited')}</h3><span class="spacer"></span><button class="vs-x" data-close aria-label="${L('Đóng','Close')}">✕</button></div></div>
     <div class="vs-empty"><div style="font-size:44px">🗺️</div><b>${L('Bạn chưa ghé địa điểm nào','You have not visited any place yet')}</b><p class="small muted">${L('Mở một địa điểm trên bản đồ và bấm “Tôi đã ghé thăm” để bắt đầu sưu tập.','Open a place on the map and tap “I have visited” to start collecting.')}</p><a class="btn" href="#map" data-close>${L('Mở bản đồ','Open the map')}</a></div>`;

  PV.modal(html, (bg, close) => {
    bg.classList.add('vs-bg'); bg.querySelector('.modal').classList.add('vs-sheet');
    const body = $('#vsBody', bg);
    const bindList = () => {
      $$('[data-open]', bg).forEach(b => b.onclick = () => { close(); PV.openPlace(b.dataset.open); });
      $$('[data-map]', bg).forEach(b => b.onclick = () => { close(); PV.pendingPlace = b.dataset.map; if (location.hash.split('?')[0] === '#map' && PV.focusPlace) PV.focusPlace(b.dataset.map); else location.hash = '#map'; });
    };
    $$('.vs-chips .chip', bg).forEach(c => c.onclick = () => { filter = c.dataset.f; $$('.vs-chips .chip', bg).forEach(x => x.classList.toggle('on', x === c)); body.innerHTML = list(); bindList(); });
    const s = $('#vsQ', bg); if (s) s.oninput = () => { q = s.value; body.innerHTML = list(); bindList(); };
    bindList();
    // swipe the sheet down to close (phones)
    const sheet = bg.querySelector('.vs-sheet'), grab = bg.querySelector('.vs-head');
    let y0 = null, dy = 0;
    grab.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; dy = 0; sheet.style.transition = 'none'; }, {passive:true});
    grab.addEventListener('touchmove', e => { if (y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sheet.style.transform = `translateY(${dy}px)`; }, {passive:true});
    grab.addEventListener('touchend', () => { sheet.style.transition = ''; if (dy > 90) close(); else sheet.style.transform = ''; y0 = null; });
    const onKey = e => { if (e.key === 'Escape'){ close(); document.removeEventListener('keydown', onKey); } };
    document.addEventListener('keydown', onKey);
  });
};

/* any element with data-act="visited" opens the list (home stat, profile stat…) */
document.addEventListener('click', e => { const t = e.target.closest('[data-act="visited"]'); if (t){ e.preventDefault(); PV.visitedSheet(); } });
})();
