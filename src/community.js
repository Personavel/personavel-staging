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
/* one random id per browser (not per profile): the server allows 5 posts/hour per device and 20/hour per network,
   so a whole class on the same wifi can still post. Only its hash is stored. */
const deviceId = () => {
  let d = PV.store.get('deviceId', null);
  if (!/^[0-9a-f]{32,64}$/.test(d || '')){ const a = new Uint8Array(20); crypto.getRandomValues(a); d = [...a].map(x=>x.toString(16).padStart(2,'0')).join(''); PV.store.set('deviceId', d); }
  return d;
};
const hdr = (extra={}) => ({apikey: CLOUD.key, Authorization: 'Bearer ' + CLOUD.key, ...extra});

/* ---------- photos ---------- */
const MAXP = 4, PAGE = 10;
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
    return `<div class="rp-strip" id="${id}">${photos.map((p,i)=>`<span class="rp-th"><img ${p.u?`src="${esc(PV.safeImg(p.u))}"`:`data-phk="${esc(p.k)}"`} alt=""><button type="button" class="rp-del" data-i="${i}" aria-label="${L('Xóa ảnh','Remove photo')}">✕</button></span>`).join('')}
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
  grid(photos){ if (!photos || !photos.length) return ''; return `<div class="rp-grid n${Math.min(photos.length,4)}">${photos.map((p,i)=>`<button type="button" class="rp-th${p.pending?' pend':''}" data-zoom="${i}"><img ${p.u?`src="${esc(PV.safeImg(p.u))}"`:`data-phk="${esc(p.k)}"`} alt="" loading="lazy">${p.pending?`<em class="rp-pend">${L('Chờ duyệt','Pending')}</em>`:''}</button>`).join('')}</div>`; },
  bindGrid(root, photos, cap){ hydrate(root); $$('[data-zoom]', root).forEach(b => b.onclick = async () => { const list = []; for (const p of photos){ const s = await srcOf(p); if (s) list.push({src:s, cap}); } if (list.length) PV.lightbox(list, Math.min(+b.dataset.zoom, list.length-1)); }); }
};

/* ---------- moderation: offensive words (vi + en) and posting rate ---------- */
/* matched on text without tones, as whole words; the same list is enforced again in the database */
const BAD = ['dit me','dit cu','dmm','dcm','dkm','vcl','vkl','oc cho','do ngu','thang ngu','con ngu','ngu nhu bo','ngu nhu cho','mat day','khon nan','cho chet','do khon','fuck','fucking','fucker','motherfucker','shit','bitch','cunt','asshole','dickhead','bastard','slut','whore','retard','stfu','nigger','nigga','faggot'];
const ACCENTED = ['địt','đụ','đụ má','đéo','cặc','lồn','buồi','óc chó','đồ ngu','thằng ngu','con ngu','mất dạy','khốn nạn','chó chết','con đĩ','đĩ'];   // tone matters here: cặc ≠ các, lồn ≠ lớn, buồi ≠ buổi, đéo ≠ đeo
const squash = t => ' ' + PV.norm(t).replace(/[^a-z0-9]+/g, ' ').replace(/(.)\1{2,}/g, '$1') + ' ';
PV.badText = (txt) => {
  const raw = ' ' + String(txt||'').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ') + ' ';
  if (ACCENTED.some(w => raw.includes(' ' + w + ' '))) return true;
  const n = squash(txt);
  return BAD.some(w => n.includes(' ' + w + ' '));
};
const RATE = {perHour: 5, gapSec: 30};
PV.canPost = () => {
  const now = Date.now(), ts = (PV.store.get('rvTimes', []) || []).filter(t => now - t < 3600e3);
  if (ts.length && now - ts[ts.length-1] < RATE.gapSec * 1000) return {ok:false, msg: L(`Bạn gửi hơi nhanh – đợi ${Math.ceil((RATE.gapSec*1000 - (now - ts[ts.length-1]))/1000)} giây nữa nhé.`, `Too fast – please wait ${Math.ceil((RATE.gapSec*1000 - (now - ts[ts.length-1]))/1000)} s.`)};
  if (ts.length >= RATE.perHour) return {ok:false, msg: L('Bạn đã gửi 5 đánh giá trong 1 giờ qua – thử lại sau nhé.', 'You have posted 5 reviews in the past hour – try again later.')};
  return {ok:true, mark: () => PV.store.set('rvTimes', [...ts, now])};
};
const checkPost = (r) => {
  if (PV.badText(r.text) || PV.badText(state.profile?.name || '') || (r.tags||[]).some(PV.badText)) throw Object.assign(new Error('bad'), {userMsg: L('Đánh giá có từ ngữ không phù hợp nên chưa được đăng. Bạn sửa lại giúp mình nhé.', 'Your review contains inappropriate words, so it was not posted. Please edit it.')});
  const c = PV.canPost(); if (!c.ok) throw Object.assign(new Error('rate'), {userMsg: c.msg});
  return c;
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
    const gate = checkPost(r);
    const photos = []; let fresh = 0;
    for (const p of (r.photos || [])){ if (p.u) photos.push({k:p.k, u:p.u}); else { const d = await PV.photoDB.get(p.k); if (d){ photos.push({k:p.k, u: await upload(d)}); fresh++; } } }
    const body = {p_token: token(), p_kind: kind, p_target: target, p_author: (state.profile?.name || L('Du khách','Traveller')).slice(0,40),
      p_stars: r.stars || 0, p_love: !!(r.fav || r.love), p_tags: (r.tags||[]).slice(0,10), p_body: (r.text||'').slice(0,800), p_photos: photos.map(p=>p.u).slice(0,MAXP), p_device: deviceId()};
    const res = await fetch(`${CLOUD.url}/rest/v1/rpc/pv_upsert_review`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify(body)});
    if (!res.ok){ let m = ''; try { m = (await res.json()).message || ''; } catch(e){}
      if (/inappropriate|rate limit/i.test(m)) throw Object.assign(new Error(m), {userMsg: /rate/i.test(m) ? L('Máy chủ đang giới hạn số lần gửi – thử lại sau ít phút nhé.', 'The server is limiting posts – try again in a few minutes.') : L('Đánh giá có từ ngữ không phù hợp nên chưa được đăng.', 'Your review contains inappropriate words and was not posted.')});
      throw new Error('publish ' + res.status); }
    gate.mark();
    if (fresh) setTimeout(() => PV.toast(L('📷 Ảnh mới sẽ hiện công khai sau khi nhóm duyệt (bạn vẫn thấy ảnh của mình).', '📷 New photos go public after the team approves them (you can still see yours).')), 1600);
    let id = null; try { id = await res.json(); } catch(e){}
    return {photos, id};
  },
  async remove(kind, target){ if (!on()) return; await fetch(`${CLOUD.url}/rest/v1/rpc/pv_delete_review`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify({p_token: token(), p_kind: kind, p_target: target})}); },
  async report(id){ if (!on()) return; await fetch(`${CLOUD.url}/rest/v1/rpc/pv_report_review`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify({p_id: id})}); },
  /* everybody's reviews for a place ('place', id) or for the website ('site', 'personavel') */
  /* one page (10) of everybody's reviews for a place ('place', id) or for the website ('site', 'personavel') */
  async list(kind, target, offset = 0){
    if (on()){
      try {
        const r = await fetch(`${CLOUD.url}/rest/v1/rpc/pv_list_reviews_page`, {method:'POST', headers: hdr({'content-type':'application/json'}), body: JSON.stringify({p_kind: kind, p_target: target, p_limit: PAGE, p_offset: offset, p_token: token()})});
        if (r.ok){ const rows = await r.json();
          const mineIds = new Set([...Object.values(state.reviews||{}).map(v=>v&&v.cloudId), state.appReview && state.appReview.cloudId].filter(Boolean));
          const f = rows[0] || {};
          return {cloud:true, total: +f.total || 0, avg: +f.avg_stars || 0, loves: +f.loves || 0,
            rows: rows.map(x => ({id:x.id, author:x.author, stars:x.stars, love:x.love, tags:x.tags||[], text:x.body||'', photos:[...(x.photos||[]).filter(u=>PV.safeImg(u)).map(u=>({u, ok:true})), ...(x.pending||[]).filter(u=>PV.safeImg(u)).map(u=>({u, pending:true}))], at:new Date(x.updated_at).toLocaleDateString('vi-VN'), mine: !!x.mine || mineIds.has(x.id)}))}; }
      } catch(e){ /* fall back to this device */ }
    }
    // this device: current profile + every saved profile
    const rows = [];
    const add = (name, rv, mine) => { if (!rv) return; const r = kind === 'site' ? rv : rv[target]; if (!r || !(r.stars || r.text || (r.photos||[]).length)) return; rows.push({author:name, stars:r.stars||0, love:!!(r.fav||r.love), tags:r.tags||[], text:r.text||'', photos:r.photos||[], at:r.at||'', mine}); };
    const cur = state.profile?.name;
    add(cur || L('Bạn','You'), kind === 'site' ? state.appReview : state.reviews, true);
    const accs = PV.accounts ? PV.accounts() : {};
    Object.values(accs).forEach(a => { if (!a || !a.data || a.name === cur) return; add(a.name, kind === 'site' ? a.data.appReview : a.data.reviews, false); });
    const rated = rows.filter(r => r.stars);
    return {cloud:false, rows: rows.slice(offset, offset + PAGE), total: rows.length, avg: rated.length ? rated.reduce((a,r)=>a+r.stars,0)/rated.length : 0, loves: rows.filter(r=>r.love).length};
  },
  colorOf
};

/* ---------- community feed UI ---------- */
const stars = n => `<span class="rv-stars" aria-label="${n}/5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}">★</i>`).join('')}</span>`;
const item = (r, i, cloud) => `<article class="cf-item${r.mine?' mine':''}" data-i="${i}">
    <div class="cf-top"><span class="cf-av" style="background:${colorOf(r.author)}">${esc((r.author||'?')[0].toUpperCase())}</span>
      <div class="cf-who"><b>${esc(r.author)}${r.mine?` <span class="cf-me">${L('bạn','you')}</span>`:''}</b><span class="tiny muted">${esc(r.at||'')}</span></div>
      <span class="spacer"></span>${r.stars?stars(r.stars):''}${r.love?`<span class="cf-love" title="${L('Yêu thích','Loved')}">❤</span>`:''}</div>
    ${r.tags&&r.tags.length?`<div class="rv-tagline">${r.tags.slice(0,6).map(t=>`<span>${esc(PV.tr?PV.tr(t):t)}</span>`).join('')}</div>`:''}
    ${r.text?`<p class="cf-text">${esc(r.text)}</p>`:''}
    ${PV.rvPhotos.grid(r.photos)}
    ${cloud && !r.mine && r.id ? `<button class="cf-report tiny" data-rep="${esc(r.id)}">⚑ ${L('Báo cáo','Report')}</button>` : ''}
  </article>`;
/* stale-while-revalidate: show the last copy at once, then refresh from the server */
const cacheKey = (k, t) => 'cf:' + k + ':' + t;
PV.renderFeed = async (el, kind, target, opts={}) => {
  if (!el) return;
  const title = opts.title || L('💬 Đánh giá từ cộng đồng','💬 Community reviews');
  let rows = [], shown = 0;
  const draw = (res, append) => {
    if (!document.body.contains(el)) return;
    if (!append){
      el.innerHTML = `<div class="cf-head"><b>${title}</b><span class="spacer"></span>
          ${res.avg ? `<span class="cf-avg"><b>★ ${(+res.avg).toFixed(1)}</b><span class="tiny muted"> · ${res.total} ${L('đánh giá','reviews')}${res.loves?` · ❤ ${res.loves}`:''}</span></span>` : (res.total ? `<span class="tiny muted">${res.total} ${L('đánh giá','reviews')}</span>` : '')}</div>
        ${!res.cloud ? `<div class="cf-note tiny">🔒 ${L('Chưa kết nối được máy chủ – đang hiện đánh giá của các tài khoản trên máy này.','Cannot reach the server – showing reviews from profiles on this device.')}</div>` : ''}
        <div class="cf-list"></div><div class="cf-more"></div>`;
      rows = []; shown = 0;
    }
    const list = el.querySelector('.cf-list');
    if (!res.rows.length && !rows.length){ list.outerHTML = `<div class="cf-empty small muted">${opts.empty || L('Chưa có ai đánh giá. Hãy là người đầu tiên!','No reviews yet. Be the first!')}</div>`; return; }
    res.rows.forEach(r => { rows.push(r); list.insertAdjacentHTML('beforeend', item(r, rows.length - 1, res.cloud)); const a = list.lastElementChild; PV.rvPhotos.bindGrid(a, r.photos, r.author); });
    shown = rows.length;
    $$('[data-rep]', list).forEach(b => { if (b._b) return; b._b = 1; b.onclick = async () => { b.disabled = true; try { await PV.community.report(b.dataset.rep); b.textContent = L('Đã báo cáo – cảm ơn bạn','Reported – thank you'); } catch(e){ b.disabled = false; } }; });
    const more = el.querySelector('.cf-more');
    more.innerHTML = shown < res.total ? `<button class="btn ghost sm" type="button">${L('Xem thêm','Show more')} (${res.total - shown})</button>` : '';
    const mb = more.querySelector('button'); if (mb) mb.onclick = async () => { mb.disabled = true; mb.textContent = L('Đang tải…','Loading…'); draw(await PV.community.list(kind, target, shown), true); };
  };
  let cached = null; try { cached = PV.store.get(cacheKey(kind, target), null); } catch(e){}
  if (cached && cached.rows) draw(cached);
  else el.innerHTML = `<div class="cf-head"><b>${title}</b></div><div class="cf-load tiny muted">${L('Đang tải…','Loading…')}</div>`;
  const fresh = await PV.community.list(kind, target, 0);
  if (fresh.cloud) PV.store.set(cacheKey(kind, target), {...fresh, at: Date.now()});
  if (!cached || JSON.stringify(cached.rows) !== JSON.stringify(fresh.rows) || cached.total !== fresh.total) draw(fresh);
};
})();
