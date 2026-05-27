'use client'

import { useState, useEffect } from 'react'
import { Image as ImageIcon, Trash2, Loader2, HardDrive, Coins } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'
import { getGalleryImagesAction, deleteGalleryImageAction, type GalleryImage, type StorageSubscription } from '@/app/actions/gallery'
import { uploadImageToStorage } from '@/lib/image-utils'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function GalleryClient({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [subscription, setSubscription] = useState<StorageSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)
  
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<{bucket: string, path: string} | null>(null)

  async function loadImages() {
    setLoading(true)
    const res = await getGalleryImagesAction(businessId)
    if (res.success && res.data) {
      setImages(res.data)
      if (res.subscription) {
        setSubscription(res.subscription)
      }
    } else {
      toast.error('Failed to load gallery')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadImages()
  }, [businessId])

  function confirmDelete(bucket: string, path: string) {
    setImageToDelete({ bucket, path })
    setDeleteConfirmOpen(true)
  }

  async function handleDelete() {
    if (!imageToDelete) return
    setDeletingPath(imageToDelete.path)
    setDeleteConfirmOpen(false)

    const res = await deleteGalleryImageAction(imageToDelete.bucket, imageToDelete.path)
    if (res.success) {
      toast.success(t('gallery.deleteImage') + ' OK')
      setImages(prev => prev.filter(img => img.path !== imageToDelete.path))
    } else {
      toast.error(res.error)
    }
    setDeletingPath(null)
    setImageToDelete(null)
  }

  const totalSizeBytes = images.reduce((sum, img) => sum + (img.size || 0), 0)
  const totalSizeMB = totalSizeBytes / (1024 * 1024)
  
  const currentQuota = subscription?.current_quota_mb || 20
  const usagePercentage = Math.min(100, (totalSizeMB / currentQuota) * 100)
  
  // Projected charge for the next cycle based on CURRENT usage
  const projectedCharge = Math.ceil(totalSizeMB / 20) || 1
  
  const formattedCycleEnd = subscription?.next_billing_date 
    ? new Date(subscription.next_billing_date).toLocaleDateString()
    : '---'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{t('gallery.title')}</h1>
        <p className="text-gray-500 mt-1">{t('gallery.description')}</p>
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
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('gallery.quotaUsage')}</span>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {totalSizeMB.toFixed(2)} <span className="text-lg text-gray-500 font-medium">/ {currentQuota} MB</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('gallery.projectedCharge')}</span>
              <div className="text-xl font-bold text-yellow-600 mt-1 flex items-center justify-end gap-1.5">
                <Coins className="size-5" /> {projectedCharge} {t('gallery.credits')}
              </div>
            </div>
          </div>
          
          <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden border">
            <div 
              className={`h-full transition-all duration-500 ease-in-out ${usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 75 ? 'bg-yellow-400' : 'bg-indigo-500'}`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="size-5" /> Media
            </CardTitle>
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
              {images.map((img) => (
                                <div key={img.path} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Status Badge */}
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

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                    <p className="text-xs text-white truncate w-full text-center mb-2" title={img.name}>
                      {img.name}
                    </p>
                    <p className="text-[10px] text-gray-300 mb-3">
                      {img.size ? (img.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                    {!img.inUse && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs w-full max-w-[100px]"
                        onClick={() => confirmDelete(img.bucket, img.path)}
                        disabled={deletingPath === img.path}
                      >
                        {deletingPath === img.path ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <><Trash2 className="size-3 mr-1" /> Delete</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">{t('gallery.deleteImage')}</DialogTitle>
            <DialogDescription>
              {t('gallery.confirmDelete')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4 mr-2" />
              {t('gallery.deleteImage')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
