'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createDiscountCodeAction, listDiscountCodesAction } from '@/app/actions/credits'

interface DiscountCode {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  max_uses: number | null
  used_count: number
  is_active: boolean
  created_at: string
}

export function DiscountCodesAdmin() {
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [discountValue, setDiscountValue] = useState('100')
  const [maxUses, setMaxUses] = useState('10')
  const [creating, setCreating] = useState(false)

  async function loadCodes() {
    setLoading(true)
    const res = await listDiscountCodesAction()
    if (res.success && res.data) {
      setCodes(res.data as DiscountCode[])
    } else if (res.error) {
      toast.error(res.error)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCodes()
  }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    const res = await createDiscountCodeAction({
      code,
      discountType,
      discountValue: Number(discountValue),
      maxUses: maxUses ? Number(maxUses) : null,
    })
    setCreating(false)

    if (res.success) {
      toast.success(`Đã tạo mã ${code.toUpperCase()}`)
      setCode('')
      loadCodes()
    } else {
      toast.error(res.error || 'Không thể tạo mã')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tạo mã giảm giá</CardTitle>
          <CardDescription>
            Dùng mã 100% để mua Credits miễn phí (thanh toán 0đ). Mã được lưu trong Supabase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Mã</Label>
              <Input id="code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="FREECREDITS" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Loại giảm giá</Label>
              <select
                id="type"
                value={discountType}
                onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VND)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="value">{discountType === 'percent' ? 'Giá trị (%)' : 'Giá trị (VND)'}</Label>
              <Input id="value" type="number" min="1" value={discountValue} onChange={e => setDiscountValue(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUses">Số lượt dùng tối đa</Label>
              <Input id="maxUses" type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={creating}>{creating ? 'Đang tạo...' : 'Tạo mã'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mã đã tạo</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có mã nào.</p>
          ) : (
            <div className="divide-y">
              {codes.map(item => (
                <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono font-semibold">{item.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.discount_type === 'percent' ? `${item.discount_value}%` : `${item.discount_value} VND`}
                      {' · '}
                      {item.used_count}/{item.max_uses ?? '∞'} lượt
                      {!item.is_active ? ' · Tắt' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
