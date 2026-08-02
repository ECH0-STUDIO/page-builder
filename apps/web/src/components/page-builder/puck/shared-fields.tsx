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

/** Section ID used for #anchor scroll-to links (navbar / CTA). */
export function anchorIdField(t: Translate) {
  return {
    type: 'custom',
    label: t('pageBuilder.sectionAnchor'),
    render: ({ value, onChange }) => (
      <div className="flex flex-col gap-1.5">
        <p className="text-[11px] text-muted-foreground leading-snug">
          {t('pageBuilder.sectionAnchorHint')}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-mono">#</span>
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={e => onChange(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
            placeholder={t('pageBuilder.sectionAnchorPlaceholder')}
            className="flex-1 h-9 px-3 rounded-md border border-border bg-background text-sm font-mono"
          />
        </div>
      </div>
    ),
  } satisfies Field<string>
}
