'use client'

/**
 * VietQRSettings — form to configure bank account for VietQR display on live page.
 * Shows a live preview of the generated QR image (public VietQR API).
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Trash2 } from 'lucide-react'
import { upsertPaymentSettingsAction } from '@/app/actions/payments'
import { VIET_BANKS, buildVietQRUrl } from '@/lib/vietqr-utils'
import type { PaymentSettings, VietQRSettings } from '@/lib/vietqr-utils'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

const EMPTY: VietQRSettings = {
  bank_code: '',
  account_number: '',
  account_name: '',
  note_template: 'Thanh toán tại {business}',
}

export function VietQRSettings({
  businessId,
  initialSettings,
  businessName,
}: {
  businessId: string
  initialSettings: PaymentSettings
  businessName: string
}) {
  const [form, setForm] = useState<VietQRSettings>(
    initialSettings.vietqr ?? { ...EMPTY, note_template: `Thanh toán tại ${businessName}` }
  )
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)

  const isComplete = form.bank_code && form.account_number && form.account_name
  const previewUrl = isComplete ? buildVietQRUrl(form) : null

  function set<K extends keyof VietQRSettings>(key: K, value: VietQRSettings[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function save() {
    if (!isComplete) {
      toast.error('Please fill in all required fields.')
      return
    }
    setSaving(true)
    const result = await upsertPaymentSettingsAction(businessId, { vietqr: form })
    setSaving(false)
    if (result.error) { toast.error(result.error) }
    else { toast.success('Payment settings saved!') }
  }

  async function remove() {
    setRemoving(true)
    const result = await upsertPaymentSettingsAction(businessId, { vietqr: null })
    setRemoving(false)
    if (result.error) { toast.error(result.error) }
    else {
      setForm({ ...EMPTY, note_template: `Thanh toán tại ${businessName}` })
      toast.success('VietQR removed.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

      {/* Form */}
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">VietQR Configuration</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Customers will see this QR on your live page to pay via bank transfer.
          </p>
        </div>

        {/* Bank */}
        <div className="space-y-1.5">
          <Label>Bank <span className="text-red-500">*</span></Label>
          <Select value={form.bank_code} onValueChange={v => set('bank_code', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select your bank…" />
            </SelectTrigger>
            <SelectContent>
              {VIET_BANKS.map(b => (
                <SelectItem key={b.code} value={b.code}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Account number */}
        <div className="space-y-1.5">
          <Label>Account Number <span className="text-red-500">*</span></Label>
          <Input
            value={form.account_number}
            onChange={e => set('account_number', e.target.value.trim())}
            placeholder="0123456789"
            inputMode="numeric"
          />
        </div>

        {/* Account name */}
        <div className="space-y-1.5">
          <Label>Account Holder Name <span className="text-red-500">*</span></Label>
          <Input
            value={form.account_name}
            onChange={e => set('account_name', e.target.value.toUpperCase())}
            placeholder="NGUYEN VAN A"
          />
          <p className="text-[11px] text-gray-400">Enter the name exactly as it is on your bank account (all caps).</p>
        </div>

        {/* Transfer note */}
        <div className="space-y-1.5">
          <Label>Default Transfer Note</Label>
          <Input
            value={form.note_template}
            onChange={e => set('note_template', e.target.value)}
            placeholder={`Thanh toán tại ${businessName}`}
          />
          <p className="text-[11px] text-gray-400">Pre-filled note shown when customers scan. Optional.</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button onClick={save} disabled={saving || !isComplete} className="gap-2">
            <Save className="size-4" />
            {saving ? 'Saving…' : 'Save settings'}
          </Button>
          {initialSettings.vietqr && (
            <Button variant="outline" onClick={remove} disabled={removing} className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300">
              <Trash2 className="size-4" />
              Remove
            </Button>
          )}
        </div>
      </div>

      {/* Live QR preview */}
      <div className="flex flex-col items-center justify-start gap-4 pt-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 self-start">Live Preview</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center gap-4 w-64">
          <div className="size-48 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={previewUrl}
                src={previewUrl}
                alt="VietQR preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-4">
                <div className="size-16 rounded-xl bg-gray-100 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-2xl">🏦</span>
                </div>
                <p className="text-xs text-gray-400">Fill in the form to preview your QR</p>
              </div>
            )}
          </div>

          {isComplete && (
            <>
              <div className="text-center">
                <p className="font-semibold text-sm text-gray-900">{form.account_name}</p>
                <p className="text-xs text-gray-400">{VIET_BANKS.find(b => b.code === form.bank_code)?.name} · {form.account_number}</p>
              </div>
              <div className="w-full text-center py-2 rounded-lg bg-gray-50 text-xs text-gray-500 font-medium">
                Scan to pay
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
