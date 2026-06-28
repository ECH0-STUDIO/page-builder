import { mImg } from '@/lib/marketing-assets'

export function NexbetImpacts() {
  return (
    <section id="impacts" className="section_impacts">
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="impacts_layout">
            <div className="impacts_header">
              <div className="impacts_heading">
                <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                  <div>Why Eatery</div>
                </div>
                <div className="max-title is-30rem">
                  <h2 className="h2-aling">
                    Real results.
                    <br />
                    No wasted subscription.
                  </h2>
                </div>
              </div>
              <div className="max-description is-23rem">
                <div className="align-description">
                  Most tools charge monthly whether your restaurant is busy or closed. Eatery lets you
                  launch for free and spend credits only on premium add-ons you actually use.
                </div>
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
                  <div>Built for restaurant owners</div>
                </div>
                <div className="impact_item is-medium">
                  <div className="text-lg text-weight-medium">
                    Page builder, menus, QR codes, and publishing — included without a monthly plan.
                  </div>
                  <div>
                    <div className="counter-wrap">
                      <div className="text-3xl text-weight-medium">$0</div>
                    </div>
                    <div className="spacer-small" />
                    <div className="text-color-secondary">To start building and publishing your menu page</div>
                  </div>
                </div>
              </div>
              <div className="impact_item is-large">
                <div className="text-lg text-color-on-primary text-weight-medium">
                  Credits are for add-ons: custom domains, extra gallery storage — spend when you need them,
                  not every month by default.
                </div>
                <div className="impact_item_rate">
                  <div className="counter-wrap">
                    <div className="text-3xl text-weight-medium text-color-on-primary">50</div>
                    <div className="text-3xl text-weight-medium text-color-secondary">cr/mo</div>
                  </div>
                  <div className="vertical-center">
                    <div className="text-color-on-primary text-weight-medium">Custom domain while connected</div>
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
