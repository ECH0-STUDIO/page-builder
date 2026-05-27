require('dotenv').config({ path: './apps/web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const businessId = '758140db-33cb-4f05-8bf8-d42f5bf777e4'; // Need to find the actual businessId... wait, I can just fetch the first business.
  
  const { data: b } = await supabase.from('businesses').select('id').limit(1).single();
  const bid = b.id;

  const { data: items } = await supabase.from('menu_items').select('name, image_url').eq('business_id', bid);
  console.log('MENU ITEMS:', items);

  const { data: files } = await supabase.storage.from('page-images').list(bid, { limit: 10 });
  console.log('FILES IN BUCKET:', files);

}
run();
