/* ===== Personavel – chatbot intent & context layer =====
   Runs before the keyword engine: recognises greetings, thanks, small talk and follow-up questions
   ("ở đâu?", "mấy giờ mở cửa?", "còn quán nào khác?", "quán thứ 2") using the previous turns. */
(function(){
'use strict';
const {state} = PV;
const L = (vi, en) => PV.L(vi, en);

/* tone-preserving lowercase words, and the same without tones */
const words = (t) => ' ' + t.toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
const flat = (t) => ' ' + PV.norm(t).replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const plainTyped = (t) => !/[à-ỹđ]/i.test(t.normalize('NFC'));

/* ---------- small-talk intents (checked on the whole message) ---------- */
const GREET_A = ['xin chào','chào bạn','chào cậu','chào em','chào anh','chào chị','chào buổi sáng','chào buổi chiều','chào buổi tối','chào','hello','hi','hey','alo','a lô','hế lô','helo'];
const GREET_P = ['xin chao','chao ban','chao cau','chao em','chao anh','chao chi','chao buoi sang','chao buoi chieu','chao buoi toi','chao','hello','hi','hey','alo','a lo','he lo','helo','good morning','good afternoon','good evening'];
const FILLER = ['bạn','ban','nhé','nhe','nha','ạ','a','ơi','oi','mình','minh','tớ','to','em','anh','chị','chi','robot','bot','personavel','nè','ne','!','luôn','luon','đó','do'];
const THANKS = ['cảm ơn','cám ơn','cam on','thank you','thanks','thank','tks','thx','cảm ơn nhiều','ok cảm ơn'];
const BYE = ['tạm biệt','tam biet','bye','bye bye','goodbye','hẹn gặp lại','hen gap lai','see you','pp'];
const WHO = ['bạn là ai','ban la ai','bạn tên gì','ban ten gi','tên bạn là gì','ten ban la gi','who are you','what is your name','your name'];
const HOW = ['bạn khỏe không','ban khoe khong','khỏe không','khoe khong','how are you','bạn thế nào','ban the nao'];
const YES = ['ok','oke','okay','được','duoc','ừ','u','uk','vâng','vang','dạ','da','có','co','yes','yep','sure','đồng ý','dong y'];
const NO = ['không','khong','ko','k','no','nope','thôi','thoi','không cần','khong can'];

const inList = (msg, list) => { const a = words(msg), f = flat(msg); return list.some(x => a.includes(' ' + x + ' ') || f.includes(' ' + PV.norm(x) + ' ')); };
/* remove greeting words from the start: "xin chào, tìm quán phở" → "tìm quán phở" */
function stripGreeting(msg){
  let t = msg.trim(), changed = true, hit = false;
  while (changed){
    changed = false;
    for (const g of [...GREET_A, ...GREET_P].sort((a,b)=>b.length-a.length)){
      const re = new RegExp('^' + g.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[\\s,.!?;:~-])[\\s,.!?;:~-]*', 'i');
      if (re.test(t.normalize('NFC'))){
        if (g === 'chao' && /^chao\s+(long|ga|vit|ca|suon|ech|bo|hen|trang|dinh duong|hau|tim|oc)\b/i.test(PV.norm(t))) continue; // "chao long" typed without tones = cháo lòng
        // "chào" written with tones must not be "cháo" (rice porridge)
        t = t.normalize('NFC').replace(re, ''); changed = hit = true; break;
      }
    }
    for (const f of FILLER){ const re = new RegExp('^' + f.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '(?=$|[\\s,.!?])[\\s,.!?]*', 'i'); if (hit && re.test(t)){ t = t.replace(re, ''); changed = true; } }
  }
  return {hit, rest: t.trim()};
}
const onlyFiller = (t) => !t || words(t).trim().split(' ').every(w => !w || FILLER.includes(w) || FILLER.includes(PV.norm(w)) || PV.todayGuide().name.toLowerCase() === w);

/* ---------- conversation context ---------- */
const lastBot = () => [...(state.chat||[])].reverse().find(c => c.r !== 'me' && (c.places && c.places.length));
const lastUserAsk = () => PV._ctx && PV._ctx.lastAsk;
PV._ctx = PV._ctx || {lastAsk:null, shown:[]};

const ORD = [[['thứ nhất','đầu tiên','số 1','cái 1','quán 1','chỗ 1','first','1st'],0],[['thứ hai','thứ 2','số 2','cái 2','quán 2','chỗ 2','second','2nd'],1],[['thứ ba','thứ 3','số 3','cái 3','quán 3','chỗ 3','third','3rd'],2],[['thứ tư','thứ 4','số 4','quán 4','fourth','4th'],3],[['thứ năm','thứ 5','số 5','quán 5','fifth','5th'],4],[['cuối cùng','cuối','last one','the last'],-1]];
const pickFrom = (msg, ids) => {
  for (const [ks, i] of ORD) if (inList(msg, ks)) return ids[i < 0 ? ids.length - 1 : i] || null;
  return null;
};
const REF = ['nó','chỗ đó','chỗ này','quán đó','quán này','nơi đó','nơi này','ở đó','đó','đấy','địa điểm đó','it','there','that place','this place','that one','do','day','cho do','quan do','noi do'];

function followUp(msg){
  const prev = lastBot(); if (!prev) return null;
  const ids = prev.places.filter(id => PV.byId(id));
  if (!ids.length) return null;
  const chosen = pickFrom(msg, ids);
  const target = chosen || (ids.length === 1 || inList(msg, REF) ? ids[0] : null);
  const p = target && PV.byId(target);
  const nm = (x) => L(x.name, x.name_en || x.name);

  // "ăn gì gần đó?", "chụp ảnh quanh đây?" → hỏi về khu quanh chỗ vừa nhắc
  if (p && (chosen || inList(msg, REF)) && inList(msg, ['gần','quanh','xung quanh','kế bên','cạnh','gan','quanh do','near','nearby','around','close to']))
    return PV._baseAnswer(msg + ' ' + L('gần', 'near') + ' ' + p.name);
  // "rẻ hơn?", "something cheaper" → cùng loại, giá thấp hơn những chỗ vừa gợi ý
  if (inList(msg, ['rẻ hơn','re hon','giá rẻ hơn','rẻ thôi','re thoi','cheaper','something cheaper','less expensive','on a budget'])){
    const shown = ids.map(PV.byId), food = shown.filter(x => PV.foodType && PV.foodType(x)).length * 2 >= shown.length;
    const lo = Math.min(...shown.map(x => x.price_level || 2));
    const cand = PV.D.places.filter(x => !ids.includes(x.id) && (food ? PV.foodType(x) : !PV.foodType(x) && x.cats.some(c => shown.some(y => y.cats.includes(c))))
      && (x.price_level || 2) < Math.max(lo, 2)).sort((a, b) => (a.price_level || 2) - (b.price_level || 2) || (b.rating || 0) - (a.rating || 0)).slice(0, 5);
    if (cand.length){ PV._ctx.shown = [...(PV._ctx.shown || []), ...cand.map(x => x.id)]; return {t: L('Mấy chỗ rẻ hơn cho bạn nè:', 'Here are some cheaper options:'), places: cand.map(x => x.id)}; }
    return {t: L('Những chỗ vừa gợi ý đã là mức giá thấp nhất mình có rồi.', 'Those are already the cheapest options I have.')};
  }
  // câu có chủ đề MỚI ("bánh mì ở đâu ngon?", "chụp ảnh ở đâu đẹp?") không phải hỏi tiếp → để phần trả lời thường xử lý
  if (!chosen && !inList(msg, REF) && PV.routeChat && PV.routeChat(msg, PV.todayGuide().id, {lastPlaces: true}).verdict !== 'any') return null;

  // "còn quán nào khác?", "gợi ý thêm", "chỗ khác"
  if (inList(msg, ['còn chỗ nào','còn quán nào','còn nơi nào','chỗ nào nữa','quán nào nữa','nơi nào nữa','con cho nao','con quan nao','cho nao nua','quan nao nua','anything else','any other','any others','other places','others','more places','show me more','còn nữa không','còn không','còn nữa','khác không','quán khác','chỗ khác','nơi khác','món khác','thêm nữa','gợi ý thêm','gợi ý khác','cái khác','con nua khong','con nua','quan khac','cho khac','goi y them','more','other','others','something else','another'])){
    const ask = lastUserAsk(); if (!ask) return null;
    const ex = new Set([...(PV._ctx.shown||[]), ...ids]); PV._exclude = ex;
    let r; try { r = PV._baseAnswer(ask); } finally { PV._exclude = null; }
    if (r && r.places && r.places.length){ r.t = L('Thêm vài lựa chọn khác cho bạn nè:', 'Here are a few more options:'); PV._ctx.shown = [...ex, ...r.places]; return r; }
    return {t: L('Mình đã gợi ý hết những chỗ phù hợp nhất rồi. Bạn thử đổi món, khu vực hoặc khung giờ xem sao nhé!', 'That is all the best matches I have. Try another dish, area or time of day!')};
  }
  if (!p) {
    if (inList(msg, ['ở đâu','địa chỉ','mấy giờ','giờ mở cửa','giá','bao nhiêu','o dau','dia chi','may gio','where','address','open','price'])) {
      return {t: L(`Bạn đang hỏi về chỗ nào? Ví dụ “quán thứ 1” hoặc gõ tên: ${ids.slice(0,3).map(id=>nm(PV.byId(id))).join(', ')}.`, `Which place do you mean? e.g. “the first one” or its name: ${ids.slice(0,3).map(id=>nm(PV.byId(id))).join(', ')}.`), places: ids};
    }
    return null;
  }
  if (inList(msg, ['ở đâu','địa chỉ','nằm ở đâu','đường nào','o dau','dia chi','nam o dau','where','address','location'])) return {t: `📍 ${nm(p)}: ${p.address}${p.geo==='approx'?L(' (vị trí gần đúng – bạn nên kiểm tra lại trên Google Maps).',' (approximate location – please double-check).'):''}`, places:[p.id]};
  if (inList(msg, ['mấy giờ','giờ mở cửa','mở cửa','đóng cửa','giờ giấc','may gio','gio mo cua','mo cua','dong cua','open','opening hours','close','hours'])){ const h = L((p.hours||[])[0], (p.hours_en||[])[0] || PV.tr((p.hours||[])[0])); return {t: `🕒 ${nm(p)}: ${h || L('giờ mở cửa chưa được xác minh – bạn nên gọi trước nhé.','opening hours not verified – call ahead.')}`, places:[p.id]}; }
  if (inList(msg, ['giá','bao nhiêu','bao nhiêu tiền','giá vé','vé','đắt không','rẻ không','gia','bao nhieu','gia ve','ve','price','cost','ticket','how much'])){ const pr = L((p.price||[])[0], (p.price_en||[])[0] || PV.tr((p.price||[])[0])) || PV.tr(PV.priceText(p.price_level)); return {t: `🎟️ ${nm(p)}: ${pr}`, places:[p.id]}; }
  if (inList(msg, ['thêm vào lịch trình','cho vào lịch trình','thêm vào lịch','thêm vô lịch trình','them vao lich trinh','add to trip','add it','add to itinerary'])){
    if (!state.trip.stops.some(s => s.id === p.id)){ state.trip.stops.push({id:p.id, by:'me'}); if (PV.retime) PV.retime(state.trip); PV.save('trip'); }
    return {t: L(`Đã thêm ${nm(p)} vào lịch trình của bạn ✅`, `Added ${nm(p)} to your itinerary ✅`), places:[p.id]};
  }
  if (inList(msg, ['chỉ đường','dẫn đường','đường đi','đi thế nào','đi sao','chi duong','dan duong','duong di','directions','how to get','route'])){
    return {t: L(`Mở bản đồ và chọn “${nm(p)}” để xem vị trí; bấm “Chỉ đường” trong thẻ địa điểm để mở Google Maps nhé.`, `Open the map and tap “${nm(p)}”; use “Directions” in the place card to open Google Maps.`), places:[p.id]};
  }
  if (chosen || inList(msg, ['kể thêm','kể về','nói thêm','chi tiết','thông tin','ke them','ke ve','chi tiet','tell me more','details','more about'])){
    return PV._baseAnswer(p.name);
  }
  return null;
}

/* ---------- main wrapper ---------- */
PV._baseAnswer = PV.localAnswer;
PV.localAnswer = (text) => {
  const g = PV.todayGuide(), name = state.profile?.name;
  const raw = String(text || '').trim();
  if (!raw) return {t: L('Bạn muốn hỏi gì nào?', 'What would you like to ask?')};

  // 1) greetings – "xin chào" is a greeting, never "cháo"
  const {hit, rest} = stripGreeting(raw);
  if (hit && onlyFiller(rest)){
    const h = new Date().getHours(), part = h < 11 ? L('buổi sáng','morning') : h < 14 ? L('buổi trưa','noon') : h < 18 ? L('buổi chiều','afternoon') : L('buổi tối','evening');
    return {t: L(`Chào ${name || 'bạn'}! Chúc bạn một ${part} vui vẻ 😊 Mình là ${g.name}. ${PV.guideOffer ? PV.guideOffer(g.id).ask : 'Hôm nay bạn muốn lên lịch trình, tìm quán ngon hay nghe kể chuyện về một địa danh?'}`,
                 `Hi ${name || 'there'}! Have a lovely ${part} 😊 I'm ${g.name}. ${PV.guideOffer ? PV.guideOffer(g.id).ask : 'Would you like an itinerary, a good place to eat, or a story about a landmark?'}`)};
  }
  const msg = hit ? rest : raw;

  // 2) other small talk (only when it is the whole message)
  const short = words(msg).trim().split(' ').length <= 5;
  if (short && inList(msg, THANKS)) return {t: L(`Không có gì đâu${name?', '+name:''}! Cần gì cứ hỏi mình nhé 💙`, `You're welcome${name?', '+name:''}! Ask me anything 💙`)};
  if (short && inList(msg, BYE)) return {t: L('Tạm biệt! Chúc bạn có chuyến đi thật vui, nhớ đóng mộc ở mỗi nơi bạn ghé nhé 👋', 'Bye! Have a great trip – remember to collect a stamp at each place 👋')};
  if (inList(msg, WHO)) return {t: L(`Mình là ${g.name}, hướng dẫn viên ảo của Personavel 🤖 Mình chuyên ${PV.guideOffer ? PV.guideOffer(g.id).can : 'lên lịch trình, gợi ý quán ăn, kể chuyện địa danh và giải thích tên đường'} ở TP.HCM.${PV.guideOffer ? ' ' + PV.guideOffer(g.id).ask : ''}`, `I'm ${g.name}, Personavel's virtual guide 🤖 I look after ${PV.guideOffer ? PV.guideOffer(g.id).can : 'trips, food, landmark stories and street names'} in HCMC.${PV.guideOffer ? ' ' + PV.guideOffer(g.id).ask : ''}`)};
  if (short && inList(msg, HOW)) return {t: L('Mình khỏe lắm, cảm ơn bạn! Còn bạn, hôm nay muốn đi đâu chơi nè?', "I'm great, thanks! Where would you like to go today?")};

  // 3) yes / no after the bot offered something
  const prevBot = [...(state.chat||[])].reverse().find(c => c.r !== 'me');
  if (short && words(msg).trim().split(' ').length <= 2 && prevBot){
    if (inList(msg, YES) && !prevBot.trip && /\?\s*$/.test(prevBot.t||'') && /lịch trình|itinerary/i.test(prevBot.t||'')) return PV._baseAnswer('lên lịch trình 1 ngày');
    if (inList(msg, YES) && prevBot.trip) return {t: L('Tuyệt! Lịch trình đã sẵn sàng – bấm “Lưu lịch trình” để mở trên bản đồ nhé.', 'Great! Your itinerary is ready – tap “Save itinerary” to open it on the map.')};
    if (inList(msg, NO)) return {t: L('Không sao! Bạn cần gì khác thì cứ nhắn mình nhé.', 'No problem! Message me whenever you need something.')};
  }

  if (short && inList(msg, YES) && words(msg).trim().split(' ').length <= 2) return {t: L('Ok nè! Bạn cần gì thêm cứ hỏi mình nhé 😊', 'Okay! Ask me anything else you need 😊')};

  // 4) follow-up questions about what was just suggested
  const f = followUp(msg); if (f) return f;

  // 5) normal request
  const r = PV._baseAnswer(msg);
  if (r && r.places && r.places.length && !r.trip){ PV._ctx.lastAsk = msg; PV._ctx.shown = r.places.slice(); }
  return r;
};

/* ---------- AI mode: same rules for the language model ---------- */
const _sys = PV.systemPrompt;
PV.systemPrompt = () => _sys() + `
HIỂU Ý ĐỊNH & NGỮ CẢNH:
- "chào", "xin chào", "hello", "hi" là lời chào – hãy chào lại thân thiện, KHÔNG hiểu thành món "cháo". Phân biệt dấu: chào ≠ cháo, phố ≠ phở, lâu ≠ lẩu, tôi ≠ tối, che ≠ chè.
- Người dùng gõ không dấu thì đoán theo ngữ cảnh (ví dụ "an chao" = ăn cháo, "chao ban" = chào bạn).
- Câu hỏi tiếp nối như "ở đâu?", "mấy giờ mở cửa?", "giá bao nhiêu?", "quán thứ 2", "còn chỗ nào khác?" là nói về địa điểm vừa được nhắc ở lượt trước.
- Nếu câu hỏi mơ hồ, hỏi lại một câu ngắn thay vì đoán bừa.`;
})();
