/* ===== Personavel – Vietnamese / English ===== */
(function(){
'use strict';
const EN = {
/* nav & shell */
'Trang chủ':'Home','Bản đồ khám phá':'Explore map','Lịch trình của tôi':'My itinerary','Bộ sưu tập Sài Gòn':'Saigon Collection','Chatbot hướng dẫn':'Guide chatbot','Ăn sáng':'Breakfast','Ăn trưa':'Lunch','Ăn tối':'Dinner','Bữa ăn':'Meal','Ăn vặt chiều':'Afternoon snack','Ăn vặt / tráng miệng':'Snack / dessert','Hướng dẫn viên của bạn':'Your guide','Mở trang chatbot đầy đủ':'Open full chatbot page','Đóng':'Close','Trang cá nhân':'My profile','Giới thiệu dự án':'About the project',
'Cá nhân':'Profile','Bản đồ':'Map','Lịch trình':'Itinerary','Bộ sưu tập':'Collection','Chatbot':'Chatbot','Sài Gòn luôn chào đón bạn!':'Saigon always welcomes you!','Your trip · Your story':'Your trip · Your story',
'Mở chatbot hướng dẫn':'Open guide chatbot','Đăng xuất':'Log out','Đóng':'Close','Hủy':'Cancel','Lưu':'Save','Xóa':'Delete','Lên':'Up','Xuống':'Down','Tìm':'Search','Gửi':'Send','Nghe':'Listen','Tiếp tục':'Continue','Quay lại':'Back','Bỏ qua':'Skip','Hoàn thành':'Finish','Hoàn tất':'Done','Xác nhận':'Confirm','Để sau':'Later','Bắt đầu':'Start','Di chuyển':'Transport',
/* welcome / onboarding */
'Your trip, Your story.':'Your trip, Your story.','Bắt đầu hành trình':'Start your journey','Chạm vào bất kỳ đâu để tiếp tục':'Tap anywhere to continue','Chào mừng bạn trở lại!':'Welcome back!',
'Xin chào! Mình là':'Hello! I am',', hướng dẫn viên của Personavel.':', your Personavel guide.','Personavel là gì?':'What is Personavel?','Personavel có gì?':'What Personavel offers','Khẩu vị và lưu ý khi ăn uống?':'Your taste and any food needs?','Dị ứng / lưu ý khác (tự ghi)':'Allergy / other (type it)','Ví dụ: dị ứng hải sản, đậu phộng…':'e.g. seafood or peanut allergy…','Bạn sẽ xuất phát từ đâu?':'Where will you start from?','Vị trí hiện tại của tôi':'My current location','📍 Vị trí hiện tại của tôi':'📍 My current location','🚩 Xuất phát từ':'🚩 Start from','— Chọn điểm xuất phát —':'— Choose a starting point —','Xuất phát:':'Start:','Chỉ đường':'Directions','✨ Gợi ý cho bạn':'✨ For you','Tất cả':'All','Lịch trình':'Itinerary','✨ Tạo lịch trình từ điểm xuất phát':'✨ Plan a trip from my start','✨ Tạo lại lịch trình từ điểm xuất phát':'✨ Re-plan from my start','Hãy chọn điểm xuất phát trước nhé':'Please choose a starting point first','Chưa tìm được lịch trình phù hợp':'No suitable itinerary found','Bạn chưa cấp quyền vị trí – hãy chọn một phường':'Location not allowed – please choose a ward','Bạn thích trải nghiệm gì khi đi du lịch?':'What do you enjoy when you travel?','Ăn uống, chợ, phố ẩm thực':'Food, markets, food streets','Lịch sử – văn hóa, di tích':'History, culture, landmarks','Bảo tàng – nghệ thuật':'Museums & art','Cà phê, thiên nhiên, đi thong thả':'Cafés, nature, taking it slow','Bạn đi cùng ai?':'Who are you travelling with?','Có trẻ em đi cùng':'With children','Có người lớn tuổi':'With older people','Có người dùng xe lăn / hạn chế đi lại':'With a wheelchair user / limited mobility','Phương tiện bạn ưa thích?':'Preferred ways to get around?','Tuyệt vời! Bạn thuộc tuýp':'Great! You are a','Nào, cùng bắt đầu hành trình của riêng bạn nhé!':'Now, let’s start your very own journey!','Bắt đầu hành trình ✨':'Start your journey ✨','Du lịch tự túc':'Self-guided travel','Tự khám phá TP.HCM với bản đồ và lịch trình của riêng bạn.':'Explore Ho Chi Minh City on your own with your own map and itinerary.','Gợi ý đúng gu':'Picks that suit you','Địa điểm phù hợp sở thích và kinh phí cá nhân.':'Places that match your interests and budget.','Thuyết minh tận nơi':'Stories on the spot','Kể ý nghĩa, giá trị lịch sử – văn hóa của từng điểm tham quan.':'The meaning and historical, cultural value of every sight.','Chatbot đồng hành':'Chatbot by your side','Hỏi đường, gợi ý quán ăn, lên lịch trình nhanh.':'Ask the way, find food, plan a trip fast.','Nhóm 11A13 – THPT Lê Quý Đôn':'Class 11A13 – Lê Quý Đôn High School','Bắt đầu ✨':'Start ✨','Mình nên gọi bạn là gì?':'What should I call you?','Chào':'Hi','! Trả lời vài câu nhanh để mình gợi ý địa điểm hợp sở thích và kinh phí của bạn nhé.':'! Answer a few quick questions so I can suggest places that fit your interests and budget.','Bắt đầu':'Start','Khám phá ngay':'Explore now',
'Nền tảng bản đồ du lịch tự túc tại TP.HCM, tích hợp hướng dẫn tham quan, thuyết minh và gợi ý lịch trình cá nhân hóa dựa trên sở thích của bạn.':'A self-guided travel map of Ho Chi Minh City with sightseeing guidance, audio stories and personalised itineraries based on what you love.',
'Ý tưởng hình thành':'How the idea began','Giúp mọi người khám phá TP.HCM theo cách riêng: dễ tìm địa điểm phù hợp, hiểu thêm lịch sử, văn hóa của những nơi mình đi qua.':'To help everyone explore Ho Chi Minh City in their own way: find places that suit them easily and learn more about the history and culture of where they go.',
'Thông điệp':'Our message','“Không hành trình nào là hoàn hảo, chỉ có hành trình phù hợp với bản thân.”':'“No journey is perfect – only the journey that is right for you.”',
'Đội ngũ thực hiện':'The team','Nhóm học sinh lớp 11A13, THPT Lê Quý Đôn: Khánh An, Minh Hà, Tuấn Kiệt, Thục Uyên, Nguyên Phương – cùng cô Nguyễn Thị Kim Thoa hướng dẫn.':'Students of class 11A13, Lê Quý Đôn High School: Khánh An, Minh Hà, Tuấn Kiệt, Thục Uyên, Nguyên Phương – supervised by Ms Nguyễn Thị Kim Thoa.',
'Xin chào! Mình có thể gọi bạn là gì?':'Hi! What should I call you?','Tên hoặc biệt danh của bạn':'Your name or nickname','Ghi nhớ tên cho lần truy cập sau':'Remember my name for next time',
'Hoặc tiếp tục với tài khoản đã lưu trên máy này':'Or continue with an account saved on this device',
'Rất vui được gặp':'Nice to meet you,','! Đây có phải lần đầu tiên bạn khám phá Personavel không?':'! Is this your first time exploring Personavel?','Đây là lần đầu tiên':"It's my first time",'Mình đã từng sử dụng':"I've used it before",
'Bạn có muốn thực hiện lại bài phân tích để cập nhật phong cách du lịch của mình không?':'Would you like to retake the analysis to update your travel style?','Có, làm lại bài phân tích':'Yes, retake the analysis','Không, giữ kết quả cũ':'No, keep my previous result',
'Trước khi bắt đầu, hãy cùng mình khám phá phong cách du lịch của bạn nhé! Một vài câu hỏi nhỏ sẽ giúp Personavel hiểu sở thích và đề xuất những địa điểm phù hợp hơn.':"Before we start, let's discover your travel style! A few quick questions help Personavel understand what you like and suggest better places.",
'Bắt đầu phân tích':'Start the analysis','Phân tích xong! Bạn là':'All done! You are','Tuyệt vời! Hành trình khám phá TP.HCM của bạn đã sẵn sàng. Cùng Personavel bắt đầu nhé!':"Great! Your Ho Chi Minh City adventure is ready. Let's go with Personavel!",'Khám phá ngay':'Explore now',
/* quiz */
'Chọn một hoặc nhiều đáp án':'Choose one or more answers','Chọn một đáp án':'Choose one answer',
'Bạn thích trải nghiệm những hoạt động nào trong chuyến đi?':'Which activities do you enjoy on a trip?','Ăn uống':'Food & drink','Tìm hiểu lịch sử':'Learning history','Nghệ thuật – bảo tàng':'Art – museums','Mua sắm':'Shopping','Chụp ảnh check-in':'Photo spots','Thiên nhiên – thư giãn':'Nature – relaxing','Vui chơi giải trí':'Fun & entertainment',
'Khẩu vị của bạn thiên về…':'Your taste leans towards…','Món Việt':'Vietnamese food','Món Á (Hàn, Nhật, Trung)':'Asian (Korean, Japanese, Chinese)','Món Âu':'Western food','Ăn vặt đường phố':'Street snacks','Nhà hàng sang trọng':'Fine dining',
'Bạn có lưu ý đặc biệt nào về món ăn không?':'Any dietary needs?','Không có':'None','Ăn chay':'Vegetarian','Không ăn cay':'No spicy food','Dị ứng (hải sản, đậu…)':'Allergies (seafood, nuts…)',
'Ngân sách dự kiến cho một người mỗi ngày?':'Expected budget per person per day?','Dưới 200.000đ – tiết kiệm':'Under 200,000đ – budget','200.000 – 500.000đ':'200,000 – 500,000đ','500.000đ – 1 triệu':'500,000đ – 1 million','Trên 1 triệu – dịch vụ cao cấp':'Over 1 million – premium',
'Bạn thuộc tuýp người du lịch nào?':'What kind of traveller are you?','Khám phá – đi nhiều':'Explorer – see a lot','Thư giãn – nghỉ ngơi':'Relaxer – take it easy','Trải nghiệm văn hóa':'Culture seeker','Sống ảo – check-in':'Photo lover','Du lịch ẩm thực':'Foodie',
'Không gian bạn yêu thích?':'Which places do you enjoy?','Trong nhà, trung tâm thương mại':'Indoors, shopping malls','Ngoài trời, phố đi bộ':'Outdoors, walking streets','Quán cà phê yên tĩnh':'Quiet cafés','Bảo tàng, di tích':'Museums, historic sites','Chợ, phố ẩm thực':'Markets, food streets',
'Nhịp độ di chuyển bạn muốn?':'Preferred pace?','Đi được nhiều nơi nhất':'As many places as possible','Thong thả, ít điểm':'Slow, fewer stops','Ưu tiên các điểm gần nhau':'Places close together',
'Bạn sẵn sàng tham quan vào khung giờ nào?':'When do you like to go out?','Cả ngày (sáng – chiều)':'All day (morning – afternoon)','Sáng sớm đến trưa':'Early morning to noon','Chiều đến tối':'Afternoon to evening','Tối đến khuya':'Evening to late night',
'Phương tiện bạn ưa thích? (chọn được nhiều)':'Preferred transport? (choose any)','Đi bộ':'Walking','Xe máy':'Motorbike','Taxi / Grab':'Taxi / Grab','Xe buýt / Metro':'Bus / Metro',
'Bạn thường đi cùng ai?':'Who do you usually travel with?','Một mình':'Solo','Bạn bè':'Friends','Gia đình':'Family','Người thương':'Partner',
'Bạn có nhu cầu đặc biệt khi di chuyển không?':'Any special mobility needs?','Xe lăn / hạn chế đi lại':'Wheelchair / limited mobility','Đi cùng trẻ nhỏ':'With small children','Đi cùng người lớn tuổi':'With elderly people',
/* personas */
'Nhà thám hiểm ẩm thực':'Food explorer','Bạn khám phá thành phố bằng vị giác: quán lâu năm, món địa phương và phố ẩm thực về đêm.':'You explore the city through taste: long-standing eateries, local dishes and night-time food streets.',
'Người kể chuyện lịch sử':'History storyteller','Bạn thích hiểu câu chuyện phía sau mỗi công trình, con đường và hiện vật.':'You love the stories behind every building, street and artefact.',
'Thợ săn góc chụp':'Photo hunter','Kiến trúc đẹp, góc phố độc đáo và ánh sáng đẹp là ưu tiên của bạn.':'Beautiful architecture, unique corners and great light come first for you.',
'Tín đồ mua sắm':'Shopping lover','Local brand, quà lưu niệm và đặc sản là điểm dừng không thể thiếu.':'Local brands, souvenirs and specialties are must-stops for you.',
'Người tận hưởng thong thả':'Slow traveller','Bạn đi chậm, chọn ít điểm nhưng tận hưởng trọn vẹn từng nơi.':'You go slowly, choose fewer stops and enjoy each one fully.',
'Nhà lãng du đa sắc':'All-round wanderer','Bạn muốn thử mọi thứ một chút – Personavel sẽ cân bằng giữa ăn uống, văn hóa và check-in.':'You want to try a bit of everything – Personavel balances food, culture and photo spots.',
/* guides */
'Trưởng đoàn – mê lịch sử':'Team leader – history fan','Chuyên gia ẩm thực':'Food expert','Hướng dẫn viên truyền thông':'Media guide','Người kể chuyện văn hóa':'Culture storyteller',
'Xin chào! Mình là An. Hôm nay mình dẫn bạn đi nghe những câu chuyện của Sài Gòn nhé!':"Hello! I'm An. Today I'll take you to hear the stories of Saigon!",
'Chào bạn! Uyên đây. Đói chưa? Mình biết nhiều quán ngon lắm đó!':"Hi! Uyên here. Hungry yet? I know lots of great places to eat!",
'Hà xin chào! Cần lên lịch trình hay hỏi đường, cứ gọi Hà nha.':'Hà here, hello! Need an itinerary or directions? Just ask me.',
'Yo! Kiệt đây. Muốn có ảnh check-in đẹp thì đi với Kiệt!':"Yo! Kiệt here. Want great photos? Come with me!",
'Chào bạn, Phương đây. Cùng khám phá kiến trúc và văn hóa thành phố nhé!':"Hi, Phương here. Let's explore the city's architecture and culture together!",
/* categories / kinds */
'Văn hóa – Lịch sử':'Culture – History','Ẩm thực':'Food','Vui chơi – Giải trí':'Fun – Entertainment','Thiên nhiên – Thư giãn':'Nature – Relaxing','Kiến trúc – Check-in':'Architecture – Photo spots',
'Di tích – Văn hóa':'Heritage – Culture','Quà lưu niệm':'Souvenirs','Quà lưu niệm – Đặc sản':'Souvenirs – Specialties','Thời trang':'Fashion',
'Miễn phí':'Free','Dưới 50.000đ':'Under 50,000đ','50.000 – 150.000đ':'50,000 – 150,000đ','Trên 150.000đ':'Over 150,000đ','Chưa xác minh':'Not verified',
'🏛️ Văn hóa':'🏛️ Culture','🍜 Ẩm thực':'🍜 Food','🎡 Vui chơi':'🎡 Fun','🌳 Thiên nhiên':'🌳 Nature','🛍️ Mua sắm':'🛍️ Shopping','📸 Kiến trúc':'📸 Architecture',
/* home */
'Xin chào,':'Hello,','Hôm nay':'Today','sẽ đồng hành cùng bạn.':'will be your guide.','Mở bản đồ':'Open map','địa điểm đã khám phá':'places explored','điểm tích lũy':'points','huy hiệu':'badges','điểm trong lịch trình':'stops in itinerary',
'Gợi ý dành riêng cho bạn':'Picked for you','Dựa trên phong cách:':'Based on your style:','Làm bài phân tích phong cách để nhận gợi ý chính xác hơn.':'Take the style analysis for better suggestions.',
'Con đường kể chuyện hôm nay':"Today's street story",'Xem trên bản đồ':'Show on map','Nghe thuyết minh':'Listen to the story','🔊 Nghe thuyết minh':'🔊 Listen to the story',
'Tìm địa điểm, giá vé, giờ mở cửa':'Find places, prices, opening hours','Sắp xếp điểm đến theo thứ tự':'Put your stops in order','Dấu mộc & huy hiệu':'Stamps & badges','Phong cách du lịch':'Travel style','Xem kết quả phân tích':'See your analysis',
/* drawer */
'Địa chỉ':'Address','Giờ hoạt động':'Opening hours','Giá vé / chi phí':'Tickets / cost','Món đặc biệt':'Signature dishes','Sản phẩm':'Products','Điểm nổi bật':'Highlights','Điện thoại':'Phone','Thời gian tham quan gợi ý':'Suggested visit time',
'Chưa xác minh – nên kiểm tra trước khi đến':'Not verified – check before you go','Thêm vào lịch trình':'Add to itinerary','Đã có trong lịch trình':'Already in itinerary','Tôi đã ghé thăm':"I've been here",'Đã ghé thăm ✓':'Visited ✓','Thuyết minh':'Audio story',
'Chỉ đường (Google Maps)':'Directions (Google Maps)','Xem trên Google Maps':'View on Google Maps','Nguồn & cập nhật':'Sources & updates','Khảo sát của nhóm + Google Maps':'Team survey + Google Maps','Khảo sát của nhóm':'Team survey','Nguồn tham khảo':'Reference',
'Vị trí gần đúng':'Approximate location','Vị trí đã đối chiếu':'Location checked','Michelin Guide':'Michelin Guide','Đang trùng tu':'Under restoration','Đã ghé':'Visited',
' · tọa độ gần đúng theo tên đường, cần xác minh tại chỗ':' · approximate position based on the street, please check on site',
/* map */
'Khu trung tâm: Sài Gòn, Tân Định, Bến Thành, Cầu Ông Lãnh, Xuân Hòa, Nhiêu Lộc, Bàn Cờ':'City centre: Sài Gòn, Tân Định, Bến Thành, Cầu Ông Lãnh, Xuân Hòa, Nhiêu Lộc and Bàn Cờ wards',
'Tìm tên đường, địa danh, món ăn…':'Search streets, landmarks, dishes…','Loại hình':'Category','Ngân sách':'Budget','Tất cả':'All','✨ Chỉ hiện gợi ý theo phong cách của tôi':'✨ Only show picks for my style','Địa điểm':'Places',
'Vị trí của tôi':'My location','Về vị trí của tôi':'Go to my location','Không có địa điểm phù hợp bộ lọc':'No places match the filters','Đang tìm thêm trên OpenStreetMap…':'Searching OpenStreetMap…','Không kết nối được OpenStreetMap':'Could not reach OpenStreetMap',
'Dữ liệu OpenStreetMap – chưa có trong kho Personavel':'OpenStreetMap data – not yet in the Personavel database','Nguồn: tư liệu nhóm Personavel tổng hợp · cần đối chiếu sử liệu':'Source: compiled by the Personavel team · to be checked against historical records',
'Bạn đang ở đây':'You are here','ĐIỂM ĐẾN CỦA BẠN':'YOUR DESTINATION',
'Không tải được nền bản đồ. Hãy kiểm tra kết nối Internet, hoặc mở trang qua một địa chỉ web (http/https) thay vì mở file trực tiếp. Các ghim địa điểm vẫn dùng được.':'The base map could not load. Check your Internet connection, or open the page from a web address (http/https) instead of a local file. The place pins still work.',
/* trip */
'Điểm':'Stops','vàng cam':'orange','do AI đề xuất · điểm':'are suggested by AI · stops in','tím':'purple','do bạn tự thêm':'are added by you',
'Lịch trình đang trống.':'Your itinerary is empty.','Hãy nhờ chatbot gợi ý hoặc thêm địa điểm từ bản đồ.':'Ask the chatbot for ideas or add places from the map.','Thêm từ bản đồ':'Add from map','Lưu vào nhật ký':'Save to diary','Xóa lịch trình':'Clear itinerary',
'Bạn tự thêm':'Added by you','AI đề xuất':'AI suggestion','Có thể ngoài giờ mở cửa':'May be outside opening hours',
'Đường nối thể hiện thứ tự tham quan (đường chim bay). Bấm "Chỉ đường" ở từng điểm để xem tuyến thực tế.':'Lines show the visiting order (straight-line). Tap "Directions" on each stop for the real route.',
'Lưu vào Nhật ký hành trình':'Save to travel diary','Tên hành trình':'Trip name','Ngày đi':'Date','Cảm nhận của bạn':'Your thoughts','Điều bạn nhớ nhất trong chuyến đi…':'What you remember most about the trip…','Ảnh bìa (tùy chọn)':'Cover photo (optional)',
'Hành trình của tôi':'My trip','Hành trình gợi ý':'Suggested trip','Một ngày khám phá Sài Gòn':'A day exploring Saigon','Sài Gòn về đêm':'Saigon by night',
'Lịch trình đang trống – hãy nhờ chatbot gợi ý nhé':'Your itinerary is empty – ask the chatbot for ideas','Đã thêm vào lịch trình':'Added to itinerary','Đã lưu lịch trình':'Itinerary saved',
/* collection */
'Mỗi nơi bạn ghé thăm là một dấu mộc điện tử. Hoàn thành chủ đề để mở khóa huy hiệu.':'Every place you visit gives you a digital stamp. Complete themes to unlock badges.','Tiến độ khám phá':'Exploration progress','Huy hiệu':'Badges','Dấu mộc đã nhận':'Stamps collected','Dấu mộc đang chờ bạn':'Stamps waiting for you',
'Chưa có dấu mộc. Khi đến một địa điểm, mở thông tin và bấm “Tôi đã ghé thăm”.':"No stamps yet. When you visit a place, open its details and tap “I've been here”.",
'Nhà sử học nhí':'Young historian','Ghé 5 địa điểm lịch sử – văn hóa':'Visit 5 historic – cultural places','Thực khách Sài Gòn':'Saigon diner','Thưởng thức 5 quán ăn':'Eat at 5 places','Thợ săn Michelin':'Michelin hunter','Ghé 2 quán được Michelin Guide giới thiệu':'Visit 2 Michelin Guide places',
'Tín đồ quà lưu niệm':'Souvenir lover','Ghé 3 cửa hàng quà – đặc sản':'Visit 3 souvenir – specialty shops','Ghé 4 điểm kiến trúc – check-in':'Visit 4 architecture – photo spots','Lãng du tên đường':'Street wanderer','Khám phá câu chuyện của 8 tên đường':'Discover the stories of 8 streets',
'Người giữ kỷ niệm':'Memory keeper','Lưu 1 nhật ký hành trình':'Save 1 travel diary','Người lắng nghe':'Good listener','Nghe 3 bài thuyết minh':'Listen to 3 audio stories',
/* profile */
'Personavel ghi nhớ bạn là ai, bạn đã khám phá những gì và phong cách du lịch của bạn thay đổi ra sao.':'Personavel remembers who you are, what you have explored and how your travel style changes.',
'Chỉnh sửa':'Edit','Cài đặt':'Settings','địa điểm':'places','điểm':'points','Phân tích phong cách du lịch':'Travel style analysis','Bạn chưa làm bài phân tích phong cách du lịch.':"You haven't taken the travel style analysis yet.",'Làm lại bài phân tích':'Retake the analysis','Làm bài phân tích':'Take the analysis',
'Nhật ký hành trình':'Travel diary','+ Từ lịch trình':'+ From itinerary','Chưa có nhật ký. Hoàn thành một lịch trình rồi bấm “Lưu vào nhật ký”.':'No diary yet. Finish an itinerary and tap “Save to diary”.','Gợi ý từ Personavel':'Suggestions from Personavel',
'Dựa trên sở thích của bạn, mình nghĩ bạn sẽ thích:':'Based on what you like, I think you will enjoy:','Đã xem gần đây':'Recently viewed','Chưa có':'Nothing yet','Chỉnh sửa hồ sơ':'Edit profile','Tên hiển thị':'Display name','Ảnh đại diện':'Profile photo',
'Đã hơn 30 ngày từ lần phân tích trước. Sở thích của bạn có thay đổi không?':"It's been over 30 days since your last analysis. Have your interests changed?",'Cập nhật ngay':'Update now','Đã cập nhật phong cách du lịch':'Travel style updated',
'Giảm hiệu ứng chuyển động':'Reduce motion','Chatbot AI (Claude)':'AI chatbot (Claude)','Model':'Model','Dữ liệu':'Data','Đã lưu cài đặt':'Settings saved','Ngôn ngữ':'Language',
'Không có khóa, chatbot vẫn trả lời bằng kho dữ liệu Personavel ngay trên máy. Có khóa Anthropic API, chatbot sẽ hiểu câu hỏi tự nhiên hơn. Khóa chỉ lưu trong trình duyệt này –':'Without a key, the chatbot still answers from the Personavel database on this device. With an Anthropic API key it understands natural questions better. The key is stored only in this browser –',
'không dùng cách này khi đưa web lên mạng công khai':'do not use this when the site is published online',', vì người khác có thể xem được khóa.':', because others could see the key.',
'Xóa dữ liệu của tài khoản đang dùng (tài khoản đã đăng xuất vẫn được giữ)':'Delete data of the current account (logged-out accounts are kept)',
'Đăng xuất khỏi Personavel?':'Log out of Personavel?','Sau khi đăng xuất, website quay về màn hình chào để':'After logging out, the site returns to the welcome screen so a','người dùng mới':'new user','bắt đầu từ đầu: nhập tên, làm bài phân tích phong cách và xem hướng dẫn sử dụng.':'can start from scratch: enter a name, take the style analysis and see the tour.',
'💾 Dữ liệu của':'💾 The data of',
/* about */
'Nền tảng bản đồ du lịch tự túc, tích hợp hướng dẫn tham quan, thuyết minh và gợi ý lịch trình cá nhân hóa tại TP.HCM.':'A self-guided travel map platform with sightseeing guidance, audio stories and personalised itineraries in Ho Chi Minh City.',
'“Không có hành trình nào hoàn hảo, chỉ có hành trình phù hợp với mỗi người.” —':'“There is no perfect journey, only the journey that suits each person.” —',
'Thay vì tìm thông tin từ nhiều nguồn riêng lẻ, du khách làm một bài trắc nghiệm ngắn để Personavel hiểu sở thích, ngân sách và phong cách du lịch. Từ đó, hệ thống đề xuất địa điểm phù hợp, hiển thị trên bản đồ số và để chatbot hướng dẫn viên xây dựng lịch trình, thuyết minh về các địa danh và những con đường mang ý nghĩa văn hóa.':'Instead of searching many separate sources, travellers take a short quiz so Personavel understands their interests, budget and travel style. The system then suggests suitable places on a digital map, while the guide chatbot builds itineraries and tells the stories of landmarks and culturally meaningful streets.',
'Mục tiêu':'Goals','Nâng cao trải nghiệm du lịch tự túc.':'Improve the self-guided travel experience.','Góp phần quảng bá hình ảnh TP.HCM.':'Help promote the image of Ho Chi Minh City.','Thúc đẩy chất lượng dịch vụ địa phương.':'Encourage better local services.','Xây dựng nền tảng tiện ích cho cả người dân thành phố.':'Build a useful platform for city residents too.',
'Nhóm thực hiện – Lớp 11A13, THPT Lê Quý Đôn':'Project team – Class 11A13, Lê Quý Đôn High School','Giáo viên hướng dẫn:':'Supervising teacher:','Cô Nguyễn Thị Kim Thoa':'Ms Nguyễn Thị Kim Thoa','Nguồn dữ liệu':'Data sources',
'Bản đồ: © Esri, © OpenStreetMap contributors. Thông tin địa điểm: khảo sát của nhóm, website chính thức của các địa điểm, Wikipedia, Michelin Guide và Google Maps. Ảnh nền Trang chủ: Wikimedia Commons (giấy phép CC BY, CC BY-SA, CC0 – ghi tên tác giả trên từng ảnh). Giá vé, giờ mở cửa có thể thay đổi – vui lòng kiểm tra trước khi đến. Các địa điểm có nhãn':'Maps: © Esri, © OpenStreetMap contributors. Place information: team survey, official websites, Wikipedia, Michelin Guide and Google Maps. Home page photos: Wikimedia Commons (CC BY, CC BY-SA, CC0 – author credited on each photo). Prices and opening hours may change – please check before you go. Places labelled',
'cần được xác minh thêm.':'still need to be verified.','Xem lại màn hình chào':'Replay welcome screen','Xem hướng dẫn sử dụng':'Show the tour',
/* tour */
'Tìm địa điểm, xem thông tin, hình ảnh, giá vé, giờ hoạt động và câu chuyện lịch sử của từng nơi, từng con đường.':'Find places and see details, prices, opening hours and the history of each place and street.',
'Chọn địa điểm, thêm vào lịch trình và sắp xếp chuyến đi. Điểm đến hiện trực tiếp trên bản đồ.':'Pick places, add them to your itinerary and arrange your trip. Stops appear right on the map.',
'Nơi lưu giữ dấu mộc của những địa điểm bạn đã khám phá và các huy hiệu thú vị.':'Where the stamps of places you have explored and fun badges are kept.',
'Xem thông tin, điểm tích lũy, nhật ký hành trình và kết quả phân tích phong cách du lịch.':'See your info, points, travel diary and travel style analysis.',
'Đặt câu hỏi, nhờ gợi ý địa điểm và xây dựng lịch trình cùng hướng dẫn viên robot.':'Ask questions, get place ideas and build itineraries with the robot guides.',
/* chat */
'Năm hướng dẫn viên robot luân phiên mỗi ngày – bạn cũng có thể tự chọn người đồng hành.':'Five robot guides take turns each day – you can also pick your own companion.','Cuộc trò chuyện mới':'New conversation',
'🟢 Đang dùng Claude AI':'🟢 Using Claude AI','⚪ Chế độ trả lời theo kho dữ liệu. Thêm khóa Claude trong':'⚪ Answering from the database. Add a Claude key in','để trò chuyện tự nhiên hơn.':'for more natural chat.',
'🗺️ Lên lịch trình 1 ngày':'🗺️ Plan a 1-day trip','🍜 Gợi ý quán ăn ngon gần đây':'🍜 Good food near me','🏛️ Kể chuyện về Dinh Độc Lập':'🏛️ Tell me about Independence Palace','🛣️ Đường Nguyễn Huệ có ý nghĩa gì?':'🛣️ What does Nguyễn Huệ Street mean?','🌙 Đi chơi buổi tối ở đâu?':'🌙 Where to go in the evening?','🎁 Mua quà lưu niệm ở đâu?':'🎁 Where to buy souvenirs?',
'📚 Nguồn tham khảo:':'📚 Sources:','Lưu lịch trình':'Save itinerary','Điều chỉnh lịch trình':'Adjust itinerary','Tư liệu tên đường – nhóm Personavel tổng hợp':'Street notes – compiled by the Personavel team','Wikipedia & website các địa điểm':'Wikipedia & official websites',
'Không có khóa': 'No key',
'☰ Hiện bộ lọc':'☰ Show filters','⟨ Ẩn bộ lọc':'⟨ Hide filters',
'Khác (tự ghi)':'Other (write your own)','Ghi rõ lưu ý về món ăn của bạn…':'Describe your dietary needs…','Ví dụ: 9h – 15h, hoặc chỉ cuối tuần…':'e.g. 9am – 3pm, or weekends only…','Ô tô':'Car','Xe buýt':'Bus','Metro':'Metro',
'Hình ảnh du lịch đặc sắc tại TP. Hồ Chí Minh':'Highlights of Ho Chi Minh City','Bấm vào ảnh để xem lớn':'Tap a photo to enlarge','Chào':'Hi',
'! Trước khi bắt đầu, cùng ngắm một vài hình ảnh du lịch đặc sắc tại TP. Hồ Chí Minh nhé.':"! Before we start, let's look at some of Ho Chi Minh City's highlights.",
'Mình là':'I am','– hướng dẫn viên của bạn hôm nay.':'– your guide today.','Phong cách của bạn:':'Your style:','Mình gợi ý bạn bắt đầu với:':'I suggest you start with:','Bạn muốn mình giúp gì trước?':'What would you like to do first?',
'🗺️ Lên lịch trình cho mình':'🗺️ Plan a trip for me','🧭 Hướng dẫn sử dụng':'🧭 How to use','📍 Mở bản đồ':'📍 Open map','💬 Trò chuyện':'💬 Chat','Phóng to ảnh':'Enlarge photo','Ảnh trước':'Previous photo','Ảnh sau':'Next photo',

"Trung tâm thương mại cao cấp với hàng trăm thương hiệu, nằm giữa các con đường lớn Pasteur, Lê Thánh Tôn.":"An upscale shopping centre with hundreds of brands, set between the main streets Pasteur and Lê Thánh Tôn.",
"Thiên đường local brand Việt Nam theo phong cách streetwear, Y2K.":"A paradise of Vietnamese local brands in streetwear and Y2K style.",
"Hai dãy phố toàn cửa hàng thời trang: đồ si, local brand nhỏ và lớn, giá hợp lý.":"Two rows of fashion shops: second-hand, small and big local brands at fair prices.",
"Cung đường thời trang Trần Quang Diệu – Trần Huy Liệu":"Trần Quang Diệu – Trần Huy Liệu fashion street",
"Áo quần: Uniqlo, Polo Ralph Lauren":"Clothing: Uniqlo, Polo Ralph Lauren",
"Giày: Adidas, Onitsuka Tiger, New Balance":"Shoes: Adidas, Onitsuka Tiger, New Balance",
"Quà thủ công Việt Nam.":"Vietnamese handmade gifts.",
"Quà lưu niệm thiết kế độc đáo.":"Uniquely designed souvenirs.",
"Quà tặng cao cấp, thiết kế Việt Nam.":"Premium gifts with Vietnamese design.",
"Đồ thủ công và quà thân thiện môi trường.":"Handicrafts and eco-friendly gifts.",
"Quà lưu niệm và lifestyle.":"Souvenirs and lifestyle goods.",
"Quà nghệ thuật, sách và đồ lưu niệm.":"Art gifts, books and souvenirs.",
"Chợ truyền thống – nhiều loại quà.":"Traditional market – all kinds of gifts.",
"Đặc sản Việt Nam đóng gói làm quà.":"Packaged Vietnamese specialties for gifts.",
"Bánh pía và đặc sản miền Tây.":"Bánh pía and Mekong Delta specialties.",
"Hạt dinh dưỡng, trái cây sấy và chocolate.":"Nuts, dried fruit and chocolate.",
"Đặc sản Đà Lạt.":"Đà Lạt specialties.",
"Bánh kẹo và quà ăn vặt.":"Sweets and snack gifts.",
"Đặc sản đóng hộp, quà tặng tiện lợi.":"Boxed specialties, easy gifts.",
"Chocolate Việt Nam.":"Vietnamese chocolate.",
"bạn":"there",
"Lịch trình đang trống.":"Your itinerary is empty."
};
const PH = [ // phrase replacements for data lines (hours, prices)
 ['Thứ Hai','Mon'],['Thứ Ba','Tue'],['Thứ Tư','Wed'],['Thứ Năm','Thu'],['Thứ Sáu','Fri'],['Thứ Bảy','Sat'],['thứ Hai','Mon'],['thứ Ba','Tue'],['thứ Bảy','Sat'],['thứ Sáu','Fri'],['Chủ Nhật','Sun'],['Chủ nhật','Sun'],['Chúa Nhật','Sun'],
 ['hằng ngày','daily'],['mỗi ngày','daily'],['tất cả các ngày trong tuần','every day'],['tất cả các ngày','every day'],['ngày lễ','holidays'],['Khoảng','About'],['khoảng','about'],['từ','from'],['đến','to'],['theo dữ liệu địa điểm','(map data)'],['theo thông tin Google Maps','(Google Maps)'],
 ['Chưa xác minh được','Not yet verified:'],['menu cập nhật','an updated menu'],['giá hiện tại','current price'],['khung giờ cố định','fixed hours'],['giờ chính xác','exact hours'],['tham khảo','reference'],['Giá dao động:','Price range:'],['/người','/person'],['/tô','/bowl'],['/phần','/portion'],['/món','/dish'],['nghỉ','closed'],['Trưa','Lunch'],['Chiều – tối','Afternoon – evening'],['VNĐ','VND'],['đồng','VND'],[' và ',' and '],['tùy món','depending on the dish'],['tùy loại bánh','depending on the type'],['Miễn phí','Free'],['giá cụ thể','exact price'],['thuộc phân khúc cao cấp','high-end'],['phân khúc cao cấp','high-end']
];
const STREETSET = new Set(PV.D.streets.map(s=>s.name));
const PAT = [
 [/^Câu (\d+)\/(\d+)$/, 'Question $1/$2'],
 [/^Xin chào (.+)!$/, 'Hello $1!'],
 [/^📚 Nguồn tham khảo: (.+)$/, (m,a)=>'📚 Sources: '+tr1(a)],
 [/^\((\d+) phút · đi (\d+) phút\)$/, '($1 min · $2 min travel)'],[/^\((\d+) phút\)$/, '($1 min)'],
 [/^khoảng (\d+) phút$/, 'about $1 minutes'],[/^(\d+) phút$/, '$1 min'],
 [/^(\d+) địa điểm$/, '$1 places'],[/^(\d+) địa điểm đã ghé$/, '$1 places visited'],[/^(\d+) điểm$/, '$1 points'],[/^(\d+) nhật ký$/, '$1 diaries'],[/^lịch trình (\d+) điểm$/, '$1-stop itinerary'],[/^(\d+) địa điểm$/, '$1 places'],
 [/^(\d+)\/(\d+) địa điểm$/, '$1/$2 places'],[/^\+(\d+) điểm$/, '+$1 points'],
 [/^Tham gia (.+)$/, 'Joined $1'],[/^Bắt đầu (\d\d:\d\d)$/, 'Start $1'],[/^~(.+)\/người$/, '~$1/person'],[/^Tổng quãng đường ~(.+)$/, 'Total distance ~$1'],[/^chi phí ước tính ~(.+)\/người$/, 'estimated cost ~$1/person'],[/^cập nhật (.+)$/, 'updated $1'],
 [/^Hướng dẫn viên (\S+)$/, 'Guide $1'],[/^Hỏi (\S+) bất cứ điều gì về Sài Gòn…$/, 'Ask $1 anything about Saigon…'],[/^Lên lịch trình với (\S+)$/, 'Plan a trip with $1'],[/^✨ Để (\S+) gợi ý lịch trình$/, '✨ Let $1 suggest a trip'],
 [/^Câu chuyện tên đường$/, 'Street story'],[/^Phường (.+)$/, '$1 Ward'],[/^Quận (\d) \(cũ\)$/, 'former District $1'],
 [/^Nhận dấu mộc mới$/, 'New stamp collected'],[/^Khám phá câu chuyện tên đường$/, 'Street story discovered'],[/^Lưu nhật ký hành trình$/, 'Travel diary saved'],
 [/^🏅 Mở khóa huy hiệu: (.+)$/, (m,a)=>'🏅 Badge unlocked: '+tr1(a)],
 [/^Đã đăng xuất – dữ liệu của (.+) được lưu trên máy này$/, 'Logged out – $1\'s data is saved on this device'],[/^Chào mừng (.+) quay lại!$/, 'Welcome back, $1!'],
 [/^\(hồ sơ, lịch trình, dấu mộc, nhật ký\) được giữ lại trên máy này\. Lần sau chỉ cần chọn tên “(.+)” ở màn hình chào để tiếp tục hành trình\.$/, '(profile, itinerary, stamps, diary) is kept on this device. Next time just pick “$1” on the welcome screen to continue.'],
 [/^lưu lúc (.+)$/, 'saved $1'],
 [/^(.+) \(đã điều chỉnh\)$/, (m,a)=>tr1(a)+' (adjusted)'],
 [/^Đường (.+)$/, (m,a)=> STREETSET.has(a) ? a+' Street' : m],
 [/^↓ (.+?) ~(\d+) phút$/, (m,a,b)=>'↓ '+tr1(a)+' ~'+b+' min'],
 [/^(\d{1,2}:\d\d) – (\d{1,2}:\d\d)$/, '$1 – $2'],
 [/^Máy chưa có giọng tiếng Việt – sẽ đọc bằng giọng mặc định$/, 'No Vietnamese voice on this device – using the default voice'],
 [/^Trình duyệt chưa hỗ trợ đọc thuyết minh$/, 'This browser cannot read audio stories'],
 [/^Đang xin quyền vị trí…$/, 'Asking for location permission…'],[/^Bạn chưa cấp quyền vị trí – vẫn có thể tìm địa điểm thủ công$/, 'Location not allowed – you can still search manually'],[/^Thiết bị không hỗ trợ định vị$/, 'This device does not support location'],
 [/^Đã đăng xuất – (.+)$/, 'Logged out – $1'],
 [/^Quán nổi bật với (.+)\.$/, 'Known for $1.'],[/^Quán ăn được nhóm Personavel khảo sát\.$/, 'Eatery surveyed by the Personavel team.'],[/^Cửa hàng quà tặng\.$/, 'Gift shop.'],
 [/^Không tải được thư viện bản đồ\. Hãy kiểm tra kết nối Internet\.$/, 'The map library could not load. Check your Internet connection.'],
];
function seg(s){ // translate " · " separated pieces and emoji-prefixed pieces
  if (s.includes(' · ')){ const parts = s.split(' · '); const t = parts.map(tr1); if (t.some((x,i)=>x!==parts[i])) return t.join(' · '); }
  const m = s.match(/^(\p{Extended_Pictographic}\uFE0F?\s+)(.+)$/u); if (m){ const r = tr1(m[2]); if (r!==m[2]) return m[1]+r; }
  return null;
}
function phrase(s){ if (!/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i.test(s) || !(/\d/.test(s) || /^Chưa xác minh/.test(s))) return s; let r=s; for (const [a,b] of PH) r=r.split(a).join(b); return r; }
function tr1(core){
  if (core in EN) return EN[core];
  if (core.includes(' · ')){ const s0 = seg(core); if (s0!=null) return s0; }
  for (const [re,rep] of PAT){ if (re.test(core)) { const r = core.replace(re, rep); if (r!==core) return r; } }
  const s = seg(core); if (s!=null) return s;
  return core;
}
PV.tr = (s) => { if (PV.lang!=='en' || s==null) return s; const core = String(s).replace(/\s+/g,' ').trim(); if (!core) return s; let r = tr1(core); return r; };
PV.L = (vi, en) => PV.lang==='en' ? en : vi;
const DATAKEYS = new WeakSet();
// add data translations
PV.D.places.forEach(p => { if (p.name_en){ EN[p.name]=p.name_en; } if (p.desc_en) EN[p.desc]=p.desc_en;
  ['hours','price','highlights'].forEach(k => (p[k+'_en']||[]).forEach((v,i)=>{ if (p[k][i]) EN[p[k][i]]=v; })); if (p.warning) EN[p.warning]='Under restoration'; });
PV.D.streets.forEach(s => { if (s.story_en) EN[s.story]=s.story_en; });
(window.PV_GALLERY||[]).forEach(g => { EN[g.cap]=g.cap_en; });
PV.EN = EN;
PV.AREAS.forEach(a => { EN['Phường '+a.name+' – '+a.hint] = a.name+' ward – '+a.hint_en; EN['Xuất phát: Phường '+a.name] = 'Start: '+a.name+' ward'; });

/* DOM translation with restore */
function trNode(n){
  const v = n.nodeValue; if (!v || !/\S/.test(v)) return;
  if (n.__en === v) return; // already translated by us
  const core = v.replace(/\s+/g,' ').trim();
  let r = tr1(core); if (r===core) r = phrase(core);
  if (r===core) return;
  n.__vi = v; const lead = v.match(/^\s*/)[0], tail = v.match(/\s*$/)[0];
  n.__en = lead + r + tail; n.nodeValue = n.__en;
}
const ATTRS = ['placeholder','title','aria-label'];
function trEl(el){ ATTRS.forEach(a => { const v = el.getAttribute && el.getAttribute(a); if (!v) return; el.__via = el.__via || {}; if (el.__via[a+'_en']===v) return; const r = tr1(v.trim()); if (r!==v.trim()){ el.__via[a]=v; el.__via[a+'_en']=r; el.setAttribute(a, r); } }); }
function walk(root){
  if (root.nodeType===3){ trNode(root); return; }
  if (root.nodeType!==1 || root.closest && root.closest('script,style')) return;
  trEl(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let n; while (n = w.nextNode()){ if (n.nodeType===3){ const p=n.parentElement; if (p && !p.closest('script,style,.notr')) trNode(n); } else trEl(n); }
}
function restore(){
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
  let n; while (n = w.nextNode()){ if (n.nodeType===3){ if (n.__vi!=null && n.nodeValue===n.__en){ n.nodeValue = n.__vi; } n.__vi = n.__en = undefined; }
    else if (n.__via){ ATTRS.forEach(a => { if (n.__via[a]!=null) n.setAttribute(a, n.__via[a]); }); n.__via = null; } }
}
let obs = null;
function startObs(){ if (obs) return; obs = new MutationObserver(ms => { if (PV.lang!=='en') return; for (const m of ms){ if (m.type==='childList') m.addedNodes.forEach(walk); else if (m.type==='characterData') trNode(m.target); else if (m.type==='attributes') trEl(m.target); } });
  obs.observe(document.body, {childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS}); }
PV.lang = (PV.state.settings && PV.state.settings.lang) || 'vi';
PV.setLang = (l) => {
  PV.lang = l; PV.state.settings.lang = l; PV.save('settings');
  document.documentElement.lang = l; document.title = l==='en' ? 'Personavel – Self-guided travel map of Ho Chi Minh City' : 'Personavel – Bản đồ du lịch tự túc TP.HCM';
  if (l==='en') walk(document.body); else restore();
  document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('on', b.dataset.lang===l));
  if (window.speechSynthesis) speechSynthesis.cancel();
};
PV.langSwitch = (cls='') => `<div class="langsw notr ${cls}" role="group" aria-label="Language"><button type="button" data-lang="vi" class="${PV.lang==='vi'?'on':''}">🇻🇳 Tiếng Việt</button><button type="button" data-lang="en" class="${PV.lang==='en'?'on':''}">🇬🇧 English</button></div>`;
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-lang]'); if (b){ e.stopPropagation(); e.preventDefault(); if (b.dataset.lang!==PV.lang){ PV.setLang(b.dataset.lang); if (!document.getElementById('welcome')) PV.route(); } } }, true);
PV.i18nInit = () => { startObs(); document.documentElement.lang = PV.lang; if (PV.lang==='en') PV.setLang('en'); };
})();
