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

  // Fallback to empty array if businesses is undefined (e.g., during refetch)
  const currentBusiness = (businesses ?? initialBusinesses).find((b: Business) => b.id === currentId) ?? null

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
      value={{ businesses: businesses ?? initialBusinesses, currentBusiness, switchBusiness, refreshBusinesses, isLoading }}
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
