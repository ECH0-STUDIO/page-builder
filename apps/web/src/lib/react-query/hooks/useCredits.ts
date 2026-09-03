'use client'

import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getCreditBalanceAction } from '@/app/actions/credits'

export const creditsQueryKey = (businessId: string) => ['credits', businessId] as const

export function useCreditBalance(businessId: string | undefined | null, initialBalance?: number) {
  return useQuery({
    queryKey: creditsQueryKey(businessId ?? ''),
    queryFn: async () => {
      const res = await getCreditBalanceAction(businessId!)
      if (!res.success) throw new Error(res.error || 'Failed to load credits')
      return res.data ?? 0
    },
    enabled: Boolean(businessId),
    initialData: typeof initialBalance === 'number' ? initialBalance : undefined,
    staleTime: 15_000,
  })
}

/** Optimistically set / invalidate sidebar + page credit displays. */
export function useSyncCreditBalance() {
  const queryClient = useQueryClient()
  return useCallback(
    (businessId: string, nextBalance?: number) => {
      if (typeof nextBalance === 'number') {
        queryClient.setQueryData(creditsQueryKey(businessId), nextBalance)
      }
      return queryClient.invalidateQueries({ queryKey: creditsQueryKey(businessId) })
    },
    [queryClient],
  )
}
