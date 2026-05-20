const fs = require('fs');
const files = ['apps/web/src/i18n/dictionaries/en.json', 'apps/web/src/i18n/dictionaries/vi.json'];

files.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  
  if (file.includes('en.json')) {
    data.pageBuilder.blocks = {
      hero: { label: "Hero", description: "Cover image, headline, tagline, and call to action." },
      text_image: { label: "Text + Image", description: "About us, promotions, or any story block." },
      contact: { label: "Contact & Info", description: "Map, hours, phone, email and social icons." },
      menu_grid: { label: "Menu / Products", description: "Auto-pulls your menu items into a grid or list." },
      qr_code: { label: "QR Code", description: "Scannable QR linking to your page or a custom URL." }
    };
  } else {
    data.pageBuilder.blocks = {
      hero: { label: "Anh bia (Hero)", description: "Ảnh bìa, tiêu đề, khẩu hiệu và nút kêu gọi hành động." },
      text_image: { label: "Văn bản + Hình ảnh", description: "Giới thiệu, khuyến mãi, hoặc bất kỳ câu chuyện nào." },
      contact: { label: "Liên hệ & Thông tin", description: "Bản đồ, giờ làm việc, điện thoại, email và các mạng xã hội." },
      menu_grid: { label: "Thực đơn / Sản phẩm", description: "Tự động hiển thị món ăn dạng lưới hoặc danh sách." },
      qr_code: { label: "Mã QR", description: "Mã QR để quét liên kết tới trang hoặc URL tùy chỉnh." }
    };
  }
  
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
});
