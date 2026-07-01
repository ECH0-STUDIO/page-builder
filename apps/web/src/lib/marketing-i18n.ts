import type { SupportedLocale } from '@/i18n/locale'

/**
 * Vietnamese strings from the Eatery Webflow export → English.
 * VI locale serves the export HTML as-is; EN applies these replacements.
 * Add pairs here when you add new copy in Webflow (Vietnamese default).
 */
const VI_TO_EN: [string, string][] = [
  // Nav
  ['Tại sao Eatery', 'Why Eatery'],
  ['Tính năng', 'Features'],
  ['Bảng giá', 'Pricing'],
  ['Tin tức', 'Blog'],
  ['Liên hệ', 'Contact'],
  ['Đăng nhập', 'Sign in'],
  ['Bắt đầu miễn phí', 'Get started'],
  // Hero
  ['Trang số cho quán ăn', 'Restaurant page builder'],
  ['Thực đơn online. Không mắc kẹt gói tháng.', 'Your menu online. Without the monthly trap.'],
  [
    'Tạo trang thực đơn đẹp, mã QR bàn, và nhận thanh toán PayOS. Bắt đầu miễn phí — chỉ mua credit khi cần tên miền riêng hoặc dung lượng thêm.',
    'Build a beautiful digital menu, generate QR codes, and accept PayOS payments. Start free — buy credits only when you need a custom domain or extra storage.',
  ],
  ['Cách dùng credit', 'How credits work'],
  ['Trình tạo trang miễn phí · Trả theo nhu cầu', 'Free page builder · Pay-as-you-go credits'],
  ['Được tin dùng bởi<br>quán ăn & cafe', 'Trusted by<br>restaurants & cafes'],
  // Impacts
  ['Kết quả thật.\nKhông lãng phí gói tháng.', 'Real results.\nNo wasted subscription.'],
  [
    'Nhiều nền tảng thu phí hàng tháng dù quán đông hay vắng. Eatery cho bạn khởi động miễn phí và chỉ dùng credit cho tính năng premium khi thực sự cần.',
    'Most tools charge monthly whether your restaurant is busy or closed. Eatery lets you launch for free and spend credits only on premium add-ons you actually use.',
  ],
  ['Dành cho chủ quán ăn', 'Built for restaurant owners'],
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
  // Features section
  ['Mọi thứ quán bạn cần trên mạng.', 'Everything your restaurant needs online.'],
  [
    'Một nền tảng cho trang thực đơn, dashboard, thanh toán và đội ngũ.',
    'One platform for your public menu page, dashboard, payments, and team.',
  ],
  ['Trình tạo trang trực quan', 'Visual page builder'],
  [
    'Hero, lưới món, gallery, liên hệ và thanh toán — kéo thả và xuất bản.',
    'Hero, menu grid, gallery, contact, and payment blocks — drag, drop, publish.',
  ],
  ['Mã QR thực đơn', 'QR menu codes'],
  ['Tạo QR cho từng bàn — khách mở thực đơn trên điện thoại.', 'Generate table QR codes so guests open your live menu on their phone.'],
  ['Thanh toán PayOS', 'PayOS payments'],
  ['Giỏ hàng trên trang công khai, tối ưu cho Việt Nam.', 'Checkout drawer on your public page, built for Vietnam.'],
  ['Đội ngũ & tên miền riêng', 'Team & custom domains'],
  [
    'Mời nhân viên, kết nối tên miền thương hiệu với hướng dẫn DNS.',
    'Invite staff, connect your brand domain with guided DNS setup.',
  ],
  ['Xem tất cả tính năng', 'See all features'],
  // Works
  ['Cách hoạt động', 'How it works'],
  ['Ra mắt chỉ với 3 bước.', 'Launch in 3 simple steps.'],
  ['Không cần agency. Không WordPress. Đăng ký và bắt đầu.', 'No agency. No WordPress. Just sign up and start building.'],
  ['Bước 1', 'Step 1'],
  ['Bước 2', 'Step 2'],
  ['Bước 3', 'Step 3'],
  ['Tạo tài khoản', 'Create your account'],
  ['Đăng ký miễn phí trên app và thêm quán hoặc cafe của bạn.', 'Sign up free on the app and add your restaurant or cafe.'],
  ['Xây trang của bạn', 'Build your page'],
  [
    'Thêm món, ảnh và khối liên hệ bằng trình chỉnh sửa trực quan.',
    'Add your menu, photos, and contact blocks with the visual editor.',
  ],
  ['Xuất bản & chia sẻ', 'Publish & share'],
  [
    'Đưa trang lên mạng với link, QR trên bàn hoặc tên miền riêng.',
    'Go live with a link, QR codes on every table, or your custom domain.',
  ],
  // Blog
  ['Tin tức và cập nhật', 'News & updates'],
  [
    'Khám phá thông tin cập nhật, mẹo và thủ thuật để sử dụng Eatery một cách hiệu quả nhất.',
    'Explore updates, tips, and workflows to get the most out of Eatery for your business.',
  ],
  ['Xem tất cả bài viết', 'View all posts'],
  ['Chia sẻ bài viết', 'Share article'],
  ['Quay lại tin tức', 'Back to blog'],
  ['Ngày đăng', 'Date'],
  ['Danh mục', 'Category'],
  ['Thời gian đọc', 'Reading time'],
  // CTA / footer
  ['Sẵn sàng đưa thực đơn lên mạng?', 'Ready to launch your menu online?'],
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
  ['Sản phẩm', 'Product'],
  ['Bắt đầu', 'Get started'],
  // Pricing page
  ['Giá theo credit', 'Credit-based pricing'],
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
  ['Gói credit tùy chọn', 'Optional credit packs'],
  ['Số tiền nạp trong app — không phải gói bắt buộc.', 'Top-up amounts inside the app — not mandatory plans.'],
  ['Tên miền riêng', 'Custom domain connected'],
  ['50 credit / tháng', '50 credits / month'],
  ['Tính khi tên miền đang kết nối', 'Billed while your domain is live'],
  ['Lưu trữ gallery', 'Gallery storage'],
  ['1 credit / 20 MB', '1 credit per 20 MB'],
  ['Theo dung lượng — giảm khi xóa ảnh', 'Renews based on usage — drops if you delete images'],
  // Contact
  ['Chúng tôi có thể giúp gì?', 'How can we help?'],
  ['Gửi tin nhắn — đội ngũ Eatery sẽ phản hồi qua email.', 'Send a message — the Eatery team will reply by email.'],
  ['Họ tên', 'Name'],
  ['Nội dung', 'Message'],
  ['Gửi tin nhắn', 'Send message'],
  ['Đang gửi…', 'Sending…'],
  ['Đã gửi! Chúng tôi sẽ liên hệ sớm.', 'Sent! We will get back to you soon.'],
]

function applyReplacements(html: string, pairs: [string, string][]): string {
  let out = html
  const sorted = [...pairs].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of sorted) {
    if (from.includes('\n')) {
      out = out.split(from).join(to)
    } else {
      out = out.replaceAll(from, to)
    }
  }
  return out
}

export function applyMarketingI18n(html: string, locale: SupportedLocale): string {
  if (locale !== 'en') return html
  return applyReplacements(html, VI_TO_EN)
}
