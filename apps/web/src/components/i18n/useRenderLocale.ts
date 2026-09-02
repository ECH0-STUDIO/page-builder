'use client'

import { useEditorLocale } from '@/components/i18n/EditorLocaleContext'
import { toSupportedLocale, type SupportedLocale } from '@/i18n/locale'

/**
 * Resolve active locale for block renders.
 * In the page builder, subscribes to EditorLocaleContext so canvas updates
 * when VI/EN tabs change (Puck may not re-render blocks from ref updates alone).
 */
export function useRenderLocale(
  editorLocaleMode: boolean | undefined,
  locale: string | undefined,
  primaryLocale: SupportedLocale | undefined,
): {
  activeLocale: SupportedLocale
  activePrimary: SupportedLocale
  strictEditorLocale: boolean
} {
  const editorLocale = useEditorLocale()
  if (editorLocaleMode) {
    return {
      activeLocale: editorLocale.contentLocale,
      activePrimary: editorLocale.primaryLocale,
      strictEditorLocale: true,
    }
  }
  return {
    activeLocale: toSupportedLocale(locale),
    activePrimary: primaryLocale ?? 'vi',
    strictEditorLocale: false,
  }
}
