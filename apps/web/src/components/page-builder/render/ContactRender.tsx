/**
 * ContactRender — shared between editor canvas and live page.
 * Uses config.background_color + config.text_color for theming.
 * Shows a VietQR payment card when paymentSettings are configured.
 */

import type { IconType } from 'react-icons'
import { SiFacebook, SiInstagram, SiZalo, SiTiktok, SiYoutube } from 'react-icons/si'
import type { ContactConfig } from '../types'

const SOCIAL_PLATFORMS: { key: string; label: string; color: string; icon: IconType }[] = [
  { key: 'facebook', label: 'Facebook', color: '#1877F2', icon: SiFacebook },
  { key: 'instagram', label: 'Instagram', color: '#E4405F', icon: SiInstagram },
  { key: 'zalo', label: 'Zalo', color: '#0068FF', icon: SiZalo },
  { key: 'tiktok', label: 'TikTok', color: '#000000', icon: SiTiktok },
  { key: 'youtube', label: 'YouTube', color: '#FF0000', icon: SiYoutube },
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
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                    {shownSocials.map(s => {
                      const Icon = s.icon
                      return (
                        <a
                          key={s.key}
                          href={socials[s.key]}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={s.label}
                          className="transition-transform duration-200 hover:scale-110"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            flexShrink: 0,
                            color: s.color,
                          }}
                        >
                          <Icon size={28} aria-hidden />
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
