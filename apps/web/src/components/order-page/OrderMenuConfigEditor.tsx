'use client'

/**
 * Controlled editor for order-page menu layout (autosave owned by parent).
 */

import { RotateCcw } from 'lucide-react'
import { MenuGridSettings } from '@/components/page-builder/blocks/MenuGridBlock'
import {
  defaultMenuGridConfig,
  type MenuGridConfig,
} from '@/components/page-builder/types'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'

interface OrderMenuConfigEditorProps {
  config: MenuGridConfig
  isCustomized: boolean
  categories: MenuCategory[]
  items: MenuItem[]
  onChange: (config: MenuGridConfig) => void
  onReset: () => void
}

export function OrderMenuConfigEditor({
  config,
  isCustomized,
  categories,
  items,
  onChange,
  onReset,
}: OrderMenuConfigEditorProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground">{t('publishing.orderMenuHint')}</p>
          {!isCustomized && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block mt-1">
              {t('publishing.orderMenuUsingDefault')}
            </p>
          )}
        </div>
        {isCustomized && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="hidden sm:inline-flex shrink-0"
          >
            <RotateCcw className="size-4 mr-1.5" />
            {t('publishing.orderMenuResetBtn')}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <MenuGridSettings
          config={config}
          categories={categories}
          items={items}
          onChange={onChange}
          layoutOnly
        />
      </div>

      {isCustomized && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onReset}
          className="sm:hidden w-full"
        >
          <RotateCcw className="size-4 mr-1.5" />
          {t('publishing.orderMenuResetBtn')}
        </Button>
      )}
    </div>
  )
}

export function defaultOrderMenuConfig(): MenuGridConfig {
  return { ...defaultMenuGridConfig, heading: '', description: '' }
}
