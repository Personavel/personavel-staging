/* ===== Personavel – "Khoảnh khắc": square, Locket-style photos of the places you visit ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;

/* photos live in IndexedDB (localStorage is far too small); the list of moments lives in state */
const DB = (() => {
  let dbp = null;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    if (!window.indexedDB) return rej(new Error('no idb'));
    const r = indexedDB.open('personavel', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('photos');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = (mode, fn) => open().then(db => new Promise((res, rej) => { const t = db.transaction('photos', mode); const s = t.objectStore('photos'); const q = fn(s); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }));
  const mem = {};
  return {
    put: (k, v) => tx('readwrite', s => s.put(v, k)).catch(() => { mem[k] = v; }),
    get: (k) => tx('readonly', s => s.get(k)).then(v => v || mem[k] || null).catch(() => mem[k] || null),
    del: (k) => tx('readwrite', s => s.delete(k)).catch(() => { delete mem[k]; })
  };
})();
PV.photoDB = DB;
if (!Array.isArray(state.moments)) state.moments = PV.store.get('moments', []);
const ML = () => Array.isArray(state.moments) ? state.moments : (state.moments = PV.store.get('moments', []) || []);
if (PV.USER_KEYS && !PV.USER_KEYS.includes('moments')) PV.USER_KEYS.push('moments');

const SIZE = 720;
const toSquare = (src, mirror) => { // center-crop any image/video frame to a square JPEG
  const w = src.videoWidth || src.naturalWidth || src.width, h = src.videoHeight || src.naturalHeight || src.height;
  const s = Math.min(w, h), c = document.createElement('canvas'); c.width = c.height = SIZE;
  const g = c.getContext('2d'); if (mirror){ g.translate(SIZE, 0); g.scale(-1, 1); }
  g.drawImage(src, (w - s)/2, (h - s)/2, s, s, 0, 0, SIZE, SIZE);
  return c.toDataURL('image/jpeg', .8);
};
const fileToSquare = (f) => new Promise(res => { const r = new FileReader(); r.onload = () => { const im = new Image(); im.onload = () => res(toSquare(im)); im.onerror = () => res(null); im.src = r.result; }; r.readAsDataURL(f); });
const placeName = id => { const p = PV.byId(id); return p ? (PV.lang==='en' && p.name_en ? p.name_en : p.name) : ''; };
const nowStr = () => { const d = new Date(); return d.toLocaleDateString('vi-VN') + ' · ' + d.toTimeString().slice(0,5); };

/* ---------- camera sheet ---------- */
PV.snap = (presetPid) => {
  const old = $('#lk'); if (old) old.remove();
  const trip = (state.trip?.stops || []).map(s => s.id), vis = Object.keys(state.visited).reverse();
  const order = [...new Set([presetPid, ...trip, ...vis, ...PV.D.places.map(p=>p.id)].filter(Boolean))];
  const ov = document.createElement('div'); ov.id = 'lk'; ov.className = 'lk-ov'; ov.setAttribute('role','dialog');
  ov.innerHTML = `<div class="lk-sheet">
    <div class="lk-top"><button class="lk-x" aria-label="${PV.L('Đóng','Close')}">✕</button><b>${PV.L('Khoảnh khắc','Moment')}</b><span class="lk-sp"></span></div>
    <div class="lk-frame">
      <video playsinline autoplay muted></video><img class="lk-shot" alt="">
      <div class="lk-msg"></div>
      <div class="lk-loc">📍 <span></span></div>
      <input class="lk-cap" maxlength="44" placeholder="${PV.L('Thêm lời nhắn…','Add a message…')}">
    </div>
    <div class="lk-ctrl">
      <label class="lk-side" title="${PV.L('Tải ảnh lên','Upload a photo')}"><input type="file" accept="image/*" hidden>🖼️</label>
      <button class="lk-shutter" aria-label="${PV.L('Chụp','Take photo')}"><i></i></button>
      <button class="lk-side lk-flip" title="${PV.L('Đổi camera','Switch camera')}">🔄</button>
    </div>
    <div class="lk-ctrl2"><button class="lk-side lk-retake" title="${PV.L('Chụp lại','Retake')}">✕</button><button class="lk-send">${PV.L('Lưu khoảnh khắc','Save moment')} ➤</button></div>
    <label class="lk-where">${PV.L('Nơi đến','Place')}
      <select class="input">${order.map(id => `<option value="${id}">${esc(placeName(id))}</option>`).join('')}</select></label>
  </div>`;
  document.body.appendChild(ov);
  const video = $('video', ov), shot = $('.lk-shot', ov), msg = $('.lk-msg', ov), sel = $('select', ov), cap = $('.lk-cap', ov);
  let stream = null, facing = 'environment', data = null;
  const setLoc = () => { $('.lk-loc span', ov).textContent = placeName(sel.value); };
  sel.onchange = setLoc; setLoc();
  const stop = () => { if (stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } };
  const start = async () => {
    stop(); msg.textContent = PV.L('Đang mở camera…','Opening camera…'); msg.hidden = false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:facing, width:{ideal:1280}, height:{ideal:1280}}, audio:false});
      video.srcObject = stream; video.classList.toggle('mirror', facing === 'user'); msg.hidden = true;
    } catch(e){
      msg.innerHTML = PV.L('Không mở được camera.<br>Bấm 🖼️ để tải ảnh từ máy lên nhé.','Camera unavailable.<br>Tap 🖼️ to upload a photo instead.');
    }
  };
  const mode = (m) => { ov.classList.toggle('taken', m === 'taken'); if (m === 'taken'){ shot.src = data; setTimeout(()=>cap.focus(), 50); } else { shot.removeAttribute('src'); cap.value = ''; } };
  const close = () => { stop(); ov.classList.add('out'); setTimeout(()=>ov.remove(), 220); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('.lk-x', ov).onclick = close;
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  $('.lk-shutter', ov).onclick = () => {
    if (!stream || !video.videoWidth) { msg.hidden = false; return; }
    data = toSquare(video, facing === 'user'); ov.classList.add('flash'); setTimeout(()=>ov.classList.remove('flash'), 250); mode('taken');
  };
  $('.lk-flip', ov).onclick = () => { facing = facing === 'user' ? 'environment' : 'user'; start(); };
  $('input[type=file]', ov).onchange = async (e) => { const f = e.target.files[0]; if (!f) return; const d = await fileToSquare(f); if (!d) return PV.toast(PV.L('Không đọc được ảnh này','Could not read this image')); data = d; msg.hidden = true; mode('taken'); e.target.value = ''; };
  $('.lk-retake', ov).onclick = () => { data = null; mode('live'); if (!stream) start(); };
  $('.lk-send', ov).onclick = async () => {
    if (!data) return;
    const id = 'm' + Date.now();
    await DB.put(id, data);
    ML().unshift({id, pid: sel.value, cap: cap.value.trim(), at: nowStr()});
    PV.save('moments'); PV.addPoints(5);
    close(); PV.toast(PV.L('Đã lưu khoảnh khắc 📸','Moment saved 📸'));
    if (location.hash === '#profile') PV.route();
  };
  start();
};

/* ---------- grid + viewer ---------- */
PV.momentsHTML = (limit) => {
  const list = limit ? ML().slice(0, limit) : ML();
  return `<div class="lk-grid">
    <button class="lk-add" id="lkAdd"><span>📸</span><b>${PV.L('Chụp khoảnh khắc','Capture a moment')}</b><small>${PV.L('hoặc tải ảnh lên','or upload a photo')}</small></button>
    ${list.map(m => `<button class="lk-tile" data-mid="${m.id}"><img alt="" data-photo="${m.id}"><span class="lk-tloc">📍 ${esc(placeName(m.pid))}</span>${m.cap ? `<span class="lk-tcap">${esc(m.cap)}</span>` : ''}</button>`).join('')}
  </div>`;
};
PV.bindMoments = (root) => {
  const add = $('#lkAdd', root); if (add) add.onclick = () => PV.snap();
  $$('[data-photo]', root).forEach(img => DB.get(img.dataset.photo).then(src => { if (src) img.src = src; else img.closest('.lk-tile')?.classList.add('missing'); }));
  $$('[data-mid]', root).forEach(b => b.onclick = () => PV.viewMoment(b.dataset.mid));
};
PV.viewMoment = async (mid) => {
  const m = ML().find(x => x.id === mid); if (!m) return;
  const src = await DB.get(mid);
  PV.modal(`<div class="lk-view"><div class="lk-frame big"><img src="${src || ''}" alt=""><div class="lk-loc">📍 <span>${esc(placeName(m.pid))}</span></div>${m.cap ? `<div class="lk-capview">${esc(m.cap)}</div>` : ''}</div>
      <div class="tiny muted" style="text-align:center;margin-top:8px">${esc(m.at || '')}</div>
      <div class="row" style="justify-content:center;margin-top:12px;gap:8px">
        <button class="btn ghost sm" id="lkPlace">🗺️ ${PV.L('Xem địa điểm','Open place')}</button>
        <a class="btn ghost sm" id="lkDl" download="personavel-${mid}.jpg" href="${src || '#'}">⬇️ ${PV.L('Tải ảnh','Download')}</a>
        <button class="btn ghost sm" id="lkDel">🗑️ ${PV.L('Xóa','Delete')}</button></div></div>`, (box, close) => {
    $('#lkPlace', box).onclick = () => { close(); PV.openPlace(m.pid); };
    $('#lkDel', box).onclick = async () => { if (!confirmDel(box)) return; await DB.del(mid); state.moments = ML().filter(x => x.id !== mid); PV.save('moments'); close(); if (location.hash === '#profile') PV.route(); };
  });
};
function confirmDel(box){ const b = $('#lkDel', box); if (b.dataset.sure) return true; b.dataset.sure = 1; b.textContent = PV.L('Bấm lần nữa để xóa','Tap again to delete'); return false; }

/* ---------- hooks: profile diary card + place drawer ---------- */
const _profile = PV.views.profile;
PV.views.profile = (m) => {
  _profile(m);
  const card = [...m.querySelectorAll('.card')].find(c => c.querySelector('h3') && /Nhật ký|journal/i.test(c.querySelector('h3').textContent));
  if (card){
    const sec = document.createElement('div'); sec.className = 'lk-sec';
    sec.innerHTML = `<div class="row" style="margin-top:4px"><b>📸 ${PV.L('Khoảnh khắc','Moments')}</b><span class="tiny muted" style="margin-left:6px">${ML().length}</span></div>${PV.momentsHTML()}`;
    card.querySelector('.row').after(sec);
    PV.bindMoments(sec);
  }
};
const _open = PV.openPlace;
PV.openPlace = (id, opt) => {
  const r = _open(id, opt);
  const dr = document.getElementById('drawer'); const v = dr && dr.querySelector('#d-visit');
  if (v && !dr.querySelector('#d-snap')){
    const b = document.createElement('button'); b.className = 'btn ghost'; b.id = 'd-snap'; b.textContent = '📸 ' + PV.L('Chụp khoảnh khắc','Capture moment');
    b.onclick = () => PV.snap(id); v.after(b);
    const shots = ML().filter(x => x.pid === id);
    if (shots.length){
      const s = document.createElement('div'); s.className = 'lk-strip';
      s.innerHTML = shots.slice(0, 6).map(x => `<button class="lk-tile mini" data-mid="${x.id}"><img alt="" data-photo="${x.id}"></button>`).join('');
      b.parentElement.after(s); PV.bindMoments(s);
    }
  }
  return r;
};
})();
