const fs = require('fs');
const file = 'apps/web/src/i18n/dictionaries/vi.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

if (!data.pageBuilder.templatesData) {
  data.pageBuilder.templatesData = {
    "full_experience": {
      "label": "Trải nghiệm Toàn diện",
      "description": "Tốt nhất cho SEO. Một trang web hoàn chỉnh với câu chuyện của bạn, các món ăn đặc trưng, thực đơn đầy đủ và chi tiết liên hệ."
    },
    "visual_menu": {
      "label": "Thực đơn Trực quan",
      "description": "Tập trung hoàn toàn vào món ăn. Giao diện sạch sẽ, đơn giản và đi thẳng vào vấn đề."
    },
    "link_in_bio": {
      "label": "Liên kết Bio",
      "description": "Thiết kế ưu tiên di động. Hoàn hảo để đặt liên kết trên tiểu sử Instagram hoặc TikTok."
    },
    "blank": {
      "label": "Bắt đầu từ trang trắng",
      "description": "Một khung vẽ trống. Xây dựng chính xác những gì bạn cần."
    }
  };
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}
