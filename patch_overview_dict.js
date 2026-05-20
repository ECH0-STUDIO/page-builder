const fs = require('fs');

const files = [
  { path: 'apps/web/src/i18n/dictionaries/en.json', isEn: true },
  { path: 'apps/web/src/i18n/dictionaries/vi.json', isEn: false }
];

files.forEach(({ path, isEn }) => {
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  
  if (!data.overview) data.overview = {};
  
  if (isEn) {
    data.overview.steps = {
      title: "Getting Started",
      businessProfile: { title: "Business Profile", desc: "Add your logo, address & hours" },
      menu: { title: "Menu", desc: "Add categories & items" },
      pageBuilder: { title: "Page Builder", desc: "Design your public page" },
      publish: { title: "Publish", desc: "Make your page live" }
    };
    data.overview.niceToHave = {
      title: "Nice to Have",
      qr: { title: "QR Code", desc: "Print QR for tables" },
      payment: { title: "Payment", desc: "Setup VietQR payments" }
    };
    data.overview.analytics = {
      title: "Page Analytics",
      totalViews: "Total Views",
      last7Days: "Last 7 Days"
    };
  } else {
    data.overview.steps = {
      title: "Bắt đầu",
      businessProfile: { title: "Hồ sơ doanh nghiệp", desc: "Thêm logo, địa chỉ & giờ mở cửa" },
      menu: { title: "Thực đơn", desc: "Thêm danh mục & món ăn" },
      pageBuilder: { title: "Trình tạo trang", desc: "Thiết kế trang của bạn" },
      publish: { title: "Xuất bản", desc: "Đưa trang của bạn lên mạng" }
    };
    data.overview.niceToHave = {
      title: "Có thể bổ sung",
      qr: { title: "Mã QR", desc: "In mã QR cho bàn" },
      payment: { title: "Thanh toán", desc: "Thiết lập thanh toán VietQR" }
    };
    data.overview.analytics = {
      title: "Phân tích trang",
      totalViews: "Tổng lượt xem",
      last7Days: "7 ngày qua"
    };
  }
  
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
});
