'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { acceptInviteAction, declineInviteAction } from '@/app/actions/acceptInvite'
import { useTranslation } from '@/i18n/I18nProvider'
import type { IncomingInvite } from '@/lib/pending-invitations'

export function IncomingInvites({ invites }: { invites: IncomingInvite[] }) {
  const { t } = useTranslation()
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)

  if (invites.length === 0) return null

  function roleLabel(role: string) {
    if (role === 'manager') return t('settings.team.roles.manager')
    if (role === 'staff') return t('settings.team.roles.staff')
    return role
  }

  async function accept(invite: IncomingInvite) {
    setBusyId(invite.id)
    const res = await acceptInviteAction(invite.token)
    if (res.error) {
      toast.error(res.error)
      setBusyId(null)
      return
    }
    try {
      localStorage.setItem('eatery_current_business_id', invite.businessId)
    } catch {
      // ignore
    }
    document.cookie = `eatery_current_business_id=${invite.businessId}; path=/; max-age=31536000`
    toast.success(t('invite.acceptedToast'))
    window.location.assign('/dashboard')
  }

  async function decline(invite: IncomingInvite) {
    setBusyId(invite.id)
    const res = await declineInviteAction(invite.token)
    if (res.error) {
      toast.error(res.error)
      setBusyId(null)
      return
    }
    toast.success(t('invite.declinedToast'))
    router.refresh()
    setBusyId(null)
  }

  return (
    <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-amber-950">{t('invite.incomingTitle')}</h2>
        <p className="text-sm text-amber-900/80 mt-1">{t('invite.incomingHint')}</p>
      </div>
      <ul className="space-y-3">
        {invites.map((invite) => {
          const busy = busyId === invite.id
          return (
            <li key={invite.id} className="rounded-lg border border-amber-100 bg-white p-4">
              <p className="text-sm font-semibold text-gray-900">{invite.businessName}</p>
              <p className="text-sm text-gray-500 mt-1">
                {t('invite.incomingDesc').replace('{role}', roleLabel(invite.role))}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void accept(invite)}
                  className="inline-flex h-9 items-center justify-center rounded-md bg-black px-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  {t('invite.accept')}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void decline(invite)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('invite.decline')}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
