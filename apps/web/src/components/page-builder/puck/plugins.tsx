'use client'

import type { Plugin } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import { Hammer, Layers } from 'lucide-react'
import { PuckOutlineReorder } from './PuckOutlineReorder'

export function createPuckPlugins(t: (key: string) => string): Plugin[] {
  return [
    {
      name: 'blocks',
      label: t('puck.blocks'),
      icon: <Hammer size={16} />,
      render: () => <Puck.Components />,
    },
    {
      name: 'outline',
      label: t('puck.outline'),
      icon: <Layers size={16} />,
      render: () => <PuckOutlineReorder />,
    },
  ]
}
