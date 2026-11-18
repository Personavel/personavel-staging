/* ===== Personavel – rate the website itself (stars, heart, comment) on the profile page ===== */
(function(){
'use strict';
const {$, $$, esc, state} = PV;
const get = () => (state.appReview && typeof state.appReview === 'object') ? state.appReview : (state.appReview = PV.store.get('appReview', null) || {stars:0, love:false, text:'', tags:[], at:''});
get();
if (PV.USER_KEYS && !PV.USER_KEYS.includes('appReview')) PV.USER_KEYS.push('appReview');
const TAGS = [['Dễ dùng','Easy to use'],['Giao diện đẹp','Beautiful design'],['Chatbot hữu ích','Helpful chatbot'],['Bản đồ tiện','Handy map'],['Lịch trình hay','Great itineraries'],['Dấu mộc vui','Fun stamps'],['Cần cải thiện','Needs work']];
const MOOD = ['', '😕', '😐', '🙂', '😊', '🤩'];
const MOODT = [['',''],['Chưa hài lòng','Not happy'],['Tạm được','Okay'],['Khá tốt','Good'],['Rất thích','Love it'],['Tuyệt vời!','Amazing!']];

function html(){
  const r = get();
  return `<div class="row"><h3 style="margin:0">💬 ${PV.L('Đánh giá Personavel','Rate Personavel')}</h3><span class="spacer"></span>
      <button class="rv-heart ${r.love?'on':''}" id="arLove" aria-pressed="${r.love}"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 5 6.4 5c2 0 3.6 1.1 4.6 2.6l1 1.4 1-1.4C14 6.1 15.6 5 17.6 5 21 5 23.1 8.4 21.6 11.8 19.5 16.4 12 21 12 21z"/></svg><span>${r.love?PV.L('Đã thả tim','Loved'):PV.L('Thả tim','Love it')}</span></button></div>
    <p class="small muted" style="margin:6px 0 4px">${PV.L('Bạn thấy trang web thế nào? Cảm nhận của bạn giúp nhóm làm Personavel tốt hơn.','How do you like the website? Your feedback helps the team improve Personavel.')}</p>
    <div class="rv-rate"><div class="rv-pick" id="arStars">${[1,2,3,4,5].map(i=>`<button data-s="${i}" class="${i<=r.stars?'on':''}" aria-label="${i}">★</button>`).join('')}</div>
      <span class="rv-mood" id="arMood">${r.stars?`${MOOD[r.stars]} ${PV.L(...MOODT[r.stars])}`:PV.L('Chạm để chấm sao','Tap to rate')}</span></div>
    <div class="rv-tags">${TAGS.map(([vi,en])=>`<button class="chip ${(r.tags||[]).includes(vi)?'on':''}" data-t="${esc(vi)}">${PV.L(vi,en)}</button>`).join('')}</div>
    <textarea class="input" id="arText" rows="3" maxlength="600" placeholder="${PV.L('Để lại lời nhận xét, góp ý hoặc tính năng bạn muốn có…','Leave a comment, suggestion or a feature you would like…')}">${esc(r.text||'')}</textarea>
    ${PV.rvPhotos.editor(r.photos||[], 'arPh')}
    <label class="rv-pub"><input type="checkbox" id="arPub" ${r.pub!==false?'checked':''}> <span>🌐 ${PV.L('Hiển thị công khai','Show publicly')} <span class="tiny muted">${PV.L('với tên','as')} “${esc(state.profile?.name||PV.L('Du khách','Traveller'))}”</span></span></label>
    <div class="rv-actions">
      <span class="tiny muted">${r.at?PV.L('Đã gửi ','Sent ')+esc(r.at):PV.L('Chưa gửi','Not sent yet')}${r.cloudAt?' · 🌐 '+PV.L('công khai','public'):''}</span>
      <div class="row" style="gap:6px"><button class="btn sm" id="arSend">${r.at?PV.L('Cập nhật đánh giá','Update review'):PV.L('Gửi đánh giá','Send review')}</button></div></div>`;
}
function bind(card){
  const save = (patch) => { Object.assign(get(), patch); PV.save('appReview'); };
  const redraw = () => { card.innerHTML = html(); bind(card); };
  $('#arLove', card).onclick = () => { const v = !get().love; save({love:v}); redraw(); if (v) burst(card.querySelector('#arLove')); };
  const btns = $$('#arStars button', card), mood = $('#arMood', card);
  btns.forEach(b => {
    b.onmouseenter = () => { const n=+b.dataset.s; btns.forEach(x=>x.classList.toggle('hov', +x.dataset.s<=n)); mood.textContent = `${MOOD[n]} ${PV.L(...MOODT[n])}`; };
    b.onmouseleave = () => { btns.forEach(x=>x.classList.remove('hov')); const s=get().stars; mood.textContent = s?`${MOOD[s]} ${PV.L(...MOODT[s])}`:PV.L('Chạm để chấm sao','Tap to rate'); };
    b.onclick = () => { save({stars:+b.dataset.s, text:$('#arText',card).value.trim()}); redraw(); };
  });
  $$('.rv-tags .chip', card).forEach(c => c.onclick = () => { const s=new Set(get().tags||[]); s.has(c.dataset.t)?s.delete(c.dataset.t):s.add(c.dataset.t); save({tags:[...s], text:$('#arText',card).value.trim()}); redraw(); });
  PV.rvPhotos.bindEditor(card, 'arPh', get().photos || [], (ph) => { save({photos: ph, text: $('#arText',card).value.trim()}); redraw(); });
  $('#arPub', card).onchange = () => save({pub: $('#arPub', card).checked});
  $('#arSend', card).onclick = async () => {
    const t = $('#arText', card).value.trim(); const r = get();
    if (!r.stars && !t && !r.love && !(r.photos||[]).length) { PV.toast(PV.L('Bạn chấm sao hoặc viết vài dòng nhé','Add a rating or a few words first')); return; }
    const first = !r.at; save({text:t, pub: $('#arPub', card).checked, at:new Date().toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'})});
    if (first) PV.addPoints(10);
    const btn = $('#arSend', card);
    if (get().pub !== false && PV.community.enabled()){
      btn.disabled = true; btn.textContent = PV.L('Đang gửi…','Sending…');
      try { const out = await PV.community.publish('site', 'personavel', get()); if (out) save({photos: out.photos, cloudId: out.id, cloudAt: Date.now()}); }
      catch(e){ PV.toast(e.userMsg || PV.L('Đã lưu trên máy – chưa gửi lên được (kiểm tra mạng)','Saved on this device – could not send (check your connection)')); }
    } else if (get().pub === false && get().cloudAt && PV.community.enabled()){ PV.community.remove('site','personavel', get().cloudId).catch(()=>{}); save({cloudAt: null}); }
    redraw(); thanks(card);
    const f = document.getElementById('arFeed'); if (f) PV.renderFeed(f, 'site', 'personavel', {title: PV.L('🌟 Mọi người nói gì về Personavel','🌟 What people say about Personavel')});
  };
}
function burst(el){
  const r = el.getBoundingClientRect();
  for (let i=0;i<10;i++){ const h=document.createElement('i'); h.className='ar-heart'; h.textContent='❤'; const a=Math.random()*Math.PI*2, d=30+Math.random()*40;
    h.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;--dx:${Math.cos(a)*d}px;--dy:${Math.sin(a)*d-20}px;font-size:${10+Math.random()*10}px`;
    document.body.appendChild(h); setTimeout(()=>h.remove(),900); }
}
function thanks(card){
  const g = PV.todayGuide();
  const t = document.createElement('div'); t.className = 'ar-thanks';
  t.innerHTML = `<div class="ar-bot">${PV.robot(g)}</div><b>${PV.L('Cảm ơn bạn rất nhiều!','Thank you so much!')} 💙</b><span>${PV.L('Nhóm Personavel đã nhận được đánh giá của bạn.','The Personavel team got your review.')}</span>`;
  card.appendChild(t); setTimeout(()=>{ t.classList.add('out'); setTimeout(()=>t.remove(),400); }, 2600);
  burst(t);
}
const _profile = PV.views.profile;
PV.views.profile = (m) => {
  _profile(m);
  const card = document.createElement('div'); card.className = 'card ar-card'; card.style.marginTop = '18px'; card.style.position = 'relative';
  card.innerHTML = html(); m.appendChild(card); bind(card);
  const feed = document.createElement('section'); feed.className = 'card cf'; feed.id = 'arFeed'; feed.style.marginTop = '18px'; m.appendChild(feed);
  PV.renderFeed(feed, 'site', 'personavel', {title: PV.L('🌟 Mọi người nói gì về Personavel','🌟 What people say about Personavel'), empty: PV.L('Chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ cảm nhận!','No reviews yet. Be the first to share!')});
};
})();
