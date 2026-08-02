'use client'

import { createContext, useContext } from 'react'
import type { Plugin } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import { Hammer, Layers, Settings } from 'lucide-react'
import { PuckOutlineReorder } from './PuckOutlineReorder'
import { GlobalSettingsPanel } from '../blocks/GlobalSettingsPanel'
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
      name: 'settings',
      label: t('pageBuilder.globalSettings'),
      icon: <Settings size={16} data-puck-plugin="settings" />,
      render: () => <GlobalSettingsPluginPanel />,
    },
  ]
}
