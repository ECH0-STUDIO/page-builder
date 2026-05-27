'use client'

import { useState } from 'react'
import { ImageGalleryModal } from './ImageGalleryModal'

interface ImageUploaderProps {
  businessId: string
  onImageSelect: (url: string) => void
  children: (openGallery: () => void) => React.ReactNode
}

export function ImageUploader({ businessId, onImageSelect, children }: ImageUploaderProps) {
  const [galleryOpen, setGalleryOpen] = useState(false)

  return (
    <>
      {children(() => setGalleryOpen(true))}
      <ImageGalleryModal
        businessId={businessId}
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        onSelect={(url) => {
          onImageSelect(url)
          setGalleryOpen(false)
        }}
      />
    </>
  )
}
