'use client'

import { useRouter } from 'next/navigation'
import { ChevronsUpDown, Plus, Check, Store } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useBusiness } from '@/context/BusinessContext'
import { useTranslation } from '@/i18n/I18nProvider'

export function BusinessSwitcher() {
  const router = useRouter()
  const { businesses, currentBusiness, switchBusiness } = useBusiness()
  const { t } = useTranslation()

  const initials = currentBusiness?.name
    ?.split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? '?'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          id="business-switcher-trigger"
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent group"
        >
          <Avatar className="size-8 rounded-md shrink-0">
            <AvatarImage src={currentBusiness?.logo_url ?? undefined} alt={currentBusiness?.name} />
            <AvatarFallback className="rounded-md text-xs font-bold bg-primary text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-sidebar-foreground">
              {currentBusiness?.name ?? t('sidebar.selectBusiness')}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentBusiness ? `/${currentBusiness.slug}` : ''}
            </p>
          </div>
          <ChevronsUpDown className="size-4 text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-64"
        sideOffset={6}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
          {t('sidebar.yourBusinesses')}
        </DropdownMenuLabel>

        {businesses.map(biz => (
          <DropdownMenuItem
            key={biz.id}
            id={`switch-business-${biz.id}`}
            onClick={() => switchBusiness(biz.id)}
            className="gap-3"
          >
            <Avatar className="size-6 rounded-md shrink-0">
              <AvatarImage src={biz.logo_url ?? undefined} alt={biz.name} />
              <AvatarFallback className="rounded-md text-[10px] font-bold bg-primary text-primary-foreground">
                {biz.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm">{biz.name}</span>
            {biz.id === currentBusiness?.id && (
              <Check className="size-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          id="add-new-business"
          onClick={() => router.push('/onboarding/new-business')}
          className="gap-3 text-muted-foreground"
        >
          <div className="size-6 rounded-md border-2 border-dashed border-border flex items-center justify-center shrink-0">
            <Plus className="size-3" />
          </div>
          <span className="text-sm">{t('sidebar.addNewBusiness')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
