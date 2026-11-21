/* ===== Personavel – live weather for each place (Open-Meteo, no key), screen effects + guide advice ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const S = () => (state.settings.weather = Object.assign({on:true, sim:'real'}, state.settings.weather || {}));

/* ---------- data ---------- */
const cache = {};
const KIND = c => c === 0 || c === 1 ? 'clear' : c === 2 || c === 3 ? 'cloudy' : c === 45 || c === 48 ? 'fog' : (c >= 51 && c <= 57) ? 'drizzle'
  : (c >= 61 && c <= 67) || (c >= 80 && c <= 82) ? 'rain' : c >= 95 ? 'storm' : (c >= 71 && c <= 77) || c === 85 || c === 86 ? 'cloudy' : 'cloudy';
const DESC = {
  clear:['Trời quang, nắng','Clear and sunny'], clearN:['Trời quang','Clear night'], cloudy:['Nhiều mây','Cloudy'], partly:['Có mây, nắng nhẹ','Partly cloudy'],
  fog:['Sương mù','Foggy'], drizzle:['Mưa phùn','Drizzle'], rain:['Đang mưa','Raining'], heavy:['Mưa to','Heavy rain'], storm:['Mưa dông, có sấm sét','Thunderstorm']
};
const SIM = {
  rain:   {code:63, temp:27, feels:30, hum:92, wind:14, uv:1, rain:4.2, isDay:1},
  storm:  {code:95, temp:26, feels:29, hum:94, wind:28, uv:0, rain:9.5, isDay:1},
  sun:    {code:0,  temp:35, feels:40, hum:55, wind:8,  uv:10, rain:0, isDay:1},
  cloudy: {code:3,  temp:30, feels:33, hum:72, wind:10, uv:3, rain:0, isDay:1},
  fog:    {code:45, temp:24, feels:25, hum:97, wind:4,  uv:1, rain:0, isDay:1},
  night:  {code:0,  temp:27, feels:29, hum:80, wind:6,  uv:0, rain:0, isDay:0}
};
function norm(w){
  let kind = KIND(w.code), key = kind;
  if (kind === 'clear' && !w.isDay) key = 'clearN';
  if (kind === 'clear' && w.code === 1 && w.isDay) key = 'partly';
  if (kind === 'rain' && (w.rain >= 7 || w.code === 65 || w.code === 82)) key = 'heavy';
  return {...w, kind, desc: PV.L(...DESC[key])};
}
PV.getWeather = async (lat, lon) => {
  const s = S();
  if (s.sim && s.sim !== 'real' && SIM[s.sim]) return norm(SIM[s.sim]);
  const k = lat.toFixed(2) + ',' + lon.toFixed(2);
  if (cache[k] && Date.now() - cache[k].t < 10*60e3) return cache[k].w;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,showers,weather_code,wind_speed_10m,uv_index,is_day&timezone=Asia%2FBangkok`;
  const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(url, {signal: ctl.signal}); const j = await r.json(); const c = j.current;
    const w = norm({code:c.weather_code, temp:c.temperature_2m, feels:c.apparent_temperature, hum:c.relative_humidity_2m, wind:c.wind_speed_10m, uv:c.uv_index ?? 0, rain:(c.rain||0)+(c.showers||0)+0, isDay:c.is_day});
    cache[k] = {t: Date.now(), w}; return w;
  } finally { clearTimeout(to); }
};

const uvLevel = u => u >= 11 ? [PV.L('Cực cao','Extreme'),'#8E3BB8'] : u >= 8 ? [PV.L('Rất cao','Very high'),'#D7263D'] : u >= 6 ? [PV.L('Cao','High'),'#F46036'] : u >= 3 ? [PV.L('Trung bình','Moderate'),'#E8B11C'] : [PV.L('Thấp','Low'),'#2E9E6E'];
const ICONS = {clear:'☀️', clearN:'🌙', partly:'🌤️', cloudy:'☁️', fog:'🌫️', drizzle:'🌦️', rain:'🌧️', heavy:'🌧️', storm:'⛈️'};
const icon = w => w.kind === 'clear' ? (w.isDay ? (w.code === 1 ? ICONS.partly : ICONS.clear) : ICONS.clearN) : ICONS[w.kind] || '🌤️';

/* advice the guide gives */
function advice(w, place){
  const n = esc(place), tips = [];
  if (w.kind === 'storm') tips.push(PV.L(`Ở ${n} đang có dông sét ⛈️ Bạn nên tạm trú trong nhà, tránh đứng dưới cây to hoặc chỗ trống trải, đợi trời ngớt rồi hãy đi tiếp nhé.`, `There's a thunderstorm at ${n} ⛈️ Please shelter indoors, stay away from big trees and open spaces, and wait for it to pass.`));
  else if (w.kind === 'rain') tips.push(PV.L(`${n} đang mưa ☔ Nhớ mang dù hoặc áo mưa, đi chậm vì đường trơn, và cất điện thoại vào túi chống nước nha.`, `It's raining at ${n} ☔ Bring an umbrella or raincoat, ride slowly on wet roads and keep your phone dry.`));
  else if (w.kind === 'drizzle') tips.push(PV.L(`${n} đang mưa phùn lất phất 🌦️ Mang theo dù nhỏ hoặc áo khoác mỏng là đủ.`, `Light drizzle at ${n} 🌦️ A small umbrella or light jacket will do.`));
  else if (w.kind === 'fog') tips.push(PV.L(`${n} đang có sương mù 🌫️ Tầm nhìn hạn chế, đi xe nhớ bật đèn và chạy chậm.`, `Fog at ${n} 🌫️ Visibility is low — turn on your lights and go slowly.`));
  if (w.isDay && w.uv >= 8) tips.push(PV.L(`Nắng gắt, chỉ số UV ${Math.round(w.uv)} (rất cao) 🥵 Hãy bôi kem chống nắng SPF 50, đội nón rộng vành, đeo kính râm và mặc áo khoác chống nắng.`, `Harsh sun, UV ${Math.round(w.uv)} (very high) 🥵 Use SPF 50 sunscreen, a wide hat, sunglasses and a sun jacket.`));
  else if (w.isDay && w.uv >= 6) tips.push(PV.L(`UV ${Math.round(w.uv)} (cao) 😎 Nhớ bôi kem chống nắng và đội nón khi ra ngoài.`, `UV ${Math.round(w.uv)} (high) 😎 Wear sunscreen and a hat outdoors.`));
  else if (w.isDay && w.uv >= 3 && w.kind !== 'rain' && w.kind !== 'storm') tips.push(PV.L(`UV ${Math.round(w.uv)} ở mức trung bình, vẫn nên bôi chút kem chống nắng nhé.`, `UV ${Math.round(w.uv)} is moderate — a bit of sunscreen is still a good idea.`));
  if (w.feels >= 38) tips.push(PV.L(`Nhiệt độ cảm nhận ${Math.round(w.feels)}°C, rất oi bức 🔥 Uống nhiều nước, nghỉ trong bóng râm giữa các điểm tham quan.`, `Feels like ${Math.round(w.feels)}°C 🔥 Drink plenty of water and rest in the shade between stops.`));
  else if (w.feels >= 34 && !tips.length) tips.push(PV.L(`Trời khá nóng (${Math.round(w.feels)}°C) – nhớ mang theo nước uống nhé.`, `It's hot (${Math.round(w.feels)}°C) – carry some water.`));
  if (w.wind >= 30) tips.push(PV.L(`Gió mạnh ${Math.round(w.wind)} km/h 💨 Cẩn thận khi đi xe máy và giữ chặt đồ đạc.`, `Strong wind ${Math.round(w.wind)} km/h 💨 Take care on a motorbike and hold on to your things.`));
  if (!tips.length){
    if (!w.isDay) tips.push(PV.L(`Buổi tối ở ${n} trời dễ chịu 🌙 Rất hợp để dạo phố và ngắm đèn đêm.`, `A pleasant evening at ${n} 🌙 Great for a night walk.`));
    else if (w.kind === 'cloudy') tips.push(PV.L(`${n} trời nhiều mây, mát mẻ ☁️ Thời tiết lý tưởng để đi bộ khám phá đấy!`, `Cloudy and cool at ${n} ☁️ Perfect weather for walking around!`));
    else tips.push(PV.L(`Thời tiết ở ${n} đang đẹp 🌤️ Chúc bạn có chuyến tham quan vui vẻ!`, `Lovely weather at ${n} 🌤️ Enjoy your visit!`));
  }
  return tips;
}

/* ---------- full-screen effects ---------- */
let fxTimer = null;
PV.weatherFX = (w) => {
  const old = $('#wxfx'); if (old) old.remove(); clearTimeout(fxTimer);
  if (document.body.classList.contains('reduce')) return;
  const R = (a,b) => a + Math.random()*(b-a);
  let html = '', cls = '';
  if (w.kind === 'rain' || w.kind === 'storm' || w.kind === 'drizzle'){
    const n = w.kind === 'drizzle' ? 70 : w.kind === 'storm' ? 190 : 140;
    cls = 'wx-rain' + (w.kind === 'drizzle' ? ' light' : '');
    html += Array.from({length:n}, () => `<i class="drop" style="left:${R(-5,105).toFixed(1)}%;animation-delay:-${R(0,1.2).toFixed(2)}s;animation-duration:${R(.45,.85).toFixed(2)}s;opacity:${R(.35,.85).toFixed(2)};height:${R(14,30)|0}px"></i>`).join('');
    html += Array.from({length:16}, () => `<i class="splash" style="left:${R(2,98).toFixed(1)}%;animation-delay:-${R(0,1).toFixed(2)}s"></i>`).join('');
    if (w.kind === 'storm'){ cls += ' wx-storm'; html += '<i class="flash"></i><svg class="bolt" viewBox="0 0 60 160"><path d="M34 0L6 86h20L14 160 54 60H32L46 0z"/></svg>'; }
  } else if (w.kind === 'clear' && w.isDay){
    cls = 'wx-sun' + (w.uv >= 8 ? ' harsh' : '');
    html = '<i class="glare"></i><i class="rays"></i><i class="haze"></i>';
  } else if (w.kind === 'cloudy' || (w.kind === 'clear' && w.code === 1)){
    cls = 'wx-cloud';
    html = Array.from({length:6}, (_,i) => `<i class="cloud" style="top:${(4+i*13+R(-3,3)).toFixed(1)}%;animation-delay:-${R(0,40).toFixed(1)}s;animation-duration:${R(38,60).toFixed(1)}s;transform:scale(${R(.7,1.3).toFixed(2)})"></i>`).join('');
  } else if (w.kind === 'fog'){
    cls = 'wx-fog'; html = '<i class="mist m1"></i><i class="mist m2"></i><i class="mist m3"></i>';
  } else if (!w.isDay){
    cls = 'wx-night'; html = Array.from({length:30}, () => `<i class="tw" style="left:${R(2,98).toFixed(1)}%;top:${R(2,45).toFixed(1)}%;animation-delay:-${R(0,3).toFixed(2)}s"></i>`).join('');
  }
  if (!html) return;
  const fx = document.createElement('div'); fx.id = 'wxfx'; fx.className = 'wxfx ' + cls; fx.setAttribute('aria-hidden','true'); fx.innerHTML = html;
  document.body.appendChild(fx);
  fxTimer = setTimeout(() => { fx.classList.add('out'); setTimeout(() => fx.remove(), 1200); }, 9000);
};
PV.stopWeatherFX = () => { const f = $('#wxfx'); if (f){ f.classList.add('out'); setTimeout(()=>f.remove(), 800); } };

/* ---------- the guide pops up with advice ---------- */
PV.weatherAdvice = (w, place) => advice(w, place);   // chatbot dùng
PV.weatherIcon = icon;
PV.weatherTip = (w, place) => {
  const old = $('#wxtip'); if (old) old.remove();
  const g = PV.todayGuide(); const tips = advice(w, place);
  const el = document.createElement('div'); el.id = 'wxtip'; el.className = 'wxtip'; el.setAttribute('role','status');
  el.innerHTML = `<button class="wxtip-x" aria-label="${PV.L('Đóng','Close')}">✕</button><div class="wxtip-b"><b>${icon(w)} ${esc(w.desc)} · ${Math.round(w.temp)}°C</b>${tips.map(t=>`<p>${t}</p>`).join('')}</div><div class="wxtip-bot">${PV.robot(g)}</div>`;
  document.body.appendChild(el);
  const close = () => { el.classList.add('out'); setTimeout(()=>el.remove(), 300); };
  $('.wxtip-x', el).onclick = close;
  setTimeout(close, 14000);
};

/* ---------- weather card in the place drawer ---------- */
function card(w){
  const [lvl, col] = uvLevel(w.uv || 0);
  return `<div class="wxcard wx-${w.kind}${w.isDay?'':' night'}">
    <div class="wx-main"><span class="wx-ic">${icon(w)}</span><div><b>${esc(w.desc)}</b><div class="tiny">${PV.L('Thời tiết hiện tại tại đây','Weather here right now')}${S().sim!=='real'?' · '+PV.L('đang giả lập','simulated'):''}</div></div><span class="wx-t">${Math.round(w.temp)}°</span></div>
    <div class="wx-grid">
      <span>🌡️ ${PV.L('Cảm giác','Feels')} <b>${Math.round(w.feels)}°C</b></span>
      <span>☀️ UV <b style="color:${col}">${Math.round(w.uv||0)}</b> <i class="uvpill" style="background:${col}">${lvl}</i></span>
      <span>💧 ${PV.L('Độ ẩm','Humidity')} <b>${Math.round(w.hum)}%</b></span>
      <span>💨 ${PV.L('Gió','Wind')} <b>${Math.round(w.wind)} km/h</b></span>
      ${w.rain > 0 ? `<span>🌧️ ${PV.L('Lượng mưa','Rain')} <b>${(+w.rain).toFixed(1)} mm</b></span>` : ''}
    </div></div>`;
}
const _open = PV.openPlace;
PV.openPlace = (id, opt) => {
  const r = _open(id, opt);
  const s = S(); const p = PV.byId(id); const dr = document.getElementById('drawer');
  if (!s.on || !p || !p.coords || !dr) return r;
  const body = dr.querySelector('.body'); if (!body || body.querySelector('.wxcard')) return r;
  body.insertAdjacentHTML('afterbegin', `<div class="wxcard loading">⛅ ${PV.L('Đang xem thời tiết…','Checking the weather…')}</div>`);
  const name = PV.lang==='en' && p.name_en ? p.name_en : p.name;
  PV.getWeather(p.coords[1], p.coords[0]).then(w => {
    const box = body.querySelector('.wxcard'); if (!box || !document.body.contains(box)) return;
    box.outerHTML = card(w);
    PV.weatherFX(w); PV.weatherTip(w, name);
  }).catch(() => {
    const box = body.querySelector('.wxcard'); if (box) box.outerHTML = `<div class="wxcard off">🌐 ${PV.L('Chưa lấy được thời tiết (cần kết nối Internet).','Weather unavailable (needs an Internet connection).')}</div>`;
  });
  return r;
};
const _close = PV.closeDrawer;
PV.closeDrawer = () => { PV.stopWeatherFX(); return _close(); };

/* ---------- settings: on/off + simulate for demos ---------- */
const _settings = PV.settingsModal;
PV.settingsModal = () => {
  _settings();
  const m = [...document.querySelectorAll('.modal')].pop(); if (!m) return;
  const anchor = m.querySelector('.thm-custom') || m.querySelector('h4');
  const s = S();
  const opts = [['real',PV.L('Thời tiết thật','Live weather')],['rain',PV.L('Mưa','Rain')],['storm',PV.L('Dông sét','Thunderstorm')],['sun',PV.L('Nắng gắt','Harsh sun')],['cloudy',PV.L('Nhiều mây','Cloudy')],['fog',PV.L('Sương mù','Fog')],['night',PV.L('Đêm quang','Clear night')]];
  const sec = document.createElement('div'); sec.className = 'wx-set';
  sec.innerHTML = `<h4 style="margin:14px 0 6px">🌦️ ${PV.L('Chế độ thời tiết','Weather mode')}</h4>
    <label class="row" style="gap:8px;align-items:center"><input type="checkbox" id="wxOn" ${s.on?'checked':''}> ${PV.L('Hiện thời tiết, hiệu ứng mưa/nắng và lời nhắc khi mở một địa điểm','Show weather, rain/sun effects and tips when opening a place')}</label>
    <div class="tiny muted" style="margin:8px 0 4px">${PV.L('Giả lập (để thuyết trình, xem thử hiệu ứng)','Simulate (for demos)')}</div>
    <div class="row" style="gap:6px;flex-wrap:wrap">${opts.map(([k,l])=>`<button type="button" class="chip ${s.sim===k?'on':''}" data-wx="${k}">${l}</button>`).join('')}</div>`;
  anchor.after(sec);
  $('#wxOn', sec).onchange = e => { S().on = e.target.checked; PV.save('settings'); };
  $$('[data-wx]', sec).forEach(b => b.onclick = () => { S().sim = b.dataset.wx; PV.save('settings'); $$('[data-wx]', sec).forEach(x => x.classList.toggle('on', x === b));
    if (b.dataset.wx !== 'real') { const w = norm(SIM[b.dataset.wx]); PV.weatherFX(w); } });
};
})();
