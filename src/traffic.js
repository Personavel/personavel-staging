/* ===== Personavel – traffic, closures & tourist-trap notices =====
   There is no free live accident/jam feed for HCMC, so this combines:
   • known rules (rush hours, walking-street hours),
   • dated construction/closure notices from official news (each with its source and validity),
   • hotspots where tourists are often touted or overcharged,
   and links to Google Maps (live traffic) for the real-time picture. */
(function(){
'use strict';
const T_ = (vi, en) => PV.L(vi, en);
const today = () => new Date();
const ymd = (d) => d.toISOString().slice(0, 10);

/* zones: c=[lng,lat], r=km. win: [startMin,endMin] (end may pass midnight). days: 0=Sun..6=Sat. modes: which travel modes are affected */
const ZONES = [
  { id:'buivien', c:[106.6930,10.7672], r:.35, kind:'closure', icon:'🚷', modes:['moto','car','taxi'], win:[19*60, 26*60],
    vi:'Phố đi bộ Bùi Viện cấm xe từ 19h đến 2h sáng – gửi xe ở đường lân cận rồi đi bộ vào.',
    en:'Bùi Viện walking street is closed to vehicles 7 pm – 2 am – park nearby and walk in.',
    src:'https://www.nomadotravel.app/vi/attractions/bui-vien-walking-street' },
  { id:'buivien-crowd', c:[106.6930,10.7672], r:.3, kind:'crowd', icon:'👥', win:[20*60, 25*60],
    vi:'Bùi Viện rất đông khoảng 21h – 1h: giữ kỹ điện thoại, ví; xem giá trước khi gọi đồ uống, đừng theo người mời chào vào quán.',
    en:'Bùi Viện is packed around 9 pm – 1 am: watch your phone and wallet, check drink prices first, ignore touts pulling you into bars.' },
  { id:'nguyenhue', c:[106.7035,10.7742], r:.3, kind:'closure', icon:'🚶', modes:['moto','car','taxi'],
    vi:'Phố đi bộ Nguyễn Huệ chỉ dành cho người đi bộ – gửi xe ở bãi xung quanh. Tối cuối tuần và dịp lễ rất đông, có thể bị phân luồng.',
    en:'Nguyễn Huệ is pedestrian-only – park around it. Weekend evenings and holidays are very crowded and may have diversions.' },
  { id:'metro2-taodan', c:[106.6900,10.7750], r:.45, kind:'works', icon:'🚧', modes:['moto','car','taxi','bus'], from:'2026-10-10',
    vi:'Thi công ga metro số 2 Tao Đàn: Cách Mạng Tháng 8 (Nguyễn Du – Nguyễn Thị Minh Khai) và Nguyễn Thị Minh Khai (Cao Thắng – Huyền Trân Công Chúa) chạy một chiều, dễ kẹt giờ cao điểm.',
    en:'Metro line 2 works at Tao Đàn: Cách Mạng Tháng 8 (Nguyễn Du – Nguyễn Thị Minh Khai) and Nguyễn Thị Minh Khai (Cao Thắng – Huyền Trân Công Chúa) are one-way, often jammed at rush hour.',
    src:'https://ttbc-hcm.gov.vn/tu-ngay-10-10-cam-o-to-nhieu-tuyen-duong-o-trung-tam-tphcm-de-thi-cong-metro-so-2-1022290.html' },
  { id:'metro2-benthanh', c:[106.6968,10.7708], r:.4, kind:'works', icon:'🚧', modes:['moto','car','taxi','bus'], from:'2026-11-01',
    vi:'Khu ga metro số 2 Bến Thành (giao lộ Trần Hưng Đạo – Phạm Ngũ Lão) được rào chắn thi công từ tháng 11/2026 – dự trù thêm thời gian, có thể phải đi vòng.',
    en:'The metro line 2 Bến Thành station area (Trần Hưng Đạo – Phạm Ngũ Lão junction) is fenced off for works from Nov 2026 – allow extra time and expect detours.',
    src:'https://baomoi.com/tu-ngay-10-10-trung-tam-tphcm-thanh-dai-cong-truong-thi-cong-metro-so-2-c56180536.epi' },
  { id:'lethanhton', c:[106.7012,10.7772], r:.2, kind:'rule', icon:'⛔', modes:['car','taxi'], days:[1,2,3,4,5], rush:true,
    vi:'Lê Thánh Tôn (Đồng Khởi – Pasteur) hạn chế một số phương tiện giờ cao điểm ngày thường – tài xế có thể phải đi đường khác.',
    en:'Lê Thánh Tôn (Đồng Khởi – Pasteur) restricts some vehicles at weekday rush hours – drivers may take another street.',
    src:'https://plo.vn/tu-26-7-nhieu-phuong-tien-bi-cam-luu-thong-tren-duong-le-thanh-ton-tphcm-post861638.html' }
];
/* places where visitors are commonly touted or overcharged */
const TRAPS = [
  { at:'s6', c:[106.6981,10.7725], r:.25, vi:'Quanh chợ Bến Thành hay có người chèo kéo, bán hàng rong nâng giá và hàng nhái: hỏi giá trước, mặc cả lịch sự, không đưa tiền cho người mặc trang phục tu sĩ xin tiền.',
    en:'Around Bến Thành Market expect touts, overpriced street vendors and fakes: ask prices first, bargain politely, don’t give money to people in monk robes asking for donations.',
    src:'https://tienphong.vn/phat-hien-5-nguoi-nuoc-ngoai-mac-trang-phuc-tu-si-moi-goi-ban-hang-cho-du-khach-o-cho-ben-thanh-post1869203.tpo' },
  { c:[106.7020,10.7760], r:.6, vi:'Khu trung tâm có người gánh dừa mời “chụp ảnh gánh dừa” rồi bán giá rất cao – từ chối lịch sự nếu không muốn mua, hoặc hỏi giá rõ trước.',
    en:'In the centre, coconut sellers invite you to “pose with the shoulder pole” and then charge a lot – politely decline, or agree a price first.',
    src:'https://vtcnews.vn/xac-minh-thong-tin-chat-chem-du-khach-330-000-dong-qua-dua-o-tp-hcm-ar1037128.html' },
  { c:[106.6992,10.7796], r:.3, vi:'Quanh Nhà thờ Đức Bà – Bưu điện có xích lô, xe ôm mời chở dạo: thỏa thuận giá trọn gói trước khi lên xe, ưu tiên gọi xe qua ứng dụng.',
    en:'Near the Cathedral and Post Office, cyclo and motorbike drivers offer rides: agree the full price before getting on, or book through an app.' }
];

PV.TRAPS = TRAPS;   // chatbot dùng để trả lời câu hỏi về chặt chém
const near = (a, b, r) => PV.dist(a, b) <= r;
/* shortest distance (km) from point p to segment ab, all [lng,lat] */
function segDist(p, a, b){
  const k = Math.cos(p[1] * Math.PI / 180) * 111.32, ky = 110.57;
  const ax = (a[0]-p[0])*k, ay = (a[1]-p[1])*ky, bx = (b[0]-p[0])*k, by = (b[1]-p[1])*ky;
  const dx = bx-ax, dy = by-ay, l2 = dx*dx+dy*dy; let t = l2 ? -(ax*dx+ay*dy)/l2 : 0; t = Math.max(0, Math.min(1, t));
  return Math.hypot(ax + t*dx, ay + t*dy);
}
const inWin = (min, w) => { if (!w) return true; const m = min < w[0] && w[1] > 1440 ? min + 1440 : min; return m >= w[0] && m <= w[1]; };
const active = (z, d = today()) => (!z.from || ymd(d) >= z.from) && (!z.to || ymd(d) <= z.to);
PV.isRush = (min, d = today()) => { const dow = d.getDay(); return dow >= 1 && dow <= 5 && ((min >= 6*60+30 && min <= 8*60+30) || (min >= 16*60+30 && min <= 19*60)); };

/* notices for one leg (from → to, departing at minute `dep`) */
PV.legNotices = (from, to, dep, mode, d = today()) => {
  const out = [];
  if (!to) return out;
  if (mode !== 'walk' && mode !== 'metro' && PV.isRush(dep, d))
    out.push({icon:'🚦', kind:'rush', text: T_('Giờ cao điểm (6h30–8h30, 16h30–19h ngày thường): đường trung tâm dễ kẹt, nên đi sớm hơn 10–15 phút hoặc chọn đi bộ nếu gần.', 'Rush hour (6:30–8:30, 16:30–19:00 weekdays): central streets jam easily – leave 10–15 min earlier or walk if it is close.')});
  ZONES.forEach(z => {
    if (!active(z, d) || z.kind === 'crowd') return;
    if (z.modes && !z.modes.includes(mode)) return;
    if (z.days && !z.days.includes(d.getDay())) return;
    if (z.rush && !PV.isRush(dep, d)) return;
    if (z.win && !inWin(dep, z.win)) return;
    const hit = near(to, z.c, z.r) || (from && segDist(z.c, from, to) <= z.r * .7);
    if (hit) out.push({icon:z.icon, kind:z.kind, text:T_(z.vi, z.en), src:z.src});
  });
  return out;
};
/* notices for being at a place at minute `arr` */
PV.placeNotices = (p, arr, d = today()) => {
  const out = []; if (!p || !p.coords) return out;
  ZONES.filter(z => z.kind === 'crowd' && active(z, d) && near(p.coords, z.c, z.r) && inWin(arr, z.win)).forEach(z => out.push({icon:z.icon, kind:'crowd', text:T_(z.vi, z.en)}));
  TRAPS.filter(t => t.at === p.id || near(p.coords, t.c, t.r)).forEach(t => out.push({icon:'🛡️', kind:'trap', text:T_(t.vi, t.en), src:t.src}));
  return out;
};
/* live picture: Google Maps shows current traffic, closures and incidents reported by drivers */
PV.liveTrafficUrl = (a, b, mode) => PV.dirUrl(a, b, mode === 'walk' ? 'walk' : 'car');
PV.TRAFFIC_ZONES = ZONES;
})();
