import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { mImg } from '@/lib/marketing-assets'

const stepImages = ['img-work-1_1img-work-1.avif', 'img-work-2_1img-work-2.avif', 'img-work-3_1img-work-3.avif']
const stepClasses = ['is-first', 'is-second', 'is-third'] as const

export function NexbetWorks({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)

  return (
    <section id="works" className="section_works">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="works_layout">
            <div className="works_header">
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>{copy.works.badge}</div>
              </div>
              <div className="max-title is-30rem">
                <h2 className="text-align-center">{copy.works.title}</h2>
              </div>
              <div className="max-description is-23rem">
                <div className="text-color-secondary text-align-center">{copy.works.description}</div>
              </div>
            </div>
            <div className="services_cards">
              {copy.works.steps.map((s, index) => (
                <div key={s.title} className={`service_card ${stepClasses[index]}`}>
                  <div className="service_list">
                    <div className={`services_card${index === 2 ? ' is-last' : ''}`}>
                      <div className="works_left">
                        <div className="pill-item">
                          <div>{s.step}</div>
                        </div>
                        <div className="works_content">
                          <h3 className="text-xl">{s.title}</h3>
                          <div className="text-color-secondary">{s.description}</div>
                        </div>
                      </div>
                      <div className={`works_img ${stepClasses[index]}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mImg(stepImages[index])} loading="lazy" alt="" className="img-work" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="padding-section-medium" />
    </section>
  )
}
