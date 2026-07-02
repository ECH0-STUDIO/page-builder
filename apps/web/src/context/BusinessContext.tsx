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
import { ACTIVE_BUSINESS_STORAGE_KEY, setActiveBusinessId } from '@/lib/active-business'

interface BusinessContextValue {
  businesses: Business[]
  currentBusiness: Business | null
  switchBusiness: (id: string) => void
  refreshBusinesses: () => Promise<void>
  isLoading: boolean
}

const BusinessContext = createContext<BusinessContextValue | null>(null)

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

  // Server layout may pass a newer list after creating/switching businesses.
  useEffect(() => {
    queryClient.setQueryData(['businesses'], initialBusinesses)
  }, [queryClient, initialBusinesses])

  useEffect(() => {
    setCurrentId(initialActiveBusinessId)
  }, [initialActiveBusinessId])

  const list = businesses ?? initialBusinesses
  const currentBusiness = list.find((b: Business) => b.id === currentId) ?? null

  const switchBusiness = useCallback((id: string) => {
    setActiveBusinessId(id)
    window.location.assign('/dashboard')
  }, [])

  const refreshBusinesses = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['businesses'] })
    await refetch()
  }, [queryClient, refetch])

  useEffect(() => {
    if (currentId) {
      setActiveBusinessId(currentId)
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

export { ACTIVE_BUSINESS_STORAGE_KEY }
