'use client'

/**
 * Shared corner-radius chip picker for page-builder block settings.
 */

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { BorderRadius } from '@/components/page-builder/types'

export type RadiusOption = { value: string; label: string }

export const DEFAULT_BORDER_RADIUS_OPTIONS: RadiusOption[] = [
  { value: 'none', label: '0' },
  { value: 'sm', label: 'SM' },
  { value: 'md', label: 'MD' },
  { value: 'lg', label: 'LG' },
  { value: 'xl', label: 'XL' },
  { value: 'full', label: 'Round' },
]

interface RadiusPickerProps {
  label: string
  value: string
  onChange: (value: BorderRadius | string) => void
  options?: RadiusOption[]
  /** `wrap` = flex chips (Menu/QR); `grid` = 3-col (Text+Image) */
  layout?: 'wrap' | 'grid'
  className?: string
}

export function RadiusPicker({
  label,
  value,
  onChange,
  options = DEFAULT_BORDER_RADIUS_OPTIONS,
  layout = 'wrap',
  className,
}: RadiusPickerProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-xs">{label}</Label>
      <div
        className={cn(
          layout === 'grid'
            ? 'grid grid-cols-3 gap-1.5'
            : 'flex flex-wrap gap-1.5',
        )}
      >
        {options.map(r => (
          <button
            key={r.value}
            type="button"
            onClick={() => onChange(r.value)}
            className={cn(
              'rounded border text-[11px] transition-colors',
              layout === 'grid' ? 'py-1.5 text-xs' : 'px-3 py-1',
              value === r.value
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border text-muted-foreground hover:border-foreground/30',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  )
}
