'use client'

/**
 * Shared brand / text / font fields used by:
 * - Landing page builder Global Settings
 * - Order page Appearance tab
 */

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ColorSwatchField } from '@/components/shared/ColorSwatchField'
import { GOOGLE_FONTS as FONTS } from '@/components/page-builder/types'
import { useTranslation } from '@/i18n/I18nProvider'

export interface ThemeAppearanceValues {
  brandColor: string
  textColor: string
  headingFont: string
  bodyFont: string
  /** Theme page background — shown in Global Settings; omit on order page */
  backgroundColor?: string
}

interface ThemeAppearanceFieldsProps {
  values: ThemeAppearanceValues
  onChange: (patch: Partial<ThemeAppearanceValues>) => void
  textColorHint?: string
  showBackgroundColor?: boolean
  /** Hide text colour — e.g. order page where it has no effect */
  hideTextColor?: boolean
}

export function ThemeAppearanceFields({
  values,
  onChange,
  textColorHint,
  showBackgroundColor = false,
  hideTextColor = false,
}: ThemeAppearanceFieldsProps) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <ColorSwatchField
          label={t('pageBuilder.brandColor')}
          value={values.brandColor}
          fallback="#E85D26"
          onChange={v => onChange({ brandColor: v })}
        />
        {showBackgroundColor ? (
          <ColorSwatchField
            label={t('pageBuilder.background')}
            value={values.backgroundColor || '#FFFFFF'}
            fallback="#FFFFFF"
            onChange={v => onChange({ backgroundColor: v })}
          />
        ) : !hideTextColor ? (
          <ColorSwatchField
            label={t('pageBuilder.textColor')}
            value={values.textColor}
            fallback="#111111"
            onChange={v => onChange({ textColor: v })}
            hint={textColorHint}
          />
        ) : null}
        {showBackgroundColor && !hideTextColor && (
          <ColorSwatchField
            label={t('pageBuilder.textColor')}
            value={values.textColor}
            fallback="#111111"
            onChange={v => onChange({ textColor: v })}
            hint={textColorHint}
            wrapperClassName="col-span-2"
          />
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t('pageBuilder.headingFont')}</Label>
        <Select
          value={values.headingFont || 'Inter'}
          onValueChange={v => onChange({ headingFont: v })}
        >
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {FONTS.map(f => (
              <SelectItem key={f.name} value={f.name} className="text-xs">
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">{t('pageBuilder.bodyFont')}</Label>
        <Select
          value={values.bodyFont || 'Inter'}
          onValueChange={v => onChange({ bodyFont: v })}
        >
          <SelectTrigger className="text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {FONTS.map(f => (
              <SelectItem key={f.name} value={f.name} className="text-xs">
                {f.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
