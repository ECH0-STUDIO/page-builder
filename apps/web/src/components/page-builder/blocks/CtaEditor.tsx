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
import { useTranslation } from '@/i18n/I18nProvider'
import type { CtaButton, CtaAction, CtaStyle, PageBlock } from '../types'
import { ctaHref } from '../cta-utils'
import type { SupportedLocale } from '@/i18n/locale'
import { LocalizedInput } from '@/components/i18n/LocalizedField'
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




export function CtaEditor({
  value,
  label: fieldLabel,
  blocks,
  editLocale,
  onChange,
  onRemove,
}: {
  value: CtaButton
  label: string
  /** Full block list — used to populate the 'scroll to' section dropdown */
  blocks: PageBlock[]
  editLocale: SupportedLocale
  onChange: (v: CtaButton) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const ACTION_LABELS: Record<CtaAction, string> = {
    url: t('ctaEditor.url'),
    tel: t('ctaEditor.phone'),
    email: t('ctaEditor.email'),
    anchor: t('ctaEditor.scrollTo'),
  }
  const STYLE_OPTIONS: { value: CtaStyle; label: string }[] = [
    { value: 'filled', label: t('ctaEditor.filled') },
    { value: 'outlined', label: t('ctaEditor.outlined') },
    { value: 'text', label: t('ctaEditor.textLink') },
  ]
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
      <LocalizedInput
        placeholder={t('ctaEditor.buttonLabel')}
        locale={editLocale}
        value={value.label}
        onChange={label => onChange({ ...value, label })}
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
            <Label className="text-[11px] text-muted-foreground">{t('ctaEditor.scrollToSection')}</Label>
            <Select
              value={value.value}
              onValueChange={v => onChange({ ...value, value: v })}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder={t('ctaEditor.selectSection')} />
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
              <span dangerouslySetInnerHTML={{ __html: t('ctaEditor.noAnchorIds') }} />
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
  editLocale = 'vi',
}: {
  value: CtaButton
  blocks: PageBlock[]
  onChange: (v: CtaButton) => void
  onRemove: () => void
  editLocale?: SupportedLocale
}) {
  return (
    <div className="space-y-2 p-3 rounded-lg border border-border/60 bg-muted/20">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">CTA Button</span>
        <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <X className="size-3.5" />
        </button>
      </div>
      <CtaEditor value={value} label="" blocks={blocks} editLocale={editLocale} onChange={onChange} onRemove={onRemove} />
    </div>
  )
}

