'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { Business } from '@/lib/business'
import { useBusinesses } from '@/lib/react-query/hooks/useBusiness'
import { useQueryClient } from '@tanstack/react-query'

interface BusinessContextValue {
  businesses: Business[]
  currentBusiness: Business | null
  switchBusiness: (id: string) => void
  refreshBusinesses: () => Promise<void>
  isLoading: boolean
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

const STORAGE_KEY = 'eatery_current_business_id'

export function BusinessProvider({
  children,
  initialBusinesses,
  initialActiveBusinessId,
}: {
  children: ReactNode
  initialBusinesses: Business[]
  initialActiveBusinessId: string
}) {
  const queryClient = useQueryClient()
  const { data: businesses, isLoading, refetch } = useBusinesses(initialBusinesses)
  const [currentId, setCurrentId] = useState<string | null>(initialActiveBusinessId)

  const businessesSignature = initialBusinesses
    .map((b) => `${b.id}:${b.role ?? ''}`)
    .join('|')

  // Seed React Query with server-resolved businesses on every dashboard mount.
  // Without this, a previous user's cached ['businesses'] (same key, 60s staleTime)
  // can keep showing the wrong role after logout → login as a different account.
  useEffect(() => {
    queryClient.setQueryData(['businesses'], initialBusinesses)
    setCurrentId(initialActiveBusinessId)
  }, [queryClient, initialActiveBusinessId, businessesSignature, initialBusinesses])

  const list = businesses ?? initialBusinesses
  const currentBusiness = list.find((b: Business) => b.id === currentId)
    ?? list.find((b: Business) => b.id === initialActiveBusinessId)
    ?? null

  const switchBusiness = useCallback((id: string) => {
    setCurrentId(id)
    localStorage.setItem(STORAGE_KEY, id)
    document.cookie = `${STORAGE_KEY}=${id}; path=/; max-age=31536000`
    window.location.reload()
  }, [])

  const refreshBusinesses = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    await refetch()
  }, [queryClient, refetch])

  // Persist when currentId changes
  useEffect(() => {
    if (currentId) {
      localStorage.setItem(STORAGE_KEY, currentId)
      document.cookie = `${STORAGE_KEY}=${currentId}; path=/; max-age=31536000`
    }
  }, [currentId])

  return (
    <BusinessContext.Provider
      value={{ businesses: list, currentBusiness, switchBusiness, refreshBusinesses, isLoading }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const ctx = useContext(BusinessContext)
  if (!ctx) throw new Error('useBusiness must be used inside BusinessProvider')
  return ctx
}
