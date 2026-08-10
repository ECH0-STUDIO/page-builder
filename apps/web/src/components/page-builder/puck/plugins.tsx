'use client'

import { createContext, useContext } from 'react'
import type { Plugin } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import { Hammer, Layers, LayoutTemplate, Settings } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'
import { PuckOutlineReorder } from './PuckOutlineReorder'
import { GlobalSettingsPanel } from '../blocks/GlobalSettingsPanel'
import { usePuckTemplateActions } from './PuckTemplateContext'
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

  return (
    <PuckPluginPanel>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('pageBuilder.templatePickerHint')}
        </p>
        <button
          type="button"
          onClick={() => templateActions?.openTemplatePicker()}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold hover:bg-accent transition-colors"
        >
          <LayoutTemplate className="size-4" />
          {t('pageBuilder.templates')}
        </button>
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
