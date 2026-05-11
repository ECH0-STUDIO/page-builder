import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowRight, Store, Palette, UtensilsCrossed, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

const QUICK_ACTIONS = [
  {
    title: 'Business Profile',
    description: 'Add your logo, address, hours & social links',
    href: '/dashboard/business',
    icon: Store,
    cta: 'Set up profile',
    phase: 'v1',
  },
  {
    title: 'Menu',
    description: 'Add categories, items & pricing',
    href: '/dashboard/menu',
    icon: UtensilsCrossed,
    cta: 'Build menu',
    phase: 'v1',
  },
  {
    title: 'Page Builder',
    description: 'Design your public digital page',
    href: '/dashboard/pages',
    icon: Palette,
    cta: 'Build page',
    phase: 'soon',
  },
]

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome to your dashboard. Let&apos;s get your page live.
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
                      coming soon
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
