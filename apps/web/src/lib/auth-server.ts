import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

/**
 * Request-scoped auth user. Layout + page segments share one getUser() call
 * per navigation instead of each re-hitting Supabase Auth.
 */
export const getAuthUser = cache(async (): Promise<{
  user: User | null
  supabase: Awaited<ReturnType<typeof createClient>>
}> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { user, supabase }
})
