/* ===== Personavel – public reviews & review photos =====
   • Photos: picked from camera/gallery, shrunk to ≤1080px WebP, kept in IndexedDB on this device.
   • Public: when CLOUD is configured (Supabase), reviews + photos are shared with every visitor.
     Without it, the "community" list shows the reviews of all profiles saved on this device. */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const L = (vi, en) => PV.L(vi, en);

/* ---- server settings (Supabase project URL + public "anon" key; safe to ship in the page) ---- */
const CLOUD = { url: 'https://bwtmunpzdxtutspdpphb.supabase.co', key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3dG11bnB6ZHh0dXRzcGRwcGhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MjQyMDgsImV4cCI6MjExMDAwMDIwOH0.27_xLOFIhC0wFjcLkn9vjhQZSjni-iR4i11UzRi7Zf8' };
PV.CLOUD = CLOUD;
const on = () => !!(CLOUD.url && CLOUD.key);

/* each profile gets a private random token; the server only stores its hash, so only this device can edit/delete its own review */
if (PV.USER_KEYS && !PV.USER_KEYS.includes('cloudToken')) PV.USER_KEYS.push('cloudToken');
const token = () => {
  if (!state.cloudToken) state.cloudToken = PV.store.get('cloudToken', null);
  if (!state.cloudToken){ const a = new Uint8Array(24); crypto.getRandomValues(a); state.cloudToken = [...a].map(x=>x.toString(16).padStart(2,'0')).join(''); PV.save('cloudToken'); }
  return state.cloudToken;
};
const hdr = (extra={}) => ({apikey: CLOUD.key, Authorization: 'Bearer ' + CLOUD.key, ...extra});

/* ---------- photos ---------- */
const MAXP = 4;
function shrink(file, max = 1080){
  return new Promise((res) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      let d = c.toDataURL('image/webp', .78); if (!d.startsWith('data:image/webp')) d = c.toDataURL('image/jpeg', .8);
      res(d);
    };
    im.onerror = () => { URL.revokeObjectURL(url); res(null); };
    im.src = url;
  });
}
const newKey = () => 'rvp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
/* photo = {k: IndexedDB key} (on this device) and/or {u: public URL} */
async function addFiles(files, current){
  const out = current.slice(); let skipped = 0;
  for (const f of [...files]){
    if (out.length >= MAXP){ skipped++; continue; }
    if (!/^image\//.test(f.type)) continue;
    const d = await shrink(f); if (!d) continue;
    const k = newKey(); await PV.photoDB.put(k, d); out.push({k});
  }
  if (skipped) PV.toast(L(`Mỗi đánh giá tối đa ${MAXP} ảnh`, `Up to ${MAXP} photos per review`));
  return out;
}
const srcOf = async (ph) => ph.u || (ph.k ? await PV.photoDB.get(ph.k) : null);
/* fill <img data-ph> once the data is read from IndexedDB */
async function hydrate(root){
  for (const im of $$('img[data-phk]', root)){ const d = await PV.photoDB.get(im.dataset.phk); if (d) im.src = d; else im.closest('.rp-th')?.remove(); im.removeAttribute('data-phk'); }
}
PV.rvPhotos = {
  MAX: MAXP,
  /* editable strip: thumbnails with ✕ + "add photo" tile */
  editor(photos, id){
    return `<div class="rp-strip" id="${id}">${photos.map((p,i)=>`<span class="rp-th"><img ${p.u?`src="${esc(p.u)}"`:`data-phk="${esc(p.k)}"`} alt=""><button type="button" class="rp-del" data-i="${i}" aria-label="${L('Xóa ảnh','Remove photo')}">✕</button></span>`).join('')}
      ${photos.length < MAXP ? `<label class="rp-add"><input type="file" accept="image/*" multiple hidden><span>📷</span><b>${L('Thêm ảnh','Add photo')}</b><i>${photos.length}/${MAXP}</i></label>` : ''}</div>`;
  },
  bindEditor(root, id, photos, onChange){
    const el = $('#' + id, root); if (!el) return;
    hydrate(el);
    const inp = el.querySelector('input[type=file]');
    if (inp) inp.onchange = async () => { const lbl = inp.closest('.rp-add'); lbl.classList.add('busy'); const next = await addFiles(inp.files, photos); onChange(next); };
    $$('.rp-del', el).forEach(b => b.onclick = (e) => { e.preventDefault(); const i = +b.dataset.i; const ph = photos[i]; if (ph && ph.k) PV.photoDB.del(ph.k); onChange(photos.filter((_,k)=>k!==i)); });
  },
  /* read-only grid */
  grid(photos){ if (!photos || !photos.length) return ''; return `<div class="rp-grid n${Math.min(photos.length,4)}">${photos.map((p,i)=>`<button type="button" class="rp-th" data-zoom="${i}"><img ${p.u?`src="${esc(p.u)}"`:`data-phk="${esc(p.k)}"`} alt="" loading="lazy"></button>`).join('')}</div>`; },
  bindGrid(root, photos, cap){ hydrate(root); $$('[data-zoom]', root).forEach(b => b.onclick = async () => { const list = []; for (const p of photos){ const s = await srcOf(p); if (s) list.push({src:s, cap}); } if (list.length) PV.lightbox(list, Math.min(+b.dataset.zoom, list.length-1)); }); }
};

/* ---------- server calls ---------- */
async function upload(dataUrl){
  const blob = await (await fetch(dataUrl)).blob();
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${new Date().toISOString().slice(0,7)}/${crypto.randomUUID ? crypto.randomUUID() : newKey()}.${ext}`;
  const r = await fetch(`${CLOUD.url}/storage/v1/object/review-photos/${path}`, {method:'POST', headers: hdr({'content-type': blob.type, 'x-upsert':'false'}), body: blob});
  if (!r.ok) throw new Error('upload ' + r.status);
  return `${CLOUD.url}/storage/v1/object/public/review-photos/${path}`;
}
const colorOf = (s) => { let h = 0; for (const ch of String(s)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 55% 52%)`; };

PV.community = {
  enabled: on,
  /* publish (create or update) my review; uploads local photos first and returns the photo list with public URLs */
  async publish(kind, target, r){
    if (!on()) return null;
    const photos = [];
    for (const p of (r.photos || [])){ if (p.u) photos.push(p); else { const d = await PV.photoDB.get(p.k); if (d) photos.push({k:p.k, u: await upload(d)}); } }
    const body = {p_token: token(), p_kind: kind, p_target: target, p_author: (state.profile?.name || L('Du khách','Traveller')).slice(0,40),
      p_stars: r.stars || 0, p_love: !!(r.fav || r.love), p_tags: (r.tags||[]).slice(0,10), p_body: (r.text||'').slice(0,800), p_photos: photos.map(p=>p.u).slice(0,MAXP)};
    const res = await fetch(`${CLOUD.url}/rest/v1/rpc/pv_upsert_review`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify(body)});
    if (!res.ok) throw new Error('publish ' + res.status);
    let id = null; try { id = await res.json(); } catch(e){}
    return {photos, id};
  },
  async remove(kind, target){ if (!on()) return; await fetch(`${CLOUD.url}/rest/v1/rpc/pv_delete_review`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify({p_token: token(), p_kind: kind, p_target: target})}); },
  async report(id){ if (!on()) return; await fetch(`${CLOUD.url}/rest/v1/rpc/pv_report_review`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify({p_id: id})}); },
  /* everybody's reviews for a place ('place', id) or for the website ('site', 'personavel') */
  async list(kind, target){
    if (on()){
      try {
        const r = await fetch(`${CLOUD.url}/rest/v1/rpc/pv_list_reviews`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify({p_kind: kind, p_target: target})});
        if (r.ok){ const rows = await r.json();
          const mineIds = new Set([...Object.values(state.reviews||{}).map(v=>v&&v.cloudId), state.appReview && state.appReview.cloudId].filter(Boolean));
          return {cloud:true, rows: rows.map(x => ({id:x.id, author:x.author, stars:x.stars, love:x.love, tags:x.tags||[], text:x.body||'', photos:(x.photos||[]).map(u=>({u})), at:new Date(x.updated_at).toLocaleDateString('vi-VN'), mine: mineIds.has(x.id)}))}; }
      } catch(e){ /* fall back to this device */ }
    }
    // this device: current profile + every saved profile
    const rows = [];
    const add = (name, rv, mine) => { if (!rv) return; const r = kind === 'site' ? rv : rv[target]; if (!r || !(r.stars || r.text || (r.photos||[]).length)) return; rows.push({author:name, stars:r.stars||0, love:!!(r.fav||r.love), tags:r.tags||[], text:r.text||'', photos:r.photos||[], at:r.at||'', mine}); };
    const cur = state.profile?.name;
    add(cur || L('Bạn','You'), kind === 'site' ? state.appReview : state.reviews, true);
    const accs = PV.accounts ? PV.accounts() : {};
    Object.values(accs).forEach(a => { if (!a || !a.data || a.name === cur) return; add(a.name, kind === 'site' ? a.data.appReview : a.data.reviews, false); });
    return {cloud:false, rows};
  },
  colorOf
};

/* ---------- community feed UI ---------- */
const stars = n => `<span class="rv-stars" aria-label="${n}/5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
PV.renderFeed = async (el, kind, target, opts={}) => {
  if (!el) return;
  el.innerHTML = `<div class="cf-head"><b>${opts.title || L('💬 Đánh giá từ cộng đồng','💬 Community reviews')}</b></div><div class="cf-load tiny muted">${L('Đang tải…','Loading…')}</div>`;
  const {cloud, rows} = await PV.community.list(kind, target);
  if (!document.body.contains(el)) return;
  const rated = rows.filter(r => r.stars); const avg = rated.length ? rated.reduce((s,r)=>s+r.stars,0)/rated.length : 0;
  const loves = rows.filter(r => r.love).length;
  el.innerHTML = `<div class="cf-head"><b>${opts.title || L('💬 Đánh giá từ cộng đồng','💬 Community reviews')}</b><span class="spacer"></span>
      ${avg ? `<span class="cf-avg"><b>★ ${avg.toFixed(1)}</b><span class="tiny muted"> · ${rated.length} ${L('lượt','ratings')}${loves?` · ❤ ${loves}`:''}</span></span>` : ''}</div>
    ${!cloud ? `<div class="cf-note tiny">🔒 ${L('Đang hiển thị đánh giá của các tài khoản trên máy này. Khi web kết nối máy chủ, đánh giá sẽ công khai cho mọi người.','Showing reviews from profiles on this device. Once the site is connected to its server, reviews are public to everyone.')}</div>` : ''}
    ${rows.length ? `<div class="cf-list">${rows.map((r,i) => `<article class="cf-item${r.mine?' mine':''}" data-i="${i}">
        <div class="cf-top"><span class="cf-av" style="background:${colorOf(r.author)}">${esc((r.author||'?')[0].toUpperCase())}</span>
          <div class="cf-who"><b>${esc(r.author)}${r.mine?` <span class="cf-me">${L('bạn','you')}</span>`:''}</b><span class="tiny muted">${esc(r.at||'')}</span></div>
          <span class="spacer"></span>${r.stars?stars(r.stars):''}${r.love?'<span class="cf-love" title="Yêu thích">❤</span>':''}</div>
        ${r.tags&&r.tags.length?`<div class="rv-tagline">${r.tags.slice(0,6).map(t=>`<span>${esc(PV.tr?PV.tr(t):t)}</span>`).join('')}</div>`:''}
        ${r.text?`<p class="cf-text">${esc(r.text)}</p>`:''}
        ${PV.rvPhotos.grid(r.photos)}
        ${cloud && !r.mine && r.id ? `<button class="cf-report tiny" data-rep="${esc(r.id)}">⚑ ${L('Báo cáo','Report')}</button>` : ''}
      </article>`).join('')}</div>`
      : `<div class="cf-empty small muted">${opts.empty || L('Chưa có ai đánh giá. Hãy là người đầu tiên!','No reviews yet. Be the first!')}</div>`}`;
  $$('.cf-item', el).forEach(a => { const r = rows[+a.dataset.i]; PV.rvPhotos.bindGrid(a, r.photos, r.author); });
  $$('[data-rep]', el).forEach(b => b.onclick = async () => { b.disabled = true; try { await PV.community.report(b.dataset.rep); b.textContent = L('Đã báo cáo – cảm ơn bạn','Reported – thank you'); } catch(e){ b.disabled = false; } });
};
})();
