import { revalidatePath } from 'next/cache'
import type { SupabaseClient } from '@supabase/supabase-js'

/** Revalidate public storefront paths for a business slug. */
export async function revalidateLiveStorePaths(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: SupabaseClient<any>,
  businessId: string,
) {
  const { data } = await db
    .from('businesses')
    .select('slug')
    .eq('id', businessId)
    .single()
  const slug = data?.slug
  if (!slug) return

  const paths = [
    `/${slug}`,
    `/${slug}/order`,
    `/en/${slug}`,
    `/en/${slug}/order`,
    `/vi/${slug}`,
    `/vi/${slug}/order`,
  ]
  for (const path of paths) {
    revalidatePath(path)
  }
}
