'use client'

import { useState } from 'react'
import { inviteTeamMemberAction, removeTeamMemberAction } from '@/app/actions/team'
import { toast } from 'sonner'
import { Loader2, Plus, UserX, User, ShieldAlert } from 'lucide-react'

export function TeamList({ members, businessId }: { members: any[], businessId: string }) {
  const [isInviting, setIsInviting] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setIsInviting(true)

    const res = await inviteTeamMemberAction({ email, role, businessId })
    
    setIsInviting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Invitation sent!')
      setEmail('')
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return

    const res = await removeTeamMemberAction({ memberId, businessId })
    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success('Member removed')
    }
  }

  return (
    <div className="space-y-8">
      {/* Invite Form */}
      <div className="bg-white border rounded-xl p-6">
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Invite New Member</h4>
        <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="space-y-1.5 flex-1">
            <label className="text-sm font-medium text-gray-700" htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="waiter@example.com"
              className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          <div className="space-y-1.5 w-full sm:w-40">
            <label className="text-sm font-medium text-gray-700" htmlFor="role">Role</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-10 px-3 bg-white rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="staff">Staff / Waiter</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={isInviting}
            className="h-10 px-4 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center justify-center disabled:opacity-50 w-full sm:w-auto"
          >
            {isInviting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
            Send Invite
          </button>
        </form>
      </div>

      {/* Member List */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-4">Current Team</h4>
        <div className="bg-white border rounded-xl overflow-hidden divide-y">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  {member.role === 'owner' ? <ShieldAlert className="size-5 text-gray-500" /> : <User className="size-5 text-gray-500" />}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                </div>
              </div>
              
              {member.role !== 'owner' && (
                <button
                  onClick={() => handleRemove(member.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Remove member"
                >
                  <UserX className="size-4" />
                </button>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              No additional team members yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
