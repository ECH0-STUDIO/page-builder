const fs = require('fs');
const path = require('path');

const dir = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/app/(dashboard)';

const targetPattern = /const \{ data: businesses \}([\s\S]*?)const business = businesses\?\.\[0\](?: as any)?/m;
const targetPattern2 = /const \{ data: businesses \}([\s\S]*?)const business = businesses\?\.\[0\]/m;

function walk(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes("from('businesses')") && content.includes("owner_id")) {
        console.log(`Modifying ${fullPath}`);
        
        // Add import if missing
        if (!content.includes("getActiveBusiness")) {
          content = content.replace(
            "import { createClient }",
            "import { createClient } from '@/lib/supabase/server'\nimport { getActiveBusiness } from '@/lib/business-server'\n// import { createClient }"
          );
        }

        // Replace the query block
        const replacement = `const { business } = await getActiveBusiness(supabase, user.id)`;
        
        // Regex replacement for the specific block
        const regex = /const \{\s*data:\s*businesses\s*\}\s*=\s*await supabase\s*\.from\('businesses'\)[\s\S]*?\.limit\(1\)\s*const business\s*=\s*businesses\?\.\[0\](?: as any)?/g;
        
        content = content.replace(regex, replacement);
        
        // Some files might fetch specific fields. We'll just rely on getActiveBusiness which returns everything.
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

walk(dir);
console.log("Done refactoring layout pages.");
