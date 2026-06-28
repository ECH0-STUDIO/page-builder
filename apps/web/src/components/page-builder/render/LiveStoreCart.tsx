'use client'

import { Suspense } from 'react'
import { CartDrawer } from './CartDrawer'
import { PaymentDrawer } from './PaymentDrawer'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import type { SupportedLocale } from '@/i18n/locale'

interface LiveStoreCartProps {
  businessId: string
  paymentSettings: PaymentSettings
  previewMode?: boolean
  /** Pin cart UI inside the page-builder canvas frame */
  contained?: boolean
  locale?: string
}

function LiveStoreCartInner(props: LiveStoreCartProps) {
  return (
    <>
      <CartDrawer {...props} />
      <PaymentDrawer paymentSettings={props.paymentSettings} contained={props.contained} locale={props.locale} />
    </>
  )
}

export function LiveStoreCart(props: LiveStoreCartProps) {
  return (
    <Suspense fallback={null}>
      <LiveStoreCartInner {...props} />
    </Suspense>
  )
}
