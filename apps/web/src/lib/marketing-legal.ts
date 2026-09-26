import type { SupportedLocale } from '@/i18n/locale'
import { escapeHtml } from '@/lib/marketing-blog-html'
import { marketingPathForLocale } from '@/lib/marketing-locale'

export type LegalDocId = 'privacy' | 'terms'

type Block =
  | { kind: 'p'; text: string }
  | { kind: 'ul'; items: string[] }

type Section = {
  heading: string
  blocks: Block[]
}

type LegalDoc = {
  title: string
  updated: string
  intro: string
  sections: Section[]
}

const UPDATED = {
  vi: '26 tháng 9, 2026',
  en: '26 September 2026',
} as const

const DOCS: Record<LegalDocId, Record<SupportedLocale, LegalDoc>> = {
  privacy: {
    vi: {
      title: 'Chính sách bảo mật',
      updated: UPDATED.vi,
      intro:
        'Eatery là sản phẩm của ECH0 STUDIO tại Đà Nẵng, Việt Nam. Chính sách này nói rõ chúng tôi thu thập gì khi bạn dùng trang giới thiệu, ứng dụng, và các trang cửa hàng tạo trên Eatery.',
      sections: [
        {
          heading: 'Chúng tôi thu thập gì',
          blocks: [
            {
              kind: 'ul',
              items: [
                'Tài khoản: họ tên, email, và mật khẩu. Mật khẩu do hệ thống đăng nhập lưu, chúng tôi không đọc mật khẩu của bạn. Nếu bạn đăng nhập bằng Google, chúng tôi nhận tên và email Google chia sẻ.',
                'Cửa hàng: tên, địa chỉ, giờ mở cửa, thực đơn, ảnh, bản dịch, thiết lập trang, mã QR, tên miền riêng, và những người bạn mời vào nhóm.',
                'Đơn của khách: món, số bàn, ghi chú, và lần gọi nhân viên mà khách gửi trên trang cửa hàng.',
                'Thanh toán: khi bạn mua credit, PayOS xử lý giao dịch và báo cho chúng tôi kết quả. Số tài khoản ngân hàng bạn nhập để hiện VietQR được lưu để tạo mã QR. Tiền khách trả cho cửa hàng đi thẳng vào tài khoản của cửa hàng, Eatery không giữ khoản đó.',
                'Kỹ thuật: lượt xem trang, ngôn ngữ bạn chọn, và nếu nhân viên bật thông báo thì địa chỉ đăng ký thông báo trên trình duyệt.',
              ],
            },
          ],
        },
        {
          heading: 'Chúng tôi dùng thông tin để làm gì',
          blocks: [
            {
              kind: 'ul',
              items: [
                'Hiển thị trang, thực đơn, đơn hàng, và tài khoản của bạn.',
                'Tính credit cho lượt xem trang đã xuất bản, tên miền riêng, ngôn ngữ thêm, và bản dịch bằng AI.',
                'Gửi email về tài khoản, lời mời nhân viên, và đặt lại mật khẩu.',
                'Khi bạn bấm dịch bằng AI, đoạn chữ bạn chọn được gửi tới Google để dịch.',
              ],
            },
          ],
        },
        {
          heading: 'Chúng tôi chia sẻ với ai',
          blocks: [
            {
              kind: 'p',
              text: 'Chúng tôi không bán thông tin của bạn. Dữ liệu được xử lý bởi các nhà cung cấp sau để chạy sản phẩm:',
            },
            {
              kind: 'ul',
              items: [
                'Supabase lưu dữ liệu tài khoản và cửa hàng.',
                'Vercel chạy website.',
                'PayOS xử lý việc mua credit.',
                'Resend gửi email.',
                'Google Analytics đo trang giới thiệu. Google dịch chữ khi bạn yêu cầu dịch bằng AI.',
              ],
            },
          ],
        },
        {
          heading: 'Khách của cửa hàng',
          blocks: [
            {
              kind: 'p',
              text: 'Chủ cửa hàng quyết định nội dung thực đơn và nhận đơn từ khách của mình. Eatery xử lý những thông tin đó để hiển thị trang và ghi nhận đơn. Chủ cửa hàng chịu trách nhiệm với khách về món, giá, và việc dùng dữ liệu đơn hàng.',
            },
          ],
        },
        {
          heading: 'Chúng tôi giữ thông tin bao lâu',
          blocks: [
            {
              kind: 'p',
              text: 'Đơn hàng được xóa theo lịch, khoảng ba tháng sau khi tạo. Thông tin tài khoản và nội dung cửa hàng được giữ đến khi bạn xóa cửa hàng hoặc yêu cầu chúng tôi xóa tài khoản.',
            },
          ],
        },
        {
          heading: 'Cookie',
          blocks: [
            {
              kind: 'p',
              text: 'Cookie giữ phiên đăng nhập và ngôn ngữ bạn đang xem. Trang giới thiệu dùng Google Analytics. Bạn có thể chặn cookie trong trình duyệt; đăng nhập và một số phần của sản phẩm sẽ không hoạt động nếu cookie đăng nhập bị tắt.',
            },
          ],
        },
        {
          heading: 'Quyền của bạn',
          blocks: [
            {
              kind: 'p',
              text: 'Bạn có thể xem, sửa, hoặc yêu cầu xóa thông tin tài khoản của mình. Viết cho hello@ech0.work. Chúng tôi có thể cần xác nhận bạn là chủ tài khoản trước khi xóa.',
            },
          ],
        },
        {
          heading: 'Trẻ em',
          blocks: [
            {
              kind: 'p',
              text: 'Eatery dành cho chủ cửa hàng. Chúng tôi không chủ đích thu thập thông tin của trẻ em.',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Privacy policy',
      updated: UPDATED.en,
      intro:
        'Eatery is a product of ECH0 STUDIO in Da Nang, Vietnam. This policy explains what we collect when you use the marketing site, the app, and the store pages created on Eatery.',
      sections: [
        {
          heading: 'What we collect',
          blocks: [
            {
              kind: 'ul',
              items: [
                'Account: your name, email, and password. The sign-in system stores the password; we do not read it. If you sign in with Google, we receive the name and email Google shares.',
                'Your store: name, address, hours, menu, photos, translations, page settings, QR codes, custom domain, and the people you invite to the team.',
                'Diner orders: items, table number, notes, and staff calls that a diner sends from the store page.',
                'Payments: when you buy credits, PayOS handles the payment and tells us the result. The bank account you enter for VietQR is stored so we can build the QR code. Money a diner pays the store goes to the store’s account. Eatery does not hold that payment.',
                'Technical data: page views, the language you choose, and, if a teammate turns notifications on, the browser’s notification address.',
              ],
            },
          ],
        },
        {
          heading: 'How we use it',
          blocks: [
            {
              kind: 'ul',
              items: [
                'To show your page, menu, orders, and account.',
                'To charge credits for published page views, a custom domain, extra languages, and AI translation.',
                'To email you about your account, team invites, and password resets.',
                'When you choose AI translation, the text you select is sent to Google to translate.',
              ],
            },
          ],
        },
        {
          heading: 'Who we share it with',
          blocks: [
            {
              kind: 'p',
              text: 'We do not sell your information. These providers process data so the product can run:',
            },
            {
              kind: 'ul',
              items: [
                'Supabase stores account and store data.',
                'Vercel hosts the website.',
                'PayOS processes credit purchases.',
                'Resend sends email.',
                'Google Analytics measures the marketing site. Google translates text when you ask for an AI translation.',
              ],
            },
          ],
        },
        {
          heading: 'Diners of a store',
          blocks: [
            {
              kind: 'p',
              text: 'The store owner decides the menu and receives orders from their diners. Eatery processes that information to show the page and record the order. The store owner is responsible to their diners for the menu, prices, and how order details are used.',
            },
          ],
        },
        {
          heading: 'How long we keep it',
          blocks: [
            {
              kind: 'p',
              text: 'Orders are deleted on a schedule, about three months after they are placed. Account information and store content stay until you delete the business or ask us to delete the account.',
            },
          ],
        },
        {
          heading: 'Cookies',
          blocks: [
            {
              kind: 'p',
              text: 'Cookies keep you signed in and remember the language you are reading. The marketing site uses Google Analytics. You can block cookies in your browser. Sign-in and parts of the product will not work if the sign-in cookie is off.',
            },
          ],
        },
        {
          heading: 'Your choices',
          blocks: [
            {
              kind: 'p',
              text: 'You can ask to see, correct, or delete your account information. Email hello@ech0.work. We may need to confirm you own the account before we delete it.',
            },
          ],
        },
        {
          heading: 'Children',
          blocks: [
            {
              kind: 'p',
              text: 'Eatery is for store owners. We do not knowingly collect information from children.',
            },
          ],
        },
      ],
    },
  },
  terms: {
    vi: {
      title: 'Điều khoản sử dụng',
      updated: UPDATED.vi,
      intro:
        'Khi tạo tài khoản hoặc dùng Eatery, bạn đồng ý với các điều khoản này. Eatery do ECH0 STUDIO tại Đà Nẵng, Việt Nam cung cấp.',
      sections: [
        {
          heading: 'Dịch vụ',
          blocks: [
            {
              kind: 'p',
              text: 'Eatery giúp bạn tạo trang cửa hàng, thực đơn, mã QR, nhận đơn, và các công cụ đi kèm. Bạn có thể bắt đầu miễn phí. Một số phần dùng credit, như lượt xem trang đã xuất bản, tên miền riêng, ngôn ngữ thêm, và dịch bằng AI. Mức credit hiện tại được ghi trên trang Chi phí và trong sản phẩm trước khi bạn bật tính năng đó.',
            },
          ],
        },
        {
          heading: 'Tài khoản',
          blocks: [
            {
              kind: 'p',
              text: 'Bạn cần cung cấp thông tin đúng và giữ mật khẩu của mình. Bạn chịu trách nhiệm với việc làm của những người bạn mời vào cửa hàng. Mỗi người chỉ nên dùng tài khoản của chính họ.',
            },
          ],
        },
        {
          heading: 'Nội dung của bạn và khách của bạn',
          blocks: [
            {
              kind: 'p',
              text: 'Bạn giữ quyền với thực đơn, ảnh, và chữ bạn đăng. Bạn cho Eatery quyền lưu trữ và hiển thị nội dung đó để chạy dịch vụ. Bạn chịu trách nhiệm về món, giá, và thông tin trên trang của mình. Trang đã xuất bản là trang công khai.',
            },
          ],
        },
        {
          heading: 'Đơn hàng và thanh toán',
          blocks: [
            {
              kind: 'p',
              text: 'Đơn trên trang cửa hàng là việc giữa cửa hàng và khách. VietQR hiển thị tài khoản ngân hàng do bạn nhập. Eatery không nhận tiền khách trả cho cửa hàng và không chịu trách nhiệm nếu món, giá, hoặc giao nhận không đúng như khách mong.',
            },
          ],
        },
        {
          heading: 'Credit',
          blocks: [
            {
              kind: 'p',
              text: 'Credit mua qua PayOS được cộng vào tài khoản Eatery của bạn và dùng cho các tính năng trả phí. Credit không đổi lại thành tiền mặt. Nếu tên miền riêng không kết nối được, credit của lần thiết lập đó được trả lại vào số dư.',
            },
          ],
        },
        {
          heading: 'Cách dùng được chấp nhận',
          blocks: [
            {
              kind: 'p',
              text: 'Không dùng Eatery để đăng nội dung trái pháp luật, giả mạo người khác, làm hại dịch vụ, hoặc gửi thư rác. Chúng tôi có thể tạm khóa tài khoản nếu việc dùng gây hại cho khách khác hoặc cho hệ thống.',
            },
          ],
        },
        {
          heading: 'Hoạt động của dịch vụ',
          blocks: [
            {
              kind: 'p',
              text: 'Chúng tôi cố gắng giữ Eatery chạy ổn định, nhưng không hứa dịch vụ luôn không gián đoạn. Tính năng có thể thay đổi khi sản phẩm được cập nhật.',
            },
          ],
        },
        {
          heading: 'Dừng sử dụng',
          blocks: [
            {
              kind: 'p',
              text: 'Bạn có thể ngừng dùng và yêu cầu xóa cửa hàng bất kỳ lúc nào. Chúng tôi có thể ngừng cung cấp dịch vụ cho một tài khoản vi phạm các điều khoản này. Phần credit còn lại không được hoàn tiền mặt khi tài khoản đóng.',
            },
          ],
        },
        {
          heading: 'Trách nhiệm',
          blocks: [
            {
              kind: 'p',
              text: 'Trong phạm vi pháp luật cho phép, ECH0 STUDIO không chịu trách nhiệm cho doanh thu mất, đơn hàng hỏng, hoặc thiệt hại gián tiếp từ việc dùng Eatery. Trách nhiệm của chúng tôi với bạn, nếu có, giới hạn ở số credit bạn đã trả cho Eatery trong ba tháng gần nhất.',
            },
          ],
        },
        {
          heading: 'Luật áp dụng',
          blocks: [
            {
              kind: 'p',
              text: 'Các điều khoản này được hiểu theo pháp luật Việt Nam. Khi có tranh chấp, hai bên sẽ trao đổi với nhau trước qua hello@ech0.work.',
            },
          ],
        },
      ],
    },
    en: {
      title: 'Terms of use',
      updated: UPDATED.en,
      intro:
        'Creating an account or using Eatery means you agree to these terms. Eatery is provided by ECH0 STUDIO in Da Nang, Vietnam.',
      sections: [
        {
          heading: 'The service',
          blocks: [
            {
              kind: 'p',
              text: 'Eatery lets you build a store page, menu, QR codes, orders, and the tools that go with them. You can start for free. Some parts use credits, including views of a published page, a custom domain, extra languages, and AI translation. Current credit amounts are shown on the Pricing page and in the product before you turn a paid feature on.',
            },
          ],
        },
        {
          heading: 'Accounts',
          blocks: [
            {
              kind: 'p',
              text: 'You need to give accurate information and keep your password private. You are responsible for what the people you invite to a store do there. Each person should use their own account.',
            },
          ],
        },
        {
          heading: 'Your content and your diners',
          blocks: [
            {
              kind: 'p',
              text: 'You keep the rights to the menu, photos, and text you upload. You give Eatery permission to store and display that content so the service can run. You are responsible for the items, prices, and information on your page. A published page is public.',
            },
          ],
        },
        {
          heading: 'Orders and payments',
          blocks: [
            {
              kind: 'p',
              text: 'An order on a store page is between the store and the diner. VietQR shows the bank account you entered. Eatery does not receive the money a diner pays the store, and Eatery is not responsible if the food, price, or handoff is not what the diner expected.',
            },
          ],
        },
        {
          heading: 'Credits',
          blocks: [
            {
              kind: 'p',
              text: 'Credits bought through PayOS are added to your Eatery account and spent on paid features. Credits are not converted back to cash. If a custom domain never finishes connecting, the credits for that setup are returned to your balance.',
            },
          ],
        },
        {
          heading: 'Acceptable use',
          blocks: [
            {
              kind: 'p',
              text: 'Do not use Eatery to publish anything illegal, to pretend to be someone else, to harm the service, or to send spam. We may suspend an account if the use harms other customers or the system.',
            },
          ],
        },
        {
          heading: 'Availability',
          blocks: [
            {
              kind: 'p',
              text: 'We work to keep Eatery running, and we do not promise that it will be available without interruption. Features can change as the product is updated.',
            },
          ],
        },
        {
          heading: 'Stopping',
          blocks: [
            {
              kind: 'p',
              text: 'You can stop using Eatery and ask us to delete a store at any time. We may stop providing the service to an account that breaks these terms. Remaining credits are not paid out in cash when an account is closed.',
            },
          ],
        },
        {
          heading: 'Liability',
          blocks: [
            {
              kind: 'p',
              text: 'To the extent the law allows, ECH0 STUDIO is not liable for lost sales, failed orders, or indirect damage from using Eatery. If we are liable to you, that liability is limited to the credits you paid Eatery in the previous three months.',
            },
          ],
        },
        {
          heading: 'Law',
          blocks: [
            {
              kind: 'p',
              text: 'These terms are read under the laws of Vietnam. If there is a dispute, we will talk first by email at hello@ech0.work.',
            },
          ],
        },
      ],
    },
  },
}

const LEGAL_LABELS: Record<SupportedLocale, { updated: string; contact: string; other: Record<LegalDocId, string> }> = {
  vi: {
    updated: 'Cập nhật',
    contact: 'Liên hệ',
    other: { privacy: 'Chính sách bảo mật', terms: 'Điều khoản sử dụng' },
  },
  en: {
    updated: 'Updated',
    contact: 'Contact',
    other: { privacy: 'Privacy policy', terms: 'Terms of use' },
  },
}

const MAIN_SECTION_RE =
  /<section id="(?:explore-shell|features)"[^>]*>[\s\S]*?<\/section>\s*(?=<section class="footer")/i

const LEGAL_STYLES = `<style data-eatery-legal>
.legal-doc { max-width: 44rem; margin: 0 auto; text-align: left; }
.legal-doc h1 { text-align: left; }
.legal-doc h2 { font-size: 1.35rem; line-height: 1.3; margin: 2.25rem 0 0.6rem; }
.legal-doc p { margin: 0 0 0.85rem; line-height: 1.65; }
.legal-doc ul { margin: 0 0 0.85rem; padding-left: 1.2rem; }
.legal-doc li { margin: 0.25rem 0; line-height: 1.65; }
.legal-doc a { text-decoration: underline; text-underline-offset: 2px; }
</style>`

function renderBlocks(blocks: Block[]): string {
  return blocks
    .map((block) => {
      if (block.kind === 'ul') {
        const items = block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
        return `<ul>${items}</ul>`
      }
      return `<p>${escapeHtml(block.text)}</p>`
    })
    .join('')
}

export function renderLegalPageHtml(
  baseHtml: string,
  docId: LegalDocId,
  locale: SupportedLocale,
): string {
  const doc = DOCS[docId][locale]
  const labels = LEGAL_LABELS[locale]
  const otherId: LegalDocId = docId === 'privacy' ? 'terms' : 'privacy'
  const otherHref = marketingPathForLocale(otherId === 'privacy' ? '/privacy' : '/terms', locale)
  const sections = doc.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>${renderBlocks(section.blocks)}`,
    )
    .join('')

  const section = `<section id="legal" class="section_features">
  <div class="padding-section-medium"></div>
  <div class="padding-global">
    <div class="container-large">
      <article class="legal-doc">
        <h1>${escapeHtml(doc.title)}</h1>
        <p class="text-sm text-color-secondary">${escapeHtml(labels.updated)} ${escapeHtml(doc.updated)}</p>
        <p>${escapeHtml(doc.intro)}</p>
        ${sections}
        <h2>${escapeHtml(labels.contact)}</h2>
        <p><a href="mailto:hello@ech0.work">hello@ech0.work</a></p>
        <p>ECH0 STUDIO, ${escapeHtml(locale === 'vi' ? 'Đà Nẵng, Việt Nam' : 'Da Nang, Vietnam')}</p>
        <p><a href="${escapeHtml(otherHref)}">${escapeHtml(labels.other[otherId])}</a></p>
      </article>
    </div>
  </div>
  <div class="padding-section-medium"></div>
</section>`

  let html = baseHtml
  if (MAIN_SECTION_RE.test(html)) {
    html = html.replace(MAIN_SECTION_RE, section)
  } else {
    html = html.replace(/<section class="footer">/i, `${section}<section class="footer">`)
  }
  if (!html.includes('data-eatery-legal')) {
    html = html.replace(/<\/head>/i, `${LEGAL_STYLES}\n</head>`)
  }
  return html
}
