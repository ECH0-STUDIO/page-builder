const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const userId = "06702367-f81f-4ee7-bee5-0a145e960dcc"; // thai.tranvan3103@gmail.com
  console.log("Fetching member businesses for user:", userId);
  const { data, error } = await supabase
    .from('business_members')
    .select('businesses(*)')
    .eq('user_id', userId);
    
  console.log("Data:", JSON.stringify(data, null, 2));
  if (error) console.error("Error:", error);
}
run();
