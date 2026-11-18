/* ===== Personavel – small UX helpers: floating robot that steps aside, starter card for new travellers ===== */
(function(){
'use strict';
const {$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);

/* robot button: hides while scrolling down, comes back when scrolling up or stopping at the top */
let lastY = scrollY, tick = false;
addEventListener('scroll', () => {
  if (tick) return; tick = true;
  requestAnimationFrame(() => {
    const fab = document.getElementById('fab'), y = scrollY;
    if (fab){ if (y > lastY + 6 && y > 120) fab.classList.add('away'); else if (y < lastY - 6 || y < 60) fab.classList.remove('away'); }
    lastY = y; tick = false;
  });
}, {passive: true});
addEventListener('hashchange', () => { const fab = document.getElementById('fab'); if (fab) fab.classList.remove('away'); document.body.dataset.page = (location.hash || '#home').slice(1); });
document.addEventListener('DOMContentLoaded', () => { document.body.dataset.page = (location.hash || '#home').slice(1); });

/* profile: a new traveller sees three first steps instead of a row of zeros */
const _profile = PV.views.profile;
PV.views.profile = (m) => {
  _profile(m);
  const fresh = !Object.keys(state.visited || {}).length && !(state.points > 0) && !(state.diaries || []).length;
  const grid = m.querySelector('.grid.g3.keep'); if (!fresh || !grid) return;
  grid.outerHTML = `<div class="starter" role="list">
    <b class="starter-h">${T_('Bắt đầu hành trình trong 3 bước','Start your journey in 3 steps')}</b>
    <a class="starter-i" role="listitem" href="#map"><span class="n">1</span><span><b>${T_('Mở bản đồ, chọn một nơi','Open the map, pick a place')}</b><small>${T_('Xem thuyết minh, giá vé và lưu ý khi ghé.','See the story, tickets and visiting tips.')}</small></span><i>›</i></a>
    <a class="starter-i" role="listitem" href="#trip"><span class="n">2</span><span><b>${T_('Tạo lịch trình đầu tiên','Create your first itinerary')}</b><small>${T_('Chọn điểm xuất phát, AI xếp lịch hợp lý cho bạn.','Pick a start point and get a sensible plan.')}</small></span><i>›</i></a>
    <a class="starter-i" role="listitem" href="#collection"><span class="n">3</span><span><b>${T_('Ghé thăm và nhận dấu mộc','Visit and collect stamps')}</b><small>${T_('Bấm “Tôi đã ghé thăm” để mở huy hiệu.','Tap “I have visited” to unlock badges.')}</small></span><i>›</i></a>
  </div>`;
};
})();
