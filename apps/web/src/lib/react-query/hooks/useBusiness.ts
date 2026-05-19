import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserBusinesses } from '@/lib/business'
import { createClient } from '@/lib/supabase/client'
import { updateBusinessAction } from '@/app/actions/business'

export function useBusinesses(initialData?: Awaited<ReturnType<typeof getUserBusinesses>>) {
  const supabase = createClient()
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return []
      return getUserBusinesses()
    },
    initialData,
  })
}



export function useUpdateBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, update }: { id: string, update: any }) => {
      const res = await updateBusinessAction(id, update)
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    }
  })
}
