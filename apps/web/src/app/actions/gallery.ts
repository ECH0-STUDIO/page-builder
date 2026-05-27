'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export interface GalleryImage {
  name: string;
  url: string;
  created_at?: string | null;
  bucket: string;
  path: string;
  size: number;
  inUse?: boolean;
}

export interface StorageSubscription {
  current_quota_mb: number;
  next_billing_date: string;
}

export async function getGalleryImagesAction(businessId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Fetch all active URLs from DB
    let activeUrlsString = ''

    const [biz, pub, theme, cats, items, blocks, sub] = await Promise.all([
      supabase.from('businesses').select('logo_url').eq('id', businessId).single(),
      supabase.from('publishing_settings').select('favicon_url, apple_touch_icon_url').eq('business_id', businessId).single(),
      supabase.from('theme_settings').select('hero_image_url').eq('business_id', businessId).single(),
      supabase.from('menu_categories').select('image_url').eq('business_id', businessId),
      supabase.from('menu_items').select('image_url').eq('business_id', businessId),
      supabase.from('page_blocks').select('config').eq('business_id', businessId),
      supabase.from('storage_subscriptions').select('*').eq('business_id', businessId).single()
    ])

    let subscriptionData = sub.data
    
    // Auto-initialize if missing
    if (!subscriptionData) {
      const adminClient = createAdminClient()
      const nextDate = new Date()
      nextDate.setDate(nextDate.getDate() + 30)
      
      const { data: newSub } = await (adminClient as any).from('storage_subscriptions').insert({
        business_id: businessId,
        current_quota_mb: 20,
        next_billing_date: nextDate.toISOString()
      }).select().single()
      
      subscriptionData = newSub
    }

    if (biz.data) activeUrlsString += (biz.data.logo_url || '') + ' '
    if (pub.data) activeUrlsString += (pub.data.favicon_url || '') + ' ' + (pub.data.apple_touch_icon_url || '') + ' '
    if (theme.data) activeUrlsString += (theme.data.hero_image_url || '') + ' '
    cats.data?.forEach(c => activeUrlsString += (c.image_url || '') + ' ')
    items.data?.forEach(i => activeUrlsString += (i.image_url || '') + ' ')
    blocks.data?.forEach(b => activeUrlsString += JSON.stringify(b.config || {}) + ' ')

    // List images from relevant buckets
    const buckets = ['page-images', 'favicons', 'logos', 'menu-images']
    let allImages: GalleryImage[] = []

    for (const bucket of buckets) {
      const { data, error } = await supabase.storage.from(bucket).list(businessId, {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' }
      })

      if (error) {
        console.error(`Error listing bucket ${bucket}:`, error)
        continue
      }

      if (data) {
        // Filter out placeholders like .emptyFolderPlaceholder
        const validFiles = data.filter(f => f.name !== '.emptyFolderPlaceholder')
        
        const decodedUrlsString = decodeURIComponent(activeUrlsString)

        const images = validFiles.map(file => {
          const path = `${businessId}/${file.name}`
          const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(path)
          
          return {
            name: file.name,
            url: publicData.publicUrl,
            created_at: file.created_at,
            bucket,
            path,
            size: file.metadata?.size || 0,
            inUse: activeUrlsString.includes(publicData.publicUrl) || decodedUrlsString.includes(path) || activeUrlsString.includes(path)
          }
        })
        
        allImages = [...allImages, ...images]
      }
    }

    // Sort by newest overall
    allImages.sort((a, b) => new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime())

    return { 
      success: true, 
      data: allImages,
      subscription: {
        current_quota_mb: subscriptionData?.current_quota_mb || 20,
        next_billing_date: subscriptionData?.next_billing_date || new Date().toISOString()
      } as StorageSubscription
    }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteGalleryImageAction(bucket: string, path: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Unauthorized' }

    // Delete the file
    const { error } = await supabase.storage.from(bucket).remove([path])
    if (error) throw error

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
