import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/components/orders/OrdersClient'

export function useOrders(businessId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['orders', businessId],
    queryFn: async () => {
      // Fetch last 48 hours
      const twoDaysAgo = new Date()
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 1)
      twoDaysAgo.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('business_id', businessId)
        .gte('created_at', twoDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return data as Order[]
    },
    // We update this via realtime subscription, but we can poll just in case
    refetchInterval: 30000,
  })
}
