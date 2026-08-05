'use client'

/**
 * Live theme tokens for the Puck canvas.
 *
 * Puck memoizes blocks on data props only. Brand color lives outside block data
 * (theme settings + refs), so changing it does not bust MemoizeComponent.
 * A module store + useSyncExternalStore lets Hero/CTA/MenuGrid re-render when
 * the editor publishes a new brand color — without relying on viewport setUi hacks.
 *
 * Live storefront pages do not mount ThemeTokensProvider; they keep using the
 * brandColor prop from the server-rendered theme.
 */

import { createContext, useContext, useLayoutEffect, useSyncExternalStore } from 'react'
import {
  resolveThemeTokens,
  type ThemeTokenValues,
} from '../theme-tokens'
import { defaultThemeSettings } from '../types'

const ThemeTokensContext = createContext<ThemeTokenValues | null>(null)

let snapshot: ThemeTokenValues = resolveThemeTokens(defaultThemeSettings)
let activePublishers = 0
const listeners = new Set<() => void>()

function emit(next: ThemeTokenValues) {
  if (
    snapshot.brandColor === next.brandColor
    && snapshot.pageBg === next.pageBg
    && snapshot.pageText === next.pageText
  ) {
    return
  }
  snapshot = next
  listeners.forEach(l => l())
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

function getSnapshot() {
  return snapshot
}

export function ThemeTokensProvider({
  value,
  children,
}: {
  value: ThemeTokenValues
  children: React.ReactNode
}) {
  useLayoutEffect(() => {
    activePublishers += 1
    return () => {
      activePublishers -= 1
    }
  }, [])

  useLayoutEffect(() => {
    emit(value)
  }, [value])

  return (
    <ThemeTokensContext.Provider value={value}>
      {children}
    </ThemeTokensContext.Provider>
  )
}

export function useThemeTokens(): ThemeTokenValues {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const ctx = useContext(ThemeTokensContext)
  if (activePublishers > 0) return store
  return ctx ?? store
}

/** Prefer live editor theme tokens over baked props (props can be stale under Puck memo). */
export function useThemeBrandColor(fallback?: string): string {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  if (activePublishers > 0) return store.brandColor
  return fallback ?? store.brandColor ?? defaultThemeSettings.primary_color
}
