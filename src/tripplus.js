/* ===== Personavel – richer itinerary: per-stop guide, day budget, plan check, real route ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const nm = p => (PV.lang === 'en' && p.name_en) ? p.name_en : p.name;
const vnd = n => PV.fmtVnd(Math.round(n / 1000) * 1000);

/* ---------- money ---------- */
const LEVEL = [[0,0],[20000,50000],[50000,150000],[150000,350000]];
/* per-person price range for a stop, read from the verified price text when possible */
PV.stopPrice = (p) => {
  const txt = ((p.price || [])[0] || '');
  if (/miễn phí|free/i.test(txt) && !/\d{2}\.\d{3}/.test(txt)) return {min:0, max:0, sure:true};
  const nums = [...txt.matchAll(/(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(k|nghìn|ngàn|đ|vnđ|vnd)?/gi)]
    .map(m => { let v = +m[1].replace(/[.,]/g, ''); if (/k|nghìn|ngàn/i.test(m[2]||'')) v *= 1000; return v; })
    .filter(v => v >= 5000 && v <= 5000000);
  if (nums.length) return {min: Math.min(...nums.slice(0, 2)), max: Math.max(...nums.slice(0, 2)), sure:true};
  const lv = LEVEL[p.price_level ?? (p.cats.includes('food') ? 1 : 0)] || LEVEL[1];
  return {min: lv[0], max: lv[1], sure:false};
};
/* transport cost for one leg (per person, rough) */
PV.legCost = (leg, mode) => {
  if (!leg) return {min:0, max:0};
  const km = leg.real ? leg.real.km : leg.km;
  switch (mode){
    case 'walk': return {min:0, max:0};
    case 'moto': return {min: 5000 + km*500, max: 5000 + km*800};          // xăng + gửi xe ~5.000đ
    case 'car':  return {min: 20000 + km*2000, max: 35000 + km*3000};       // xăng + gửi ô tô
    case 'taxi': { const f = k => k <= 2 ? 30000 : 30000 + (k-2)*12000; return {min: f(km)*.8, max: f(km)*1.25}; }
    case 'bus':  return {min:0, max:7000};
    case 'metro':return {min:7000, max:20000};
    default:     return {min:0, max:0};
  }
};
PV.tripBudget = (t) => {
  const rows = { see:{min:0,max:0,n:0}, food:{min:0,max:0,n:0}, shop:{min:0,max:0,n:0}, move:{min:0,max:0,n:0} };
  let unsure = 0;
  t.stops.forEach(s => { const p = PV.byId(s.id); if (!p) return;
    const pr = PV.stopPrice(p); if (!pr.sure) unsure++;
    const k = p.cats.includes('food') ? 'food' : p.cats.includes('shopping') ? 'shop' : 'see';
    if (k === 'shop'){ rows.shop.min += pr.min; rows.shop.max += pr.min; rows.shop.n++; }   // shopping is optional – count the entry level only
    else { rows[k].min += pr.min; rows[k].max += pr.max; rows[k].n++; }
    const lc = PV.legCost(s.leg, t.mode); rows.move.min += lc.min; rows.move.max += lc.max; if (s.leg) rows.move.n++;
  });
  const min = Object.values(rows).reduce((a, r) => a + r.min, 0), max = Object.values(rows).reduce((a, r) => a + r.max, 0);
  return {rows, min, max, unsure};
};

/* ---------- is the plan sensible? ---------- */
const OUTDOOR = p => p.cats.includes('checkin') && !p.cats.includes('food') && !/bảo tàng|nhà hát|trung tâm thương mại|tttm|chợ/i.test(p.name);
PV.planCheck = (t) => {
  const W = [], T = [], OK = [];
  if (!t.stops.length) return {score:0, W, T, OK};
  const st = PV.toMin(t.start || '08:00'), end = PV.toMin(t.stops[t.stops.length-1].leave || t.start);
  const span = end - st;
  // opening hours
  t.stops.forEach((s, i) => { const p = PV.byId(s.id); const a = PV.toMin(s.arrive || '0:0');
    if (p && PV.hourRanges(p) && !PV.openFor(p, a, 20)) W.push(T_(`Điểm ${i+1} (${nm(p)}) có thể chưa mở hoặc sắp đóng lúc ${s.arrive} – nên đổi giờ hoặc đổi thứ tự.`, `Stop ${i+1} (${nm(p)}) may be closed or about to close at ${s.arrive} – change the time or order.`)); });
  if (span > 11 * 60) W.push(T_(`Lịch trình kéo dài ${Math.round(span/60)} tiếng – khá mệt, nên bỏ bớt 1–2 điểm.`, `The day lasts ${Math.round(span/60)} hours – tiring; drop 1–2 stops.`));
  else OK.push(T_(`Thời lượng hợp lý: khoảng ${Math.floor(span/60)} giờ ${span%60} phút.`, `Reasonable length: about ${Math.floor(span/60)} h ${span%60} min.`));
  const sightsN = t.stops.filter(s => !(PV.foodType && PV.foodType(PV.byId(s.id)))).length;   // quán ăn không tính là điểm tham quan
  if (sightsN > 7) W.push(T_(`${sightsN} điểm tham quan trong một ngày là hơi dày – mỗi nơi sẽ rất vội.`, `${sightsN} sights in a day is a lot – each visit will feel rushed.`));
  // long walks
  if (t.mode === 'walk') t.stops.forEach((s, i) => { if (s.leg && s.leg.km > 2) W.push(T_(`Chặng đến điểm ${i+1} dài ${PV.fmtKm(s.leg.km)} – nên gọi xe cho chặng này.`, `The walk to stop ${i+1} is ${PV.fmtKm(s.leg.km)} – take a ride for this leg.`)); });
  // midday sun outdoors
  const hot = t.stops.filter(s => { const p = PV.byId(s.id); const a = PV.toMin(s.arrive||'0:0'); return p && OUTDOOR(p) && a >= 11*60 && a <= 14*60; });
  if (hot.length) T.push(T_(`${hot.map(s=>nm(PV.byId(s.id))).join(', ')} ngoài trời đúng giờ nắng gắt (11h–14h) – nên đổi sang buổi sáng hoặc chiều muộn, nhớ mang nước và kem chống nắng.`, `${hot.map(s=>nm(PV.byId(s.id))).join(', ')} is outdoors in the midday sun (11–14h) – move it to morning or late afternoon; bring water and sunscreen.`));
  // meals
  const meals = t.stops.filter(s => PV.foodType && PV.foodType(PV.byId(s.id)) === 'meal').map(s => PV.toMin(s.arrive||'0:0'));
  if (st <= 11*60+30 && end >= 13*60 && !meals.some(m => m >= 10*60+45 && m <= 14*60)) W.push(T_('Lịch trình đi qua giờ trưa nhưng chưa có bữa trưa.', 'The plan covers lunchtime but has no lunch stop.'));
  if (st <= 18*60 && end >= 19*60+30 && !meals.some(m => m >= 17*60 && m <= 21*60)) W.push(T_('Lịch trình đi qua giờ tối nhưng chưa có bữa tối.', 'The plan covers dinnertime but has no dinner stop.'));
  // hai lần ăn quá sát nhau (người dùng tự thêm quán): bữa chính cách bữa chính < 3 giờ, hoặc mọi lần ăn cách nhau < 1,5 giờ
  let lastF = null, close = 0;
  t.stops.forEach((s, i) => { const p = PV.byId(s.id), ft = PV.foodType && PV.foodType(p); if (!ft) return;
    const a = PV.toMin(s.arrive || '0:0');
    if (lastF){ const gap = a - lastF.leave; if (gap < 90 || (ft === 'meal' && lastF.ft === 'meal' && gap < 180)){ close++;
      W.push(T_(`Điểm ${lastF.i+1} và điểm ${i+1} đều là ăn uống, chỉ cách nhau ${Math.max(0, gap)} phút – lúc đó còn no, nên dời một quán sang bữa khác.`, `Stops ${lastF.i+1} and ${i+1} are both food, only ${Math.max(0, gap)} min apart – you will still be full; move one to another meal.`)); } }
    lastF = {i, ft, leave: PV.toMin(s.leave || s.arrive || '0:0')}; });
  if (meals.length && !close) OK.push(T_('Bữa ăn được xếp cách nhau hợp lý.', 'Meals are spaced sensibly.'));
  // traffic on each leg
  let prev = t.origin ? t.origin.c : null; const seen = new Set(); let rush = 0;
  t.stops.forEach((s, i) => { const p = PV.byId(s.id); if (!p) return; const dep = PV.toMin(s.arrive||'0:0') - (s.leg ? s.leg.min : 0);
    (PV.legNotices ? PV.legNotices(prev, p.coords, dep, t.mode) : []).forEach(n => { if (n.kind === 'rush'){ rush++; return; } if (!seen.has(n.text)){ seen.add(n.text); T.push(`${n.icon} ` + T_(`Chặng ${i+1}: `, `Leg ${i+1}: `) + n.text); } });
    prev = p.coords; });
  if (rush) T.push('🚦 ' + T_(`${rush} chặng rơi vào giờ cao điểm – dự trù thêm 10–20 phút.`, `${rush} leg(s) fall in rush hour – allow 10–20 extra minutes.`));
  // zig-zag: would a simple re-order be much shorter?
  const better = PV.betterOrder(t);
  if (better && better.saveKm > .8) T.push(T_(`Có thể sắp xếp lại thứ tự để bớt khoảng ${PV.fmtKm(better.saveKm)} đường đi.`, `Re-ordering could save about ${PV.fmtKm(better.saveKm)} of travel.`) + ' <button class="btn sm ghost" id="pcReorder">' + T_('Sắp xếp lại','Re-order') + '</button>');
  else OK.push(T_('Thứ tự các điểm hợp lý, ít đi vòng.', 'The order is efficient with little back-tracking.'));
  const score = Math.max(30, Math.min(100, 100 - W.length * 15 - T.length * 5));
  return {score, W, T, OK};
};
/* nearest-neighbour order from the start point, keeping meal stops near their time slot */
PV.betterOrder = (t) => {
  if (t.stops.length < 3 || !t.origin) return null;
  const len = (arr) => { let km = 0, c = t.origin.c; arr.forEach(s => { const p = PV.byId(s.id); km += PV.dist(c, p.coords); c = p.coords; }); return km; };
  const meals = new Set(t.stops.filter(s => s.tag).map(s => s.id));
  if (meals.size) return null;                      // meal slots fixed by time – keep the AI order
  const left = t.stops.slice(), out = []; let c = t.origin.c;
  while (left.length){ left.sort((a, b) => PV.dist(c, PV.byId(a.id).coords) - PV.dist(c, PV.byId(b.id).coords)); const s = left.shift(); out.push(s); c = PV.byId(s.id).coords; }
  const save = len(t.stops) - len(out);
  return save > 0 ? {order: out, saveKm: save} : null;
};

/* real road route: see routes.js (PV.osrm, PV.drawTripRoute) */

/* ---------- UI ---------- */
function stopDetails(t, i){
  const s = t.stops[i], p = PV.byId(s.id); if (!p) return '';
  const en = PV.lang === 'en';
  const hl = ((en && p.highlights_en) || p.highlights || []).filter(h => h && h.length < 90 && !/ – .{12,}/.test(h)).slice(0, 3);
  const pr = PV.stopPrice(p);
  const hours = (en && p.hours_en ? p.hours_en : p.hours || [])[0];
  const price = (en && p.price_en ? p.price_en : p.price || [])[0];
  const dep = PV.toMin(s.arrive||'0:0') - (s.leg ? s.leg.min : 0);
  const from = i ? PV.byId(t.stops[i-1].id).coords : (t.origin && t.origin.c);
  const notes = [...(PV.legNotices ? PV.legNotices(from, p.coords, dep, t.mode) : []), ...(PV.placeNotices ? PV.placeNotices(p, PV.toMin(s.arrive||'0:0')) : [])];
  const tips = PV.placeTips ? PV.placeTips(p).slice(0, 3) : [];
  return `<details class="sd"><summary>${T_('Chi tiết, giá & lưu ý','Details, prices & tips')}</summary><div class="sd-body">
    <div class="sd-row"><b>🎯 ${T_('Nên làm','What to do')}</b><span>${hl.length ? hl.map(esc).join(' · ') : esc(PV.L(p.desc, p.desc_en||p.desc)).slice(0, 160) + '…'}</span></div>
    <div class="sd-row"><b>🎧 ${T_('Nghe','Listen')}</b><span><button class="btn sm ghost" data-listen="${p.id}">▶ ${T_('Thuyết minh về ','Audio guide: ')}${esc(nm(p))}</button></span></div>
    <div class="sd-row"><b>📍 ${T_('Địa chỉ','Address')}</b><span>${esc(p.address)}${p.geo==='approx' ? ' <span class="tiny muted">('+T_('vị trí gần đúng','approx.')+')</span>' : ''}</span></div>
    ${hours ? `<div class="sd-row"><b>🕒 ${T_('Giờ mở cửa','Hours')}</b><span>${esc(hours)}</span></div>` : ''}
    <div class="sd-row"><b>🎟️ ${T_('Giá','Price')}</b><span>${price ? esc(price) : esc(PV.priceText(p.price_level))}<br><span class="tiny muted">${T_('Ước tính/người: ','Estimate/person: ')}${pr.max ? (pr.min === pr.max ? vnd(pr.min) : vnd(pr.min)+' – '+vnd(pr.max)) : T_('miễn phí','free')}${pr.sure ? '' : ' ('+T_('theo mức giá','by price level')+')'}</span></span></div>
    <div class="sd-row"><b>🔗 ${T_('Liên kết','Links')}</b><span class="sd-links">${p.maps_url ? `<a href="${esc(p.maps_url)}" target="_blank" rel="noopener">Google Maps</a>` : ''}${from ? `<a href="${PV.dirUrl(from, p.coords, t.mode)}" target="_blank" rel="noopener">${T_('Chỉ đường','Directions')}</a>` : ''}${p.source ? `<a href="${esc(p.source)}" target="_blank" rel="noopener">${esc(p.source_name || T_('Nguồn','Source'))}</a>` : ''}${p.phone ? `<a href="tel:${esc(String(p.phone).replace(/[^\d+]/g,''))}">📞 ${esc(p.phone)}</a>` : ''}</span></div>
    ${notes.length ? `<div class="sd-warn">${notes.map(n => `<div>${n.icon} ${esc(n.text)}${n.src ? ` <a href="${esc(n.src)}" target="_blank" rel="noopener" class="tiny">${T_('nguồn','source')}</a>` : ''}</div>`).join('')}</div>` : ''}
    ${tips.length ? `<div class="sd-tips">${tips.map(x => `<div>${x[0]} ${x[1]}</div>`).join('')}</div>` : ''}
  </div></details>`;
}
function summaryCard(t){
  const b = PV.tripBudget(t), c = PV.planCheck(t);
  const r = b.rows, row = (ic, label, x) => x.max || x.n ? `<tr><td>${ic} ${label}</td><td>${x.max ? (x.min === x.max ? vnd(x.min) : vnd(x.min) + ' – ' + vnd(x.max)) : T_('0đ','0đ')}</td></tr>` : '';
  const col = c.score >= 80 ? '#2E9E6B' : c.score >= 60 ? '#D99A00' : '#D2553F';
  return `<section class="card tripx" id="tripx">
    <div class="tx-grid">
      <div class="tx-budget"><h3>💰 ${T_('Chi phí ước tính cho ngày này','Estimated cost for the day')}</h3>
        <table class="tx-tab">${row('🏛️', T_('Vé tham quan','Tickets'), r.see)}${row('🍜', T_('Ăn uống','Food & drinks'), r.food)}${row('🛍️', T_('Mua sắm (chưa tính tiền mua hàng)','Shopping (purchases not included)'), r.shop)}${row(PV.MODE_IC[t.mode]||'🚗', T_('Di chuyển','Getting around') + ' (' + PV.MODES[t.mode].name + ')', r.move)}
          <tr class="tx-total"><td>${T_('Tổng / người','Total / person')}</td><td>${vnd(b.min)} – ${vnd(b.max)}</td></tr></table>
        <p class="tiny muted">${T_('Giá vé lấy từ thông tin đã xác minh của từng điểm; quán ăn và di chuyển là ước tính theo mức giá phổ biến','Tickets come from each place’s verified info; food and transport are typical-price estimates')}${b.unsure ? T_(` (${b.unsure} điểm chưa có giá cụ thể)`, ` (${b.unsure} place(s) without an exact price)`) : ''}.</p></div>
      <div class="tx-check"><h3>🧠 ${T_('Đánh giá lịch trình','Plan check')} <span class="tx-score" style="--c:${col}">${c.score}/100</span></h3>
        <ul class="tx-list">${c.W.map(x => `<li class="w">⚠️ ${x}</li>`).join('')}${c.T.map(x => `<li class="t">💡 ${x}</li>`).join('')}${c.OK.map(x => `<li class="ok">✅ ${esc(x)}</li>`).join('')}</ul></div>
    </div>
    <div class="tx-actions">
      <button class="btn" id="navStart">🧭 ${T_('Bắt đầu dẫn đường','Start navigation')}</button>
      ${t.origin && t.stops[0] ? `<a class="btn ghost" href="${PV.liveTrafficUrl(t.origin.c, PV.byId(t.stops[0].id).coords, t.mode)}" target="_blank" rel="noopener">🚦 ${T_('Xem kẹt xe trực tiếp','Live traffic')}</a>` : ''}
    </div>
    <p class="tiny muted" style="margin:8px 0 0">${T_('Tình trạng tai nạn, kẹt xe theo thời gian thực xem trên Google Maps; Personavel cảnh báo giờ cao điểm, phố cấm xe, công trình thi công và điểm hay bị chèo kéo dựa trên thông báo chính thức.','Live accidents and jams are shown in Google Maps; Personavel warns about rush hours, car-free streets, roadworks and touting hotspots based on official notices.')}</p>
  </section>`;
}

const _trip = PV.views.trip;
PV.views.trip = (m) => {
  _trip(m);
  const t = state.trip; if (!t.stops.length) return;
  const cards = $$('#stops .stopcard:not(.origin)', m);
  cards.forEach((c, i) => { const body = c.querySelector(':scope > div[style*="flex:1"]'); if (body) body.insertAdjacentHTML('beforeend', stopDetails(t, i)); });
  $$('[data-listen]', m).forEach(b => b.onclick = (e) => { e.preventDefault(); PV.narrate(PV.byId(b.dataset.listen), b); });
  const host = $('#stops', m).closest('.grid'); host.insertAdjacentHTML('afterend', summaryCard(t));
  const ro = $('#pcReorder', m); if (ro) ro.onclick = () => { const b = PV.betterOrder(t); if (!b) return; t.stops = b.order; PV.retime(t); PV.save('trip'); PV.views.trip(m); PV.toast(T_('Đã sắp xếp lại lịch trình','Itinerary re-ordered')); };
  $('#navStart', m).onclick = () => PV.navConfirm ? PV.navConfirm(t) : null;
  if (PV.drawTripRoute) PV.drawTripRoute(t);
};
})();
