/**
 * Dashboard section visibility by business role (owner / manager / staff).
 * Matches practical write access + existing RLS intent.
 */

export type BusinessRole = 'owner' | 'manager' | 'staff'

const ALL: BusinessRole[] = ['owner', 'manager', 'staff']
const OWNER_MANAGER: BusinessRole[] = ['owner', 'manager']
const OWNER: BusinessRole[] = ['owner']

/** Main sidebar nav href → roles that may see it */
export const DASHBOARD_NAV_ACCESS: Record<string, BusinessRole[]> = {
  '/dashboard': OWNER_MANAGER, // setup overview — staff land on orders
  '/dashboard/orders': ALL,
  '/dashboard/business': OWNER_MANAGER,
  '/dashboard/menu': OWNER_MANAGER,
  '/dashboard/pages': OWNER_MANAGER,
  '/dashboard/print-menu': OWNER_MANAGER,
  '/dashboard/qr': OWNER_MANAGER,
  '/dashboard/payments': OWNER, // payment account settings are owner-only to edit
  '/dashboard/gallery': OWNER_MANAGER,
  '/dashboard/publishing': OWNER_MANAGER,
}

/** Settings sub-nav */
export const SETTINGS_NAV_ACCESS: Record<string, BusinessRole[]> = {
  '/dashboard/settings/security': ALL,
  '/dashboard/settings/team': OWNER_MANAGER,
  '/dashboard/settings/localization': ALL, // personal dashboard language/currency
  '/dashboard/settings/credits': OWNER_MANAGER,
}

export function normalizeBusinessRole(role: string | null | undefined): BusinessRole {
  if (role === 'manager' || role === 'staff' || role === 'owner') return role
  return 'owner'
}

export function canAccessPath(
  pathname: string,
  role: string | null | undefined,
  accessMap: Record<string, BusinessRole[]>,
): boolean {
  const r = normalizeBusinessRole(role)
  // Longest prefix match
  const match = Object.keys(accessMap)
    .sort((a, b) => b.length - a.length)
    .find(href => pathname === href || pathname.startsWith(`${href}/`))
  if (!match) return true
  return accessMap[match].includes(r)
}

export function canAccessNavHref(href: string, role: string | null | undefined): boolean {
  const r = normalizeBusinessRole(role)
  const allowed = DASHBOARD_NAV_ACCESS[href]
  if (!allowed) return true
  return allowed.includes(r)
}

export function canAccessSettingsHref(href: string, role: string | null | undefined): boolean {
  const r = normalizeBusinessRole(role)
  const allowed = SETTINGS_NAV_ACCESS[href]
  if (!allowed) return true
  return allowed.includes(r)
}

/** Where to send a role that opened a forbidden dashboard URL */
export function defaultDashboardPathForRole(role: string | null | undefined): string {
  return normalizeBusinessRole(role) === 'staff' ? '/dashboard/orders' : '/dashboard'
}
