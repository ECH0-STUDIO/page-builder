import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowRight, Store, Palette, UtensilsCrossed, Globe, QrCode, CreditCard, Eye, BarChart3, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { getServerTranslation } from '@/i18n/getDictionary'
import { getPageViewsAction } from '@/app/actions/page-builder'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  // Get active business
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase
  const { data: businesses } = await db
    .from('businesses')
    .select('id, name, logo_url, address, phone')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

  const analytics = await getPageViewsAction(business.id, 7)

  const [
    { data: publishing },
    { count: menuCount },
    { count: blocksCount },
  ] = await Promise.all([
    db.from('publishing_settings').select('published').eq('business_id', business.id).single(),
    db.from('menu_categories').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
    db.from('page_blocks').select('*', { count: 'exact', head: true }).eq('business_id', business.id),
  ])

  const stepsComplete = {
    businessProfile: !!(business.logo_url || business.address || business.phone),
    menu: (menuCount ?? 0) > 0,
    pageBuilder: (blocksCount ?? 0) > 0,
    publish: publishing?.published === true,
  }

  const CORE_STEPS = [
    {
      title: t('overview.steps.businessProfile.title'),
      description: t('overview.steps.businessProfile.desc'),
      href: '/dashboard/business',
      icon: Store,
      isComplete: stepsComplete.businessProfile,
    },
    {
      title: t('overview.steps.menu.title'),
      description: t('overview.steps.menu.desc'),
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
      isComplete: stepsComplete.menu,
    },
    {
      title: t('overview.steps.pageBuilder.title'),
      description: t('overview.steps.pageBuilder.desc'),
      href: '/dashboard/pages',
      icon: Palette,
      isComplete: stepsComplete.pageBuilder,
    },
    {
      title: t('overview.steps.publish.title'),
      description: t('overview.steps.publish.desc'),
      href: '/dashboard/publishing',
      icon: Globe,
      isComplete: stepsComplete.publish,
    },
  ]

  const NICE_TO_HAVE = [
    {
      title: t('overview.niceToHave.qr.title'),
      description: t('overview.niceToHave.qr.desc'),
      href: '/dashboard/qr',
      icon: QrCode,
    },
    {
      title: t('overview.niceToHave.payment.title'),
      description: t('overview.niceToHave.payment.desc'),
      href: '/dashboard/payments',
      icon: CreditCard,
    },
  ]

  const goToLabel = t('overview.steps.goTo')

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-12 md:pb-16 max-w-4xl space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t('overview.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('overview.description')}
        </p>
      </div>

      {/* Analytics */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t('overview.analytics.title')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <Eye className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('overview.analytics.totalViews')}</p>
                <p className="text-2xl font-bold">{analytics.total.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <BarChart3 className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t('overview.analytics.last7Days')}</p>
                <p className="text-2xl font-bold">{analytics.periodTotal.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Core Steps */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t('overview.steps.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CORE_STEPS.map((step, idx) => (
            <Link key={step.href} href={step.href} className="group flex flex-col h-full border rounded-xl overflow-hidden hover:shadow-md transition-all bg-card text-card-foreground">
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <step.icon className="size-5" />
                  </div>
                  {step.isComplete ? (
                    <span className="text-green-600 bg-green-100 p-1 rounded-full"><CheckCircle2 className="size-3.5" /></span>
                  ) : (
                    <span className="text-xs font-semibold text-muted-foreground/50">0{idx + 1}</span>
                  )}
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 flex-1">{step.description}</p>
                <div className="mt-4 flex items-center text-[11px] uppercase tracking-wider font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                  {goToLabel} {step.title} <ArrowRight className="size-3 ml-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Nice to have */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">{t('overview.niceToHave.title')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {NICE_TO_HAVE.map(step => (
            <Link key={step.href} href={step.href} className="group flex items-start gap-4 p-5 border rounded-xl hover:shadow-md transition-all bg-card text-card-foreground">
              <div className="p-2.5 rounded-lg bg-muted text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0">
                <step.icon className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
              <ArrowRight className="size-4 ml-auto self-center text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
