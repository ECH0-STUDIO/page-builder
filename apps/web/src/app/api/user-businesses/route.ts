import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAllUserBusinessesServer } from '@/lib/business-server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const uniqueBusinesses = await getAllUserBusinessesServer(user.id)
  return NextResponse.json({ businesses: uniqueBusinesses })
}
