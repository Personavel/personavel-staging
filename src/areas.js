/* ===== Personavel – area filter (new wards, with the old district) for the Map and the Collection =====
   Data: data/areas.json (made by the data team: src/tools/assign_area.py). No file → no filter.
   The choice is kept in the address: #map?area=xuan-hoa · #collection?area=ben-thanh */
(function(){
'use strict';
const {$, $$, esc} = PV;
const T_ = (vi, en) => PV.L(vi, en);
let AREAS = window.PV_AREAS || null, loading = null;
const load = () => {
  if (AREAS) return Promise.resolve(AREAS);
  return loading = loading || fetch('data/areas.json', {cache: 'no-cache'}).then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(j => { if (!j || !Array.isArray(j.areas) || !j.places) throw 0; AREAS = j; return j; })
    .catch(() => { console.info('[Personavel] Chưa có data/areas.json – ẩn bộ lọc khu vực.'); AREAS = false; return false; });
};
const fold = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase();
const param = () => { const q = (location.hash.split('?')[1] || ''); const m = q.match(/(?:^|&)area=([a-z0-9-]+)/); return m ? m[1] : null; };
const view = () => (location.hash || '#home').slice(1).split('?')[0];
PV.areaSel = () => { const a = param(); return a && AREAS && AREAS.areas.some(x => x.slug === a) ? a : null; };
PV.areaOf = (id) => AREAS && AREAS.places[id] || null;
PV.areaOk = (p) => { const a = PV.areaSel(); return !a || PV.areaOf(p.id) === a; };
const setArea = (slug) => {
  const v = view(); const url = '#' + v + (slug ? '?area=' + slug : '');
  history.replaceState(null, '', location.pathname + location.search + url);
  if (v === 'map' && PV.mapRedraw) PV.mapRedraw();
  if (v === 'collection') filterCollection();
  $$('.ar-btn').forEach(paintBtn);
};
const label = (a) => a ? `${a.ward.replace(/^Phường /, T_('Phường ', 'Ward '))}` : T_('Tất cả khu vực', 'All areas');
const sub = (a) => a && a.district_old ? T_(`trước đây ${a.district_old}`, `formerly ${a.district_old.replace(/^Quận /, 'District ')}`) : '';
const paintBtn = (b) => { const a = AREAS && AREAS.areas.find(x => x.slug === PV.areaSel());
  b.innerHTML = `📍 <span>${esc(label(a))}</span>${a ? `<small>${esc(sub(a))}</small>` : ''}<i aria-hidden="true">▾</i>`; b.classList.toggle('on', !!a); };

/* dropdown with a search box; wards grouped by their old district, count of places in each */
function openPicker(btn){
  if (!AREAS) return;
  const cur = PV.areaSel();
  const groups = {};
  AREAS.areas.slice().sort((a, b) => b.count - a.count).forEach(a => { (groups[a.district_old || '—'] = groups[a.district_old || '—'] || []).push(a); });
  const order = Object.keys(groups).sort((a, b) => groups[b].reduce((s, x) => s + x.count, 0) - groups[a].reduce((s, x) => s + x.count, 0));
  const total = Object.keys(AREAS.places).length;
  PV.modal(`<h3>📍 ${T_('Chọn khu vực', 'Choose an area')}</h3><p class="tiny muted" style="margin-top:-4px">${T_('Theo phường/xã mới (từ 1/7/2025), kèm quận cũ.', 'By the new wards (since 1 July 2025), with the old district.')}</p>
    <input class="input" id="arQ" type="search" placeholder="${T_('Tìm phường hoặc quận cũ…', 'Search ward or old district…')}" autocomplete="off" aria-controls="arL">
    <div class="ar-list" id="arL" role="listbox" aria-label="${T_('Khu vực', 'Areas')}">
      <button type="button" role="option" class="ar-opt${!cur ? ' on' : ''}" data-a="" aria-selected="${!cur}"><span>${T_('Tất cả khu vực', 'All areas')}</span><b>${total}</b></button>
      ${order.map(d => `<div class="ar-grp" data-g="${esc(fold(d))}"><div class="ar-h">${esc(d === '—' ? T_('Khác', 'Other') : T_('Quận cũ: ' + d, 'Old district: ' + d.replace(/^Quận /, 'District ')))}</div>${groups[d].map(a => `<button type="button" role="option" class="ar-opt${a.slug === cur ? ' on' : ''}" data-a="${a.slug}" data-k="${esc(fold(a.ward + ' ' + a.district_old))}" aria-selected="${a.slug === cur}"><span>${esc(label(a))}<small>${esc(sub(a))}</small></span><b>${a.count}</b></button>`).join('')}</div>`).join('')}
    </div>`, (bg, close) => {
    bg.classList.add('ar-bg');
    const q = $('#arQ', bg);
    q.oninput = () => { const k = fold(q.value.trim());
      $$('.ar-opt[data-k]', bg).forEach(o => { o.hidden = !!k && !o.dataset.k.includes(k); });
      $$('.ar-grp', bg).forEach(g => { g.hidden = ![...g.querySelectorAll('.ar-opt')].some(o => !o.hidden); }); };
    $$('.ar-opt', bg).forEach(o => o.onclick = () => { close(); setArea(o.dataset.a || null); btn && btn.focus(); });
    setTimeout(() => q.focus(), 30);
  });
}
const control = () => `<div class="ar-wrap"><b class="small">${T_('Khu vực', 'Area')}</b><button type="button" class="ar-btn" aria-haspopup="dialog"></button></div>`;
const bindControl = (root) => $$('.ar-btn', root).forEach(b => { paintBtn(b); b.onclick = () => openPicker(b); });

/* ---------- map: in the filter card ---------- */
const _map = PV.views.map;
PV.views.map = (m, ...a) => {
  const r = _map(m, ...a);
  load().then(ok => { if (!ok || !document.body.contains(m) || view() !== 'map') return;
    const card = m.querySelector('#onlyrec'); if (!card || m.querySelector('.ar-wrap')) return;
    card.insertAdjacentHTML('beforebegin', control()); bindControl(m);
    if (PV.areaSel() && PV.mapRedraw) PV.mapRedraw(); });
  return r;
};

/* ---------- collection: filter the stamps ---------- */
function filterCollection(){
  const m = document.getElementById('main'); if (!m) return;
  const a = PV.areaSel();
  $$('.stamps2 [data-pid]', m).forEach(el => { el.hidden = !!a && PV.areaOf(el.dataset.pid) !== a; });
  $$('.coll-title', m).forEach(h => { const box = h.nextElementSibling, c = h.querySelector('.cnt');
    if (!box || !c || !box.querySelector('[data-pid]')) return;
    c.textContent = box.querySelectorAll('[data-pid]:not([hidden])').length; });
  let note = m.querySelector('#arNote');
  const shown = $$('.stamps2 [data-pid]:not([hidden])', m).length;
  if (a && !shown){ if (!note){ m.querySelector('.ar-wrap').insertAdjacentHTML('afterend', `<p class="small muted" id="arNote"></p>`); note = m.querySelector('#arNote'); } note.textContent = T_('Không có dấu mộc nào ở khu vực này.', 'No stamps in this area.'); }
  else if (note) note.remove();
}
const _coll = PV.views.collection;
PV.views.collection = (m, ...a) => {
  const r = _coll(m, ...a);
  load().then(ok => { if (!ok || !document.body.contains(m) || view() !== 'collection' || m.querySelector('.ar-wrap')) return;
    const first = m.querySelectorAll('.coll-title')[1];   // before “Dấu mộc đã nhận”
    if (!first) return;
    first.insertAdjacentHTML('beforebegin', `<div class="card ar-card">${control()}</div>`); bindControl(m); filterCollection(); });
  return r;
};
load();
})();
