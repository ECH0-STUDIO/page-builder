'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getLocalizedFieldForEdit, setLocalizedField, type LocalizedValue } from '@/i18n/locale'
import { useLocaleEdit } from './LocaleEditContext'

type InputProps = React.ComponentProps<typeof Input>
type TextareaProps = React.ComponentProps<typeof Textarea>

type LocalizedFieldProps = {
  value: LocalizedValue
  locale?: string
  onChange: (value: LocalizedValue) => void
  enabledLocales?: string[]
  primaryLocale?: string
}

export function LocalizedInput({
  value,
  locale: localeProp,
  onChange,
  enabledLocales: enabledProp,
  primaryLocale: primaryProp,
  ...props
}: LocalizedFieldProps & Omit<InputProps, 'value' | 'onChange'>) {
  const ctx = useLocaleEdit()
  const locale = localeProp ?? ctx.editLocale
  const enabledLocales = enabledProp ?? ctx.enabledLocales
  const primaryLocale = primaryProp ?? ctx.primaryLocale

  return (
    <Input
      {...props}
      value={getLocalizedFieldForEdit(value, locale)}
      onChange={e => onChange(
        setLocalizedField(value, locale, e.target.value, enabledLocales, primaryLocale),
      )}
    />
  )
}

export function LocalizedTextarea({
  value,
  locale: localeProp,
  onChange,
  enabledLocales: enabledProp,
  primaryLocale: primaryProp,
  ...props
}: LocalizedFieldProps & Omit<TextareaProps, 'value' | 'onChange'>) {
  const ctx = useLocaleEdit()
  const locale = localeProp ?? ctx.editLocale
  const enabledLocales = enabledProp ?? ctx.enabledLocales
  const primaryLocale = primaryProp ?? ctx.primaryLocale

  return (
    <Textarea
      {...props}
      value={getLocalizedFieldForEdit(value, locale)}
      onChange={e => onChange(
        setLocalizedField(value, locale, e.target.value, enabledLocales, primaryLocale),
      )}
    />
  )
}
