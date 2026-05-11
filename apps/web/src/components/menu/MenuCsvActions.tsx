'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Download, Upload, Undo2, AlertCircle, CheckCircle2, X } from 'lucide-react'
import {
  buildMenuCsv, parseMenuCsv, computeMerge,
  SAMPLE_CSV, type CsvValidationError,
} from '@/lib/menu-csv'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { VariantGroup, VariantOption } from '@/app/actions/menu'
import type { ParsedVariantGroup } from '@/lib/menu-csv'

interface Category { id: string; name: string; sort_order: number }
interface Item {
  id: string; category_id: string; name: string
  description: string | null; price: number; available: boolean; sort_order: number
}

interface MenuCsvActionsProps {
  businessId: string
  categories: Category[]
  items: Item[]
  onRefresh: () => void  // called after a successful import to re-fetch data
}

type ImportState =
  | { status: 'idle' }
  | { status: 'errors'; errors: CsvValidationError[] }
  | { status: 'preview'; summary: { added: number; updated: number; unchanged: number } }
  | { status: 'success'; canRevert: boolean }

// ─── Snapshot stored in localStorage ─────────────────────────────────────────

const SNAPSHOT_KEY = (id: string) => `menu-snapshot-${id}`
const SNAPSHOT_TTL_MS = 10 * 60 * 1000  // 10 minutes

function saveSnapshot(businessId: string, categories: Category[], items: Item[]) {
  localStorage.setItem(SNAPSHOT_KEY(businessId), JSON.stringify({
    categories, items, savedAt: Date.now(),
  }))
}

function loadSnapshot(businessId: string): { categories: Category[]; items: Item[] } | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY(businessId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Date.now() - parsed.savedAt > SNAPSHOT_TTL_MS) {
      localStorage.removeItem(SNAPSHOT_KEY(businessId))
      return null
    }
    return parsed
  } catch { return null }
}

function clearSnapshot(businessId: string) {
  localStorage.removeItem(SNAPSHOT_KEY(businessId))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MenuCsvActions({ businessId, categories, items, onRefresh }: MenuCsvActionsProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [importState, setImportState] = useState<ImportState>({ status: 'idle' })
  const [pendingRows, setPendingRows] = useState<ReturnType<typeof parseMenuCsv>['rows']>([])
  const [isPending, startTransition] = useTransition()
  const [hasSnapshot, setHasSnapshot] = useState(() => !!loadSnapshot(businessId))
  const [existingVariants, setExistingVariants] = useState<{ groups: VariantGroup[], options: VariantOption[] }>({ groups: [], options: [] })

  // ── Download current menu as CSV ──────────────────────────────────────────

  async function handleDownload() {
    const supabase = createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    // Fetch all variant groups and options for these items
    const itemIds = items.map(i => i.id)
    let variantGroups: VariantGroup[] = []
    let variantOptions: VariantOption[] = []

    if (itemIds.length > 0) {
      const { data: groups } = await db.from('menu_item_variant_groups').select('*').in('item_id', itemIds).order('sort_order', { ascending: true })
      variantGroups = groups ?? []

      const groupIds = variantGroups.map(g => g.id)
      if (groupIds.length > 0) {
        const { data: options } = await db.from('menu_item_variant_options').select('*').in('group_id', groupIds).order('sort_order', { ascending: true })
        variantOptions = options ?? []
      }
    }

    const csv = buildMenuCsv(categories, items, variantGroups, variantOptions)
    // Prepend UTF-8 BOM so Excel / Numbers / Google Sheets reads Vietnamese correctly
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'menu.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  function handleDownloadSample() {
    const blob = new Blob(['﻿' + SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'menu-sample.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── File picked — validate before applying ─────────────────────────────────

  function handleFilePick(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const text = e.target?.result as string
      const { rows, errors } = parseMenuCsv(text)

      if (errors.length > 0) {
        setImportState({ status: 'errors', errors })
        setPendingRows([])
        return
      }

      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any
      const itemIds = items.map(i => i.id)
      let variantGroups: VariantGroup[] = []
      let variantOptions: VariantOption[] = []

      if (itemIds.length > 0) {
        const { data: groups } = await db.from('menu_item_variant_groups').select('*').in('item_id', itemIds).order('sort_order', { ascending: true })
        variantGroups = groups ?? []
        const groupIds = variantGroups.map(g => g.id)
        if (groupIds.length > 0) {
          const { data: options } = await db.from('menu_item_variant_options').select('*').in('group_id', groupIds).order('sort_order', { ascending: true })
          variantOptions = options ?? []
        }
      }

      setExistingVariants({ groups: variantGroups, options: variantOptions })

      const { stats } = computeMerge(rows, categories, items, variantGroups, variantOptions)
      setPendingRows(rows)
      setImportState({ status: 'preview', summary: stats })
    }
    reader.readAsText(file)
    // Reset the input so same file can be re-selected
    if (fileRef.current) fileRef.current.value = ''
  }

  // ── Apply the import ───────────────────────────────────────────────────────

  function handleApply() {
    startTransition(async () => {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      // Save snapshot BEFORE making any changes
      saveSnapshot(businessId, categories, items)
      setHasSnapshot(true)

      const merge = computeMerge(pendingRows, categories, items, existingVariants.groups, existingVariants.options)

      // Helper to sync variants
      async function syncItemVariants(dbInstance: any, itemId: string, parsedOptions: ParsedVariantGroup[]) {
        const { data: existingGroups } = await dbInstance.from('menu_item_variant_groups').select('id').eq('item_id', itemId)
        if (existingGroups && existingGroups.length > 0) {
          const groupIds = existingGroups.map((g: any) => g.id)
          await dbInstance.from('menu_item_variant_options').delete().in('group_id', groupIds)
          await dbInstance.from('menu_item_variant_groups').delete().in('id', groupIds)
        }
        for (let i = 0; i < parsedOptions.length; i++) {
          const group = parsedOptions[i]
          const { data: newGroup } = await dbInstance.from('menu_item_variant_groups').insert({
            item_id: itemId,
            name: group.name,
            required: group.required,
            sort_order: i
          }).select('id').single()
          if (newGroup && group.options.length > 0) {
            const optionsToInsert = group.options.map((opt, j) => ({
              group_id: newGroup.id,
              label: opt.label,
              price_delta: opt.priceDelta,
              sort_order: j
            }))
            await dbInstance.from('menu_item_variant_options').insert(optionsToInsert)
          }
        }
      }

      // 1. Create missing categories
      const newCatMap: Record<string, string> = {}
      for (const catName of merge.newCategories) {
        const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), -1)
        const { data } = await db
          .from('menu_categories')
          .insert({ business_id: businessId, name: catName, sort_order: maxOrder + 1 })
          .select('id, name')
          .single()
        if (data) newCatMap[catName.toLowerCase()] = data.id
      }

      // Build full category map (existing + newly created)
      const catMap = new Map([
        ...categories.map(c => [c.name.toLowerCase(), c.id] as [string, string]),
        ...Object.entries(newCatMap),
      ])

      // 2. Update existing items
      for (const upd of merge.toUpdate) {
        await db.from('menu_items').update({
          description: upd.description || null,
          price: upd.price,
          available: upd.available,
        }).eq('id', upd.id)

        if (upd.parsedOptions !== undefined) {
          await syncItemVariants(db, upd.id, upd.parsedOptions)
        }
      }

      // 3. Insert new items
      const existingItems = [...items]
      for (const newItem of merge.toCreate) {
        const catId = catMap.get(newItem.categoryName.toLowerCase())
        if (!catId) continue
        const catItems = existingItems.filter(i => i.category_id === catId)
        const nextOrder = catItems.reduce((m, i) => Math.max(m, i.sort_order), -1) + 1
        const { data } = await db.from('menu_items').insert({
          business_id: businessId,
          category_id: catId,
          name: newItem.name,
          description: newItem.description || null,
          price: newItem.price,
          available: newItem.available,
          sort_order: nextOrder,
        }).select().single()
        if (data) {
          existingItems.push(data)
          if (newItem.parsedOptions !== undefined) {
            await syncItemVariants(db, data.id, newItem.parsedOptions)
          }
        }
      }

      setImportState({ status: 'success', canRevert: true })
      toast.success(`Import complete: ${merge.stats.added} added, ${merge.stats.updated} updated`)
      onRefresh()
    })
  }

  // ── Revert to snapshot ────────────────────────────────────────────────────

  function handleRevert() {
    startTransition(async () => {
      const snapshot = loadSnapshot(businessId)
      if (!snapshot) { toast.error('Snapshot expired'); setHasSnapshot(false); return }

      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      // Delete all current items & categories and restore snapshot
      await db.from('menu_items').delete().eq('business_id', businessId)
      await db.from('menu_categories').delete().eq('business_id', businessId)

      if (snapshot.categories.length > 0) {
        await db.from('menu_categories').insert(
          snapshot.categories.map((c: Category) => ({ ...c, business_id: businessId }))
        )
      }
      if (snapshot.items.length > 0) {
        await db.from('menu_items').insert(
          snapshot.items.map((i: Item) => ({ ...i, business_id: businessId }))
        )
      }

      clearSnapshot(businessId)
      setHasSnapshot(false)
      setImportState({ status: 'idle' })
      toast.success('Menu reverted to previous state')
      onRefresh()
    })
  }

  function dismiss() {
    setImportState({ status: 'idle' })
    setPendingRows([])
  }

  return (
    <div className="space-y-3">
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={handleDownload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Download className="size-3.5" /> Export CSV
        </button>

        <label className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer',
          'border-gray-900 bg-gray-900 text-white hover:bg-gray-800'
        )}>
          <Upload className="size-3.5" /> Import CSV
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
            onChange={e => e.target.files?.[0] && handleFilePick(e.target.files[0])} />
        </label>

        {hasSnapshot && (
          <button onClick={handleRevert} disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50">
            <Undo2 className="size-3.5" /> Undo last import
          </button>
        )}

        <button onClick={handleDownloadSample}
          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
          Download sample CSV
        </button>
      </div>

      {/* Validation errors */}
      {importState.status === 'errors' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 font-medium text-sm">
              <AlertCircle className="size-4" /> CSV format error
            </div>
            <button onClick={dismiss} className="text-red-400 hover:text-red-600"><X className="size-4" /></button>
          </div>
          <ul className="space-y-1">
            {importState.errors.map((e, i) => (
              <li key={i} className="text-xs text-red-600">
                {e.row === 0 ? '' : `Row ${e.row}: `}{e.message}
              </li>
            ))}
          </ul>
          <button onClick={handleDownloadSample}
            className="text-xs text-red-600 underline hover:text-red-800">
            Download sample CSV to see correct format
          </button>
        </div>
      )}

      {/* Import preview */}
      {importState.status === 'preview' && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm font-medium text-blue-900">Ready to import</p>
              <p className="text-xs text-blue-700">
                {importState.summary.added > 0 && <span>{importState.summary.added} new items · </span>}
                {importState.summary.updated > 0 && <span>{importState.summary.updated} updated · </span>}
                {importState.summary.unchanged > 0 && <span>{importState.summary.unchanged} unchanged</span>}
              </p>
              <p className="text-xs text-blue-600">Existing items not in the CSV will not be deleted.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={dismiss}
                className="px-3 py-1.5 rounded-lg border border-blue-300 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleApply} disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-medium hover:bg-blue-800 transition-colors disabled:opacity-50">
                {isPending ? 'Importing…' : 'Apply Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success */}
      {importState.status === 'success' && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-green-800 text-sm">
            <CheckCircle2 className="size-4 text-green-600" />
            Import applied successfully. You can undo within 10 minutes.
          </div>
          <button onClick={dismiss} className="text-green-500 hover:text-green-700"><X className="size-4" /></button>
        </div>
      )}
    </div>
  )
}
