/**
 * vietqr-utils.ts — pure URL helpers for VietQR.
 * No 'use server' directive — safe to import from both server and client code.
 */

export const VIET_BANKS = [
  { code: 'VCB',  name: 'Vietcombank' },
  { code: 'TCB',  name: 'Techcombank' },
  { code: 'MBB',  name: 'MB Bank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'VPB',  name: 'VPBank' },
  { code: 'ACB',  name: 'ACB' },
  { code: 'STB',  name: 'Sacombank' },
  { code: 'TPB',  name: 'TPBank' },
  { code: 'AGR',  name: 'Agribank' },
  { code: 'OCB',  name: 'OCB' },
  { code: 'SHB',  name: 'SHB' },
  { code: 'HDB',  name: 'HDBank' },
  { code: 'NAB',  name: 'Nam A Bank' },
  { code: 'MSB',  name: 'MSB' },
  { code: 'SCB',  name: 'SCB' },
  { code: 'VIB',  name: 'VIB' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'BAB',  name: 'Bac A Bank' },
  { code: 'LPB',  name: 'LienVietPostBank' },
  { code: 'KLB',  name: 'Kien Long Bank' },
] as const

export interface VietQRSettings {
  bank_code: string
  account_number: string
  account_name: string
  note_template: string
}

export interface PaymentSettings {
  vietqr?: VietQRSettings | null
  kds_enabled?: boolean
}

/** Build a VietQR image URL using the free public VietQR API. */
export function buildVietQRUrl(settings: VietQRSettings): string {
  const { bank_code, account_number, account_name } = settings
  const encodedName = encodeURIComponent(account_name)
  return `https://img.vietqr.io/image/${bank_code}-${account_number}-napas247.png?accountName=${encodedName}`
}
