'use client'

import { signOutTo } from '@/lib/sign-out'

export function SwitchAccountButton({ nextPath, label }: { nextPath: string; label: string }) {
  return (
    <button
      type="button"
      onClick={() => void signOutTo(`/login?next=${encodeURIComponent(nextPath)}`)}
      className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:bg-gray-800"
    >
      {label}
    </button>
  )
}
