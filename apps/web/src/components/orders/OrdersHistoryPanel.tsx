'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchOrderHistoryAction,
  fetchOrderLogsAction,
  exportOrderHistoryCsvAction,
} from '@/app/actions/order-dashboard'
import { getOrderRetentionCutoff } from '@/lib/order-retention'
import { formatCurrency } from '@/lib/currency'
import { useTranslation } from '@/i18n/I18nProvider'
import { toast } from 'sonner'
import { Download, RefreshCcw } from 'lucide-react'

type HistoryOrderItem = {
  id: string
  item_name: string
  quantity: number
  unit_price?: number
  options?: unknown
}

type HistoryOrder = {
  id: string
  created_at: string
  status: string
  payment_status?: string
  table_number: string | null
  total_amount: number
  order_items?: HistoryOrderItem[]
}

type HistoryLog = {
  id: string
  created_at: string
  action: string
  actor_name: string | null
  actor_role: string | null
  reason: string | null
  order_id: string | null
}

function toDateInputValue(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function startOfLocalDayIso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

function endOfLocalDayIso(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

function localDateKey(iso: string): string {
  const d = new Date(iso)
  return toDateInputValue(d)
}

function formatLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLocalDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function defaultDateRange() {
  const cutoff = getOrderRetentionCutoff()
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6)
  from.setHours(0, 0, 0, 0)
  const clampedFrom = from < cutoff ? cutoff : from
  return {
    from: toDateInputValue(clampedFrom),
    to: toDateInputValue(to),
    min: toDateInputValue(cutoff),
  }
}

interface OrdersHistoryPanelProps {
  businessId: string
}

export function OrdersHistoryPanel({ businessId }: OrdersHistoryPanelProps) {
  const { t } = useTranslation()
  const defaults = useMemo(() => defaultDateRange(), [])
  const [tab, setTab] = useState<'orders' | 'logs'>('orders')
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [orders, setOrders] = useState<HistoryOrder[]>([])
  const [logs, setLogs] = useState<HistoryLog[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const range = { from: startOfLocalDayIso(from), to: endOfLocalDayIso(to) }
      if (tab === 'orders') {
        const res = await fetchOrderHistoryAction(businessId, range)
        if (!res.success) {
          toast.error(res.error)
          setOrders([])
          return
        }
        setOrders((res.data.orders as HistoryOrder[]) ?? [])
      } else {
        const res = await fetchOrderLogsAction(businessId, range)
        if (!res.success) {
          toast.error(res.error)
          setLogs([])
          return
        }
        setLogs((res.data.events as HistoryLog[]) ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [businessId, from, tab, to])

  useEffect(() => {
    void load()
  }, [load])

  const groupedOrders = useMemo(() => {
    const map = new Map<string, HistoryOrder[]>()
    for (const order of orders) {
      const key = localDateKey(order.created_at)
      const list = map.get(key) ?? []
      list.push(order)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [orders])

  async function handleExport() {
    setExporting(true)
    try {
      const res = await exportOrderHistoryCsvAction(businessId, {
        from: startOfLocalDayIso(from),
        to: endOfLocalDayIso(to),
        mode: tab,
      })
      if (!res.success) {
        toast.error(res.error)
        return
      }
      downloadCsv(res.data.csv, res.data.filename)
    } finally {
      setExporting(false)
    }
  }

  const empty = tab === 'orders' ? orders.length === 0 : logs.length === 0

  return (
    <div className="flex flex-col gap-4 flex-1 min-h-0">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
        <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
          <button
            type="button"
            onClick={() => setTab('orders')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              tab === 'orders' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('orders.historyOrders')}
          </button>
          <button
            type="button"
            onClick={() => setTab('logs')}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
              tab === 'logs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('orders.historyLogs')}
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-2 flex-1">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            {t('orders.dateFrom')}
            <input
              type="date"
              min={defaults.min}
              max={to}
              value={from}
              onChange={(e) => setFrom(e.target.value < defaults.min ? defaults.min : e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-500">
            {t('orders.dateTo')}
            <input
              type="date"
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm font-medium text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </label>
          <button
            type="button"
            onClick={() => void load()}
            className="h-10 px-4 rounded-lg bg-gray-900 text-white text-sm font-bold hover:bg-gray-800"
          >
            {t('orders.applyFilter')}
          </button>
          <button
            type="button"
            disabled={exporting}
            onClick={() => void handleExport()}
            className="h-10 px-4 rounded-lg bg-white border border-gray-200 text-gray-800 text-sm font-bold hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Download className="size-4" />
            {tab === 'orders' ? t('orders.exportOrders') : t('orders.exportLogs')}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {loading ? (
          <div className="py-16 flex items-center justify-center text-gray-400">
            <RefreshCcw className="size-6 animate-spin" />
          </div>
        ) : empty ? (
          <div className="py-16 text-center text-sm text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            {t('orders.noHistory')}
          </div>
        ) : tab === 'orders' ? (
          <div className="space-y-6">
            {groupedOrders.map(([dateKey, dayOrders]) => (
              <section key={dateKey} className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900 px-1">{formatLocalDateLabel(dateKey)}</h3>
                <div className="space-y-2">
                  {dayOrders.map((order) => {
                    const itemsSummary =
                      order.order_items
                        ?.map((i) => `${i.quantity}× ${i.item_name}`)
                        .join(', ') || '—'
                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3"
                      >
                        <div className="sm:w-20 shrink-0 text-sm font-semibold text-gray-500">
                          {formatLocalTime(order.created_at)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-gray-900">
                              {order.table_number
                                ? `${t('orders.table')} ${order.table_number}`
                                : t('orders.takeaway')}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                              {order.status}
                            </span>
                            <span className="text-sm font-bold text-gray-900 ml-auto">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{itemsSummary}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => (
              <div
                key={log.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                  <span className="text-xs font-medium text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-900 text-white">
                    {log.action}
                  </span>
                  {log.order_id && (
                    <span className="text-xs text-gray-400 font-mono">
                      #{log.order_id.slice(0, 8)}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-700">
                  <span>
                    <span className="text-gray-400 text-xs font-semibold uppercase mr-1">
                      {t('orders.actor')}
                    </span>
                    {log.actor_name || '—'}
                    {log.actor_role ? ` (${log.actor_role})` : ''}
                  </span>
                  {log.reason && (
                    <span>
                      <span className="text-gray-400 text-xs font-semibold uppercase mr-1">
                        {t('orders.reason')}
                      </span>
                      {log.reason}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
