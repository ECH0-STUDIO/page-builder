const fs = require('fs');
const file = 'apps/web/src/i18n/dictionaries/en.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!data.pageBuilder.templatesData) {
  data.pageBuilder.templatesData = {
    "full_experience": {
      "label": "The Full Experience",
      "description": "Recommended for SEO. A complete website with your story, signature dishes, full menu, and contact details."
    },
    "visual_menu": {
      "label": "The Visual Menu",
      "description": "Focus entirely on the food. Clean, simple, and straight to the point."
    },
    "link_in_bio": {
      "label": "Link-in-Bio",
      "description": "Mobile-first design. Perfect for Instagram or TikTok bio links."
    },
    "blank": {
      "label": "Start from Scratch",
      "description": "An empty canvas. Build exactly what you need."
    }
  };
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
