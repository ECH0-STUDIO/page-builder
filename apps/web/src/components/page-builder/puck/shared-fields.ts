import type { Field } from '@puckeditor/core'
import type { SectionSize } from '../spacing-presets'

type Translate = (key: string) => string

export function spacingSizeField(t: Translate) {
  return {
    type: 'radio',
    label: t('pageBuilder.sectionSpacing'),
    options: [
      { label: t('pageBuilder.spacingSmall'), value: 'small' },
      { label: t('pageBuilder.spacingMedium'), value: 'medium' },
      { label: t('pageBuilder.spacingLarge'), value: 'large' },
    ],
  } satisfies Field<{ spacingSize: SectionSize }>
}

export function visibleField(t: Translate) {
  return {
    type: 'radio',
    label: t('pageBuilder.blockVisibility'),
    options: [
      { label: t('pageBuilder.blockVisible'), value: true },
      { label: t('pageBuilder.blockHidden'), value: false },
    ],
  } satisfies Field<{ visible: boolean }>
}
