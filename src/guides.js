/* ===== Personavel – each guide has a topic and a chat session of their own =====
   • PV.routeChat(text, guideId, ctx) → {verdict:'own'|'any'|'other'|'off', to, scores}
       own   – the question is in this guide's topic
       any   – small talk / follow-up on what this guide just said: any guide answers
       other – another guide's topic → polite refusal + "Ask <name>" button
       off   – not about travelling in Ho Chi Minh City → polite refusal
   • state.chat is now the session of the selected guide (state.chats = {an:[…], uyen:[…], …});
     switching guides keeps every session, "Cuộc trò chuyện mới" clears only the current one.
   Topics approved by the team (18/11/2026):
     An – history, monuments, museums, street-name stories, historic events
     Uyên – eateries, dishes, Michelin, coffee, vegetarian/allergies, food prices, food markets
     Hà – itineraries, directions, getting around (bus, Grab, metro), opening hours, tickets, weather, traffic, safety & scams
     Kiệt – photo spots, golden hours, photo tips, outfits for photos (áo dài), shopping & souvenirs
     Phương – architecture, churches/pagodas/temples, festivals, customs, dress code & etiquette, arts */
(function(){
'use strict';
const PV = window.PV;
const flat = (s) => ' ' + String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' ';
const tones = (s) => ' ' + String(s || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim() + ' ';
const plainTyped = (s) => !/[à-ỹđ]/i.test(String(s || '').normalize('NFC'));

/* keywords: F = matched without tones (safe words only), A = matched with tones (words that are ambiguous without them),
   P = extra forms used only when the user typed without any tone marks */
const TOPICS = {
  an: {
    F: ['lich su','di tich','bao tang','chien tranh','khang chien','thoi phap','phap thuoc','thuoc dia','1975','30 4','giai phong','thong nhat','nguon goc','ten duong','y nghia ten','ten goi','vi sao goi','tai sao goi',
        'ke chuyen','cau chuyen','su tich','nhan vat','anh hung','trieu nguyen','sai gon xua','ngay xua','xay nam','xay dung nam','duoc xay','ai xay','nam nao','co tu','hien vat','chung tich',
        'history','historic','historical','museum','war','story','origin','founded','built','colonial','heritage','street name','who was','legend','monument','relic'],
    A: ['ý nghĩa'], P: []
  },
  uyen: {
    F: ['quan an','mon an','mon ngon','an gi','an uong','am thuc','do an','an vat','an sang','an trua','an toi','an khuya','bua sang','bua trua','bua toi','nha hang','quan ngon','an ngon','an o dau','michelin','ca phe','cafe','coffee',
        'tra sua','nuoc uong','do uong','quan nuoc','sinh to','an chay','quan chay','do chay','com chay','di ung','dau phong','hai san','cho dem am thuc','pho am thuc','banh mi','bun bo','bun rieu','bun thit nuong','com tam',
        'banh xeo','hu tieu','banh trang','sup cua','banh flan','bot chien','bo kho','banh beo','bach tuoc','banh canh','goi cuon','food','eat','eating','restaurant','breakfast','lunch','dinner','dish','vegetarian','vegan',
        'allergy','allergic','drink','street food','snack','hungry','noodle','bakery','dessert','tasty','delicious'],
    A: ['ăn','đói','ngon','phở','chè','ốc','xôi','cháo','lẩu','mì','bún','cơm','chay','quán'], P: ['an pho','an che','an oc','an xoi','an chao','an lau','an com','an mi','an bun','an gi','di an','pho ngon','quan pho']
  },
  ha: {
    F: ['lich trinh','ke hoach','len lich','hanh trinh','di dau','di choi','1 ngay','mot ngay','nua ngay','2 ngay','3 ngay','chi duong','duong di','dan duong','di bang','di lai','di chuyen','xe buyt','xe bus','grab','taxi','xe om',
        'metro','tau dien','xe may','thue xe','gui xe','bai xe','gio mo cua','mo cua','dong cua','may gio','gia ve','ve vao','mua ve','thoi tiet','troi mua','co mua','mua khong','nhiet do','nong khong','ket xe','tac duong',
        'giao thong','phan luong','cam xe','cao diem','an toan','chat chem','cheo keo','lua dao','moc tui','cuop giat','san bay','tan son nhat','khach san','cho o','luu tru','homestay','doi tien','the sim','wifi','nha ve sinh',
        'xa khong','bao xa','mat bao lau','di bo','itinerary','plan','trip','schedule','route','directions','how to get','get to','bus','metro','opening hours','open','close','closing','ticket','tickets','weather','rain',
        'traffic','safe','safety','scam','airport','hotel','how far','how long','tonight','where to go'],
    A: ['vé'], P: []
  },
  kiet: {
    F: ['check in','checkin','song ao','chup anh','chup hinh','goc chup','goc dep','chup dep','may anh','chup','anh dep','hinh dep','gio vang','hoang hon','binh minh','view dep','selfie','flycam','thue ao dai','tao dang','pose',
        'mua sam','mua qua','qua luu niem','qua tang','dac san','luu niem','cua hang','thoi trang','quan ao','mua do','trung tam thuong mai','photo','photos','picture','pictures','instagram','camera','sunset','sunrise',
        'shopping','souvenir','souvenirs','gift','gifts','buy','market','fashion','clothes','mall','shop'],
    A: ['chợ','quà'], P: ['mua qua']
  },
  phuong: {
    F: ['kien truc','nha tho','ngoi chua','di chua','chua vinh nghiem','den tho','mieu','thanh duong','le hoi','tet','trung thu','phong tuc','tap quan','tin nguong','ton giao','van hoa','nghe thuat','nha hat','roi nuoc','cai luong',
        'trien lam','my thuat','buc tranh','tranh ve','gom su','an mac','mac gi','trang phuc','ung xu','le phep','quy tac','cam ky','kieng ky','luu y khi','can luu y','chu y gi','ao dai','phong cach kien truc','gothic','culture','cultural',
        'architecture','church','cathedral','pagoda','temple','festival','tradition','traditions','custom','customs','etiquette','dress code','what to wear','art','arts','theater','theatre','opera','water puppet'],
    A: ['chùa','đình','đền'], P: []
  }
};
const ORDER = ['ha', 'uyen', 'an', 'phuong', 'kiet'];   // tie-break: the most general first
const CITIES = ['ha noi','hanoi','da nang','danang','hoi an','nha trang','da lat','phu quoc','vung tau','can tho','sa pa','sapa','ha long','bangkok','singapore','tokyo','seoul','paris','london','new york','han quoc','nhat ban','thai lan'];
const CITIES_A = ['huế'];
const OFF = ['bai tap','giai toan','phuong trinh','dao ham','tich phan','hoa hoc','vat ly','lam van','nghi luan','ngu phap','tieng anh lop','lap trinh','code','python','javascript','html','bong da','world cup','chung khoan','co phieu',
  'bitcoin','crypto','chinh tri','bau cu','tong thong','benh','thuoc','bac si','game','lien quan','lien minh','ca si','kpop','idol','phim','bai hat','loi bai hat','nguoi yeu','thi dai hoc','diem thi',
  'homework','math','equation','physics','chemistry','essay','grammar','programming','coding','football','soccer','stock','stocks','election','president','politics','medicine','doctor','movie','movies','song','lyrics',
  'girlfriend','boyfriend','exam'];
const SMALL = ['xin chao','chao','hello','hi','hey','alo','cam on','thank','thanks','thank you','tam biet','bye','goodbye','ban la ai','ban ten gi','who are you','your name','ban khoe khong','how are you','ok','oke','okay',
  'duoc','vang','da','co','khong','ko','yes','no','thoi','u','uk','good morning','good evening'];
const FILLER = ['ban','minh','nhe','nha','a','oi','toi','em','anh','chi','nhieu','qua','lam','robot','bot','an','uyen','ha','kiet','phuong','xin','nhe','ne','luon','buoi','sang','trua','toi','chieu','nhe','nhes','the','there'];
const FOLLOW = ['o dau','dia chi','may gio','gia','bao nhieu','quan thu','cho thu','cai thu','thu nhat','thu hai','thu 2','thu ba','dau tien','con nua','con khong','khac khong','cho khac','quan khac','goi y them','ke them','noi them',
  'chi tiet','them vao lich trinh','chi duong','nam o dau','where','address','how much','price','more','another','the first','the second','tell me more','add it','directions',
  'mo cua','dong cua','gio mo cua','gia ve','ve','re hon','cho nao nua','quan nao nua','where is it','opening hours','open','hours','ticket','tickets','cheaper','something cheaper','other','others','any other'];
const ADJUST = ['bo ','thay ','them ','doi ','dieu chinh','di bo thoi','remove','skip','drop','instead','adjust','change','add ',
  'ngay 2','ngay thu 2','ngay thu hai','ngay 3','ngay tiep','ngay mai','hom sau','day 2','day two','day 3','next day','second day','tomorrow'];

const has = (hay, list) => list.filter(w => hay.includes(' ' + w.trim() + ' ')).length;
let PLACES = null, STREETS = null;
const index = () => {
  if (PLACES) return;
  const D = window.PV_DATA || {places: [], streets: []};
  const keyOf = p => [flat(p.name.split(/[–(]| - /)[0].trim()).trim(), p.name_en ? flat(p.name_en.split('(')[0].trim()).trim() : null].filter(k => k && k.length > 3);
  PLACES = D.places.map(p => ({p, keys: keyOf(p)})).sort((a, b) => Math.max(...b.keys.map(k => k.length), 0) - Math.max(...a.keys.map(k => k.length), 0));
  STREETS = (D.streets || []).map(s => flat(s.name).trim()).filter(k => k.length > 3);
};
/* which guide a place belongs to, from its category */
const placeGuides = (p) => {
  const out = new Set(), n = tones(p.name);
  if (p.cats.includes('food')) out.add('uyen');
  if (p.cats.includes('history')) out.add(/ (nhà thờ|chùa|nhà hát|mỹ thuật|đền|đình) /.test(n) ? 'phuong' : 'an');
  if (p.cats.includes('shopping')) out.add('kiet');
  if (p.cats.includes('checkin') && !p.cats.includes('history')) out.add('kiet');
  return out;
};

PV.routeChat = (text, guideId, ctx = {}) => {
  index();
  const F = flat(text), A = tones(text), plain = plainTyped(text);
  const nWords = F.trim() ? F.trim().split(' ').length : 0;
  if (!nWords) return {verdict: 'any'};
  const scores = {};
  for (const [id, t] of Object.entries(TOPICS)){
    let s = has(F, t.F) + has(A, t.A);
    if (plain) s += has(F, t.P);
    if (s) scores[id] = s;
  }
  // a place or street named in the question
  const named = PLACES.filter(x => x.keys.some(k => F.includes(' ' + k + ' '))).map(x => x.p);
  const placeSet = new Set(); named.slice(0, 2).forEach(p => placeGuides(p).forEach(g => placeSet.add(g)));
  const street = STREETS.some(k => F.includes(' ' + k + ' '));
  if (street && !named.length) placeSet.add('an');
  const travel = Object.keys(scores).length || placeSet.size || /sai gon|saigon|ho chi minh|tp hcm|hcm|thanh pho|du lich|tham quan|travel|tour|visit|personavel/.test(F);

  // not about travelling in HCMC: another city ("thời tiết Hà Nội", "đi Đà Lạt"), or a non-travel subject with no travel words
  const A2 = A.replace(/ bún bò huế /g, ' bún bò ');   // the dish, not the city
  if ((has(F.replace(/ bun bo hue /g, ' bun bo '), CITIES) || has(A2, CITIES_A)) && !named.length && !street) return {verdict: 'off', scores};
  if (has(F, OFF) && !named.length && !street && !Object.keys(scores).length) return {verdict: 'off', scores};
  // small talk ("xin chào An", "cảm ơn nhiều nha") and follow-ups on this guide's last answer
  if (nWords <= 6){ let rest = F, hit = false;
    for (const w of SMALL.slice().sort((a, b) => b.length - a.length)){ while (rest.includes(' ' + w + ' ')){ rest = rest.replace(' ' + w + ' ', ' '); hit = true; } }
    if (hit && rest.trim().split(' ').every(w => !w || FILLER.includes(w))) return {verdict: 'any', scores}; }
  // hỏi tiếp về chỗ vừa gợi ý ("mấy giờ mở cửa?", "opening hours?") – chỉ khi bỏ các từ hỏi tiếp đi thì không còn chủ đề mới
  // ("chụp ảnh ở đâu đẹp?", "bánh mì ở đâu ngon?" là câu hỏi MỚI, không phải hỏi tiếp)
  if (ctx.lastPlaces && nWords <= 7 && has(F, FOLLOW) && !named.length){
    let F2 = F; for (const w of FOLLOW.slice().sort((a, b) => b.length - a.length)) F2 = F2.split(' ' + w + ' ').join(' ');
    const fresh = Object.entries(TOPICS).some(([, t]) => has(F2, t.F) || (plain && has(F2, t.P)));
    if (!fresh) return {verdict: 'any', scores, follow: 'places'}; }
  if (ctx.lastTrip && ADJUST.some(w => (' ' + F.trim() + ' ').startsWith(' ' + w) || F.includes(' ' + w.trim() + ' ')) && nWords <= 10){
    const cmd = ADJUST.some(w => (' ' + F.trim() + ' ').startsWith(' ' + w)) || /\b(ngay (2|3|thu|tiep|mai)|hom sau|day (2|3|two)|next day|second day|tomorrow)\b/.test(F);
    if (cmd) return {verdict: 'any', scores, follow: 'trip'}; }   // "kể thêm về Dinh Độc Lập" không phải lệnh sửa lịch trình → xét chủ đề như thường

  // the guides this question belongs to: topic words first, then the category of a named place
  let set = Object.keys(scores);
  if (!set.length) set = [...placeSet];
  if (!set.length) return {verdict: 'own', scores, unclear: !travel};   // nothing recognisable: this guide answers with what it can do
  const top = Math.max(0, ...Object.values(scores));
  if (set.includes(guideId) && (!top || (scores[guideId] || 0) >= top)) return {verdict: 'own', scores};   // ngang điểm: mình trả lời
  const best = set.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0) || ORDER.indexOf(a) - ORDER.indexOf(b))[0];
  return {verdict: 'other', to: best, scores};
};

/* suggestions shown under each guide's chat – every one is inside that guide's topic */
PV.guideSuggest = (id) => {
  const L = (vi, en) => PV.L(vi, en);
  return ({
    an: [L('🏛️ Kể chuyện về Dinh Độc Lập','🏛️ Tell me about the Independence Palace'), L('🛣️ Đường Nguyễn Huệ có ý nghĩa gì?','🛣️ What does Nguyễn Huệ street mean?'), L('📜 Lịch sử Bưu điện Thành phố','📜 History of the Central Post Office'), L('🏺 Bảo tàng nào nên ghé?','🏺 Which museum should I visit?')],
    uyen: [L('🍜 Gợi ý quán ăn ngon gần đây','🍜 Good places to eat nearby'), L('🥖 Bánh mì ngon ở đâu?','🥖 Where is good bánh mì?'), L('🥗 Quán chay ngon','🥗 Good vegetarian food'), L('🍲 Phở ngon','🍲 Good phở')],
    ha: [L('🗺️ Lên lịch trình 1 ngày','🗺️ Plan a 1-day itinerary'), L('🌙 Đi chơi buổi tối ở đâu?','🌙 Where to go in the evening?'), L('🚶 Lịch trình buổi tối, đi bộ, tiết kiệm','🚶 Evening itinerary, walking, on a budget'), L('🕒 Dinh Độc Lập mấy giờ mở cửa?','🕒 When does the Independence Palace open?')],
    kiet: [L('📸 Góc check-in đẹp','📸 Nice photo spots'), L('🎁 Mua quà lưu niệm ở đâu?','🎁 Where to buy souvenirs?'), L('🌇 Chụp ảnh hoàng hôn ở đâu?','🌇 Where to shoot the sunset?'), L('🛍️ Mua sắm thời trang','🛍️ Fashion shopping')],
    phuong: [L('⛪ Kiến trúc Nhà thờ Đức Bà','⛪ Architecture of Notre-Dame Cathedral'), L('🙏 Kể về Chùa Vĩnh Nghiêm','🙏 Tell me about Vĩnh Nghiêm Pagoda'), L('🎭 Nhà hát Thành phố có gì?','🎭 What is the Opera House like?'), L('👗 Đi Nhà thờ Đức Bà cần lưu ý gì?','👗 What to know before visiting Notre-Dame Cathedral?')]
  })[id] || [];
};
/* what each guide offers – used by the greeting, "who are you", the default answer and the Home button */
PV.guideOffer = (id) => {
  const L = (vi, en) => PV.L(vi, en);
  const g = (window.PV.GUIDES || []).find(x => x.id === id) || {name: ''};
  const O = {
    an: {ask: L('Bạn muốn nghe kể chuyện về địa danh nào, hay tìm hiểu ý nghĩa một tên đường?', 'Which landmark would you like a story about, or which street name should I explain?'),
         can: L('kể chuyện lịch sử, di tích, bảo tàng và ý nghĩa tên đường', 'history, monuments, museums and the meaning of street names'),
         cta: L(`Nghe kể chuyện với ${g.name}`, `Stories with ${g.name}`),
         ex: [L('Kể chuyện về Dinh Độc Lập', 'Tell me about the Independence Palace'), L('Đường Nguyễn Huệ có ý nghĩa gì?', 'What does Nguyễn Huệ street mean?'), L('Bảo tàng nào nên ghé?', 'Which museum should I visit?')]},
    uyen: {ask: L('Hôm nay bạn muốn ăn gì – phở, bánh mì, quán chay hay cà phê?', 'What would you like to eat today – phở, bánh mì, vegetarian or coffee?'),
         can: L('gợi ý quán ăn, món ngon, quán Michelin, cà phê và món chay', 'eateries, dishes, Michelin places, coffee and vegetarian food'),
         cta: L(`Tìm quán ngon với ${g.name}`, `Find good food with ${g.name}`),
         ex: [L('Phở ngon', 'Good phở'), L('Bánh mì ngon ở đâu?', 'Where is good bánh mì?'), L('Quán chay ngon', 'Good vegetarian food')]},
    ha: {ask: L('Bạn muốn mình lên lịch trình, chỉ đường hay xem giờ mở cửa và thời tiết?', 'Shall I plan an itinerary, give directions, or check opening hours and the weather?'),
         can: L('lên lịch trình, chỉ đường, đi lại, giờ mở cửa, giá vé, thời tiết và lưu ý an toàn', 'itineraries, directions, getting around, opening hours, tickets, weather and safety tips'),
         cta: L(`Lên lịch trình với ${g.name}`, `Plan a trip with ${g.name}`),
         ex: [L('Lên lịch trình 1 ngày', 'Plan a 1-day itinerary'), L('Lịch trình buổi tối, đi bộ, tiết kiệm', 'Evening itinerary, walking, on a budget'), L('Dinh Độc Lập mấy giờ mở cửa?', 'When does the Independence Palace open?')]},
    kiet: {ask: L('Bạn muốn tìm góc check-in đẹp hay chỗ mua quà lưu niệm?', 'Looking for great photo spots, or a place to buy souvenirs?'),
         can: L('tìm góc chụp đẹp, giờ đẹp để chụp, trang phục chụp ảnh và chỗ mua sắm, quà lưu niệm', 'photo spots, the best light, outfits for photos, shopping and souvenirs'),
         cta: L(`Săn góc chụp với ${g.name}`, `Photo spots with ${g.name}`),
         ex: [L('Góc check-in đẹp', 'Nice photo spots'), L('Chụp ảnh hoàng hôn ở đâu?', 'Where to shoot the sunset?'), L('Mua quà lưu niệm ở đâu?', 'Where to buy souvenirs?')]},
    phuong: {ask: L('Bạn muốn tìm hiểu kiến trúc nhà thờ, chùa, hay phong tục và lễ hội nào?', 'Would you like to learn about church or pagoda architecture, or a custom or festival?'),
         can: L('kiến trúc, nhà thờ – chùa – đình, lễ hội, phong tục và cách ăn mặc, ứng xử khi tham quan', 'architecture, churches, pagodas and temples, festivals, customs and visiting etiquette'),
         cta: L(`Khám phá văn hóa với ${g.name}`, `Culture with ${g.name}`),
         ex: [L('Kiến trúc Nhà thờ Đức Bà', 'Architecture of Notre-Dame Cathedral'), L('Kể về Chùa Vĩnh Nghiêm', 'Tell me about Vĩnh Nghiêm Pagoda'), L('Đi Nhà thờ Đức Bà cần lưu ý gì?', 'What to know before visiting Notre-Dame Cathedral?')]}
  };
  return O[id] || O.ha;
};
PV.GUIDE_TOPIC = (id) => PV.L(({an:'lịch sử, di tích và câu chuyện tên đường', uyen:'ăn uống', ha:'lịch trình, đi lại, giờ mở cửa và thời tiết', kiet:'chụp ảnh và mua sắm', phuong:'văn hóa, kiến trúc và phong tục'})[id] || '',
  ({an:'history, monuments and street-name stories', uyen:'food and drink', ha:'itineraries, getting around, opening hours and weather', kiet:'photos and shopping', phuong:'culture, architecture and customs'})[id] || '');

if (!PV.views) return;   // loaded by the routing test without the app
const {state} = PV;
const T_ = (vi, en) => PV.L(vi, en);

/* ---------- one chat session per guide ---------- */
const S = PV.store;
let chats = S.get('chats', null);
if (!chats || typeof chats !== 'object'){ chats = {}; const old = S.get('chat', null); if (Array.isArray(old) && old.length) chats[PV.todayGuide().id] = old; }
const cur = () => PV._chatOwner || PV.todayGuide().id;   // khi trợ lý khác trả lời hộ, vẫn đọc/ghi cuộc trò chuyện đang mở
Object.defineProperty(state, 'chat', {configurable: true, enumerable: true,
  get(){ const id = cur(); if (!Array.isArray(chats[id])) chats[id] = []; return chats[id]; },
  set(v){ chats[cur()] = Array.isArray(v) ? v : []; }});
Object.defineProperty(state, 'chats', {configurable: true, enumerable: true,
  get(){ return chats; },
  set(v){ chats = (v && typeof v === 'object') ? v : {[cur()]: state.chat}; }});   // an old saved profile without sessions keeps its single chat
if (PV.USER_KEYS && !PV.USER_KEYS.includes('chats')) PV.USER_KEYS.push('chats');
const _save = PV.save;
PV.save = (k) => { if (k === 'chat' || k === 'chats'){ Object.keys(chats).forEach(id => { if (Array.isArray(chats[id])) chats[id] = chats[id].slice(-60); }); S.set('chats', chats); S.set('chat', state.chat); return; } return _save(k); };

/* ---------- answer only inside this guide's topic ---------- */
const _answer = PV.answer;
// cho trợ lý `to` trả lời hộ: giọng và phạm vi của `to`, nhưng ngữ cảnh vẫn là cuộc trò chuyện của trợ lý đang mở (`own`)
const asGuide = async (to, own, fn) => { const keep = PV.todayGuide, keepOwner = PV._chatOwner;
  PV._chatOwner = own.id; PV.todayGuide = () => to;
  try { return await fn(); } finally { PV.todayGuide = keep; PV._chatOwner = keepOwner; } };
PV.answer = async (text) => {
  const g = PV.todayGuide();
  const prev = [...state.chat].reverse().find(c => c.r !== 'me' && c.t);
  const r = PV.routeChat(text, g.id, {lastPlaces: !!(prev && prev.places && prev.places.length), lastTrip: [...state.chat].some(c => c.trip)});
  if (r.verdict === 'off') return {t: T_(`Xin lỗi, mình chỉ giúp được về du lịch TP.HCM thôi – địa điểm, ăn uống, lịch trình, văn hóa, chụp ảnh. Bạn hỏi mình về chuyến đi của bạn nhé!`,
    `Sorry, I can only help with travelling in Ho Chi Minh City – places, food, itineraries, culture and photos. Ask me about your trip!`), off: true};
  if (r.verdict === 'other'){
    // Câu thuộc phạm vi trợ lý khác → trợ lý đó trả lời LUÔN trong cuộc trò chuyện này (không bắt khách bấm chuyển, không phải hỏi lại)
    const to = PV.GUIDES.find(x => x.id === r.to);
    if (!to) return _answer(text);
    let ans = await asGuide(to, g, () => _answer(text));   // trả lời bằng giọng và phạm vi của người phụ trách
    ans = Object.assign({}, ans);
    ans.t = T_(`${to.name} đây! Câu này về ${PV.GUIDE_TOPIC(r.to)} nên mình trả lời luôn nhé.\n\n`, `${to.name} here! This one is about ${PV.GUIDE_TOPIC(r.to)}, so I'll take it.\n\n`) + (ans.t || '');
    ans.by = to.id; ans.ask = {g: r.to, q: text, done: true};
    return ans;
  }
  // hỏi tiếp ("rẻ hơn?", "bỏ bưu điện", "ngày 2") → người vừa gợi ý trả lời tiếp, không phải trợ lý đang chọn
  if (r.follow){
    const src = [...state.chat].reverse().find(c => c.r !== 'me' && (r.follow === 'trip' ? c.trip : c.places && c.places.length));
    const by = src && src.g && src.g !== g.id && PV.GUIDES.find(x => x.id === src.g);
    if (by){ const ans = await asGuide(by, g, () => _answer(text)); return Object.assign({}, ans, {by: by.id}); }
  }
  return _answer(text);
};
const _sys = PV.systemPrompt;
PV.systemPrompt = () => { const g = PV.todayGuide(); return _sys() + `
PHẠM VI CỦA BẠN (${g.name}): chỉ trả lời về ${PV.GUIDE_TOPIC(g.id)} ở TP.HCM. Câu hỏi thuộc chủ đề khác thì từ chối lịch sự và gợi ý hướng dẫn viên phù hợp. Câu không liên quan tới du lịch TP.HCM thì từ chối.`; };

/* ---------- switch guide (chips, "Ask <name>" button) ---------- */
PV.switchGuide = (id, ask, root) => {
  if (!PV.GUIDES.some(g => g.id === id)) return;
  state.settings.guide = id; PV.save('settings');
  if (ask) PV.pendingAsk = ask;
  if (root && root.id === 'chatpop') PV.chatPop(true);
  else if (PV.views.chat){ const m = document.getElementById('main'); if (location.hash === '#chat' && m) PV.views.chat(m); else { location.hash = '#chat'; } }
};
const _chat = PV.views.chat;
PV.views.chat = (m) => {
  _chat(m);
  const g = PV.todayGuide();
  m.querySelectorAll('.guide').forEach(el => {
    const id = el.dataset.g, n = (chats[id] || []).filter(c => c.r === 'me').length;
    el.setAttribute('role', 'button'); el.tabIndex = 0; el.setAttribute('aria-pressed', String(id === g.id));
    el.setAttribute('aria-label', `${T_('Chọn', 'Choose')} ${el.querySelector('b').textContent}${n ? ' – ' + n + T_(' tin nhắn', ' messages') : ''}`);
    if (n && id !== g.id) el.insertAdjacentHTML('beforeend', `<span class="gcount" aria-hidden="true">${n > 99 ? '99+' : n}</span>`);
    el.onclick = () => { if (id !== g.id) PV.switchGuide(id); };
    el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.click(); } };
  });
  const clr = m.querySelector('#cclear');
  if (clr){ clr.textContent = T_('Cuộc trò chuyện mới', 'New conversation'); clr.title = T_(`Xóa cuộc trò chuyện với ${g.name}`, `Clear the chat with ${g.name}`);
    clr.onclick = () => { state.chat = []; PV.save('chat'); PV.views.chat(m); }; }
  const SHORT = {an:['lịch sử','history'], uyen:['ăn uống','food'], ha:['lịch trình, đi lại','trips & transport'], kiet:['chụp ảnh, mua sắm','photos & shopping'], phuong:['văn hóa, kiến trúc','culture & architecture']}[g.id] || ['Sài Gòn','Saigon'];
  const ci = m.querySelector('#ci'); if (ci) ci.placeholder = T_(`Hỏi ${g.name} về ${SHORT[0]}…`, `Ask ${g.name} about ${SHORT[1]}…`);
};
})();
