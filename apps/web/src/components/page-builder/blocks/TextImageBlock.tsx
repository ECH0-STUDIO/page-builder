'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { uploadImageToStorage } from '@/lib/image-utils'
import type {
  TextImageConfig, TextImageLayout, AspectRatio, ImageFit,
  BlockBackground, PaddingSize, CtaButton, BorderRadius, PageBlock,
} from '../types'
import { CtaEditor } from './CtaEditor'

// ─── Canvas Preview ────────────────────────────────────────────────────────────

export function TextImagePreview({ config }: { config: TextImageConfig }) {
  const layoutLabels: Record<TextImageLayout, string> = {
    img_left: 'Image Left',
    img_right: 'Image Right',
    stacked: 'Stacked',
    text_only: 'Text Only',
    img_only: 'Image Only',
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30">
      <div className={cn(
        'flex gap-2 p-3',
        config.layout === 'stacked' && 'flex-col',
        config.layout === 'img_right' && 'flex-row-reverse',
        config.layout === 'text_only' && 'block',
        config.layout === 'img_only' && 'block',
      )}>
        {config.layout !== 'text_only' && (
          <div className={cn(
            'bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden',
            config.layout === 'stacked' || config.layout === 'img_only' ? 'w-full h-14' : 'w-16 h-16'
          )}>
            {config.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="size-4 text-muted-foreground/40" />
            )}
          </div>
        )}
        {config.layout !== 'img_only' && (
          <div className="flex-1 space-y-0.5 min-w-0">
            {config.heading && <p className="text-xs font-semibold truncate">{config.heading}</p>}
            {config.body && (
              <p className="text-[10px] text-muted-foreground line-clamp-2">{config.body}</p>
            )}
            {!config.heading && !config.body && (
              <p className="text-[10px] text-muted-foreground/50 italic">Text content…</p>
            )}
          </div>
        )}
      </div>
      <div className="px-3 pb-2">
        <p className="text-[10px] text-muted-foreground/60">{layoutLabels[config.layout]} · {config.padding} padding</p>
      </div>
    </div>
  )
}

// ─── Settings Form ─────────────────────────────────────────────────────────────

const LAYOUTS: { value: TextImageLayout; label: string }[] = [
  { value: 'img_left', label: 'Image Left' },
  { value: 'img_right', label: 'Image Right' },
  { value: 'stacked', label: 'Stacked' },
  { value: 'text_only', label: 'Text Only' },
  { value: 'img_only', label: 'Image Only' },
]

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: 'square', label: 'Square (1:1)' },
  { value: '4_3', label: '4:3' },
  { value: '16_9', label: '16:9' },
  { value: 'free', label: 'Free' },
]

const PADDINGS: { value: PaddingSize; label: string }[] = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'spacious', label: 'Spacious' },
]

const BACKGROUNDS: { value: BlockBackground; label: string }[] = [
  { value: 'transparent', label: 'Transparent' },
  { value: 'solid', label: 'Solid colour' },
  { value: 'gradient', label: 'Subtle gradient' },
]

export function TextImageSettings({
  config,
  businessId,
  blocks,
  onChange,
}: {
  config: TextImageConfig
  businessId: string
  /** Full block list for CTA anchor dropdown */
  blocks: PageBlock[]
  onChange: (c: TextImageConfig) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  function set<K extends keyof TextImageConfig>(key: K, value: TextImageConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${businessId}/text-img-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1200, maxHeight: 1200, quality: 0.85, targetSizeKB: 400,
      })
      set('image_url', url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const emptyCtaDefaults: CtaButton = { label: '', action: 'url', value: '', style: 'outlined' }

  return (
    <div className="space-y-5">

      {/* Layout */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layout</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => set('layout', l.value)}
              className={cn(
                'px-3 py-2 rounded-lg border text-xs transition-colors',
                config.layout === l.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Image */}
      {config.layout !== 'text_only' && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image</Label>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
          {config.image_url ? (
            <div className="relative rounded-lg overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.image_url} alt="" className="w-full h-32 object-cover" />
              <button
                type="button"
                onClick={() => set('image_url', '')}
                className="absolute top-2 right-2 size-6 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full h-24 rounded-lg border-2 border-dashed border-border hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
            >
              {uploading ? <Loader2 className="size-4 animate-spin" /> : <>
                <ImageIcon className="size-4" />
                <span className="text-xs">Click to upload</span>
              </>}
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Aspect ratio</Label>
              <Select value={config.aspect_ratio} onValueChange={v => set('aspect_ratio', v as AspectRatio)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map(r => <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Image fit</Label>
              <Select value={config.image_fit} onValueChange={v => set('image_fit', v as ImageFit)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cover" className="text-xs">Cover</SelectItem>
                  <SelectItem value="contain" className="text-xs">Contain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Content */}
      {config.layout !== 'img_only' && (
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content</Label>
          <div className="space-y-1.5">
            <Label htmlFor="ti-heading" className="text-xs">Heading (optional)</Label>
            <Input id="ti-heading" value={config.heading} onChange={e => set('heading', e.target.value)} placeholder="Section title…" className="h-8 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ti-body" className="text-xs">Body text</Label>
            <Textarea
              id="ti-body"
              value={config.body}
              onChange={e => set('body', e.target.value)}
              placeholder="Write your content here…&#10;Line breaks are preserved."
              rows={5}
              className="resize-none text-sm"
            />
          </div>

          {/* CTA */}
          {config.cta ? (
            <CtaEditor
              label="CTA Button"
              value={config.cta}
              blocks={blocks}
              onChange={v => set('cta', v)}
              onRemove={() => set('cta', null)}
            />
          ) : (
            <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8"
              onClick={() => set('cta', emptyCtaDefaults)}>
              + Add CTA button
            </Button>
          )}
        </div>
      )}

      <Separator />

      {/* Styling */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Styling</Label>

        {/* Background */}
        <div className="space-y-1.5">
          <Label className="text-xs">Background</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {BACKGROUNDS.map(b => (
              <button
                key={b.value}
                type="button"
                onClick={() => set('background', b.value)}
                className={cn('py-1.5 rounded border text-xs transition-colors',
                  config.background === b.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-foreground/30'
                )}
              >
                {b.label}
              </button>
            ))}
          </div>
          {config.background === 'solid' && (
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="color"
                value={config.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="size-7 rounded border border-border cursor-pointer"
              />
              <Input
                value={config.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="h-7 text-xs font-mono flex-1"
                maxLength={7}
              />
            </div>
          )}
          {config.background === 'gradient' && (
            <div className="space-y-2 mt-1.5">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.gradient_from ?? '#f8f8f8'}
                  onChange={e => set('gradient_from', e.target.value)}
                  className="size-7 rounded border border-border cursor-pointer"
                  title="Gradient start"
                />
                <span className="text-xs text-muted-foreground">→</span>
                <input
                  type="color"
                  value={config.gradient_to ?? '#e8e8e8'}
                  onChange={e => set('gradient_to', e.target.value)}
                  className="size-7 rounded border border-border cursor-pointer"
                  title="Gradient end"
                />
                <div
                  className="flex-1 h-7 rounded-md border border-border"
                  style={{ background: `linear-gradient(to right, ${config.gradient_from ?? '#f8f8f8'}, ${config.gradient_to ?? '#e8e8e8'})` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Gradient goes top-left → bottom-right</p>
            </div>
          )}
        </div>

        {/* Padding */}
        <div className="space-y-1.5">
          <Label className="text-xs">Padding</Label>
          <div className="flex gap-1.5">
            {PADDINGS.map(p => (
              <button key={p.value} type="button" onClick={() => set('padding', p.value)}
                className={cn('flex-1 py-1.5 rounded border text-xs transition-colors',
                  config.padding === p.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-foreground/30'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Roundness */}
        {config.layout !== 'text_only' && config.layout !== 'img_only' && (
          <div className="space-y-1.5">
            <Label className="text-xs">Image roundness</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {([
                { value: 'none', label: 'None' },
                { value: 'sm', label: 'Small' },
                { value: 'md', label: 'Medium' },
                { value: 'lg', label: 'Large' },
                { value: 'xl', label: 'X-Large' },
                { value: 'full', label: 'Pill' },
              ] as { value: BorderRadius; label: string }[]).map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => set('border_radius', r.value)}
                  className={cn(
                    'py-1.5 rounded border text-xs transition-colors',
                    config.border_radius === r.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
