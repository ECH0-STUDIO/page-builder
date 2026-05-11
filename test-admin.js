const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const email = 'thai.tranvan3103@gmail.com'
  
  // Try listUsers search
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (users) {
     const existing = users.users.find(u => u.email === email)
     console.log('Found?', existing?.id)
  }
}
run()
