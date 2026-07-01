import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { mImg } from '@/lib/marketing-assets'

export function NexbetImpacts({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)
  const titleLines = copy.impacts.title.split('\n')

  return (
    <section id="impacts" className="section_impacts">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="impacts_layout">
            <div className="impacts_header">
              <div className="impacts_heading">
                <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                  <div>{copy.impacts.badge}</div>
                </div>
                <div className="max-title is-30rem">
                  <h2 className="h2-aling">
                    {titleLines.map((line, i) => (
                      <span key={line}>
                        {line}
                        {i < titleLines.length - 1 && <br />}
                      </span>
                    ))}
                  </h2>
                </div>
              </div>
              <div className="max-description is-23rem">
                <div className="align-description">{copy.impacts.description}</div>
              </div>
            </div>
            <div className="impacts_columns">
              <div className="impact_column">
                <div className="impact_item is-short">
                  <div className="avatars-wrap">
                    <div className="avatar-item is-first">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" src={mImg('users-1_1users-1.avif')} alt="" className="img" />
                    </div>
                    <div className="avatar-item is-second">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" src={mImg('users-2_1users-2.avif')} alt="" className="img" />
                    </div>
                    <div className="avatar-item is-third">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" src={mImg('users-3_1users-3.avif')} alt="" className="img" />
                    </div>
                    <div className="avatar-item is-fourth">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img loading="lazy" src={mImg('users-4_1users-4.avif')} alt="" className="img" />
                    </div>
                  </div>
                  <div>{copy.impacts.builtFor}</div>
                </div>
                <div className="impact_item is-medium">
                  <div className="text-lg text-weight-medium">{copy.impacts.included}</div>
                  <div>
                    <div className="counter-wrap">
                      <div className="text-3xl text-weight-medium">{copy.impacts.freeLabel}</div>
                    </div>
                    <div className="spacer-small" />
                    <div className="text-color-secondary">{copy.impacts.freeNote}</div>
                  </div>
                </div>
              </div>
              <div className="impact_item is-large">
                <div className="text-lg text-color-on-primary text-weight-medium">{copy.impacts.creditsTitle}</div>
                <div className="impact_item_rate">
                  <div className="counter-wrap">
                    <div className="text-3xl text-weight-medium text-color-on-primary">{copy.impacts.creditsRate}</div>
                    <div className="text-3xl text-weight-medium text-color-secondary">cr/mo</div>
                  </div>
                  <div className="vertical-center">
                    <div className="text-color-on-primary text-weight-medium">{copy.impacts.creditsNote}</div>
                  </div>
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
