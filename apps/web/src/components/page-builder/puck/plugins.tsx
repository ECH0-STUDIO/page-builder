'use client'

import type { Plugin } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import { Hammer, Layers } from 'lucide-react'
import { PuckOutlineReorder } from './PuckOutlineReorder'

/** Match Puck's built-in BlocksPlugin / OutlinePlugin panel padding. */
function PuckPluginPanel({ children }: { children: React.ReactNode }) {
  return <div className="puck-plugin-panel">{children}</div>
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
  ]
}
