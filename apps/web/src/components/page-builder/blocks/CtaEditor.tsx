'use client'

/**
 * Shared CtaEditor — reusable CTA button editor used by HeroBlock and TextImageBlock.
 *
 * Features:
 *  - Actions: URL, Phone (tel), Email (mailto), Scroll to section (anchor)
 *  - Style: Filled, Outlined, Text link
 *  - Scroll-to shows a dropdown of blocks that have a user-defined anchor ID
 */

import { X, LinkIcon, Phone, Anchor, Mail } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { CtaButton, CtaAction, CtaStyle, PageBlock } from '../types'
import { ctaHref } from '../cta-utils'
// Re-export so existing client-side imports from CtaEditor still resolve
export { ctaHref } from '../cta-utils'

/** Blocks that a scroll-to anchor can link to (must have a block_anchor_id) */
export interface AnchorOption {
  id: string
  label: string
}

function getAnchorOptions(blocks: PageBlock[]): AnchorOption[] {
  return blocks
    .filter(b => b.block_anchor_id && b.block_anchor_id.trim() !== '')
    .map(b => ({
      id: b.block_anchor_id!.trim(),
      label: `#${b.block_anchor_id!.trim()} — ${b.type.replace('_', ' ')}`,
    }))
}

const ACTION_ICONS: Record<CtaAction, React.ReactNode> = {
  url: <LinkIcon className="size-3" />,
  tel: <Phone className="size-3" />,
  email: <Mail className="size-3" />,
  anchor: <Anchor className="size-3" />,
}
const ACTION_LABELS: Record<CtaAction, string> = {
  url: 'URL',
  tel: 'Phone',
  email: 'Email',
  anchor: 'Scroll to',
}

const STYLE_OPTIONS: { value: CtaStyle; label: string }[] = [
  { value: 'filled', label: 'Filled' },
  { value: 'outlined', label: 'Outlined' },
  { value: 'text', label: 'Text link' },
]

export function CtaEditor({
  value,
  label: fieldLabel,
  blocks,
  onChange,
  onRemove,
}: {
  value: CtaButton
  label: string
  /** Full block list — used to populate the 'scroll to' section dropdown */
  blocks: PageBlock[]
  onChange: (v: CtaButton) => void
  onRemove: () => void
}) {
  const anchorOptions = getAnchorOptions(blocks)
  const isAnchor = value.action === 'anchor'

  return (
    <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{fieldLabel}</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="size-3.5" />
        </button>
      </div>

      {/* Label */}
      <Input
        placeholder="Button label"
        value={value.label}
        onChange={e => onChange({ ...value, label: e.target.value })}
        className="h-8 text-sm"
      />

      {/* Action + Style */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={value.action} onValueChange={v => onChange({ ...value, action: v as CtaAction, value: '' })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['url', 'tel', 'email', 'anchor'] as CtaAction[]).map(a => (
              <SelectItem key={a} value={a} className="text-xs">
                <span className="flex items-center gap-1.5">{ACTION_ICONS[a]}{ACTION_LABELS[a]}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={value.style} onValueChange={v => onChange({ ...value, style: v as CtaStyle })}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STYLE_OPTIONS.map(s => (
              <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Value input — changes based on action */}
      {isAnchor ? (
        anchorOptions.length > 0 ? (
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Scroll to section</Label>
            <Select
              value={value.value}
              onValueChange={v => onChange({ ...value, value: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select a section…" />
              </SelectTrigger>
              <SelectContent>
                {anchorOptions.map(opt => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
              No sections with an anchor ID yet. Set a <strong>Section ID</strong> on any block using the input below the block settings.
            </p>
          </div>
        )
      ) : (
        <Input
          placeholder={
            value.action === 'tel' ? '+84 9xx xxx xxx'
            : value.action === 'email' ? 'hello@example.com'
            : 'https://…'
          }
          value={value.value}
          onChange={e => onChange({ ...value, value: e.target.value })}
          className="h-8 text-sm"
        />
      )}
    </div>
  )
}

/** A simple single-field styling picker (filled/outlined/text), no action logic */
export function SimpleCtaEditor({
  value,
  blocks,
  onChange,
  onRemove,
}: {
  value: CtaButton
  blocks: PageBlock[]
  onChange: (v: CtaButton) => void
  onRemove: () => void
}) {
  return (
    <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CTA Button</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="size-3.5" />
        </button>
      </div>
      <CtaEditor value={value} label="" blocks={blocks} onChange={onChange} onRemove={onRemove} />
    </div>
  )
}

