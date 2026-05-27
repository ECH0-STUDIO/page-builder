const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'apps/web/src/i18n/dictionaries/en.json');
const viPath = path.join(__dirname, 'apps/web/src/i18n/dictionaries/vi.json');

const enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const viJson = JSON.parse(fs.readFileSync(viPath, 'utf8'));

enJson.pageBuilder.viewLive = "View Live Page";
enJson.pageBuilder.saveAsDraft = "Save as Draft";
enJson.pageBuilder.publishToLive = "Publish to Live";
enJson.pageBuilder.closePreview = "Close Preview";

viJson.pageBuilder.viewLive = "Xem trang trực tiếp";
viJson.pageBuilder.saveAsDraft = "Lưu nháp";
viJson.pageBuilder.publishToLive = "Xuất bản trực tuyến";
viJson.pageBuilder.closePreview = "Đóng xem trước";

fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2));
fs.writeFileSync(viPath, JSON.stringify(viJson, null, 2));

console.log("Translations updated!");
