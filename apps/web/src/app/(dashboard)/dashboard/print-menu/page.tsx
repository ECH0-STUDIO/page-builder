import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
// import { createClient } from '@/lib/supabase/server'
import { PrintMenuShell } from '@/components/print/PrintMenuShell'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import { getServerTranslation } from '@/i18n/getDictionary'

export const metadata: Metadata = { title: 'Print Menu' }
export const dynamic = 'force-dynamic'

export default async function PrintMenuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { business } = await getActiveBusiness(supabase, user.id)
  if (!business) redirect('/onboarding/new-business')
  const [{ data: categoriesRaw }, { data: itemsRaw }] = await Promise.all([
    db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order'),
    db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order'),
  ])

  const categories = normalizeMenuCategories((categoriesRaw ?? []) as Record<string, unknown>[])
  const items = normalizeMenuItems((itemsRaw ?? []) as Record<string, unknown>[])

  if (categories.length === 0) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <p className="text-lg font-semibold text-gray-700">{t('printMenu.noItems')}</p>
        <p className="text-sm text-muted-foreground">{t('printMenu.noItemsDesc')}</p>
        <Link href="/dashboard/menu" className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors">
          {t('printMenu.goToMenu')}
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 h-screen flex flex-col">
      <div className="mb-5 shrink-0">
        <h1 className="text-2xl font-bold text-foreground">{t('printMenu.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('printMenu.description')}
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <PrintMenuShell
          business={{ id: business.id, name: business.name, logo_url: business.logo_url }}
          categories={categories}
          items={items}
        />
      </div>
    </div>
  )
}
