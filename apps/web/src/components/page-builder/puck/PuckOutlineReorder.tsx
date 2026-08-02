'use client'

/**
 * Outline panel with reorder controls for page sections.
 *
 * Intentionally avoids @dnd-kit/core here — Puck 0.22 uses @dnd-kit/react, and
 * nesting a separate @dnd-kit/core DndContext in this panel was freezing canvas
 * drag-and-drop until refresh.
 */

import { useMemo } from 'react'
import { usePuck } from '@puckeditor/core'
import { ChevronDown, ChevronUp, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'
import { PUCK_BLOCK_TYPES } from './adapters'
import { ROOT_ZONE, SITE_FOOTER, SITE_NAVBAR } from './constants'

const selectedRowClass = 'bg-primary/10'

function PageRow({
  label,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  moveUpLabel,
  moveDownLabel,
}: {
  label: string
  isSelected: boolean
  onSelect: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
  moveUpLabel: string
  moveDownLabel: string
}) {
  return (
    <li className={cn('flex items-center gap-0.5 rounded-md text-sm', isSelected && selectedRowClass)}>
      <div className="flex flex-col shrink-0">
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          onClick={onMoveUp}
          disabled={!canMoveUp}
          aria-label={moveUpLabel}
          title={moveUpLabel}
        >
          <ChevronUp className="size-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
          onClick={onMoveDown}
          disabled={!canMoveDown}
          aria-label={moveDownLabel}
          title={moveDownLabel}
        >
          <ChevronDown className="size-3.5" />
        </button>
      </div>
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

/** Outline panel with up/down reorder for page sections (Puck's default outline is select-only). */
export function PuckOutlineReorder() {
  const { t } = useTranslation()
  const { dispatch, appState, selectedItem } = usePuck()
  const content = appState.data.content

  const navbarEntry = content.find(c => c.type === SITE_NAVBAR)
  const footerEntry = content.find(c => c.type === SITE_FOOTER)

  const pageEntries = useMemo(
    () =>
      content
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => (PUCK_BLOCK_TYPES as readonly string[]).includes(item.type)),
    [content],
  )

  function selectAt(index: number) {
    dispatch({
      type: 'setUi',
      ui: { itemSelector: { index, zone: ROOT_ZONE } },
    })
  }

  function moveEntry(fromPageIdx: number, toPageIdx: number) {
    const source = pageEntries[fromPageIdx]
    const dest = pageEntries[toPageIdx]
    if (!source || !dest || fromPageIdx === toPageIdx) return

    dispatch({
      type: 'move',
      sourceZone: ROOT_ZONE,
      sourceIndex: source.index,
      destinationZone: ROOT_ZONE,
      destinationIndex: dest.index,
    })
  }

  const selectedId = selectedItem?.props?.id
  const moveUpLabel = t('puck.moveBlockUp')
  const moveDownLabel = t('puck.moveBlockDown')

  return (
    <div className="puck-outline-reorder text-sm">
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

        {pageEntries.map(({ item, index }, pageIdx) => {
          const type = item.type
          const label = t(`pageBuilder.blocks.${type}.label`)
          const isSelected = selectedId === item.props.id
          return (
            <PageRow
              key={String(item.props.id)}
              label={label}
              isSelected={isSelected}
              onSelect={() => selectAt(index)}
              onMoveUp={() => moveEntry(pageIdx, pageIdx - 1)}
              onMoveDown={() => moveEntry(pageIdx, pageIdx + 1)}
              canMoveUp={pageIdx > 0}
              canMoveDown={pageIdx < pageEntries.length - 1}
              moveUpLabel={moveUpLabel}
              moveDownLabel={moveDownLabel}
            />
          )
        })}

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
