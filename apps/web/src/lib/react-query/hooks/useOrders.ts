import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/components/orders/OrdersClient'

/** Live board: orders created since local midnight (Today). */
export function useOrders(businessId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['orders', businessId],
    queryFn: async () => {
      const start = new Date()
      start.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('business_id', businessId)
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as Order[]
    },
    refetchInterval: 30000,
  })
}
