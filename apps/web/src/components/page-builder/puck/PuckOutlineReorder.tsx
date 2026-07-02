'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePuck } from '@puckeditor/core'
import { GripVertical, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { PUCK_BLOCK_TYPES } from './adapters'
import { ROOT_ZONE, SITE_FOOTER, SITE_NAVBAR } from './constants'

const selectedRowClass = 'bg-primary/10'

function SortableRow({
  id,
  label,
  isSelected,
  onSelect,
}: {
  id: string
  label: string
  isSelected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className={cn('flex items-center gap-1 rounded-md text-sm', isSelected && selectedRowClass)}
    >
      <button
        type="button"
        className="p-1.5 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
      <button
        type="button"
        className="flex flex-1 items-center gap-2 py-2 pr-2 text-left min-w-0"
        onClick={onSelect}
      >
        <LayoutGrid className="size-4 shrink-0 opacity-60" />
        <span className="truncate">{label}</span>
      </button>
    </li>
  )
}

/** SSR-safe row — same layout without dnd-kit attributes (avoids hydration mismatch). */
function StaticPageRow({
  label,
  isSelected,
  onSelect,
}: {
  label: string
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <li className={cn('flex items-center gap-1 rounded-md text-sm', isSelected && selectedRowClass)}>
      <span className="p-1.5 text-muted-foreground" aria-hidden>
        <GripVertical className="size-3.5" />
      </span>
      <button
        type="button"
        className="flex flex-1 items-center gap-2 py-2 pr-2 text-left min-w-0"
        onClick={onSelect}
      >
        <LayoutGrid className="size-4 shrink-0 opacity-60" />
        <span className="truncate">{label}</span>
      </button>
    </li>
  )
}

function FixedRow({ label, isSelected, onSelect }: { label: string; isSelected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          'flex w-full items-center gap-2 py-2 px-2 rounded-md text-sm text-left',
          isSelected && selectedRowClass,
        )}
      >
        <LayoutGrid className="size-4 shrink-0 opacity-60" />
        <span className="truncate">{label}</span>
      </button>
    </li>
  )
}

/** Outline panel with drag-to-reorder for page sections (Puck's default outline is select-only). */
export function PuckOutlineReorder() {
  const { t } = useTranslation()
  const { dispatch, appState, selectedItem } = usePuck()
  const content = appState.data.content
  const [dndReady, setDndReady] = useState(false)

  // dnd-kit injects dynamic aria-* ids that differ between SSR and client — mount DnD after hydration.
  useEffect(() => {
    setDndReady(true)
  }, [])

  const navbarEntry = content.find(c => c.type === SITE_NAVBAR)
  const footerEntry = content.find(c => c.type === SITE_FOOTER)

  const pageEntries = useMemo(
    () =>
      content
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => (PUCK_BLOCK_TYPES as readonly string[]).includes(item.type)),
    [content],
  )

  const sortableIds = pageEntries.map(e => e.item.props?.id as string)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function selectAt(index: number) {
    dispatch({
      type: 'setUi',
      ui: { itemSelector: { index, zone: ROOT_ZONE } },
    })
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = sortableIds.indexOf(String(active.id))
    const newIdx = sortableIds.indexOf(String(over.id))
    if (oldIdx < 0 || newIdx < 0) return

    const source = pageEntries[oldIdx]
    const dest = pageEntries[newIdx]

    dispatch({
      type: 'move',
      sourceZone: ROOT_ZONE,
      sourceIndex: source.index,
      destinationZone: ROOT_ZONE,
      destinationIndex: dest.index,
    })
  }

  const selectedId = selectedItem?.props?.id

  const pageRows = pageEntries.map(({ item, index }) => {
    const type = item.type
    const label = t(`pageBuilder.blocks.${type}.label`)
    const isSelected = selectedId === item.props.id

    if (dndReady) {
      return (
        <SortableRow
          key={item.props.id as string}
          id={item.props.id as string}
          label={label}
          isSelected={isSelected}
          onSelect={() => selectAt(index)}
        />
      )
    }

    return (
      <StaticPageRow
        key={item.props.id as string}
        label={label}
        isSelected={isSelected}
        onSelect={() => selectAt(index)}
      />
    )
  })

  return (
    <div className="p-3 text-sm">
      <ul className="space-y-0.5">
        {navbarEntry && (
          <FixedRow
            label={t('pageBuilder.header')}
            isSelected={selectedId === navbarEntry.props.id}
            onSelect={() => {
              const idx = content.indexOf(navbarEntry)
              selectAt(idx)
            }}
          />
        )}

        {dndReady ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {pageRows}
            </SortableContext>
          </DndContext>
        ) : (
          pageRows
        )}

        {footerEntry && (
          <FixedRow
            label={t('pageBuilder.footer')}
            isSelected={selectedId === footerEntry.props.id}
            onSelect={() => {
              const idx = content.indexOf(footerEntry)
              selectAt(idx)
            }}
          />
        )}
      </ul>

      {pageEntries.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">{t('puck.outlineEmpty')}</p>
      )}
    </div>
  )
}
