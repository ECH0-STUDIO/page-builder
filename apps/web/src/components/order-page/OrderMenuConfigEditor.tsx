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
}

export function OrderMenuConfigEditor({
  businessId,
  initialConfig,
  categories,
  items,
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
  }

  function handleSave() {
    startTransition(async () => {
      const res = await saveOrderMenuConfigAction(businessId, config)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setConfig(res.data)
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
      setConfig({ ...defaultMenuGridConfig, heading: '', description: '' })
      setIsCustomized(false)
      setDirty(false)
      toast.success(t('publishing.orderMenuReset'))
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h2 className="font-semibold text-gray-900">{t('publishing.orderMenuTitle')}</h2>
          <p className="text-sm text-gray-500">{t('publishing.orderMenuHint')}</p>
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
              onClick={handleReset}
              disabled={isPending}
              className="hidden sm:inline-flex"
            >
              <RotateCcw className="size-4 mr-1.5" />
              {t('publishing.orderMenuResetBtn')}
            </Button>
          )}
          <Button type="button" onClick={handleSave} disabled={!dirty || isPending}>
            {isPending ? <Loader2 className="size-4 animate-spin" /> : t('publishing.save')}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-100 bg-white p-4">
        <MenuGridSettings
          config={config}
          categories={categories}
          items={items}
          onChange={handleChange}
        />
      </div>

      {isCustomized && (
        <Button
          type="button"
          variant="outline"
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
