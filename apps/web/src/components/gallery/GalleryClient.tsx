'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  Image as ImageIcon,
  Trash2,
  Loader2,
  HardDrive,
  Coins,
  Upload,
  Download,
  Archive,
  MoreVertical,
  Minimize2,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'
import {
  getGalleryImagesAction,
  deleteGalleryImageAction,
  type GalleryImage,
  type StorageSubscription,
} from '@/app/actions/gallery'
import { compressImageToBlob, uploadImageToStorage } from '@/lib/image-utils'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

const MEDIA_BUCKET = 'page-images'
const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

function imageKey(img: GalleryImage): string {
  return `${img.bucket}/${img.path}`
}

function fileExt(name: string): string {
  const m = name.toLowerCase().match(/\.([a-z0-9]+)(?:\?|$)/)
  return m?.[1] ?? ''
}

/** GIF (animation) and already-WebP: hide compress. */
function canCompressToWebp(img: GalleryImage): boolean {
  const ext = fileExt(img.name) || fileExt(img.path)
  return ext !== 'gif' && ext !== 'webp'
}

function safeFileBase(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'image'
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { mode: 'cors', credentials: 'omit' })
  if (!res.ok) throw new Error(`Failed to fetch image (${res.status})`)
  return res.blob()
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}

async function compressGalleryImageToWebp(img: GalleryImage): Promise<void> {
  const source = await fetchImageBlob(img.url)
  const file = new File([source], img.name || 'image.jpg', {
    type: source.type || 'image/jpeg',
  })
  const webpBlob = await compressImageToBlob(file, {
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    targetSizeKB: 350,
    format: 'image/webp',
  })

  const supabase = createClient()

  // Keep the same storage path when in use so live URLs still resolve.
  // Otherwise rewrite extension to .webp and remove the old object.
  if (img.inUse) {
    const { error } = await supabase.storage
      .from(img.bucket)
      .upload(img.path, webpBlob, { contentType: 'image/webp', upsert: true })
    if (error) throw new Error(error.message)
    return
  }

  const newPath = img.path.replace(/\.[^./]+$/, '') + '.webp'
  const { error } = await supabase.storage
    .from(img.bucket)
    .upload(newPath, webpBlob, { contentType: 'image/webp', upsert: true })
  if (error) throw new Error(error.message)

  if (newPath !== img.path) {
    await supabase.storage.from(img.bucket).remove([img.path])
  }
}

export function GalleryClient({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [subscription, setSubscription] = useState<StorageSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [zipping, setZipping] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState<'download' | 'delete' | 'compress' | null>(null)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [pendingDeletes, setPendingDeletes] = useState<GalleryImage[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImages = useCallback(async () => {
    setLoading(true)
    const res = await getGalleryImagesAction(businessId)
    if (res.success && res.data) {
      setImages(res.data)
      if (res.subscription) setSubscription(res.subscription)
      setSelected(prev => {
        const next = new Set<string>()
        const keys = new Set(res.data!.map(imageKey))
        for (const k of prev) if (keys.has(k)) next.add(k)
        return next
      })
    } else {
      toast.error(res.error || 'Failed to load gallery')
    }
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    void loadImages()
  }, [loadImages])

  const selectedImages = useMemo(
    () => images.filter(img => selected.has(imageKey(img))),
    [images, selected],
  )

  const allSelected = images.length > 0 && selected.size === images.length

  function toggleSelect(key: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
      return
    }
    setSelected(new Set(images.map(imageKey)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function openDeleteConfirm(targets: GalleryImage[]) {
    const deletable = targets.filter(img => !img.inUse)
    if (deletable.length === 0) {
      toast.error(t('gallery.cannotDeleteInUse'))
      return
    }
    if (deletable.length < targets.length) {
      toast.message(t('gallery.skipInUseDelete').replace('{{count}}', String(targets.length - deletable.length)))
    }
    setPendingDeletes(deletable)
    setDeleteConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    const targets = pendingDeletes
    setDeleteConfirmOpen(false)
    setPendingDeletes([])
    setBulkBusy('delete')
    let ok = 0
    for (const img of targets) {
      const res = await deleteGalleryImageAction(businessId, img.bucket, img.path)
      if (res.success) {
        ok += 1
        setSelected(prev => {
          const next = new Set(prev)
          next.delete(imageKey(img))
          return next
        })
      }
    }
    setBulkBusy(null)
    if (ok > 0) {
      toast.success(t('gallery.deleteSuccess').replace('{{count}}', String(ok)))
      await loadImages()
    } else {
      toast.error(t('gallery.deleteFailed'))
    }
  }

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (list.length === 0) {
      toast.error(t('gallery.uploadInvalidType'))
      return
    }

    setUploading(true)
    setUploadProgress({ done: 0, total: list.length })
    let ok = 0
    let failed = 0

    for (let i = 0; i < list.length; i++) {
      const file = list[i]
      // Preserve GIFs as-is path/ext; everything else stores as WebP.
      const isGif = file.type === 'image/gif' || fileExt(file.name) === 'gif'
      const path = isGif
        ? `${businessId}/${Date.now()}-${safeFileBase(file.name)}.gif`
        : `${businessId}/${Date.now()}-${safeFileBase(file.name)}.webp`
      try {
        if (isGif) {
          const supabase = createClient()
          const { error } = await supabase.storage
            .from(MEDIA_BUCKET)
            .upload(path, file, { contentType: 'image/gif', upsert: true })
          if (error) throw new Error(error.message)
        } else {
          await uploadImageToStorage(MEDIA_BUCKET, path, file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.82,
            targetSizeKB: 400,
            format: 'image/webp',
          })
        }
        ok += 1
      } catch (err) {
        failed += 1
        console.error('gallery upload failed', err)
      }
      setUploadProgress({ done: i + 1, total: list.length })
    }

    setUploading(false)
    setUploadProgress(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (ok > 0) {
      toast.success(t('gallery.uploadSuccess').replace('{{count}}', String(ok)))
      await loadImages()
    }
    if (failed > 0) {
      toast.error(t('gallery.uploadPartialFail').replace('{{count}}', String(failed)))
    }
  }

  async function handleDownloadOne(img: GalleryImage) {
    const key = imageKey(img)
    setBusyKey(key)
    try {
      const blob = await fetchImageBlob(img.url)
      const filename = img.name.includes('.') ? img.name : `${img.name}.jpg`
      triggerBlobDownload(blob, filename)
    } catch (err) {
      console.error(err)
      window.open(img.url, '_blank', 'noopener,noreferrer')
      toast.error(t('gallery.downloadFallback'))
    } finally {
      setBusyKey(null)
    }
  }

  async function handleDownloadMany(targets: GalleryImage[]) {
    if (targets.length === 0) return
    if (targets.length === 1) {
      await handleDownloadOne(targets[0])
      return
    }
    setBulkBusy('download')
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const usedNames = new Set<string>()

      for (const img of targets) {
        try {
          const blob = await fetchImageBlob(img.url)
          let name = img.name || `image-${usedNames.size + 1}.jpg`
          if (usedNames.has(name)) {
            const base = name.replace(/(\.[^.]+)?$/, '')
            const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')) : '.jpg'
            let n = 2
            while (usedNames.has(`${base}-${n}${ext}`)) n += 1
            name = `${base}-${n}${ext}`
          }
          usedNames.add(name)
          zip.file(name, blob)
        } catch (err) {
          console.error('zip skip', img.path, err)
        }
      }

      if (usedNames.size === 0) {
        toast.error(t('gallery.downloadAllFailed'))
        return
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const stamp = new Date().toISOString().slice(0, 10)
      triggerBlobDownload(zipBlob, `eatery-media-${stamp}.zip`)
      toast.success(t('gallery.downloadAllSuccess').replace('{{count}}', String(usedNames.size)))
    } catch (err) {
      console.error(err)
      toast.error(t('gallery.downloadAllFailed'))
    } finally {
      setBulkBusy(null)
    }
  }

  async function handleCompressOne(img: GalleryImage) {
    if (!canCompressToWebp(img)) return
    const key = imageKey(img)
    setBusyKey(key)
    try {
      const before = img.size || 0
      await compressGalleryImageToWebp(img)
      toast.success(
        before > 0
          ? t('gallery.compressSuccessSize')
          : t('gallery.compressSuccess'),
      )
      await loadImages()
    } catch (err) {
      console.error(err)
      toast.error(t('gallery.compressFailed'))
    } finally {
      setBusyKey(null)
    }
  }

  async function handleCompressMany(targets: GalleryImage[]) {
    const compressible = targets.filter(canCompressToWebp)
    if (compressible.length === 0) {
      toast.error(t('gallery.compressNoneEligible'))
      return
    }
    if (compressible.length < targets.length) {
      toast.message(
        t('gallery.compressSkipped').replace(
          '{{count}}',
          String(targets.length - compressible.length),
        ),
      )
    }

    setBulkBusy('compress')
    let ok = 0
    for (const img of compressible) {
      try {
        await compressGalleryImageToWebp(img)
        ok += 1
      } catch (err) {
        console.error(err)
      }
    }
    setBulkBusy(null)
    if (ok > 0) {
      toast.success(t('gallery.compressBulkSuccess').replace('{{count}}', String(ok)))
      await loadImages()
    } else {
      toast.error(t('gallery.compressFailed'))
    }
  }

  const totalSizeBytes = images.reduce((sum, img) => sum + (img.size || 0), 0)
  const totalSizeMB = totalSizeBytes / (1024 * 1024)
  const currentQuota = subscription?.current_quota_mb || 20
  const usagePercentage = Math.min(100, (totalSizeMB / currentQuota) * 100)
  const projectedCharge = Math.ceil(totalSizeMB / 20) || 1
  const formattedCycleEnd = subscription?.next_billing_date
    ? new Date(subscription.next_billing_date).toLocaleDateString()
    : '---'

  const selectionCount = selectedImages.length
  const selectionHasCompressible = selectedImages.some(canCompressToWebp)
  const selectionHasDeletable = selectedImages.some(img => !img.inUse)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('gallery.title')}</h1>
          <p className="text-gray-500 mt-1">{t('gallery.description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => void handleDownloadMany(images)}
          disabled={Boolean(bulkBusy) || loading || images.length === 0}
          className="shrink-0"
        >
          {bulkBusy === 'download' && selectionCount === 0 ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Archive className="size-4 mr-2" />
          )}
          {t('gallery.downloadAllZip')}
        </Button>
      </div>

      <Card className="bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                <HardDrive className="size-5 text-indigo-500" />
                {t('gallery.quotaTitle')}
              </h2>
              <p className="text-sm text-gray-600 mt-1 max-w-2xl leading-relaxed">
                {t('gallery.quotaExplanation')}
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm px-4 py-3 rounded-lg border border-indigo-100 shadow-sm text-center shrink-0">
              <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">
                {t('gallery.billingCycleEnds')}
              </div>
              <div className="font-bold text-gray-900">{formattedCycleEnd}</div>
            </div>
          </div>
        </div>

        <CardContent className="pt-6">
          <div className="mb-2 flex justify-between items-end">
            <div>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('gallery.quotaUsage')}
              </span>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {totalSizeMB.toFixed(2)}{' '}
                <span className="text-lg text-gray-500 font-medium">/ {currentQuota} MB</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('gallery.projectedCharge')}
              </span>
              <div className="text-xl font-bold text-yellow-600 mt-1 flex items-center justify-end gap-1.5">
                <Coins className="size-5" /> {projectedCharge} {t('gallery.credits')}
              </div>
            </div>
          </div>

          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border">
            <div
              className={`h-full transition-all duration-500 ease-in-out ${
                usagePercentage > 90
                  ? 'bg-red-500'
                  : usagePercentage > 75
                    ? 'bg-yellow-400'
                    : 'bg-indigo-500'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload dropzone */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            fileInputRef.current?.click()
          }
        }}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragEnter={e => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(true)
        }}
        onDragOver={e => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(true)
        }}
        onDragLeave={e => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
        }}
        onDrop={e => {
          e.preventDefault()
          e.stopPropagation()
          setDragOver(false)
          if (uploading) return
          if (e.dataTransfer.files?.length) void uploadFiles(e.dataTransfer.files)
        }}
        className={cn(
          'rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors cursor-pointer',
          dragOver
            ? 'border-indigo-400 bg-indigo-50'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
          uploading && 'pointer-events-none opacity-70',
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT_TYPES}
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) void uploadFiles(e.target.files)
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium text-gray-800">{t('gallery.uploading')}</p>
            {uploadProgress && (
              <p className="text-xs text-muted-foreground">
                {uploadProgress.done} / {uploadProgress.total}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="size-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="size-5" />
            </div>
            <p className="text-sm font-semibold text-gray-900">{t('gallery.dropHint')}</p>
            <p className="text-xs text-muted-foreground max-w-md">{t('gallery.dropHintDetail')}</p>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={e => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              {t('gallery.uploadNew')}
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" /> {t('gallery.mediaHeading')}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {images.length} {t('gallery.imagesCount')}
            </span>
          </div>

          {!loading && images.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll}>
                {allSelected ? (
                  <CheckSquare className="size-3.5 mr-1.5" />
                ) : (
                  <Square className="size-3.5 mr-1.5" />
                )}
                {allSelected ? t('gallery.deselectAll') : t('gallery.selectAll')}
              </Button>

              {selectionCount > 0 && (
                <>
                  <span className="text-sm text-muted-foreground">
                    {t('gallery.selectedCount').replace('{{count}}', String(selectionCount))}
                  </span>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={Boolean(bulkBusy)}
                    onClick={() => void handleDownloadMany(selectedImages)}
                  >
                    {bulkBusy === 'download' ? (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5 mr-1.5" />
                    )}
                    {t('gallery.download')}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={Boolean(bulkBusy) || !selectionHasCompressible}
                    onClick={() => void handleCompressMany(selectedImages)}
                  >
                    {bulkBusy === 'compress' ? (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Minimize2 className="size-3.5 mr-1.5" />
                    )}
                    {t('gallery.compressWebp')}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={Boolean(bulkBusy) || !selectionHasDeletable}
                    onClick={() => openDeleteConfirm(selectedImages)}
                  >
                    {bulkBusy === 'delete' ? (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5 mr-1.5" />
                    )}
                    {t('gallery.deleteImage')}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                    {t('gallery.clearSelection')}
                  </Button>
                </>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
              <ImageIcon className="size-8 mx-auto mb-3 opacity-20" />
              <p>{t('gallery.noImages')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {images.map(img => {
                const key = imageKey(img)
                const isSelected = selected.has(key)
                const isBusy = busyKey === key
                const showCompress = canCompressToWebp(img)

                return (
                  <div
                    key={key}
                    className={cn(
                      'group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border',
                      isSelected && 'ring-2 ring-indigo-500 border-indigo-300',
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Select checkbox — top left */}
                    <button
                      type="button"
                      aria-label={t('gallery.selectImage')}
                      onClick={e => {
                        e.stopPropagation()
                        toggleSelect(key)
                      }}
                      className={cn(
                        'absolute top-2 left-2 z-10 size-7 rounded-md border shadow-sm flex items-center justify-center transition-opacity',
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white opacity-100'
                          : 'bg-white/90 border-gray-200 text-gray-700 opacity-0 group-hover:opacity-100',
                      )}
                    >
                      {isSelected ? (
                        <CheckSquare className="size-4" />
                      ) : (
                        <Square className="size-4" />
                      )}
                    </button>

                    {/* Status + more — top right */}
                    <div className="absolute top-2 right-2 z-10 flex items-start gap-1">
                      <span
                        className={cn(
                          'px-2 py-1 text-[10px] font-semibold rounded-full shadow-sm',
                          img.inUse
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600',
                          'opacity-100 group-hover:opacity-0 transition-opacity',
                        )}
                      >
                        {img.inUse ? t('gallery.inUse') : t('gallery.notInUse')}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            aria-label={t('gallery.moreActions')}
                            className="size-7 rounded-md bg-white/95 border border-gray-200 text-gray-700 shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                            onClick={e => e.stopPropagation()}
                          >
                            {isBusy ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <MoreVertical className="size-3.5" />
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            disabled={Boolean(busyKey || bulkBusy)}
                            onClick={() => void handleDownloadOne(img)}
                          >
                            <Download className="size-4" />
                            {t('gallery.download')}
                          </DropdownMenuItem>
                          {showCompress && (
                            <DropdownMenuItem
                              disabled={Boolean(busyKey || bulkBusy)}
                              onClick={() => void handleCompressOne(img)}
                            >
                              <Minimize2 className="size-4" />
                              {t('gallery.compressWebp')}
                            </DropdownMenuItem>
                          )}
                          {!img.inUse && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                disabled={Boolean(busyKey || bulkBusy)}
                                className="text-destructive focus:text-destructive"
                                onClick={() => openDeleteConfirm([img])}
                              >
                                <Trash2 className="size-4" />
                                {t('gallery.deleteImage')}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Bottom meta on hover */}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <p className="text-[11px] text-white truncate" title={img.name}>
                        {img.name}
                      </p>
                      <p className="text-[10px] text-white/70">
                        {img.size ? `${(img.size / 1024).toFixed(1)} KB` : ''}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('gallery.deleteImage')}</DialogTitle>
            <DialogDescription>
              {pendingDeletes.length > 1
                ? t('gallery.confirmDeleteMany').replace('{{count}}', String(pendingDeletes.length))
                : t('gallery.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t('gallery.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void handleConfirmDelete()}>
              <Trash2 className="size-4 mr-2" />
              {t('gallery.deleteImage')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
