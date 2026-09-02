'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import type { SupportedLocale } from '@/i18n/locale'
import type { StoreLanguageConfig } from '@/i18n/store-locale'
import { exampleStorePublicPaths } from '@/i18n/store-locale'
import {
  disableDualLanguageAction,
  enableDualLanguageAction,
  updateStorePrimaryLocaleAction,
} from '@/app/actions/store-language'

interface LanguageSettingsFormProps {
  businessId: string
  initial: StoreLanguageConfig
}

export function LanguageSettingsForm({ businessId, initial }: LanguageSettingsFormProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [config, setConfig] = useState(initial)
  const [primaryDraft, setPrimaryDraft] = useState<SupportedLocale>(initial.primary_locale)
  const [busy, setBusy] = useState(false)
  const [setupMessage, setSetupMessage] = useState<string | null>(null)

  const primaryChanged = primaryDraft !== config.primary_locale
  const pathExamples = exampleStorePublicPaths(
    config.dual_language_enabled ? config.primary_locale : primaryDraft,
    config.dual_language_enabled,
  )

  async function handlePrimarySave() {
    setBusy(true)
    const res = await updateStorePrimaryLocaleAction(businessId, primaryDraft)
    setBusy(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    setConfig(res.data)
    toast.success(t('settings.storeLanguage.primarySaved'))
    router.refresh()
  }

  async function handleDualToggle(checked: boolean) {
    if (checked) {
      setBusy(true)
      setSetupMessage(t('settings.storeLanguage.setupProgress'))
      const res = await enableDualLanguageAction(businessId)
      setSetupMessage(null)
      setBusy(false)
      if (!res.success) {
        toast.error(res.error)
        return
      }
      setConfig(res.data)
      setPrimaryDraft(res.data.primary_locale)
      toast.success(t('settings.storeLanguage.dualEnabled'))
      router.refresh()
      return
    }

    setBusy(true)
    const res = await disableDualLanguageAction(businessId)
    setBusy(false)
    if (!res.success) {
      toast.error(res.error)
      return
    }
    setConfig(res.data)
    toast.success(t('settings.storeLanguage.dualDisabled'))
    router.refresh()
  }

  return (
    <div className="relative space-y-8">
      {setupMessage && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm font-medium text-foreground">{setupMessage}</p>
        </div>
      )}

      <div className="flex items-start justify-between gap-4 rounded-lg border p-4">
        <div className="space-y-1">
          <Label htmlFor="dual-language" className="text-base font-medium">
            {t('settings.storeLanguage.dualToggle')}
          </Label>
          <p className="text-sm text-muted-foreground max-w-lg">
            {t('settings.storeLanguage.dualToggleHint')}
          </p>
        </div>
        <Switch
          id="dual-language"
          checked={config.dual_language_enabled}
          disabled={busy}
          onCheckedChange={handleDualToggle}
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-base font-medium">{t('settings.storeLanguage.primaryLabel')}</Label>
          <p className="text-sm text-muted-foreground mt-1">
            {t('settings.storeLanguage.primaryHint')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['vi', 'en'] as SupportedLocale[]).map((locale) => (
            <button
              key={locale}
              type="button"
              disabled={busy}
              onClick={() => setPrimaryDraft(locale)}
              className={cn(
                'rounded-md border px-4 py-2 text-sm font-medium transition-colors',
                primaryDraft === locale
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:bg-muted',
              )}
            >
              {locale === 'vi'
                ? t('settings.storeLanguage.vietnamese')
                : t('settings.storeLanguage.english')}
            </button>
          ))}
        </div>
        {primaryChanged && (
          <Button type="button" disabled={busy} onClick={handlePrimarySave}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : t('settings.storeLanguage.savePrimary')}
          </Button>
        )}
      </div>

      {config.dual_language_enabled && (
        <div className="rounded-lg bg-muted/50 border p-4 text-sm space-y-2">
          <p className="font-medium">{t('settings.storeLanguage.urlsTitle')}</p>
          <ul className="list-disc pl-5 text-muted-foreground space-y-1">
            <li>
              {t('settings.storeLanguage.primaryUrl').replace('{{path}}', pathExamples.primaryLanding)}
            </li>
            {pathExamples.secondaryLanding && (
              <li>
                {t('settings.storeLanguage.secondaryUrl').replace(
                  '{{path}}',
                  pathExamples.secondaryLanding,
                )}
              </li>
            )}
          </ul>
          <p className="text-muted-foreground pt-1">{t('settings.storeLanguage.secondaryEditHint')}</p>
          <p className="text-muted-foreground text-xs">{t('settings.storeLanguage.phase2Notice')}</p>
        </div>
      )}
    </div>
  )
}
