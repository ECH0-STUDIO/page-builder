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
import { getUserBusinesses } from '@/lib/business'

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
}: {
  children: ReactNode
  initialBusinesses: Business[]
}) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [currentId, setCurrentId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return initialBusinesses[0]?.id ?? null
    const stored = localStorage.getItem(STORAGE_KEY)
    // Validate stored ID is still in the list
    if (stored && initialBusinesses.some(b => b.id === stored)) return stored
    return initialBusinesses[0]?.id ?? null
  })
  const [isLoading, setIsLoading] = useState(false)

  const currentBusiness = businesses.find(b => b.id === currentId) ?? null

  const switchBusiness = useCallback((id: string) => {
    setCurrentId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  const refreshBusinesses = useCallback(async () => {
    setIsLoading(true)
    try {
      const fresh = await getUserBusinesses()
      setBusinesses(fresh)
      // If current ID no longer exists, switch to first
      setCurrentId(prev => {
        if (fresh.some(b => b.id === prev)) return prev
        const first = fresh[0]?.id ?? null
        if (first) localStorage.setItem(STORAGE_KEY, first)
        return first
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Persist when currentId changes
  useEffect(() => {
    if (currentId) localStorage.setItem(STORAGE_KEY, currentId)
  }, [currentId])

  return (
    <BusinessContext.Provider
      value={{ businesses, currentBusiness, switchBusiness, refreshBusinesses, isLoading }}
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
