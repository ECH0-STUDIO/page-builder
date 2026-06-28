'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { getLocalizedField, setLocalizedField, type LocalizedValue, type SupportedLocale } from '@/i18n/locale'

type InputProps = React.ComponentProps<typeof Input>
type TextareaProps = React.ComponentProps<typeof Textarea>

export function LocalizedInput({
  value,
  locale,
  onChange,
  ...props
}: {
  value: LocalizedValue
  locale: SupportedLocale
  onChange: (value: LocalizedValue) => void
} & Omit<InputProps, 'value' | 'onChange'>) {
  return (
    <Input
      {...props}
      value={getLocalizedField(value, locale)}
      onChange={e => onChange(setLocalizedField(value, locale, e.target.value))}
    />
  )
}

export function LocalizedTextarea({
  value,
  locale,
  onChange,
  ...props
}: {
  value: LocalizedValue
  locale: SupportedLocale
  onChange: (value: LocalizedValue) => void
} & Omit<TextareaProps, 'value' | 'onChange'>) {
  return (
    <Textarea
      {...props}
      value={getLocalizedField(value, locale)}
      onChange={e => onChange(setLocalizedField(value, locale, e.target.value))}
    />
  )
}
