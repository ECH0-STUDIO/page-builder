import { redirect } from 'next/navigation'

/** @deprecated Use /dashboard/pages?page=order — kept as a redirect for old links. */
export default function OrderPageAdminRedirect() {
  redirect('/dashboard/pages?page=order')
}
