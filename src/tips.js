/* ---------- "Lưu ý khi ghé" – smart visiting tips per place (+ live weather) ---------- */
(() => {
const L = (vi, en) => PV.L(vi, en);
const has = (p, c) => p.cats && p.cats.includes(c);
const N = (p) => PV.norm(p.name || '');

/* hand-written notes for well-known places */
const SPECIAL = {
  h0: () => [
    ['👔', L('Ăn mặc lịch sự (tránh áo hai dây, quần quá ngắn) vì đây là di tích quốc gia đặc biệt.', 'Dress neatly (no tank tops or very short shorts) – this is a special national relic.')],
    ['👘', L('Bãi cỏ và mặt tiền rất hợp chụp áo dài – nên mang theo áo dài và đến lúc 8–9h sáng cho ánh sáng đẹp.', 'The lawn and façade are perfect for áo dài photos – bring one and come around 8–9 am for soft light.')],
    ['🚶', L('Khuôn viên rộng, nhiều cầu thang – nên mang giày thoải mái.', 'Large grounds with many stairs – wear comfortable shoes.')]],
  h1: () => [
    ['👘', L('Mái vòm và sảnh vàng cực hợp chụp áo dài; sáng sớm vắng khách hơn.', 'The vaulted hall is a classic áo dài photo spot; mornings are quieter.')],
    ['✉️', L('Có thể mua bưu thiếp và gửi thư ngay tại quầy – một món quà kỷ niệm dễ thương.', 'You can buy and post a postcard right at the counter – a cute souvenir.')]],
  h2: () => [
    ['🎭', L('Chỉ vào bên trong khi có vé xem biểu diễn; còn lại chụp ảnh ở bậc thềm phía trước.', 'You can only go inside with a show ticket; otherwise take photos on the front steps.')],
    ['👔', L('Đi xem diễn nên mặc trang phục lịch sự, đến sớm 15 phút.', 'For a show, dress smartly and arrive 15 minutes early.')],
    ['👘', L('Mặt tiền kiểu Pháp lên ảnh áo dài rất sang, đẹp nhất lúc lên đèn buổi tối.', 'The French façade looks elegant with áo dài, especially when lit up at night.')]],
  h7: () => [
    ['📚', L('Nhẹ tay khi xem sách, mua một cuốn để ủng hộ các nhà sách nhé.', 'Handle books gently, and buy one to support the shops.')],
    ['📸', L('Rất nhiều góc chụp “sống ảo”, hợp áo dài hoặc đồ vintage.', 'Lots of photogenic corners – great with áo dài or vintage outfits.')]],
  h8: () => [
    ['🕯️', L('Nhiều hình ảnh chiến tranh gây xúc động mạnh – cân nhắc khi đi cùng trẻ nhỏ, giữ thái độ trang nghiêm.', 'Many war images are very confronting – consider this with young children and stay respectful.')],
    ['🚫', L('Không chụp đùa giỡn, tạo dáng vui nhộn bên hiện vật.', 'Avoid playful posing next to the exhibits.')]],
  h11: () => [
    ['🏫', L('Đây là trường học đang hoạt động – chỉ chụp ảnh phía ngoài cổng, không tự ý vào trong giờ học.', 'This is a working school – take photos outside the gate and don’t enter during class hours.')],
    ['👘', L('Áo dài trắng nữ sinh chụp trước cổng trường cổ rất “đúng vibe”.', 'A white schoolgirl áo dài in front of the old gate is the classic look.')]],
  s6: () => [
    ['👜', L('Chợ rất đông – đeo túi phía trước, giữ kỹ điện thoại và ví.', 'It gets very crowded – wear your bag in front and keep an eye on your phone and wallet.')],
    ['💬', L('Hỏi giá trước khi mua và mặc cả nhẹ nhàng, lịch sự.', 'Ask the price first and bargain politely.')]],
  h10: () => [
    ['👘', L('Nhà thờ màu hồng là “phông nền quốc dân” – áo dài trắng, hồng pastel hoặc xanh nhạt lên ảnh rất xinh.', 'The pink church is an iconic backdrop – white, pastel-pink or light-blue áo dài look lovely.')]],
  h6: () => [
    ['🏗️', L('Nhà thờ có thể đang trùng tu, một phần bị che chắn – chụp từ quảng trường phía trước là đẹp nhất.', 'The cathedral may be under restoration and partly covered – the square in front gives the best shot.')]],
};

function base(p){
  const n = N(p), out = [];
  const church = /nha tho/.test(n), pagoda = /chua |^chua|den |mieu/.test(n+' '), museum = /bao tang/.test(n);
  if (church) {
    out.push(['👔', L('Ăn mặc kín đáo, lịch sự (che vai, váy/quần qua gối) khi vào nhà thờ.', 'Dress modestly (covered shoulders, knee-length) inside the church.')]);
    out.push(['🤫', L('Giữ trật tự, không chụp ảnh và đi lại trong giờ lễ.', 'Keep quiet and don’t take photos or walk around during Mass.')]);
  }
  if (pagoda) {
    out.push(['👔', L('Ăn mặc kín đáo; cởi giày dép trước khi vào chánh điện.', 'Dress modestly and take off your shoes before entering the main hall.')]);
    out.push(['🙏', L('Nói nhỏ, không chỉ tay vào tượng Phật, xin phép trước khi chụp người đang lễ.', 'Speak softly, don’t point at Buddha statues, and ask before photographing worshippers.')]);
  }
  if (museum) {
    out.push(['📷', L('Không dùng đèn flash và không chạm vào hiện vật.', 'No flash photography and don’t touch the exhibits.')]);
    out.push(['🎒', L('Có thể phải gửi balo lớn ở quầy – mang theo túi nhỏ cho tiện.', 'Large backpacks may need to be checked in – a small bag is easier.')]);
  }
  if (has(p,'history') && !church && !pagoda && !museum && !SPECIAL[p.id])
    out.push(['👔', L('Đây là di tích – nên ăn mặc lịch sự, giữ gìn cảnh quan.', 'This is a heritage site – dress neatly and keep it clean.')]);
  if (has(p,'checkin'))
    out.push(['👘', L('Điểm check-in đẹp, hợp phong cách áo dài – có thể mang theo áo dài để chụp ảnh.', 'A great photo spot that suits áo dài – consider bringing one for pictures.')]);
  if (has(p,'checkin') || (has(p,'history') && !museum))
    out.push(['⏰', L('Ánh sáng đẹp nhất khoảng 7–9h sáng hoặc 16–17h30 chiều, lúc này cũng đỡ đông.', 'Best light is around 7–9 am or 4–5:30 pm, which is also less crowded.')]);
  if (has(p,'shopping') && p.id !== 's6') {
    out.push(['💳', L('Hỏi giá trước; nhiều cửa hàng nhận thẻ/QR nhưng vẫn nên mang ít tiền mặt.', 'Check prices first; many shops take cards/QR but carry some cash.')]);
    if (/dac san|nutty|marou|langfarm|legumes|mart/.test(n)) out.push(['🏷️', L('Đồ ăn làm quà: xem kỹ hạn sử dụng và cách bảo quản khi mang đi xa.', 'Food gifts: check the expiry date and storage if travelling far.')]);
  }
  if (has(p,'food')) {
    const ft = PV.foodType ? PV.foodType(p) : 'meal';
    out.push(['⏳', ft==='snack'
      ? L('Quán ăn vặt thường đông buổi chiều tối – đến sớm một chút để có chỗ ngồi.', 'Snack spots get busy late afternoon/evening – come a bit early for a seat.')
      : L('Giờ cao điểm (11h30–13h, 18–19h30) thường phải chờ – nên đến sớm hoặc lệch giờ.', 'Peak hours (11:30–13:00, 18:00–19:30) mean queues – come early or off-peak.')]);
    if (/oc |^oc|bach tuoc|hai san/.test(n+' ')) out.push(['💬', L('Hải sản/ốc tính theo dĩa hoặc ký – hỏi giá trước khi gọi món.', 'Seafood/snails are priced per plate or kilo – ask before ordering.')]);
    out.push(['💵', L('Quán bình dân nên mang tiền mặt mệnh giá nhỏ hoặc hỏi trước có nhận chuyển khoản không.', 'Street eateries prefer small cash – ask first if they take bank transfer.')]);
  }
  return out;
}

PV.placeTips = (p) => {
  if (!p) return [];
  const sp = SPECIAL[p.id] ? SPECIAL[p.id]() : [];
  const seen = new Set(), res = [];
  [...sp, ...base(p)].forEach(t => { const k = t[0]; if (k==='👘' && seen.has('👘')) return; if (k==='👔' && seen.has('👔')) return; seen.add(k); res.push(t); });
  if (p.warning) res.unshift(['⚠️', esc(p.warning)]);
  return res.slice(0, 6);
};

const outdoor = (p) => has(p,'checkin') || has(p,'nature') || (has(p,'history') && !/bao tang|nha hat/.test(N(p))) || /pho am thuc|vỉa hè|via he|xe lam/.test(N(p));
PV.weatherPlaceTips = (w, p) => {
  const t = [];
  if (!w) return t;
  if (w.kind === 'storm') t.push(['⛈️', L('Hôm nay có dông – ưu tiên điểm trong nhà, tránh đứng dưới cây lớn.', 'Thunderstorms today – favour indoor spots and avoid standing under big trees.')]);
  else if (w.kind === 'rain' || w.kind === 'heavy') t.push(['☔', outdoor(p) ? L('Hôm nay trời mưa – nhớ mang dù/áo mưa; ảnh check-in nên đợi tạnh mưa.', 'It’s raining today – bring an umbrella/raincoat; wait for a break for photos.') : L('Trời mưa nhưng đây là điểm trong nhà – lựa chọn rất hợp hôm nay, vẫn nhớ mang dù khi di chuyển.', 'Rainy, but this is indoors – a good pick today; still bring an umbrella for the trip.')]);
  else if (w.kind === 'drizzle') t.push(['🌂', L('Có mưa phùn – mang theo dù nhỏ cho chắc.', 'Light drizzle – a small umbrella is handy.')]);
  if (w.isDay && w.uv >= 6 && outdoor(p)) t.push(['🧴', L(`Nắng gắt (UV ${Math.round(w.uv)}) – bôi kem chống nắng, đội nón, mang nước; áo dài nên chọn vải thoáng.`, `Strong sun (UV ${Math.round(w.uv)}) – sunscreen, a hat and water; choose a breathable áo dài.`)]);
  else if (w.feels >= 35) t.push(['💧', L(`Trời nóng (${Math.round(w.feels)}°C) – mang theo nước uống.`, `It’s hot (${Math.round(w.feels)}°C) – carry water.`)]);
  return t;
};

const li = (t, cls='') => `<li class="${cls}"><span class="ti">${t[0]}</span><span>${t[1]}</span></li>`;
const _open = PV.openPlace;
PV.openPlace = (id, opt) => {
  const r = _open(id, opt);
  const p = PV.byId(id), dr = document.getElementById('drawer'); if (!p || !dr) return r;
  const body = dr.querySelector('.body'); if (!body || body.querySelector('.tipbox')) return r;
  const tips = PV.placeTips(p); if (!tips.length) return r;
  const html = `<div class="tipbox"><b class="tb-h">📌 ${L('Lưu ý khi ghé','Before you go')}</b><ul>${tips.map(t=>li(t)).join('')}</ul></div>`;
  const kv = body.querySelector('.kv'); if (kv) kv.insertAdjacentHTML('beforebegin', html); else body.insertAdjacentHTML('beforeend', html);
  const ws = PV.state.settings.weather || {on:true};
  if (ws.on !== false && p.coords && PV.getWeather) PV.getWeather(p.coords[1], p.coords[0]).then(w => {
    const ul = body.querySelector('.tipbox ul'); if (!ul || !document.body.contains(ul)) return;
    const wt = PV.weatherPlaceTips(w, p); if (wt.length) ul.insertAdjacentHTML('afterbegin', wt.map(t=>li(t,'wx')).join(''));
  }).catch(()=>{});
  return r;
};

/* chatbot: "đi X cần lưu ý gì / mặc gì / mang gì" */
const _la = PV.localAnswer;
PV.localAnswer = (text) => {
  const n = PV.norm(text);
  if (/luu y|chu y|mac gi|an mac|trang phuc|nen mang|can mang|mang gi|ao dai|tip|what to wear|what to bring|dress/.test(n)) {
    const pl = PV_DATA.places.map(p => [p, PV.norm(p.name.split(/[–(]| - /)[0].trim())]).filter(([p,k]) => k.length > 3 && n.includes(k)).sort((a,b)=>b[1].length-a[1].length)[0];
    if (pl) { const p = pl[0], t = PV.placeTips(p);
      if (t.length) return {t: L(`Khi ghé ${p.name}, bạn lưu ý nhé:`, `Tips for visiting ${p.name_en||p.name}:`) + '\n' + t.map(x=>x[0]+' '+x[1].replace(/<[^>]+>/g,'')).join('\n') + '\n' + L('Mở thẻ địa điểm trên bản đồ để xem thêm lưu ý theo thời tiết hôm nay.', 'Open the place card on the map for weather-based tips for today.'), places:[p.id]}; }
  }
  return _la(text);
};
})();
