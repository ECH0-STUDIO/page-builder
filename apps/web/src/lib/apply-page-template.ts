import { getDefaultConfig } from '@/components/page-builder/registry'
import { getInitialBlockSpacing } from '@/components/page-builder/spacing-utils'
import { PAGE_TEMPLATES, type TemplateThemePreset } from '@/components/page-builder/templates'
import type { PageBlock } from '@/components/page-builder/types'

function makeId() {
  return crypto.randomUUID()
}

export function buildBlocksFromTemplate(
  businessId: string,
  templateId: string,
): PageBlock[] | null {
  const template = PAGE_TEMPLATES.find(t => t.id === templateId)
  if (!template) return null

  return template.blocks.map((tb, i) => ({
    id: makeId(),
    business_id: businessId,
    type: tb.type,
    sort_order: i,
    visible: true,
    block_anchor_id: tb.block_anchor_id ?? null,
    config: {
      ...(getDefaultConfig(tb.type) as unknown as Record<string, unknown>),
      ...(tb.config ?? {}),
    } as PageBlock['config'],
    spacing: getInitialBlockSpacing(tb.type, {
      ...(getDefaultConfig(tb.type) as unknown as Record<string, unknown>),
      ...(tb.config ?? {}),
    } as PageBlock['config']),
    custom_css: '',
  }))
}

export function getTemplateThemePreset(templateId: string): TemplateThemePreset | undefined {
  return PAGE_TEMPLATES.find(t => t.id === templateId)?.theme
}
