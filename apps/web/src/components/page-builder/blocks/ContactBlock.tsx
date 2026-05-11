'use client'

import { MapPin, Phone, Mail, Clock, Share2 } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { ContactConfig, MapHeight } from '../types'
import type { Business } from '@/lib/business'
import { SOCIAL_LINKS_CONFIG } from '@/lib/constants'

// ─── Canvas Preview ────────────────────────────────────────────────────────────

export function ContactPreview({ config }: { config: ContactConfig }) {
  const items = [
    config.show_map && 'Map',
    config.show_phone && 'Phone',
    config.show_email && 'Email',
    config.show_address && 'Address',
    config.show_hours && 'Hours',
  ].filter(Boolean)

  return (
    <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30 p-3 space-y-2">
      {config.show_map && (
        <div className="w-full h-12 bg-muted rounded flex items-center justify-center">
          <MapPin className="size-4 text-muted-foreground/40" />
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {items.filter(Boolean).map(item => (
          <span key={item as string} className="text-[10px] px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {item}
          </span>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground/60">
        Socials: {config.socials_shown.length > 0 ? config.socials_shown.join(', ') : 'none'}
      </p>
    </div>
  )
}

// ─── Settings Form ─────────────────────────────────────────────────────────────

const MAP_HEIGHTS: { value: MapHeight; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
]

function ToggleRow({
  id, label, checked, onCheckedChange,
  icon,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  icon?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <Label htmlFor={id} className="text-sm flex items-center gap-2 cursor-pointer font-normal">
        {icon}
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

export function ContactSettings({
  config,
  business,
  onChange,
}: {
  config: ContactConfig
  business: Business
  onChange: (c: ContactConfig) => void
}) {
  function set<K extends keyof ContactConfig>(key: K, value: ContactConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  function toggleSocial(key: string) {
    const current = config.socials_shown
    set(
      'socials_shown',
      current.includes(key) ? current.filter(k => k !== key) : [...current, key]
    )
  }

  // Only show socials that have a value configured on the business profile
  const availableSocials = SOCIAL_LINKS_CONFIG.filter(
    s => (business.social_links as Record<string, string>)?.[s.key]
  )

  return (
    <div className="space-y-5">

      {/* Layout */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layout</Label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => set('layout', 'vertical')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              config.layout !== 'map_left'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30'
            )}
          >
            Stacked
          </button>
          <button
            type="button"
            onClick={() => set('layout', 'map_left')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              config.layout === 'map_left'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30'
            )}
          >
            Map Left
          </button>
        </div>
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Appearance</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.background_color ?? '#f8f8f8'}
                onChange={e => set('background_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
                title="Background colour"
              />
              <span className="text-xs font-mono text-muted-foreground">{config.background_color ?? '#f8f8f8'}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Text colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.text_color ?? '#111111'}
                onChange={e => set('text_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
                title="Text colour"
              />
              <span className="text-xs font-mono text-muted-foreground">{config.text_color ?? '#111111'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onChange({ ...config, background_color: '#f8f8f8', text_color: '#111111' })}
            className="px-2 py-1 rounded border border-border text-[11px] hover:border-foreground/30 transition-colors">Light</button>
          <button type="button" onClick={() => onChange({ ...config, background_color: '#1a1a2e', text_color: '#ffffff' })}
            className="px-2 py-1 rounded border border-border text-[11px] hover:border-foreground/30 transition-colors bg-gray-900 text-white">Dark</button>
        </div>
      </div>

      <Separator />

      {/* Map */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Map</Label>
        <ToggleRow
          id="contact-map"
          label="Show map"
          checked={config.show_map}
          onCheckedChange={v => set('show_map', v)}
          icon={<MapPin className="size-3.5 text-muted-foreground" />}
        />
        {config.show_map && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-xs">Map height</Label>
            <div className="flex gap-1.5">
              {MAP_HEIGHTS.map(h => (
                <button
                  key={h.value}
                  type="button"
                  onClick={() => set('map_height', h.value)}
                  className={cn(
                    'flex-1 py-1.5 rounded border text-xs transition-colors',
                    config.map_height === h.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
            {!business.address && (
              <p className="text-xs text-amber-600">
                No address set in business profile — map will not display.
              </p>
            )}
          </div>
        )}
      </div>

      <Separator />

      {/* Contact info toggles */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact info</Label>
        <ToggleRow
          id="contact-phone"
          label="Phone number"
          checked={config.show_phone}
          onCheckedChange={v => set('show_phone', v)}
          icon={<Phone className="size-3.5 text-muted-foreground" />}
        />
        {config.show_phone && !business.phone && (
          <p className="text-xs text-amber-600 pl-6">No phone in business profile.</p>
        )}
        <ToggleRow
          id="contact-email"
          label="Email address"
          checked={config.show_email}
          onCheckedChange={v => set('show_email', v)}
          icon={<Mail className="size-3.5 text-muted-foreground" />}
        />
        {config.show_email && !business.email && (
          <p className="text-xs text-amber-600 pl-6">No email in business profile.</p>
        )}
        <ToggleRow
          id="contact-address"
          label="Physical address"
          checked={config.show_address}
          onCheckedChange={v => set('show_address', v)}
          icon={<MapPin className="size-3.5 text-muted-foreground" />}
        />
        <ToggleRow
          id="contact-hours"
          label="Opening hours"
          checked={config.show_hours}
          onCheckedChange={v => set('show_hours', v)}
          icon={<Clock className="size-3.5 text-muted-foreground" />}
        />
      </div>

      <Separator />

      {/* Social icons */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Social Icons</Label>

        {availableSocials.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No social links set on the business profile yet. Add them in the Business settings.
          </p>
        ) : (
            <div className="space-y-1">
              {availableSocials.map(s => (
                <div key={s.key} className="flex items-center justify-between py-1">
                  <Label htmlFor={`social-show-${s.key}`} className="text-sm font-normal cursor-pointer">
                    {s.label}
                  </Label>
                  <Switch
                    id={`social-show-${s.key}`}
                    checked={config.socials_shown.includes(s.key)}
                    onCheckedChange={() => toggleSocial(s.key)}
                  />
                </div>
              ))}
            </div>
        )}
      </div>
    </div>
  )
}
