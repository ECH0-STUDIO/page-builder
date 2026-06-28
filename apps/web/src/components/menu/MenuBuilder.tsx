'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Eye, EyeOff, MoreHorizontal,
  X, Loader2, ImageIcon, ChevronDown, ChevronUp, QrCode, Check, Copy,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TagInput } from '@/components/ui/tag-input'
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger,
} from '@/components/ui/drawer'
import { cn } from '@/lib/utils'
import { uploadImageToStorage } from '@/lib/image-utils'
import { ImageUploader } from '@/components/shared/ImageUploader'
import { formatCurrency, formatPriceDelta } from '@/lib/currency'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import { MenuCsvActions } from '@/components/menu/MenuCsvActions'
import { useTranslation } from '@/i18n/I18nProvider'
import { createClient } from '@/lib/supabase/client'

import {
  addCategoryAction, updateCategoryAction, deleteCategoryAction,
  addItemAction, updateItemAction, deleteItemAction,
  getItemVariantsAction,
  addVariantGroupAction, updateVariantGroupAction, deleteVariantGroupAction,
  addVariantOptionAction, deleteVariantOptionAction,
  bulkDeleteItemsAction, bulkUpdateAvailabilityAction,
} from '@/app/actions/menu'
import { useMenu } from '@/lib/react-query/hooks/useMenu'
import { useQueryClient } from '@tanstack/react-query'
import { useBusiness } from '@/context/BusinessContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// QR download (client-side, no API cost)
async function downloadItemQR(item: MenuItem, businessSlug: string) {
  const QRCode = (await import('qrcode')).default
  const url = `${window.location.origin}/${businessSlug}#item-${item.id}`
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, url, { width: 400, margin: 2 })
  const link = document.createElement('a')
  link.download = `${item.name.replace(/\s+/g, '-').toLowerCase()}-qr.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const ITEM_TAG_SUGGESTIONS = [
  'Bestseller', 'Spicy', 'Vegetarian', 'Vegan', 'Gluten-free',
  'New', 'Chef special', 'Seasonal', 'Halal',
]

// ─── Variant Option Row ───────────────────────────────────────────────────────

function VariantOptionRow({ option, onDelete }: { option: VariantOption; onDelete: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-2 px-3 py-2 group/opt">
      <span className="flex-1 text-sm">{option.label}</span>
      <span className="text-sm text-muted-foreground tabular-nums shrink-0">
        {formatPriceDelta(option.price_delta, 'VND', t('menuBuilder.included'))}
      </span>
      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover/opt:opacity-100 transition-opacity text-muted-foreground hover:text-destructive ml-1"
      >
        <X className="size-3.5" />
      </button>
    </div>
  )
}

// ─── Variant Group Card ───────────────────────────────────────────────────────

function VariantGroupCard({
  group, options, onDelete, onToggleRequired, onToggleAllowMultiple, onAddOption, onDeleteOption,
}: {
  group: VariantGroup
  options: VariantOption[]
  onDelete: () => void
  onToggleRequired: () => void
  onToggleAllowMultiple: () => void
  onAddOption: (label: string, priceDelta: number) => Promise<void>
  onDeleteOption: (id: string) => void
}) {
  const { t } = useTranslation()
  const [newLabel, setNewLabel] = useState('')
  const [newPrice, setNewPrice] = useState('0')
  const [adding, setAdding] = useState(false)
  const [expanded, setExpanded] = useState(true)

  async function handleAdd() {
    if (!newLabel.trim()) return
    setAdding(true)
    await onAddOption(newLabel, parseFloat(newPrice) || 0)
    setNewLabel('')
    setNewPrice('0')
    setAdding(false)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center px-3 py-2 bg-muted/50 gap-2">
        <button type="button" onClick={() => setExpanded(v => !v)} className="text-muted-foreground">
          {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
        </button>
        <span className="font-semibold text-sm flex-1">{group.name}</span>
        <button
          type="button"
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {expanded && (
        <>
          <div className="px-3 py-2.5 border-b border-border/50 bg-muted/10 flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Switch id={`grp-req-${group.id}`} checked={group.required} onCheckedChange={onToggleRequired} />
              <Label htmlFor={`grp-req-${group.id}`} className="text-xs font-medium cursor-pointer">
                {group.required ? t('menuBuilder.required') : t('menuBuilder.optional')}
              </Label>
            </div>
            <div className="flex items-center gap-2 shrink-0 border-l pl-4 border-border/50">
              <Switch id={`grp-mult-${group.id}`} checked={group.allow_multiple} onCheckedChange={onToggleAllowMultiple} />
              <Label htmlFor={`grp-mult-${group.id}`} className="text-xs font-medium cursor-pointer">
                {group.allow_multiple ? (t('menuBuilder.multipleChoice') || 'Nhiều lựa chọn') : (t('menuBuilder.singleChoice') || 'Một lựa chọn')}
              </Label>
            </div>
          </div>
          {options.length > 0 && (
            <div className="divide-y divide-border/60">
              {options.map(opt => (
                <VariantOptionRow key={opt.id} option={opt} onDelete={() => onDeleteOption(opt.id)} />
              ))}
            </div>
          )}
          <div className="flex gap-2 px-3 py-2 border-t border-border/60 bg-muted/20">
            <Input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
              placeholder={t('menuBuilder.optionName')}
              className="h-7 text-xs flex-1"
            />
            <Input
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              type="number"
              step={1000}
              placeholder={t('menuBuilder.priceDelta')}
              className="h-7 text-xs w-24"
              title="+10000 = +10k₫, -5000 = -5k₫"
            />
            <Button
              type="button"
              size="sm"
              className="h-7 text-xs px-3"
              onClick={handleAdd}
              disabled={!newLabel.trim() || adding}
            >
              {adding ? <Loader2 className="size-3 animate-spin" /> : t('menuBuilder.add')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Variants Panel (auto-saves) ──────────────────────────────────────────────

function VariantsPanel({ itemId }: { itemId: string }) {
  const { t } = useTranslation()
  const [groups, setGroups] = useState<VariantGroup[]>([])
  const [options, setOptions] = useState<VariantOption[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupRequired, setNewGroupRequired] = useState(true)
  const [newGroupAllowMultiple, setNewGroupAllowMultiple] = useState(false)
  const [addingGroup, setAddingGroup] = useState(false)

  useEffect(() => {
    if (!loaded) {
      getItemVariantsAction(itemId).then(result => {
        setGroups(result.groups)
        setOptions(result.options)
        setLoading(false)
        setLoaded(true)
      })
    }
  }, [itemId, loaded])

  async function handleAddGroup() {
    if (!newGroupName.trim()) return
    setAddingGroup(true)
    const result = await addVariantGroupAction(itemId, newGroupName, newGroupRequired, newGroupAllowMultiple)
    if (result.success) {
      setGroups(prev => [...prev, result.data])
      setNewGroupName('')
    } else {
      toast.error(result.error)
    }
    setAddingGroup(false)
  }

  async function handleDeleteGroup(id: string) {
    const result = await deleteVariantGroupAction(id)
    if (result.success) {
      setGroups(prev => prev.filter(g => g.id !== id))
      setOptions(prev => prev.filter(o => o.group_id !== id))
    } else toast.error(result.error)
  }

  async function handleToggleRequired(group: VariantGroup) {
    const result = await updateVariantGroupAction(group.id, { required: !group.required })
    if (result.success) {
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, required: !g.required } : g))
    }
  }

  async function handleToggleAllowMultiple(group: VariantGroup) {
    const result = await updateVariantGroupAction(group.id, { allow_multiple: !group.allow_multiple })
    if (result.success) {
      setGroups(prev => prev.map(g => g.id === group.id ? { ...g, allow_multiple: !g.allow_multiple } : g))
    }
  }

  async function handleAddOption(groupId: string, label: string, priceDelta: number) {
    const result = await addVariantOptionAction(groupId, label, priceDelta)
    if (result.success) setOptions(prev => [...prev, result.data])
    else toast.error(result.error)
  }

  function handleDeleteOption(id: string) {
    deleteVariantOptionAction(id).then(result => {
      if (result.success) setOptions(prev => prev.filter(o => o.id !== id))
      else toast.error(result.error)
    })
  }

  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="size-4 animate-spin" /> {t('menuBuilder.loading')}
      </div>
    )
  }

  return (
    <div className="space-y-3 pt-1">
      {groups.map(group => (
        <VariantGroupCard
          key={group.id}
          group={group}
          options={options.filter(o => o.group_id === group.id).sort((a, b) => a.sort_order - b.sort_order)}
          onDelete={() => handleDeleteGroup(group.id)}
          onToggleRequired={() => handleToggleRequired(group)}
          onToggleAllowMultiple={() => handleToggleAllowMultiple(group)}
          onAddOption={(label, price) => handleAddOption(group.id, label, price)}
          onDeleteOption={handleDeleteOption}
        />
      ))}

      <div className="border border-dashed border-border rounded-lg p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('menuBuilder.newOptionGroup')}</p>
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-2 items-center">
            <Input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddGroup() } }}
              placeholder={t('menuBuilder.optionNamePlaceholder')}
              className="h-8 text-sm flex-1"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 shrink-0"
              onClick={handleAddGroup}
              disabled={!newGroupName.trim() || addingGroup}
            >
              {addingGroup ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3.5" />}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 shrink-0">
              <Switch id="grp-required" checked={newGroupRequired} onCheckedChange={setNewGroupRequired} />
              <Label htmlFor="grp-required" className="text-xs whitespace-nowrap cursor-pointer">
                {newGroupRequired ? t('menuBuilder.required') : t('menuBuilder.optional')}
              </Label>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 border-l pl-3 border-border/50">
              <Switch id="grp-multiple" checked={newGroupAllowMultiple} onCheckedChange={setNewGroupAllowMultiple} />
              <Label htmlFor="grp-multiple" className="text-xs whitespace-nowrap cursor-pointer">
                {newGroupAllowMultiple ? (t('menuBuilder.multipleChoice') || 'Nhiều lựa chọn') : (t('menuBuilder.singleChoice') || 'Một lựa chọn')}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Category Dialog ──────────────────────────────────────────────────────────

function CategoryDialog({
  open, onClose, onSave, initial,
}: {
  open: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  initial?: MenuCategory
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await onSave(name)
    setLoading(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-sm w-[95vw] rounded-xl sm:w-full">
        <DialogHeader>
          <DialogTitle>{initial ? t('menuBuilder.renameCategory') : t('menuBuilder.addCategory')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">{t('menuBuilder.categoryName')}</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('menuBuilder.categoryPlaceholder')}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>{t('menuBuilder.cancel')}</Button>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : initial ? t('menuBuilder.save') : t('menuBuilder.add')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Item Dialog ──────────────────────────────────────────────────────────────

function ItemDialog({
  open, onClose, onSave, categoryId, businessId, initial,
}: {
  open: boolean
  onClose: () => void
  /** Called when the user explicitly clicks "Save changes" */
  onSave: (item: {
    name: string; description: string; price: number; image_url?: string; tags: string[]
  }) => Promise<void>
  categoryId: string
  businessId: string
  initial?: MenuItem
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [tags, setTags] = useState<string[]>(initial?.tags ?? [])
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [imageLoading, setImageLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'details' | 'variants'>('details')
  const fileRef = useRef<HTMLInputElement>(null)

  const isEditing = !!initial

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageLoading(true)
    try {
      const itemId = initial?.id ?? crypto.randomUUID()
      const url = await uploadImageToStorage(
        'menu-images',
        `${businessId}/${itemId}.jpg`,
        file,
        // Start at 0.85 quality, step down automatically until ≤300 KB
        { maxWidth: 900, maxHeight: 900, quality: 0.85, targetSizeKB: 300 },
        ({ originalKB, compressedKB }) => {
          if (originalKB > compressedKB + 30)
            toast.info(`Photo compressed: ${originalKB} KB → ${compressedKB} KB`)
        }
      )
      setImageUrl(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setImageLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) { toast.error('Enter a valid price'); return }
    setSaving(true)
    await onSave({ name, description, price: parsedPrice, image_url: imageUrl || undefined, tags })
    setSaving(false)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      {/* p-0 so we can control padding per zone and pin the footer */}
      <DialogContent className="sm:max-w-lg p-0 flex flex-col w-[95vw] md:w-full" style={{ maxHeight: 'min(90vh, 700px)' }}>
        <DialogHeader className="px-4 md:px-6 pt-6 pb-3 shrink-0">
          <DialogTitle>{isEditing ? t('menuBuilder.editItem') : t('menuBuilder.addItem')}</DialogTitle>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 md:px-6">
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'details' | 'variants')}
          className="pb-2"
        >
          <TabsList className="w-full justify-start overflow-x-auto no-scrollbar">
            <TabsTrigger value="details" className="shrink-0">{t('menuBuilder.details')}</TabsTrigger>
            <TabsTrigger value="variants" className="shrink-0" disabled={!isEditing}>
              {t('menuBuilder.optionsVariants')}
              {!isEditing && <span className="ml-1.5 text-[10px] opacity-60 font-normal">({t('menuBuilder.saveItemFirst')})</span>}
            </TabsTrigger>
          </TabsList>

          {/* ── Details tab ── */}
          <TabsContent value="details" className="mt-4">
            <form id="item-detail-form" onSubmit={handleSubmit} className="space-y-4">
              {/* Image */}
              <div className="flex gap-4 items-start">
                <ImageUploader businessId={businessId} onImageSelect={setImageUrl}>
                  {(openGallery) => (
                    <div className="flex flex-col gap-2 shrink-0">
                      <div
                        className="size-20 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden cursor-pointer hover:border-foreground/40 transition-colors"
                        onClick={() => fileRef.current?.click()}
                        title="Click to upload"
                      >
                        {imageLoading
                          ? <Loader2 className="size-5 animate-spin text-muted-foreground" />
                          : imageUrl
                            ? <img src={imageUrl} alt="" className="size-full object-cover" />
                            : <ImageIcon className="size-6 text-muted-foreground" />}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={openGallery} className="h-7 text-[10px] uppercase font-bold tracking-wider">
                        Gallery
                      </Button>
                    </div>
                  )}
                </ImageUploader>
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleImageChange} />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium">{t('menuBuilder.photo')}</p>
                  <p className="text-xs text-muted-foreground">{t('menuBuilder.photoHint')}</p>
                  {imageUrl && (
                    <Button type="button" variant="secondary" size="sm" onClick={() => setImageUrl('')}>
                      <X className="size-3 mr-1" /> {t('menuBuilder.remove')}
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-name">{t('menuBuilder.itemName')}</Label>
                <Input id="item-name" value={name} onChange={e => setName(e.target.value)} placeholder={t('menuBuilder.itemNamePlaceholder')} required autoFocus />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-desc">{t('menuBuilder.description')}</Label>
                <Textarea id="item-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder={t('menuBuilder.descriptionPlaceholder')} rows={2} className="resize-none" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-price">{t('menuBuilder.price')}</Label>
                <Input id="item-price" type="number" min={0} step={1000} value={price} onChange={e => setPrice(e.target.value)} placeholder={t('menuBuilder.pricePlaceholder')} required />
              </div>

              <div className="space-y-1.5">
                <Label>{t('menuBuilder.tags')}</Label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  suggestions={ITEM_TAG_SUGGESTIONS}
                  formatTag={(tag) => ITEM_TAG_SUGGESTIONS.includes(tag) ? t(`menuBuilder.tagsList.${tag}`) : tag}
                  placeholder={t('menuBuilder.addCustomTag')}
                  helpText={t('menuBuilder.tagHelp') || 'Press Enter or , to add a custom tag'}
                />
              </div>
            </form>
          </TabsContent>

          {/* ── Options & Variants tab ── */}
          <TabsContent value="variants" className="mt-4">
            {isEditing
              ? <VariantsPanel itemId={initial.id} />
              : <p className="text-sm text-muted-foreground py-8 text-center">{t('menuBuilder.saveItemFirst')}</p>
            }
          </TabsContent>
        </Tabs>
        </div>{/* end scrollable body */}

        {/* ── Pinned footer ── */}
        <div className="shrink-0 border-t border-border/60 px-6 py-4 bg-background rounded-b-xl sm:rounded-b-2xl">
          {activeTab === 'details' ? (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>{t('menuBuilder.cancel')}</Button>
              <Button
                type="submit"
                form="item-detail-form"
                disabled={!name.trim() || !price || saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : isEditing ? t('menuBuilder.saveChanges') : t('menuBuilder.addItem')}
              </Button>
            </DialogFooter>
          ) : (
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{t('menuBuilder.changesSaveAuto')}</span>
              <Button type="button" variant="secondary" onClick={onClose}>{t('menuBuilder.close')}</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main MenuBuilder ─────────────────────────────────────────────────────────

interface MenuBuilderProps {
  businessId: string
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
}

export function MenuBuilder({ businessId, initialCategories, initialItems }: MenuBuilderProps) {
  const { currentBusiness } = useBusiness()
  const isStaff = currentBusiness?.role === 'staff'
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const initialData = useMemo(() => ({ categories: initialCategories, items: initialItems }), [initialCategories, initialItems])
  const { data } = useMenu(businessId, initialData)
  
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories)
  const [items, setItems] = useState<MenuItem[]>(initialItems)
  const [selectedCatId, setSelectedCatId] = useState<string | null>(initialCategories[0]?.id ?? null)
  
  const [isLoading, setIsLoading] = useState(false)
  const loadingTimer = useRef<NodeJS.Timeout | null>(null)
  const renderTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (loadingTimer.current) clearTimeout(loadingTimer.current)
      if (renderTimer.current) clearTimeout(renderTimer.current)
    }
  }, [])

  useEffect(() => {
    if (data) {
      setCategories(data.categories)
      setItems(data.items)
      if (!selectedCatId && data.categories.length > 0) {
        setSelectedCatId(data.categories[0].id)
      }
    }
  }, [data]) // Sync with global cache

  // Re-fetch from DB after CSV import
  async function handleCsvRefresh() {
    await queryClient.invalidateQueries({ queryKey: ['menu', businessId] })
  }
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

  const [catDialog, setCatDialog] = useState<{ open: boolean; editing?: MenuCategory }>({ open: false })
  const [itemDialog, setItemDialog] = useState<{ open: boolean; editing?: MenuItem; catId?: string }>({ open: false })
  const [drawerOpen, setDrawerOpen] = useState(false)

  const selectedCat = categories.find(c => c.id === selectedCatId)
  const visibleItems = items
    .filter(i => i.category_id === selectedCatId)
    .sort((a, b) => a.sort_order - b.sort_order)

  // ── Selection helpers ──
  function toggleItemSelection(id: string) {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedItems(new Set())
  }

  // ── Category handlers ──
  async function handleSaveCategory(name: string) {
    if (catDialog.editing) {
      const result = await updateCategoryAction(catDialog.editing.id, { name })
      if (!result.success) { toast.error(result.error); return }
      setCategories(prev => prev.map(c => c.id === catDialog.editing!.id ? { ...c, name } : c))
      toast.success(t('menuBuilder.categoryUpdated'))
    } else {
      const result = await addCategoryAction(businessId, name)
      if (!result.success) { toast.error(result.error); return }
      setCategories(prev => [...prev, result.data])
      setSelectedCatId(result.data.id)
      toast.success(t('menuBuilder.categoryAdded'))
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm(t('menuBuilder.deleteCategoryConfirm'))) return
    const result = await deleteCategoryAction(id)
    if (!result.success) { toast.error(result.error); return }
    setCategories(prev => prev.filter(c => c.id !== id))
    setItems(prev => prev.filter(i => i.category_id !== id))
    if (selectedCatId === id) setSelectedCatId(categories.find(c => c.id !== id)?.id ?? null)
    clearSelection()
    toast.success(t('menuBuilder.categoryDeleted'))
  }

  async function handleToggleCategoryVisible(cat: MenuCategory) {
    const result = await updateCategoryAction(cat.id, { visible: !cat.visible })
    if (!result.success) { toast.error(result.error); return }
    setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, visible: !c.visible } : c))
  }

  // ── Item handlers ──
  async function handleSaveItem(itemData: {
    name: string; description: string; price: number; image_url?: string; tags: string[]
  }) {
    if (itemDialog.editing) {
      const result = await updateItemAction(itemDialog.editing.id, {
        name: itemData.name,
        description: itemData.description || null,
        price: itemData.price,
        image_url: itemData.image_url || null,
        tags: itemData.tags,
      })
      if (!result.success) { toast.error(result.error); return }
      setItems(prev => prev.map(i =>
        i.id === itemDialog.editing!.id
          ? { ...i, name: itemData.name, description: itemData.description || null, price: itemData.price, image_url: itemData.image_url || null, tags: itemData.tags }
          : i
      ))
      toast.success(t('menuBuilder.itemSaved'))
    } else {
      const catId = itemDialog.catId ?? selectedCatId!
      const result = await addItemAction(businessId, catId, itemData)
      if (!result.success) { toast.error(result.error); return }
      setItems(prev => [...prev, result.data])
      toast.success(t('menuBuilder.itemAdded'))
    }
  }

  async function handleDeleteItem(id: string) {
    if (!confirm(t('menuBuilder.deleteItemConfirm'))) return
    const result = await deleteItemAction(id)
    if (!result.success) { toast.error(result.error); return }
    setItems(prev => prev.filter(i => i.id !== id))
    setSelectedItems(prev => { const s = new Set(prev); s.delete(id); return s })
    toast.success(t('menuBuilder.itemDeleted'))
  }

  async function handleDuplicateItem(item: MenuItem) {
    const result = await addItemAction(businessId, item.category_id, {
      name: `${item.name} (copy)`,
      description: item.description ?? undefined,
      price: item.price,
      image_url: item.image_url ?? undefined,
      tags: item.tags || [],
    })
    if (!result.success) { toast.error(result.error); return }
    setItems(prev => [...prev, result.data])
    toast.success(t('menuBuilder.itemDuplicated'))
  }

  async function handleToggleAvailable(item: MenuItem) {
    const result = await updateItemAction(item.id, { available: !item.available })
    if (!result.success) { toast.error(result.error); return }
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, available: !i.available } : i))
  }

  // ── Bulk handlers ──
  async function handleBulkDelete() {
    const ids = Array.from(selectedItems)
    if (!confirm(t('menuBuilder.bulkDeleteConfirm'))) return
    const result = await bulkDeleteItemsAction(ids)
    if (!result.success) { toast.error(result.error); return }
    setItems(prev => prev.filter(i => !selectedItems.has(i.id)))
    clearSelection()
    toast.success(`${ids.length} ${t('menuBuilder.itemsDeleted')}`)
  }

  async function handleBulkSetAvailable(available: boolean) {
    const ids = Array.from(selectedItems)
    const result = await bulkUpdateAvailabilityAction(ids, available)
    if (!result.success) { toast.error(result.error); return }
    setItems(prev => prev.map(i => selectedItems.has(i.id) ? { ...i, available } : i))
    clearSelection()
    toast.success(`${ids.length} ${available ? t('menuBuilder.markedAvailable') : t('menuBuilder.markedUnavailable')}`)
  }

  const anySelected = selectedItems.size > 0

  const renderCategoryItem = (cat: MenuCategory) => {
    const count = items.filter(i => i.category_id === cat.id).length
    const isSelected = cat.id === selectedCatId
    return (
      <div
        key={cat.id}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-colors shrink-0',
          isSelected ? 'bg-primary text-primary-foreground' : 'bg-background md:bg-transparent hover:bg-accent'
        )}
        onClick={() => { 
          if (selectedCatId === cat.id) return
          setIsLoading(true)
          
          if (renderTimer.current) clearTimeout(renderTimer.current)
          renderTimer.current = setTimeout(() => {
            setSelectedCatId(cat.id)
            clearSelection()
            setDrawerOpen(false)
            
            if (loadingTimer.current) clearTimeout(loadingTimer.current)
            loadingTimer.current = setTimeout(() => {
              setIsLoading(false)
            }, 400)
          }, 10)
        }}
      >
        <span className={cn('flex-1 text-sm font-medium truncate', !cat.visible && !isSelected && 'opacity-40')}>
          {cat.name}
        </span>
        {!cat.visible && (
          <EyeOff className={cn('size-3 shrink-0 mr-0.5', isSelected ? 'text-primary-foreground/50' : 'text-muted-foreground/50')} />
        )}
        <span className={cn('text-xs shrink-0', isSelected ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
          {count}
        </span>
        {!isStaff && (<DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn('size-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity', isSelected ? 'hover:bg-white/20' : 'hover:bg-accent-foreground/10')}
              onClick={e => e.stopPropagation()}
            >
              <MoreHorizontal className="size-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => setCatDialog({ open: true, editing: cat })}>
              <Pencil className="size-3.5 mr-2" /> {t('menuBuilder.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleCategoryVisible(cat)}>
              {cat.visible ? <><EyeOff className="size-3.5 mr-2" /> {t('menuBuilder.hide')}</> : <><Eye className="size-3.5 mr-2" /> {t('menuBuilder.show')}</>}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
              <Trash2 className="size-3.5 mr-2" /> {t('menuBuilder.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>)}
      </div>
    )
  }

  // ── Render ──
  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-[3.5rem])] md:h-[calc(100vh-4rem)] overflow-hidden">

      {/* ── Category Drawer (Mobile) ── */}
      <div className="md:hidden border-b border-border bg-muted/30 p-3 flex gap-2 shrink-0">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" className="flex-1 justify-between font-normal bg-background">
              <span className="truncate">{selectedCat ? selectedCat.name : t('menuBuilder.categories')}</span>
              <ChevronDown className="size-4 opacity-50 shrink-0" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader className="text-left pb-2">
              <DrawerTitle>{t('menuBuilder.categories')}</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pt-0 max-h-[60vh] overflow-y-auto flex flex-col gap-1">
              {categories.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-2">{t('menuBuilder.noCategoriesYet')}</p>
              )}
              {[...categories].sort((a, b) => a.sort_order - b.sort_order).map(renderCategoryItem)}
              {!isStaff && (<Button variant="ghost" className="w-full justify-start mt-2 border border-dashed" onClick={() => setCatDialog({ open: true })}>
                <Plus className="size-4 mr-2" /> {t('menuBuilder.addCategory')}
              </Button>)}
            </div>
          </DrawerContent>
        </Drawer>
        {!isStaff && (<Button size="icon" variant="outline" className="shrink-0 bg-background" onClick={() => setCatDialog({ open: true })} title={t('menuBuilder.addCategory')}>
          <Plus className="size-4" />
        </Button>)}
      </div>

      {/* ── Category Sidebar (Desktop) ── */}
      <aside className="hidden md:flex w-56 shrink-0 border-r border-border flex-col bg-muted/30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('menuBuilder.categories')}</span>
          {!isStaff && (<Button id="add-category-btn" size="icon" variant="ghost" className="size-6" onClick={() => setCatDialog({ open: true })} title={t('menuBuilder.addCategory')}>
            <Plus className="size-4" />
          </Button>)}
        </div>

        <nav className="flex-1 overflow-y-auto p-2 flex flex-col gap-0.5 space-y-0">
          {categories.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8 px-2">{t('menuBuilder.noCategoriesYet')}</p>
          )}
          {[...categories].sort((a, b) => a.sort_order - b.sort_order).map(renderCategoryItem)}
        </nav>
      </aside>

      {/* ── Items Area ── */}
      <main className="flex-1 overflow-y-auto relative flex flex-col">
        {/* Sticky Headers Wrapper */}
        <div className="sticky top-0 z-20 flex flex-col bg-background/95 backdrop-blur shadow-sm">
          {/* CSV import/export bar */}
          <div className="px-6 py-3 border-b border-border bg-muted/20">
            {!isStaff && (<MenuCsvActions businessId={businessId} categories={categories} items={items} onRefresh={handleCsvRefresh} />)}
          </div>

          {selectedCat && (
            <div className="border-b border-border px-6 py-4 flex items-center justify-between gap-3 bg-background">
              <div className="min-w-0 shrink">
                <h2 className="font-semibold text-base truncate">{selectedCat.name}</h2>
                <p className="text-xs text-muted-foreground">
                  {visibleItems.length} {t('menuBuilder.items')}
                  {anySelected && <span className="text-primary font-medium"> · {selectedItems.size} {t('menuBuilder.selected')}</span>}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {anySelected && (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => handleBulkSetAvailable(false)}>
                      <EyeOff className="size-3.5 mr-1.5" /> Unavailable
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => handleBulkSetAvailable(true)}>
                      <Eye className="size-3.5 mr-1.5" /> Available
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={handleBulkDelete}
                    >
                      <Trash2 className="size-3.5 mr-1.5" /> {t('menuBuilder.delete')}
                    </Button>
                    <button
                      onClick={clearSelection}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1"
                    >
                      Clear
                    </button>
                    <div className="hidden md:block h-4 w-px bg-border" />
                  </>
                )}
                {!isStaff && (<Button id="add-item-btn" size="sm" onClick={() => setItemDialog({ open: true, catId: selectedCatId! })}>
                  <Plus className="size-4 mr-2" /> {t('menuBuilder.addItem')}
                </Button>)}
              </div>
            </div>
          )}
        </div>

        {!selectedCat ? (
          <div className="flex items-center justify-center flex-1 text-muted-foreground">
            <div className="text-center">
              <p className="text-base font-medium mb-1">{t('menuBuilder.noCategorySelected')}</p>
              <p className="text-sm mb-4">{t('menuBuilder.addCategoryToStart')}</p>
              {!isStaff && (<Button onClick={() => setCatDialog({ open: true })}>
                <Plus className="size-4 mr-2" /> {t('menuBuilder.addCategory')}
              </Button>)}
            </div>
          </div>
        ) : (
            <div className="p-6">
              {visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <p className="text-base font-medium mb-1">{t('menuBuilder.noItemsYet') || 'No items yet'}</p>
                  <p className="text-sm mb-4">{t('menuBuilder.addFirstItem') || 'Add your first item to this category.'}</p>
                  {!isStaff && (<Button variant="secondary" onClick={() => setItemDialog({ open: true, catId: selectedCatId! })}>
                    <Plus className="size-4 mr-2" /> {t('menuBuilder.addItem')}
                  </Button>)}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleItems.map(item => {
                    const isItemSelected = selectedItems.has(item.id)
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'group/card relative rounded-xl border bg-card hover:shadow-sm transition-all overflow-hidden',
                          isItemSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                        )}
                      >
                        {/* Checkbox overlay — shows on hover, or always when any item is selected */}
                        <div
                          className={cn(
                            'absolute top-2 left-2 z-20 transition-opacity',
                            anySelected || isItemSelected
                              ? 'opacity-100'
                              : 'opacity-0 group-hover/card:opacity-100'
                          )}
                        >
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); toggleItemSelection(item.id) }}
                            className={cn(
                              'size-5 rounded border-2 flex items-center justify-center shadow-sm transition-all',
                              isItemSelected
                                ? 'bg-primary border-primary'
                                : 'bg-white border-white/80 hover:border-primary/60'
                            )}
                            aria-label={isItemSelected ? 'Deselect item' : 'Select item'}
                          >
                            {isItemSelected && <Check className="size-3 text-white" strokeWidth={3} />}
                          </button>
                        </div>

                        {/* Thumbnail with "Unavailable" overlay */}
                        <div className="relative h-36">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover bg-muted" />
                          ) : (
                            <div className="w-full h-full bg-muted/60 flex items-center justify-center">
                              <ImageIcon className="size-8 text-muted-foreground/30" />
                            </div>
                          )}
                          {!item.available && (
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                              Unavailable
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
                            {!isStaff && (<DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="size-6 rounded flex items-center justify-center text-muted-foreground hover:bg-accent opacity-0 group-hover/card:opacity-100 transition-opacity shrink-0">
                                  <MoreHorizontal className="size-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setItemDialog({ open: true, editing: item })}>
                                  <Pencil className="size-3.5 mr-2" /> {t('menuBuilder.edit')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicateItem(item)}>
                                  <Copy className="size-3.5 mr-2" /> {t('menuBuilder.duplicate')}
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleToggleAvailable(item)}>
                                  {item.available
                                    ? <><EyeOff className="size-3.5 mr-2" /> {t('menuBuilder.markUnavailable')}</>
                                    : <><Eye className="size-3.5 mr-2" /> {t('menuBuilder.markAvailable')}</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => downloadItemQR(item, '').catch(() => {})}>
                                  <QrCode className="size-3.5 mr-2" /> {t('menuBuilder.downloadQR')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteItem(item.id)}>
                                  <Trash2 className="size-3.5 mr-2" /> {t('menuBuilder.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>)}
                          </div>

                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.description}</p>
                          )}

                          <div className="flex items-center justify-between mt-2 gap-2">
                            <span className="text-sm font-bold">{formatCurrency(item.price)}</span>
                            {(item.tags || []).length > 0 && (
                              <div className="flex flex-wrap gap-1 justify-end">
                                {(item.tags || []).slice(0, 2).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                                ))}
                                {(item.tags || []).length > 2 && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">+{(item.tags || []).length - 2}</Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
        )}
      </main>

      {/* ── Dialogs ── */}
      {/* key forces a fresh mount each time so useState re-initializes from props */}
      {catDialog.open && (
        <CategoryDialog
          key={catDialog.editing?.id ?? 'new-cat'}
          open={catDialog.open}
          initial={catDialog.editing}
          onClose={() => setCatDialog({ open: false })}
          onSave={handleSaveCategory}
        />
      )}
      {itemDialog.open && (
        <ItemDialog
          key={itemDialog.editing?.id ?? 'new-item'}
          open={itemDialog.open}
          initial={itemDialog.editing}
          businessId={businessId}
          categoryId={itemDialog.catId ?? selectedCatId ?? ''}
          onClose={() => setItemDialog({ open: false })}
          onSave={handleSaveItem}
        />
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="bg-black/90 text-white text-[13px] font-medium px-4 py-2 rounded-full shadow-lg flex items-center gap-2 backdrop-blur-sm">
            <svg className="animate-spin size-3.5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('menuBuilder.loading')}
          </div>
        </div>
      )}
    </div>
  )
}
