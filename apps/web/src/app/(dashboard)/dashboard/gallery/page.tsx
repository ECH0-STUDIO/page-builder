import { getAuthUser } from '@/lib/auth-server'
import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/business-server'
import { GalleryClient } from '@/components/gallery/GalleryClient'

export const metadata = {
  title: 'Media Gallery | Eatery',
}

export default async function GalleryPage() {
  const { supabase, user } = await getAuthUser()
  if (!user) redirect('/login')

  const { business, role } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/dashboard')

  if (role === 'staff') {
    redirect('/dashboard')
  }

  return (
    <GalleryClient businessId={business.id} />
  )
}
