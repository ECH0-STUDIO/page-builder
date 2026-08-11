'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImageToStorage, validateImageDimensions } from '@/lib/image-utils'
import { ImageUploader } from '@/components/shared/ImageUploader'
import type { ThemeSettings, PublishingSettings } from '../types'
import { useTranslation } from '@/i18n/I18nProvider'
import { ThemeAppearanceFields } from '@/components/shared/ThemeAppearanceFields'
import {
  isValidFacebookPixelId,
  isValidGoogleAnalyticsId,
  isValidGscVerification,
  isValidTikTokPixelId,
} from '@/lib/tracking-ids'

interface GlobalSettingsPanelProps {
  theme: ThemeSettings | null
  publishing: PublishingSettings | null
  onThemeChange: (updated: Partial<ThemeSettings>) => void
  onPublishingChange: (updated: Partial<PublishingSettings>) => void
}

/**
 * Local draft for text fields so typing does not lift state into PuckEditorShell
 * on every keystroke (that remounts Puck UI and steals focus).
 */
function useDeferredPublishingField(
  external: string | null | undefined,
  key: keyof PublishingSettings,
  onPublishingChange: (updated: Partial<PublishingSettings>) => void,
) {
  const [value, setValue] = useState(external || '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestRef = useRef(value)
  latestRef.current = value

  useEffect(() => {
    // Don't clobber in-progress typing when a deferred save lands.
    if (timerRef.current) return
    const next = external || ''
    if (next !== latestRef.current) {
      setValue(next)
      latestRef.current = next
    }
  }, [external])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const flush = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const next = latestRef.current.trim() ? latestRef.current : null
    const prev = external || null
    if (next !== prev) {
      onPublishingChange({ [key]: next } as Partial<PublishingSettings>)
    }
  }, [external, key, onPublishingChange])

  const onChange = useCallback(
    (next: string) => {
      setValue(next)
      latestRef.current = next
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        const saved = next.trim() ? next : null
        onPublishingChange({ [key]: saved } as Partial<PublishingSettings>)
      }, 600)
    },
    [key, onPublishingChange],
  )

  return { value, onChange, onBlur: flush }
}

export function GlobalSettingsPanel({
  theme,
  publishing,
  onThemeChange,
  onPublishingChange,
}: GlobalSettingsPanelProps) {
  const { t } = useTranslation()
  const thm = theme || {} as ThemeSettings
  const p = publishing || {} as PublishingSettings

  const faviconRef = useRef<HTMLInputElement>(null)
  const webclipRef = useRef<HTMLInputElement>(null)
  const ogImageRef = useRef<HTMLInputElement>(null)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingWebclip, setUploadingWebclip] = useState(false)
  const [uploadingOg, setUploadingOg] = useState(false)

  const seoTitle = useDeferredPublishingField(p.seo_title, 'seo_title', onPublishingChange)
  const seoDesc = useDeferredPublishingField(p.seo_description, 'seo_description', onPublishingChange)
  const gaId = useDeferredPublishingField(p.google_analytics_id, 'google_analytics_id', onPublishingChange)
  const fbPixel = useDeferredPublishingField(p.facebook_pixel_id, 'facebook_pixel_id', onPublishingChange)
  const ttPixel = useDeferredPublishingField(p.tiktok_pixel_id, 'tiktok_pixel_id', onPublishingChange)
  const gscTag = useDeferredPublishingField(p.gsc_verification, 'gsc_verification', onPublishingChange)

  async function handleUploadFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isValid = await validateImageDimensions(file, { exactWidth: 48, exactHeight: 48 })
    if (!isValid) {
      toast.error(t('publishing.faviconMustBeSquare'))
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
      const path = `${p.business_id}/og-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1200, maxHeight: 630, quality: 0.85, targetSizeKB: 400
      })
      onPublishingChange({ og_image_url: url })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingOg(false)
      if (ogImageRef.current) ogImageRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* ── SEO ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm font-sans">{t('pageBuilder.globalSeo')}</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.pageTitle')}</Label>
            <Input
              value={seoTitle.value}
              onChange={e => seoTitle.onChange(e.target.value)}
              onBlur={seoTitle.onBlur}
              placeholder={t('pageBuilder.pageTitlePlaceholder')}
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.metaDesc')}</Label>
            <Textarea
              value={seoDesc.value}
              onChange={e => seoDesc.onChange(e.target.value)}
              onBlur={seoDesc.onBlur}
              placeholder={t('pageBuilder.metaDescPlaceholder')}
              className="text-xs min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.ogImage')}</Label>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {t('pageBuilder.ogImageHint')}
            </p>
            <div className="flex gap-2 w-full">
              {p.og_image_url && (
                <div className="size-14 rounded-md border border-border overflow-hidden shrink-0 bg-white relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.og_image_url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => onPublishingChange({ og_image_url: null })}
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
                  {uploadingOg ? t('pageBuilder.uploading') : p.og_image_url ? t('pageBuilder.replace') : t('pageBuilder.uploadOgImage')}
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
                    const isValid = await validateImageDimensions(url, { exactWidth: 48, exactHeight: 48 })
                    if (!isValid) {
                      toast.error(t('publishing.faviconMustBeSquare'))
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
                            {uploadingFavicon ? t('pageBuilder.uploading') : p.favicon_url ? t('pageBuilder.replace') : t('pageBuilder.uploadPngOrJpg')}
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
                    toast.error(t('publishing.webclipMustBeSquare'))
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
                        {uploadingWebclip ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ImageIcon className="size-4 text-muted-foreground/50" />}
                        <span className="text-xs font-normal truncate">
                          {uploadingWebclip ? t('pageBuilder.uploading') : p.apple_touch_icon_url ? t('pageBuilder.replace') : t('pageBuilder.uploadPngOrJpg')}
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
              value={gaId.value}
              onChange={e => gaId.onChange(e.target.value)}
              onBlur={gaId.onBlur}
              placeholder="G-XXXXXXXXXX"
              className="text-xs"
            />
            {!isValidGoogleAnalyticsId(gaId.value) && (
              <p className="text-[11px] text-destructive">{t('pageBuilder.gaIdInvalid')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.fbPixel')}</Label>
            <Input
              value={fbPixel.value}
              onChange={e => fbPixel.onChange(e.target.value)}
              onBlur={fbPixel.onBlur}
              placeholder="1234567890"
              className="text-xs"
            />
            {!isValidFacebookPixelId(fbPixel.value) && (
              <p className="text-[11px] text-destructive">{t('pageBuilder.fbPixelInvalid')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.tiktokPixel')}</Label>
            <Input
              value={ttPixel.value}
              onChange={e => ttPixel.onChange(e.target.value)}
              onBlur={ttPixel.onBlur}
              placeholder="CXXXXXXXXXXXXXXXXX"
              className="text-xs"
            />
            {!isValidTikTokPixelId(ttPixel.value) && (
              <p className="text-[11px] text-destructive">{t('pageBuilder.tiktokPixelInvalid')}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('pageBuilder.gscTag')}</Label>
            <Input
              value={gscTag.value}
              onChange={e => gscTag.onChange(e.target.value)}
              onBlur={gscTag.onBlur}
              placeholder={t('pageBuilder.gscPlaceholder')}
              className="text-xs"
            />
            {!isValidGscVerification(gscTag.value) && (
              <p className="text-[11px] text-destructive">{t('pageBuilder.gscInvalid')}</p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Theme (Colors & Typography) ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">{t('pageBuilder.designTheme')}</h3>
        <ThemeAppearanceFields
          showBackgroundColor
          values={{
            brandColor: thm.primary_color || '#E85D26',
            backgroundColor: thm.background_color || '#FFFFFF',
            textColor: thm.text_color || '#111111',
            headingFont: thm.heading_font_family || 'Inter',
            bodyFont: thm.font_family || 'Inter',
          }}
          onChange={patch => {
            const next: Partial<ThemeSettings> = {}
            if (patch.brandColor != null) next.primary_color = patch.brandColor
            if (patch.backgroundColor != null) next.background_color = patch.backgroundColor
            if (patch.textColor != null) next.text_color = patch.textColor
            if (patch.headingFont != null) next.heading_font_family = patch.headingFont
            if (patch.bodyFont != null) next.font_family = patch.bodyFont
            onThemeChange(next)
          }}
        />
      </div>
    </div>
  )
}
