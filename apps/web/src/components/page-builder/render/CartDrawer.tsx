'use client'

/**
 * CartDrawer — floating cart button + bottom-sheet order summary + checkout flow
 */

import { useState, useEffect, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import { ShoppingBag, Plus, Minus, Trash2, ChevronRight, UtensilsCrossed, Loader2, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useCart, type CartItem } from './CartContext'
import Image from 'next/image'
import { createOrderAction } from '@/app/actions/orders'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { buildVietQRUrl, VIET_BANKS } from '@/lib/vietqr-utils'
import { toast } from 'sonner'

// ─── Cart Item Row ─────────────────────────────────────────────────────────────

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCart()

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      {item.itemImage && (
        <div className="size-14 rounded-xl bg-gray-100 overflow-hidden shrink-0 relative">
          <Image src={item.itemImage} alt={item.itemName} fill className="object-cover" sizes="56px" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-900 leading-snug">{item.itemName}</p>
        {item.variants.length > 0 && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {item.variants.map(v => v.optionLabel).join(', ')}
          </p>
        )}
        <p className="text-sm font-bold text-gray-800 mt-1">{formatCurrency(item.totalPrice)}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <button onClick={() => removeItem(item.cartId)} className="text-gray-300 hover:text-red-400 transition-colors p-0.5" aria-label="Remove item">
          <Trash2 className="size-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => updateQuantity(item.cartId, -1)} className="size-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
            <Minus className="size-3" />
          </button>
          <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
          <button onClick={() => updateQuantity(item.cartId, +1)} className="size-7 rounded-full border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors">
            <Plus className="size-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main CartDrawer ──────────────────────────────────────────────────────────

interface CartDrawerProps {
  businessId?: string
  paymentSettings?: PaymentSettings
}

type DrawerStep = 'cart' | 'payment'

export function CartDrawer({ businessId, paymentSettings }: CartDrawerProps) {
  const { items, totalItems, totalPrice, clearCart } = useCart()
  const searchParams = useSearchParams()
  const tableFromUrl = searchParams.get('table') ?? ''

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<DrawerStep>('cart')
  const [tableNumber, setTableNumber] = useState(tableFromUrl)
  const [isPending, startTransition] = useTransition()
  const [pastOrders, setPastOrders] = useState<any[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined' && businessId) {
      try {
        const stored = localStorage.getItem(`eatery_orders_${businessId}`)
        if (stored) {
          const parsed = JSON.parse(stored)
          const recentOrders = parsed.filter((o: any) => Date.now() - o.timestamp < 12 * 60 * 60 * 1000)
          setPastOrders(recentOrders)
          if (recentOrders.length !== parsed.length) {
            localStorage.setItem(`eatery_orders_${businessId}`, JSON.stringify(recentOrders))
          }
        } else {
          // Legacy migration
          const legacy = localStorage.getItem(`eatery_last_order_${businessId}`)
          if (legacy) {
            const parsed = JSON.parse(legacy)
            if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
              setPastOrders([parsed])
              localStorage.setItem(`eatery_orders_${businessId}`, JSON.stringify([parsed]))
            }
            localStorage.removeItem(`eatery_last_order_${businessId}`)
          }
        }
      } catch (e) {}
    }
  }, [businessId])

  // Close drawer when cart empties IF we are still on cart step
  if (totalItems === 0 && open && step === 'cart') {
    setOpen(false)
  }

  // Hide entirely if empty cart and closed
  if (totalItems === 0 && !open && step === 'cart' && pastOrders.length === 0) return null

  async function handlePlaceOrder() {
    if (!businessId) {
      toast.error('Unable to place order: Business ID missing')
      return
    }
    if (!tableNumber.trim()) {
      toast.error('Please enter your table number')
      return
    }

    startTransition(async () => {
      const res = await createOrderAction(businessId, tableNumber, items, totalPrice)
      if (res.success) {
        const orderData = { id: res.orderId, items, total: totalPrice, timestamp: Date.now() }
        const updatedOrders = [orderData, ...pastOrders]
        setPastOrders(updatedOrders)
        if (typeof window !== 'undefined') {
          localStorage.setItem(`eatery_orders_${businessId}`, JSON.stringify(updatedOrders))
        }
        clearCart()
        setStep('payment')
      } else {
        toast.error('Failed to place order: ' + res.error)
      }
    })
  }

  function handleClose() {
    setOpen(false)
    if (step === 'payment') {
      setTimeout(() => setStep('cart'), 300) // reset step after animation
    }
  }

  const hasVietQR = paymentSettings?.vietqr && paymentSettings.vietqr.bank_code

  return (
    <>
      {/* ── Floating cart button ── */}
      {!open && step === 'cart' && totalItems > 0 && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-[100] flex items-center gap-2.5 bg-gray-900 text-white pl-4 pr-5 py-3.5 rounded-full shadow-2xl shadow-black/30 hover:bg-gray-800 active:scale-95 transition-all"
          aria-label="View order"
        >
          <div className="relative">
            <ShoppingBag className="size-5" />
            <span className="absolute -top-2 -right-2 size-4.5 min-w-[18px] px-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {totalItems}
            </span>
          </div>
          <div className="text-sm leading-tight text-left">
            <p className="font-semibold">View order</p>
            <p className="text-white/60 text-xs">{formatCurrency(totalPrice)}</p>
          </div>
        </button>
      )}

      {/* ── Floating Receipt button ── */}
      {!open && totalItems === 0 && pastOrders.length > 0 && (
        <button
          onClick={() => { setStep('payment'); setOpen(true); }}
          className="fixed bottom-6 right-4 z-[100] flex items-center gap-2.5 bg-white border border-gray-200 text-gray-900 px-5 py-3.5 rounded-full shadow-2xl shadow-black/10 hover:bg-gray-50 active:scale-95 transition-all"
        >
          <div className="relative">
            <CheckCircle2 className="size-5 text-green-500" />
          </div>
          <div className="text-sm leading-tight text-left">
            <p className="font-semibold">My Order</p>
            <p className="text-gray-500 text-xs">View placed order</p>
          </div>
        </button>
      )}

      {/* ── Backdrop ── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        />
      )}

      {/* ── Right side drawer ── */}
      <div
        className={`fixed top-0 bottom-0 right-0 z-[110] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col w-full sm:w-[400px] max-w-[100vw] ${
          open ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            {step === 'cart' ? <UtensilsCrossed className="size-4 text-gray-400" /> : <CheckCircle2 className="size-5 text-green-500" />}
            <h2 className="font-bold text-gray-900 text-base">
              {step === 'cart' ? 'Your Order' : 'Order Sent to Kitchen!'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* ── STEP: CART ── */}
        {step === 'cart' && (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {items.map(item => (
                <CartItemRow key={item.cartId} item={item} />
              ))}
            </div>

            <div className="px-5 pb-8 pt-4 space-y-4 shrink-0 border-t border-gray-100 bg-white">
              {/* Table Number Input */}
              {paymentSettings?.kds_enabled !== false && (
                tableFromUrl ? (
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table Number</span>
                    <span className="text-sm font-bold text-gray-900 px-3 py-1 bg-gray-100 rounded-lg">{tableFromUrl}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">Table Number</label>
                    <input 
                      type="text" 
                      value={tableNumber} 
                      onChange={e => setTableNumber(e.target.value)}
                      placeholder="e.g. 12"
                      className="h-10 px-3 rounded-lg border border-gray-200 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 text-sm font-medium"
                    />
                  </div>
                )
              )}

              {/* Total */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-gray-500 text-sm">Total</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(totalPrice)}</span>
              </div>

              {/* Place Order button */}
              {paymentSettings?.kds_enabled === false ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center mt-2">
                  <p className="text-sm text-orange-800 font-medium">Please call for a waiter to place your order.</p>
                </div>
              ) : (
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPending || items.length === 0}
                  className="w-full py-4 rounded-2xl bg-gray-900 text-white font-bold text-base flex items-center justify-center gap-2.5 hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg shadow-gray-900/20 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isPending ? <Loader2 className="size-5 animate-spin" /> : 'Place Order'}
                </button>
              )}
            </div>
          </>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === 'payment' && (
          <div className="flex-1 overflow-y-auto px-5 py-8 space-y-8 bg-gray-50/50">
            {pastOrders.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex justify-between items-end mb-4">
                  <h4 className="font-bold text-gray-900 text-sm">Your Order History</h4>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{pastOrders.length} order{pastOrders.length > 1 ? 's' : ''}</span>
                </div>
                
                <div className="space-y-4 mb-4">
                  {pastOrders.map((order: any, idx: number) => (
                    <div key={order.id} className="relative">
                      {idx > 0 && <div className="absolute top-[-8px] left-0 right-0 border-t border-gray-100 border-dashed" />}
                      <div className="space-y-2 pt-1">
                        {order.items.map((item: any) => (
                          <div key={item.cartId} className="flex justify-between text-sm">
                            <div className="flex gap-2">
                              <span className="font-bold text-gray-900">{item.quantity}×</span>
                              <div>
                                <p className="font-medium text-gray-800">{item.itemName}</p>
                                {item.variants && item.variants.length > 0 && (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {item.variants.map((v: any) => v.optionLabel).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className="font-medium text-gray-900">{formatCurrency(item.totalPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-900">Grand Total</span>
                  <span className="font-bold text-xl text-gray-900">
                    {formatCurrency(pastOrders.reduce((acc, o) => acc + o.total, 0))}
                  </span>
                </div>
              </div>
            )}

            {hasVietQR ? (() => {
              const vietqr = paymentSettings.vietqr!
              const vietqrImageUrl = buildVietQRUrl(vietqr)
              const bankName = VIET_BANKS.find(b => b.code === vietqr.bank_code)?.name ?? vietqr.bank_code

              return (
                <div className="border border-gray-100 rounded-3xl p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-white to-gray-50 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-50 rounded-full blur-3xl opacity-50 -ml-10 -mb-10 pointer-events-none" />

                  <div className="relative z-10 w-full flex flex-col items-center gap-4 text-center mb-2">
                    <h3 className="font-bold text-gray-900 text-lg">Pay with your Banking App</h3>
                    <p className="text-sm text-gray-500">Scan the QR code below to complete your payment. Please show the payment confirmation to our staff if requested.</p>
                  </div>

                  <div className="relative z-10 w-full flex flex-col items-center gap-6">
                    <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={vietqrImageUrl} alt="VietQR payment code" className="w-[220px] h-[220px] object-contain" />
                    </div>

                    <div className="text-center space-y-1.5 w-full bg-white/60 backdrop-blur-sm rounded-xl py-4 px-6 border border-gray-100/50">
                      <p className="font-bold text-gray-900 text-lg leading-tight">{vietqr.account_name}</p>
                      <p className="text-sm text-gray-600 font-medium">{bankName}</p>
                      <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-gray-100/80 rounded-lg">
                        <span className="text-xs text-gray-500 font-semibold uppercase">A/C No.</span>
                        <p className="text-sm text-gray-900 font-bold tracking-wide">{vietqr.account_number}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })() : (
              <div className="text-center py-12 px-4 space-y-4">
                <div className="size-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="size-8 text-green-500" />
                </div>
                <h3 className="font-bold text-xl text-gray-900">Order Received!</h3>
                <p className="text-gray-500">Your order has been sent to the kitchen. Please pay at the counter or wait for staff to assist you.</p>
              </div>
            )}

            <div className="text-center px-4">
              <p className="text-xs text-gray-400">Need to modify or cancel your order?<br/>Please notify a staff member directly.</p>
              <button onClick={handleClose} className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold rounded-full transition-colors text-sm">
                Close & Return to Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
