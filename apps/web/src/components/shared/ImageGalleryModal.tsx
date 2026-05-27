'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { getGalleryImagesAction, deleteGalleryImageAction, type GalleryImage } from '@/app/actions/gallery'
import { Loader2, Trash2, Check, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ImageGalleryModalProps {
  businessId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (url: string) => void
}

export function ImageGalleryModal({ businessId, open, onOpenChange, onSelect }: ImageGalleryModalProps) {
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(false)
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      loadImages()
    }
  }, [open, businessId])

  async function loadImages() {
    setLoading(true)
    try {
      const res = await getGalleryImagesAction(businessId)
      if (res.success && res.data) {
        setImages(res.data)
      } else {
        toast.error('Failed to load gallery')
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(e: React.MouseEvent, img: GalleryImage) {
    e.stopPropagation()
    const confirmDelete = window.confirm(
      'WARNING: Are you sure you want to delete this image? If it is currently used on your menu or website, it will become broken. Proceed?'
    )
    if (!confirmDelete) return

    setDeletingPath(img.path)
    try {
      const res = await deleteGalleryImageAction(img.bucket, img.path)
      if (res.success) {
        toast.success('Image deleted')
        setImages(prev => prev.filter(i => i.path !== img.path))
      } else {
        toast.error(res.error || 'Failed to delete')
      }
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Image Gallery</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1 min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          ) : images.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm">
              <p>No images found in your gallery.</p>
              <p className="mt-1">Upload images first to see them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {images.map((img) => (
                <div
                  key={img.path}
                  onClick={() => onSelect(img.url)}
                  className="group relative aspect-square rounded-lg border border-border overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
                >
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Check className="size-8 text-white drop-shadow-md" />
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => handleDelete(e, img)}
                    disabled={deletingPath === img.path}
                    className="absolute top-1 right-1 p-1.5 rounded-md bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  >
                    {deletingPath === img.path ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Trash2 className="size-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
