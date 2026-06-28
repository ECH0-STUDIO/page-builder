import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'

export function useMenu(businessId: string, initialData?: { categories: MenuCategory[], items: MenuItem[] }) {
  const supabase = createClient()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (initialData) {
      queryClient.setQueryData(['menu', businessId], initialData)
    }
  }, [initialData, businessId, queryClient])
  
  return useQuery({
    queryKey: ['menu', businessId],
    queryFn: async () => {
      const [catRes, itemRes] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('business_id', businessId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('menu_items')
          .select('*')
          .eq('business_id', businessId)
          .order('sort_order', { ascending: true }),
      ])
      
      if (catRes.error) throw new Error(catRes.error.message)
      if (itemRes.error) throw new Error(itemRes.error.message)
      
      return {
        categories: catRes.data as MenuCategory[],
        items: itemRes.data as MenuItem[],
      }
    },
    initialData,
  })
}
