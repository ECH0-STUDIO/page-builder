'use client'

/**
 * FontPicker — scrollable grouped font selector.
 * Loads all preview fonts from Google Fonts once on mount.
 */

import { useEffect } from 'react'
import { FONT_LIST, getGoogleFontUrl } from '@/lib/fonts'
import { cn } from '@/lib/utils'

// Load all preview fonts in one request
const PREVIEW_FONT_URL = getGoogleFontUrl(FONT_LIST.map(f => f.value))

const CATEGORIES = [
  { id: 'sans',    label: 'Sans-Serif' },
  { id: 'serif',   label: 'Serif'      },
  { id: 'display', label: 'Display'    },
] as const

interface FontPickerProps {
  label: string
  value: string
  onChange: (font: string) => void
}

export function FontPicker({ label, value, onChange }: FontPickerProps) {
  // Inject the Google Fonts link once per page
  useEffect(() => {
    if (!PREVIEW_FONT_URL) return
    if (document.querySelector('link[data-fontpicker]')) return
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = PREVIEW_FONT_URL
    link.setAttribute('data-fontpicker', 'true')
    document.head.appendChild(link)
  }, [])

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-gray-600">{label}</p>
      <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-xl">
        {CATEGORIES.map(cat => {
          const fonts = FONT_LIST.filter(f => f.category === cat.id)
          return (
            <div key={cat.id}>
              <p className="sticky top-0 bg-gray-50 text-[9px] font-bold uppercase tracking-widest text-gray-400 px-3 py-1.5 border-b border-gray-100">
                {cat.label}
              </p>
              {fonts.map(f => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => onChange(f.value)}
                  style={{ fontFamily: f.value === 'Inter' ? 'Inter, sans-serif' : `'${f.value}', serif` }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm transition-colors border-b border-gray-50 last:border-0',
                    value === f.value
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
