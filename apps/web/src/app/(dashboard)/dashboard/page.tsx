import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowRight, Store, Palette, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { getServerTranslation } from '@/i18n/getDictionary'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { t } = await getServerTranslation()

  const QUICK_ACTIONS = [
    {
      title: t('overview.quickActions.businessProfile.title'),
      description: t('overview.quickActions.businessProfile.description'),
      href: '/dashboard/business',
      icon: Store,
      cta: t('overview.quickActions.businessProfile.cta'),
      phase: 'v1',
    },
    {
      title: t('overview.quickActions.menu.title'),
      description: t('overview.quickActions.menu.description'),
      href: '/dashboard/menu',
      icon: UtensilsCrossed,
      cta: t('overview.quickActions.menu.cta'),
      phase: 'v1',
    },
    {
      title: t('overview.quickActions.pageBuilder.title'),
      description: t('overview.quickActions.pageBuilder.description'),
      href: '/dashboard/pages',
      icon: Palette,
      cta: t('overview.quickActions.pageBuilder.cta'),
      phase: 'soon',
    },
  ]

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('overview.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('overview.description')}
        </p>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_ACTIONS.map(action => {
          const disabled = action.phase === 'soon'
          return (
            <Card
              key={action.href}
              className={disabled ? 'opacity-60' : 'hover:shadow-md transition-shadow'}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg bg-muted">
                    <action.icon className="size-4 text-foreground" />
                  </div>
                  {disabled && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t('overview.comingSoon')}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-3">{action.title}</CardTitle>
                <CardDescription className="text-sm">{action.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {disabled ? (
                  <Button size="sm" variant="outline" disabled className="w-full">
                    {action.cta}
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" asChild>
                    <Link href={action.href}>
                      {action.cta}
                      <ArrowRight className="size-3.5 ml-1.5" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
