'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Coins, Loader2, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { useTranslation } from '@/i18n/I18nProvider'
import { verifyDiscountCodeAction, purchaseCreditsAction } from '@/app/actions/credits'
import { toast } from 'sonner'

interface PurchaseCreditsModalProps {
  businessId: string
  isOpen: boolean
  onClose: () => void
  amount: number
  priceVnd: number
  onSuccess: () => void
}

export function PurchaseCreditsModal({
  businessId,
  isOpen,
  onClose,
  amount,
  priceVnd,
  onSuccess
}: PurchaseCreditsModalProps) {
  const { t } = useTranslation()
  const [discountCode, setDiscountCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isDiscountApplied, setIsDiscountApplied] = useState(false)

  const finalPrice = Math.max(0, priceVnd - discountAmount)

  async function handleApplyDiscount() {
    if (!discountCode.trim()) return

    setVerifying(true)
    const res = await verifyDiscountCodeAction(discountCode.trim(), priceVnd)
    setVerifying(false)

    if (res.success) {
      setDiscountAmount(res.discountAmount || 0)
      setIsDiscountApplied(true)
      toast.success(t('credits.discountApplied') || 'Mã giảm giá đã được áp dụng!')
    } else {
      toast.error(res.error)
      setDiscountAmount(0)
      setIsDiscountApplied(false)
    }
  }

  function handleRemoveDiscount() {
    setDiscountCode('')
    setDiscountAmount(0)
    setIsDiscountApplied(false)
  }

  async function handleConfirmPurchase() {
    setPurchasing(true)
    const res = await purchaseCreditsAction(
      businessId, 
      amount, 
      priceVnd, 
      isDiscountApplied ? discountCode.trim() : undefined
    )
    
    if (res.success) {
      if (res.instantSuccess) {
        toast.success(t('credits.purchaseSuccess') || 'Thanh toán thành công!')
        onSuccess()
        onClose()
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      }
    } else {
      toast.error(res.error || 'Failed to initialize checkout')
      setPurchasing(false)
    }
  }

  // Reset state when closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDiscountCode('')
      setDiscountAmount(0)
      setIsDiscountApplied(false)
      setPurchasing(false)
      setVerifying(false)
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('credits.confirmPurchase') || 'Xác nhận mua'}</DialogTitle>
          <DialogDescription>
            {t('credits.confirmDetails') || 'Chi tiết gói Credits bạn đang chọn mua.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Coins className="size-5 text-yellow-500" />
              <span className="font-semibold text-lg">{amount} Credits</span>
            </div>
            <div className="text-right">
              <div className={isDiscountApplied ? "text-muted-foreground line-through text-sm" : "font-bold text-lg"}>
                {formatCurrency(priceVnd)}
              </div>
              {isDiscountApplied && (
                <div className="font-bold text-lg text-primary">
                  {formatCurrency(finalPrice)}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              {t('credits.discountCode') || 'Mã giảm giá (tùy chọn)'}
            </label>
            <div className="flex gap-2">
              <Input 
                placeholder="Ví dụ: EATERY2026"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                disabled={isDiscountApplied || verifying || purchasing}
                className="uppercase"
              />
              {isDiscountApplied ? (
                <Button variant="outline" onClick={handleRemoveDiscount} disabled={purchasing}>
                  Huỷ
                </Button>
              ) : (
                <Button 
                  variant="secondary" 
                  onClick={handleApplyDiscount} 
                  disabled={!discountCode.trim() || verifying || purchasing}
                >
                  {verifying ? <Loader2 className="size-4 animate-spin" /> : 'Áp dụng'}
                </Button>
              )}
            </div>
            {isDiscountApplied && discountAmount > 0 && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 mt-2">
                <Tag className="size-4" /> Đã giảm {formatCurrency(discountAmount)}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={purchasing}>
            Huỷ bỏ
          </Button>
          <Button onClick={handleConfirmPurchase} disabled={purchasing}>
            {purchasing && <Loader2 className="mr-2 size-4 animate-spin" />}
            {finalPrice === 0 ? 'Nhận Credits miễn phí' : 'Thanh toán ngay'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
