import type { Field } from '@puckeditor/core'
import type { SectionSize } from '../spacing-presets'
import type { BlockHeight, HeroLayout } from '../types'

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

export function heroLayoutField(t: Translate) {
  return {
    type: 'radio',
    label: t('heroBlock.layout'),
    options: [
      { label: t('heroBlock.overlay'), value: 'overlay' },
      { label: t('heroBlock.split'), value: 'split' },
      { label: t('heroBlock.textOnly'), value: 'text_only' },
    ],
  } satisfies Field<{ layout: HeroLayout }>
}

export function heroHeightField(t: Translate) {
  return {
    type: 'radio',
    label: t('heroBlock.blockHeight'),
    options: [
      { label: t('heroBlock.custom'), value: 'custom' },
      { label: t('heroBlock.fullscreen'), value: 'fullscreen' },
    ],
  } satisfies Field<{ height: BlockHeight }>
}
