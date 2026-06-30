'use client'

/**
 * QRCodeBlock — editor settings panel for the QR Code block.
 * Also exports QRCodePreview for the block list thumbnail.
 */

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { plainText } from '@/i18n/locale'
import type { QRCodeConfig } from '../types'
import { uploadImageToStorage } from '@/lib/image-utils'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'

// ─── Canvas Preview (mini) ────────────────────────────────────────────────────

export function QRCodePreview({ config }: { config: QRCodeConfig }) {
  const { t } = useTranslation()
  return (
    <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30 p-3 flex flex-col items-center gap-2">
      <div className="size-12 rounded-md bg-muted/60 grid grid-cols-3 grid-rows-3 gap-0.5 p-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={cn('rounded-[1px]', [0, 2, 6, 8].includes(i) ? 'bg-foreground/70' : i === 4 ? 'bg-foreground/40' : 'bg-foreground/20')} />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground truncate max-w-full">{plainText(config.label) || t('qrCodeBlock.qrCode')}</p>
    </div>
  )
}

// ─── Live QR preview (in settings panel) ─────────────────────────────────────

function SettingsPanelQR({ url }: { url: string }) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!canvasRef.current || !url) return
    setReady(false)
    QRCode.toCanvas(canvasRef.current, url, {
      width: 100, margin: 2,
      color: { dark: '#111111', light: '#ffffff' },
    }, () => setReady(true))
  }, [url])

  return (
    <div className="flex justify-center">
      <div className="size-24 rounded-lg border border-border overflow-hidden bg-white flex items-center justify-center">
        <canvas ref={canvasRef} className={`transition-opacity ${ready ? 'opacity-100' : 'opacity-0'}`} />
        {!ready && <div className="text-xs text-muted-foreground">{t('qrCodeBlock.qrLoading')}</div>}
      </div>
    </div>
  )
}

// ─── Settings panel ───────────────────────────────────────────────────────────

interface QRCodeSettingsProps {
  config: QRCodeConfig
  /** Business page slug — to preview "page" target URL */
  businessSlug?: string
  businessId: string
  onChange: (c: QRCodeConfig) => void
  
}

export function QRCodeSettings({ config, businessSlug, businessId, onChange }: QRCodeSettingsProps) {
  const { t } = useTranslation()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const SIZES: { value: QRCodeConfig['size']; label: string }[] = [
    { value: 'sm', label: t('qrCodeBlock.small') },
    { value: 'md', label: t('qrCodeBlock.medium') },
    { value: 'lg', label: t('qrCodeBlock.large') },
  ]
  const ALIGNMENTS: { value: QRCodeConfig['alignment']; label: string }[] = [
    { value: 'left', label: t('qrCodeBlock.left') },
    { value: 'center', label: t('qrCodeBlock.center') },
    { value: 'right', label: t('qrCodeBlock.right') },
  ]
  function set<K extends keyof QRCodeConfig>(key: K, value: QRCodeConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${businessId}/qrbg-${Date.now()}.jpg`
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

  const previewUrl = config.target === 'payment'
    ? (businessSlug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/${businessSlug}` : '')
    : config.custom_url

  return (
    <div className="space-y-5">

      {/* Live mini QR preview */}
      {previewUrl && <SettingsPanelQR url={previewUrl} />}

      {/* Target */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('qrCodeBlock.qrTarget')}</Label>
        <div className="flex gap-1.5">
          {([
            { value: 'payment' as const, label: 'Payment QR' },
            { value: 'custom' as const, label: t('qrCodeBlock.customUrl') },
          ]).map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => set('target', o.value)}
              className={cn(
                'flex-1 py-1.5 rounded border text-xs transition-colors',
                config.target === o.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
        {config.target === 'custom' && (
          <Input
            value={config.custom_url}
            onChange={e => set('custom_url', e.target.value)}
            placeholder="https://example.com"
            className="h-8 text-sm"
          />
        )}
      </div>

      <Separator />

      {/* Label */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('qrCodeBlock.label')}</Label>
        <Input
          value={plainText(config.label)}
          onChange={e => set('label', e.target.value)}
          placeholder={t('qrCodeBlock.scanToView')}
          className="h-8 text-sm"
        />
      </div>

      <Separator />

      {/* Size + Alignment */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('qrCodeBlock.size')}</Label>
        <div className="flex gap-1.5">
          {SIZES.map(s => (
            <button
              key={s.value}
              type="button"
              onClick={() => set('size', s.value)}
              className={cn(
                'flex-1 py-1.5 rounded border text-xs transition-colors',
                config.size === s.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-foreground/30'
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('qrCodeBlock.alignment')}</Label>
        <div className="flex gap-1.5">
          {ALIGNMENTS.map(a => (
            <button
              key={a.value}
              type="button"
              onClick={() => set('alignment', a.value)}
              className={cn(
                'flex-1 py-1.5 rounded border text-xs transition-colors',
                config.alignment === a.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-foreground/30'
              )}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Radius</Label>
        <div className="flex flex-wrap gap-1.5">
          {([
            { value: 'none', label: '0' },
            { value: 'md', label: 'MD' },
            { value: 'lg', label: 'LG' },
            { value: 'xl', label: 'XL' },
            { value: '2xl', label: '2XL' },
            { value: '3xl', label: '3XL' },
            { value: 'full', label: 'Round' },
          ] as const).map(r => (
            <button
              key={r.value}
              type="button"
              onClick={() => set('border_radius', r.value)}
              className={cn(
                'px-3 py-1 rounded border text-[11px] transition-colors',
                (config.border_radius || '2xl') === r.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border text-muted-foreground hover:border-foreground/30'
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Toggles */}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="qr-show-download" className="text-xs cursor-pointer">{t('qrCodeBlock.showDownload')}</Label>
        <Switch
          id="qr-show-download"
          checked={config.show_download}
          onCheckedChange={v => set('show_download', v)}
        />
      </div>

      <Separator />

      {/* Colours */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('qrCodeBlock.colours')}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('qrCodeBlock.background')}</Label>
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
            <Label className="text-xs">{t('qrCodeBlock.qrColour')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.qr_color ?? config.text_color ?? '#111111'}
                onChange={e => set('qr_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.qr_color ?? config.text_color ?? '#111111'}</span>
            </div>
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">{t('qrCodeBlock.textColour')}</Label>
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

      {/* Background Image */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Background Image</Label>
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
        {config.background_image ? (
          <div className="relative rounded-lg overflow-hidden border border-border aspect-[3/4] bg-muted group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={config.background_image} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => set('background_image', '')}
              className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
            >
              <X className="size-4" />
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
                  className="flex-1 aspect-[3/4] max-h-[120px] rounded-lg border-2 border-dashed border-border hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
                >
                  {uploading
                    ? <Loader2 className="size-5 animate-spin" />
                    : <><ImageIcon className="size-5" /><span className="text-xs">Click to upload</span></>
                  }
                </button>
                <button
                  type="button"
                  onClick={openGallery}
                  className="w-1/3 aspect-[3/4] max-h-[120px] shrink-0 rounded-lg border border-border hover:bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors"
                >
                  <ImageIcon className="size-4" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Gallery</span>
                </button>
              </div>
            )}
          </ImageUploader>
        )}
      </div>
    </div>
  )
}
