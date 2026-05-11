'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, ChefHat, Clock, XCircle, Table2, RefreshCcw, DollarSign } from 'lucide-react'
import { formatCurrency } from '@/lib/currency'
import { toast } from 'sonner'

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
  order_items: OrderItem[] // We will join this
}

interface OrdersClientProps {
  businessId: string
}

function formatTimeAgo(dateString: string) {
  const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000)
  if (diff < 1) return 'Just now'
  if (diff < 60) return `${diff}m ago`
  const h = Math.floor(diff / 60)
  return `${h}h ${diff % 60}m ago`
}

export function OrdersClient({ businessId }: OrdersClientProps) {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [dayFilter, setDayFilter] = useState<'today' | 'yesterday'>('today')
  const supabase = createClient()

  const fetchOrders = useCallback(async () => {
    // Fetch last 48 hours
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 1)
    twoDaysAgo.setHours(0, 0, 0, 0)

    const db = supabase as any
    const { data, error } = await db
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('business_id', businessId)
      .gte('created_at', twoDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load orders: ' + error.message)
    } else {
      setOrders(data as Order[])
    }
    setLoading(false)
  }, [businessId, supabase])

  useEffect(() => {
    fetchOrders()

    // Realtime subscription
    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New order! Let's re-fetch to get the items, or just play a sound
            toast.success('New Order Received!', { duration: 5000, icon: '🔔' })
            try {
              const audio = new Audio('/bell.mp3') // Assume we have a sound, or it just fails silently
              audio.play().catch(() => {})
            } catch (e) {}
            fetchOrders()
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [businessId, fetchOrders, supabase])

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    let previousStatus: OrderStatus | undefined
    // Optimistic update
    setOrders(prev => {
      const order = prev.find(o => o.id === orderId)
      previousStatus = order?.status
      return prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
    })

    const db = supabase as any
    const { error } = await db.from('orders').update({ status: newStatus }).eq('id', orderId)
    
    if (error) {
      toast.error('Failed to update status')
      fetchOrders() // Revert on failure
      return
    }

    if (newStatus === 'cancelled' && previousStatus) {
      toast('Order removed', {
        action: {
          label: 'Undo',
          onClick: () => updateOrderStatus(orderId, previousStatus!)
        },
        duration: 5000,
      })
    }
  }

  const updatePaymentStatus = async (orderId: string, newStatus: PaymentStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o))
    const db = supabase as any
    const { error } = await db.from('orders').update({ payment_status: newStatus }).eq('id', orderId)
    if (error) {
      toast.error('Failed to update payment')
      fetchOrders() // Revert on failure
    }
  }

  // Force re-render every minute to update "time ago"
  const [, setTick] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(i)
  }, [])

  const saveOrderEdit = async (updatedOrder: Order) => {
    // Optimistic UI update
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))
    setEditingOrder(null)

    const db = supabase as any

    // 1. Update main order (Table Number & Total Amount)
    const { error: orderError } = await db.from('orders').update({
      table_number: updatedOrder.table_number,
      total_amount: updatedOrder.total_amount,
    }).eq('id', updatedOrder.id)
    
    if (orderError) {
      toast.error('Failed to update order details')
      return fetchOrders() // Revert
    }

    // 2. Update order items carefully
    for (const item of updatedOrder.order_items) {
      if (item.quantity === 0) {
        // Delete item if quantity is 0
        await db.from('order_items').delete().eq('id', item.id)
      } else {
        // Update quantity
        await db.from('order_items').update({
          quantity: item.quantity
        }).eq('id', item.id)
      }
    }
    
    toast.success('Order updated successfully!')
    fetchOrders() // Re-sync to ensure perfect state
  }

  const isToday = (dateString: string) => {
    const d = new Date(dateString)
    const today = new Date()
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
  }

  const filteredOrders = orders.filter(o => dayFilter === 'today' ? isToday(o.created_at) : !isToday(o.created_at))
  const activeOrders = filteredOrders.filter(o => ['pending', 'completed', 'paid'].includes(o.status))

  const pending = activeOrders.filter(o => o.status === 'pending')
  const completed = activeOrders.filter(o => o.status === 'completed')
  const paid = activeOrders.filter(o => o.status === 'paid')

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
            No orders here
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
                      {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                      <Clock className="size-3" />
                      {formatTimeAgo(order.created_at)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                  <p className="font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                  <button onClick={() => setEditingOrder(order)} className="mt-1 text-[10px] text-gray-500 hover:text-blue-600 font-bold uppercase tracking-wider transition-colors">
                    Edit
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

              {/* Action Buttons */}
              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <button onClick={() => updateOrderStatus(order.id, 'completed')} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="size-4" /> Complete
                  </button>
                )}
                {order.status === 'completed' && (
                  <button onClick={() => updateOrderStatus(order.id, 'paid')} className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5">
                    <DollarSign className="size-4" /> Mark Paid
                  </button>
                )}
                {(order.status === 'pending' || order.status === 'completed') && (
                  <button onClick={() => updateOrderStatus(order.id, 'cancelled')} className="px-3 py-2 bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors" title="Cancel Order">
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

  if (loading) {
    return <div className="p-8 flex items-center justify-center text-gray-400"><RefreshCcw className="size-6 animate-spin" /></div>
  }

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Live Orders
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setDayFilter('today')} 
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${dayFilter === 'today' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Today
              </button>
              <button 
                onClick={() => setDayFilter('yesterday')} 
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${dayFilter === 'yesterday' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Yesterday
              </button>
            </div>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Orders are automatically cleared after 48 hours.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Today's Orders</p>
            <p className="text-xl font-bold text-gray-900">{activeOrders.length}</p>
          </div>
          <div className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-center shadow-sm">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Expected Rev.</p>
            <p className="text-xl font-bold text-green-600">{formatCurrency(activeOrders.reduce((acc, o) => acc + o.total_amount, 0))}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
        {renderColumn('Received', <Clock className="size-5 text-blue-600" />, pending, 'bg-blue-100')}
        {renderColumn('Completed', <CheckCircle2 className="size-5 text-amber-600" />, completed, 'bg-amber-100')}
        {renderColumn('Paid', <DollarSign className="size-5 text-green-600" />, paid, 'bg-green-100')}
      </div>
    </div>
  )
}

function EditOrderCard({ order, onSave, onCancel }: { order: Order; onSave: (o: Order) => void; onCancel: () => void }) {
  const [draft, setDraft] = useState<Order>(order)
  
  const updateItemQty = (id: string, delta: number) => {
    setDraft(prev => {
      // 1. Calculate new items array
      const newItems = prev.order_items.map(i => {
        if (i.id === id) {
          const newQty = Math.max(0, Number(i.quantity) + delta)
          return { ...i, quantity: newQty }
        }
        return i
      })
      
      // 2. Recalculate total accurately
      const newTotal = newItems.reduce((acc, i) => acc + (Number(i.unit_price) * Number(i.quantity)), 0)
      
      return { ...prev, order_items: newItems, total_amount: newTotal }
    })
  }

  return (
    <div className="bg-white border-2 border-blue-400 rounded-xl p-4 shadow-md relative group space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Edit Order</span>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><XCircle className="size-4" /></button>
      </div>

      <div>
        <label className="text-xs text-gray-500 font-semibold mb-1 block">Table Number</label>
        <input 
          type="text" 
          value={draft.table_number || ''} 
          onChange={e => setDraft(prev => ({ ...prev, table_number: e.target.value }))}
          placeholder="e.g. 5"
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs text-gray-500 font-semibold block">Items</label>
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
        <label className="text-xs text-gray-500 font-semibold mb-1 block">Final Total Override</label>
        <input 
          type="number" 
          value={draft.total_amount / 100} 
          onChange={e => setDraft(prev => ({ ...prev, total_amount: Math.round(parseFloat(e.target.value || '0') * 100) }))}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <div className="flex gap-2 pt-2 mt-2 border-t border-gray-100">
        <button onClick={onCancel} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2.5 rounded-lg transition-colors">
          Cancel
        </button>
        <button onClick={() => onSave(draft)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-lg transition-colors shadow-sm">
          Save Changes
        </button>
      </div>
    </div>
  )
}
