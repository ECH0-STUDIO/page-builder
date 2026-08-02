'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { MapPin, Phone, Mail, Clock, ImageIcon, Loader2, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import type { ContactBackground, ContactConfig, MapHeight } from '../types'
import type { Business } from '@/lib/business'
import { SOCIAL_LINKS_CONFIG } from '@/lib/constants'
import { ColorSwatchField } from '@/components/shared/ColorSwatchField'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { uploadImageToStorage } from '@/lib/image-utils'

// ─── Canvas Preview ────────────────────────────────────────────────────────────

export function ContactPreview({ config }: { config: ContactConfig }) {
  const { t } = useTranslation()
  const items = [
    config.show_map && t('contactBlock.map'),
    config.show_phone && t('contactBlock.phoneNumber'),
    config.show_email && t('contactBlock.emailAddress'),
    config.show_address && t('contactBlock.physicalAddress'),
    config.show_hours && t('contactBlock.openingHours'),
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
        {t('contactBlock.socialsPreview')} {config.socials_shown.length > 0 ? config.socials_shown.join(', ') : 'none'}
      </p>
    </div>
  )
}

// ─── Settings Form ─────────────────────────────────────────────────────────────

function ToggleRow({
  id, label, checked, onCheckedChange, disabled, hint, icon,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (v: boolean) => void
  disabled?: boolean
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="space-y-1 py-1.5">
      <div className={cn('flex items-center justify-between', disabled && 'opacity-50')}>
        <Label
          htmlFor={id}
          className={cn(
            'text-sm flex items-center gap-2 font-normal',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer',
          )}
        >
          {icon}
          {label}
        </Label>
        <Switch
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={onCheckedChange}
        />
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground pl-6 leading-relaxed">{hint}</p>
      )}
    </div>
  )
}

type HoursEntry = { day: string; open: boolean; from: string; to: string }

export function ContactSettings({
  config,
  business,
  onChange,
}: {
  config: ContactConfig
  business: Business
  onChange: (c: ContactConfig) => void
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const MAP_HEIGHTS: { value: MapHeight; label: string }[] = [
    { value: 'small', label: t('contactBlock.small') },
    { value: 'medium', label: t('contactBlock.medium') },
    { value: 'large', label: t('contactBlock.large') },
  ]

  const BACKGROUNDS: { value: ContactBackground; label: string }[] = [
    { value: 'solid', label: t('contactBlock.backgroundSolid') },
    { value: 'gradient', label: t('contactBlock.backgroundGradient') },
    { value: 'image', label: t('contactBlock.backgroundImage') },
  ]

  function set<K extends keyof ContactConfig>(key: K, value: ContactConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  function toggleSocial(key: string) {
    const current = config.socials_shown
    set(
      'socials_shown',
      current.includes(key) ? current.filter(k => k !== key) : [...current, key],
    )
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${business.id}/contact-bg-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1920, maxHeight: 1080, quality: 0.85, targetSizeKB: 500,
      })
      onChange({
        ...config,
        background: 'image',
        background_image: url,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const socialLinks = (business.social_links ?? {}) as Record<string, string>
  const hours = (business.opening_hours ?? []) as HoursEntry[]
  const hasPhone = Boolean(business.phone?.trim())
  const hasEmail = Boolean(business.email?.trim())
  const hasAddress = Boolean(business.address?.trim() || business.city?.trim())
  const hasHours = Array.isArray(hours) && hours.length > 0
  const hasMapLocation = Boolean(
    business.google_maps_url?.trim() || business.address?.trim() || business.city?.trim(),
  )
  const background = config.background ?? 'solid'

  return (
    <div className="space-y-5">

      {/* Layout */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('contactBlock.layout')}</Label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => set('layout', 'vertical')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              config.layout !== 'map_left'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30',
            )}
          >
            {t('contactBlock.stacked')}
          </button>
          <button
            type="button"
            onClick={() => set('layout', 'map_left')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              config.layout === 'map_left'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30',
            )}
          >
            {t('contactBlock.mapLeft')}
          </button>
        </div>
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('contactBlock.appearance')}</Label>

        <div className="space-y-1.5">
          <Label className="text-xs">{t('contactBlock.background')}</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKGROUNDS.map(b => (
              <button
                key={b.value}
                type="button"
                onClick={() => set('background', b.value)}
                className={cn(
                  'py-1.5 rounded border text-xs transition-colors',
                  background === b.value
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {background === 'solid' && (
          <ColorSwatchField
            label={t('contactBlock.backgroundColour')}
            value={config.background_color ?? '#f8f8f8'}
            fallback="#f8f8f8"
            onChange={v => set('background_color', v)}
          />
        )}

        {background === 'gradient' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.gradient_from ?? '#f8f8f8'}
                onChange={e => set('gradient_from', e.target.value)}
                className="size-7 rounded border border-border cursor-pointer"
                title={t('contactBlock.gradientStart')}
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="color"
                value={config.gradient_to ?? '#e8e8e8'}
                onChange={e => set('gradient_to', e.target.value)}
                className="size-7 rounded border border-border cursor-pointer"
                title={t('contactBlock.gradientEnd')}
              />
              <div
                className="flex-1 h-7 rounded-md border border-border"
                style={{
                  background: `linear-gradient(to right, ${config.gradient_from ?? '#f8f8f8'}, ${config.gradient_to ?? '#e8e8e8'})`,
                }}
              />
            </div>
          </div>
        )}

        {background === 'image' && (
          <div className="space-y-2">
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
            {config.background_image ? (
              <div className="relative rounded-lg overflow-hidden border border-border aspect-video bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={config.background_image} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('background_image', '')}
                  className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <ImageUploader businessId={business.id} onImageSelect={(url) => onChange({ ...config, background: 'image', background_image: url })}>
                {(openGallery) => (
                  <div className="flex gap-2 w-full">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex-1 h-24 rounded-lg border-2 border-dashed border-border hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
                    >
                      {uploading
                        ? <Loader2 className="size-4 animate-spin" />
                        : (
                          <>
                            <ImageIcon className="size-4" />
                            <span className="text-xs">{t('contactBlock.clickToUpload')}</span>
                          </>
                        )}
                    </button>
                    <button
                      type="button"
                      onClick={openGallery}
                      className="w-1/3 h-24 rounded-lg border border-border hover:bg-muted flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
                    >
                      <ImageIcon className="size-5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">{t('contactBlock.gallery')}</span>
                    </button>
                  </div>
                )}
              </ImageUploader>
            )}
            {config.background_image && (
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {t('contactBlock.overlayOpacity')}: {config.overlay_opacity ?? 0}%
                </Label>
                <Slider
                  min={0}
                  max={100}
                  step={5}
                  value={[Math.min(100, Math.max(0, config.overlay_opacity ?? 0))]}
                  onValueChange={([v]) => set('overlay_opacity', v)}
                  className="mt-1"
                />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {t('contactBlock.overlayOpacityHelp')}
                </p>
              </div>
            )}
          </div>
        )}

        <ColorSwatchField
          label={t('contactBlock.textColour')}
          value={config.text_color ?? '#111111'}
          fallback="#111111"
          onChange={v => set('text_color', v)}
        />

        <div className="flex gap-1.5">
          {([
            { bg: '#f8f8f8', text: '#111111', label: t('contactBlock.light') },
            { bg: '#1a1a2e', text: '#ffffff', label: t('contactBlock.dark') },
          ] as { bg: string; text: string; label: string }[]).map(preset => {
            const active =
              background === 'solid'
              && config.background_color === preset.bg
              && config.text_color === preset.text
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => onChange({
                  ...config,
                  background: 'solid',
                  background_color: preset.bg,
                  text_color: preset.text,
                })}
                className={cn(
                  'px-2 py-1 rounded border text-[11px] transition-colors',
                  active
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border hover:border-foreground/30',
                )}
              >
                {preset.label}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Map */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('contactBlock.map')}</Label>
        <ToggleRow
          id="contact-map"
          label={t('contactBlock.showMap')}
          checked={hasMapLocation && config.show_map}
          disabled={!hasMapLocation}
          hint={!hasMapLocation ? t('contactBlock.noAddressSet') : undefined}
          onCheckedChange={v => set('show_map', v)}
          icon={<MapPin className="size-3.5 text-muted-foreground" />}
        />
        {hasMapLocation && config.show_map && (
          <div className="space-y-1.5 pl-6">
            <Label className="text-xs">{t('contactBlock.mapHeight')}</Label>
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
                      : 'border-border hover:border-foreground/30',
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Contact info toggles */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('contactBlock.contactInfo')}</Label>
        <ToggleRow
          id="contact-phone"
          label={t('contactBlock.phoneNumber')}
          checked={hasPhone && config.show_phone}
          disabled={!hasPhone}
          hint={!hasPhone ? t('contactBlock.noPhoneSet') : undefined}
          onCheckedChange={v => set('show_phone', v)}
          icon={<Phone className="size-3.5 text-muted-foreground" />}
        />
        <ToggleRow
          id="contact-email"
          label={t('contactBlock.emailAddress')}
          checked={hasEmail && config.show_email}
          disabled={!hasEmail}
          hint={!hasEmail ? t('contactBlock.noEmailSet') : undefined}
          onCheckedChange={v => set('show_email', v)}
          icon={<Mail className="size-3.5 text-muted-foreground" />}
        />
        <ToggleRow
          id="contact-address"
          label={t('contactBlock.physicalAddress')}
          checked={hasAddress && config.show_address}
          disabled={!hasAddress}
          hint={!hasAddress ? t('contactBlock.noAddressInfoSet') : undefined}
          onCheckedChange={v => set('show_address', v)}
          icon={<MapPin className="size-3.5 text-muted-foreground" />}
        />
        <ToggleRow
          id="contact-hours"
          label={t('contactBlock.openingHours')}
          checked={hasHours && config.show_hours}
          disabled={!hasHours}
          hint={!hasHours ? t('contactBlock.noHoursSet') : undefined}
          onCheckedChange={v => set('show_hours', v)}
          icon={<Clock className="size-3.5 text-muted-foreground" />}
        />
      </div>

      <Separator />

      {/* Social icons — show all platforms; disable ones without a profile URL */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('contactBlock.socialIcons')}</Label>
        <div className="space-y-1">
          {SOCIAL_LINKS_CONFIG.map(s => {
            const hasLink = Boolean(socialLinks[s.key]?.trim())
            return (
              <ToggleRow
                key={s.key}
                id={`social-show-${s.key}`}
                label={s.label}
                checked={hasLink && config.socials_shown.includes(s.key)}
                disabled={!hasLink}
                hint={!hasLink ? t('contactBlock.socialMissingHint') : undefined}
                onCheckedChange={() => toggleSocial(s.key)}
              />
            )
          })}
        </div>
        {SOCIAL_LINKS_CONFIG.every(s => !socialLinks[s.key]?.trim()) && (
          <p className="text-xs text-muted-foreground">{t('contactBlock.noSocialsSet')}</p>
        )}
      </div>
    </div>
  )
}
