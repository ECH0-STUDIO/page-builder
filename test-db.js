const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://lwupkuhygzybnkoaoenr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3dXBrdWh5Z3p5Ym5rb2FvZW5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc4MjU5MiwiZXhwIjoyMDkyMzU4NTkyfQ.F0tCr7gYCcuR22oV3b_RG0TZ9x7SS4uCXEjn2goMGwk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data, error } = await supabase.from('publishing_settings').select('*').limit(1)
  console.log('Error:', error)
  console.log('Data:', data)
}

test()
