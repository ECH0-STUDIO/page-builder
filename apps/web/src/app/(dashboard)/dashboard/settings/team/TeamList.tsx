'use client'

import { useState } from 'react'
import { inviteTeamMemberAction, removeTeamMemberAction } from '@/app/actions/team'
import { toast } from 'sonner'
import { Loader2, Plus, UserX, User, ShieldAlert, Mail, Clock } from 'lucide-react'
import { useTranslation } from '@/i18n/I18nProvider'

export function TeamList({ members, pendingInvites = [], businessId }: { members: any[], pendingInvites?: any[], businessId: string }) {
  const [isInviting, setIsInviting] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const { t } = useTranslation()

  // Decode sentinel tokens injected by the server page so names are translatable
  function displayName(raw: string) {
    if (raw.startsWith('__YOU_OWNER__:')) return t('settings.team.youOwner')
    if (raw.startsWith('__YOU__:')) return `${t('settings.team.you')} (${raw.replace('__YOU__:', '')})`
    return raw
  }

  function displayRole(role: string) {
    if (role === 'owner') return t('settings.team.owner')
    if (role === 'staff') return t('settings.team.roles.staff')
    if (role === 'manager') return t('settings.team.roles.manager')
    return role
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsInviting(true)

    const res = await inviteTeamMemberAction({ email, role, businessId })
    
    setIsInviting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(t('settings.team.inviteSent'))
      setEmail('')
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm(t('settings.team.removeConfirm'))) return

    const res = await removeTeamMemberAction({ memberId, businessId })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(t('settings.team.removed'))
    }
  }

  async function handleResend(inviteEmail: string, inviteRole: string, inviteId: string) {
    setResendingId(inviteId)
    const res = await inviteTeamMemberAction({ email: inviteEmail, role: inviteRole, businessId })
    setResendingId(null)
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(t('settings.team.inviteResent'))
    }
  }

  return (
    <div className="space-y-8">
      {/* Invite Form */}
      <div className="bg-white border rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('settings.team.inviteNew')}</h4>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">{t('settings.team.email')}</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('settings.team.emailPlaceholder')}
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="space-y-1.5 w-full sm:w-40">
            <label className="text-sm font-medium text-gray-700" htmlFor="role">{t('settings.team.role')}</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 bg-white rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="staff">{t('settings.team.roles.staff')}</option>
              <option value="manager">{t('settings.team.roles.manager')}</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isInviting}
            className="h-10 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
          >
            {isInviting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
            {t('settings.team.sendInvite')}
          </button>
        </form>
      </div>

      {/* Member List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('settings.team.currentTeam')}</h4>
        <div className="bg-white border rounded-xl overflow-hidden divide-y">
          {/* Active Members */}
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  {member.role === 'owner' ? <ShieldAlert className="size-5 text-gray-500" /> : <User className="size-5 text-gray-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{displayName(member.name)}</p>
                  <p className="text-xs text-gray-500">
                    {displayRole(member.role)}
                  </p>
                </div>
              </div>
              
              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title={t('settings.team.removeMember')}
                >
                  <UserX className="size-4" />
                </button>
              )}
            </div>
          ))}

          {/* Pending Invites */}
          {pendingInvites.map((invite) => (
            <div key={invite.id} className="flex items-center justify-between p-4 bg-orange-50/30 hover:bg-orange-50/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Mail className="size-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <p className="text-xs text-orange-600 capitalize flex items-center gap-1">
                    <Clock className="size-3" />
                    {t('settings.team.pending')} · {displayRole(invite.role)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleResend(invite.email, invite.role, invite.id)}
                  disabled={resendingId === invite.id}
                  className="text-xs font-medium px-3 py-1.5 bg-white border shadow-sm rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors flex items-center"
                >
                  {resendingId === invite.id ? <Loader2 className="size-3 mr-1 animate-spin" /> : null}
                  {t('settings.team.resend')}
                </button>
              </div>
            </div>
          ))}

          {members.length === 1 && pendingInvites.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              {t('settings.team.empty')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
