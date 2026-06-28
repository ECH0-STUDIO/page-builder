'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImageToStorage, validateImageDimensions } from '@/lib/image-utils'
import { ImageUploader } from '@/components/shared/ImageUploader'
import type { ThemeSettings, PublishingSettings, SeoI18nStore } from '../types'
import { useTranslation } from '@/i18n/I18nProvider'
import { getLocalizedField, setLocalizedField } from '@/i18n/locale'
import { useLocaleEdit } from '@/components/i18n/LocaleEditContext'
import { LocaleFieldLabel } from '@/components/i18n/LocaleFieldLabel'

interface GlobalSettingsPanelProps {
  theme: ThemeSettings | null
  publishing: PublishingSettings | null
  onThemeChange: (updated: Partial<ThemeSettings>) => void
  onPublishingChange: (updated: Partial<PublishingSettings>) => void
}

const FONTS = ['Inter', 'Outfit', 'Playfair Display', 'Lora', 'Space Grotesk', 'Roboto Mono']

function legacySeoMap(legacy: string | null | undefined, enabledLocales: string[]) {
  const text = legacy ?? ''
  const map: Record<string, string> = {}
  for (const l of enabledLocales) map[l] = text
  return map
}

function readSeoField(
  seoI18n: SeoI18nStore | null | undefined,
  field: keyof SeoI18nStore,
  legacy: string | null | undefined,
  locale: string,
  enabledLocales: string[],
): string {
  const map = seoI18n?.[field]
  if (map) return getLocalizedField(map, locale, enabledLocales)
  return locale === enabledLocales[0] ? (legacy ?? '') : ''
}

export function GlobalSettingsPanel({
  theme,
  publishing,
  onThemeChange,
  onPublishingChange,
}: GlobalSettingsPanelProps) {
  const { t } = useTranslation()
  const { editLocale, enabledLocales, primaryLocale } = useLocaleEdit()
  const thm = theme || {} as ThemeSettings
  const p = publishing || {} as PublishingSettings
  const seoI18n = p.seo_i18n ?? {}

  const faviconRef = useRef<HTMLInputElement>(null)
  const webclipRef = useRef<HTMLInputElement>(null)
  const ogImageRef = useRef<HTMLInputElement>(null)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingWebclip, setUploadingWebclip] = useState(false)
  const [uploadingOg, setUploadingOg] = useState(false)

  function updateSeoField(
    field: keyof SeoI18nStore,
    text: string,
    legacyKey: 'seo_title' | 'seo_description' | 'og_image_url',
  ) {
    const legacy = p[legacyKey]
    const currentMap = seoI18n[field] ?? legacySeoMap(legacy, enabledLocales)
    const nextMap = setLocalizedField(currentMap, editLocale, text, enabledLocales, primaryLocale)
    const nextSeo: SeoI18nStore = { ...seoI18n, [field]: nextMap }
    const patch: Partial<PublishingSettings> = { seo_i18n: nextSeo }
    if (editLocale === primaryLocale) {
      patch[legacyKey] = text || null
    }
    onPublishingChange(patch)
  }

  async function handleUploadFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isValid = await validateImageDimensions(file, { exactWidth: 32, exactHeight: 32 })
    if (!isValid) {
      toast.error('Favicon image must be exactly 32x32 pixels')
      if (faviconRef.current) faviconRef.current.value = ''
      return
    }
    setUploadingFavicon(true)
    try {
      const path = `${p.business_id}/favicon-${Date.now()}.png`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 48, maxHeight: 48, quality: 1, targetSizeKB: 50, format: 'image/png'
      })
      onPublishingChange({ favicon_url: url })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFavicon(false)
      if (faviconRef.current) faviconRef.current.value = ''
    }
  }

  async function handleUploadWebclip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isValid = await validateImageDimensions(file, { exactWidth: 180, exactHeight: 180 })
    if (!isValid) {
      toast.error('Webclip image must be exactly 180x180 pixels')
      if (webclipRef.current) webclipRef.current.value = ''
      return
    }
    setUploadingWebclip(true)
    try {
      const path = `${p.business_id}/webclip-${Date.now()}.png`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 256, maxHeight: 256, quality: 1, targetSizeKB: 200, format: 'image/png'
      })
      onPublishingChange({ apple_touch_icon_url: url })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingWebclip(false)
      if (webclipRef.current) webclipRef.current.value = ''
    }
  }

  async function handleUploadOgImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingOg(true)
    try {
      const path = `${p.business_id}/og-${editLocale}-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1200, maxHeight: 630, quality: 0.85, targetSizeKB: 400,
      })
      updateSeoField('og_image_url', url, 'og_image_url')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingOg(false)
      if (ogImageRef.current) ogImageRef.current.value = ''
    }
  }

  const seoTitle = readSeoField(seoI18n, 'title', p.seo_title, editLocale, enabledLocales)
  const seoDescription = readSeoField(seoI18n, 'description', p.seo_description, editLocale, enabledLocales)
  const ogImageUrl = readSeoField(seoI18n, 'og_image_url', p.og_image_url, editLocale, enabledLocales)

  return (
    <div className="space-y-8 p-4">
      {/* ── SEO & Meta (per content locale) ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">{t('pageBuilder.globalSeo')}</h3>
        <p className="text-[11px] text-muted-foreground leading-snug">{t('pageBuilder.perLocaleFieldsHint')}</p>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <LocaleFieldLabel>{t('pageBuilder.pageTitle')}</LocaleFieldLabel>
            <Input
              value={seoTitle}
              onChange={e => updateSeoField('title', e.target.value, 'seo_title')}
              placeholder={t('pageBuilder.pageTitlePlaceholder')}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <LocaleFieldLabel>{t('pageBuilder.metaDesc')}</LocaleFieldLabel>
            <Textarea
              value={seoDescription}
              onChange={e => updateSeoField('description', e.target.value, 'seo_description')}
              placeholder={t('pageBuilder.metaDescPlaceholder')}
              className="text-xs min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <LocaleFieldLabel>{t('pageBuilder.ogImage')}</LocaleFieldLabel>
            <div className="flex gap-2 w-full">
              {ogImageUrl && (
                <div className="size-14 rounded-md border border-border overflow-hidden shrink-0 bg-white relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ogImageUrl} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateSeoField('og_image_url', '', 'og_image_url')}
                    className="absolute inset-0 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => ogImageRef.current?.click()}
                disabled={uploadingOg}
                className="flex-1 justify-start gap-2 h-10 px-3"
              >
                {uploadingOg ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ImageIcon className="size-4 text-muted-foreground/50" />}
                <span className="text-xs font-normal truncate">
                  {uploadingOg ? t('pageBuilder.uploading') : ogImageUrl ? t('pageBuilder.replace') : t('pageBuilder.uploadOgImage')}
                </span>
              </Button>
              <input type="file" accept="image/*" className="hidden" ref={ogImageRef} onChange={handleUploadOgImage} />
            </div>
          </div>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('pageBuilder.favicon')}</Label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 w-full">
                  {p.favicon_url && (
                    <div className="size-10 rounded-md border border-border overflow-hidden shrink-0 bg-white relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.favicon_url} alt="" className="w-full h-full object-contain" />
                      <button
                        type="button"
                        onClick={() => onPublishingChange({ favicon_url: null })}
                        className="absolute inset-0 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  )}
                  <ImageUploader businessId={p.business_id} onImageSelect={async (url) => {
                    const isValid = await validateImageDimensions(url, { exactWidth: 32, exactHeight: 32 })
                    if (!isValid) {
                      toast.error('Favicon image must be exactly 32x32 pixels')
                      return
                    }
                    onPublishingChange({ favicon_url: url })
                  }}>
                    {(openGallery) => (
                      <div className="flex-1 flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => faviconRef.current?.click()}
                          disabled={uploadingFavicon}
                          className="flex-1 justify-start gap-2 h-10 px-3"
                        >
                          {uploadingFavicon ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ImageIcon className="size-4 text-muted-foreground/50" />}
                          <span className="text-xs font-normal truncate">
                            {uploadingFavicon ? t('pageBuilder.uploading') : p.favicon_url ? t('pageBuilder.replace') : t('pageBuilder.uploadPng')}
                          </span>
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={openGallery} className="h-10 px-3">
                          <ImageIcon className="size-4" />
                        </Button>
                      </div>
                    )}
                  </ImageUploader>
                  <input type="file" accept="image/*" className="hidden" ref={faviconRef} onChange={handleUploadFavicon} />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('pageBuilder.webclip')}</Label>
              <div className="flex gap-2 w-full">
                {p.apple_touch_icon_url && (
                  <div className="size-10 rounded-md border border-border overflow-hidden shrink-0 bg-white relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.apple_touch_icon_url} alt="" className="w-full h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => onPublishingChange({ apple_touch_icon_url: null })}
                      className="absolute inset-0 bg-black/50 hover:bg-black/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                )}
                <ImageUploader businessId={p.business_id} onImageSelect={async (url) => {
                  const isValid = await validateImageDimensions(url, { exactWidth: 180, exactHeight: 180 })
                  if (!isValid) {
                    toast.error('Webclip image must be exactly 180x180 pixels')
                    return
                  }
                  onPublishingChange({ apple_touch_icon_url: url })
                }}>
                  {(openGallery) => (
                    <div className="flex-1 flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => webclipRef.current?.click()}
                        disabled={uploadingWebclip}
                        className="flex-1 justify-start gap-2 h-10 px-3"
                      >
                        {uploadingWebclip ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <ImageIcon className="size-5 text-muted-foreground/50" />}
                        <span className="text-xs font-normal truncate">
                          {uploadingWebclip ? t('pageBuilder.uploading') : p.apple_touch_icon_url ? t('pageBuilder.replace') : t('pageBuilder.uploadPng')}
                        </span>
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={openGallery} className="h-10 px-3">
                        <ImageIcon className="size-4" />
                      </Button>
                    </div>
                  )}
                </ImageUploader>
                <input type="file" accept="image/*" className="hidden" ref={webclipRef} onChange={handleUploadWebclip} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Analytics ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">{t('pageBuilder.analytics')}</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.gaId')}</Label>
            <Input
              value={p.google_analytics_id || ''}
              onChange={e => onPublishingChange({ google_analytics_id: e.target.value })}
              placeholder="G-XXXXXXXXXX"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.fbPixel')}</Label>
            <Input
              value={p.facebook_pixel_id || ''}
              onChange={e => onPublishingChange({ facebook_pixel_id: e.target.value })}
              placeholder="1234567890"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.gscTag')}</Label>
            <Input
              value={p.gsc_verification || ''}
              onChange={e => onPublishingChange({ gsc_verification: e.target.value })}
              placeholder={t('pageBuilder.gscPlaceholder')}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Theme (Colors & Typography) ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">{t('pageBuilder.designTheme')}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('pageBuilder.brandColor')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={thm.primary_color || '#E85D26'}
                  onChange={e => onThemeChange({ primary_color: e.target.value })}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{thm.primary_color}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{t('pageBuilder.background')}</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={thm.background_color || '#FFFFFF'}
                  onChange={e => onThemeChange({ background_color: e.target.value })}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{thm.background_color}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.headingFont')}</Label>
            <Select value={thm.heading_font_family || 'Inter'} onValueChange={v => onThemeChange({ heading_font_family: v })}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.bodyFont')}</Label>
            <Select value={thm.font_family || 'Inter'} onValueChange={v => onThemeChange({ font_family: v })}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
