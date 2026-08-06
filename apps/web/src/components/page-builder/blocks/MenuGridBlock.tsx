'use client'

/**
 * MenuGridBlock — editor settings panel for the Menu Grid block.
 *
 * Allows the user to:
 *  - Choose which categories to show (or all)
 *  - Set layout (2/3/4 col, list)
 *  - Toggle display options (image, description, price, unavailable badge, QR)
 *  - Set heading, background and text colour
 */

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { plainText } from '@/i18n/locale'
import type { BorderRadius, MenuGridConfig } from '../types'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { ColorSwatchField } from '@/components/shared/ColorSwatchField'
import { RadiusPicker } from '@/components/shared/RadiusPicker'

// ─── Canvas Preview ────────────────────────────────────────────────────────────

export function MenuGridPreview({ config }: { config: MenuGridConfig }) {
  const { t } = useTranslation()
  const colMap: Record<string, string> = { '2col': t('menuGridBlock.col2'), '3col': t('menuGridBlock.col3'), list: t('menuGridBlock.list') }
  return (
    <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="size-8 rounded bg-muted flex items-center justify-center text-base">🍽️</div>
        <div className="flex-1">
          <p className="text-xs font-semibold">{plainText(config.heading) || t('menuGridBlock.menu')}</p>
          <p className="text-[10px] text-muted-foreground">{colMap[config.layout]} · {config.show_category_tabs ? t('menuGridBlock.tabsOn') : t('menuGridBlock.noTabs')}</p>
        </div>
      </div>
      <div className={cn('grid gap-1', config.layout === '2col' ? 'grid-cols-2' : config.layout === 'list' ? 'grid-cols-1' : 'grid-cols-3')}>
        {[1, 2, 3].slice(0, config.layout === '2col' ? 2 : 3).map(n => (
          <div key={n} className="h-6 rounded bg-muted/60" />
        ))}
      </div>
    </div>
  )
}

// ─── Settings Form ─────────────────────────────────────────────────────────────



interface MenuGridSettingsProps {
  config: MenuGridConfig
  categories: MenuCategory[]
  items: MenuItem[]
  onChange: (c: MenuGridConfig) => void
  /** Order page: layout/display only — no category/item picking */
  layoutOnly?: boolean
}

export function MenuGridSettings({
  config,
  categories,
  items,
  onChange,
  layoutOnly = false,
}: MenuGridSettingsProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCatId, setFilterCatId] = useState('all')

  const LAYOUTS: { value: MenuGridConfig['layout']; label: string }[] = [
    { value: '2col', label: t('menuGridBlock.col2') },
    { value: '3col', label: t('menuGridBlock.col3') },
    { value: 'list', label: t('menuGridBlock.list') },
  ]
  function set<K extends keyof MenuGridConfig>(key: K, value: MenuGridConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  function toggleCategory(id: string) {
    const current = config.category_ids
    if (current.includes(id)) {
      onChange({ ...config, category_ids: current.filter(c => c !== id) })
    } else {
      onChange({ ...config, category_ids: [...current, id] })
    }
  }

  const allSelected = config.category_ids.length === 0
  const isCustomMode = config.selection_mode === 'custom_items'
  const selectedItemIds = config.item_ids || []

  // Number of categories that will actually appear on the live page
  const activeCatCount = isCustomMode
    ? new Set(
        items
          .filter(item => selectedItemIds.includes(item.id))
          .map(item => item.category_id),
      ).size
    : allSelected ? categories.length : config.category_ids.length
  // Tabs are auto-forced when 2+ categories are displayed (user can't turn them off)
  const tabsAutoForced = activeCatCount >= 2

  return (
    <div className="space-y-5">

      {/* Heading — landing Menu Grid only (order page has no section title) */}
      {!layoutOnly && (
        <>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.sectionHeading')}</Label>
            <Input
              value={plainText(config.heading)}
              onChange={e => set('heading', e.target.value)}
              placeholder={t('menuGridBlock.headingPlaceholder')}
              className="h-8 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">{t('menuGridBlock.headingHelp')}</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.description')}</Label>
            <Textarea
              value={plainText(config.description ?? '')}
              onChange={e => set('description', e.target.value)}
              placeholder={t('menuGridBlock.descPlaceholder')}
              className="text-sm min-h-[60px]"
            />
          </div>

          <Separator />
        </>
      )}

      {/* Layout */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.layout')}</Label>
        <div className="flex gap-1.5">
          {LAYOUTS.map(l => (
            <button
              key={l.value}
              type="button"
              onClick={() => set('layout', l.value)}
              className={cn(
                'flex-1 py-1.5 rounded border text-xs transition-colors',
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

      {!layoutOnly && (
        <>
      {/* Tabs Layout */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.tabsLayout')}</Label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => set('tabs_layout', 'horizontal')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              config.tabs_layout === 'horizontal'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30'
            )}
          >
            {t('menuGridBlock.horizontalScroll')}
          </button>
          <button
            type="button"
            onClick={() => set('tabs_layout', 'sidebar')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              (!config.tabs_layout || config.tabs_layout === 'sidebar')
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30'
            )}
          >
            {t('menuGridBlock.sidebar')}
          </button>
        </div>
      </div>

      <Separator />

      {/* Selection Mode */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.selectionMode')}</Label>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => set('selection_mode', 'category')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              (!config.selection_mode || config.selection_mode === 'category')
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30'
            )}
          >
            By Category
          </button>
          <button
            type="button"
            onClick={() => set('selection_mode', 'custom_items')}
            className={cn(
              'flex-1 py-1.5 rounded border text-xs transition-colors',
              config.selection_mode === 'custom_items'
                ? 'border-primary bg-primary/5 text-primary font-medium'
                : 'border-border hover:border-foreground/30'
            )}
          >
            Custom Items
          </button>
        </div>
      </div>

      <Separator />

      {(!config.selection_mode || config.selection_mode === 'category') ? (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.categoriesToShow')}</Label>
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{t('menuGridBlock.noCategories')}</p>
          ) : (
            <div className="space-y-1">
              {/* "All" toggle */}
              <button
                type="button"
                onClick={() => onChange({ ...config, category_ids: [] })}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center gap-2',
                  allSelected
                    ? 'border-primary bg-primary/8 text-primary font-semibold'
                    : 'border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground'
                )}
              >
                <span className={cn(
                  'size-3.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                  allSelected ? 'bg-primary border-primary' : 'border-border'
                )}>
                  {allSelected && <span className="text-white text-[8px] leading-none font-bold">✓</span>}
                </span>
                All categories
              </button>

              {/* Individual categories */}
              {categories.map(cat => {
                const isOn = !allSelected && config.category_ids.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      if (allSelected) {
                        // Switch from "all" to just this one
                        onChange({ ...config, category_ids: [cat.id] })
                      } else {
                        toggleCategory(cat.id)
                      }
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center gap-2',
                      isOn
                        ? 'border-primary bg-primary/8 text-primary font-semibold'
                        : 'border-border text-foreground hover:border-foreground/40'
                    )}
                  >
                    <span className={cn(
                      'size-3.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                      isOn ? 'bg-primary border-primary' : 'border-border'
                    )}>
                      {isOn && <span className="text-white text-[8px] leading-none font-bold">✓</span>}
                    </span>
                    <span className="flex-1">{cat.name}</span>
                    {!cat.visible && <span className="text-[10px] text-muted-foreground">{t('menuGridBlock.hidden')}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.itemsToShow')}</Label>
          {items.length === 0 ? (
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">{t('menuGridBlock.noItems')}</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <Input 
                  placeholder="Search dishes..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                  className="h-8 text-xs" 
                />
                <select 
                  value={filterCatId}
                  onChange={e => setFilterCatId(e.target.value)}
                  className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                {items.filter(item => {
                  if (filterCatId !== 'all' && item.category_id !== filterCatId) return false
                  if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false
                  return true
                }).map(item => {
                const selectedItems = config.item_ids || []
                const isOn = selectedItems.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (isOn) {
                        onChange({ ...config, item_ids: selectedItems.filter(id => id !== item.id) })
                      } else {
                        onChange({ ...config, item_ids: [...selectedItems, item.id] })
                      }
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors flex items-center gap-2',
                      isOn
                        ? 'border-primary bg-primary/8 text-primary font-semibold'
                        : 'border-border text-foreground hover:border-foreground/40'
                    )}
                  >
                    <span className={cn(
                      'size-3.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                      isOn ? 'bg-primary border-primary' : 'border-border'
                    )}>
                      {isOn && <span className="text-white text-[8px] leading-none font-bold">✓</span>}
                    </span>
                    <span className="flex-1 truncate">{item.name}</span>
                    {!item.available && <span className="text-[10px] text-muted-foreground shrink-0">{t('menuGridBlock.soldOut')}</span>}
                  </button>
                )
              })}
              </div>
            </div>
          )}
        </div>
      )}

      <Separator />
        </>
      )}

      {layoutOnly && (
        <p className="text-xs text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
          {t('orderPageAdmin.menuAllCategoriesNote')}
        </p>
      )}

      {/* Display toggles */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.displayOptions')}</Label>
        <div className="space-y-3">
          {/* Category tabs — auto-forced when 2+ categories active */}
          {tabsAutoForced ? (
            <div className="flex items-center justify-between gap-3">
              <Label className="text-xs">{t('menuGridBlock.categoryFilterTabs')}</Label>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{t('menuGridBlock.autoCats')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="menu-toggle-show_category_tabs" className="text-xs cursor-pointer">{t('menuGridBlock.categoryFilterTabs')}</Label>
              <Switch
                id="menu-toggle-show_category_tabs"
                checked={config.show_category_tabs}
                onCheckedChange={v => set('show_category_tabs', v)}
              />
            </div>
          )}

          {/* Other toggles */}
          {([
            { key: 'show_image', label: t('menuGridBlock.itemImages') },
            { key: 'show_description', label: t('menuGridBlock.itemDescriptions') },
            { key: 'show_price', label: t('menuGridBlock.prices') },
            { key: 'show_unavailable_badge', label: t('menuGridBlock.soldOutBadge') },
          ] as { key: keyof MenuGridConfig; label: string }[]).map(({ key, label }) => (
            <div key={String(key)} className="flex items-center justify-between gap-3">
              <Label htmlFor={`menu-toggle-${String(key)}`} className="text-xs cursor-pointer">{label}</Label>
              <Switch
                id={`menu-toggle-${String(key)}`}
                checked={!!config[key]}
                onCheckedChange={v => set(key, v as never)}
              />
            </div>
          ))}

          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="menu-toggle-pagination" className="text-xs cursor-pointer">{t('menuGridBlock.pagination')}</Label>
            <Switch
              id="menu-toggle-pagination"
              checked={!!config.pagination_enabled}
              onCheckedChange={v => set('pagination_enabled', v)}
            />
          </div>
          {config.pagination_enabled && (
            <div className="space-y-1.5 pl-1">
              <Label htmlFor="menu-items-per-page" className="text-xs">{t('menuGridBlock.itemsPerPage')}</Label>
              <Input
                id="menu-items-per-page"
                type="number"
                min={1}
                max={100}
                value={config.items_per_page ?? 12}
                onChange={e => set('items_per_page', Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 12)))}
                className="h-8 text-xs"
              />
            </div>
          )}
        </div>
      </div>



      {/* Section colours — landing page builder only (order page uses Appearance) */}
      {!layoutOnly && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('menuGridBlock.colours')}</Label>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{t('menuGridBlock.coloursHint')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ColorSwatchField
              label={t('menuGridBlock.background')}
              value={config.background_color}
              fallback="#ffffff"
              onChange={v => set('background_color', v)}
            />
            <ColorSwatchField
              label={t('menuGridBlock.text')}
              value={config.text_color}
              fallback="#111111"
              onChange={v => set('text_color', v)}
            />
          </div>
        </div>
      )}

      {/* Card style */}
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('menuGridBlock.cardStyle')}
          </Label>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {t('menuGridBlock.cardStyleHint')}
          </p>
        </div>

        <RadiusPicker
          label={t('menuGridBlock.cardRadius')}
          value={config.card_border_radius || 'md'}
          onChange={v => set('card_border_radius', v as BorderRadius)}
        />

        <div className="grid grid-cols-2 gap-3">
          <ColorSwatchField
            label={t('menuGridBlock.cardBackground')}
            value={config.card_background_color || '#ffffff'}
            fallback="#ffffff"
            onChange={v => set('card_background_color', v)}
          />
          <ColorSwatchField
            label={t('menuGridBlock.cardText')}
            value={config.card_text_color || '#111111'}
            fallback="#111111"
            onChange={v => set('card_text_color', v)}
          />
          <ColorSwatchField
            label={t('menuGridBlock.cardBorder')}
            value={config.card_border_color || '#f3f4f6'}
            fallback="#f3f4f6"
            onChange={v => set('card_border_color', v)}
            wrapperClassName="col-span-2"
          />
        </div>
      </div>
    </div>
  )
}
