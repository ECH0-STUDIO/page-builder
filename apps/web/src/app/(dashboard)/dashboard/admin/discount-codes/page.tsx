import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DiscountCodesAdmin } from '@/components/admin/DiscountCodesAdmin'

export const metadata = {
  title: 'Mã giảm giá | Eatery Admin',
}

function isPlatformAdmin(email: string | undefined): boolean {
  if (!email) return false
  const admins = (process.env.PLATFORM_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
  return admins.includes(email.toLowerCase())
}

export default async function AdminDiscountCodesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isPlatformAdmin(user.email)) redirect('/dashboard')

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Quản lý mã giảm giá</h1>
        <p className="text-muted-foreground mt-1">
          Chỉ dành cho quản trị viên nền tảng. Thêm email của bạn vào biến môi trường PLATFORM_ADMIN_EMAILS.
        </p>
      </div>
      <DiscountCodesAdmin />
    </div>
  )
}
