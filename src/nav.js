/* ===== Personavel – turn-by-turn navigation =====
   Real road route (OSRM), live GPS, spoken instructions in the chosen language,
   arrival alerts, off-route warning + automatic re-routing, traffic / tourist-trap notices.
   A "simulate" mode drives along the route so the feature can be tried anywhere. */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const T_ = (vi, en) => PV.L(vi, en);
const nm = p => (PV.lang === 'en' && p.name_en) ? p.name_en : p.name;
const M = (a, b) => PV.dist(a, b) * 1000;                       // metres between [lng,lat]
const fmtM = m => m >= 1000 ? (m/1000).toFixed(1).replace('.', PV.lang==='en'?'.':',') + ' km' : (Math.round(m/10)*10) + ' m';

/* ---------- voice ---------- */
let muted = false, lastSaid = '';
function say(text, force){
  if (muted || !('speechSynthesis' in window) || (!force && text === lastSaid)) return;
  lastSaid = text;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    const en = PV.lang === 'en'; u.lang = en ? 'en-US' : 'vi-VN'; u.rate = en ? 1 : .98;
    const v = speechSynthesis.getVoices().find(x => en ? /^en/i.test(x.lang) : /^vi/i.test(x.lang)); if (v) u.voice = v;
    speechSynthesis.speak(u);
  } catch(e){}
}
const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };
function notify(title, body){
  try { if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') new Notification(title, {body, icon:'img/t/h0.webp'}); } catch(e){}
}

/* ---------- instruction text (vi / en) ---------- */
const DIR_VI = {left:'rẽ trái', right:'rẽ phải', 'slight left':'chếch sang trái', 'slight right':'chếch sang phải', 'sharp left':'rẽ gắt sang trái', 'sharp right':'rẽ gắt sang phải', straight:'đi thẳng', uturn:'quay đầu'};
const DIR_EN = {left:'turn left', right:'turn right', 'slight left':'bear left', 'slight right':'bear right', 'sharp left':'turn sharp left', 'sharp right':'turn sharp right', straight:'go straight', uturn:'make a U-turn'};
const ARROW = {left:'↰', right:'↱', 'slight left':'↖', 'slight right':'↗', 'sharp left':'↰', 'sharp right':'↱', straight:'↑', uturn:'↶'};
const ORD_VI = ['', 'thứ nhất', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm'], ORD_EN = ['', 'first', 'second', 'third', 'fourth', 'fifth'];
function stepText(st, destName){
  const m = st.maneuver || {}, mod = m.modifier || 'straight', name = st.name || '';
  const en = PV.lang === 'en', D = en ? DIR_EN : DIR_VI;
  const onto = name ? (en ? ` onto ${name}` : ` vào đường ${name}`) : '';
  switch (m.type){
    case 'depart': return en ? `Head off${name ? ' along ' + name : ''}` : `Bắt đầu đi${name ? ' trên đường ' + name : ''}`;
    case 'arrive': return en ? `You will arrive at ${destName}` : `Bạn sẽ đến ${destName}`;
    case 'roundabout': case 'rotary': { const n = m.exit || 1; return en ? `At the roundabout take the ${ORD_EN[n] || n + 'th'} exit${onto}` : `Vào vòng xoay, ra ở lối ${ORD_VI[n] || 'số ' + n}${onto}`; }
    case 'continue': case 'new name': return mod === 'straight' ? (en ? `Continue straight${onto}` : `Đi thẳng${onto}`) : (en ? `${D[mod] || 'Continue'}${onto}` : `${cap(D[mod] || 'đi tiếp')}${onto}`);
    case 'fork': return en ? `Keep ${/left/.test(mod) ? 'left' : 'right'} at the fork${onto}` : `Đi về phía ${/left/.test(mod) ? 'bên trái' : 'bên phải'} ở ngã ba${onto}`;
    case 'end of road': return en ? `At the end of the road ${D[mod] || 'turn'}${onto}` : `Cuối đường, ${D[mod] || 'rẽ'}${onto}`;
    case 'merge': return en ? `Merge${onto}` : `Nhập làn${onto}`;
    default: return en ? `${cap(D[mod] || 'Continue')}${onto}` : `${cap(D[mod] || 'đi tiếp')}${onto}`;
  }
}
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const arrowOf = st => { const m = st.maneuver || {}; if (m.type === 'arrive') return '🏁'; if (m.type === 'roundabout' || m.type === 'rotary') return '⟳'; return ARROW[m.modifier] || '↑'; };

/* ---------- geometry ---------- */
function project(pos, coords, cum){
  // nearest point on the polyline → {off: metres from line, along: metres travelled}
  const k = Math.cos(pos[1] * Math.PI / 180) * 111320, ky = 110570;
  let best = {off: Infinity, along: 0};
  for (let i = 0; i < coords.length - 1; i++){
    const a = coords[i], b = coords[i+1];
    const ax = (a[0]-pos[0])*k, ay = (a[1]-pos[1])*ky, bx = (b[0]-pos[0])*k, by = (b[1]-pos[1])*ky;
    const dx = bx-ax, dy = by-ay, l2 = dx*dx+dy*dy; let t = l2 ? -(ax*dx+ay*dy)/l2 : 0; t = Math.max(0, Math.min(1, t));
    const off = Math.hypot(ax+t*dx, ay+t*dy);
    if (off < best.off) best = {off, along: cum[i] + t * (cum[i+1]-cum[i]), i};
  }
  return best;
}
const cumulative = coords => { const c = [0]; for (let i = 1; i < coords.length; i++) c.push(c[i-1] + M(coords[i-1], coords[i])); return c; };
const bearingTxt = (a, b) => { const y = Math.sin((b[0]-a[0])*Math.PI/180)*Math.cos(b[1]*Math.PI/180), x = Math.cos(a[1]*Math.PI/180)*Math.sin(b[1]*Math.PI/180) - Math.sin(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.cos((b[0]-a[0])*Math.PI/180);
  const deg = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360, i = Math.round(deg / 45) % 8;
  return PV.lang === 'en' ? ['north','north-east','east','south-east','south','south-west','west','north-west'][i] : ['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'][i]; };

/* ---------- navigation session ---------- */
let N = null;
const TH = mode => mode === 'walk' ? {far:60, near:18, off:35, arrive:30} : {far:250, near:45, off:55, arrive:55};

async function routeTo(from){
  const p = PV.byId(N.t.stops[N.idx].id);
  N.dest = p; N.steps = []; N.coords = [from, p.coords]; N.cum = cumulative(N.coords); N.spoken = {}; N.offN = 0; N.straight = true;
  try {
    const r = await PV.osrm([from, p.coords], N.t.mode, true);
    if (!N) return;
    N.coords = r.geometry.coordinates; N.cum = cumulative(N.coords); N.straight = false;
    let acc = 0; N.steps = r.legs[0].steps.map(s => { const o = {s, at: acc, text: stepText(s, nm(p)), arrow: arrowOf(s)}; acc += s.distance; return o; });
    N.total = r.distance; N.dur = r.duration;
  } catch(e){ N.total = M(from, p.coords); N.dur = N.total / (N.t.mode === 'walk' ? 1.3 : 5); }
  drawRoute();
}
function drawRoute(){
  if (!N.map) return;
  if (N.line) N.line.remove(); if (N.destMk) N.destMk.remove();
  N.line = L.polyline(N.coords.map(c => [c[1], c[0]]), {color: N.straight ? '#7AA7CF' : '#2F6FA3', weight: 7, opacity: .9, dashArray: N.straight ? '10 10' : null}).addTo(N.map);
  N.destMk = L.marker([N.dest.coords[1], N.dest.coords[0]], {icon: L.divIcon({className:'', iconSize:[38,38], iconAnchor:[19,34], html:`<div class="nav-dest">${N.idx+1}</div>`})}).addTo(N.map);
  N.map.fitBounds(N.line.getBounds().pad(.25));
  $('#navTo').innerHTML = `${T_('Đến','To')} <b>${esc(nm(N.dest))}</b> <span class="tiny">(${N.idx+1}/${N.t.stops.length})</span>`;
  // traffic & tourist-trap notices for this leg, spoken once
  const now = new Date(), min = now.getHours()*60 + now.getMinutes();
  const notes = [...(PV.legNotices ? PV.legNotices(N.pos, N.dest.coords, min, N.t.mode) : []), ...(PV.placeNotices ? PV.placeNotices(N.dest, min) : [])];
  $('#navNotes').innerHTML = notes.map(n => `<div class="nav-note ${n.kind}">${n.icon} ${esc(n.text)}</div>`).join('');
  const first = N.steps[0] ? N.steps[0].text : (T_('Đi về hướng ', 'Head ') + bearingTxt(N.pos, N.dest.coords));
  if (N.rerouted){ N.rerouted = false; say(T_(`Đã tìm được đường mới, còn khoảng ${fmtM(N.total)}. `, `New route found, about ${fmtM(N.total)} to go. `) + first + '.', true); return; }
  say(T_(`Bắt đầu dẫn đường đến ${nm(N.dest)}, khoảng ${fmtM(N.total)}. `, `Navigating to ${nm(N.dest)}, about ${fmtM(N.total)}. `) + first + '.' + (notes[0] && notes[0].kind !== 'trap' ? ' ' + T_('Lưu ý: ', 'Note: ') + notes[0].text : ''), true);
}

function update(pos, acc = 10){
  if (!N || N.arrived) return;
  N.pos = pos; N.acc = acc;
  if (N.me) N.me.setLatLng([pos[1], pos[0]]); else N.me = L.circleMarker([pos[1], pos[0]], {radius: 9, color: '#fff', weight: 3, fillColor: '#1F7AE0', fillOpacity: 1}).addTo(N.map);
  if (N.follow) N.map.panTo([pos[1], pos[0]], {animate: true});
  const th = TH(N.t.mode);
  const toDest = M(pos, N.dest.coords);
  if (toDest <= th.arrive) return arrive();
  const pr = project(pos, N.coords, N.cum);
  const left = Math.max(0, (N.total || N.cum[N.cum.length-1]) - pr.along);
  // off route?
  if (!N.straight && pr.off > th.off + Math.min(acc, 30)){
    N.offN++;
    if (N.offN === 2){ buzz([200, 100, 200]); say(T_('Bạn đang đi lệch tuyến đường. Mình đang tìm đường mới.', 'You are off the route. Finding a new route.'), true); setBanner('⚠️', T_('Bạn đang đi sai đường – đang tìm đường mới…', 'Off route – re-routing…'), '', true); }
    if (N.offN >= 3 && Date.now() - (N.lastReroute || 0) > 15000){ N.lastReroute = Date.now(); N.offN = 0; N.rerouted = true; routeTo(pos); }
    return;
  }
  N.offN = 0;
  // next manoeuvre
  if (N.steps.length){
    const k = N.steps.findIndex(s => s.at > pr.along + 3);
    const st = k >= 0 ? N.steps[k] : N.steps[N.steps.length-1];
    const d = k >= 0 ? st.at - pr.along : left;
    setBanner(st.arrow, st.text, fmtM(d));
    const key = k + ':';
    if (d <= th.near && !N.spoken[key+'n']){ N.spoken[key+'n'] = 1; say(st.text); buzz(80); }
    else if (d <= th.far && d > th.near * 1.5 && !N.spoken[key+'f']){ N.spoken[key+'f'] = 1; say(T_(`Sau ${fmtM(d)}, `, `In ${fmtM(d)}, `) + st.text.charAt(0).toLowerCase() + st.text.slice(1)); }
  } else {
    setBanner('🧭', T_('Đi về hướng ', 'Head ') + bearingTxt(pos, N.dest.coords), fmtM(toDest));
  }
  const speed = N.t.mode === 'walk' ? 1.3 : (N.dur && N.total ? N.total / N.dur : 5);
  const eta = new Date(Date.now() + left / speed * 1000);
  $('#navEta').textContent = `${fmtM(left)} · ${T_('đến lúc','arrive')} ${String(eta.getHours()).padStart(2,'0')}:${String(eta.getMinutes()).padStart(2,'0')}`;
}
function setBanner(icon, text, dist, warn){
  const b = $('#navBanner'); if (!b) return;
  b.classList.toggle('warn', !!warn);
  b.innerHTML = `<div class="nb-ic">${icon}</div><div class="nb-tx"><b>${esc(dist || '')}</b><span>${esc(text)}</span></div>`;
}
function arrive(){
  N.arrived = true; stopSim();
  const p = N.dest, tip = PV.placeTips ? (PV.placeTips(p)[0] || [])[1] : '';
  buzz([300, 120, 300]);
  say(T_(`Bạn đã đến ${nm(p)}. `, `You have arrived at ${nm(p)}. `) + (tip ? String(tip).replace(/<[^>]+>/g, '') : ''), true);
  notify(T_('Đã đến nơi', 'You have arrived'), nm(p));
  setBanner('🏁', T_('Bạn đã đến nơi!', 'You have arrived!'), nm(p));
  const last = N.idx >= N.t.stops.length - 1;
  $('#navArrive').innerHTML = `<div class="nav-arr"><b>🎉 ${esc(nm(p))}</b>${tip ? `<div class="small">${tip}</div>` : ''}
    <div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">
      ${state.visited[p.id] ? '' : `<button class="btn mint" id="navVisit">✅ ${T_('Đánh dấu đã ghé','Mark as visited')}</button>`}
      <button class="btn ghost" id="navInfo">ℹ️ ${T_('Thông tin','Info')}</button>
      ${last ? `<button class="btn" id="navDone">${T_('Kết thúc hành trình','Finish trip')}</button>` : `<button class="btn" id="navNext">➡️ ${T_('Đi tiếp: ','Next: ')}${esc(nm(PV.byId(N.t.stops[N.idx+1].id)))}</button>`}
    </div></div>`;
  const v = $('#navVisit'); if (v) v.onclick = () => { PV.markVisited(p.id); v.remove(); };
  $('#navInfo').onclick = () => { PV.openPlace(p.id); };
  const nx = $('#navNext'); if (nx) nx.onclick = () => next();
  const dn = $('#navDone'); if (dn) dn.onclick = () => PV.navStop(true);
}
async function next(){
  if (!N) return; N.idx++; N.arrived = false; $('#navArrive').innerHTML = '';
  await routeTo(N.pos || PV.byId(N.t.stops[N.idx-1].id).coords);
  if (N.sim) startSim();
}

/* ---------- simulation ---------- */
function startSim(){
  stopSim(); let along = 0;
  const v = (N.t.mode === 'walk' ? 1.4 * 8 : 9 * 5);       // sped-up metres per tick
  N.simT = setInterval(() => { if (document.hidden) return;
    if (!N || N.arrived) return stopSim();
    along += v; const c = N.cum, co = N.coords; let i = c.findIndex(x => x >= along);
    if (i < 0){ update(N.dest.coords, 5); return; }
    i = Math.max(1, i); const t = (along - c[i-1]) / ((c[i] - c[i-1]) || 1);
    update([co[i-1][0] + (co[i][0]-co[i-1][0]) * t, co[i-1][1] + (co[i][1]-co[i-1][1]) * t], 5);
  }, 1000);
}
function stopSim(){ if (N && N.simT){ clearInterval(N.simT); N.simT = null; } }

/* ---------- start / stop ---------- */
PV.navConfirm = (t) => {
  if (!t.stops.length) return;
  const first = PV.byId(t.stops[0].id);
  PV.modal(`<h3>🧭 ${T_('Bắt đầu dẫn đường?','Start navigation?')}</h3>
    <p class="small">${T_(`Mình sẽ dẫn bạn lần lượt qua <b>${t.stops.length} điểm</b>, bắt đầu với <b>${esc(nm(first))}</b>, đi bằng <b>${PV.MODES[t.mode].name}</b>.`, `I will guide you through <b>${t.stops.length} stops</b>, starting with <b>${esc(nm(first))}</b>, by <b>${PV.MODES[t.mode].name}</b>.`)}</p>
    <label class="rv-pub"><input type="checkbox" id="nvVoice" checked> <span>🔊 ${T_('Đọc chỉ dẫn bằng giọng nói (Tiếng Việt)','Spoken directions (English)')}</span></label>
    <label class="rv-pub"><input type="checkbox" id="nvNoti" checked> <span>🔔 ${T_('Thông báo khi tới nơi / đi sai đường','Alert on arrival / when off route')}</span></label>
    <div class="nav-modes"><label><input type="radio" name="nvm" value="gps" checked> 📍 ${T_('Dùng GPS của tôi','Use my GPS')}</label><label><input type="radio" name="nvm" value="sim"> 🎬 ${T_('Chạy thử (mô phỏng)','Demo (simulated)')}</label></div>
    <p class="tiny muted">${T_('Mẹo: giữ màn hình sáng khi đi. Chỉ dẫn mang tính tham khảo – luôn tuân thủ biển báo và hướng dẫn của cảnh sát giao thông.','Tip: keep the screen on. Directions are guidance only – always follow road signs and traffic police.')}</p>
    <div class="row" style="justify-content:flex-end;margin-top:12px;gap:8px"><button class="btn ghost" data-close>${T_('Để sau','Later')}</button><button class="btn" id="nvGo">${T_('Bắt đầu','Start')}</button></div>`, (bg, close) => {
    $('#nvGo', bg).onclick = async () => {
      muted = !$('#nvVoice', bg).checked; const sim = bg.querySelector('input[name=nvm]:checked').value === 'sim';
      if ($('#nvNoti', bg).checked && 'Notification' in window && Notification.permission === 'default'){ try { await Notification.requestPermission(); } catch(e){} }
      close(); start(t, sim);
    };
  });
};
async function start(t, sim){
  PV.navStop(); muted = muted || false; lastSaid = '';
  const ui = document.createElement('div'); ui.id = 'navui'; ui.className = 'navui';
  ui.innerHTML = `<div class="nav-top"><div id="navBanner" class="nav-banner"><div class="nb-ic">🧭</div><div class="nb-tx"><b></b><span>${T_('Đang tìm vị trí của bạn…','Finding your location…')}</span></div></div></div>
    <div id="navMap" class="nav-map"></div>
    <div class="nav-sheet"><div class="nav-head"><div id="navTo"></div><div id="navEta" class="small muted"></div></div>
      <div id="navNotes"></div><div id="navArrive"></div>
      <div class="nav-btns"><button class="nbtn" id="navMute" aria-label="${T_('Tắt/bật giọng','Mute')}">${muted ? '🔇' : '🔊'}</button><button class="nbtn" id="navFollow" aria-label="${T_('Theo vị trí','Follow')}">🎯</button><button class="nbtn" id="navSkip" aria-label="${T_('Bỏ qua điểm này','Skip stop')}">⏭</button>
        <a class="nbtn" id="navLive" target="_blank" rel="noopener" aria-label="${T_('Giao thông trực tiếp','Live traffic')}">🚦</a><button class="nbtn end" id="navEnd">${T_('Kết thúc','End')}</button></div></div>`;
  document.body.appendChild(ui); document.body.classList.add('nav-on');
  N = {t, idx: 0, sim, follow: true, spoken: {}};
  try { await PV.loadLeaflet(); } catch(e){ PV.toast(T_('Không tải được bản đồ – kiểm tra kết nối Internet','Could not load the map – check your connection')); PV.navStop(); return; }
  N.map = L.map('navMap', {zoomControl: false}).setView([10.776, 106.70], 16); PV.baseLayer(N.map);
  N.map.on('dragstart', () => { N.follow = false; });
  $('#navMute').onclick = () => { muted = !muted; $('#navMute').textContent = muted ? '🔇' : '🔊'; if (muted) speechSynthesis.cancel(); };
  $('#navFollow').onclick = () => { N.follow = true; if (N.pos) N.map.setView([N.pos[1], N.pos[0]], 17); };
  $('#navSkip').onclick = () => { if (N.idx < N.t.stops.length - 1){ N.arrived = true; next(); } else PV.navStop(true); };
  $('#navEnd').onclick = () => PV.navStop(true);
  try { N.wake = await navigator.wakeLock?.request('screen'); } catch(e){}
  const startFrom = async (pos) => { N.pos = pos; await routeTo(pos); $('#navLive').href = PV.liveTrafficUrl(pos, N.dest.coords, t.mode); update(pos); if (sim) startSim(); };
  if (sim){ return startFrom(t.origin ? t.origin.c : PV.byId(t.stops[0].id).coords.map((v, i) => v + (i ? -.004 : .003))); }
  if (!navigator.geolocation){ PV.toast(T_('Thiết bị không hỗ trợ GPS – chuyển sang chạy thử','No GPS – switching to demo')); N.sim = true; return startFrom(t.origin.c); }
  let started = false;
  N.watch = navigator.geolocation.watchPosition(p => {
    const pos = [p.coords.longitude, p.coords.latitude];
    if (!started){ started = true; startFrom(pos); } else update(pos, p.coords.accuracy);
  }, err => {
    if (!started){ PV.toast(T_('Chưa có quyền vị trí – đang chạy thử từ điểm xuất phát','No location permission – running a demo from your start point')); N.sim = true; started = true; startFrom(t.origin ? t.origin.c : PV.byId(t.stops[0].id).coords); }
  }, {enableHighAccuracy: true, maximumAge: 2000, timeout: 15000});
}
PV.navStop = (said) => {
  if (!N) return;
  stopSim(); if (N.watch != null) navigator.geolocation.clearWatch(N.watch);
  try { N.wake && N.wake.release(); } catch(e){}
  try { N.map && N.map.remove(); } catch(e){}
  if (said) say(T_('Đã kết thúc dẫn đường. Chúc bạn chuyến đi vui vẻ!', 'Navigation ended. Enjoy your trip!'), true);
  N = null; const ui = $('#navui'); if (ui) ui.remove(); document.body.classList.remove('nav-on');
};
PV._nav = () => N;      // for testing
PV._navUpdate = (p, a) => update(p, a);
})();
