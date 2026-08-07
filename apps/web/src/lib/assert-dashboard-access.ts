import { redirect } from 'next/navigation'
import {
  canAccessNavHref,
  canAccessSettingsHref,
  defaultDashboardPathForRole,
} from '@/lib/dashboard-access'

/** Redirect when the active role cannot use this dashboard section. */
export function assertDashboardAccess(
  pathname: string,
  role: string | null | undefined,
  kind: 'nav' | 'settings' = 'nav',
) {
  const allowed =
    kind === 'settings'
      ? canAccessSettingsHref(pathname, role)
      : canAccessNavHref(pathname, role)
  if (!allowed) {
    redirect(defaultDashboardPathForRole(role))
  }
}
