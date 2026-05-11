'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { uploadImageToStorage } from '@/lib/image-utils'
import { CtaEditor } from './CtaEditor'
import type {
  HeroConfig, HeroLayout, BlockHeight, ImagePosition, CtaButton, SplitImageSide, PageBlock,
} from '../types'

// ─── Canvas Preview ────────────────────────────────────────────────────────────

export function HeroPreview({ config }: { config: HeroConfig }) {
  const layoutLabels: Record<HeroLayout, string> = {
    centered: 'Overlay', // backward-compat: old centered = overlay at 40%
    split: 'Left–Right Split',
    overlay: 'Overlay',
    text_only: 'Text Only',
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30">
      {config.layout !== 'text_only' && (
        <div
          className={cn(
            'bg-muted flex items-center justify-center',
            config.height === 'fullscreen' ? 'h-24' : config.height === 'medium' ? 'h-16' : 'h-12',
            config.layout === 'split' ? 'w-1/2 ml-auto' : 'w-full'
          )}
        >
          {config.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={config.image_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="size-5 text-muted-foreground/40" />
          )}
        </div>
      )}
      <div className="p-3 space-y-0.5">
        <p className="text-xs font-semibold truncate">
          {config.heading || <span className="text-muted-foreground italic">Heading…</span>}
        </p>
        {config.tagline && (
          <p className="text-xs text-muted-foreground truncate">{config.tagline}</p>
        )}
        <p className="text-[10px] text-muted-foreground/60 pt-1">
          {layoutLabels[config.layout]} · {config.height}
        </p>
      </div>
    </div>
  )
}

// ─── Settings Form ─────────────────────────────────────────────────────────────

const LAYOUTS: { value: HeroLayout; label: string; desc: string }[] = [
  { value: 'overlay', label: 'Overlay', desc: 'Full-width image with adjustable overlay' },
  { value: 'split', label: 'Split', desc: 'Image one side, content other' },
  { value: 'text_only', label: 'Text Only', desc: 'Solid / gradient background, no image' },
]

const HEIGHTS: { value: BlockHeight; label: string }[] = [
  { value: 'custom', label: 'Custom' },
  { value: 'medium', label: 'Medium' },
  { value: 'fullscreen', label: 'Fullscreen' },
]

const IMAGE_POSITIONS: { value: ImagePosition; label: string }[] = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom', label: 'Bottom' },
]

export function HeroSettings({
  config,
  businessId,
  blocks,
  onChange,
}: {
  config: HeroConfig
  businessId: string
  /** Full block list for CTA anchor dropdown */
  blocks: PageBlock[]
  onChange: (c: HeroConfig) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  function set<K extends keyof HeroConfig>(key: K, value: HeroConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  function resolvedHeight(): BlockHeight {
    return (config.height as string) === 'auto' ? 'custom' : config.height
  }

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const path = `${businessId}/hero-${Date.now()}.jpg`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 1920, maxHeight: 1080, quality: 0.85, targetSizeKB: 500,
      })
      set('image_url', url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const emptyCtaDefaults: CtaButton = { label: '', action: 'url', value: '', style: 'filled' }
  const isCustomHeight = resolvedHeight() === 'custom'
  const isTextOnly = config.layout === 'text_only'
  const isSplit = config.layout === 'split'
  const hasImage = !isTextOnly

  return (
    <div className="space-y-5">

      {/* Layout */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Layout</Label>
        <div className="grid grid-cols-1 gap-1.5">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => set('layout', l.value)}
              className={cn(
                'text-left px-3 py-2 rounded-lg border text-xs transition-colors',
                config.layout === l.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              <span className="font-medium">{l.label}</span>
              <span className="text-muted-foreground ml-2">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Image (hidden for text_only) */}
      {hasImage && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cover Image</Label>
          <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImage} />
          {config.image_url ? (
            <div className="relative rounded-lg overflow-hidden border border-border aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.image_url} alt="" className="w-full h-full object-cover" />
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
              className="w-full aspect-video rounded-lg border-2 border-dashed border-border hover:border-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
            >
              {uploading
                ? <Loader2 className="size-5 animate-spin" />
                : <><ImageIcon className="size-5" /><span className="text-xs">Click to upload</span></>
              }
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Image position</Label>
              <Select value={config.image_position} onValueChange={v => set('image_position', v as ImagePosition)}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {IMAGE_POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value} className="text-xs">{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {config.layout === 'overlay' && (
              <div className="space-y-1.5">
                <Label className="text-xs">Overlay opacity: {config.overlay_opacity}%</Label>
                <Slider
                  min={0} max={80} step={5}
                  value={[config.overlay_opacity]}
                  onValueChange={([v]) => set('overlay_opacity', v)}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text-only background */}
      {isTextOnly && (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Background</Label>
          <div className="flex gap-1.5">
            {(['solid', 'gradient'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set('text_only_bg', t)}
                className={cn(
                  'flex-1 py-1.5 rounded border text-xs transition-colors',
                  (config.text_only_bg ?? 'gradient') === t
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-border hover:border-foreground/30'
                )}
              >
                {t === 'solid' ? 'Solid colour' : 'Gradient'}
              </button>
            ))}
          </div>
          {(config.text_only_bg ?? 'gradient') === 'solid' ? (
            <div className="flex items-center gap-2">
              <input type="color" value={config.text_only_color ?? '#1a1a2e'}
                onChange={e => set('text_only_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer" />
              <Input value={config.text_only_color ?? '#1a1a2e'}
                onChange={e => set('text_only_color', e.target.value)}
                className="h-7 text-xs font-mono flex-1" maxLength={7} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="color" value={config.text_only_color ?? '#1a1a2e'}
                  onChange={e => set('text_only_color', e.target.value)}
                  className="size-7 rounded border border-border cursor-pointer" title="Start colour" />
                <span className="text-xs text-muted-foreground">→</span>
                <input type="color" value={config.text_only_color_end ?? '#0f3460'}
                  onChange={e => set('text_only_color_end', e.target.value)}
                  className="size-7 rounded border border-border cursor-pointer" title="End colour" />
                <div className="flex-1 h-7 rounded-md border border-border"
                  style={{ background: `linear-gradient(to right, ${config.text_only_color ?? '#1a1a2e'}, ${config.text_only_color_end ?? '#0f3460'})` }} />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Split layout — image side + background colour */}
      {isSplit && (
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Split options</Label>

          <div className="space-y-1.5">
            <Label className="text-xs">Image side</Label>
            <div className="flex gap-1.5">
              {([
                { value: 'right', label: 'Content left · Image right' },
                { value: 'left', label: 'Image left · Content right' },
              ] as { value: SplitImageSide; label: string }[]).map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set('split_image_side', o.value)}
                  className={cn(
                    'flex-1 py-1.5 px-2 rounded border text-[11px] transition-colors text-center',
                    (config.split_image_side ?? 'right') === o.value
                      ? 'border-primary bg-primary/5 text-primary font-medium'
                      : 'border-border hover:border-foreground/30'
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Panel background</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.split_bg_color ?? '#1a1a2e'}
                  onChange={e => set('split_bg_color', e.target.value)}
                  className="size-8 rounded border border-border cursor-pointer" />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{config.split_bg_color ?? '#1a1a2e'}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Panel text colour</Label>
              <div className="flex items-center gap-2">
                <input type="color" value={config.split_text_color ?? '#ffffff'}
                  onChange={e => set('split_text_color', e.target.value)}
                  className="size-8 rounded border border-border cursor-pointer" />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{config.split_text_color ?? '#ffffff'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Content */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Content</Label>
        <div className="space-y-1.5">
          <Label htmlFor="hero-heading" className="text-xs">Heading</Label>
          <Input id="hero-heading" value={config.heading} onChange={e => set('heading', e.target.value)} placeholder="Your business name" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-tagline" className="text-xs">Tagline</Label>
          <Input id="hero-tagline" value={config.tagline} onChange={e => set('tagline', e.target.value)} placeholder="Short description" className="h-8 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hero-body" className="text-xs">Body text (optional)</Label>
          <Textarea id="hero-body" value={config.body} onChange={e => set('body', e.target.value)} placeholder="Optional paragraph…" rows={2} className="resize-none text-sm" />
        </div>
      </div>

      <Separator />

      {/* CTA */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Call to Action</Label>
        {config.cta ? (
          <CtaEditor
            label="Primary button"
            value={config.cta}
            blocks={blocks}
            onChange={v => set('cta', v)}
            onRemove={() => set('cta', null)}
          />
        ) : (
          <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8"
            onClick={() => set('cta', { ...emptyCtaDefaults })}
          >
            + Add primary button
          </Button>
        )}
        {config.cta && (
          config.cta_secondary ? (
            <CtaEditor
              label="Secondary link"
              value={config.cta_secondary}
              blocks={blocks}
              onChange={v => set('cta_secondary', v)}
              onRemove={() => set('cta_secondary', null)}
            />
          ) : (
            <Button type="button" variant="ghost" size="sm" className="w-full text-xs h-7 text-muted-foreground"
              onClick={() => set('cta_secondary', { label: '', action: 'url', value: '', style: 'text' })}
            >
              + Add secondary link
            </Button>
          )
        )}
      </div>

      <Separator />

      {/* Styling — only for overlay/text_only */}
      {!isSplit && (
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Styling</Label>

          <div className="space-y-1.5">
            <Label className="text-xs">Block height</Label>
            <div className="flex gap-1.5">
              {HEIGHTS.map(h => (
                <button key={h.value} type="button" onClick={() => set('height', h.value)}
                  className={cn('flex-1 py-1.5 rounded-md border text-xs transition-colors',
                    resolvedHeight() === h.value ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border hover:border-foreground/30'
                  )}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>

          {isCustomHeight && (
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center justify-between">
                <span>Vertical padding</span>
                <span className="font-mono text-muted-foreground">{config.section_padding_y ?? 80}px</span>
              </Label>
              <Slider min={0} max={300} step={8}
                value={[config.section_padding_y ?? 80]}
                onValueChange={([v]) => set('section_padding_y', v)} />
              <p className="text-[11px] text-muted-foreground">Drag to set vertical breathing room. In Custom mode this directly controls section height.</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Text &amp; button colour</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {(['auto', '#ffffff', '#111111'] as const).map(c => (
                <button key={c} type="button" onClick={() => set('text_color', c)}
                  className={cn('px-3 py-1 rounded-md border text-xs transition-colors',
                    config.text_color === c ? 'border-primary bg-primary/5 text-primary' : 'border-border'
                  )}
                >
                  {c === 'auto' ? 'Auto' : c === '#ffffff' ? 'White' : 'Dark'}
                </button>
              ))}
              <input type="color"
                value={config.text_color === 'auto' ? '#111111' : config.text_color}
                onChange={e => set('text_color', e.target.value)}
                className="size-7 rounded border border-border cursor-pointer" />
            </div>
            <p className="text-[11px] text-muted-foreground">Applies to heading, body, and both CTA buttons.</p>
          </div>
        </div>
      )}
    </div>
  )
}
