/**
 * ContactRender — shared between editor canvas and live page.
 * Uses config.background_color + config.text_color for theming.
 * Shows a VietQR payment card when paymentSettings are configured.
 */

import type { ContactConfig } from '../types'

function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <path d="M18 36C27.9411 36 36 27.9411 36 18C36 8.05887 27.9411 0 18 0C8.05887 0 0 8.05887 0 18C0 26.9856 6.5816 34.4277 15.1875 35.7801V23.2031H10.6172V18H15.1875V14.0344C15.1875 9.525 17.8692 7.03125 21.9902 7.03125C23.9592 7.03125 26.0156 7.38281 26.0156 7.38281V11.8125H23.7483C21.5168 11.8125 20.8125 13.1979 20.8125 14.6191V18H25.8047L25.0062 23.2031H20.8125V35.7801C29.4184 34.4277 36 26.9856 36 18Z" fill="#1877F2"/>
      <path d="M25.0062 23.2031L25.8047 18H20.8125V14.6191C20.8125 13.1979 21.5168 11.8125 23.7483 11.8125H26.0156V7.38281C26.0156 7.38281 23.9592 7.03125 21.9902 7.03125C17.8692 7.03125 15.1875 9.525 15.1875 14.0344V18H10.6172V23.2031H15.1875V35.7801C16.1118 35.9255 17.0494 36 18 36C18.9506 36 19.8882 35.9255 20.8125 35.7801V23.2031H25.0062Z" fill="white"/>
    </svg>
  )
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <defs>
        <linearGradient id="ig-grad" x1="6.5" y1="36" x2="29" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFC107" />
          <stop offset="0.5" stopColor="#F44336" />
          <stop offset="1" stopColor="#9C27B0" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#ig-grad)"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M18 9.5c-2.17 0-2.44.01-3.29.04-.86.03-1.45.14-1.97.3-.53.16-.98.38-1.43.83-.45.45-.67.9-.83 1.43-.16.52-.27 1.11-.3 1.97-.03.85-.04 1.12-.04 3.29s.01 2.44.04 3.29c.03.86.14 1.45.3 1.97.16.53.38.98.83 1.43.45.45.9.67 1.43.83.52.16 1.11.27 1.97.3.85.03 1.12.04 3.29.04s2.44-.01 3.29-.04c.86-.03 1.45-.14 1.97-.3.53-.16.98-.38 1.43-.83.45-.45.67-.9.83-1.43.16-.52.27-1.11.3-1.97.03-.85.04-1.12.04-3.29s-.01-2.44-.04-3.29c-.03-.86-.14-1.45-.3-1.97-.16-.53-.38-.98-.83-1.43-.45-.45-.9-.67-1.43-.83-.52-.16-1.11-.27-1.97-.3-.85-.03-1.12-.04-3.29-.04zm0 1.98c2.13 0 2.39.01 3.23.04.78.03 1.2.15 1.48.25.37.14.64.31.92.59.28.28.45.55.59.92.1.28.22.7.25 1.48.03.84.04 1.1.04 3.23s-.01 2.39-.04 3.23c-.03.78-.15 1.2-.25 1.48a2.45 2.45 0 01-.59.92 2.45 2.45 0 01-.92.59c-.28.1-.7.22-1.48.25-.84.03-1.1.04-3.23.04s-2.39-.01-3.23-.04c-.78-.03-1.2-.15-1.48-.25a2.45 2.45 0 01-.92-.59 2.45 2.45 0 01-.59-.92c-.1-.28-.22-.7-.25-1.48-.03-.84-.04-1.1-.04-3.23s.01-2.39.04-3.23c.03-.78.15-1.2.25-1.48.14-.37.31-.64.59-.92.28-.28.55-.45.92-.59.28-.1.7-.22 1.48-.25.84-.03 1.1-.04 3.23-.04zM18 14.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zm0 5.78a2.28 2.28 0 110-4.56 2.28 2.28 0 010 4.56zm5.67-6.39a.82.82 0 11-1.64 0 .82.82 0 011.64 0z" fill="white"/>
    </svg>
  )
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <path d="M35.398 9.94611C35.398 9.94611 35.0485 7.48545 33.9575 6.3776C32.5714 4.93339 31.0267 4.92484 30.3235 4.84102C25.3533 4.48169 17.9996 4.48169 17.9996 4.48169H17.9868C17.9868 4.48169 10.6331 4.48169 5.66284 4.84102C4.95966 4.92484 3.41496 4.93339 2.02888 6.3776C0.937922 7.48545 0.588439 9.94611 0.588439 9.94611C0.588439 9.94611 0.233519 12.8573 0.233519 15.7686V19.349C0.233519 22.2602 0.588439 25.1714 0.588439 25.1714C0.588439 25.1714 0.937922 27.6321 2.02888 28.74C3.41496 30.1842 5.25367 30.1384 6.02052 30.2926C11.3534 30.8037 17.9932 30.8166 17.9932 30.8166C17.9932 30.8166 25.3512 30.808 30.3214 30.4487C31.0245 30.3649 32.5693 30.3563 33.9553 28.9121C35.0463 27.8043 35.3958 25.3436 35.3958 25.3436C35.3958 25.3436 35.7508 22.4323 35.7508 19.5211V15.9407C35.7615 12.8573 35.398 9.94611 35.398 9.94611Z" fill="#FF0000"/>
      <path d="M14.364 21.9051L24.1678 16.2751L14.364 10.6451V21.9051Z" fill="white"/>
    </svg>
  )
}

function TiktokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <rect width="36" height="36" rx="10" fill="black"/>
      <path d="M19.5 8H22.42C22.65 10.15 24.16 12 26 12.2V15.2C24.41 15.11 23 14.43 21.9 13.33V22.61C21.9 26.69 18.59 30 14.51 30C10.43 30 7.12 26.69 7.12 22.61C7.12 18.53 10.43 15.22 14.51 15.22C14.93 15.22 15.34 15.26 15.74 15.34V18.43C15.35 18.31 14.94 18.25 14.51 18.25C12.1 18.25 10.15 20.2 10.15 22.61C10.15 25.02 12.1 26.97 14.51 26.97C16.92 26.97 18.87 25.02 18.87 22.61V8H19.5Z" fill="#69C9D0"/>
      <path d="M20.5 8H23.42C23.65 10.15 25.16 12 27 12.2V15.2C25.41 15.11 24 14.43 22.9 13.33V22.61C22.9 26.69 19.59 30 15.51 30C11.43 30 8.12 26.69 8.12 22.61C8.12 18.53 11.43 15.22 15.51 15.22C15.93 15.22 16.34 15.26 16.74 15.34V18.43C16.35 18.31 15.94 18.25 15.51 18.25C13.1 18.25 11.15 20.2 11.15 22.61C11.15 25.02 13.1 26.97 15.51 26.97C17.92 26.97 19.87 25.02 19.87 22.61V8H20.5Z" fill="#EE1D52"/>
      <path d="M20 7H22.92C23.15 9.15 24.66 11 26.5 11.2V14.2C24.91 14.11 23.5 13.43 22.4 12.33V21.61C22.4 25.69 19.09 29 15.01 29C10.93 29 7.62 25.69 7.62 21.61C7.62 17.53 10.93 14.22 15.01 14.22C15.43 14.22 15.84 14.26 16.24 14.34V17.43C15.85 17.31 15.44 17.25 15.01 17.25C12.6 17.25 10.65 19.2 10.65 21.61C10.65 24.02 12.6 25.97 15.01 25.97C17.42 25.97 19.37 24.02 19.37 21.61V7H20Z" fill="white"/>
    </svg>
  )
}

function ZaloIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" fill="none" {...props}>
      <rect width="36" height="36" rx="10" fill="#0068FF"/>
      <path d="M29.5 16.5C29.5 11.2533 24.796 7 19 7C13.204 7 8.5 11.2533 8.5 16.5C8.5 21.7467 13.204 26 19 26C20.02 26 21 25.8733 21.916 25.64L26.3333 27.9467L25.192 24.1867C27.836 22.48 29.5 19.6933 29.5 16.5ZM15.7 19.46H13V13.96H15.7733V13.96L15.7 19.46ZM16.4467 13.1533C15.604 13.1533 14.936 12.5067 14.936 11.7133C14.936 10.92 15.604 10.2733 16.4467 10.2733C17.2893 10.2733 17.9573 10.92 17.9573 11.7133C17.9573 12.5067 17.2893 13.1533 16.4467 13.1533ZM25.36 19.46H22.6V16.32C22.6 15.5733 22.3373 15.06 21.6373 15.06C21.1187 15.06 20.804 15.3933 20.6747 15.7133C20.6213 15.8333 20.604 16 20.604 16.1667V19.46H17.844V14.04H20.604V14.8133C20.9613 14.2667 21.6227 13.4667 23.08 13.4667C24.8813 13.4667 26.252 14.6133 26.252 17.06V19.46H25.36Z" fill="white"/>
    </svg>
  )
}

const SOCIAL_PLATFORMS = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: FacebookIcon },
  { key: 'instagram', label: 'Instagram', color: '#E1306C', icon: InstagramIcon },
  { key: 'zalo', label: 'Zalo', color: '#0068FF', icon: ZaloIcon },
  { key: 'tiktok', label: 'TikTok', color: '#010101', icon: TiktokIcon },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', icon: YoutubeIcon },
]

const DAYS_SHORT: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
}

const MAP_HEIGHT: Record<string, string> = {
  small: '200px', medium: '320px', large: '460px',
}

type HoursEntry = { day: string; open: boolean; from: string; to: string }

interface ContactRenderProps {
  config: ContactConfig
  business: {
    name?: string
    address?: string | null
    city?: string | null
    phone?: string | null
    email?: string | null
    opening_hours?: unknown
    social_links?: unknown
  }
}

export function ContactRender({ config, business }: ContactRenderProps) {
  const socials = (business.social_links ?? {}) as Record<string, string>
  const hours = (business.opening_hours ?? []) as HoursEntry[]
  const addressParts = [business.address, business.city].filter(Boolean)
  const fullAddress = addressParts.join(', ')
  const mapSrc = fullAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}&output=embed`
    : null

  const shownSocials = SOCIAL_PLATFORMS.filter(
    s => config.socials_shown.includes(s.key) && socials[s.key]
  )

  const textColor = config.text_color ?? '#111111'
  const labelColor = textColor + 'aa'



  const mapWidthFlex = config.layout === 'map_left' ? '1 1 300px' : '1 1 100%'
  const contentWidthFlex = (config.layout === 'map_left' && config.show_map) ? '1 1 300px' : '1 1 100%'

  return (
    <section>
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: '48px', alignItems: 'start' }}>

        {/* Map */}
        {config.show_map && mapSrc && (
          <div style={{ flex: mapWidthFlex, height: MAP_HEIGHT[config.map_height] ?? '320px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <iframe src={mapSrc} width="100%" height="100%" style={{ border: 0 }} loading="lazy" title="Business location map" />
          </div>
        )}
        {config.show_map && !mapSrc && (
          <div style={{ flex: mapWidthFlex, height: MAP_HEIGHT[config.map_height] ?? '320px', borderRadius: '16px', background: '#e8e8e8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa', fontSize: '14px' }}>
            Map will appear once an address is set in Business Profile
          </div>
        )}
        
        {/* Structured Content Layout */}
        <div style={{ flex: contentWidthFlex, display: 'flex', flexDirection: 'column', gap: '48px' }}>
          
          {/* Top Info Grid (Address + Phone/Email) */}
          {(config.show_address || config.show_phone || config.show_email) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
              {config.show_address && fullAddress && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 8px' }}>Address</p>
                  <p style={{ fontSize: '16px', fontWeight: 500, color: textColor, lineHeight: 1.6, margin: 0 }}>{fullAddress}</p>
                </div>
              )}
              
              {(config.show_phone || config.show_email) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {config.show_phone && business.phone && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 8px' }}>Phone</p>
                      <a href={`tel:${business.phone}`} style={{ fontSize: '18px', fontWeight: 600, color: textColor, textDecoration: 'none' }}>{business.phone}</a>
                    </div>
                  )}
                  {config.show_email && business.email && (
                    <div>
                      <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 8px' }}>Email</p>
                      <a href={`mailto:${business.email}`} style={{ fontSize: '16px', fontWeight: 500, color: textColor, textDecoration: 'none', wordBreak: 'break-all' }}>{business.email}</a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Secondary Grid (Hours + Socials) */}
          {(config.show_hours || shownSocials.length > 0) && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '32px' }}>
              {config.show_hours && hours.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 16px' }}>Opening Hours</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {hours.map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', maxWidth: '300px' }}>
                        <span style={{ fontWeight: 600, color: textColor }}>{DAYS_SHORT[h.day] ?? h.day}</span>
                        <span style={{ color: h.open ? textColor + 'cc' : labelColor, fontWeight: 500 }}>
                          {h.open ? `${h.from} – ${h.to}` : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {shownSocials.length > 0 && (
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', color: labelColor, textTransform: 'uppercase', margin: '0 0 16px' }}>Connect</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {shownSocials.map(s => {
                      const Icon = s.icon
                      return (
                        <a key={s.key} href={socials[s.key]} target="_blank" rel="noopener noreferrer"
                          className="transition-transform duration-200 hover:scale-110"
                          style={{ 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            width: '40px', height: '40px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.08))'
                          }}
                        >
                          <Icon style={{ width: '36px', height: '36px' }} />
                        </a>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </section>
  )
}
