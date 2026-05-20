'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/business-server'
import { revalidatePath } from 'next/cache'
import type { PaymentSettings } from '@/lib/vietqr-utils'

// ─── Server Actions ───────────────────────────────────────────────────────────

export async function getPaymentSettingsAction(businessId: string): Promise<PaymentSettings> {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase
  const { data } = await db
    .from('businesses')
    .select('payment_settings')
    .eq('id', businessId)
    .single()

  return (data?.payment_settings as PaymentSettings) ?? {}
}

export async function upsertPaymentSettingsAction(
  businessId: string,
  settings: PaymentSettings,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { role } = await getActiveBusiness(supabase, user.id)
  if (role !== 'owner' && role !== 'manager') {
    return { error: 'Unauthorized: Only owners and managers can update payment settings.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase
  const { error } = await db
    .from('businesses')
    .update({ payment_settings: settings })
    .eq('id', businessId)

  if (error) return { error: error.message }
  revalidatePath('/dashboard/payments')
  return {}
}
