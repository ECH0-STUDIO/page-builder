'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Image as ImageIcon,
  Trash2,
  Loader2,
  HardDrive,
  Coins,
  Upload,
  Download,
  Archive,
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
import { uploadImageToStorage } from '@/lib/image-utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

const MEDIA_BUCKET = 'page-images'
const ACCEPT_TYPES = 'image/jpeg,image/png,image/webp,image/gif'

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

export function GalleryClient({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [subscription, setSubscription] = useState<StorageSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null)
  const [zipping, setZipping] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{ bucket: string; path: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadImages = useCallback(async () => {
    setLoading(true)
    const res = await getGalleryImagesAction(businessId)
    if (res.success && res.data) {
      setImages(res.data)
      if (res.subscription) setSubscription(res.subscription)
    } else {
      toast.error(res.error || 'Failed to load gallery')
    }
    setLoading(false)
  }, [businessId])

  useEffect(() => {
    void loadImages()
  }, [loadImages])

  function confirmDelete(bucket: string, path: string) {
    setImageToDelete({ bucket, path })
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!imageToDelete) return
    setDeletingPath(imageToDelete.path)
    setDeleteConfirmOpen(false)

    const res = await deleteGalleryImageAction(businessId, imageToDelete.bucket, imageToDelete.path)
    if (res.success) {
      toast.success(t('gallery.deleteImage') + ' OK')
      setImages(prev => prev.filter(img => img.path !== imageToDelete.path))
    } else {
      toast.error(res.error)
    }
    setDeletingPath(null)
    setImageToDelete(null)
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
      const path = `${businessId}/${Date.now()}-${safeFileBase(file.name)}.jpg`
      try {
        await uploadImageToStorage(MEDIA_BUCKET, path, file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          targetSizeKB: 500,
          format: 'image/jpeg',
        })
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
      toast.success(
        t('gallery.uploadSuccess').replace('{{count}}', String(ok)),
      )
      await loadImages()
    }
    if (failed > 0) {
      toast.error(t('gallery.uploadPartialFail').replace('{{count}}', String(failed)))
    }
  }

  async function handleDownloadOne(img: GalleryImage) {
    setDownloadingPath(img.path)
    try {
      const blob = await fetchImageBlob(img.url)
      const ext = img.name.includes('.') ? img.name.split('.').pop() : 'jpg'
      const filename = img.name.includes('.') ? img.name : `${img.name}.${ext || 'jpg'}`
      triggerBlobDownload(blob, filename)
    } catch (err) {
      console.error(err)
      // Fallback: open in new tab if CORS blocks blob download
      window.open(img.url, '_blank', 'noopener,noreferrer')
      toast.error(t('gallery.downloadFallback'))
    } finally {
      setDownloadingPath(null)
    }
  }

  async function handleDownloadAllZip() {
    if (images.length === 0) return
    setZipping(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const usedNames = new Set<string>()

      for (const img of images) {
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
      toast.success(
        t('gallery.downloadAllSuccess').replace('{{count}}', String(usedNames.size)),
      )
    } catch (err) {
      console.error(err)
      toast.error(t('gallery.downloadAllFailed'))
    } finally {
      setZipping(false)
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('gallery.title')}</h1>
          <p className="text-gray-500 mt-1">{t('gallery.description')}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => void handleDownloadAllZip()}
          disabled={zipping || loading || images.length === 0}
          className="shrink-0"
        >
          {zipping ? (
            <Loader2 className="size-4 mr-2 animate-spin" />
          ) : (
            <Archive className="size-4 mr-2" />
          )}
          {zipping ? t('gallery.downloadingAll') : t('gallery.downloadAllZip')}
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
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" /> {t('gallery.mediaHeading')}
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {images.length} {t('gallery.imagesCount')}
            </span>
          </div>
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
              {images.map(img => (
                <div
                  key={`${img.bucket}/${img.path}`}
                  className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  <div className="absolute top-2 right-2">
                    {img.inUse ? (
                      <span className="px-2 py-1 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm">
                        {t('gallery.inUse')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full shadow-sm">
                        {t('gallery.notInUse')}
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-1.5">
                    <p className="text-xs text-white truncate w-full text-center" title={img.name}>
                      {img.name}
                    </p>
                    <p className="text-[10px] text-gray-300 mb-1">
                      {img.size ? (img.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                    <div className="flex flex-col gap-1.5 w-full max-w-[120px]">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-7 text-xs w-full"
                        onClick={() => void handleDownloadOne(img)}
                        disabled={downloadingPath === img.path}
                      >
                        {downloadingPath === img.path ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>
                            <Download className="size-3 mr-1" />
                            {t('gallery.download')}
                          </>
                        )}
                      </Button>
                      {!img.inUse && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 text-xs w-full"
                          onClick={() => confirmDelete(img.bucket, img.path)}
                          disabled={deletingPath === img.path}
                        >
                          {deletingPath === img.path ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="size-3 mr-1" />
                              {t('gallery.deleteImage')}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('gallery.deleteImage')}</DialogTitle>
            <DialogDescription>{t('gallery.confirmDelete')}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              {t('gallery.cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()}>
              <Trash2 className="size-4 mr-2" />
              {t('gallery.deleteImage')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
