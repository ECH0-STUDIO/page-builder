const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = dotenv.parse(fs.readFileSync('/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/.env.local'));
const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking business_members...");
  const { data: members, error: mError } = await supabase.from('business_members').select('*');
  console.log("Members:", JSON.stringify(members, null, 2));
  
  console.log("Checking team_invitations...");
  const { data: invites, error: iError } = await supabase.from('team_invitations').select('*');
  console.log("Invites:", JSON.stringify(invites, null, 2));

  console.log("Checking businesses...");
  const { data: businesses, error: bError } = await supabase.from('businesses').select('id, name, owner_id');
  console.log("Businesses:", JSON.stringify(businesses, null, 2));
}
run();
