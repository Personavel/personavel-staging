/* ===== Personavel – page colours & background themes (with automatic text contrast) ===== */
(function(){
'use strict';
const {$, $$, state} = PV;
/* phones / weak devices → "lite" motion: same look, far less GPU work */
PV.lite = (() => { try {
  const coarse = matchMedia('(pointer:coarse)').matches, small = matchMedia('(max-width:820px)').matches;
  const weak = (navigator.hardwareConcurrency||8) <= 2 || (navigator.deviceMemory||8) <= 2;
  return coarse || small || weak; } catch(e){ return false; } })();
PV.still = (() => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch(e){ return false; } })();
document.documentElement.classList.toggle('lite', PV.lite);
document.documentElement.classList.toggle('still', PV.still);
/* pause decorative motion while the user scrolls or the tab is hidden */
(() => { let t = null; const root = document.documentElement;
  addEventListener('scroll', () => { if (!PV.lite) return; root.classList.add('scrolling'); clearTimeout(t); t = setTimeout(() => root.classList.remove('scrolling'), 160); }, {passive:true, capture:true});
  document.addEventListener('visibilitychange', () => root.classList.toggle('hiddenTab', document.visibilityState === 'hidden'));
})();

/* ---------- colour helpers ---------- */
const hex2rgb = h => { h = h.replace('#',''); if (h.length===3) h = h.split('').map(c=>c+c).join(''); const n = parseInt(h,16); return [n>>16&255, n>>8&255, n&255]; };
const rgb2hex = (r,g,b) => '#' + [r,g,b].map(v => Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
const mix = (a, b, t) => { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t); };
const lum = h => { const c = hex2rgb(h).map(v => { v/=255; return v<=.03928 ? v/12.92 : Math.pow((v+.055)/1.055, 2.4); }); return .2126*c[0] + .7152*c[1] + .0722*c[2]; };
const hsl2hex = (h, s, l) => { s/=100; l/=100; const k = n => (n + h/30) % 12, a = s*Math.min(l,1-l); const f = n => l - a*Math.max(-1, Math.min(k(n)-3, Math.min(9-k(n), 1))); return rgb2hex(f(0)*255, f(8)*255, f(4)*255); };
const hex2hue = h => { const [r,g,b] = hex2rgb(h).map(v=>v/255); const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx-mn; if (!d) return 210; let H = mx===r ? ((g-b)/d)%6 : mx===g ? (b-r)/d+2 : (r-g)/d+4; H*=60; return Math.round(H<0?H+360:H); };
PV.colorUtil = {mix, lum, hsl2hex};

/* ---------- presets ---------- */
const PASTEL = [
  {id:'default', vi:'Trắng – xanh', en:'White – blue', c:['#E4F1FC','#9FCBEE','#C8E2F7','#76B1E2']},
  {id:'pink', hue:340,    vi:'Hồng phấn',    en:'Pastel pink',  c:['#FFF7FA','#FAD6E3','#FFEFF4','#F5C6D7']},
  {id:'purple', hue:265,  vi:'Tím oải hương',en:'Lavender',     c:['#FAF7FF','#E2D6F6','#F2ECFD','#D6C7F1']},
  {id:'blue', hue:208,    vi:'Xanh da trời', en:'Sky blue',     c:['#F3F9FF','#C9E1F7','#E5F1FC','#B9D7F3']},
  {id:'mint', hue:158,    vi:'Xanh bạc hà',  en:'Mint',         c:['#F4FCF8','#CDEEDF','#E7F8F0','#BDE6D3']},
  {id:'yellow', hue:40,  vi:'Vàng kem',     en:'Butter yellow',c:['#FFFDF3','#FBEDBC','#FFF7DA','#F6E3A0']},
  {id:'peach', hue:18,   vi:'Cam đào',      en:'Peach',        c:['#FFF8F2','#FBD9C4','#FDEBDF','#F7C9AE']}
];
const SCENES = [
  {id:'night', dom:'#0B1D44', hue:222, vi:'Đêm ánh sao', en:'Starry night', c:['#040A1C','#0A1A3C','#132C5C','#24467A'], stars:3, spark:1, milky:.35, shoot:1,
    sky:'linear-gradient(180deg,#02060F 0%,#050D24 22%,#0A1A3C 48%,#132C5C 72%,#24467A 90%,#35598C 100%)'},
  {id:'golden', dom:'#F5C46E', hue:36, vi:'Bầu trời vàng', en:'Golden sky', c:['#F3B95A','#F9D27E','#FCE3A6','#FFF2CE'], sun:'#FFF6C8', clouds:'rgba(255,248,226,.75)',
    sky:'linear-gradient(180deg,#E9A64A 0%,#F3B95A 18%,#F9D27E 42%,#FCE3A6 66%,#FFF2CE 88%,#FFF8E4 100%)'},
  {id:'sunset', dom:'#9C4F98', hue:290, vi:'Hoàng hôn', en:'Sunset', c:['#2B2F6B','#7C4E9E','#E46F86','#FFC173'], sun:'#FFE29A', sunAt:'bottom', clouds:'rgba(255,170,160,.55)',
    sky:'linear-gradient(180deg,#1E2557 0%,#3A3A82 16%,#7C4E9E 36%,#C25C93 54%,#EE7A7E 70%,#FA9E68 84%,#FFC173 94%,#FFDB8F 100%)'},
  {id:'dawn', dom:'#C9AEDB', hue:330, vi:'Bình minh', en:'Sunrise', c:['#7F9AD3','#C4B8E2','#F7C3C9','#FFE3BF'], sun:'#FFF3D6', sunAt:'bottomleft', clouds:'rgba(255,236,236,.7)',
    sky:'linear-gradient(180deg,#5C78BC 0%,#8299D2 18%,#B5B3E0 38%,#E3BCD6 56%,#F7C3C9 70%,#FFD5BC 84%,#FFE9C9 94%,#FFF4DE 100%)'},
  {id:'galaxy', dom:'#1C0F45', hue:272, vi:'Dải ngân hà', en:'Galaxy', c:['#05030F','#120A2E','#2A1255','#0E1E4A'], stars:3, spark:1, milky:1, nebula:1, shoot:1,
    sky:'radial-gradient(120% 80% at 70% 20%,#1B0F45 0%,rgba(27,15,69,0) 60%),radial-gradient(90% 70% at 15% 85%,#0D1F4E 0%,rgba(13,31,78,0) 60%),linear-gradient(180deg,#04020C 0%,#0A0620 45%,#110A30 100%)'}
];
PV.THEMES = {PASTEL, SCENES};

function customTheme(t){
  const h = t.hue ?? 210, k = (t.depth ?? 25) / 100;           // depth 0 = barely tinted … 100 = deep colour
  const base = hsl2hex(h, 65, 60 - k*30);                     // stronger = also a little darker
  const c1 = mix('#FFFFFF', base, .08 + k*.85), c2 = mix('#FFFFFF', base, .25 + k*.75), c3 = mix('#FFFFFF', base, .14 + k*.8), c4 = mix('#FFFFFF', hsl2hex((h+25)%360, 65, 58 - k*30), .2 + k*.75);
  return {id:'custom', hue:h, c:[c1, c2, c3, c4]};
}
const find = (t) => {
  t = t || {};
  if (t.id === 'custom') return customTheme(t);
  return PASTEL.find(x=>x.id===t.id) || SCENES.find(x=>x.id===t.id) || PASTEL[0];
};

/* ---------- background layer ---------- */
let starBox = null;
function stars(n, spread){ let s = []; for (let i=0;i<n;i++){ const x = Math.random()*spread|0, y = Math.random()*spread|0, a = (.35+Math.random()*.65).toFixed(2), r = Math.random()<.12 ? 1 : 0; s.push(`${x}px ${y}px 0 ${r}px rgba(255,255,255,${a})`); } return s.join(','); }
function layer(){
  let bg = document.getElementById('pvbg');
  if (!bg){
    bg = document.createElement('div'); bg.id = 'pvbg'; bg.setAttribute('aria-hidden','true');
    const R = (a,b) => a + Math.random()*(b-a);
    const sparks = Array.from({length: PV.still ? 0 : PV.lite ? 26 : 96}, () => `<i class="spk" style="left:${R(1,99).toFixed(1)}%;top:${R(1,92).toFixed(1)}%;--s:${R(.45,1.35).toFixed(2)};animation-delay:-${R(0,5).toFixed(2)}s;animation-duration:${R(1.6,4.2).toFixed(2)}s"></i>`).join('');
    const clouds = Array.from({length: PV.lite ? 3 : 6}, (_,i) => `<i class="cl" style="top:${(8+i*11+R(-3,3)).toFixed(1)}%;width:${R(28,46).toFixed(0)}vw;height:${R(6,11).toFixed(1)}vh;animation-delay:-${R(0,120).toFixed(0)}s;animation-duration:${R(110,180).toFixed(0)}s;opacity:${R(.45,.9).toFixed(2)}"></i>`).join('');
    bg.innerHTML = `<div class="g"></div><div class="milky"></div><div class="neb"></div><div class="glow"></div><div class="st s1"></div><div class="st s2"></div><div class="st s3"></div><div class="st s4"></div><div class="st s5"></div><div class="st s6"></div><div class="st s7"></div><div class="tint"></div><div class="meteors"></div><div class="sparks">${sparks}</div><div class="clouds">${clouds}</div><i class="shoot"></i><i class="shoot b"></i>`;
    document.body.prepend(bg);
  }
  if (!starBox){
    starBox = 1; const W = Math.max(2400, screen.width||0, innerWidth), H = Math.max(1600, screen.height||0, innerHeight);
    const field = (n, maxA, big) => { let out = []; for (let i=0;i<n;i++){ const x = Math.random()*W|0, y = Math.pow(Math.random(), 1.35)*H|0; const a = (.25 + Math.random()*maxA).toFixed(2);
      const tint = Math.random(); const col = tint < .12 ? `rgba(255,226,190,${a})` : tint < .25 ? `rgba(190,215,255,${a})` : `rgba(255,255,255,${a})`;
      out.push(`${x}px ${y}px 0 ${big && Math.random()<.5 ? 1 : 0}px ${col}`); } return out.join(','); };
    bg.querySelector('.s1').style.boxShadow = field(2600, .6);
    bg.querySelector('.s2').style.boxShadow = field(1100, .8, true);
    bg.querySelector('.s3').style.boxShadow = field(420, .8, true);
    bg.querySelector('.s4').style.boxShadow = field(130, .8, true);
    bg.querySelector('.s6').style.boxShadow = field(700, .95, true);
    bg.querySelector('.s7').style.boxShadow = field(160, .9, true);
    // dense dust of tiny stars along the milky way band
    const vw = Math.max(innerWidth, 1366), vh = Math.max(innerHeight, 800), k = Math.tan(24*Math.PI/180); let band = [];
    for (let i=0;i<900;i++){ const x = Math.random()*vw*1.2 - vw*.1; const g = (Math.random()+Math.random()+Math.random()-1.5)*vh*.13; const y = vh*.28 - (x - vw*.5)*k + g; const a = (.2+Math.random()*.6).toFixed(2); band.push(`${x|0}px ${y|0}px 0 0 rgba(255,250,255,${a})`); }
    bg.querySelector('.s5').style.boxShadow = band.join(',');
  }
  return bg;
}

/* shooting stars: a new one every few seconds at a random spot */
let meteorT = null;
function meteors(){
  clearTimeout(meteorT);
  const bg = document.getElementById('pvbg');
  const spawn = () => {
    const box = bg && bg.classList.contains('has-shoot') && !PV.still && !document.documentElement.classList.contains('scrolling') && !document.body.classList.contains('reduce') && document.visibilityState !== 'hidden';
    if (box){
      const R = (a,b) => a + Math.random()*(b-a);
      const n = Math.random() < .3 ? 2 : 1;
      for (let i=0;i<n;i++){
        const m = document.createElement('i'); m.className = 'meteor';
        const ang = R(18, 38), len = R(120, 280), dur = R(.7, 1.5);
        m.style.cssText = `left:${R(15,105).toFixed(1)}%;top:${R(-5,55).toFixed(1)}%;width:${len|0}px;--a:${ang.toFixed(1)}deg;--d:${(R(35,60)).toFixed(0)}vmax;animation-duration:${dur.toFixed(2)}s;animation-delay:${(i*R(.15,.6)).toFixed(2)}s`;
        bg.querySelector('.meteors').appendChild(m); setTimeout(() => m.remove(), (dur + 1) * 1000);
      }
    }
    meteorT = setTimeout(spawn, (PV.lite ? 2.2 : 1) * (1400 + Math.random()*2600));
  };
  spawn();
}

/* ---------- apply ---------- */
PV.applyTheme = (t) => {
  t = t || state.settings.theme || {id:'default'};
  const th = find(t), bg = layer(), c = th.c;
  bg.style.setProperty('--b1', c[0]); bg.style.setProperty('--b2', c[1]); bg.style.setProperty('--b3', c[2]); bg.style.setProperty('--b4', c[3]);
  bg.style.setProperty('--dir', th.dir || '125deg');
  bg.style.setProperty('--sun', th.sun || 'transparent');
  bg.style.setProperty('--sky', th.sky || 'none'); bg.style.setProperty('--cloud', th.clouds || 'transparent'); bg.style.setProperty('--milky', th.milky || 0);
  bg.className = 'pvbgx th-' + th.id + (th.sky ? ' scene' : '') + (th.stars ? ' has-stars' : '') + (th.spark ? ' has-spark' : '') + (th.milky ? ' has-milky' : '') + (th.nebula ? ' has-neb' : '') + (th.sun ? ' has-sun sun-' + (th.sunAt||'top') : '') + (th.clouds ? ' has-clouds' : '') + (th.shoot ? ' has-shoot' : '');
  // smart contrast: average brightness of the background decides the text colours used directly on it
  const L = c.reduce((s,x)=>s+lum(x),0) / c.length;
  const dark = L < .36, mid = !dark && L < .55;
  document.body.classList.toggle('bg-dark', dark);
  document.body.classList.toggle('bg-mid', mid);
  const r = document.documentElement.style;
  r.setProperty('--tint', c[1]); r.setProperty('--tint2', c[3]);
  const dom = th.dom || (th.id === 'default' ? '#FFFFFF' : mix(c[0], c[1], .6));   // dominant colour of the background
  r.setProperty('--page0', dom); r.setProperty('--page1', c[2]);
  document.body.classList.toggle('hero-dark', lum(dom) < .28);
  document.body.classList.add('themed');
  // text & boxes in the same colour family as the background, but deep enough to read
  const VARS = ['--spark','--spark2','--glass','--glassline','--glassshadow','--ink-l','--head-l','--navy-l','--muted-l','--line-l','--baby-l','--mint-l','--pastel-l','--md-r1','--md-r2','--md-rim1','--md-rim2','--md-rim3','--md-face1','--md-face2','--md-ic','--pin1','--pin2','--pin3','--board1','--board2','--boarddot','--boardline','--paper','--paperline','--paperedge','--ink','--navy','--muted','--line','--baby','--mint','--pastel','--cardbg','--acc1','--acc2','--head','--ondark'];
  const rerender = () => { if (PV._themeReady && location.hash === '#collection' && PV.route) PV.route(); PV._themeReady = true; };
  if (th.hue == null || th.id === 'default'){ VARS.forEach(v => r.removeProperty(v)); document.body.classList.remove('hued','glass-dark'); PV.themeHue = null; rerender(); return; }
  PV.themeHue = th.hue;
  const h = th.hue, H = (s,l) => hsl2hex(h, s, l);
  r.setProperty('--ink', H(42, 21)); r.setProperty('--navy', H(46, 30)); r.setProperty('--head', H(50, 26));
  r.setProperty('--muted', H(18, 42)); r.setProperty('--line', H(45, 87));
  r.setProperty('--baby', H(60, 93)); r.setProperty('--mint', H(55, 90)); r.setProperty('--pastel', H(55, 81));
  r.setProperty('--cardbg', `color-mix(in srgb, ${H(70, 97)} 92%, transparent)`);
  r.setProperty('--acc1', H(48, 34)); r.setProperty('--acc2', H(48, 46));
  r.setProperty('--ondark', H(70, 94));
  // medals, pins, pin board and stamp paper in the same colour family
  r.setProperty('--md-r1', H(45, 38)); r.setProperty('--md-r2', H(60, 74));
  r.setProperty('--md-rim1', H(85, 88)); r.setProperty('--md-rim2', H(62, 68)); r.setProperty('--md-rim3', H(45, 42));
  r.setProperty('--md-face1', H(80, 98)); r.setProperty('--md-face2', H(70, 89)); r.setProperty('--md-ic', H(50, 26));
  r.setProperty('--pin1', H(80, 84)); r.setProperty('--pin2', H(55, 52)); r.setProperty('--pin3', H(50, 26));
  r.setProperty('--board1', H(65, 97)); r.setProperty('--board2', H(55, 92)); r.setProperty('--boarddot', H(45, 62)); r.setProperty('--boardline', H(45, 85));
  r.setProperty('--paper', H(70, 97)); r.setProperty('--paperline', H(40, 55)); r.setProperty('--paperedge', H(50, 86));
  // glassy boxes in a richer tint of the theme colour
  r.setProperty('--ink-l', H(42, 21)); r.setProperty('--head-l', H(50, 26)); r.setProperty('--navy-l', H(46, 30)); r.setProperty('--muted-l', H(18, 42));
  r.setProperty('--line-l', H(45, 87)); r.setProperty('--baby-l', H(60, 93)); r.setProperty('--mint-l', H(55, 90)); r.setProperty('--pastel-l', H(55, 81));
  if (dark){
    r.setProperty('--glass', `color-mix(in srgb, ${H(55, 16)} 80%, transparent)`);
    r.setProperty('--glassline', `color-mix(in srgb, ${H(70, 80)} 40%, transparent)`);
    r.setProperty('--glassshadow', `0 8px 30px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.08)`);
    r.setProperty('--ink', H(50, 97)); r.setProperty('--head', '#FFFFFF'); r.setProperty('--navy', H(90, 90)); r.setProperty('--muted', H(40, 86));
    r.setProperty('--line', `color-mix(in srgb, ${H(70, 80)} 40%, transparent)`);
    r.setProperty('--baby', 'rgba(255,255,255,.09)'); r.setProperty('--mint', 'rgba(255,255,255,.12)'); r.setProperty('--pastel', 'rgba(255,255,255,.18)');
    r.setProperty('--cardbg', `color-mix(in srgb, ${H(55, 16)} 80%, transparent)`);
  } else {
    r.setProperty('--glass', `color-mix(in srgb, ${H(78, 91)} 86%, transparent)`);
    r.setProperty('--glassline', `color-mix(in srgb, ${H(65, 76)} 85%, transparent)`);
    r.setProperty('--glassshadow', `0 8px 26px color-mix(in srgb, ${H(55, 40)} 18%, transparent), inset 0 1px 0 rgba(255,255,255,.6)`);
    r.setProperty('--cardbg', `color-mix(in srgb, ${H(78, 92)} 88%, transparent)`);
  }
  document.body.classList.toggle('glass-dark', dark);
  r.setProperty('--spark', dark ? H(80, 88) : H(85, 66)); r.setProperty('--spark2', dark ? '#FFFFFF' : H(90, 78));
  document.body.classList.add('hued');
  rerender();
};

/* ---------- settings section ---------- */
PV.themeSection = () => {
  const t = state.settings.theme || {id:'default'};
  const sw = (x) => `<button type="button" class="thm ${t.id===x.id?'on':''}" data-th="${x.id}" title="${PV.L(x.vi,x.en)}">
      <i style="background:${x.sky || `linear-gradient(${x.dir||'135deg'},${x.c[0]},${x.c[1]} 55%,${x.c[3]})`}">${x.stars?'<b class="tw">✦</b>':''}${x.sun?'<b class="sn"></b>':''}</i><span>${PV.L(x.vi,x.en)}</span></button>`;
  const hue = t.hue ?? 210, depth = t.depth ?? 25;
  return `<h4 style="margin:14px 0 6px">${PV.L('Màu trang & hình nền','Page colours & background')}</h4>
   <div class="tiny muted">${PV.L('Tông pastel','Pastel tones')}</div>
   <div class="thm-grid">${PASTEL.map(sw).join('')}</div>
   <div class="tiny muted" style="margin-top:10px">${PV.L('Chủ đề bầu trời','Sky themes')}</div>
   <div class="thm-grid">${SCENES.map(sw).join('')}</div>
   <div class="tiny muted" style="margin-top:10px">${PV.L('Tự chọn màu','Pick your own colour')}</div>
   <div class="thm-custom ${t.id==='custom'?'on':''}">
     <label class="tiny">${PV.L('Màu','Colour')}<input type="range" id="thHue" min="0" max="359" value="${hue}" class="huebar"></label>
     <label class="tiny">${PV.L('Độ đậm','Strength')}<input type="range" id="thDepth" min="0" max="100" value="${depth}" class="depthbar"></label>
     <div class="row" style="gap:8px;align-items:center"><input type="color" id="thPick" value="${hsl2hex(hue,70,55)}" title="${PV.L('Chọn màu bất kỳ','Any colour')}"><span class="tiny muted">${PV.L('Chữ, khung và nút tự đổi theo cùng tông màu, đậm vừa đủ để dễ đọc','Text, boxes and buttons follow the same colour family, deep enough to read')}</span></div>
   </div>`;
};
PV.bindTheme = (box) => {
  const save = (t) => { state.settings.theme = t; PV.save('settings'); PV.applyTheme(t); $$('.thm', box).forEach(b => b.classList.toggle('on', b.dataset.th === t.id)); $('.thm-custom', box)?.classList.toggle('on', t.id==='custom'); paintBars(); };
  $$('.thm', box).forEach(b => b.onclick = () => save({id:b.dataset.th}));
  const hue = $('#thHue', box), dep = $('#thDepth', box), pick = $('#thPick', box);
  const paintBars = () => { if (!dep) return; const h = +hue.value; dep.style.background = `linear-gradient(90deg,#fff,${hsl2hex(h,70,55)})`; };
  const custom = () => save({id:'custom', hue:+hue.value, depth:+dep.value});
  if (hue){ hue.oninput = () => { pick.value = hsl2hex(+hue.value,70,55); custom(); }; dep.oninput = custom; pick.oninput = () => { hue.value = hex2hue(pick.value); custom(); }; paintBars(); }
};

/* the welcome / onboarding screen uses the same background once the user picked one */
PV.themeInto = (ov) => {
  const t = state.settings.theme;
  if (!ov || !t || !t.id || t.id === 'default') return;
  const src = document.getElementById('pvbg'); if (!src) return;
  const c = src.cloneNode(true); c.removeAttribute('id'); c.classList.add('pvbg-clone');
  ov.prepend(c); ov.classList.add('ov-themed');
};
PV.applyTheme();
meteors();
})();
