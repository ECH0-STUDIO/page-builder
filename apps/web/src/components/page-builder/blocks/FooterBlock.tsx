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
import { SpacingControls } from './SpacingControls'

export function FooterSettings({
  config,
  onChange,
  businessId,
}: {
  config: FooterConfig
  onChange: (config: FooterConfig) => void
  businessId: string
}) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const set = (k: keyof FooterConfig, v: FooterConfig[keyof FooterConfig]) => onChange({ ...config, [k]: v })

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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">{t('footerBlock.footerSettings')}</h3>
        <p className="text-xs text-muted-foreground">{t('footerBlock.appearsBottom')}</p>
      </div>

      <div className="space-y-4">
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
          <div className="space-y-1.5">
            <Label className="text-xs">{t('footerBlock.background')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.background_color}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('footerBlock.text')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.text_color}
                onChange={e => set('text_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.text_color}</span>
            </div>
          </div>
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
                  <span className="text-[10px] uppercase font-bold tracking-wider">Gallery</span>
                </button>
              </div>
            )}
          </ImageUploader>
        )}
      </div>

      <Separator />

      <SpacingControls
        paddingOnly
        spacing={{
          padding_top: config.padding_top ?? 32,
          padding_right: config.padding_right ?? 24,
          padding_bottom: config.padding_bottom ?? 32,
          padding_left: config.padding_left ?? 24,
          margin_top: 0,
          margin_bottom: 0,
        }}
        onChange={s => onChange({
          ...config,
          padding_top: s.padding_top,
          padding_right: s.padding_right,
          padding_bottom: s.padding_bottom,
          padding_left: s.padding_left,
        })}
      />
    </div>
  )
}
