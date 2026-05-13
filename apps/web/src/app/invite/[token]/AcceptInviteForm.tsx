'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { acceptInviteAction } from '@/app/actions/acceptInvite'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function AcceptInviteForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleAccept = async () => {
    setLoading(true)
    const res = await acceptInviteAction(token)
    
    if (res.error) {
      toast.error(res.error)
      setLoading(false)
    } else {
      toast.success('Invitation accepted! Welcome to the team.')
      router.push('/dashboard')
    }
  }

  return (
    <button
      onClick={handleAccept}
      disabled={loading}
      className="w-full flex items-center justify-center px-4 h-10 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Accept Invitation
    </button>
  )
}
