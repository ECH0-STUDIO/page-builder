'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useEditorLocale } from '@/components/i18n/EditorLocaleContext'
import { readLocaleText, type LocalizedString } from '@/i18n/localized-content'
import { writeLocaleText } from '@/i18n/editor-locale-utils'

interface LocalizedFieldProps {
  label?: string
  value: LocalizedString
  onChange: (value: Record<string, string>) => void
  placeholder?: string
  multiline?: boolean
  rows?: number
  id?: string
  className?: string
}

export function LocalizedTextField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  rows = 3,
  id,
  className,
}: LocalizedFieldProps) {
  const { contentLocale, primaryLocale } = useEditorLocale()
  const display = readLocaleText(value, contentLocale, primaryLocale)

  function handleChange(text: string) {
    onChange(writeLocaleText(value, contentLocale, text, primaryLocale))
  }

  const fieldId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={fieldId} className="text-xs font-medium mb-1.5 block">
          {label}
        </Label>
      )}
      {multiline ? (
        <Textarea
          id={fieldId}
          value={display}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          id={fieldId}
          value={display}
          onChange={e => handleChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  )
}
