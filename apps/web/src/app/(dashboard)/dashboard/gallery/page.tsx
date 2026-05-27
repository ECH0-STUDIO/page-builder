import { Suspense } from 'react'
import { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GalleryClient } from '@/components/gallery/GalleryClient'

export const metadata: Metadata = {
  title: 'Media Gallery | Eatery',
}

export default async function GalleryPage() {
  const supabase = await createClient()

  // Get active business ID from cookie
  const cookieStore = await cookies()
  const currentBusinessId = cookieStore.get('eatery_current_business_id')?.value

  if (!currentBusinessId) {
    redirect('/dashboard')
  }

  // Ensure user has access
  const { data: member } = await supabase
    .from('business_members')
    .select('role')
    .eq('business_id', currentBusinessId)
    .single()

  if (!member) {
    redirect('/dashboard')
  }

  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Gallery...</div>}>
      <GalleryClient businessId={currentBusinessId} />
    </Suspense>
  )
}
