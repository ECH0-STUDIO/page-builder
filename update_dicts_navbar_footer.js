const fs = require('fs');

const enFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/i18n/dictionaries/en.json';
const viFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/i18n/dictionaries/vi.json';

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const viData = JSON.parse(fs.readFileSync(viFile, 'utf8'));

enData.navbarBlock = {
  "logo": "Logo",
  "noLinks": "No links",
  "saving": "Saving…",
  "saveNavbar": "Save navbar",
  "logoBrand": "Logo / Brand",
  "name": "Name",
  "image": "Image",
  "navLinks": "Navigation Links",
  "linkCount": "link",
  "linksCount": "links",
  "noLinksYet": "No links yet.",
  "linkLabel": "Link label",
  "scrollToSection": "Scroll to section",
  "scrollToBlock": "Scroll to block",
  "selectSection": "Select a section…",
  "scrollHelp": "Will scroll to that section when clicked.",
  "addBlocksFirst": "Add more blocks to the page first, then you can scroll-link to them.",
  "urlPlaceholder": "https://… or /page-path",
  "addLink": "Add link",
  "appearance": "Appearance",
  "background": "Background",
  "linkColour": "Link colour",
  "white": "White",
  "dark": "Dark",
  "glass": "Glass",
  "stickyNavbar": "Sticky navbar",
  "stickyHelp": "Sticks to top while scrolling",
  "navbarSaved": "Navbar saved",
  "saveFailed": "Save failed:"
};

viData.navbarBlock = {
  "logo": "Logo",
  "noLinks": "Không có liên kết",
  "saving": "Đang lưu…",
  "saveNavbar": "Lưu thanh điều hướng",
  "logoBrand": "Logo / Thương hiệu",
  "name": "Tên",
  "image": "Hình ảnh",
  "navLinks": "Liên kết điều hướng",
  "linkCount": "liên kết",
  "linksCount": "liên kết",
  "noLinksYet": "Chưa có liên kết nào.",
  "linkLabel": "Nhãn liên kết",
  "scrollToSection": "Cuộn đến phần",
  "scrollToBlock": "Cuộn đến khối",
  "selectSection": "Chọn một phần…",
  "scrollHelp": "Sẽ cuộn đến phần đó khi nhấp vào.",
  "addBlocksFirst": "Thêm các khối vào trang trước, sau đó bạn có thể tạo liên kết cuộn đến chúng.",
  "urlPlaceholder": "https://… hoặc /đường-dẫn",
  "addLink": "Thêm liên kết",
  "appearance": "Giao diện",
  "background": "Nền",
  "linkColour": "Màu liên kết",
  "white": "Trắng",
  "dark": "Tối",
  "glass": "Kính",
  "stickyNavbar": "Thanh điều hướng cố định",
  "stickyHelp": "Cố định ở trên cùng khi cuộn",
  "navbarSaved": "Đã lưu thanh điều hướng",
  "saveFailed": "Lưu thất bại:"
};

enData.footerBlock = {
  "footerSettings": "Footer Settings",
  "appearsBottom": "Appears at the bottom of your page.",
  "showBusinessName": "Show business name",
  "copyrightText": "Copyright Text",
  "colours": "Colours",
  "background": "Background",
  "text": "Text"
};

viData.footerBlock = {
  "footerSettings": "Cài đặt chân trang",
  "appearsBottom": "Hiển thị ở dưới cùng của trang.",
  "showBusinessName": "Hiển thị tên doanh nghiệp",
  "copyrightText": "Văn bản bản quyền",
  "colours": "Màu sắc",
  "background": "Nền",
  "text": "Chữ"
};

enData.qrCodeBlock = {
  "qrCode": "QR Code",
  "qrLoading": "QR",
  "small": "Small",
  "medium": "Medium",
  "large": "Large",
  "left": "Left",
  "center": "Center",
  "right": "Right",
  "qrTarget": "QR target",
  "myPage": "My page",
  "customUrl": "Custom URL",
  "label": "Label",
  "scanToView": "Scan to view our menu",
  "size": "Size",
  "alignment": "Alignment",
  "showDownload": "Show download button",
  "colours": "Colours",
  "background": "Background",
  "qrColour": "QR colour"
};

viData.qrCodeBlock = {
  "qrCode": "Mã QR",
  "qrLoading": "QR",
  "small": "Nhỏ",
  "medium": "Trung bình",
  "large": "Lớn",
  "left": "Trái",
  "center": "Giữa",
  "right": "Phải",
  "qrTarget": "Đích QR",
  "myPage": "Trang của tôi",
  "customUrl": "URL tùy chỉnh",
  "label": "Nhãn",
  "scanToView": "Quét để xem thực đơn",
  "size": "Kích thước",
  "alignment": "Căn chỉnh",
  "showDownload": "Hiện nút tải xuống",
  "colours": "Màu sắc",
  "background": "Nền",
  "qrColour": "Màu QR"
};

enData.ctaEditor = {
  "url": "URL",
  "phone": "Phone",
  "email": "Email",
  "scrollTo": "Scroll to",
  "filled": "Filled",
  "outlined": "Outlined",
  "textLink": "Text link",
  "buttonLabel": "Button label",
  "scrollToSection": "Scroll to section",
  "selectSection": "Select a section…",
  "noAnchorIds": "No sections with an anchor ID yet. Set a <strong>Section ID</strong> on any block using the input below the block settings."
};

viData.ctaEditor = {
  "url": "URL",
  "phone": "Điện thoại",
  "email": "Email",
  "scrollTo": "Cuộn đến",
  "filled": "Tô đầy",
  "outlined": "Viền",
  "textLink": "Liên kết chữ",
  "buttonLabel": "Nhãn nút",
  "scrollToSection": "Cuộn đến phần",
  "selectSection": "Chọn một phần…",
  "noAnchorIds": "Chưa có phần nào có ID neo. Đặt <strong>ID Phần</strong> cho khối bất kỳ bằng ô nhập bên dưới cài đặt khối."
};

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2) + '\n');
fs.writeFileSync(viFile, JSON.stringify(viData, null, 2) + '\n');
console.log('Dictionaries updated!');
