'use client'

/**
 * Shared colour swatch + hex display used by page-builder and order-page settings.
 */

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ColorSwatchFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  /** Fallback when value is empty */
  fallback?: string
  /** Show an editable hex text input instead of a read-only span */
  editableHex?: boolean
  hint?: string
  className?: string
  /** Extra class for the outer field wrapper (e.g. col-span-2) */
  wrapperClassName?: string
}

function normalizeHex(raw: string, fallback: string): string {
  const v = (raw || '').trim()
  if (/^#[0-9a-fA-F]{6}$/.test(v)) return v
  if (/^#[0-9a-fA-F]{3}$/.test(v)) {
    const [, a, b, c] = v
    return `#${a}${a}${b}${b}${c}${c}`
  }
  return fallback
}

export function ColorSwatchField({
  label,
  value,
  onChange,
  fallback = '#111111',
  editableHex = false,
  hint,
  className,
  wrapperClassName,
}: ColorSwatchFieldProps) {
  const display = normalizeHex(value, fallback)

  return (
    <div className={cn('space-y-1.5', wrapperClassName)}>
      <Label className="text-xs">{label}</Label>
      <div className={cn('flex items-center gap-2', className)}>
        <input
          type="color"
          value={display}
          onChange={e => onChange(e.target.value)}
          className="size-8 shrink-0 rounded border border-border cursor-pointer"
        />
        {editableHex ? (
          <Input
            value={value || display}
            onChange={e => onChange(e.target.value)}
            onBlur={() => onChange(normalizeHex(value, fallback))}
            className="h-8 px-2 text-[11px] font-mono"
          />
        ) : (
          <span className="text-[11px] font-mono text-muted-foreground truncate">{display}</span>
        )}
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
      )}
    </div>
  )
}
