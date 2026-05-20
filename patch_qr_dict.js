const fs = require('fs');
const files = ['apps/web/src/i18n/dictionaries/en.json', 'apps/web/src/i18n/dictionaries/vi.json'];

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (file.includes('en.json')) {
    data.qrCodeBlock = data.qrCodeBlock || {};
    data.qrCodeBlock.saveQrCode = "Save QR Code";
  } else {
    data.qrCodeBlock = data.qrCodeBlock || {};
    data.qrCodeBlock.saveQrCode = "Lưu mã QR";
  }
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
});
