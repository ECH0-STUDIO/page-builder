import Link from 'next/link'
import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import { appPath } from '@/lib/site-urls'

export function NexbetFooter({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)

  return (
    <section className="footer">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="footer_layout">
            <div className="footer_top">
              <div className="footer_header">
                <div className="footer_logo">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-full.png" alt="Eatery" className="navbar_logo-eatery" />
                </div>
                <div className="text-color-on-primary">{copy.footer.tagline}</div>
              </div>
              <div className="footer_contact">
                <div className="footer_data">
                  <div className="text-lg text-color-on-primary text-weight-medium">{copy.footer.product}</div>
                  <Link href={marketingPathForLocale('/features', locale)} className="footer_link w-inline-block">
                    <div>{copy.nav.features}</div>
                  </Link>
                  <Link href={marketingPathForLocale('/pricing', locale)} className="footer_link w-inline-block">
                    <div>{copy.nav.pricing}</div>
                  </Link>
                  <Link href={marketingPathForLocale('/blog', locale)} className="footer_link w-inline-block">
                    <div>{copy.nav.blog}</div>
                  </Link>
                </div>
                <div className="footer_social">
                  <div className="text-lg text-color-on-primary text-weight-medium">{copy.footer.getStarted}</div>
                  <a href={appPath('/signup')} className="footer_link w-inline-block">
                    <div>{copy.footer.createAccount}</div>
                  </a>
                  <Link href={marketingPathForLocale('/contact', locale)} className="footer_link w-inline-block">
                    <div>{copy.footer.contactUs}</div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="footer_bottom">
              <div className="footer_info">
                <div className="footer_copy">
                  <div>© {new Date().getFullYear()} Eatery</div>
                  <a href="https://eateryvn.com" className="text-color-on-primary text-weight-medium">
                    eateryvn.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="padding-section-medium" />
    </section>
  )
}
