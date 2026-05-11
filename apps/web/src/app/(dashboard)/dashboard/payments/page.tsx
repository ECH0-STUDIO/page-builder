import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPaymentSettingsAction } from '@/app/actions/payments'
import type { Metadata } from 'next'
import { VietQRSettings } from '@/components/payments/VietQRSettings'
import { PaymentPrintSection } from '@/components/payments/PaymentPrintSection'

export const metadata: Metadata = { title: 'Payment Settings' }
export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: businesses } = await db
    .from('businesses')
    .select('id, name, logo_url')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)

  const business = businesses?.[0]
  if (!business) redirect('/onboarding/new-business')

  const paymentSettings = await getPaymentSettingsAction(business.id)

  return (
    <div className="p-6 lg:p-8 max-w-5xl space-y-12">

      {/* ── Bank Account Setup ── */}
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Payment Settings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set up your bank account so customers can pay by scanning your VietQR code.
          </p>
        </div>
        <VietQRSettings
          businessId={business.id}
          initialSettings={paymentSettings}
          businessName={business.name}
        />
      </div>

      {/* ── Payment QR Print Designer ── */}
      <div>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">Print Payment Stand</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Design and print a table stand card with your VietQR payment code.
          </p>
        </div>
        <PaymentPrintSection
          paymentSettings={paymentSettings}
          businessName={business.name}
          businessLogoUrl={business.logo_url ?? null}
        />
      </div>

    </div>
  )
}
