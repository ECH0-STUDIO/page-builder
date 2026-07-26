import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserBusinesses } from '@/lib/business'
import { updateBusinessAction } from '@/app/actions/business'

export function useBusinesses(initialData?: Awaited<ReturnType<typeof getUserBusinesses>>) {
  return useQuery({
    queryKey: ['businesses'],
    queryFn: async () => {
      try {
        return await getUserBusinesses()
      } catch (error) {
        console.error('[useBusinesses]', error)
        return initialData ?? []
      }
    },
    initialData,
    staleTime: 0,
    retry: 1,
  })
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, update }: { id: string, update: Record<string, unknown> }) => {
      const res = await updateBusinessAction(id, update)
      if (!res.success) throw new Error(res.error)
      return res
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] })
    },
  })
}
