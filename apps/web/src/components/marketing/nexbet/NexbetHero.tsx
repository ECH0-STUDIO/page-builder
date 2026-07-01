import Link from 'next/link'
import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import { mImg } from '@/lib/marketing-assets'
import { appPath } from '@/lib/site-urls'

export function NexbetHero({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)

  return (
    <section className="section_hero">
      <div className="padding-global height-100">
        <div className="container-large height-100">
          <div className="hero_layout">
            <div className="hero_left">
              <div className="hero_left-top">
                <div className="hero_header">
                  <div className="tag-item">
                    <div>{copy.hero.badge}</div>
                  </div>
                  <div className="max-title is-42rem">
                    <h1 className="hero_title">{copy.hero.title}</h1>
                  </div>
                  <div className="max-description is-35rem">
                    <div className="hero_description">{copy.hero.description}</div>
                  </div>
                </div>
                <div className="buttons-group">
                  <a href={appPath('/signup')} className="button-icon w-inline-block">
                    <div className="button_mask">
                      <div className="button_text">{copy.hero.ctaPrimary}</div>
                      <div className="button_text is-hide">{copy.hero.ctaPrimary}</div>
                    </div>
                    <div className="icon_button">
                      <div className="icon_mask">
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 16 16" fill="none" className="icon-1x1-small">
                          <path d="M2.66659 8L13.3333 8M13.3333 8L9.33325 12M13.3333 8L9.33325 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </a>
                  <Link href={marketingPathForLocale('/pricing', locale)} className="button w-variant-afd4be8c-cefc-38d4-ee66-8fdad5b98c2b w-inline-block">
                    <div className="button_mask">
                      <div className="button_text">{copy.hero.ctaSecondary}</div>
                      <div className="button_text is-hide">{copy.hero.ctaSecondary}</div>
                    </div>
                  </Link>
                </div>
              </div>
              <div className="rate_wrap hide-tablet">
                <div className="star_wrap">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="star_icon">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mImg('star_1.svg')} alt="" className="img" />
                    </div>
                  ))}
                </div>
                <div>{copy.hero.rating}</div>
              </div>
            </div>
            <div className="hero_container-img">
              <div className="hero_img-three">
                <div className="hero_img-three-h">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mImg('hero-item-3.svg')} alt="" className="img" />
                </div>
              </div>
              <div className="hero_img-one">
                <div className="hero_img-one-h">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mImg('hero-item-1.svg')} alt="" className="img" />
                </div>
              </div>
              <div className="hero_img-two">
                <div className="hero_img-two-h">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mImg('hero-item-2.svg')} alt="" className="img" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mImg('Frame-2147227617_1Frame 2147227617.avif')}
        loading="lazy"
        sizes="100vw"
        alt=""
        className="hero-bg"
      />
    </section>
  )
}
