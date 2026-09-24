'use client'

import { signOutTo } from '@/lib/sign-out'
import { useTranslation } from '@/i18n/I18nProvider'

export function SignOutLink({ nextPath }: { nextPath?: string }) {
  const { t } = useTranslation()
  const dest = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'
  return (
    <button
      type="button"
      onClick={() => void signOutTo(dest)}
      className="text-sm font-medium text-muted-foreground hover:text-foreground"
    >
      {t('sidebar.signOut')}
    </button>
  )
}
