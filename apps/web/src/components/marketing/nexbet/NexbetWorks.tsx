import { mImg } from '@/lib/marketing-assets'

const steps = [
  {
    step: 'Step 1',
    title: 'Create your account',
    description: 'Sign up free on the app and add your restaurant or cafe.',
    image: 'img-work-1_1img-work-1.avif',
    className: 'is-first',
  },
  {
    step: 'Step 2',
    title: 'Build your page',
    description: 'Add your menu, photos, and contact blocks with the visual editor.',
    image: 'img-work-2_1img-work-2.avif',
    className: 'is-second',
  },
  {
    step: 'Step 3',
    title: 'Publish & share',
    description: 'Go live with a link, QR codes on every table, or your custom domain.',
    image: 'img-work-3_1img-work-3.avif',
    className: 'is-third',
  },
]

export function NexbetWorks() {
  return (
    <section id="works" className="section_works">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="works_layout">
            <div className="works_header">
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>How it works</div>
              </div>
              <div className="max-title is-30rem">
                <h2 className="text-align-center">Launch in 3 simple steps.</h2>
              </div>
              <div className="max-description is-23rem">
                <div className="text-color-secondary text-align-center">
                  No agency. No WordPress. Just sign up and start building.
                </div>
              </div>
            </div>
            <div className="services_cards">
              {steps.map((s) => (
                <div key={s.title} className={`service_card ${s.className}`}>
                  <div className="service_list">
                    <div className={`services_card${s.className === 'is-third' ? ' is-last' : ''}`}>
                      <div className="works_left">
                        <div className="pill-item">
                          <div>{s.step}</div>
                        </div>
                        <div className="works_content">
                          <h3 className="text-xl">{s.title}</h3>
                          <div className="text-color-secondary">{s.description}</div>
                        </div>
                      </div>
                      <div className={`works_img ${s.className}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mImg(s.image)} loading="lazy" alt="" className="img-work" />
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
