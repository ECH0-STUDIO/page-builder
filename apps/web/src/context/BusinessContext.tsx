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
  initialActiveBusinessId,
}: {
  children: ReactNode
  initialBusinesses: Business[]
  initialActiveBusinessId: string
}) {
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [currentId, setCurrentId] = useState<string | null>(initialActiveBusinessId)
  const [isLoading, setIsLoading] = useState(false)

  const currentBusiness = businesses.find(b => b.id === currentId) ?? null

  const switchBusiness = useCallback((id: string) => {
    setCurrentId(id)
    localStorage.setItem(STORAGE_KEY, id)
    document.cookie = `${STORAGE_KEY}=${id}; path=/; max-age=31536000`
    window.location.reload()
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
    if (currentId) {
      localStorage.setItem(STORAGE_KEY, currentId)
      document.cookie = `${STORAGE_KEY}=${currentId}; path=/; max-age=31536000`
    }
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
