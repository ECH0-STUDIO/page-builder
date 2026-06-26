/**
 * Canonical app URL for auth redirects (signup, login, password reset).
 * Always use NEXT_PUBLIC_APP_URL in production — not window.location — so
 * Supabase email links match eateryvn.com even if Site URL was misconfigured.
 */
export function getAppBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return raw.startsWith('http') ? raw.replace(/\/$/, '') : `https://${raw.replace(/\/$/, '')}`
}

export function getAuthCallbackUrl(nextPath: string = '/dashboard'): string {
  return `${getAppBaseUrl()}/api/auth/callback?next=${encodeURIComponent(nextPath)}`
}
