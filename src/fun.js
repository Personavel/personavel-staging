/* ===== Personavel – the guide robot does little fun things now and then (decoration only) ===== */
(function(){
'use strict';
const ACTS = [
  {k:'jump',  say:['Hây!','Hop!'], t:1600},
  {k:'spin',  say:['Xoay nè~','Wheee~'], t:1500},
  {k:'sit',   say:['Ngồi nghỉ xíu…','Taking a seat…'], t:3200},
  {k:'lie',   say:['Nằm thư giãn 😌','Chilling 😌'], t:3600},
  {k:'hello', say:['Xin chào! 👋','Hello! 👋'], t:2600},
  {k:'flag',  say:['🇻🇳 Việt Nam!','🇻🇳 Vietnam!'], t:3000, prop:'🇻🇳'},
  {k:'sleep', say:['Zzz…','Zzz…'], t:4200, prop:'💤'},
  {k:'dance', say:['🎵 La la la','🎵 La la la'], t:2800, prop:'🎶'},
  {k:'heart', say:['Thương bạn ❤️','Love you ❤️'], t:2400, prop:'❤️'},
  {k:'peek',  say:['Ú òa!','Peekaboo!'], t:2200}
];
let timer = null, busy = false, last = '', first = true;
function play(fab, a){
  busy = true;
  const tip = document.createElement('div'); tip.className = 'fun-say'; tip.textContent = PV.L(...a.say);
  const r = fab.getBoundingClientRect(); tip.style.right = (innerWidth - r.right + r.width*.35) + 'px'; tip.style.bottom = (innerHeight - r.top + 8) + 'px';
  document.body.appendChild(tip);
  let prop = null;
  if (a.prop){ prop = document.createElement('div'); prop.className = 'fun-prop fp-' + a.k; prop.textContent = a.prop; prop.style.right = (innerWidth - r.right - 6) + 'px'; prop.style.bottom = (innerHeight - r.top - 14) + 'px'; document.body.appendChild(prop); }
  fab.classList.add('fun', 'fun-' + a.k);
  setTimeout(() => { fab.classList.remove('fun', 'fun-' + a.k); tip.classList.add('out'); if (prop) prop.classList.add('out'); setTimeout(() => { tip.remove(); prop && prop.remove(); busy = false; }, 350); }, a.t);
}
function tick(){
  clearTimeout(timer);
  timer = setTimeout(() => {
    const fab = document.getElementById('fab');
    const calm = document.body.classList.contains('reduce') || document.hidden || document.querySelector('#chatpop.on,.modal-bg,.overlay,#slam,#lk,#wxtip');
    if (fab && !busy && !calm && fab.getClientRects().length){
      let a; do { a = ACTS[Math.random()*ACTS.length|0]; } while (a.k === last && ACTS.length > 1);
      last = a.k; play(fab, a);
    }
    tick();
  }, first ? 6000 : 10000 + Math.random()*10000); first = false;
}
PV.funBot = (k) => { const fab = document.getElementById('fab'); const a = ACTS.find(x => x.k === k) || ACTS[0]; if (fab && !busy) play(fab, a); };
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#fab')){ const f = document.getElementById('fab'); f && f.classList.remove('fun', ...ACTS.map(a=>'fun-'+a.k)); } }, true);
tick();
})();
