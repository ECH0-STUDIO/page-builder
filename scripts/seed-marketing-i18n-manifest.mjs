#!/usr/bin/env node
/** Seeds marketing-i18n-manifest.json with full Eatery VN → EN pairs. */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { fillNullTranslations } from './marketing-i18n-normalize.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '../apps/web/src/lib/marketing-i18n-manifest.json')

/** @type {[string, string][]} */
const PAIRS = [
  // ═══ Homepage hero ═══
  ['Dành cho các cửa hàng vừa và nhỏ', 'For small & medium stores'],
  ['DÀNH CHO CÁC CỬA HÀNG VỪA VÀ NHỎ', 'FOR SMALL & MEDIUM STORES'],
  ['Nâng tầm cửa hàng của bạn', 'Elevate your store'],
  ['Nâng tầm cửa hàng của bạn.', 'Elevate your store.'],
  [
    'Nhanh chóng tạo Menu, QR thanh toán, tạo website và nhận order chỉ trong vài bước đơn giản. Không chi phí hàng tháng.',
    'Quickly create your menu, payment QR codes, and website — start taking orders in a few simple steps. No monthly fees.',
  ],
  [
    'Nhanh chóng tạo menu, QR thanh toán, website và nhận đơn chỉ trong vài bước đơn giản. Không chi phí hàng tháng.',
    'Quickly create your menu, payment QR codes, and website — start taking orders in a few simple steps. No monthly fees.',
  ],
  ['Bắt đầu ngay', 'Get started now'],
  ['BẮT ĐẦU NGAY', 'GET STARTED NOW'],
  ['Bắt đầu miễn phí ngay', 'Start free now'],
  ['Bắt đầu miễn phí', 'Start for free'],
  ['BẮT ĐẦU MIỄN PHÍ', 'START FOR FREE'],
  ['Dùng thử miễn phí', 'Try for free'],
  ['Xem demo', 'View demo'],
  ['Tìm hiểu thêm', 'Learn more'],
  ['Được tin dùng bởi<br>quán ăn & cafe', 'Trusted by<br>restaurants & cafes'],
  ['Được tin dùng bởi<br>quán ăn &amp; cafe', 'Trusted by<br>restaurants & cafes'],
  ['Được tin dùng bởi quán ăn & cafe', 'Trusted by restaurants & cafes'],
  ['Được tin dùng bởi các quán ăn & cafe', 'Trusted by restaurants & cafes'],
  ['Được tin dùng bởi các cửa hàng F&B', 'Trusted by food & beverage businesses'],

  // ═══ Nav ═══
  ['Tại sao Eatery', 'Why Eatery'],
  ['Vì sao Eatery', 'Why Eatery'],
  ['Tại sao chọn Eatery', 'Why choose Eatery'],
  ['Chi phí', 'Pricing'],
  ['CHI PHÍ', 'PRICING'],
  ['Tính năng', 'Features'],
  ['TÍNH NĂNG', 'FEATURES'],
  ['Bảng giá', 'Pricing'],
  ['BẢNG GIÁ', 'PRICING'],
  ['Tin tức', 'Blog'],
  ['TIN TỨC', 'BLOG'],
  ['Liên hệ', 'Contact'],
  ['LIÊN HỆ', 'CONTACT'],
  ['Đăng nhập', 'Sign in'],
  ['Đăng ký', 'Sign up'],
  ['Bắt đầu', 'Get started'],

  // ═══ Hero (credit / menu variant) ═══
  ['Trang số cho quán ăn', 'Restaurant page builder'],
  ['Thực đơn online. Không mắc kẹt gói tháng.', 'Your menu online. Without the monthly trap.'],
  [
    'Tạo trang thực đơn đẹp, mã QR bàn, và nhận thanh toán PayOS. Bắt đầu miễn phí — chỉ mua credit khi cần tên miền riêng hoặc dung lượng thêm.',
    'Build a beautiful digital menu, generate QR codes, and accept PayOS payments. Start free — buy credits only when you need a custom domain or extra storage.',
  ],
  ['Cách dùng credit', 'How credits work'],
  ['Trình tạo trang miễn phí · Trả theo nhu cầu', 'Free page builder · Pay-as-you-go credits'],

  // ═══ Impacts / why ═══
  ['Kết quả thật.\nKhông lãng phí gói tháng.', 'Real results.\nNo wasted subscription.'],
  ['Kết quả thật.<br>Không lãng phí gói tháng.', 'Real results.<br>No wasted subscription.'],
  [
    'Nhiều nền tảng thu phí hàng tháng dù quán đông hay vắng. Eatery cho bạn khởi động miễn phí và chỉ dùng credit cho tính năng premium khi thực sự cần.',
    'Most tools charge monthly whether your restaurant is busy or closed. Eatery lets you launch for free and spend credits only on premium add-ons you actually use.',
  ],
  ['Dành cho chủ quán ăn', 'Built for restaurant owners'],
  ['Dành cho chủ cửa hàng', 'Built for store owners'],
  [
    'Trình tạo trang, thực đơn, QR và xuất bản — không cần gói tháng.',
    'Page builder, menus, QR codes, and publishing — included without a monthly plan.',
  ],
  ['Để bắt đầu xây và xuất bản trang thực đơn', 'To start building and publishing your menu page'],
  [
    'Credit dùng cho tên miền riêng, dung lượng ảnh — trả khi cần, không mặc định hàng tháng.',
    'Credits are for add-ons: custom domains, extra gallery storage — spend when you need them, not every month by default.',
  ],
  ['Credit/tháng khi kết nối tên miền riêng', 'Credits/month while custom domain is connected'],
  ['Không chi phí hàng tháng', 'No monthly fees'],
  ['Không gói tháng', 'No monthly plans'],
  ['Không mắc kẹt gói tháng', 'No monthly trap'],
  ['Trả theo nhu cầu', 'Pay as you go'],
  ['Lợi ích', 'Benefits'],
  ['Tại sao chúng tôi', 'Why us'],

  // ═══ Features section ═══
  ['Mọi thứ quán bạn cần trên mạng.', 'Everything your restaurant needs online.'],
  ['Mọi thứ để vận hành quán trên mạng.', 'Everything to run your restaurant online.'],
  ['Mọi thứ cửa hàng bạn cần trên mạng.', 'Everything your store needs online.'],
  [
    'Một nền tảng cho trang thực đơn, dashboard, thanh toán và đội ngũ.',
    'One platform for your public menu page, dashboard, payments, and team.',
  ],
  [
    'Một nền tảng cho trang thực đơn, dashboard, thanh toán và đội ngũ — không cần ghép nhiều công cụ.',
    'One platform for your public menu page, dashboard, payments, and team — without stitching five tools together.',
  ],
  ['Trình tạo trang trực quan', 'Visual page builder'],
  ['Trình tạo trang kéo thả', 'Drag-and-drop page builder'],
  [
    'Hero, lưới món, gallery, liên hệ và thanh toán — kéo thả và xuất bản.',
    'Hero, menu grid, gallery, contact, and payment blocks — drag, drop, publish.',
  ],
  ['Mã QR thực đơn', 'QR menu codes'],
  ['Mã QR bàn', 'Table QR codes'],
  ['Tạo QR cho từng bàn — khách mở thực đơn trên điện thoại.', 'Generate table QR codes so guests open your live menu on their phone.'],
  ['Thanh toán PayOS', 'PayOS payments'],
  ['Giỏ hàng trên trang công khai, tối ưu cho Việt Nam.', 'Checkout drawer on your public page, built for Vietnam.'],
  ['Đội ngũ & tên miền riêng', 'Team & custom domains'],
  [
    'Mời nhân viên, kết nối tên miền thương hiệu với hướng dẫn DNS.',
    'Invite staff, connect your brand domain with guided DNS setup.',
  ],
  ['Xem tất cả tính năng', 'See all features'],
  ['Xem chi tiết', 'View details'],
  ['Xem bảng giá credit', 'See credit-based pricing'],
  ['Menu trực tuyến', 'Online menu'],
  ['Trang đích', 'Landing page'],
  ['Quản lý đơn hàng', 'Order management'],
  ['In thực đơn', 'Print menu'],
  ['Lưu trữ ảnh', 'Image storage'],
  ['Gallery ảnh', 'Photo gallery'],
  ['Thống kê truy cập', 'Traffic analytics'],
  ['Tùy chỉnh giao diện', 'Customize design'],
  ['Xuất bản một chạm', 'One-click publish'],
  ['Không cần code', 'No code required'],
  ['Không cần WordPress', 'No WordPress'],
  ['Không cần agency', 'No agency'],

  // ═══ How it works ═══
  ['Cách hoạt động', 'How it works'],
  ['Ra mắt chỉ với 3 bước.', 'Launch in 3 simple steps.'],
  ['Ra mắt trong 3 bước đơn giản.', 'Launch in 3 simple steps.'],
  ['Không cần agency. Không WordPress. Đăng ký và bắt đầu.', 'No agency. No WordPress. Just sign up and start building.'],
  ['Bước 1', 'Step 1'],
  ['Bước 2', 'Step 2'],
  ['Bước 3', 'Step 3'],
  ['Tạo tài khoản', 'Create your account'],
  ['Đăng ký miễn phí trên app và thêm quán hoặc cafe của bạn.', 'Sign up free on the app and add your restaurant or cafe.'],
  ['Đăng ký miễn phí và thêm cửa hàng của bạn.', 'Sign up free and add your store.'],
  ['Xây trang của bạn', 'Build your page'],
  ['Xây dựng trang của bạn', 'Build your page'],
  [
    'Thêm món, ảnh và khối liên hệ bằng trình chỉnh sửa trực quan.',
    'Add your menu, photos, and contact blocks with the visual editor.',
  ],
  ['Xuất bản & chia sẻ', 'Publish & share'],
  [
    'Đưa trang lên mạng với link, QR trên bàn hoặc tên miền riêng.',
    'Go live with a link, QR codes on every table, or your custom domain.',
  ],

  // ═══ Blog UI ═══
  ['Tin tức và cập nhật', 'News & updates'],
  [
    'Khám phá thông tin cập nhật, mẹo và thủ thuật để sử dụng Eatery một cách hiệu quả nhất.',
    'Explore updates, tips, and workflows to get the most out of Eatery for your business.',
  ],
  ['Mẹo đi số hóa', 'Tips for going digital'],
  ['Thực đơn, mã QR và giá credit cho quán hiện đại.', 'Menus, QR codes, and credit-based pricing for modern restaurants.'],
  ['Xem tất cả bài viết', 'View all posts'],
  ['Chia sẻ bài viết', 'Share article'],
  ['Quay lại tin tức', 'Back to blog'],
  ['← Quay lại tin tức', '← Back to blog'],
  ['Ngày đăng', 'Date'],
  ['Danh mục', 'Category'],
  ['Thời gian đọc', 'Reading time'],
  ['Bởi', 'By'],
  ['Đọc thêm', 'Read more'],
  ['Bài viết liên quan', 'Related posts'],
  ['Bài viết mới nhất', 'Latest posts'],

  // ═══ CTA / footer ═══
  ['Sẵn sàng đưa thực đơn lên mạng?', 'Ready to launch your menu online?'],
  ['Sẵn sàng nâng tầm cửa hàng?', 'Ready to elevate your store?'],
  [
    'Bắt đầu miễn phí trên app. Chỉ mua credit khi cần tính năng premium.',
    'Start free on the app. Buy credits only when you need premium features.',
  ],
  ['Tạo tài khoản miễn phí', 'Create free account'],
  ['Xem bảng giá', 'See pricing'],
  [
    'Xây trang thực đơn số, nhận thanh toán và kết nối tên miền — chỉ trả cho tính năng premium bằng credit.',
    'Build your digital menu page, accept payments, and connect your domain — pay only for premium add-ons with credits.',
  ],
  [
    'Xây trang số, nhận thanh toán và kết nối tên miền — chỉ trả cho tính năng premium bằng credit.',
    'Build your digital page, accept payments, and connect your domain — pay only for premium add-ons with credits.',
  ],
  ['Sản phẩm', 'Product'],
  ['Hỗ trợ', 'Support'],
  ['Công ty', 'Company'],
  ['Theo dõi chúng tôi', 'Follow us'],
  ['Liên hệ với chúng tôi', 'Contact us'],
  ['Bản quyền', 'Copyright'],
  ['© 2026 Eatery VN', '© 2026 Eatery'],
  ['eateryvn.com', 'eateryvn.com'],

  // ═══ Features page ═══
  ['Mọi thứ để vận hành cửa hàng trên mạng.', 'Everything to run your store online.'],
  ['Từ trang công khai đến dashboard, thanh toán và quản lý đội ngũ.', 'From your public page to dashboard, payments, and team management.'],
  ['Tính năng sản phẩm', 'Product'],
  ['Khám phá tính năng', 'Explore features'],
  ['Công cụ cho quán ăn', 'Tools for restaurants'],
  ['Công cụ cho cửa hàng F&B', 'Tools for F&B businesses'],

  // ═══ Pricing page ═══
  ['Giá theo credit', 'Credit-based pricing'],
  ['Giá linh hoạt theo credit', 'Flexible credit-based pricing'],
  ['Không gói cố định. Trả đúng những gì bạn dùng.', 'No packages. Pay only for what you use.'],
  [
    'Trình tạo trang, thực đơn QR và xuất bản miễn phí để bắt đầu. Credit dùng cho tính năng premium — mua khi cần.',
    'The page builder, QR menus, and publishing are free to start. Credits are for premium add-ons — buy them when you need them.',
  ],
  ['Xây và xuất bản trang thực đơn không cần đăng ký gói. Không cần thẻ tín dụng.', 'Build and publish your menu page without a subscription. No credit card required.'],
  ['Mua credit', 'Buy credits'],
  [
    'Nạp khi cần tên miền riêng hoặc dung lượng ảnh thêm. Credit chưa dùng vẫn trong ví.',
    'Top up when you want a custom domain or extra gallery storage. Unused credits stay in your balance.',
  ],
  ['Credit dùng để làm gì', 'What credits are for'],
  ['Credit là gì?', 'What are credits?'],
  ['Gói credit tùy chọn', 'Optional credit packs'],
  ['Số tiền nạp trong app — không phải gói bắt buộc.', 'Top-up amounts inside the app — not mandatory plans.'],
  ['Tên miền riêng', 'Custom domain'],
  ['Tên miền riêng kết nối', 'Custom domain connected'],
  ['50 credit / tháng', '50 credits / month'],
  ['Tính khi tên miền đang kết nối', 'Billed while your domain is live'],
  ['Lưu trữ gallery', 'Gallery storage'],
  ['1 credit / 20 MB', '1 credit per 20 MB'],
  ['Theo dung lượng — giảm khi xóa ảnh', 'Renews based on usage — drops if you delete images'],
  ['50.000₫', '50,000₫'],
  ['90.000₫', '90,000₫'],
  ['400.000₫', '400,000₫'],
  ['50,000₫', '50,000₫'],
  ['90,000₫', '90,000₫'],
  ['400,000₫', '400,000₫'],
  ['Thử tính năng premium', 'Try premium features'],
  ['Phù hợp hầu hết quán', 'Best value for most cafes'],
  ['Phù hợp hầu hết cửa hàng', 'Best value for most stores'],
  ['Mùa cao điểm hoặc nhiều add-on', 'Busy seasons or multiple add-ons'],
  ['Mùa cao điểm', 'Busy seasons'],
  ['Gói phổ biến', 'Popular plan'],
  ['Lựa chọn tốt nhất', 'Best value'],
  ['Miễn phí', 'Free'],
  ['0₫', '$0'],
  ['credit', 'credits'],
  ['Credit', 'Credits'],
  ['credits', 'credits'],
  ['tháng', 'month'],
  ['/ tháng', '/ month'],

  // ═══ Contact page ═══
  ['Chúng tôi có thể giúp gì?', 'How can we help?'],
  ['Nói chuyện với đội ngũ Eatery', 'Talk to the Eatery team'],
  [
    'Gửi tin nhắn — đội ngũ Eatery sẽ phản hồi qua email.',
    'Send a message — the Eatery team will reply by email.',
  ],
  [
    'Câu hỏi về thiết lập, credit hoặc hợp tác? Chúng tôi thường phản hồi trong 1–2 ngày làm việc.',
    'Questions about setup, credits, or partnerships? We typically reply within 1–2 business days.',
  ],
  ['Họ tên', 'Name'],
  ['Họ và tên', 'Full name'],
  ['Email', 'Email'],
  ['Số điện thoại', 'Phone number'],
  ['Nội dung', 'Message'],
  ['Tin nhắn', 'Message'],
  ['Tin nhắn của bạn', 'Your message'],
  ['Gửi tin nhắn', 'Send message'],
  ['Gửi yêu cầu', 'Send request'],
  ['Đang gửi…', 'Sending…'],
  ['Đang gửi...', 'Sending...'],
  ['Đã gửi! Chúng tôi sẽ liên hệ sớm.', 'Sent! We will get back to you soon.'],
  ['Đã gửi tin nhắn', 'Message sent'],
  ['Gửi lại', 'Send another'],
  ['Cảm ơn bạn đã liên hệ.', 'Thanks for reaching out.'],

  // ═══ App mockup / dashboard labels (hero image) ═══
  ['Tổng quan', 'Overview'],
  ['Chào mừng đến bảng điều khiển của bạn', 'Welcome to your dashboard'],
  ['Chào mừng đến bảng điều khiển', 'Welcome to the dashboard'],
  ['Chào mừng', 'Welcome'],
  ['Chủ nhật', 'Sunday'],
  ['Thứ hai', 'Monday'],
  ['Thứ ba', 'Tuesday'],
  ['Thứ tư', 'Wednesday'],
  ['Thứ năm', 'Thursday'],
  ['Thứ sáu', 'Friday'],
  ['Thứ bảy', 'Saturday'],
  ['Chay', 'Vegetarian'],
  ['Bữa sáng', 'Breakfast'],
  ['Bữa trưa', 'Lunch'],
  ['Bữa tối', 'Dinner'],
  ['7 ngày qua', 'Last 7 days'],
  ['30 ngày qua', 'Last 30 days'],
  ['Đơn hàng', 'Orders'],
  ['Doanh thu', 'Revenue'],
  ['Lượt xem', 'Views'],
  ['Khách hàng', 'Customers'],
  ['Thêm món', 'Add item'],
  ['Sửa món', 'Edit item'],
  ['Xóa', 'Delete'],
  ['Lưu', 'Save'],
  ['Hủy', 'Cancel'],

  // ═══ 404 / misc ═══
  ['Không tìm thấy trang', 'Page not found'],
  ['Quay về trang chủ', 'Back to home'],
  ['Trang chủ', 'Home'],
  ['Xem thêm', 'See more'],
  ['Khám phá', 'Explore'],
  ['Thử miễn phí', 'Try for free'],
  ['Phổ biến', 'Popular'],
  ['Mới', 'New'],
  ['Nổi bật', 'Featured'],
  ['Đối tác', 'Partners'],
  ['Khách hàng tin dùng', 'Trusted by customers'],

  // ═══ Eatery Marketing Website export (features / pricing / homepage) ═══
  [
    'Nếu cửa hàng của bạn chưa có website, bạn đang bỏ lỡ tới 50% khả năng tiếp cận khách hàng. Website cũng là công cụ giúp tăng uy tín của cửa hàng hiệu quả. Tuy nhiên website yêu cầu một chút về kỹ thuật và nếu tiếp cận không đúng, có thể khiến cửa hàng của bạn lãng phí một phần chi phí không đáng có.',
    'If your store does not have a website yet, you may be missing up to 50% of potential customer reach. A website also helps build credibility effectively. However, websites require some technical know-how — and if approached the wrong way, you can waste money that did not need to be spent.',
  ],
  [
    'Hầu hết các nền tảng và công cụ thu phí hàng tháng kể cả khi nhà hàng đã đóng hoặc tạm ngưng hoạt động. Eatery cho phép bạn bắt đầu hoàn toàn miễn phí và chỉ phải trả phí cho các tính năng mà bạn thực sự sử dụng thông qua hệ thống điểm tín dụng.',
    'Most platforms and tools charge monthly fees even when your restaurant is closed or temporarily shut down. Eatery lets you start completely free and pay only for the features you actually use through a credit-point system.',
  ],
  [
    'Eatery ghi rõ chi phí cho những tính năng cần trả phí. Với tính năng tra phí theo số lượng lượt xem, Eatery thể hiện rõ thông tin đo lường để bạn biết rõ cửa hàng đã sử dụng bao nhiêu, cần trả bao nhiêu.',
    'Eatery clearly lists costs for paid features. With usage-based page-view pricing, Eatery shows transparent metrics so you know exactly how much your store has used and what you owe.',
  ],
  [
    'Bạn đã trải nghiệm và rất thích các cửa hàng có hệ thống Menu và Order tại bàn nhưng các hệ thống này thường tốn chi phí cao và yêu cầu POS để lắp đặt. Điều này vượt quá ngân sách của bạn.',
    'You have seen stores with menu and table-order systems and loved the experience — but those systems are often expensive and require POS hardware to install. That is beyond your budget.',
  ],
  [
    'Bạn có thể có nhiều chi nhánh, cửa hàng khác nhau cần quản lý. Mỗi cửa hàng, mỗi chi nhánh lại cần website và tài nguyên khác nhau. Thậm chí mỗi cửa hàng lại thuộc 1 tài khoản khác nhau.',
    'You may run multiple branches or stores that each need their own website and resources. Sometimes each location even sits under a separate account.',
  ],
  [
    'Tín dụng tại Eatery không có thời hạn sử dụng. Bạn có thể nạp, sử dụng đúng những gì bạn cần, đúng thời điểm bạn cần mà yên tâm, số dư của bạn vẫn luôn ở đó cho những lần sử dụng sau.',
    'Credits on Eatery never expire. Top up, use exactly what you need when you need it — your balance stays available for next time.',
  ],
  [
    'Eatery giúp tạo nhanh mã QR từng bàn, qua đó, khách hàng của bạn có thể tạo order ngay tại bàn với số bàn được đánh dấu. Qua đó cũng giúp bạn quản lý order và quy trình hiệu quả hơn.',
    'Eatery quickly generates QR codes for each table so guests can place orders right at their seat with the table number attached — helping you manage orders and workflow more efficiently.',
  ],
  [
    'Eatery hỗ trợ QR code tới website, QR code từng bàn, và QR code cho từng món ăn. Giúp bạn có thêm nhiều sự lựa chọn trong việc quảng bá, thúc đẩy chuyển đổi cho cửa hàng của bạn.',
    'Eatery supports QR codes for your website, individual tables, and individual menu items — giving you more ways to promote your store and drive conversions.',
  ],
  [
    'Bạn có thể tạo nhiều cửa hàng trong 1 tài khoản Eatery. Đặc biệt phù hợp cho các cửa hàng nhiều chi nhánh, các cửa hàng nhiều nhánh con, hoặc các online dropshipping vendor.',
    'You can create multiple stores under one Eatery account — ideal for multi-branch businesses, franchise-style setups, or online dropshipping vendors.',
  ],
  [
    'Số lượng order tăng nhanh chóng và bạn bắt đầu cảm thấy khó khăn trong việc kiểm soát số lượng order. Bạn cần một cách tốt hơn để nhận order, thực hiện và quản lý.',
    'Orders pick up fast and it gets hard to keep track. You need a better way to receive, fulfill, and manage them.',
  ],
  [
    'Không cần phải thuê thiết kế riêng, không cần phải mày mò Photoshop hay Canva. Tạo Menu đơn giản và nhanh chóng. Hỗ trợ tải PDF cho in ấn và nhập từ file CSV.',
    'No need to hire a designer or wrestle with Photoshop or Canva. Build your menu quickly and easily. Export PDF for printing and import from CSV.',
  ],
  [
    'Eatery hiểu rõ nỗi lo chi phí của các cửa hàng vừa và nhỏ. Do đó Eatery chọn cách tiếp cận khác, giúp cửa hàng tối ưu được chi phí và hiệu quả đạt được.',
    'Eatery understands cost concerns for small and medium stores. That is why we take a different approach — helping you optimize spend and get real results.',
  ],
  [
    'Tạo website chuẩn SEO và kết nối với Menu của bạn. Giúp khách hàng dễ dàng xem thông tin cửa hàng và quy trình chọn và order nhanh hơn.',
    'Build an SEO-friendly website linked to your menu so customers can browse your store info and order faster.',
  ],
  [
    'Bạn cần thêm hoặc chỉnh sửa Menu của mình để phù hợp với chiến lược kinh doanh mới. Một số vấn đề thường gặp phải:',
    'You need to add or update your menu for a new business strategy. Common challenges include:',
  ],
  [
    'Nhập thông tin ngân hàng của bạn và có ngay QR thanh toán qua VietQR. Tải xuống PDF để in và sử dụng thực tế.',
    'Enter your bank details and get a VietQR payment code instantly. Download a PDF to print and use in-store.',
  ],
  [
    'Bạn đã chuẩn bị Menu, quy trình, và bắt đầu bán. Nhưng trong quá trình vận hành, bạn nhận ra một số hạn chế.',
    'You prepared your menu, workflow, and started selling — but along the way you hit some limits.',
  ],
  [
    'Tạo Landing Page, Menu, Mã QR, thanh toán. Tất cả đã bao gồm mà không cần phải trả phí hàng tháng.',
    'Landing page, menu, QR codes, and payments — all included with no monthly subscription.',
  ],
  [
    'Nhờ vào hệ thống tín dụng. Bạn có thể ngưng và tiếp tục sử dụng sau bất cứ khi nào bạn mong muốn.',
    'Thanks to the credit system, you can pause anytime and pick back up whenever you want.',
  ],
  [
    'Khám phá các tính năng nổi bật của Eatery mà bạn có thể tận dụng cho cửa hàng của bạn',
    'Explore standout Eatery features you can use for your store',
  ],
  [
    'Không giới hạn lượt xem trang, bạn chỉ trả cho đúng số lượt xem đạt được.',
    'No page-view cap — you pay only for the views you actually get.',
  ],
  [
    'Kết nối tên miền của bạn và bắt đầu đưa cửa hàng của bạn tiếp cận xa hơn.',
    'Connect your domain and start reaching customers beyond your doorstep.',
  ],
  ['Số điểm tín dụng bạn cần để kết nối với tên miền của bạn', 'Credits needed to connect your custom domain'],
  [
    'Trung bình chỉ mất 10 - 30 phút tạo Menu và QR thanh toán để bắt đầu',
    'On average it takes just 10–30 minutes to create your menu and payment QR to get started',
  ],
  ['Đăng ký ngay tài khoản của bạn với Eatery, tạo cửa hàng của bạn.', 'Sign up for Eatery and create your store.'],
  ['Tổng hợp công cụ và giải pháp cho các cửa hàng vừa và nhỏ.', 'Tools and solutions for small and medium stores.'],
  ['Tất cả những gì bạn cần cho cửa hàng nhỏ của bạn', 'Everything your small store needs'],
  ['Chỉ 3 bước để bạn có thể bắt đầu với Eatery', 'Just 3 steps to get started with Eatery'],
  ['Là chi phí mà bạn cần để bắt đầu với Eatery', 'What it costs to get started with Eatery'],
  ['Nhập một vài thông tin cơ bản của cửa hàng.', 'Enter a few basic details about your store.'],
  ['Tín dụng cho mỗi 500 lượt xem (1.000 VNĐ)', 'Credits per 500 page views (1,000 VND)'],
  ['Chi phí đội thêm nếu nhờ thiết kế ngoài', 'Extra cost if you hire external design help'],
  ['Thay đổi nằm ngoài khả năng tự thiết kế', 'Changes beyond what you can design yourself'],
  ['Eatery nói không với thu phí hàng tháng', 'Eatery says no to monthly fees'],
  ['File thiết kế thất lạc khi tự thiết kế', 'Design files get lost when you DIY'],
  ['Kết nối tên miền: 50 tín dụng/tháng', 'Custom domain: 50 credits/month'],
  ['Cửa hàng của bạn cần nhiều hơn thế', 'Your store needs more than that'],
  ['Lưu trữ hình ảnh: 1 tín dụng/20MB', 'Image storage: 1 credit/20MB'],
  ['Lượt xem: 1 tín dụng/500 lượt xem', 'Page views: 1 credit/500 views'],
  ['Kết quả thực tế. Tránh lãng phí.', 'Real results. No waste.'],
  ['© 2026 Eatery. Một sản phẩm bởi', '© 2026 Eatery. A product by'],
  ['© 2026 Eatery. Một Product By', '© 2026 Eatery. A product by'],
  ['1 tài khoản, nhiều cửa hàng', 'One account, many stores'],
  ['Hệ thống QR Code chuyên sâu', 'Advanced QR code system'],
  ['Cập nhật mới nhất từ Eatery', 'Latest updates from Eatery'],
  ['Không Thu phí hàng tháng', 'No monthly fees'],
  ['Quản lý nhiều cửa hàng', 'Manage multiple stores'],
  ['Menu và order tại bàn', 'Menu and table ordering'],
  ['Tạo và quản lý Menu', 'Create and manage your menu'],
  ['Bắt đầu trải nghiệm', 'Start exploring'],
  ['Tin tức & hướng dẫn', 'News & guides'],
  ['Dừng bất cứ lúc nào', 'Pause anytime'],
  ['Nhận order tại bàn', 'Accept table orders'],
  ['Tạo website cơ bản', 'Build a basic website'],
  ['(50.000 VNĐ/tháng)', '(50,000 VND/month)'],
  ['Thông tin cửa hàng', 'Store information'],
  ['Trải nghiệm Eatery', 'Experience Eatery'],
  ['Đà Nẵng, Việt Nam', 'Da Nang, Vietnam'],
  ['Menu cần thay đổi', 'Menu needs updating'],
  ['Tạo QR thanh toán', 'Create payment QR'],
  ['Chi phí minh bạch', 'Transparent pricing'],
  ['Hệ thống tín dụng', 'Credit system'],
  ['Cập nhật website', 'Update your website'],
  ['Thử Eatery ngay', 'Try Eatery now'],
  ['Quản lý order', 'Order management'],
  ['Theo dõi', 'Follow'],
  ['Khám phá Eatery và các tính năng mà Eatery cung cấp.', 'Explore Eatery and the features it offers.'],
]

const pairs = {}
const existing = fs.existsSync(outPath)
  ? JSON.parse(fs.readFileSync(outPath, 'utf8')).pairs ?? {}
  : {}

for (const [vi, en] of PAIRS) {
  pairs[vi] = en
}
// Keep custom translated strings from extract (skip null placeholders)
for (const [vi, en] of Object.entries(existing)) {
  if (!(vi in pairs) && en) pairs[vi] = en
}

const filled = fillNullTranslations(pairs)
const stillNull = Object.entries(pairs).filter(([, en]) => !en)

const manifest = { version: 1, pairs }
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n')
console.log(`Seeded ${Object.keys(pairs).length} translation pairs → ${outPath}`)
if (filled) console.log(`Filled ${filled} null entry(ies) via normalized key match.`)
if (stillNull.length) {
  console.warn(`${stillNull.length} entry(ies) still need English — run extract then add translations.`)
}
