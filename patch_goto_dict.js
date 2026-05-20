const fs = require('fs');

const files = [
  { path: 'apps/web/src/i18n/dictionaries/en.json', isEn: true },
  { path: 'apps/web/src/i18n/dictionaries/vi.json', isEn: false }
];

files.forEach(({ path, isEn }) => {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (isEn) {
    data.overview.steps.goTo = "Go to";
  } else {
    data.overview.steps.goTo = "Đi tới";
  }
  
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
});
