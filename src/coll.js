/* ===== Personavel – Saigon Collection: stamps, medals and the stamping ceremony ===== */
(function(){
'use strict';
const {D, $, $$, esc, state} = PV;

/* ---------- simple line icons (48×48, stroke = currentColor) ---------- */
const I = {
  palace:'<path d="M6 40h36M9 40V22h30v18M6 22h36M12 22v-5h24v5M15 28h3M22.5 28h3M30 28h3M15 34h3M22.5 34h3M30 34h3M24 17V7m0 0h7l-2 2.5 2 2.5h-7"/>',
  church:'<path d="M8 41h32M12 41V20l5-9 5 9v21M26 41V20l5-9 5 9v21M22 41V29a2 2 0 0 1 4 0v12M17 25v3M31 25v3M17 6v4M31 6v4M15.5 7.5h3M29.5 7.5h3"/>',
  post:'<path d="M5 41h38M8 41V22c0-7 7-12 16-12s16 5 16 12v19M14 41V27a10 10 0 0 1 20 0v14M24 19a3 3 0 1 0 0-.01M24 17.5V19l1 1"/>',
  theatre:'<path d="M6 41h36M9 41V19l15-10 15 10v22M9 19h30M17 41v-9a7 7 0 0 1 14 0v9M14 24v4M34 24v4"/>',
  museum:'<path d="M6 41h36M8 37h32M8 18h32L24 8 8 18zM12 21v13M19 21v13M29 21v13M36 21v13"/>',
  market:'<path d="M5 41h38M8 41V27h32v14M8 27l4-6h24l4 6M20 41v-8h8v8M19 21V12h10v9M24 12V8M24 18a2 2 0 1 0 0-.01"/>',
  pagoda:'<path d="M8 41h32M14 41V33h20v8M10 33h28l-4-5H14zM16 28v-5h16v5M12 23h24l-4-5H16zM18 18v-4h12v4M15 14h18l-6-6h-6zM24 8V5"/>',
  book:'<path d="M24 14c-5-4-12-4-17-2v26c5-2 12-2 17 2 5-4 12-4 17-2V12c-5-2-12-2-17 2zM24 14v26M11 19c3-1 6-1 9 0M11 25c3-1 6-1 9 0M28 19c3-1 6-1 9 0M28 25c3-1 6-1 9 0"/>',
  school:'<path d="M4 18l20-9 20 9-20 9zM12 22v10c4 4 20 4 24 0V22M40 20v12M38 32h4"/>',
  bowl:'<path d="M6 24h36c0 9-8 15-18 15S6 33 6 24zM18 39v3h12v-3M30 8l-8 13M36 9l-10 12M16 17c-2-2 2-4 0-6M22 17c-2-2 2-4 0-6"/>',
  banhmi:'<path d="M6 31c0-6 10-14 24-14 7 0 12 2 12 6 0 6-10 14-24 14-7 0-12-2-12-6zM14 26l4 4M20 22l4 4M26 19l4 4M33 18l3 3"/>',
  dessert:'<path d="M13 18h22l-3 22H16zM11 18h26M18 18c0-5 3-8 6-8s6 3 6 8M24 10V7M17 26h14M18 32h12"/>',
  snail:'<path d="M8 36h28c5 0 7-4 6-7M30 36a11 11 0 1 0-20-6c0 5 4 8 8 8M18 30a5 5 0 1 1 6 4M38 27l2-6M42 28l3-5"/>',
  pot:'<path d="M8 22h32v10a10 10 0 0 1-10 10H18A10 10 0 0 1 8 32zM4 24h4M40 24h4M16 22v-3h16v3M18 15c-2-2 2-4 0-6M24 15c-2-2 2-4 0-6M30 15c-2-2 2-4 0-6"/>',
  bag:'<path d="M10 17h28l-2 24H12zM17 17v-3a7 7 0 0 1 14 0v3M18 23a6 6 0 0 0 12 0"/>',
  gift:'<path d="M8 20h32v7H8zM10 27h28v14H10zM24 20v21M24 20c-4-1-9-5-6-9 3-3 6 3 6 9zM24 20c4-1 9-5 6-9-3-3-6 3-6 9z"/>',
  shirt:'<path d="M17 8l-9 5-4 9 6 3 2-4v19h24V21l2 4 6-3-4-9-9-5c0 3-3 6-7 6s-7-3-7-6z"/>',
  camera:'<path d="M6 16h8l3-5h14l3 5h8v22H6zM24 34a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM36 21h2"/>',
  wheel:'<path d="M24 25a11 11 0 1 0 0-.01M24 14v22M13 25h22M16 17l16 16M32 17L16 33M17 42l7-17 7 17M13 42h22"/>',
  tree:'<path d="M24 42V27M24 31l-6-4M24 29l5-4M24 8c-8 0-13 6-12 12-4 2-4 9 2 10 3 1 7 0 10-2 3 2 7 3 10 2 6-1 6-8 2-10 1-6-4-12-12-12z"/>',
  street:'<path d="M24 6v36M10 12h22l4 4-4 4H10zM38 24H16l-4 4 4 4h22zM18 42h12"/>',
  star:'<path d="M24 6l5.5 11.5 12.5 1.7-9.1 8.7 2.3 12.4L24 34.3l-11.2 6 2.3-12.4L6 19.2l12.5-1.7z"/>',
  diary:'<path d="M12 6h22a3 3 0 0 1 3 3v33H15a3 3 0 0 1-3-3zM12 36a3 3 0 0 1 3-3h22M18 13h12M18 19h9M30 24l-5 5-2 1 1-2 5-5z"/>',
  headphones:'<path d="M8 30v-4a16 16 0 0 1 32 0v4M8 30h6v10H8zM34 30h6v10h-6zM20 22l3 3 6-6"/>',
  lock:'<path d="M15 22v-5a9 9 0 0 1 18 0v5M12 22h24v18H12zM24 29v5"/>'
};
const icon = (k, cls='') => `<svg class="ic ${cls}" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]||I.star}</svg>`;
PV.collIcon = icon;

/* what makes each place recognisable */
PV.placeIcon = (p) => {
  const n = (p.name||'').toLowerCase();
  const has = (...w) => w.some(x => n.includes(x));
  if (has('dinh')) return 'palace';
  if (has('nhà thờ')) return 'church';
  if (has('bưu điện')) return 'post';
  if (has('nhà hát')) return 'theatre';
  if (has('bảo tàng')) return 'museum';
  if (has('chợ bến thành') ) return 'market';
  if (has('chùa')) return 'pagoda';
  if (has('đường sách','books')) return 'book';
  if (has('trường')) return 'school';
  if (has('bánh mì')) return 'banhmi';
  if (has('chè','flan','tàu hủ','xôi chè','marou')) return 'dessert';
  if (has('ốc','bạch tuộc')) return 'snail';
  if (has('lẩu')) return 'pot';
  if (has('cung đường thời trang','playground')) return 'shirt';
  if (has('quà','gift','souvenir','kitsch','craft','đặc sản','langfarm','nutty','yugoc','kokonic','légumes')) return 'gift';
  const c = PV.mainCat(p);
  return {history:'museum', food:'bowl', shopping:'bag', checkin:'camera', entertainment:'wheel', nature:'tree'}[c] || 'star';
};
const INK = {history:'#2F6FA3', food:'#D2691E', shopping:'#B08A12', checkin:'#7653B8', entertainment:'#C9507E', nature:'#2F8F6D'};
const ink = p => INK[PV.mainCat(p)] || '#2F6FA3';
const pname = p => (PV.lang==='en' && p.name_en) ? p.name_en : p.name;
const rot = id => { let h=0; for (const c of String(id)) h = (h*31 + c.charCodeAt(0)) % 997; return (h % 17) - 8; };

/* cute stamp (SVG): scalloped edge, pastel tint, ribbon with the place name */
const FONT = "'Nunito','Quicksand','Segoe UI',system-ui,sans-serif";
function scallop(cx, cy, r, n, amp){
  let d = '';
  for (let i=0;i<n;i++){
    const a0 = i/n*Math.PI*2 - Math.PI/2, a1 = (i+1)/n*Math.PI*2 - Math.PI/2, am = (a0+a1)/2;
    const x0 = cx + r*Math.cos(a0), y0 = cy + r*Math.sin(a0), x1 = cx + r*Math.cos(a1), y1 = cy + r*Math.sin(a1);
    const qx = cx + (r+amp*2)*Math.cos(am), qy = cy + (r+amp*2)*Math.sin(am);
    d += (i ? '' : `M${x0.toFixed(1)} ${y0.toFixed(1)}`) + `Q${qx.toFixed(1)} ${qy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  return d + 'Z';
}
const SC_OUT = scallop(60, 60, 50, 18, 3.2), SC_WAIT = scallop(60, 60, 50, 16, 3);
const spark = (x, y, s, c) => `<path d="M${x} ${y-s}Q${x} ${y} ${x+s} ${y}Q${x} ${y} ${x} ${y+s}Q${x} ${y} ${x-s} ${y}Q${x} ${y} ${x} ${y-s}Z" fill="${c}"/>`;
const PAL = {history:['#7FB8E6','#E6F3FD','#2F6FA3'], food:['#F6A96B','#FFEEE2','#B9581A'], shopping:['#F2C94C','#FFF7DA','#9A760A'],
  checkin:['#B79AE8','#F3EDFE','#6646AC'], entertainment:['#F49BBE','#FDE8F0','#B03F69'], nature:['#7FD1B2','#E4F8F0','#2A8062']};
const CAT_OFF = {history:0, food:22, shopping:-22, checkin:44, entertainment:-44, nature:66};
const pal = p => {
  const cat = PV.mainCat(p), h0 = PV.themeHue;
  if (h0 == null) return PAL[cat] || PAL.history;
  const h = (h0 + (CAT_OFF[cat] || 0) + 360) % 360, H = PV.colorUtil.hsl2hex;
  return [H(h, 62, 70), H(h, 80, 95), H(h, 48, 30)];
};
const SC_BIG = scallop(65, 64, 55, 22, 3.2);
const flower = (x, y, r, c) => `<g transform="translate(${x} ${y})">${[0,72,144,216,288].map(a=>`<circle cx="${(Math.cos(a*Math.PI/180)*r).toFixed(1)}" cy="${(Math.sin(a*Math.PI/180)*r).toFixed(1)}" r="${(r*.78).toFixed(1)}" fill="${c}"/>`).join('')}<circle r="${(r*.6).toFixed(1)}" fill="#FFD54F"/></g>`;
const heart = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 3C-2-1-7 0-7 4c0 3 4 6 7 8 3-2 7-5 7-8 0-4-5-5-7-1z" fill="${c}"/>`;
const miniBot = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">
    <rect x="3.5" y="9" width="23" height="18" rx="8.5" fill="#fff" stroke="#9DB4C8" stroke-width="1.6"/>
    <rect x="7" y="13" width="16" height="8.5" rx="4.2" fill="#2B3A4A"/>
    <path d="M9.6 18.4q1.6-2 3.2 0M17.2 18.4q1.6-2 3.2 0" stroke="#7FE3F0" stroke-width="1.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="7.5" cy="24" rx="2" ry="1.2" fill="#F7A1B5"/><ellipse cx="22.5" cy="24" rx="2" ry="1.2" fill="#F7A1B5"/>
    <path d="M15 -1L31 10.5H-1z" fill="#F6D365" stroke="#D4A62A" stroke-width="1.4" stroke-linejoin="round"/><path d="M15 -1l-4 11.5M15 -1l4 11.5" stroke="#D4A62A" stroke-width=".8"/>
    <path d="M3 27q2 4 6 3M27 27q-2 4-6 3" stroke="#D62839" stroke-width="2" fill="none" stroke-linecap="round"/></g>`;
PV.stampSVG = (p, date) => {
  const [c, lt, dk] = pal(p); const cat = PV.mainCat(p);
  let nm = pname(p).replace(/\s*[–(].*$/,'').trim(); if (nm.length > 46) nm = nm.slice(0,45).trim()+'…';
  // no glyph squeezing: pick a size, wrap long names onto two lines
  let lines = [nm], fs = 11.5;
  if (nm.length > 14 && nm.length <= 18) fs = 10;
  else if (nm.length > 18){
    const w = nm.split(' '); let best = [nm, ''], diff = 1e9;
    for (let i=1;i<w.length;i++){ const a=w.slice(0,i).join(' '), b=w.slice(i).join(' '); const d=Math.abs(a.length-b.length); if (d<diff){ diff=d; best=[a,b]; } }
    lines = best[1] ? best : [nm]; const L = Math.max(...lines.map(x=>x.length)); fs = L > 20 ? 7.8 : L > 17 ? 8.6 : L > 14 ? 9.4 : 10.2;
  }
  const two = lines.length === 2, rY = two ? 69 : 74, rH = two ? 30 : 22;
  const nameTxt = two
    ? `<text fill="#fff" font-size="${fs}" font-weight="800" text-anchor="middle"><tspan x="65" y="81.6">${esc(lines[0])}</tspan><tspan x="65" y="${(81.6+fs*1.12).toFixed(1)}">${esc(lines[1])}</tspan></text>`
    : `<text x="65" y="${(85+fs*.4).toFixed(1)}" fill="#fff" font-size="${fs}" font-weight="800" text-anchor="middle">${esc(nm)}</text>`;
  const dY = two ? 102 : 99;
  const d = (date||'').split('/'); const short = d.length===3 ? d[0]+'/'+d[1]+'/'+d[2].slice(-2) : date;
  return `<svg class="stampsvg" viewBox="0 0 130 136" aria-hidden="true" font-family="${FONT}">
    <path d="${SC_BIG}" fill="${c}" transform="translate(0 2.5)" opacity=".35"/>
    <path d="${SC_BIG}" fill="${c}"/>
    <circle cx="65" cy="64" r="48" fill="${lt}"/><circle cx="65" cy="64" r="48" fill="url(#pvDot-${cat})"/>
    <circle cx="65" cy="64" r="44" fill="none" stroke="#fff" stroke-width="2.2" stroke-dasharray="2.5 4.5" stroke-linecap="round"/>
    ${heart(56,12,.62,'#F78FA7')}${heart(65,7,.8,'#F45D82')}${heart(74,12,.62,'#F78FA7')}
    <circle cx="65" cy="52" r="23" fill="#fff" stroke="${c}" stroke-width="3.2"/>
    <circle cx="65" cy="52" r="18.5" fill="${lt}"/>
    <g transform="translate(51 38) scale(.583)" fill="#fff" stroke="${dk}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">${I[PV.placeIcon(p)]||I.star}</g>
    ${flower(27,40,3.4,'#fff')}${flower(104,44,2.8,'#fff')}${spark(33,26,4.5,'#FFD54F')}${spark(100,27,3.6,'#fff')}${spark(24,58,2.6,'#fff')}
    <path d="M9 ${rY+5}h10l-3.6 ${rH/2-5} 3.6 ${rH/2-5}H7l2.6-${rH/2-5}z M121 ${rY+5}h-10l3.6 ${rH/2-5}-3.6 ${rH/2-5}h12l-2.6-${rH/2-5}z" fill="${dk}" opacity=".75"/>
    <rect x="15" y="${rY}" width="100" height="${rH}" rx="11" fill="${dk}"/>
    <rect x="18" y="${rY+2.5}" width="94" height="${rH-5}" rx="8.5" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>
    ${nameTxt}
    <rect x="19" y="${dY}" width="${short?66:0}" height="14" rx="7" fill="#fff" stroke="${c}" stroke-width="1.6"/>
    ${short?`<text x="52" y="${dY+10.4}" fill="${dk}" font-size="8.6" font-weight="800" text-anchor="middle">${esc(PV.L('đã ghé','visited'))} ♥ ${esc(short)}</text>`:''}
    ${miniBot(92,dY-2,.95,-12)}
  </svg>`;
};
PV.stampWaitSVG = (p) => `<svg class="stampwait" viewBox="0 0 120 120" aria-hidden="true">
    <path d="${SC_WAIT}" fill="#fff" stroke="currentColor" stroke-width="2.6" stroke-dasharray="5 5" stroke-linecap="round" stroke-linejoin="round"/>
    <g transform="translate(36 36)" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${I[PV.placeIcon(p)]||I.star}</g></svg>`;
/* cute medal (SVG) for badges */
const PIN = `<svg class="tack" viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="22" cy="31" rx="9" ry="3" fill="#000" opacity=".12"/><path d="M20 20v12" stroke="#8A97A3" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="15" r="11" fill="url(#pvPinB)" style="stroke:var(--pin3,#173E60)" stroke-width=".8"/><circle cx="20" cy="15" r="6.5" fill="none" stroke="#fff" stroke-width="1" opacity=".25"/><ellipse cx="16" cy="11" rx="4" ry="2.6" fill="#fff" opacity=".55" transform="rotate(-30 16 11)"/></svg>`;
const BADGE_ICON = {b1:'museum', b2:'bowl', b3:'star', b4:'gift', b5:'camera', b6:'street', b7:'diary', b8:'headphones'};
const LAUREL = (() => { // two small laurel branches around the medal face
  let d = '';
  for (const side of [-1, 1]) for (let i=0;i<6;i++){
    const ang = (118 + i*19) * Math.PI/180; const x = 50 + side*Math.cos(ang)*-21, y = 84 + Math.sin(ang)*21*-1 + 0;
    const rot = side*(-(118 + i*19) + 90);
    d += `<ellipse cx="${(50 - side*21*Math.cos(Math.PI - ang)).toFixed(1)}" cy="${(84 + 21*Math.sin(ang - Math.PI)*-1).toFixed(1)}" rx="2.1" ry="4.6" transform="rotate(${(side*(i*19 - 28)).toFixed(0)} ${(50 - side*21*Math.cos(Math.PI - ang)).toFixed(1)} ${(84 + 21*Math.sin(ang - Math.PI)*-1).toFixed(1)})"/>`;
  }
  return d;
})();
const SC_MED = scallop(50, 84, 31, 14, 3.2);
PV.medalSVG = (b) => {
  const got = b.got;
  const V = (n, d) => `var(--md-${n},${d})`;
  return `<svg class="medalsvg ${got?'':'locked'}" viewBox="0 0 100 124" aria-hidden="true">
    <path d="M44 6h9l-8 44-13-5z" style="fill:${got?V('r1','#1F4E79'):'#C9D3DC'}"/><path d="M47 6h9l13 39-13 5z" style="fill:${got?V('r2','#7FB8E6'):'#B7C3CD'}"/>
    <path d="M50 9c-6-7-15-6-15 0s9 7 15 0zM50 9c6-7 15-6 15 0s-9 7-15 0z" style="fill:${got?V('r2','#7FB8E6'):'#C9D3DC'};stroke:${got?V('r1','#1F4E79'):'#AEB9C4'}" stroke-width="1.6" stroke-linejoin="round"/>
    <circle cx="50" cy="9" r="3.4" style="fill:${got?V('r1','#1F4E79'):'#AEB9C4'}"/>
    <path d="${SC_MED}" transform="translate(0 2.5)" fill="#000" opacity=".10"/>
    <path d="${SC_MED}" style="fill:${got?'url(#pvRimG)':'url(#pvRimS)'};stroke:${got?V('rim3','#C9971F'):'#9AA6B2'}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="50" cy="84" r="25" style="fill:${got?'url(#pvFaceG)':'url(#pvFaceS)'};stroke:${got?V('rim2','#E8B730'):'#B6C1CB'}" stroke-width="1.6"/>
    <circle cx="50" cy="84" r="21" fill="none" style="stroke:${got?V('rim2','#E8B730'):'#C9D3DC'}" stroke-width="1.4" stroke-dasharray=".1 3.6" stroke-linecap="round"/>
    <g transform="translate(37 71) scale(.54)" fill="none" style="stroke:${got?V('ic','#1F4E79'):'#98A5B1'}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">${I[got?BADGE_ICON[b.id]:'lock']}</g>
    ${got?`<path d="M27 72a25 25 0 0 1 12-12" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity=".7"/>${spark(76,62,4,'#fff')}`:''}
  </svg>`;
};
/* shared SVG defs (ink roughness + gold gradient) */
function defs(){
  if ($('#pvDefs')) return;
  document.body.insertAdjacentHTML('beforeend', `<svg id="pvDefs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
    <filter id="pvInk" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="1.3" result="d"/>
      <feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="2" seed="8" result="m"/><feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.5 1.95" result="mask"/><feComposite in="d" in2="mask" operator="in"/></filter>
    ${Object.entries(PAL).map(([k,v])=>`<pattern id="pvDot-${k}" width="9" height="9" patternUnits="userSpaceOnUse"><circle cx="2.2" cy="2.2" r="1.3" fill="${v[0]}" opacity=".45"/><circle cx="6.7" cy="6.7" r="1.3" fill="${v[0]}" opacity=".45"/></pattern>`).join('')}
    <linearGradient id="pvRimG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--md-rim1,#FFE38A)"/><stop offset=".5" style="stop-color:var(--md-rim2,#E8B730)"/><stop offset=".72" style="stop-color:var(--md-rim1,#FCD96A)"/><stop offset="1" style="stop-color:var(--md-rim3,#B98510)"/></linearGradient>
    <linearGradient id="pvRimS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F3F6F8"/><stop offset=".5" stop-color="#CBD4DC"/><stop offset="1" stop-color="#A9B5C0"/></linearGradient>
    <radialGradient id="pvFaceG" cx="40%" cy="35%" r="75%"><stop offset="0" style="stop-color:var(--md-face1,#FFFBEA)"/><stop offset="1" style="stop-color:var(--md-face2,#F6E2A0)"/></radialGradient>
    <radialGradient id="pvFaceS" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4EAF0"/></radialGradient>
    <radialGradient id="pvPinB" cx="38%" cy="32%" r="70%"><stop offset="0" style="stop-color:var(--pin1,#9FD0F5)"/><stop offset=".5" style="stop-color:var(--pin2,#3D86C0)"/><stop offset="1" style="stop-color:var(--pin3,#1A4469)"/></radialGradient>
    <radialGradient id="pvPinG" cx="40%" cy="35%" r="65%"><stop offset="0" stop-color="#FF8A8A" stop-opacity=".9"/><stop offset=".6" stop-color="#D62839" stop-opacity="0"/><stop offset="1" stop-color="#7A0E1C" stop-opacity=".5"/></radialGradient>
    <radialGradient id="pvGold" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#FFF1B0"/><stop offset=".55" stop-color="#F2C744"/><stop offset="1" stop-color="#D19B1C"/></radialGradient>
  </defs></svg>`);
}

/* ---------- collection page ---------- */
PV.views.collection = (m) => {
  defs();
  const visitedIds = Object.keys(state.visited).filter(id => PV.byId(id)).reverse(); // newest first
  const got = visitedIds.length, total = D.places.length;
  const badges = PV.badges();
  const pending = D.places.filter(p => !state.visited[p.id]);
  m.innerHTML = `<h1 class="title">Bộ sưu tập Sài Gòn</h1><p class="sub">Mỗi nơi bạn ghé thăm là một dấu mộc điện tử. Hoàn thành chủ đề để mở khóa huy hiệu.</p>
  <div class="card"><div class="row"><b>Tiến độ khám phá</b><span class="spacer"></span><span class="muted small">${got}/${total} địa điểm · ${state.points} điểm · ${badges.filter(b=>b.got).length}/${badges.length} huy hiệu</span></div><div class="bar" style="margin-top:8px"><i style="width:${Math.round(got/total*100)}%"></i></div></div>
  <h2 class="coll-title">🏅 Huy hiệu <span class="cnt">${badges.filter(b=>b.got).length}/${badges.length}</span></h2>
  <div class="pinboard"><div class="badges">${badges.map((b,i)=>`<div class="badge2 ${b.got?'got':''}" data-badge="${b.id}">
      <div class="hang">${PIN}<div class="medal" style="animation-delay:-${(i*0.73)%3.4}s">${PV.medalSVG(b)}</div></div><b>${esc(b.name)}</b><div class="tiny muted">${esc(b.need)}</div>
      <div class="bar" style="margin-top:8px"><i style="width:${Math.min(100,b.cur/b.max*100)}%"></i></div><div class="tiny">${Math.min(b.cur,b.max)}/${b.max}</div></div>`).join('')}</div></div>
  <h2 class="coll-title">📮 Dấu mộc đã nhận <span class="cnt">${got}</span></h2>
  <div class="paper"><div class="stamps2">${visitedIds.map(id => { const p = PV.byId(id); return `<button class="stamp2 got" data-stamp="${p.id}" data-pid="${p.id}" style="--r:${rot(p.id)}deg;color:${ink(p)}" title="${esc(p.name)}">${PV.stampSVG(p, state.visited[id])}${(()=>{const r=PV.myReview&&PV.myReview(p.id);return r?`${r.fav?'<span class="stamp-fav">❤</span>':''}${r.stars?`<span class="stamp-star">★${r.stars}</span>`:''}`:'';})()}</button>`; }).join('') || '<div class="empty">Chưa có dấu mộc. Khi đến một địa điểm, mở thông tin và bấm “Tôi đã ghé thăm”.</div>'}</div></div>
  <h2 class="coll-title">🗺️ Dấu mộc đang chờ bạn <span class="cnt">${pending.length}</span></h2>
  <div class="stamps2 wait">${pending.map(p=>`<button class="stamp2" data-pid="${p.id}" style="--c:${ink(p)}"><span class="ring">${PV.stampWaitSVG(p)}</span><span class="nm">${esc(p.name)}</span></button>`).join('')}</div>`;
  PV.bindItems(m);
};

/* ---------- remember an open place drawer so we can come back to it ---------- */
const _open = PV.openPlace, _close = PV.closeDrawer;
PV.openPlace = (id, opt={}) => { PV._drawer = {id, opt}; return _open(id, opt); };
PV.closeDrawer = () => { PV._drawer = null; return _close(); };

/* ---------- the ceremony: open the collection, stamp the exact spot, tap to go back ---------- */
const C = {q:[], ret:null, drawer:null, timer:null, active:false, ready:false, timers:[], hidden:null};
const later = (fn, ms) => { const id = setTimeout(fn, ms); C.timers.push(id); return id; };
PV.queueCeleb = (item) => {
  if (C.q.some(x => x.type===item.type && x.id===item.id)) return;
  C.q.push(item);
  if (!C.active && !C.timer) C.timer = setTimeout(start, 250);
};
function start(){
  C.timer = null; if (!C.q.length) return;
  C.active = true;
  const h = location.hash || '#home';
  if (h !== '#collection') { C.ret = h; C.drawer = PV._drawer; }
  else if (!C.ret) { C.ret = null; C.drawer = null; }
  if (h === '#collection') PV.route(); else location.hash = '#collection';
  later(next, 420);
}
function layer(){
  let ov = $('#slam');
  if (!ov){
    ov = document.createElement('div'); ov.id = 'slam'; ov.className = 'slam-ov';
    ov.innerHTML = `<button class="slam-skip" type="button">${PV.L('Bỏ qua','Skip')} ⏭</button><div class="slam-cap" aria-live="polite"></div><div class="slam-hint">${PV.L('Chạm vào màn hình để quay lại','Tap anywhere to go back')}</div>`;
    ov.querySelector('.slam-skip').addEventListener('click', e => { e.stopPropagation(); skipAll(); });
    document.body.appendChild(ov);
    ov.addEventListener('click', () => { if (!C.ready) return; if (C.q.length) next(); else finish(); });
    document.addEventListener('keydown', onKey);
  }
  return ov;
}
function skipAll(){
  C.timers.forEach(clearTimeout); C.timers = []; C.q = [];
  $$('.bigstage').forEach(n => n.remove());
  if (C.hidden) C.hidden.style.visibility = ''; C.hidden = null;
  finish();
}
function onKey(e){ if ((e.key==='Escape' || e.key==='Enter' || e.key===' ') && $('#slam') && C.ready){ e.preventDefault(); if (C.q.length) next(); else finish(); } }
const STAMPER = (c) => `<svg viewBox="0 0 100 140" aria-hidden="true">
  <defs><linearGradient id="pvWood" x1="0" x2="1"><stop offset="0" stop-color="#A86A3A"/><stop offset=".45" stop-color="#D9A066"/><stop offset="1" stop-color="#9A5F33"/></linearGradient></defs>
  <circle cx="50" cy="22" r="18" fill="url(#pvWood)" stroke="#7A4A26" stroke-width="2"/><ellipse cx="44" cy="15" rx="6" ry="4" fill="#fff" opacity=".35"/>
  <rect x="41" y="36" width="18" height="30" rx="4" fill="url(#pvWood)" stroke="#7A4A26" stroke-width="2"/>
  <rect x="30" y="62" width="40" height="8" rx="3" fill="#8A5530"/>
  <rect x="12" y="68" width="76" height="36" rx="9" fill="url(#pvWood)" stroke="#7A4A26" stroke-width="2"/>
  <rect x="20" y="75" width="60" height="6" rx="3" fill="#fff" opacity=".22"/>
  <rect x="9" y="102" width="82" height="16" rx="4" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="1.5"/>
  <rect x="13" y="114" width="74" height="4" rx="2" fill="#000" opacity=".15"/></svg>`;

/* little sound effects made with Web Audio (no files): stamp thump, party popper + crackles */
PV.sfx = (() => {
  let ctx = null;
  const ac = () => { try { if (!ctx) ctx = new (window.AudioContext||window.webkitAudioContext)(); if (ctx.state==='suspended') ctx.resume(); } catch(e){ ctx = null; } return ctx; };
  const noise = (c, dur) => { const b = c.createBuffer(1, Math.max(1, c.sampleRate*dur|0), c.sampleRate); const d = b.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1; const s = c.createBufferSource(); s.buffer = b; return s; };
  const on = () => !(state.settings && state.settings.sound === false);
  const bell = (c, t, f, g, d) => { const o = c.createOscillator(), gg = c.createGain(); o.type='sine'; o.frequency.value=f;
    gg.gain.setValueAtTime(.0001,t); gg.gain.exponentialRampToValueAtTime(g,t+.02); gg.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(gg).connect(c.destination); o.start(t); o.stop(t+d+.05); };
  const puff = (c, t, g) => { const n = noise(c,.6), f = c.createBiquadFilter(), gg = c.createGain(); f.type='lowpass'; f.frequency.value=700;
    gg.gain.setValueAtTime(.0001,t); gg.gain.exponentialRampToValueAtTime(g,t+.03); gg.gain.exponentialRampToValueAtTime(.0001,t+.55); n.connect(f).connect(gg).connect(c.destination); n.start(t); };
  return {
    /* soft wooden "tok" when the stamp touches the paper */
    thump(){ const c = ac(); if (!c || !on()) return; const t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter(); o.type='sine'; o.frequency.setValueAtTime(240, t); o.frequency.exponentialRampToValueAtTime(130, t+.18);
      f.type='lowpass'; f.frequency.value=900; g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.32, t+.015); g.gain.exponentialRampToValueAtTime(.0001, t+.35);
      o.connect(f).connect(g).connect(c.destination); o.start(t); o.stop(t+.4); },
    /* gentle fireworks: distant soft puffs, each followed by a few twinkling bells (~3.5 s) */
    popper(){ const c = ac(); if (!c || !on()) return; const t0 = c.currentTime;
      const notes = [1046.5, 1174.7, 1318.5, 1568, 1760, 2093];
      [0, .7, 1.4, 2.2].forEach((dt, k) => { const t = t0 + dt; puff(c, t, .07 - k*.01);
        for (let i=0;i<5;i++) bell(c, t + .12 + i*.09 + Math.random()*.05, notes[(i*2+k)%notes.length], .035, .9); });
      bell(c, t0 + .05, 784, .05, 1.4); bell(c, t0 + .05, 1174.7, .03, 1.6); }
  };
})();

/* stamper seen from the viewer's side: wooden handle top, rubber rim in the ink colour */
const STAMP_TOP = (c) => `<svg viewBox="0 0 200 200" aria-hidden="true">
  <defs><radialGradient id="pvWoodT" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#E7B57C"/><stop offset=".6" stop-color="#C98A50"/><stop offset="1" stop-color="#94592D"/></radialGradient>
  <radialGradient id="pvKnob" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#F1C891"/><stop offset=".55" stop-color="#C98A50"/><stop offset="1" stop-color="#7E4A24"/></radialGradient></defs>
  <circle cx="100" cy="100" r="97" fill="${c}"/>
  <circle cx="100" cy="100" r="90" fill="url(#pvWoodT)" stroke="#7A4A26" stroke-width="3"/>
  <circle cx="100" cy="100" r="76" fill="none" stroke="#8A5530" stroke-width="2" opacity=".5"/>
  <circle cx="100" cy="100" r="64" fill="none" stroke="#8A5530" stroke-width="1.5" opacity=".35"/>
  <circle cx="104" cy="106" r="44" fill="#000" opacity=".22"/>
  <circle cx="100" cy="100" r="44" fill="url(#pvKnob)" stroke="#6E3F1E" stroke-width="3"/>
  <circle cx="100" cy="100" r="28" fill="none" stroke="#fff" stroke-width="2" opacity=".25"/>
  <ellipse cx="86" cy="84" rx="16" ry="10" fill="#fff" opacity=".35" transform="rotate(-30 86 84)"/>
  <ellipse cx="62" cy="52" rx="20" ry="8" fill="#fff" opacity=".18" transform="rotate(-40 62 52)"/></svg>`;

function next(){
  const it = C.q.shift(); if (!it) return finish();
  C.ready = false;
  const ov = layer(); ov.classList.remove('ready'); ov.classList.toggle('more', C.q.length > 0);
  $$('.slamming,.inked').forEach(e => e.classList.remove('slamming','unlocking','inked'));
  const el = $(it.type==='stamp' ? `[data-stamp="${it.id}"]` : `[data-badge="${it.id}"]`, $('#main'));
  if (!el){ C.ready = true; return C.q.length ? next() : finish(); }
  el.scrollIntoView({block:'center', behavior:'auto'});
  const tgt = it.type==='stamp' ? el : (el.querySelector('.medal') || el);
  tgt.style.visibility = 'hidden'; C.hidden = tgt;
  const vw = innerWidth, vh = innerHeight;
  const S = it.type==='stamp' ? Math.min(vw*.62, vh*.62*130/136) : Math.min(vw*.5, vh*.6/1.24);
  const stage = document.createElement('div'); stage.className = 'bigstage';
  const cap = $('.slam-cap', ov); cap.classList.remove('on');
  let col = '#F2C744', rot0 = 0, html = '';
  if (it.type === 'stamp'){
    const p = PV.byId(it.id); col = pal(p)[0]; rot0 = rot(p.id);
    html = PV.stampSVG(p, state.visited[p.id]);
    cap.innerHTML = `<b>${PV.L('Đã tham quan','Visited')} ${esc(pname(p))}!</b><span>${PV.L('Dấu mộc mới','New stamp')} · ${esc(state.visited[p.id]||'')} · +10 ${PV.L('điểm','points')}</span>`;
  } else {
    const b = PV.badges().find(x => x.id===it.id) || {};
    html = PV.medalSVG({...b, got:true});
    cap.innerHTML = `<b>${PV.L('Hoàn thành huy hiệu','Badge completed')}: ${esc(PV.tr(b.name||''))}!</b><span>${esc(PV.tr(b.need||''))}</span>`;
  }
  const H = it.type==='stamp' ? S*136/130 : S*124/100;
  stage.innerHTML = `<div class="bs-shadow"></div><div class="bs-print" style="width:${S}px;height:${H}px;transform:translate(-50%,-50%) rotate(${rot0}deg)">${html}</div>${it.type==='stamp'?`<div class="bs-tool" style="width:${S*1.02}px;height:${S*1.02}px">${STAMP_TOP(col)}</div>`:''}`;
  ov.appendChild(stage);
  const print = stage.querySelector('.bs-print'), tool = stage.querySelector('.bs-tool'), shadow = stage.querySelector('.bs-shadow');
  shadow.style.width = shadow.style.height = S*1.02+'px';
  const anim = (node, kf, o) => node && node.animate ? node.animate(kf, {fill:'forwards', ...o}) : null;
  const IN = 1050;
  if (tool){
    print.style.opacity = 0;
    anim(tool, [
      {transform:'translate(-50%,-50%) perspective(900px) rotateX(24deg) rotateZ(-20deg) scale(4.2)', opacity:0},
      {opacity:1, offset:.2},
      {transform:'translate(-50%,-50%) perspective(900px) rotateX(10deg) rotateZ(-6deg) scale(1.6)', offset:.62},
      {transform:'translate(-50%,-50%) perspective(900px) rotateX(0) rotateZ(0) scale(1)', opacity:1}
    ], {duration:IN, easing:'cubic-bezier(.55,0,.85,.4)'});
    anim(shadow, [{transform:'translate(-50%,-50%) scale(1.9)', opacity:0, filter:'blur(40px)'},{transform:'translate(-50%,-50%) scale(1.02)', opacity:.55, filter:'blur(6px)'}], {duration:IN, easing:'ease-in'});
    later(() => {
      PV.sfx.thump(); stage.classList.add('hit'); setTimeout(()=>stage.classList.remove('hit'), 420);
      anim(tool, [
        {transform:'translate(-50%,-50%) scale(1)', opacity:1},
        {transform:'translate(-50%,-50%) scale(.97)', opacity:1, offset:.2},
        {transform:'translate(-50%,-50%) perspective(900px) rotateX(-14deg) scale(1.5)', opacity:.9, offset:.55},
        {transform:'translate(-50%,-50%) perspective(900px) rotateX(-24deg) scale(3.6)', opacity:0}
      ], {duration:850, delay:120, easing:'cubic-bezier(.3,0,.5,1)'});
      anim(shadow, [{opacity:.55},{opacity:0, transform:'translate(-50%,-50%) scale(1.8)', filter:'blur(40px)'}], {duration:700, delay:150});
      anim(print, [{opacity:0, filter:'blur(3px)', transform:`translate(-50%,-50%) rotate(${rot0}deg) scale(1.05)`},{opacity:1, filter:'blur(0)', transform:`translate(-50%,-50%) rotate(${rot0}deg) scale(1)`}], {duration:600, delay:140, easing:'ease-out'});
      burst(vw/2, vh/2, col, 16, S*.62);
    }, IN);
  } else {
    const inner = print.firstElementChild; if (inner) inner.style.transformOrigin = '50% 3%';
    print.insertAdjacentHTML('afterbegin', `<div class="bigpin">${PIN}</div>`);
    anim(print, [
      {transform:'translate(-50%,-50%) scale(.25)', opacity:0},
      {transform:'translate(-50%,-50%) scale(1.06)', opacity:1, offset:.7},
      {transform:'translate(-50%,-50%) scale(1)', opacity:1}
    ], {duration:550, easing:'cubic-bezier(.3,1.3,.5,1)'});
    later(() => { PV.sfx.thump(); anim(inner, [
      {transform:'rotate(0)'},{transform:'rotate(16deg)', offset:.18},{transform:'rotate(-13deg)', offset:.42},
      {transform:'rotate(9deg)', offset:.64},{transform:'rotate(-5deg)', offset:.82},{transform:'rotate(0)'}
    ], {duration:2000, easing:'ease-in-out'}); }, 500);
  }
  const PARTY = it.type==='stamp' ? IN + 450 : 650, FLY = it.type==='stamp' ? IN + 3300 : 2900;
  later(() => { PV.sfx.popper(); burst(vw/2, vh/2, '#F2C744', 70, Math.min(vw,vh)*.7, true); later(() => burst(vw*.3, vh*.4, '#F2C744', 34, Math.min(vw,vh)*.45, true), 900); later(() => burst(vw*.7, vh*.42, '#F2C744', 34, Math.min(vw,vh)*.45, true), 1700);
    cap.style.top = (vh - 104) + 'px'; void cap.offsetWidth; cap.classList.add('on'); }, PARTY);
  // fly back to its own spot in the collection
  later(() => {
    const r = tgt.getBoundingClientRect(); const k = r.width / S;
    const tx = r.left + r.width/2 - vw/2, ty = r.top + r.height/2 - vh/2;
    const rEnd = it.type==='stamp' ? rot0 : 0;
    cap.classList.remove('on'); cap.classList.add('off');
    const f = anim(print, [
      {transform:`translate(-50%,-50%) rotate(${rot0}deg) scale(1)`, opacity:1},
      {transform:`translate(calc(-50% + ${tx*.45}px), calc(-50% + ${ty*.45 - 40}px)) rotate(${rot0 + 8}deg) scale(${(1+k)/2})`, offset:.5},
      {transform:`translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${rEnd}deg) scale(${k})`, opacity:1}
    ], {duration:1100, easing:'cubic-bezier(.55,0,.25,1)'});
    const land = () => { C.hidden = null; tgt.style.visibility = ''; stage.remove(); cap.classList.remove('off');
      el.classList.add(it.type==='stamp' ? 'inked' : 'unlocking'); if (it.type!=='stamp') el.classList.add('slamming');
      C.ready = true; ov.classList.add('ready'); };
    if (f) f.onfinish = land; else land();
  }, FLY);
}
function burst(x, y, color, n, dist, confetti){
  const ov = $('#slam'); if (!ov) return;
  const cols = confetti ? ['#2F6FA3','#D62839','#F2C744','#7FC3EA','#1F4E79','#F28C8C'] : [color];
  for (let i=0;i<n;i++){
    const d = document.createElement('i'); d.className = confetti ? 'conf' : 'ink';
    const a = confetti ? (-Math.PI/2 + (Math.random()-.5)*Math.PI*1.3) : (i/n)*Math.PI*2 + Math.random()*.4;
    const dd = dist*(.45+Math.random()*.7);
    d.style.cssText = `left:${x}px;top:${y}px;background:${cols[i%cols.length]};--dx:${Math.cos(a)*dd}px;--dy:${Math.sin(a)*dd}px;animation-delay:${confetti?Math.random()*.15:0}s`;
    ov.appendChild(d); setTimeout(() => d.remove(), 4800);
  }
}
function finish(){
  C.timers.forEach(clearTimeout); C.timers = [];
  const ov = $('#slam'); if (ov){ ov.classList.add('out'); setTimeout(()=>ov.remove(), 260); }
  document.removeEventListener('keydown', onKey);
  $$('.slamming,.inked').forEach(e => e.classList.remove('slamming','unlocking','inked'));
  const ret = C.ret, dr = C.drawer;
  C.active = false; C.ready = false; C.ret = null; C.drawer = null;
  if (ret && ret !== '#collection'){
    location.hash = ret;
    if (dr) setTimeout(() => PV.openPlace(dr.id, ret==='#map' ? {...dr.opt, noMap:true} : dr.opt), 380);
  }
  if (C.q.length) C.timer = setTimeout(start, 300);
}

/* ---------- hooks ---------- */
PV.markVisited = (id) => {
  if (state.visited[id]) return;
  PV.queueCeleb({type:'stamp', id});
  state.visited[id] = new Date().toLocaleDateString('vi-VN');
  PV.addPoints(10);
  PV.save('visited'); // badge check runs inside PV.save
};
PV.checkBadges = () => {
  if (!state.profile) return;
  const got = PV.badges().filter(b=>b.got);
  const seen = PV.store.get('badgesSeen', null);
  if (!Array.isArray(seen)) { PV.store.set('badgesSeen', got.map(b=>b.id)); return; }
  const fresh = got.filter(b => !seen.includes(b.id));
  if (!fresh.length) return;
  PV.store.set('badgesSeen', [...seen, ...fresh.map(b=>b.id)]);
  fresh.forEach(b => PV.queueCeleb({type:'badge', id:b.id}));
};
PV.celebrate = (list) => (list||[]).forEach(b => PV.queueCeleb({type:'badge', id:b.id}));
try { if (!Array.isArray(PV.store.get('badgesSeen', null))) PV.store.set('badgesSeen', PV.badges().filter(b=>b.got).map(b=>b.id)); } catch(e){}
})();
