'use client'

import { useState, useEffect } from 'react'
import { Coins, Plus, Loader2, ArrowUpRight, ArrowDownRight, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'
import { formatCurrency } from '@/lib/currency'
import {
  getCreditBalanceAction,
  getCreditTransactionsAction,
} from '@/app/actions/credits'
import { PurchaseCreditsModal } from './PurchaseCreditsModal'

interface Transaction {
  id: string
  amount: number
  description: string
  created_at: string
}

export function CreditDashboard({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<{amount: number, price: number} | null>(null)
  
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const status = searchParams.get('status')
    if (status === 'success') {
      toast.success(t('credits.purchaseSuccess'))
      router.replace('/dashboard/settings/credits')
    } else if (status === 'cancel') {
      toast.error(t('credits.paymentCancelled'))
      router.replace('/dashboard/settings/credits')
    }
  }, [searchParams, router])

  async function loadData() {
    setLoading(true)
    const [balRes, txRes] = await Promise.all([
      getCreditBalanceAction(businessId),
      getCreditTransactionsAction(businessId)
    ])

    if (balRes.success) setBalance(balRes.data)
    if (txRes.success && txRes.data) setTransactions(txRes.data as Transaction[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [businessId])

  function handleSelectPackage(amount: number, priceVnd: number) {
    setSelectedPackage({ amount, price: priceVnd })
    setModalOpen(true)
  }

  function handlePurchaseSuccess() {
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/80 font-medium tracking-wide uppercase text-xs">
              {t('credits.availableCredits')}
            </CardDescription>
            <CardTitle className="text-5xl font-bold flex items-center gap-3">
              <Coins className="size-8 opacity-80" />
              {balance ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary-foreground/70">
              {t('credits.usedForPremium')}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('credits.buyCredits')}</CardTitle>
            <CardDescription>
              {t('credits.purchaseMore')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 border-border/60 hover:border-primary/50"
              onClick={() => handleSelectPackage(50, 50000)}
            >
              <div className="flex items-center gap-1 font-bold text-xl">
                <Coins className="size-5 text-yellow-500" /> 50
              </div>
              <div className="text-sm text-muted-foreground">{formatCurrency(50000)}</div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 border-border/60 hover:border-primary/50 relative overflow-hidden"
              onClick={() => handleSelectPackage(100, 90000)}
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-yellow-400 to-orange-500" />
              <div className="flex items-center gap-1 font-bold text-xl">
                <Coins className="size-5 text-yellow-500" /> 100
              </div>
              <div className="text-sm text-muted-foreground">{formatCurrency(90000)}</div>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 px-6 flex flex-col items-center gap-2 border-border/60 hover:border-primary/50"
              onClick={() => handleSelectPackage(500, 400000)}
            >
              <div className="flex items-center gap-1 font-bold text-xl">
                <Coins className="size-5 text-yellow-500" /> 500
              </div>
              <div className="text-sm text-muted-foreground">{formatCurrency(400000)}</div>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="size-5" /> {t('credits.transactionHistory')}
            </CardTitle>
            <CardDescription>{t('credits.recentUsage')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p>{t('credits.noTransactions')}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 font-bold ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {tx.amount > 0 ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    {Math.abs(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedPackage && (
        <PurchaseCreditsModal 
          businessId={businessId}
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          amount={selectedPackage.amount}
          priceVnd={selectedPackage.price}
          onSuccess={handlePurchaseSuccess}
        />
      )}
    </div>
  )
}
