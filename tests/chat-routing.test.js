/* Chat routing test – run:  node tests/chat-routing.test.js
   Each guide: at least 5 questions in its topic (must answer itself) and 5 outside it
   (must refuse and point to the right guide, or refuse as not about travelling in HCMC). */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const src = (f) => fs.readFileSync(path.join(__dirname, '..', 'src', f), 'utf8');

function load(lang){
  const window = {PV: {L: (vi, en) => (lang === 'en' ? en : vi), GUIDES: ['an','uyen','ha','kiet','phuong'].map(id => ({id, name: {an:'An',uyen:'Uyên',ha:'Hà',kiet:'Kiệt',phuong:'Phương'}[id]}))}};
  const ctx = vm.createContext({window, console});
  vm.runInContext(src('data.js'), ctx);
  vm.runInContext(src('guides.js'), ctx);
  return window.PV;
}

// [question, expected]  expected: 'own' | 'any' | 'off' | '<guide id>' (= refuse and suggest that guide)
const CASES = {
  an: {
    own: ['Kể chuyện về Dinh Độc Lập', 'Đường Nguyễn Huệ có ý nghĩa gì?', 'Bảo tàng Chứng tích Chiến tranh có gì?', 'Lịch sử Bưu điện Thành phố', 'Vì sao gọi là đường Hai Bà Trưng?',
          'Sài Gòn xưa thời Pháp thuộc thế nào', 'tell me the history of the Independence Palace', 'duong Le Loi ten goi tu dau'],
    out: [['Quán phở nào ngon?', 'uyen'], ['Lên lịch trình 1 ngày', 'ha'], ['Chụp ảnh hoàng hôn ở đâu đẹp?', 'kiet'], ['Mua quà lưu niệm ở đâu?', 'kiet'],
          ['Đi chùa cần ăn mặc thế nào?', 'phuong'], ['Giải bài tập toán giúp mình', 'off'], ['Thời tiết Hà Nội hôm nay', 'off']]
  },
  uyen: {
    own: ['Gợi ý quán ăn ngon gần đây', 'Bánh mì ngon ở đâu?', 'Quán chay ngon', 'Phở ngon', 'Mình bị dị ứng đậu phộng thì ăn gì?', 'Quán cà phê đẹp', 'an gi o Ben Thanh', 'where can I eat vegetarian food', 'Bún bò Huế ở đâu ngon?'],
    out: [['Kể chuyện về Dinh Độc Lập', 'an'], ['Đi xe buýt tới Chợ Bến Thành thế nào?', 'ha'], ['Góc check-in đẹp', 'kiet'], ['Kiến trúc Nhà thờ Đức Bà', 'phuong'],
          ['Viết giúp mình bài văn nghị luận', 'off'], ['Đi Đà Lạt chơi gì?', 'off']]
  },
  ha: {
    own: ['Lên lịch trình 1 ngày', 'Đi chơi buổi tối ở đâu?', 'Dinh Độc Lập mấy giờ mở cửa?', 'Giá vé Bảo tàng Mỹ thuật bao nhiêu?', 'Hôm nay trời mưa không?', 'Từ sân bay về trung tâm đi bằng gì?',
          'Ở phố đi bộ có bị chặt chém không?', 'plan a 2 day trip', 'giờ cao điểm kẹt xe ở đâu?'],
    out: [['Kể chuyện về Dinh Độc Lập', 'an'], ['Quán bánh mì nào ngon?', 'uyen'], ['Chụp ảnh áo dài ở đâu đẹp?', 'kiet'], ['Lễ hội ở Sài Gòn có gì?', 'phuong'],
          ['Đội bóng đá nào vô địch?', 'off'], ['Lập trình Python thế nào?', 'off']]
  },
  kiet: {
    own: ['Góc check-in đẹp', 'Mua quà lưu niệm ở đâu?', 'Chụp ảnh hoàng hôn ở đâu?', 'Mua sắm thời trang', 'Chụp ảnh áo dài ở đâu đẹp?', 'where to buy souvenirs', 'song ao o dau dep', 'Đặc sản mua làm quà ở đâu?'],
    out: [['Ăn gì ngon gần chợ Bến Thành?', 'uyen'], ['Lên lịch trình đi chợ Bến Thành rồi Nhà thờ Đức Bà', 'ha'], ['Đường Nguyễn Huệ có ý nghĩa gì?', 'an'], ['Quán ốc nào ngon?', 'uyen'], ['Đi Grab từ Quận 1 tới sân bay bao nhiêu tiền?', 'ha'], ['Chùa Vĩnh Nghiêm có kiến trúc gì đặc biệt?', 'phuong'],
          ['Bitcoin hôm nay giá bao nhiêu?', 'off'], ['Đi Hội An mua gì?', 'off']]
  },
  phuong: {
    own: ['Kiến trúc Nhà thờ Đức Bà', 'Kể về Chùa Vĩnh Nghiêm', 'Nhà hát Thành phố có gì?', 'Đi Nhà thờ Đức Bà cần lưu ý gì?', 'Lễ hội Tết ở Sài Gòn thế nào?', 'Vào chùa nên ăn mặc ra sao?',
          'what is the dress code for the cathedral', 'xem múa rối nước ở đâu?'],
    out: [['Bảo tàng Chứng tích Chiến tranh có gì?', 'an'], ['Cơm tấm ngon ở đâu?', 'uyen'], ['Lên lịch trình nửa ngày đi bộ', 'ha'], ['Mua quà lưu niệm ở đâu?', 'kiet'],
          ['Ca sĩ Kpop nào nổi tiếng?', 'off'], ['Du lịch Nhật Bản cần chuẩn bị gì?', 'off']]
  }
};
const SMALLTALK = ['xin chào', 'Chào An', 'cảm ơn nhiều nha', 'hello', 'tạm biệt', 'bạn là ai?', 'ok'];

let fail = 0, pass = 0;
const check = (label, got, want, q) => {
  const ok = want === 'own' || want === 'any' || want === 'off' ? got.verdict === want : (got.verdict === 'other' && got.to === want);
  if (ok) pass++; else { fail++; console.log(`✗ ${label}: “${q}” → ${got.verdict}${got.to ? ' ' + got.to : ''} (cần ${want}) ${JSON.stringify(got.scores || {})}`); }
};
for (const lang of ['vi', 'en']){
  const PV = load(lang);
  for (const [g, c] of Object.entries(CASES)){
    if (c.own.length < 5 || c.out.length < 5) { fail++; console.log(`✗ ${g}: cần ít nhất 5 câu mỗi loại`); }
    c.own.forEach(q => check(`${g} đúng phạm vi`, PV.routeChat(q, g), 'own', q));
    c.out.forEach(([q, want]) => check(`${g} ngoài phạm vi`, PV.routeChat(q, g), want, q));
    PV.guideSuggest(g).forEach(q => check(`${g} gợi ý (${lang})`, PV.routeChat(q.replace(/^\S+\s/, ''), g), 'own', q));
    SMALLTALK.forEach(q => check(`${g} xã giao`, PV.routeChat(q, g), 'any', q));
  }
  // greeting / "who are you" / default answer / Home button: each guide only offers its own topic
  const NAMES = {an:'An', uyen:'Uyên', ha:'Hà', kiet:'Kiệt', phuong:'Phương'};
  const GENERIC = /lên lịch trình, gợi ý quán ăn|plan trips, suggest food|plan a trip, suggest places|lịch trình, tìm quán ngon hay/i;
  for (const g of Object.keys(CASES)){
    const o = PV.guideOffer(g);
    o.ex.forEach(q => check(`${g} ví dụ trong lời giới thiệu (${lang})`, PV.routeChat(q, g), 'own', q));
    const ask = PV.routeChat(o.ask, g);
    if (ask.verdict === 'other' || ask.verdict === 'off'){ fail++; console.log(`✗ ${g} câu chào hỏi sang việc của người khác: “${o.ask}” → ${ask.verdict} ${ask.to||''}`); } else pass++;
    if (!o.cta.includes(NAMES[g]) || (g !== 'ha' && /lịch trình|plan a trip/i.test(o.cta))){ fail++; console.log(`✗ ${g} nút trang chủ sai phạm vi: “${o.cta}”`); } else pass++;
    if (GENERIC.test(o.ask + ' ' + o.can)){ fail++; console.log(`✗ ${g} lời giới thiệu còn liệt kê việc của mọi trợ lý: “${o.can}”`); } else pass++;
  }
  // follow-ups go to the guide who just answered
  check('hỏi tiếp', PV.routeChat('mấy giờ mở cửa?', 'uyen', {lastPlaces: true}), 'any', 'mấy giờ mở cửa? (sau gợi ý quán)');
  check('hỏi tiếp', PV.routeChat('quán thứ 2 ở đâu', 'uyen', {lastPlaces: true}), 'any', 'quán thứ 2 ở đâu');
  check('chỉnh lịch trình', PV.routeChat('bỏ Chợ Bến Thành', 'ha', {lastTrip: true}), 'any', 'bỏ Chợ Bến Thành');
}
console.log(`\n${pass} đạt, ${fail} lỗi`);
process.exit(fail ? 1 : 0);
