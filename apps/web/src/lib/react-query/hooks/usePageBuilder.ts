import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getPageDataAction } from '@/app/actions/page-builder'

export function usePageData(businessId: string, initialData?: Awaited<ReturnType<typeof getPageDataAction>>) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (initialData) {
      queryClient.setQueryData(['pageData', businessId], initialData)
    }
  }, [initialData, businessId, queryClient])
  return useQuery({
    queryKey: ['pageData', businessId],
    queryFn: async () => {
      return getPageDataAction(businessId)
    },
    initialData,
  })
}
