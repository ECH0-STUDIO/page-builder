const fs = require('fs');
const files = ['apps/web/src/i18n/dictionaries/en.json', 'apps/web/src/i18n/dictionaries/vi.json'];

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (file.includes('en.json')) {
    data.menuGridBlock.tabsLayout = "Tabs Layout (Desktop)";
    data.menuGridBlock.horizontalScroll = "Horizontal Scroll";
    data.menuGridBlock.sidebar = "Sidebar";
  } else {
    data.menuGridBlock.tabsLayout = "Bố cục Tabs (Desktop)";
    data.menuGridBlock.horizontalScroll = "Cuộn ngang";
    data.menuGridBlock.sidebar = "Thanh bên (Sidebar)";
  }
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
});
