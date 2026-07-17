import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ServiceRequest } from '@/app/actions/service-requests'

export function useServiceRequests(businessId: string) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['serviceRequests', businessId],
    queryFn: async () => {
      const since = new Date()
      since.setHours(since.getHours() - 12)

      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('business_id', businessId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data ?? []) as ServiceRequest[]
    },
    refetchInterval: 30_000,
  })
}
