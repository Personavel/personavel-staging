/* ===== Personavel – prettier map styles (Google-like, Apple-like, pastel, night, satellite) ===== */
(function(){
'use strict';
const {$, $$, state} = PV;
const ESRI = 'https://server.arcgisonline.com/ArcGIS/rest/services/';
const ATT = 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors';
const T = (path, o={}) => ({url: ESRI + path + '/MapServer/tile/{z}/{y}/{x}', o: Object.assign({maxZoom:19, attribution:ATT}, o)});
const STYLES = {
  google: {vi:'Tươi sáng', en:'Vivid', sub:['kiểu Google Maps','Google-like'], layers:[T('World_Street_Map')], filter:'saturate(1.28) contrast(1.05) brightness(1.02)', thumb:'linear-gradient(135deg,#F2EFE9 0 40%,#FBD27A 40% 46%,#F2EFE9 46% 62%,#AAD3F5 62%)'},
  apple:  {vi:'Dịu nhẹ', en:'Soft', sub:['kiểu Apple Maps','Apple-like'], layers:[T('World_Street_Map')], filter:'saturate(.78) brightness(1.07) contrast(.93) sepia(.06)', thumb:'linear-gradient(135deg,#F7F5F0 0 40%,#FFFFFF 40% 46%,#F7F5F0 46% 62%,#BFDDF2 62%)'},
  pastel: {vi:'Pastel theo nền', en:'Pastel (theme)', sub:['hợp màu trang','matches page'], layers:[T('World_Street_Map')], filter:'tint', tint:true, thumb:'linear-gradient(135deg,var(--baby,#E6F1FB) 0 40%,#fff 40% 46%,var(--baby,#E6F1FB) 46% 62%,var(--pastel,#C9DDF2) 62%)'},
  dark:   {vi:'Ban đêm', en:'Night', sub:['nền tối','dark'], layers:[T('Canvas/World_Dark_Gray_Base',{maxNativeZoom:16}), T('Canvas/World_Dark_Gray_Reference',{maxNativeZoom:16})], filter:'tintdark', thumb:'linear-gradient(135deg,#2B2D33 0 40%,#4A4D57 40% 46%,#2B2D33 46% 62%,#1C2330 62%)'},
  sat:    {vi:'Vệ tinh', en:'Satellite', sub:['ảnh thật','imagery'], layers:[T('World_Imagery'), T('Reference/World_Transportation',{opacity:.55}), T('Reference/World_Boundaries_and_Places')], filter:'saturate(1.1) contrast(1.04)', thumb:'linear-gradient(135deg,#3E5A3A 0 30%,#6B7F55 30% 55%,#2F4A5E 55%)'}
};
const ORDER = ['auto','google','apple','pastel','dark','sat'];
const pick = () => {
  const s = (state.settings.mapStyle || 'auto');
  if (s !== 'auto' && STYLES[s]) return s;
  return document.body.classList.contains('hued') ? 'pastel' : 'google';   // always a light map
};
const filterFor = (k) => {
  const f = STYLES[k].filter, h = PV.themeHue;
  if (f === 'tint') return 'saturate(1.12) brightness(1.04)';
  if (f === 'tintdark') return h == null ? 'brightness(1.12) contrast(1.05)' : `sepia(.4) hue-rotate(${Math.round(h - 38)}deg) saturate(1.9) brightness(1.15)`;
  return f;
};
/* soft colour wash over the street map: keeps road / water / park colours apart, just harmonises them with the page */
function wash(mp, on){
  let pane = mp.getPane('pvTint');
  if (!pane){ pane = mp.createPane('pvTint'); pane.style.zIndex = 250; pane.style.pointerEvents = 'none'; }
  let d = pane.firstChild;
  if (!on){ if (d) d.style.display = 'none'; return; }
  if (!d){ d = L.DomUtil.create('div', 'pv-wash', pane);
    const fit = () => { try { L.DomUtil.setPosition(d, mp.containerPointToLayerPoint([0,0])); const z = mp.getSize(); d.style.width = z.x + 'px'; d.style.height = z.y + 'px'; } catch(e){} };
    mp.on('move zoom zoomend resize viewreset', fit); fit(); }
  const h = PV.themeHue, H = PV.colorUtil && PV.colorUtil.hsl2hex;
  d.style.display = h == null || !H ? 'none' : 'block';
  if (h != null && H){ d.style.background = `linear-gradient(135deg, ${H(70, 90)}, ${H((h+28)%360, 70, 91)})`; }
}
const paint = (mp, k) => { try { wash(mp, !!STYLES[k].tint); } catch(e){} const pane = mp.getPane && mp.getPane('tilePane'); if (pane) pane.style.filter = filterFor(k); const el = mp.getContainer(); ORDER.forEach(x => el.classList.remove('ms-' + x)); el.classList.add('ms-' + k); };

const orig = PV.baseLayer;
PV.baseLayer = (mp) => {
  const k = pick(); const st = STYLES[k];
  let ok = 0, bad = 0, done = false; const group = L.layerGroup().addTo(mp);
  const fallback = () => { if (done) return; done = true; try { mp.removeLayer(group); } catch(e){} paint(mp, 'google'); orig(mp); };
  st.layers.forEach((t, i) => { const l = L.tileLayer(t.url, t.o); if (i === 0){ l.on('tileload', () => { ok++; done = true; }); l.on('tileerror', () => { bad++; if (!ok && bad >= 3) fallback(); }); } group.addLayer(l); });
  setTimeout(() => { if (!ok) fallback(); }, 6000);
  paint(mp, k);
  mp._pvStyle = {group, k};
};
PV.restyleMap = () => {
  const mp = PV._mapRef; if (!mp || !mp._pvStyle) return;
  try { mp.removeLayer(mp._pvStyle.group); PV.baseLayer(mp); } catch(e){}
};

/* ---------- picker on the map ---------- */
const _map = PV.views.map;
PV.views.map = (m) => {
  _map(m);
  const tog = $('#togglePanel', m); if (!tog || $('#mapStyleBtn', m)) return;
  const b = document.createElement('button'); b.className = 'btn sm ghost'; b.id = 'mapStyleBtn'; b.innerHTML = '🎨 ' + PV.L('Kiểu bản đồ','Map style');
  tog.after(b);
  b.onclick = (e) => {
    e.stopPropagation();
    const old = $('#msPop'); if (old){ old.remove(); return; }
    const cur = state.settings.mapStyle || 'auto';
    const pop = document.createElement('div'); pop.id = 'msPop'; pop.className = 'ms-pop';
    pop.innerHTML = `<b class="ms-h">${PV.L('Kiểu bản đồ','Map style')}</b><div class="ms-grid">${ORDER.map(k => { const s = STYLES[k];
      const name = k === 'auto' ? PV.L('Tự động','Auto') : PV.L(s.vi, s.en), sub = k === 'auto' ? PV.L('sáng, hợp màu trang','light, matches page') : PV.L(...s.sub);
      const th = k === 'auto' ? 'conic-gradient(from 45deg,#F2EFE9,#BFDDF2,#F6E7F0,#F2EFE9)' : s.thumb;
      return `<button class="ms-opt ${cur===k?'on':''}" data-ms="${k}"><i style="background:${th}"></i><span>${name}</span><small>${sub}</small></button>`; }).join('')}</div>`;
    const r = b.getBoundingClientRect(); pop.style.top = (r.bottom + 8) + 'px'; pop.style.right = Math.max(10, innerWidth - r.right) + 'px';
    document.body.appendChild(pop);
    $$('[data-ms]', pop).forEach(o => o.onclick = () => { state.settings.mapStyle = o.dataset.ms; PV.save('settings'); $$('[data-ms]', pop).forEach(x => x.classList.toggle('on', x === o)); PV.restyleMap(); });
    setTimeout(() => document.addEventListener('click', function off(ev){ if (!pop.contains(ev.target)){ pop.remove(); document.removeEventListener('click', off); } }), 0);
  };
};
/* follow theme changes when on Auto / Pastel */
const _apply = PV.applyTheme;
PV.applyTheme = (t) => { const r = _apply(t); const s = state.settings.mapStyle || 'auto'; if ((s === 'auto' || s === 'pastel') && PV._mapRef) PV.restyleMap(); return r; };
const _leave = () => { const p = $('#msPop'); if (p) p.remove(); };
window.addEventListener('hashchange', _leave);
})();
