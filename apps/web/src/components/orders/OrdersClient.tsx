'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useOrders } from '@/lib/react-query/hooks/useOrders'
import { useServiceRequests } from '@/lib/react-query/hooks/useServiceRequests'
import { updateServiceRequestStatusAction, type ServiceRequest } from '@/app/actions/service-requests'
import {
  updateOrderStatusAction,
  saveOrderEditAction,
} from '@/app/actions/order-dashboard'
import { RemoveOrderDialog } from '@/components/orders/RemoveOrderDialog'
import { OrdersHistoryPanel } from '@/components/orders/OrdersHistoryPanel'
import {
  daysLeftInCurrentMonth,
  getNextPurgedMonthLabel,
  shouldShowRetentionReminder,
} from '@/lib/order-retention'
import { Bell, CheckCircle2, Clock, Receipt, XCircle, Table2, RefreshCcw, DollarSign, BellRing, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'

export type OrderStatus = 'pending' | 'completed' | 'paid' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid'

export type OrderItem = {
  id: string
  order_id: string
  item_name: string
  quantity: number
  unit_price: number
  options: any | null
}

export type Order = {
  id: string
  business_id: string
  table_number: string | null
  customer_name: string | null
  total_amount: number
  status: OrderStatus
  payment_status: PaymentStatus
  created_at: string
  order_items: OrderItem[]
}

interface OrdersClientProps {
  businessId: string
  role: string
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function clientLocale(): 'en' | 'vi' {
  if (typeof document === 'undefined') return 'vi'
  const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/)
  return match?.[1] === 'en' ? 'en' : 'vi'
}

type LiveDayFilter = 'today' | 'yesterday' | 'dayBefore'

function startOfLocalDay(offsetDays: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + offsetDays)
  return d
}

function isSameLocalDay(dateString: string, day: Date): boolean {
  const d = new Date(dateString)
  return (
    d.getFullYear() === day.getFullYear()
    && d.getMonth() === day.getMonth()
    && d.getDate() === day.getDate()
  )
}

export function OrdersClient({ businessId, role }: OrdersClientProps) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const canViewHistory = role === 'owner' || role === 'manager'
  const [boardMode, setBoardMode] = useState<'today' | 'history'>('today')
  const [dayFilter, setDayFilter] = useState<LiveDayFilter>('today')
  const [liveSearch, setLiveSearch] = useState('')

  function formatTimeAgo(dateString: string) {
    const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000)
    if (diff < 1) return t('orders.timeAgo.justNow')
    if (diff < 60) return t('orders.timeAgo.minsAgo').replace('{{m}}', diff.toString())
    const h = Math.floor(diff / 60)
    return t('orders.timeAgo.hoursMinsAgo').replace('{{h}}', h.toString()).replace('{{m}}', (diff % 60).toString())
  }

  const { data: orders = [], isLoading: loading, refetch: fetchOrders } = useOrders(businessId)
  const {
    data: serviceRequests = [],
    refetch: fetchServiceRequests,
  } = useServiceRequests(businessId)

  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [removingOrderId, setRemovingOrderId] = useState<string | null>(null)
  const [removeBusy, setRemoveBusy] = useState(false)
  const supabase = useMemo(() => createClient(), [])

  const setOrders = useCallback((updater: (prev: Order[]) => Order[]) => {
    queryClient.setQueryData(['orders', businessId], (old: Order[] = []) => updater(old))
  }, [businessId, queryClient])

  const setServiceRequests = useCallback((updater: (prev: ServiceRequest[]) => ServiceRequest[]) => {
    queryClient.setQueryData(['serviceRequests', businessId], (old: ServiceRequest[] = []) => updater(old))
  }, [businessId, queryClient])

  useEffect(() => {
    if (boardMode !== 'today') return

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success(t('orders.newOrderReceived'), { duration: 5000, icon: '🔔' })
            try {
              const audio = new Audio('/bell.mp3')
              audio.play().catch(() => {})
            } catch {
              /* ignore */
            }
            fetchOrders()
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests', filter: `business_id=eq.${businessId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            toast.success(t('orders.newServiceRequest'), { duration: 5000, icon: '🛎️' })
            try {
              const audio = new Audio('/bell.mp3')
              audio.play().catch(() => {})
            } catch {
              /* ignore */
            }
            fetchServiceRequests()
          } else if (payload.eventType === 'UPDATE') {
            setServiceRequests(prev =>
              prev.map(r => r.id === payload.new.id ? { ...r, ...(payload.new as ServiceRequest) } : r),
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [boardMode, businessId, fetchOrders, fetchServiceRequests, setOrders, setServiceRequests, supabase, t])

  const openRequests = serviceRequests.filter(r => r.status === 'open')

  async function resolveRequest(id: string, status: 'acknowledged' | 'dismissed') {
    setServiceRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    const res = await updateServiceRequestStatusAction(id, status)
    if (!res.success) {
      toast.error(t('orders.failedUpdateRequest'))
      fetchServiceRequests()
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus, ...(newStatus === 'paid' ? { payment_status: 'paid' as const } : {}) } : o))

    const res = await updateOrderStatusAction(businessId, orderId, newStatus)
    if (!res.success) {
      toast.error(res.error || t('orders.failedUpdateStatus'))
      fetchOrders()
      return
    }

    if (newStatus === 'cancelled') {
      toast(t('orders.orderRemoved'), { duration: 4000 })
    }
  }

  const confirmRemoveOrder = async (payload: { reason: string }) => {
    if (!removingOrderId) return
    const orderId = removingOrderId
    setRemoveBusy(true)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
    setRemovingOrderId(null)

    const res = await updateOrderStatusAction(businessId, orderId, 'cancelled', {
      reason: payload.reason,
    })
    setRemoveBusy(false)

    if (!res.success) {
      toast.error(res.error || t('orders.failedUpdateStatus'))
      fetchOrders()
      return
    }
    toast(t('orders.orderRemoved'), { duration: 4000 })
  }

  // Force re-render every minute to update "time ago"
  const [, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(i)
  }, [])

  const saveOrderEdit = async (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    setEditingOrder(null)

    const res = await saveOrderEditAction(businessId, {
      id: updatedOrder.id,
      table_number: updatedOrder.table_number,
      total_amount: updatedOrder.total_amount,
      order_items: updatedOrder.order_items.map(i => ({
        id: i.id,
        quantity: i.quantity,
        item_name: i.item_name,
        unit_price: i.unit_price,
      })),
    })

    if (!res.success) {
      toast.error(res.error || t('orders.failedUpdateDetails'))
      fetchOrders()
      return
    }

    toast.success(t('orders.orderUpdated'))
    fetchOrders()
  }

  async function enableNotifications() {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      toast.error(t('orders.notificationsUnsupported'))
      return
    }

    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        toast.error(t('orders.notificationsDenied'))
        return
      }

      const registration = await navigator.serviceWorker.register('/sw-push.js')
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidKey) {
        toast.error(t('orders.notificationsNotConfigured'))
        return
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId, subscription: subscription.toJSON() }),
      })
      if (!res.ok) {
        throw new Error('subscribe failed')
      }

      toast.success(t('orders.notificationsEnabled'))
    } catch {
      toast.error(t('orders.notificationsSetupFailed'))
    }
  }

  const activeOrders = orders.filter(o => ['pending', 'completed', 'paid'].includes(o.status))

  const dayAnchor =
    dayFilter === 'today'
      ? startOfLocalDay(0)
      : dayFilter === 'yesterday'
        ? startOfLocalDay(-1)
        : startOfLocalDay(-2)

  const dayOrders = activeOrders.filter(o => isSameLocalDay(o.created_at, dayAnchor))

  const searchQ = liveSearch.trim().toLowerCase()
  const searchedOrders = !searchQ
    ? dayOrders
    : dayOrders.filter(o => {
        if (o.id.toLowerCase().includes(searchQ)) return true
        if (o.id.toLowerCase().startsWith(searchQ.replace(/^#/, ''))) return true
        if ((o.table_number || '').toLowerCase().includes(searchQ)) return true
        if ((o.customer_name || '').toLowerCase().includes(searchQ)) return true
        return (o.order_items || []).some(item =>
          (item.item_name || '').toLowerCase().includes(searchQ),
        )
      })

  const pending = searchedOrders.filter(o => o.status === 'pending')
  const completed = searchedOrders.filter(o => o.status === 'completed')
  const paid = searchedOrders.filter(o => o.status === 'paid')

  const dayOrdersLabel =
    dayFilter === 'today'
      ? t('orders.todayOrders')
      : dayFilter === 'yesterday'
        ? t('orders.yesterdayOrders')
        : t('orders.dayBeforeOrders')

  const showRetention =
    canViewHistory && shouldShowRetentionReminder()

  const retentionMsg = showRetention
    ? t('orders.retentionReminder')
        .replace('{{days}}', String(daysLeftInCurrentMonth()))
        .replace('{{month}}', getNextPurgedMonthLabel(new Date(), clientLocale()))
    : ''

  const renderColumn = (title: string, icon: React.ReactNode, list: Order[], statusColor: string) => (
    <div className="flex flex-col flex-1 min-w-[320px] bg-gray-50/50 rounded-2xl p-4 border border-gray-100/80">
      <div className="flex items-center gap-2 mb-4 px-2">
        <div className={`p-1.5 rounded-lg ${statusColor}`}>{icon}</div>
        <h2 className="font-bold text-gray-900 text-lg">{title}</h2>
        <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
          {list.length}
        </span>
      </div>

      <div className="flex flex-col gap-3 overflow-y-auto">
        {list.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-xl">
            {t('orders.noOrders')}
          </div>
        ) : (
          list.map(order => {
            if (editingOrder?.id === order.id) {
              return <EditOrderCard key={order.id} order={editingOrder} onSave={saveOrderEdit} onCancel={() => setEditingOrder(null)} />
            }
            return (
            <div key={order.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-900 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                      <Table2 className="size-3" />
                      {order.table_number ? `${t('orders.table')} ${order.table_number}` : t('orders.takeaway')}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeAgo(order.created_at)}
                    </span>
                    <span className="text-[10px] text-gray-300 font-mono">
                      #{order.id.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                  <button onClick={() => setEditingOrder(order)} className="mt-1 text-[10px] text-gray-500 hover:text-blue-600 font-bold uppercase tracking-wider transition-colors">
                    {t('orders.edit')}
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4 bg-gray-50/50 rounded-lg p-3 border border-gray-50">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="flex gap-2">
                      <span className="font-bold text-gray-900">{item.quantity}×</span>
                      <div>
                        <p className="font-medium text-gray-800">{item.item_name}</p>
                        {item.options && item.options.length > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {item.options.map((o: any) => o.optionLabel).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-4" /> {t('orders.complete')}
                  </button>
                )}
                {order.status === 'completed' && (
                  <button onClick={() => updateOrderStatus(order.id, 'paid')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <DollarSign className="size-4" /> {t('orders.markPaid')}
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'completed') && (
                  <button
                    onClick={() => setRemovingOrderId(order.id)}
                    className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    title={t('orders.cancelOrder')}
                  >
                    <XCircle className="size-4" />
                  </button>
                )}
              </div>
            </div>
          )})
        )}
      </div>
    </div>
  )

  if (loading && boardMode === 'today') {
    return <div className="p-8 flex items-center justify-center text-gray-400"><RefreshCcw className="size-6 animate-spin" /></div>
  }

  const ModeSwitch = ({ className = '' }: { className?: string }) => (
    <div className={`flex bg-gray-100 p-1 rounded-lg ${className}`}>
      <button
        type="button"
        onClick={() => setBoardMode('today')}
        className={`flex-1 md:flex-none px-3 py-1.5 md:py-1 text-sm font-semibold rounded-md transition-colors ${boardMode === 'today' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
      >
        {t('orders.modeToday')}
      </button>
      {canViewHistory && (
        <button
          type="button"
          onClick={() => setBoardMode('history')}
          className={`flex-1 md:flex-none px-3 py-1.5 md:py-1 text-sm font-semibold rounded-md transition-colors ${boardMode === 'history' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('orders.history')}
        </button>
      )}
    </div>
  )

  const DaySwitch = ({ className = '' }: { className?: string }) => (
    <div className={`flex bg-gray-100 p-1 rounded-lg ${className}`}>
      {([
        { id: 'today' as const, label: t('orders.today') },
        { id: 'yesterday' as const, label: t('orders.yesterday') },
        { id: 'dayBefore' as const, label: t('orders.dayBefore') },
      ]).map(opt => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setDayFilter(opt.id)}
          className={`flex-1 md:flex-none px-3 py-1.5 md:py-1 text-sm font-semibold rounded-md transition-colors ${
            dayFilter === opt.id ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )

  return (
    <div className="p-4 md:p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between shrink-0 gap-4 md:gap-6">
        <div className="flex flex-col order-1 md:order-none">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 flex-wrap">
            {t('orders.title')}
            <ModeSwitch className="hidden md:flex" />
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('orders.autoClearMsg')}</p>
        </div>

        {boardMode === 'today' && (
          <div className="flex gap-3 md:gap-4 order-3 md:order-2 w-full md:w-auto items-stretch">
            <div className="flex-1 md:flex-none bg-white border border-gray-200 px-3 md:px-4 py-2 md:py-2 rounded-xl text-center shadow-sm">
              <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">{dayOrdersLabel}</p>
              <p className="text-lg md:text-xl font-bold text-gray-900">{dayOrders.length}</p>
            </div>
            <div className="flex-1 md:flex-none bg-white border border-gray-200 px-3 md:px-4 py-2 md:py-2 rounded-xl text-center shadow-sm">
              <p className="text-[10px] md:text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">{t('orders.expectedRev')}</p>
              <p className="text-lg md:text-xl font-bold text-green-600">{formatCurrency(dayOrders.reduce((acc, o) => acc + o.total_amount, 0))}</p>
            </div>
            <button
              type="button"
              onClick={() => void enableNotifications()}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <BellRing className="size-4" />
              {t('orders.enableNotifications')}
            </button>
          </div>
        )}

        <div className="flex md:hidden order-4 w-full gap-2">
          <ModeSwitch className="w-full" />
        </div>
        {boardMode === 'today' && (
          <button
            type="button"
            onClick={() => void enableNotifications()}
            className="md:hidden order-5 w-full inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700"
          >
            <BellRing className="size-4" />
            {t('orders.enableNotifications')}
          </button>
        )}
      </div>

      {showRetention && (
        <div className="mb-4 shrink-0 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {retentionMsg}
        </div>
      )}

      {boardMode === 'history' && canViewHistory ? (
        <OrdersHistoryPanel businessId={businessId} />
      ) : (
        <>
          <div className="mb-4 shrink-0 flex flex-col sm:flex-row gap-2 sm:items-center">
            <DaySwitch className="w-full sm:w-auto" />
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
              <input
                type="search"
                value={liveSearch}
                onChange={e => setLiveSearch(e.target.value)}
                placeholder={t('orders.searchOrders')}
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="mb-4 shrink-0 rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="size-4 text-amber-700" />
              <h2 className="font-bold text-gray-900">{t('orders.serviceRequests')}</h2>
              <span className="bg-amber-200 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full ml-auto">
                {openRequests.length}
              </span>
            </div>
            {openRequests.length === 0 ? (
              <p className="text-sm text-gray-500">{t('orders.noServiceRequests')}</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {openRequests.map(req => (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 rounded-xl border border-white bg-white px-3 py-3 shadow-sm"
                  >
                    <div className="size-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                      {req.type === 'request_check'
                        ? <Receipt className="size-4 text-amber-800" />
                        : <Bell className="size-4 text-amber-800" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {t('orders.table')} {req.table_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {req.type === 'request_check'
                          ? t('orders.requestCheckRequest')
                          : t('orders.callStaffRequest')}
                        {' · '}
                        {formatTimeAgo(req.created_at)}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => resolveRequest(req.id, 'acknowledged')}
                        className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-gray-900 text-white hover:bg-gray-800"
                      >
                        {t('orders.acknowledge')}
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveRequest(req.id, 'dismissed')}
                        className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-md bg-gray-100 text-gray-500 hover:bg-gray-200"
                      >
                        {t('orders.dismiss')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
            {renderColumn(t('orders.received'), <Clock className="size-5 text-blue-600" />, pending, 'bg-blue-100')}
            {renderColumn(t('orders.completed'), <CheckCircle2 className="size-5 text-amber-600" />, completed, 'bg-amber-100')}
            {renderColumn(t('orders.paid'), <DollarSign className="size-5 text-green-600" />, paid, 'bg-green-100')}
          </div>
        </>
      )}

      <RemoveOrderDialog
        open={!!removingOrderId}
        busy={removeBusy}
        onCancel={() => setRemovingOrderId(null)}
        onConfirm={(payload) => void confirmRemoveOrder(payload)}
      />
    </div>
  )
}

function EditOrderCard({ order, onSave, onCancel }: { order: Order; onSave: (o: Order) => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Order>(order)
  
  const updateItemQty = (id: string, delta: number) => {
    setDraft(prev => {
      const newItems = prev.order_items.map(i => {
        if (i.id === id) {
          const newQty = Math.max(0, Number(i.quantity) + delta)
          return { ...i, quantity: newQty }
        }
        return i
      })
      
      const newTotal = newItems.reduce((acc, i) => acc + (Number(i.unit_price) * Number(i.quantity)), 0)
      
      return { ...prev, order_items: newItems, total_amount: newTotal }
    })
  }

  return (
    <div className="bg-white border-2 border-blue-400 rounded-xl p-4 shadow-md relative group space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{t('orders.editOrder')}</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><XCircle className="size-4" /></button>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-semibold mb-1 block">{t('orders.tableNumber')}</label>
        <input 
          type="text" 
          value={draft.table_number || ''} 
          onChange={e => setDraft(prev => ({ ...prev, table_number: e.target.value }))}
          placeholder="e.g. 5"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-semibold block">{t('orders.items')}</label>
        {draft.order_items.map(item => (
          <div key={item.id} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
            <div className="flex-1 min-w-0 pr-4">
              <p className="font-medium text-gray-900 truncate" style={{ opacity: item.quantity === 0 ? 0.4 : 1, textDecoration: item.quantity === 0 ? 'line-through' : 'none' }}>
                {item.item_name}
              </p>
              <p className="text-xs text-gray-500">{formatCurrency(item.unit_price)}</p>
            </div>
            
            <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm shrink-0">
              <button 
                onClick={() => updateItemQty(item.id, -1)} 
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold transition-colors"
              >-</button>
              <div className="w-8 h-8 flex items-center justify-center font-bold text-gray-900 border-x border-gray-100">
                {item.quantity}
              </div>
              <button 
                onClick={() => updateItemQty(item.id, 1)} 
                className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold transition-colors"
              >+</button>
            </div>
          </div>
        ))}
      </div>

      <div>
        <label className="text-xs text-gray-500 font-semibold mb-1 block">{t('orders.finalTotalOverride')}</label>
        <input 
          type="number" 
          value={draft.total_amount} 
          onChange={e => setDraft(prev => ({ ...prev, total_amount: Math.round(parseFloat(e.target.value || '0')) }))}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex gap-2 pt-2 mt-2 border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-lg transition-colors">{t('orders.cancel')}</button>
        <button onClick={() => onSave(draft)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-sm">{t('orders.saveChanges')}</button>
      </div>
    </div>
  )
}
