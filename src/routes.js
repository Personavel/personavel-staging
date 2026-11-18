/* ===== Personavel – real street routes (OSRM) for the itinerary =====
   • driving: router.project-osrm.org · walking: routing.openstreetmap.de/routed-foot
   • "Đi bộ | Xe" switch, distance and time of every leg + total, tap a leg to zoom the map to it
   • cached in IndexedDB by (coordinates, mode) for 30 days
   • on error: dashed straight lines, a notice and "Open in Google Maps" */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const DAY = 864e5, KEEP = 30 * DAY;
const byOf = (mode) => (mode === 'walk' || mode === 'metro' || mode === 'foot') ? 'foot' : 'car';
const URL_OF = {
  car: (c) => `https://router.project-osrm.org/route/v1/driving/${c}`,
  foot: (c) => `https://routing.openstreetmap.de/routed-foot/route/v1/foot/${c}`
};
const coordStr = (pts) => pts.map(p => (+p[0]).toFixed(6) + ',' + (+p[1]).toFixed(6)).join(';');
const keyOf = (pts, by) => by + '|' + pts.map(p => (+p[0]).toFixed(5) + ',' + (+p[1]).toFixed(5)).join(';');

/* ---------- IndexedDB cache (memory only if IndexedDB is unavailable) ---------- */
const mem = new Map();
let dbp = null;
const db = () => dbp || (dbp = new Promise((res) => {
  try { const r = indexedDB.open('pv-routes', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('r');
    r.onsuccess = () => res(r.result); r.onerror = () => res(null); r.onblocked = () => res(null);
  } catch(e){ res(null); }
}));
const idb = async (mode, fn) => { const d = await db(); if (!d) return null;
  return new Promise((res) => { try { const tx = d.transaction('r', mode); const q = fn(tx.objectStore('r')); tx.oncomplete = () => res(q && q.result); tx.onerror = tx.onabort = () => res(null); } catch(e){ res(null); } }); };
const cacheGet = async (k) => { const m = mem.get(k); if (m && Date.now() - m.at < KEEP) return m.route;
  const v = await idb('readonly', s => s.get(k)); if (v && Date.now() - v.at < KEEP){ mem.set(k, v); return v.route; } return null; };
const cachePut = (k, route) => { const v = {at: Date.now(), route}; mem.set(k, v); idb('readwrite', s => s.put(v, k)); };
let swept = false;
const sweep = () => { if (swept) return; swept = true;
  idb('readwrite', s => { const c = s.openCursor(); c.onsuccess = () => { const cur = c.result; if (!cur) return; if (!cur.value || Date.now() - cur.value.at > KEEP) cur.delete(); cur.continue(); }; return c; }); };

/* ---------- router ---------- */
const fetchRoute = async (pts, by, steps) => {
  const url = URL_OF[by](coordStr(pts)) + `?overview=full&geometries=geojson${steps ? '&steps=true' : ''}`;
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 12000);
  try { const r = await fetch(url, {signal: ctl.signal}); if (!r.ok) throw new Error('osrm ' + r.status);
    const j = await r.json(); if (j.code !== 'Ok' || !j.routes || !j.routes[0]) throw new Error('osrm ' + (j.code || 'empty'));
    const route = j.routes[0]; route.waypoints = (j.waypoints || []).map(w => w.location); return route; }
  finally { clearTimeout(to); }
};
/* used by turn-by-turn navigation too (nav.js); results without steps are cached */
PV.osrm = async (pts, mode, steps = false) => {
  const by = byOf(mode);
  if (steps) return fetchRoute(pts, by, true);
  const k = keyOf(pts, by); const hit = await cacheGet(k); if (hit) return hit;
  const r = await fetchRoute(pts, by, false);
  cachePut(k, {distance: r.distance, duration: r.duration, geometry: r.geometry, waypoints: r.waypoints, legs: (r.legs || []).map(l => ({distance: l.distance, duration: l.duration}))});
  sweep();
  return r;
};

/* split the route line into legs at the snapped waypoints */
const splitLegs = (route, n) => {
  const cs = (route.geometry && route.geometry.coordinates) || []; const wps = route.waypoints || [];
  if (!cs.length || wps.length !== n + 1) return null;
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const cut = [0]; let from = 0;
  for (let w = 1; w < wps.length - 1; w++){ let best = from, bd = Infinity;
    for (let i = from; i < cs.length; i++){ const d = d2(cs[i], wps[w]); if (d < bd){ bd = d; best = i; } }
    cut.push(best); from = best; }
  cut.push(cs.length - 1);
  return cut.slice(0, -1).map((a, i) => cs.slice(a, cut[i + 1] + 1));
};
const gmapsUrl = (pts, by) => {
  const ll = p => `${p[1]},${p[0]}`;
  const mid = pts.slice(1, -1).map(ll).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${ll(pts[0])}&destination=${ll(pts[pts.length - 1])}${mid ? '&waypoints=' + encodeURIComponent(mid) : ''}&travelmode=${by === 'foot' ? 'walking' : 'driving'}`;
};
const fmtMin = (s) => { const m = Math.max(1, Math.round(s / 60)); return m < 60 ? `${m} ${T_('phút', 'min')}` : `${Math.floor(m / 60)} ${T_('giờ', 'h')} ${m % 60 ? (m % 60) + ' ' + T_('phút', 'min') : ''}`.trim(); };
const ATTR = () => `<span class="rt-attr">${T_('Tuyến đường', 'Routing')}: <a href="https://project-osrm.org/" target="_blank" rel="noopener">OSRM</a> · ${T_('dữ liệu bản đồ', 'map data')} © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">${T_('Những người đóng góp OpenStreetMap', 'OpenStreetMap contributors')}</a></span>`;

/* ---------- itinerary page: route panel under the map ---------- */
let seq = 0;
PV.drawTripRoute = async (t) => {
  const mp = PV._tripMap, note = $('#tripRouteNote');
  if (!note || !t || !t.stops.length) return;
  const stops = t.stops.map(s => PV.byId(s.id)).filter(p => p && p.coords);
  const pts = [...(t.origin && t.origin.c ? [t.origin.c] : []), ...stops.map(p => p.coords)];
  const names = [...(t.origin && t.origin.c ? [t.origin.name || T_('Xuất phát', 'Start')] : []), ...stops.map(p => PV.L(p.name, p.name_en || p.name))];
  if (pts.length < 2){ note.innerHTML = ''; return; }
  const by = t.routeBy || byOf(t.mode);
  const my = ++seq;
  const panel = (body) => `<div class="rt" id="rtPanel"><div class="rt-bar"><div class="rt-seg" role="group" aria-label="${T_('Cách đi', 'Travel by')}">
      <button type="button" data-by="foot" aria-pressed="${by === 'foot'}">🚶 ${T_('Đi bộ', 'Walk')}</button><button type="button" data-by="car" aria-pressed="${by === 'car'}">🛵 ${T_('Xe', 'Vehicle')}</button></div>
      <span class="rt-total" id="rtTotal" aria-live="polite"></span></div>${body}</div>`;
  note.classList.remove('tiny', 'muted');
  note.innerHTML = panel(`<p class="rt-wait tiny muted">⏳ ${T_('Đang tìm tuyến đường thật…', 'Finding the real route…')}</p>`);
  const bindSeg = () => $$('#rtPanel [data-by]').forEach(b => b.onclick = () => { if (b.dataset.by === (t.routeBy || byOf(t.mode))) return; t.routeBy = b.dataset.by; PV.save('trip'); PV.drawTripRoute(t); });
  bindSeg();
  // forget the previous solid line and leg highlight
  [PV._tripRoute, PV._tripLegHi].forEach(l => { try { l && l.remove(); } catch(e){} }); PV._tripRoute = PV._tripLegHi = null;
  if (PV._tripLine) PV._tripLine.setStyle({opacity: 1, dashArray: '8 8'});

  let route = null;
  try { route = await PV.osrm(pts, by); } catch(e){ route = null; }
  if (my !== seq || !document.body.contains(note)) return;
  const legs = [];
  const straight = !route;
  if (route){
    const parts = splitLegs(route, pts.length - 1);
    (route.legs || []).forEach((lg, i) => legs.push({km: lg.distance / 1000, sec: lg.duration, line: parts ? parts[i] : [pts[i], pts[i + 1]]}));
  } else {
    const speed = by === 'foot' ? 4.5 : 18;   // km/h, only for the rough estimate
    for (let i = 0; i < pts.length - 1; i++){ const km = PV.dist(pts[i], pts[i + 1]); legs.push({km, sec: km / speed * 3600, line: [pts[i], pts[i + 1]]}); }
  }
  const tot = legs.reduce((a, l) => ({km: a.km + l.km, sec: a.sec + l.sec}), {km: 0, sec: 0});
  note.innerHTML = panel(`
    ${straight ? `<div class="rt-err" role="status">⚠️ ${T_('Chưa tải được tuyến đường thật (mất mạng hoặc máy chủ chỉ đường đang bận). Bản đồ đang vẽ đường thẳng nét đứt nối các điểm; số km dưới đây là đường chim bay.', 'Could not load the real route (offline or the routing server is busy). The map shows dashed straight lines; distances below are as the crow flies.')}
        <a class="btn sm" href="${gmapsUrl(pts, by)}" target="_blank" rel="noopener">🗺️ ${T_('Mở trong Google Maps', 'Open in Google Maps')}</a></div>` : ''}
    <ol class="rt-legs">${legs.map((l, i) => `<li><button type="button" data-leg="${i}"><span class="rt-n">${i + 1}</span><span class="rt-nm">${esc(names[i])} → ${esc(names[i + 1])}</span>
      <span class="rt-v">${straight ? '~' : ''}${PV.fmtKm(l.km)} · ${straight ? '~' : ''}${fmtMin(l.sec)}</span></button></li>`).join('')}</ol>
    <p class="rt-foot tiny muted">${straight ? T_('Thời gian ước tính theo tốc độ trung bình.', 'Times estimated from average speed.') : T_('Bấm vào một chặng để phóng tới chặng đó.', 'Tap a leg to zoom to it.')} ${ATTR()}</p>`);
  $('#rtTotal').innerHTML = `${T_('Tổng', 'Total')}: <b>${straight ? '~' : ''}${PV.fmtKm(tot.km)}</b> · <b>${straight ? '~' : ''}${fmtMin(tot.sec)}</b>`;
  bindSeg();
  // store real leg values for the stop cards (tripplus reads s.leg.real)
  if (!straight){ const off = pts.length - stops.length; legs.forEach((l, i) => { const s = t.stops[i + 1 - off]; if (s && s.leg) s.leg.real = {km: l.km, min: Math.round(l.sec / 60)}; }); }
  if (!mp || !window.L || PV._tripMap !== mp) return;
  if (!straight){
    PV._tripRoute = L.geoJSON(route.geometry, {style: {color: '#2F6FA3', weight: 5, opacity: .9}}).addTo(mp);
    if (PV._tripLine) PV._tripLine.setStyle({opacity: .2});
  }
  $$('#rtPanel [data-leg]').forEach(b => b.onclick = () => {
    const l = legs[+b.dataset.leg]; const ll = l.line.map(c => [c[1], c[0]]);
    try { PV._tripLegHi && PV._tripLegHi.remove(); } catch(e){}
    PV._tripLegHi = L.polyline(ll, {color: '#0B3D91', weight: 8, opacity: .85, dashArray: straight ? '8 8' : null}).addTo(mp);
    mp.fitBounds(L.latLngBounds(ll).pad(.25), {animate: !state.settings.reduce});
    $$('#rtPanel [data-leg]').forEach(x => x.classList.toggle('on', x === b));
    const box = document.getElementById('tripmap'); if (box && box.getBoundingClientRect().top < 0) box.scrollIntoView({block: 'center', behavior: state.settings.reduce ? 'auto' : 'smooth'});
  });
};

/* ---------- map page: the itinerary line follows the streets too ---------- */
const _refresh = PV.refreshMapTrip;
if (_refresh) PV.refreshMapTrip = (...a) => {
  const r = _refresh(...a);
  const mp = PV._mapRef; const t = state.trip;
  try { PV._mapRoute && PV._mapRoute.remove(); } catch(e){} PV._mapRoute = null;
  if (!mp || !window.L || !t || t.stops.length < 2) return r;
  const pts = t.stops.map(s => PV.byId(s.id)).filter(p => p && p.coords).map(p => p.coords);
  const my = ++seq;
  PV.osrm(pts, t.routeBy || byOf(t.mode)).then(route => {
    if (my !== seq || PV._mapRef !== mp) return;
    mp.eachLayer(l => { if (l instanceof L.Polyline && l.options && l.options.dashArray === '8 8' && l.options.color === '#3D7FB8') l.setStyle({opacity: .2}); });
    PV._mapRoute = L.geoJSON(route.geometry, {style: {color: '#2F6FA3', weight: 5, opacity: .85}, interactive: false}).addTo(mp);
    if (mp.attributionControl) mp.attributionControl.addAttribution('<a href="https://project-osrm.org/" target="_blank" rel="noopener">OSRM</a>');
  }).catch(() => {});
  return r;
};
})();
