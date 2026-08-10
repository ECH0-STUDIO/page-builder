'use client'

import { createContext, useContext } from 'react'
import type { Plugin } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import { Hammer, Layers, LayoutTemplate, Loader2, Settings } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { PuckOutlineReorder } from './PuckOutlineReorder'
import { GlobalSettingsPanel } from '../blocks/GlobalSettingsPanel'
import { usePuckTemplateActions } from './PuckTemplateContext'
import { PAGE_TEMPLATES } from '../templates'
import { cn } from '@/lib/utils'
import type { PublishingSettings, ThemeSettings } from '../types'

/** Match Puck's built-in BlocksPlugin / OutlinePlugin panel padding. */
function PuckPluginPanel({ children }: { children: React.ReactNode }) {
  return <div className="puck-plugin-panel">{children}</div>
}

export interface PuckSettingsPanelState {
  theme: ThemeSettings | null
  publishing: PublishingSettings | null
  onThemeChange: (updated: Partial<ThemeSettings>) => void
  onPublishingChange: (updated: Partial<PublishingSettings>) => void
}

export const PuckSettingsContext = createContext<PuckSettingsPanelState | null>(null)

function TemplatesPluginPanel() {
  const templateActions = usePuckTemplateActions()
  const { t } = useTranslation()
  const applying = templateActions?.applyingTemplate ?? false

  return (
    <PuckPluginPanel>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('pageBuilder.templatePickerHint')}
        </p>
        {PAGE_TEMPLATES.map(tmpl => (
          <button
            key={tmpl.id}
            type="button"
            disabled={applying}
            onClick={() => templateActions?.selectTemplate(tmpl.id)}
            className={cn(
              'w-full text-left p-3 rounded-xl border border-border hover:border-primary',
              'bg-background hover:bg-primary/5 transition-all duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              applying && 'opacity-60 pointer-events-none',
            )}
          >
            <div className="flex items-start gap-2">
              <LayoutTemplate className="size-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">{t(tmpl.label)}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t(tmpl.description)}
                </p>
                {tmpl.blocks.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {tmpl.blocks.map((b, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground capitalize"
                      >
                        {b.type.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {applying && <Loader2 className="size-4 animate-spin text-muted-foreground shrink-0" />}
            </div>
          </button>
        ))}
      </div>
    </PuckPluginPanel>
  )
}

function GlobalSettingsPluginPanel() {
  const settings = useContext(PuckSettingsContext)
  if (!settings) {
    return (
      <PuckPluginPanel>
        <p className="text-sm text-muted-foreground">Settings unavailable</p>
      </PuckPluginPanel>
    )
  }

  return (
    <PuckPluginPanel>
      <GlobalSettingsPanel
        theme={settings.theme}
        publishing={settings.publishing}
        onThemeChange={settings.onThemeChange}
        onPublishingChange={settings.onPublishingChange}
      />
    </PuckPluginPanel>
  )
}

export function createPuckPlugins(t: (key: string) => string): Plugin[] {
  return [
    {
      name: 'blocks',
      label: t('puck.blocks'),
      icon: <Hammer size={16} />,
      render: () => (
        <PuckPluginPanel>
          <Puck.Components />
        </PuckPluginPanel>
      ),
    },
    {
      name: 'outline',
      label: t('puck.outline'),
      icon: <Layers size={16} />,
      render: () => (
        <PuckPluginPanel>
          <PuckOutlineReorder />
        </PuckPluginPanel>
      ),
    },
    {
      name: 'templates',
      label: t('pageBuilder.templates'),
      icon: <LayoutTemplate size={16} />,
      render: () => <TemplatesPluginPanel />,
    },
    {
      name: 'settings',
      label: t('pageBuilder.globalSettings'),
      icon: <Settings size={16} data-puck-plugin="settings" />,
      render: () => <GlobalSettingsPluginPanel />,
    },
  ]
}
