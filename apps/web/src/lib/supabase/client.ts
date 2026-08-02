import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

function requireSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy apps/web/.env.example to apps/web/.env.local and fill in your Supabase keys.',
    )
  }
  return { url, key }
}

let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (!browserClient) {
    const { url, key } = requireSupabaseEnv()
    browserClient = createBrowserClient<Database>(url, key)
  }
  return browserClient
}
