import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FooterConfig } from '../types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/i18n/I18nProvider'
import type { SupportedLocale } from '@/i18n/locale'
import { LocalizedInput } from '@/components/i18n/LocalizedField'
import { saveFooterAction } from '@/app/actions/page-builder'

export function FooterSettings({
  config,
  onChange,
  businessId,
  editLocale,
}: {
  config: FooterConfig
  onChange: (config: FooterConfig) => void
  businessId: string
  editLocale: SupportedLocale
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const set = (k: keyof FooterConfig, v: FooterConfig[keyof FooterConfig]) => onChange({ ...config, [k]: v })

  async function handleSave() {
    setSaving(true)
    const result = await saveFooterAction(businessId, config)
    if (result.success) {
      toast.success(t('footerBlock.footerSaved'))
    } else {
      toast.error(t('footerBlock.saveFailed') + ' ' + result.error)
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Check className="size-3.5 mr-1.5" />}
        {saving ? t('footerBlock.saving') : t('footerBlock.saveFooter')}
      </Button>

      <div>
        <h3 className="text-sm font-semibold mb-1">{t('footerBlock.footerSettings')}</h3>
        <p className="text-xs text-muted-foreground">{t('footerBlock.appearsBottom')}</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="footer-show-business-name" className="text-xs cursor-pointer">{t('footerBlock.showBusinessName')}</Label>
          <Switch
            id="footer-show-business-name"
            checked={config.show_business_name}
            onCheckedChange={v => set('show_business_name', v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">{t('footerBlock.copyrightText')}</Label>
          <LocalizedInput
            locale={editLocale}
            value={config.copyright_text}
            onChange={v => set('copyright_text', v)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('footerBlock.colours')}</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{t('footerBlock.background')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.background_color}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t('footerBlock.text')}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.text_color}
                onChange={e => set('text_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.text_color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
