import type { SupportedLocale } from '@/i18n/locale'

export type MarketingCopy = {
  nav: {
    whyEatery: string
    features: string
    pricing: string
    blog: string
    contact: string
    signIn: string
    getStarted: string
  }
  hero: {
    badge: string
    title: string
    description: string
    ctaPrimary: string
    ctaSecondary: string
    rating: string
  }
  loop: string
  impacts: {
    badge: string
    title: string
    description: string
    builtFor: string
    included: string
    freeLabel: string
    freeNote: string
    creditsTitle: string
    creditsRate: string
    creditsNote: string
  }
  features: {
    badge: string
    title: string
    description: string
    viewAll: string
    items: { title: string; description: string }[]
  }
  works: {
    badge: string
    title: string
    description: string
    steps: { step: string; title: string; description: string }[]
  }
  blog: {
    badge: string
    title: string
    description: string
    viewAll: string
    backToBlog: string
    byAuthor: string
  }
  cta: {
    title: string
    description: string
    primary: string
    secondary: string
  }
  footer: {
    tagline: string
    product: string
    getStarted: string
    createAccount: string
    contactUs: string
  }
  pricing: {
    badge: string
    title: string
    description: string
    startFreeTitle: string
    startFreeDesc: string
    buyCreditsTitle: string
    buyCreditsDesc: string
    whatCreditsFor: string
    optionalPacks: string
    packsNote: string
    creditUses: { label: string; value: string; note: string }[]
    packs: { credits: number; price: string; note: string; highlight?: boolean }[]
  }
  featuresPage: {
    badge: string
    title: string
    description: string
  }
  contact: {
    badge: string
    title: string
    description: string
    name: string
    email: string
    message: string
    send: string
    sending: string
    success: string
  }
  meta: {
    homeTitle: string
    homeDescription: string
    pricingTitle: string
    pricingDescription: string
    featuresTitle: string
    featuresDescription: string
    blogTitle: string
    blogDescription: string
    contactTitle: string
    contactDescription: string
  }
}

const COPY: Record<SupportedLocale, MarketingCopy> = {
  vi: {
    nav: {
      whyEatery: 'Tại sao Eatery',
      features: 'Tính năng',
      pricing: 'Bảng giá',
      blog: 'Tin tức',
      contact: 'Liên hệ',
      signIn: 'Đăng nhập',
      getStarted: 'Bắt đầu miễn phí',
    },
    hero: {
      badge: 'Trang số cho quán ăn',
      title: 'Thực đơn online. Không mắc kẹt gói tháng.',
      description:
        'Tạo trang thực đơn đẹp, mã QR bàn, và nhận thanh toán PayOS. Bắt đầu miễn phí — chỉ mua credit khi cần tên miền riêng hoặc dung lượng thêm.',
      ctaPrimary: 'Bắt đầu miễn phí',
      ctaSecondary: 'Cách dùng credit',
      rating: 'Trình tạo trang miễn phí · Trả theo nhu cầu',
    },
    loop: 'Được tin dùng bởi<br>quán ăn & cafe',
    impacts: {
      badge: 'Tại sao Eatery',
      title: 'Kết quả thật.\nKhông lãng phí gói tháng.',
      description:
        'Nhiều nền tảng thu phí hàng tháng dù quán đông hay vắng. Eatery cho bạn khởi động miễn phí và chỉ dùng credit cho tính năng premium khi thực sự cần.',
      builtFor: 'Dành cho chủ quán ăn',
      included: 'Trình tạo trang, thực đơn, QR và xuất bản — không cần gói tháng.',
      freeLabel: '0₫',
      freeNote: 'Để bắt đầu xây và xuất bản trang thực đơn',
      creditsTitle: 'Credit dùng cho tên miền riêng, dung lượng ảnh — trả khi cần, không mặc định hàng tháng.',
      creditsRate: '50',
      creditsNote: 'Credit/tháng khi kết nối tên miền riêng',
    },
    features: {
      badge: 'Tính năng',
      title: 'Mọi thứ quán bạn cần trên mạng.',
      description: 'Một nền tảng cho trang thực đơn, dashboard, thanh toán và đội ngũ.',
      viewAll: 'Xem tất cả tính năng',
      items: [
        {
          title: 'Trình tạo trang trực quan',
          description: 'Hero, lưới món, gallery, liên hệ và thanh toán — kéo thả và xuất bản.',
        },
        {
          title: 'Mã QR thực đơn',
          description: 'Tạo QR cho từng bàn — khách mở thực đơn trên điện thoại.',
        },
        {
          title: 'Thanh toán PayOS',
          description: 'Giỏ hàng trên trang công khai, tối ưu cho Việt Nam.',
        },
        {
          title: 'Đội ngũ & tên miền riêng',
          description: 'Mời nhân viên, kết nối tên miền thương hiệu với hướng dẫn DNS.',
        },
      ],
    },
    works: {
      badge: 'Cách hoạt động',
      title: 'Ra mắt chỉ với 3 bước.',
      description: 'Không cần agency. Không WordPress. Đăng ký và bắt đầu.',
      steps: [
        {
          step: 'Bước 1',
          title: 'Tạo tài khoản',
          description: 'Đăng ký miễn phí trên app và thêm quán hoặc cafe của bạn.',
        },
        {
          step: 'Bước 2',
          title: 'Xây trang của bạn',
          description: 'Thêm món, ảnh và khối liên hệ bằng trình chỉnh sửa trực quan.',
        },
        {
          step: 'Bước 3',
          title: 'Xuất bản & chia sẻ',
          description: 'Đưa trang lên mạng với link, QR trên bàn hoặc tên miền riêng.',
        },
      ],
    },
    blog: {
      badge: 'Tin tức',
      title: 'Tin tức và cập nhật',
      description:
        'Khám phá thông tin cập nhật, mẹo và thủ thuật để sử dụng Eatery một cách hiệu quả nhất.',
      viewAll: 'Xem tất cả bài viết',
      backToBlog: '← Quay lại tin tức',
      byAuthor: 'Bởi',
    },
    cta: {
      title: 'Sẵn sàng đưa thực đơn lên mạng?',
      description: 'Bắt đầu miễn phí trên app. Chỉ mua credit khi cần tính năng premium.',
      primary: 'Tạo tài khoản miễn phí',
      secondary: 'Xem bảng giá',
    },
    footer: {
      tagline:
        'Xây trang thực đơn số, nhận thanh toán và kết nối tên miền — chỉ trả cho tính năng premium bằng credit.',
      product: 'Sản phẩm',
      getStarted: 'Bắt đầu',
      createAccount: 'Tạo tài khoản miễn phí',
      contactUs: 'Liên hệ',
    },
    pricing: {
      badge: 'Giá theo credit',
      title: 'Không gói cố định. Trả đúng những gì bạn dùng.',
      description:
        'Trình tạo trang, thực đơn QR và xuất bản miễn phí để bắt đầu. Credit dùng cho tính năng premium — mua khi cần.',
      startFreeTitle: 'Bắt đầu miễn phí',
      startFreeDesc: 'Xây và xuất bản trang thực đơn không cần đăng ký gói. Không cần thẻ tín dụng.',
      buyCreditsTitle: 'Mua credit',
      buyCreditsDesc: 'Nạp khi cần tên miền riêng hoặc dung lượng ảnh thêm. Credit chưa dùng vẫn trong ví.',
      whatCreditsFor: 'Credit dùng để làm gì',
      optionalPacks: 'Gói credit tùy chọn',
      packsNote: 'Số tiền nạp trong app — không phải gói bắt buộc.',
      creditUses: [
        { label: 'Tên miền riêng', value: '50 credit / tháng', note: 'Tính khi tên miền đang kết nối' },
        { label: 'Lưu trữ gallery', value: '1 credit / 20 MB', note: 'Theo dung lượng — giảm khi xóa ảnh' },
      ],
      packs: [
        { credits: 50, price: '50.000₫', note: 'Thử tính năng premium' },
        { credits: 100, price: '90.000₫', note: 'Phù hợp hầu hết quán', highlight: true },
        { credits: 500, price: '400.000₫', note: 'Mùa cao điểm hoặc nhiều add-on' },
      ],
    },
    featuresPage: {
      badge: 'Tính năng',
      title: 'Mọi thứ để vận hành quán trên mạng.',
      description: 'Từ trang công khai đến dashboard, thanh toán và quản lý đội ngũ.',
    },
    contact: {
      badge: 'Liên hệ',
      title: 'Chúng tôi có thể giúp gì?',
      description: 'Gửi tin nhắn — đội ngũ Eatery sẽ phản hồi qua email.',
      name: 'Họ tên',
      email: 'Email',
      message: 'Nội dung',
      send: 'Gửi tin nhắn',
      sending: 'Đang gửi…',
      success: 'Đã gửi! Chúng tôi sẽ liên hệ sớm.',
    },
    meta: {
      homeTitle: 'Eatery VN — Trang số & thực đơn QR cho quán ăn',
      homeDescription:
        'Tạo trang thực đơn đẹp, mã QR bàn và thanh toán PayOS. Bắt đầu miễn phí với Eatery VN.',
      pricingTitle: 'Bảng giá — Eatery VN',
      pricingDescription: 'Bắt đầu miễn phí, mua credit khi cần tên miền riêng hoặc dung lượng thêm.',
      featuresTitle: 'Tính năng — Eatery VN',
      featuresDescription: 'Trình tạo trang, thực đơn số, QR bàn và công cụ cho quán ăn.',
      blogTitle: 'Tin tức — Eatery VN',
      blogDescription: 'Tin tức, hướng dẫn và mẹo vận hành quán ăn trực tuyến.',
      contactTitle: 'Liên hệ — Eatery VN',
      contactDescription: 'Liên hệ đội ngũ Eatery VN để được tư vấn thiết lập trang số.',
    },
  },
  en: {
    nav: {
      whyEatery: 'Why Eatery',
      features: 'Features',
      pricing: 'Pricing',
      blog: 'Blog',
      contact: 'Contact',
      signIn: 'Sign in',
      getStarted: 'Get started',
    },
    hero: {
      badge: 'Restaurant page builder',
      title: 'Your menu online. Without the monthly trap.',
      description:
        'Build a beautiful digital menu, generate QR codes, and accept PayOS payments. Start free — buy credits only when you need a custom domain or extra storage.',
      ctaPrimary: 'Start building free',
      ctaSecondary: 'How credits work',
      rating: 'Free page builder · Pay-as-you-go credits',
    },
    loop: 'Trusted by<br>restaurants & cafes',
    impacts: {
      badge: 'Why Eatery',
      title: 'Real results.\nNo wasted subscription.',
      description:
        'Most tools charge monthly whether your restaurant is busy or closed. Eatery lets you launch for free and spend credits only on premium add-ons you actually use.',
      builtFor: 'Built for restaurant owners',
      included: 'Page builder, menus, QR codes, and publishing — included without a monthly plan.',
      freeLabel: '$0',
      freeNote: 'To start building and publishing your menu page',
      creditsTitle:
        'Credits are for add-ons: custom domains, extra gallery storage — spend when you need them, not every month by default.',
      creditsRate: '50',
      creditsNote: 'Credits/month while custom domain is connected',
    },
    features: {
      badge: 'Features',
      title: 'Everything your restaurant needs online.',
      description: 'One platform for your public menu page, dashboard, payments, and team.',
      viewAll: 'See all features',
      items: [
        {
          title: 'Visual page builder',
          description: 'Hero, menu grid, gallery, contact, and payment blocks — drag, drop, publish.',
        },
        {
          title: 'QR menu codes',
          description: 'Generate table QR codes so guests open your live menu on their phone.',
        },
        {
          title: 'PayOS payments',
          description: 'Checkout drawer on your public page, built for Vietnam.',
        },
        {
          title: 'Team & custom domains',
          description: 'Invite staff, connect your brand domain with guided DNS setup.',
        },
      ],
    },
    works: {
      badge: 'How it works',
      title: 'Launch in 3 simple steps.',
      description: 'No agency. No WordPress. Just sign up and start building.',
      steps: [
        {
          step: 'Step 1',
          title: 'Create your account',
          description: 'Sign up free on the app and add your restaurant or cafe.',
        },
        {
          step: 'Step 2',
          title: 'Build your page',
          description: 'Add your menu, photos, and contact blocks with the visual editor.',
        },
        {
          step: 'Step 3',
          title: 'Publish & share',
          description: 'Go live with a link, QR codes on every table, or your custom domain.',
        },
      ],
    },
    blog: {
      badge: 'Blog',
      title: 'News & updates',
      description:
        'Explore updates, tips, and workflows to get the most out of Eatery for your business.',
      viewAll: 'View all posts',
      backToBlog: '← Back to blog',
      byAuthor: 'By',
    },
    cta: {
      title: 'Ready to launch your menu online?',
      description: 'Start free on the app. Buy credits only when you need premium features.',
      primary: 'Create free account',
      secondary: 'See pricing',
    },
    footer: {
      tagline:
        'Build your digital menu page, accept payments, and connect your domain — pay only for premium add-ons with credits.',
      product: 'Product',
      getStarted: 'Get started',
      createAccount: 'Create free account',
      contactUs: 'Contact us',
    },
    pricing: {
      badge: 'Credit-based pricing',
      title: 'No packages. Pay only for what you use.',
      description:
        'The page builder, QR menus, and publishing are free to start. Credits are for premium add-ons — buy them when you need them.',
      startFreeTitle: 'Start free',
      startFreeDesc: 'Build and publish your menu page without a subscription. No credit card required.',
      buyCreditsTitle: 'Buy credits',
      buyCreditsDesc: 'Top up when you want a custom domain or extra gallery storage. Unused credits stay in your balance.',
      whatCreditsFor: 'What credits are for',
      optionalPacks: 'Optional credit packs',
      packsNote: 'Top-up amounts inside the app — not mandatory plans.',
      creditUses: [
        { label: 'Custom domain connected', value: '50 credits / month', note: 'Billed while your domain is live' },
        { label: 'Gallery storage', value: '1 credit per 20 MB', note: 'Renews based on usage — drops if you delete images' },
      ],
      packs: [
        { credits: 50, price: '50,000₫', note: 'Try premium features' },
        { credits: 100, price: '90,000₫', note: 'Best value for most cafes', highlight: true },
        { credits: 500, price: '400,000₫', note: 'Busy seasons or multiple add-ons' },
      ],
    },
    featuresPage: {
      badge: 'Features',
      title: 'Everything to run your restaurant online.',
      description: 'From your public page to dashboard, payments, and team management.',
    },
    contact: {
      badge: 'Contact',
      title: 'How can we help?',
      description: 'Send a message — the Eatery team will reply by email.',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      send: 'Send message',
      sending: 'Sending…',
      success: 'Sent! We will get back to you soon.',
    },
    meta: {
      homeTitle: 'Eatery — Digital menu & QR pages for restaurants',
      homeDescription:
        'Build a beautiful digital menu page, QR codes, and PayOS payments. Start free with Eatery.',
      pricingTitle: 'Pricing — Eatery',
      pricingDescription: 'Start free and buy credits only when you need premium add-ons.',
      featuresTitle: 'Features — Eatery',
      featuresDescription: 'Page builder, digital menus, table QR codes, and restaurant tools.',
      blogTitle: 'News & articles — Eatery',
      blogDescription: 'News, guides, and tips for running your food business online.',
      contactTitle: 'Contact — Eatery',
      contactDescription: 'Contact the Eatery team for help setting up your digital menu.',
    },
  },
}

export function getMarketingCopy(locale: SupportedLocale): MarketingCopy {
  return COPY[locale]
}
