import Link from 'next/link'
import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { marketingPathForLocale } from '@/lib/marketing-locale'
import { mImg } from '@/lib/marketing-assets'

const featureImages = ['img-work-1_1img-work-1.avif', 'F-2-1_1F-2-1.avif', 'F-4-2_1F-4-2.avif', 'img-work-3_1img-work-3.avif']

export function NexbetFeaturesSection({
  locale,
  showViewAll = true,
}: {
  locale: SupportedLocale
  showViewAll?: boolean
}) {
  const copy = getMarketingCopy(locale)

  return (
    <section id="features" className="section_features">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="features_layout">
            <div className="features_header">
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>{copy.features.badge}</div>
              </div>
              <div className="max-title is-36rem">
                <h2 className="text-align-center">{copy.features.title}</h2>
              </div>
              <div className="max-description is-23rem">
                <div className="text-color-secondary text-align-center">{copy.features.description}</div>
              </div>
            </div>
            <div className="features_grid">
              {copy.features.items.map((f, index) => {
                const large = index === 0 || index === 3
                return (
                  <div key={f.title} className={`features_card ${large ? 'is-large' : 'is-short'}`}>
                    <div className={`visual${large ? '' : ' is-second'}`}>
                      <div style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mImg(featureImages[index])} alt="" className="img" style={{ width: '100%', height: 'auto' }} />
                      </div>
                    </div>
                    <div className={`feature_card_content${large ? ' is-large' : ''}`}>
                      <div className="feature_icon">
                        <div className="icon-svg">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={mImg('material-symbols_timer-rounded.svg')} alt="" className="img" />
                        </div>
                      </div>
                      <h3 className="h5">{f.title}</h3>
                      <div className="text-color-secondary">{f.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            {showViewAll && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link href={marketingPathForLocale('/features', locale)} className="button w-inline-block">
                  <div className="button_mask">
                    <div className="button_text">{copy.features.viewAll}</div>
                    <div className="button_text is-hide">{copy.features.viewAll}</div>
                  </div>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="padding-section-medium" />
    </section>
  )
}
