'use client'

import { useState } from 'react'
import { ChevronLeft, CreditCard } from 'lucide-react'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { buildVietQRUrl, VIET_BANKS } from '@/lib/vietqr-utils'

interface PaymentDrawerProps {
  paymentSettings?: PaymentSettings
  contained?: boolean
}

export function PaymentDrawer({ paymentSettings, contained }: PaymentDrawerProps) {
  const [open, setOpen] = useState(false)

  if (!paymentSettings || !paymentSettings.vietqr) return null

  const vietqr = paymentSettings.vietqr
  const vietqrImageUrl = buildVietQRUrl(vietqr)
  const bankName = VIET_BANKS.find(b => b.code === vietqr.bank_code)?.name ?? vietqr.bank_code
  const position = contained ? 'absolute' : 'fixed'

  const ui = (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={`${position} bottom-6 left-4 z-[100] flex items-center gap-2 bg-white text-gray-900 pl-4 pr-5 py-3.5 rounded-full shadow-2xl shadow-black/20 hover:bg-gray-50 active:scale-95 transition-all border border-gray-100 ${contained ? 'pointer-events-auto' : ''}`}
          aria-label="Thanh toán"
        >
          <CreditCard className="size-5 text-gray-700" />
          <div className="text-sm leading-tight text-left">
            <p className="font-semibold">Thanh toán</p>
          </div>
        </button>
      )}

      {open && (
        <div
          className={`${position} inset-0 z-[100] bg-black/40 backdrop-blur-sm ${contained ? 'pointer-events-auto' : ''}`}
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`${position} top-0 bottom-0 left-0 z-[110] bg-white shadow-2xl transition-transform duration-300 ease-out flex flex-col w-full sm:w-[400px] max-w-[100vw] ${contained ? 'pointer-events-auto' : ''} ${
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <button
            onClick={() => setOpen(false)}
            className="size-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-gray-900 text-base">Phương thức thanh toán</h2>
          </div>
          <div className="size-8" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-8 space-y-8">
          <div>
            <h3 className="font-bold text-gray-900 mb-2">Thanh toán an toàn</h3>
            <p className="text-sm text-gray-500">
              Quét mã QR bằng ứng dụng ngân hàng để chuyển khoản. Vui lòng xuất trình xác nhận thanh toán cho nhân viên.
            </p>
          </div>

          <div className="border border-gray-100 rounded-3xl p-8 flex flex-col items-center gap-6 bg-gradient-to-b from-white to-gray-50 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-50 -mr-10 -mt-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl opacity-50 -ml-10 -mb-10 pointer-events-none" />

            <div className="relative z-10 w-full flex flex-col items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="font-bold text-gray-900 uppercase tracking-widest text-xs">Chuyển khoản VietQR</div>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-md border border-gray-100 transition-transform hover:scale-105 duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={vietqrImageUrl}
                  alt="Mã thanh toán VietQR"
                  className="w-[220px] h-[220px] object-contain"
                />
              </div>

              <div className="text-center space-y-1.5 w-full bg-white/60 backdrop-blur-sm rounded-xl py-4 px-6 border border-gray-100/50">
                <p className="font-bold text-gray-900 text-lg leading-tight">{vietqr.account_name}</p>
                <p className="text-sm text-gray-600 font-medium">{bankName}</p>
                <div className="inline-flex items-center gap-2 mt-1 px-3 py-1 bg-gray-100/80 rounded-lg">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Số TK</span>
                  <p className="text-sm text-gray-900 font-bold tracking-wide">{vietqr.account_number}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )

  if (contained) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[90]">
        {ui}
      </div>
    )
  }

  return ui
}
