'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { ImageIcon, Loader2, X } from 'lucide-react'
import { FooterConfig } from '../types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useTranslation } from '@/i18n/I18nProvider'
import { plainText } from '@/i18n/locale'
import { uploadImageToStorage } from '@/lib/image-utils'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { ColorSwatchField } from '@/components/shared/ColorSwatchField'
import { cn } from '@/lib/utils'
import {
  footerSpacingFromSize,
  inferFooterSpacingSize,
  type SectionSize,
} from '../spacing-presets'

export function FooterSettings({
  config,
  onChange,
  businessId,
  hasLogo = false,
}: {
  config: FooterConfig
  onChange: (config: FooterConfig) => void
  businessId: string
  /** Whether the business profile has a logo URL (toggle disabled when false) */
  hasLogo?: boolean
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const set = (k: keyof FooterConfig, v: FooterConfig[keyof FooterConfig]) => onChange({ ...config, [k]: v })
  const spacingSize = inferFooterSpacingSize(config)

  const SPACING_OPTIONS: { value: SectionSize; label: string }[] = [
    { value: 'small', label: t('pageBuilder.spacingSmall') },
    { value: 'medium', label: t('pageBuilder.spacingMedium') },
    { value: 'large', label: t('pageBuilder.spacingLarge') },
  ]

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${businessId}/footer-bg-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1920, maxHeight: 1080, quality: 0.85, targetSizeKB: 500,
      })
      set('background_image', url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function setSpacingSize(size: SectionSize) {
    onChange({
      ...config,
      spacing_size: size,
      ...footerSpacingFromSize(size),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">{t('footerBlock.footerSettings')}</h3>
        <p className="text-xs text-muted-foreground">{t('footerBlock.appearsBottom')}</p>
      </div>

      <div className="space-y-4">
        <div className={cn('space-y-1', !hasLogo && 'opacity-50')}>
          <div className="flex items-center justify-between gap-3">
            <Label
              htmlFor="footer-show-logo"
              className={cn('text-xs', hasLogo ? 'cursor-pointer' : 'cursor-not-allowed')}
            >
              {t('footerBlock.showLogo')}
            </Label>
            <Switch
              id="footer-show-logo"
              checked={hasLogo && Boolean(config.show_logo)}
              disabled={!hasLogo}
              onCheckedChange={v => set('show_logo', v)}
            />
          </div>
          {!hasLogo && (
            <p className="text-[11px] text-muted-foreground">{t('footerBlock.noLogoSet')}</p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="footer-show-business-name" className="text-xs cursor-pointer">{t('footerBlock.showBusinessName')}</Label>
          <Switch
            id="footer-show-business-name"
            checked={config.show_business_name}
            onCheckedChange={v => set('show_business_name', v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t('footerBlock.copyrightText')}</Label>
          <Input
            value={plainText(config.copyright_text)}
            onChange={e => set('copyright_text', e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('footerBlock.colours')}</Label>
        <div className="grid grid-cols-2 gap-3">
          <ColorSwatchField
            label={t('footerBlock.background')}
            value={config.background_color}
            fallback="#ffffff"
            onChange={v => set('background_color', v)}
          />
          <ColorSwatchField
            label={t('footerBlock.text')}
            value={config.text_color}
            fallback="#111111"
            onChange={v => set('text_color', v)}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('footerBlock.backgroundImage')}</Label>
        <p className="text-[11px] text-muted-foreground">{t('footerBlock.backgroundImageHelp')}</p>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
        {config.background_image ? (
          <div className="relative rounded-lg overflow-hidden border border-border aspect-[21/9] bg-muted group">
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
          <ImageUploader businessId={businessId} onImageSelect={(url) => set('background_image', url)}>
            {(openGallery) => (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex-1 h-20 rounded-lg border-2 border-dashed border-border hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
                >
                  {uploading
                    ? <Loader2 className="size-4 animate-spin" />
                    : <><ImageIcon className="size-4" /><span className="text-xs">{t('footerBlock.clickToUpload')}</span></>
                  }
                </button>
                <button
                  type="button"
                  onClick={openGallery}
                  className="w-1/3 h-20 rounded-lg border border-border hover:bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors"
                >
                  <ImageIcon className="size-4" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">{t('footerBlock.gallery')}</span>
                </button>
              </div>
            )}
          </ImageUploader>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('pageBuilder.sectionSpacing')}
        </Label>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {t('footerBlock.sectionSpacingHelp')}
        </p>
        <div className="flex gap-1.5">
          {SPACING_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSpacingSize(opt.value)}
              className={cn(
                'flex-1 py-1.5 rounded border text-xs transition-colors',
                spacingSize === opt.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:border-foreground/30',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
