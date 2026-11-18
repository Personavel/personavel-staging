/* ===== Personavel – badge grid + badge details popup (collection page and profile) =====
   • PV.badgeGrid(list) – equal cells, centred rows (also the last, shorter row) at every width
   • PV.badgeModal(id) – icon, name, description, how to unlock, date earned or progress (3/5)
   • every PV.modal now closes with Esc, keeps keyboard focus inside while open and gives focus back when closed */
(function(){
'use strict';
const {$, $$, esc} = PV;
const T_ = (vi, en) => PV.L(vi, en);

/* ---------- accessible modals (all PV.modal popups) ---------- */
const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
const focusables = (el) => [...el.querySelectorAll(FOCUSABLE)].filter(x => x.offsetParent !== null || x === document.activeElement);
const _modal = PV.modal;
PV.modal = (html, bind) => {
  const opener = document.activeElement;
  const close = _modal(html, bind);
  const bgs = $$('.modal-bg'); const bg = bgs[bgs.length - 1];
  if (!bg) return close;
  const box = bg.querySelector('.modal');
  box.setAttribute('aria-modal', 'true');
  if (!box.hasAttribute('aria-labelledby')){ const h = box.querySelector('h2,h3'); if (h){ h.id = h.id || 'mdl' + Date.now().toString(36); box.setAttribute('aria-labelledby', h.id); } }
  if (!box.hasAttribute('tabindex')) box.tabIndex = -1;
  const top = () => { const all = $$('.modal-bg'); return all[all.length - 1] === bg; };
  const onKey = (e) => {
    if (!top() || !document.body.contains(bg)) return;
    if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); bg.remove(); return; }
    if (e.key !== 'Tab') return;
    const f = focusables(box); if (!f.length){ e.preventDefault(); box.focus(); return; }
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))){ e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))){ e.preventDefault(); first.focus(); }
  };
  const onFocus = (e) => { if (top() && document.body.contains(bg) && !bg.contains(e.target)) { const f = focusables(box); (f[0] || box).focus(); } };
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('focusin', onFocus);
  // however the popup is closed (✕, backdrop, Esc, a button inside), clean up and hand focus back
  const mo = new MutationObserver(() => { if (document.body.contains(bg)) return;
    mo.disconnect(); document.removeEventListener('keydown', onKey, true); document.removeEventListener('focusin', onFocus);
    if (opener && document.body.contains(opener) && opener.focus) try { opener.focus({preventScroll: true}); } catch(e){} });
  mo.observe(document.body, {childList: true});
  requestAnimationFrame(() => { if (!box.contains(document.activeElement)){ const f = box.querySelector('[autofocus]') || focusables(box).find(x => !x.classList.contains('bm-x')) || box; try { f.focus({preventScroll: true}); } catch(e){} } });
  return close;
};

/* ---------- badge texts ---------- */
const INFO_ = () => ({
  b1: [T_('Bạn tìm hiểu quá khứ của Sài Gòn qua các bảo tàng, di tích và công trình văn hóa.', 'You discover Saigon’s past through its museums, monuments and cultural landmarks.')],
  b2: [T_('Bạn đã nếm thử hương vị Sài Gòn ở nhiều quán ăn khác nhau.', 'You have tasted Saigon at many different eateries.')],
  b3: [T_('Bạn tìm tới những quán được cẩm nang Michelin Guide giới thiệu.', 'You seek out places recommended by the Michelin Guide.')],
  b4: [T_('Bạn mang về những món quà và đặc sản đậm chất Sài Gòn.', 'You bring home gifts and specialities with a true Saigon flavour.')],
  b5: [T_('Bạn săn được những góc kiến trúc đẹp nhất để chụp ảnh.', 'You find the most photogenic architecture in the city.')],
  b6: [T_('Bạn đọc câu chuyện đằng sau tên những con đường Sài Gòn.', 'You read the stories behind Saigon’s street names.')],
  b7: [T_('Bạn lưu lại hành trình của mình thành một trang nhật ký.', 'You keep your journey as a diary page.')],
  b8: [T_('Bạn nghe hướng dẫn viên robot kể chuyện về các địa điểm.', 'You listen to the robot guide’s audio stories.')]
});
const HOW_ = () => ({
  b1: T_('Bấm “Tôi đã ghé thăm” ở 5 địa điểm nhóm Lịch sử – văn hóa.', 'Tap “I visited” at 5 History – culture places.'),
  b2: T_('Bấm “Tôi đã ghé thăm” ở 5 quán ăn.', 'Tap “I visited” at 5 eateries.'),
  b3: T_('Ghé 2 quán có biểu tượng Michelin trên bản đồ.', 'Visit 2 places marked Michelin on the map.'),
  b4: T_('Ghé 3 cửa hàng quà lưu niệm hoặc đặc sản.', 'Visit 3 souvenir or speciality shops.'),
  b5: T_('Ghé 4 điểm kiến trúc – check-in.', 'Visit 4 architecture / photo spots.'),
  b6: T_('Mở và đọc câu chuyện của 8 tên đường (trang Bản đồ → Tên đường).', 'Open and read the stories of 8 streets (Map → Street names).'),
  b7: T_('Ở trang Lịch trình, bấm “Lưu nhật ký” sau một chuyến đi.', 'On the Trip page, tap “Save diary” after a trip.'),
  b8: T_('Bấm nút nghe 🎧 ở 3 địa điểm.', 'Play the 🎧 audio guide at 3 places.')
});
const info = (id) => (INFO_()[id] || [''])[0];

/* ---------- the date a badge was earned (kept per profile) ---------- */
if (PV.USER_KEYS && !PV.USER_KEYS.includes('badgeDates')) PV.USER_KEYS.push('badgeDates');
const dates = () => PV.store.get('badgeDates', {}) || {};
const today = () => new Date().toLocaleDateString('vi-VN');
const _check = PV.checkBadges;
PV.checkBadges = (...a) => {
  const before = PV.store.get('badgesSeen', null);
  const r = _check ? _check(...a) : undefined;
  try {
    if (Array.isArray(before)){
      const d = dates(); let ch = false;
      PV.badges().filter(b => b.got && !before.includes(b.id) && !d[b.id]).forEach(b => { d[b.id] = today(); ch = true; });
      if (ch) PV.store.set('badgeDates', d);
    }
  } catch(e){}
  return r;
};

/* ---------- grid ---------- */
PV.badgeGrid = (list, opt = {}) => {
  list = list || PV.badges();
  const pin = PV.PIN ? PV.PIN() : '';
  return `<div class="badges bgrid${opt.compact ? ' compact' : ''}" role="list">${list.map((b, i) => {
    const pct = Math.min(100, Math.round(b.cur / b.max * 100));
    return `<button type="button" role="listitem" class="badge2 ${b.got ? 'got' : 'lock'}" data-badge="${b.id}" aria-haspopup="dialog"
        aria-label="${esc(b.name)} – ${b.got ? T_('đã đạt', 'earned') : `${Math.min(b.cur, b.max)}/${b.max}`}">
      <div class="hang">${pin}<div class="medal" style="animation-delay:-${(i * 0.73) % 3.4}s">${PV.medalSVG(b)}</div></div>
      <span class="bt"><b>${esc(b.name)}</b><span class="tiny muted">${esc(b.need)}</span></span>
      <span class="bp"><span class="bar"><i style="width:${pct}%"></i></span><span class="tiny">${b.got ? '✓ ' + T_('Đã đạt', 'Earned') : `${Math.min(b.cur, b.max)}/${b.max}`}</span></span>
    </button>`; }).join('')}</div>`;
};
PV.bindBadges = (root) => { if (PV.medalDefs) PV.medalDefs(); $$('.bgrid [data-badge]', root).forEach(el => { el.onclick = () => PV.badgeModal(el.dataset.badge); }); };

/* ---------- popup ---------- */
PV.badgeModal = (id) => {
  const all = PV.badges(); const b = all.find(x => x.id === id); if (!b) return;
  if (PV.medalDefs) PV.medalDefs();
  const d = dates()[id]; const cur = Math.min(b.cur, b.max); const pct = Math.round(cur / b.max * 100);
  PV.modal(`<div class="bmodal ${b.got ? 'got' : 'lock'}">
      <button type="button" class="bm-x" data-close aria-label="${T_('Đóng', 'Close')}">✕</button>
      <div class="bm-medal">${PV.medalSVG(b)}</div>
      <h3 class="bm-name">${esc(b.name)}</h3>
      <span class="bm-state">${b.got ? '🏅 ' + T_('Đã đạt', 'Earned') : '🔒 ' + T_('Chưa mở khóa', 'Locked')}</span>
      <p class="bm-desc">${esc(info(id))}</p>
      <div class="bm-how"><b>${b.got ? T_('Điều kiện đạt', 'How it was earned') : T_('Cách mở khóa', 'How to unlock')}</b><span>${esc(b.need)}</span><span class="tiny muted">${esc(HOW_()[id] || '')}</span></div>
      ${b.got
        ? `<div class="bm-date">📅 ${d ? T_('Đạt ngày ', 'Earned on ') + esc(d) : T_('Đã đạt (trước khi web ghi ngày)', 'Earned (before dates were recorded)')}</div>`
        : `<div class="bm-prog"><div class="row"><span class="small">${T_('Tiến độ', 'Progress')}</span><span class="spacer"></span><b>${cur}/${b.max}</b></div>
           <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${b.max}" aria-valuenow="${cur}" aria-label="${T_('Tiến độ', 'Progress')}"><i style="width:${pct}%"></i></div>
           <span class="tiny muted">${T_(`Còn ${b.max - cur} nữa là mở khóa`, `${b.max - cur} more to unlock`)}</span></div>`}
      <button type="button" class="btn ghost sm bm-ok" data-close>${T_('Đóng', 'Close')}</button>
    </div>`, (bg) => { bg.classList.add('bm-bg'); });
};

/* ---------- profile: show the badge grid too ---------- */
const _profile = PV.views.profile;
PV.views.profile = (m, ...rest) => {
  const r = _profile(m, ...rest);
  try {
    const list = PV.badges(); const got = list.filter(b => b.got).length;
    const host = m.querySelector('.grid.g2');
    if (host && !m.querySelector('#pbadges')){
      host.insertAdjacentHTML('afterend', `<section class="card pbadges" id="pbadges" style="margin-top:18px"><div class="row"><h3 style="margin:0">🏅 ${T_('Huy hiệu', 'Badges')}</h3><span class="spacer"></span><span class="small muted">${got}/${list.length}</span></div>
        <p class="tiny muted" style="margin:4px 0 10px">${T_('Bấm vào huy hiệu để xem chi tiết và cách mở khóa.', 'Tap a badge to see details and how to unlock it.')}</p>${PV.badgeGrid(list, {compact: true})}</section>`);
      PV.bindBadges(m);
      // the "badges" counter jumps to the grid
      const stat = [...m.querySelectorAll('.stat')].find(s => /huy hiệu|badges/i.test(s.textContent));
      if (stat && stat.tagName !== 'BUTTON'){ stat.classList.add('stat-link'); stat.setAttribute('role', 'button'); stat.tabIndex = 0;
        const go = () => $('#pbadges').scrollIntoView({behavior: PV.state.settings.reduce ? 'auto' : 'smooth', block: 'start'});
        stat.onclick = go; stat.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); go(); } }; }
    }
  } catch(e){ console.info('[badges]', e); }
  return r;
};
})();
