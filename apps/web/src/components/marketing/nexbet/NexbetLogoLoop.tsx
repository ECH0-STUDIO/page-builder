import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'
import { mImg } from '@/lib/marketing-assets'

const logos = ['Vision.svg', 'Network.svg', 'Flash.svg', 'Cactus.svg', 'Vision-1.svg', 'Greenish.svg']

export function NexbetLogoLoop({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)
  const row = (
    <>
      {logos.map((name) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={name} src={mImg(name)} loading="lazy" alt="" className="loop_logo" />
      ))}
    </>
  )

  return (
    <section className="section_loop">
      <div className="padding-global">
        <div className="container-large">
          <div className="loop_layout">
            <div>
              <div className="loop_text" dangerouslySetInnerHTML={{ __html: copy.loop }} />
            </div>
            <div className="loop">
              <div className="loop_row">{row}</div>
              <div className="loop_row">{row}</div>
              <div className="loop_gradient-left" />
              <div className="loop_gradient-right" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
