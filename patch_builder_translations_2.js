const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'apps/web/src/i18n/dictionaries/en.json');
const viPath = path.join(__dirname, 'apps/web/src/i18n/dictionaries/vi.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const viJson = JSON.parse(fs.readFileSync(viPath, 'utf8'));

enJson.pageBuilder.changes = "Changes";
viJson.pageBuilder.changes = "Có thay đổi";

fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
fs.writeFileSync(viPath, JSON.stringify(viJson, null, 2));

console.log("Translations updated!");
