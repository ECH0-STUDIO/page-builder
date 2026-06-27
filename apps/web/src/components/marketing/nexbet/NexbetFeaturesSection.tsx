import Link from 'next/link'
import { mImg } from '@/lib/marketing-assets'

const features = [
  {
    title: 'Visual page builder',
    description: 'Hero, menu grid, gallery, contact, and payment blocks — drag, drop, publish.',
    image: 'img-work-1_1img-work-1.avif',
    large: true,
  },
  {
    title: 'QR menu codes',
    description: 'Generate table QR codes so guests open your live menu on their phone.',
    image: 'F-2-1_1F-2-1.avif',
    large: false,
  },
  {
    title: 'PayOS payments',
    description: 'Checkout drawer on your public page, built for Vietnam.',
    image: 'F-4-2_1F-4-2.avif',
    large: false,
  },
  {
    title: 'Team & custom domains',
    description: 'Invite staff, connect your brand domain with guided DNS setup.',
    image: 'img-work-3_1img-work-3.avif',
    large: true,
  },
]

export function NexbetFeaturesSection({ showViewAll = true }: { showViewAll?: boolean }) {
  return (
    <section id="features" className="section_features">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="features_layout">
            <div className="features_header">
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>Features</div>
              </div>
              <div className="max-title is-36rem">
                <h2 className="text-align-center">Everything your restaurant needs online.</h2>
              </div>
              <div className="max-description is-23rem">
                <div className="text-color-secondary text-align-center">
                  One platform for your public menu page, dashboard, payments, and team.
                </div>
              </div>
            </div>
            <div className="features_grid">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={`features_card ${f.large ? 'is-large' : 'is-short'}`}
                >
                  <div className={`visual${f.large ? '' : ' is-second'}`}>
                    <div style={{ borderRadius: '1rem', overflow: 'hidden' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={mImg(f.image)} alt="" className="img" style={{ width: '100%', height: 'auto' }} />
                    </div>
                  </div>
                  <div className={`feature_card_content${f.large ? ' is-large' : ''}`}>
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
              ))}
            </div>
            {showViewAll && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <Link href="/features" className="button w-inline-block">
                  <div className="button_mask">
                    <div className="button_text">See all features</div>
                    <div className="button_text is-hide">See all features</div>
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
