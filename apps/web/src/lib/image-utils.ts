/**
 * Client-side image compression + direct Supabase Storage upload.
 *
 * Quality strategy:
 * - Start at `quality` (default 0.85)
 * - If `targetSizeKB` is set, auto-reduce quality in steps until the output
 *   fits; this ensures we never upload bloated images while keeping as much
 *   detail as possible at the starting quality.
 *
 * Cost note: at 200KB per image and $0.021/GB/month (Supabase Pro),
 * 10,000 menu photos costs < $0.05/month in storage.
 * Egress matters more at scale — serve via CDN for large traffic.
 */

import { createClient } from '@/lib/supabase/client'

export interface CompressOptions {
  maxWidth?: number
  maxHeight?: number
  /** Initial JPEG quality 0–1 (default 0.85) */
  quality?: number
  /** Hard cap on output size in KB. Quality will be reduced in steps until the blob fits. */
  targetSizeKB?: number
  /** Output format (default 'image/jpeg') */
  format?: 'image/jpeg' | 'image/png' | 'image/webp'
}

/** Compress a File to a JPEG Blob using the Canvas API. */
export async function compressImageToBlob(
  file: File,
  {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.85,
    targetSizeKB,
    format = 'image/jpeg',
  }: CompressOptions = {}
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      let w = img.naturalWidth
      let h = img.naturalHeight

      // Scale down proportionally — never upscale
      const ratio = Math.min(1, maxWidth / w, maxHeight / h)
      w = Math.round(w * ratio)
      h = Math.round(h * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas unavailable'))

      // If JPEG, apply white background so transparent PNGs survive conversion cleanly
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)

      const tryBlob = (q: number) =>
        new Promise<Blob>((res, rej) =>
          canvas.toBlob(
            b => (b ? res(b) : rej(new Error('Compression failed'))),
            format,
            q
          )
        )

      if (targetSizeKB) {
        // Iteratively reduce quality until we're under the target
        const steps = [quality, 0.75, 0.65, 0.55, 0.42]
        ;(async () => {
          for (const q of steps) {
            const blob = await tryBlob(q)
            if (blob.size / 1024 <= targetSizeKB) return resolve(blob)
          }
          // Last resort — use lowest step
          resolve(await tryBlob(0.42))
        })().catch(reject)
      } else {
        tryBlob(quality).then(resolve).catch(reject)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image'))
    }

    img.src = objectUrl
  })
}

/**
 * Compress a File and upload directly to Supabase Storage from the browser.
 * Returns the public URL with a cache-busting timestamp.
 *
 * @param onProgress - optional callback with { originalKB, compressedKB }
 */
export async function uploadImageToStorage(
  bucket: string,
  path: string,
  file: File,
  compress: CompressOptions = {},
  onProgress?: (info: { originalKB: number; compressedKB: number }) => void
): Promise<string> {
  const blob = await compressImageToBlob(file, compress)

  onProgress?.({
    originalKB: Math.round(file.size / 1024),
    compressedKB: Math.round(blob.size / 1024),
  })

  const contentType = compress.format || 'image/jpeg'
  const supabase = createClient()
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, { contentType, upsert: true })

  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}

export interface ImageValidationOptions {
  requireSquare?: boolean
  exactWidth?: number
  exactHeight?: number
}

/**
 * Validate image dimensions given a File or URL.
 */
export function validateImageDimensions(
  urlOrFile: string | File,
  options: ImageValidationOptions
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    let objectUrl: string | null = null

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      
      if (options.requireSquare) {
        if (img.naturalWidth !== img.naturalHeight) {
          return resolve(false)
        }
      }
      if (options.exactWidth && img.naturalWidth !== options.exactWidth) {
        return resolve(false)
      }
      if (options.exactHeight && img.naturalHeight !== options.exactHeight) {
        return resolve(false)
      }
      resolve(true)
    }

    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      resolve(false)
    }

    if (typeof urlOrFile === 'string') {
      img.src = urlOrFile
    } else {
      objectUrl = URL.createObjectURL(urlOrFile)
      img.src = objectUrl
    }
  })
}
