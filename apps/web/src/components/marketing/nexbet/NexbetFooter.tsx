import Link from 'next/link'
import { appPath, marketingPath } from '@/lib/site-urls'

export function NexbetFooter() {
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
                <div className="text-color-on-primary">
                  Build your digital menu page, accept payments, and connect your domain — pay only for
                  premium add-ons with credits.
                </div>
              </div>
              <div className="footer_contact">
                <div className="footer_data">
                  <div className="text-lg text-color-on-primary text-weight-medium">Product</div>
                  <Link href="/features" className="footer_link w-inline-block">
                    <div>Features</div>
                  </Link>
                  <Link href="/pricing" className="footer_link w-inline-block">
                    <div>Pricing</div>
                  </Link>
                  <Link href="/blog" className="footer_link w-inline-block">
                    <div>Blog</div>
                  </Link>
                </div>
                <div className="footer_social">
                  <div className="text-lg text-color-on-primary text-weight-medium">Get started</div>
                  <a href={appPath('/signup')} className="footer_link w-inline-block">
                    <div>Create free account</div>
                  </a>
                  <Link href="/contact" className="footer_link w-inline-block">
                    <div>Contact us</div>
                  </Link>
                </div>
              </div>
            </div>
            <div className="footer_bottom">
              <div className="footer_info">
                <div className="footer_copy">
                  <div>© {new Date().getFullYear()} Eatery</div>
                  <a href={marketingPath('/')} className="text-color-on-primary text-weight-medium">
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
