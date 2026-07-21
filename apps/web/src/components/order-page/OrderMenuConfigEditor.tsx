'use client'

/**
 * Admin editor for which menu appears on the fixed order page.
 */

import { useState, useTransition } from 'react'
import { Loader2, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { MenuGridSettings } from '@/components/page-builder/blocks/MenuGridBlock'
import {
  defaultMenuGridConfig,
  type MenuGridConfig,
} from '@/components/page-builder/types'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import {
  saveOrderMenuConfigAction,
  clearOrderMenuConfigAction,
} from '@/app/actions/page-builder'
import { useTranslation } from '@/i18n/I18nProvider'
import { Button } from '@/components/ui/button'

interface OrderMenuConfigEditorProps {
  businessId: string
  initialConfig: MenuGridConfig | null
  categories: MenuCategory[]
  items: MenuItem[]
  onConfigChange?: (config: MenuGridConfig) => void
}

export function OrderMenuConfigEditor({
  businessId,
  initialConfig,
  categories,
  items,
  onConfigChange,
}: OrderMenuConfigEditorProps) {
  const { t } = useTranslation()
  const [config, setConfig] = useState<MenuGridConfig>(
    initialConfig ?? { ...defaultMenuGridConfig, heading: '', description: '' },
  )
  const [isCustomized, setIsCustomized] = useState(initialConfig != null)
  const [dirty, setDirty] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleChange(next: MenuGridConfig) {
    setConfig(next)
    setDirty(true)
    onConfigChange?.(next)
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveOrderMenuConfigAction(businessId, config)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setConfig(res.data)
      onConfigChange?.(res.data)
      setIsCustomized(true)
      setDirty(false)
      toast.success(t('publishing.orderMenuSaved'))
    })
  }

  function handleReset() {
    startTransition(async () => {
      const res = await clearOrderMenuConfigAction(businessId)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      const fallback = { ...defaultMenuGridConfig, heading: '', description: '' }
      setConfig(fallback)
      onConfigChange?.(fallback)
      setIsCustomized(false)
      setDirty(false)
      toast.success(t('publishing.orderMenuReset'))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground">{t('publishing.orderMenuHint')}</p>
          {!isCustomized && !dirty && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 inline-block mt-1">
              {t('publishing.orderMenuUsingDefault')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isCustomized && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isPending}
              className="hidden sm:inline-flex"
            >
              <RotateCcw className="size-4 mr-1.5" />
              {t('publishing.orderMenuResetBtn')}
            </Button>
          )}
          <Button type="button" size="sm" onClick={handleSave} disabled={!dirty || isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : t('publishing.save')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-3">
        <MenuGridSettings
          config={config}
          categories={categories}
          items={items}
          onChange={handleChange}
          layoutOnly
        />
      </div>

      {isCustomized && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isPending}
          className="sm:hidden w-full"
        >
          <RotateCcw className="size-4 mr-1.5" />
          {t('publishing.orderMenuResetBtn')}
        </Button>
      )}
    </div>
  )
}
