'use client'

import { PrintSettings } from './PrintMenuPreview'
import { FontPicker } from '@/components/shared/FontPicker'
import { ImageIcon, Trash2, Upload, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MenuCategory } from '@/app/actions/menu'

// ─── Design presets ────────────────────────────────────────────────────────────

const PRESETS: { label: string; emoji: string; s: Partial<PrintSettings> }[] = [
  {
    label: 'Classic', emoji: '📄',
    s: { page_bg_color: '#ffffff', header_text_color: '#111111', body_text_color: '#111111', accent_color: '#111111', item_card_bg: 'transparent', page_bg_image: null },
  },
  {
    label: 'Warm',    emoji: '🍂',
    s: { page_bg_color: '#fdf5e4', header_text_color: '#5c3d11', body_text_color: '#3d2c1e', accent_color: '#c4763d', item_card_bg: 'transparent', page_bg_image: null },
  },
  {
    label: 'Fresh',   emoji: '🌿',
    s: { page_bg_color: '#f0faf5', header_text_color: '#1a5c35', body_text_color: '#1a3a2a', accent_color: '#2a7a50', item_card_bg: '#e0f5ea', item_card_radius: 8, page_bg_image: null },
  },
  {
    label: 'Dark',    emoji: '🌙',
    s: { page_bg_color: '#1a1a2e', header_text_color: '#e2b96a', body_text_color: '#e8e8e8', accent_color: '#e2b96a', item_card_bg: '#252540', item_card_radius: 8, page_bg_image: null },
  },
  {
    label: 'Rose',    emoji: '🌸',
    s: { page_bg_color: '#fff0f3', header_text_color: '#8b2252', body_text_color: '#3d1a2a', accent_color: '#c2185b', item_card_bg: 'transparent', page_bg_image: null },
  },
]

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">{children}</p>
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-600">{label}</span>
      <div className="flex items-center gap-2">
        <input type="color" value={value.startsWith('#') ? value : '#111111'} onChange={e => onChange(e.target.value)}
          className="size-7 rounded-md border border-gray-200 cursor-pointer p-0.5" />
        <span className="text-[11px] font-mono text-gray-400 w-16 truncate">{value}</span>
      </div>
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-1">
      <span className="text-xs text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', checked ? 'bg-gray-900' : 'bg-gray-200')}
      >
        <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </button>
    </label>
  )
}

function Divider() { return <div style={{ height: '0.5px', background: 'rgba(209,213,219,0.6)' }} /> }

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result as string)
    r.onerror = rej
    r.readAsDataURL(file)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface PrintMenuControlsProps {
  settings: PrintSettings
  onChange: (next: PrintSettings) => void
  categories: MenuCategory[]
}

export function PrintMenuControls({ settings, onChange, categories }: PrintMenuControlsProps) {
  function set<K extends keyof PrintSettings>(key: K, val: PrintSettings[K]) {
    onChange({ ...settings, [key]: val })
  }

  function applyPreset(preset: Partial<PrintSettings>) {
    onChange({ ...settings, ...preset })
  }

  async function handleBgUpload(file: File) {
    const dataUrl = await fileToDataUrl(file)
    set('page_bg_image', dataUrl)
  }

  function moveCategory(catId: string, direction: -1 | 1) {
    const arr = [...settings.selectedCategories]
    const idx = arr.indexOf(catId)
    if (idx === -1) return
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= arr.length) return
    arr.splice(idx, 1)
    arr.splice(newIdx, 0, catId)
    set('selectedCategories', arr)
  }

  function toggleCategory(catId: string) {
    const arr = [...settings.selectedCategories]
    const idx = arr.indexOf(catId)
    if (idx !== -1) {
      arr.splice(idx, 1)
      set('selectedCategories', arr)
    } else {
      set('selectedCategories', [...arr, catId])
    }
  }

  const hasItemCard = settings.item_card_bg !== 'transparent'
  const unselectedCats = categories.filter(c => !settings.selectedCategories.includes(c.id))

  return (
    <div className="space-y-5 overflow-y-auto pb-8 pr-1">

      {/* ── Heading ── */}
      <div>
        <SectionHeader>Heading</SectionHeader>
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Title</label>
            <input type="text" value={settings.heading_text} onChange={e => set('heading_text', e.target.value)}
              placeholder="Business name (auto-filled)"
              className="w-full h-8 text-sm px-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400" />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-600">Tagline <span className="text-gray-400">(optional)</span></label>
            <input type="text" value={settings.heading_subtext} onChange={e => set('heading_subtext', e.target.value)}
              placeholder="e.g. Fresh food, good vibes"
              className="w-full h-8 text-sm px-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400" />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Layout ── */}
      <div>
        <SectionHeader>Layout</SectionHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">Paper</p>
            <div className="flex gap-1">
              {(['a4', 'a5'] as const).map(p => (
                <button key={p} type="button" onClick={() => set('paper', p)}
                  className={cn('flex-1 py-1.5 text-xs rounded-lg border uppercase font-medium transition-colors',
                    settings.paper === p ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  )}>{p}</button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-gray-600">Columns</p>
            <div className="flex gap-1">
              {([1, 2] as const).map(c => (
                <button key={c} type="button" onClick={() => set('columns', c)}
                  className={cn('flex-1 py-1.5 text-xs rounded-lg border font-medium transition-colors',
                    settings.columns === c ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'
                  )}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Categories ── */}
      <div>
        <SectionHeader>Categories</SectionHeader>
        <div className="space-y-1">
          {settings.selectedCategories.map((catId, idx) => {
            const cat = categories.find(c => c.id === catId)
            if (!cat) return null
            return (
              <div key={cat.id} className="flex items-center gap-2 py-1 bg-gray-50/50 px-2 rounded group">
                <span className="flex-1 text-xs text-gray-900 font-medium truncate">{cat.name}</span>
                <div className="flex items-center gap-0.5 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button type="button" onClick={() => moveCategory(cat.id, -1)} disabled={idx === 0} className="p-1 hover:text-gray-900 disabled:opacity-30">
                    <ArrowUp className="size-3" />
                  </button>
                  <button type="button" onClick={() => moveCategory(cat.id, 1)} disabled={idx === settings.selectedCategories.length - 1} className="p-1 hover:text-gray-900 disabled:opacity-30">
                    <ArrowDown className="size-3" />
                  </button>
                  <button type="button" onClick={() => toggleCategory(cat.id)} className="p-1 hover:text-gray-900 ml-1">
                    <Eye className="size-3" />
                  </button>
                </div>
              </div>
            )
          })}
          {unselectedCats.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 py-1 px-2 group">
              <span className="flex-1 text-xs text-gray-400 truncate">{cat.name}</span>
              <div className="flex items-center gap-0.5 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => toggleCategory(cat.id)} className="p-1 hover:text-gray-900">
                  <EyeOff className="size-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Divider />

      {/* ── Design ── */}
      <div>
        <SectionHeader>Design Theme</SectionHeader>

        {/* Quick presets */}
        <div className="grid grid-cols-5 gap-1.5 mb-4">
          {PRESETS.map(p => (
            <button key={p.label} type="button" onClick={() => applyPreset(p.s)}
              className="flex flex-col items-center gap-1 py-2 rounded-xl border border-gray-200 hover:border-gray-400 transition-colors">
              <span className="text-base leading-none">{p.emoji}</span>
              <span className="text-[10px] text-gray-600">{p.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {/* Background */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Background</p>
            <ColorRow label="Page color" value={settings.page_bg_color} onChange={v => set('page_bg_color', v)} />
            {settings.page_bg_image ? (
              <div className="space-y-2">
                {/* Thumbnail + actions */}
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={settings.page_bg_image} alt="bg"
                    className="h-10 w-14 rounded-md object-cover border border-gray-200 shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <label className="flex items-center gap-1 cursor-pointer text-xs text-gray-600 hover:text-gray-800 px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-400 transition-colors whitespace-nowrap">
                      <Upload className="size-3" />
                      Replace
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => e.target.files?.[0] && handleBgUpload(e.target.files[0])} />
                    </label>
                    <button onClick={() => { set('page_bg_image', null); set('page_bg_overlay_opacity', 0) }}
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                {/* Overlay */}
                <div className="space-y-2 pt-1">
                  <p className="text-xs text-gray-500">Overlay</p>
                  <ColorRow label="Color" value={settings.page_bg_overlay_color} onChange={v => set('page_bg_overlay_color', v)} />
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-600">Opacity</span>
                      <span className="text-xs text-gray-400">{settings.page_bg_overlay_opacity}%</span>
                    </div>
                    <input type="range" min={0} max={85} step={5} value={settings.page_bg_overlay_opacity}
                      onChange={e => set('page_bg_overlay_opacity', +e.target.value)}
                      className="w-full accent-gray-900" />
                  </div>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <ImageIcon className="size-3.5" />
                Upload background image
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleBgUpload(e.target.files[0])} />
              </label>
            )}
          </div>

          {/* Colors */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600">Colors</p>
            <ColorRow label="Heading" value={settings.header_text_color} onChange={v => set('header_text_color', v)} />
            <ColorRow label="Body text" value={settings.body_text_color} onChange={v => set('body_text_color', v)} />
            <ColorRow label="Accent / prices" value={settings.accent_color} onChange={v => set('accent_color', v)} />
          </div>

          {/* Item cards toggle */}
          <div className="space-y-2">
            <Toggle
              label="Item card backgrounds"
              checked={hasItemCard}
              onChange={v => set('item_card_bg', v ? '#f5f5f5' : 'transparent')}
            />
            {hasItemCard && (
              <div className="pl-0 space-y-2">
                <ColorRow label="Card color" value={settings.item_card_bg} onChange={v => set('item_card_bg', v)} />
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-600">Card radius</span>
                    <span className="text-xs text-gray-400">{settings.item_card_radius}px</span>
                  </div>
                  <input type="range" min={0} max={16} step={2} value={settings.item_card_radius}
                    onChange={e => set('item_card_radius', +e.target.value)}
                    className="w-full accent-gray-900" />
                </div>
              </div>
            )}
          </div>

          {/* Fonts */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600">Fonts</p>
            <FontPicker label="Heading font" value={settings.heading_font} onChange={v => set('heading_font', v)} />
            <FontPicker label="Body font" value={settings.body_font} onChange={v => set('body_font', v)} />
          </div>
        </div>
      </div>

      <Divider />

      {/* ── Content toggles ── */}
      <div>
        <SectionHeader>Content</SectionHeader>
        <div className="divide-y divide-gray-50">
          <Toggle label="Show header" checked={settings.show_header} onChange={v => set('show_header', v)} />
          <Toggle label="Category dividers" checked={settings.show_category_dividers} onChange={v => set('show_category_dividers', v)} />
          <Toggle label="Item images" checked={settings.show_images} onChange={v => set('show_images', v)} />
          <Toggle label="Descriptions" checked={settings.show_description} onChange={v => set('show_description', v)} />
          <Toggle label="Prices" checked={settings.show_prices} onChange={v => set('show_prices', v)} />
        </div>
      </div>

    </div>
  )
}
