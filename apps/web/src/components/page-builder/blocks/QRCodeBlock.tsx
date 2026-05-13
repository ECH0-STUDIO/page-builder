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
import type { QRCodeConfig } from '../types'

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
      <p className="text-[10px] text-muted-foreground truncate max-w-full">{config.label || t('qrCodeBlock.qrCode')}</p>
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
  onChange: (c: QRCodeConfig) => void
}

export function QRCodeSettings({ config, businessSlug, onChange }: QRCodeSettingsProps) {
  const { t } = useTranslation()
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

  const previewUrl = config.target === 'page'
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
            { value: 'page' as const, label: t('qrCodeBlock.myPage') },
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
          value={config.label}
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
                value={config.text_color}
                onChange={e => set('text_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.text_color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
