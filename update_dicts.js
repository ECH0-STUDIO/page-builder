const fs = require('fs');

const enFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/i18n/dictionaries/en.json';
const viFile = '/Users/mac/.gemini/antigravity/playground/eatery-page-builder/apps/web/src/i18n/dictionaries/vi.json';

const enData = JSON.parse(fs.readFileSync(enFile, 'utf8'));
const viData = JSON.parse(fs.readFileSync(viFile, 'utf8'));

const enHero = {
  "layout": "Layout",
  "overlay": "Overlay",
  "overlayDesc": "Full-width image with adjustable overlay",
  "split": "Split",
  "splitDesc": "Image one side, content other",
  "textOnly": "Text Only",
  "textOnlyDesc": "Solid / gradient background, no image",
  "coverImage": "Cover Image",
  "clickToUpload": "Click to upload",
  "imagePosition": "Image position",
  "top": "Top",
  "center": "Center",
  "bottom": "Bottom",
  "overlayOpacity": "Overlay opacity",
  "background": "Background",
  "solidColour": "Solid colour",
  "gradient": "Gradient",
  "splitOptions": "Split options",
  "imageSide": "Image side",
  "contentLeft": "Content left · Image right",
  "imageLeft": "Image left · Content right",
  "panelBackground": "Panel background",
  "panelTextColour": "Panel text colour",
  "content": "Content",
  "heading": "Heading",
  "headingPlaceholder": "Your business name",
  "tagline": "Tagline",
  "taglinePlaceholder": "Short description",
  "bodyText": "Body text (optional)",
  "bodyPlaceholder": "Optional paragraph…",
  "cta": "Call to Action",
  "primaryButton": "Primary button",
  "addPrimary": "+ Add primary button",
  "secondaryLink": "Secondary link",
  "addSecondary": "+ Add secondary link",
  "styling": "Styling",
  "blockHeight": "Block height",
  "custom": "Custom",
  "medium": "Medium",
  "fullscreen": "Fullscreen",
  "verticalPadding": "Vertical padding",
  "paddingHelp": "Drag to set vertical breathing room. In Custom mode this directly controls section height.",
  "textColour": "Text & button colour",
  "auto": "Auto",
  "white": "White",
  "dark": "Dark",
  "colourHelp": "Applies to heading, body, and both CTA buttons."
};

const viHero = {
  "layout": "Bố cục",
  "overlay": "Lớp phủ",
  "overlayDesc": "Ảnh toàn chiều rộng với lớp phủ tùy chỉnh",
  "split": "Chia đôi",
  "splitDesc": "Một bên ảnh, một bên nội dung",
  "textOnly": "Chỉ văn bản",
  "textOnlyDesc": "Nền màu / chuyển sắc, không có ảnh",
  "coverImage": "Ảnh bìa",
  "clickToUpload": "Nhấn để tải lên",
  "imagePosition": "Vị trí ảnh",
  "top": "Trên",
  "center": "Giữa",
  "bottom": "Dưới",
  "overlayOpacity": "Độ mờ lớp phủ",
  "background": "Nền",
  "solidColour": "Màu đơn sắc",
  "gradient": "Màu chuyển sắc",
  "splitOptions": "Tùy chọn chia đôi",
  "imageSide": "Bên ảnh",
  "contentLeft": "Nội dung trái · Ảnh phải",
  "imageLeft": "Ảnh trái · Nội dung phải",
  "panelBackground": "Nền khung",
  "panelTextColour": "Màu chữ khung",
  "content": "Nội dung",
  "heading": "Tiêu đề",
  "headingPlaceholder": "Tên doanh nghiệp của bạn",
  "tagline": "Khẩu hiệu",
  "taglinePlaceholder": "Mô tả ngắn",
  "bodyText": "Văn bản (tùy chọn)",
  "bodyPlaceholder": "Đoạn văn tùy chọn…",
  "cta": "Nút kêu gọi hành động",
  "primaryButton": "Nút chính",
  "addPrimary": "+ Thêm nút chính",
  "secondaryLink": "Liên kết phụ",
  "addSecondary": "+ Thêm liên kết phụ",
  "styling": "Định dạng",
  "blockHeight": "Chiều cao khối",
  "custom": "Tùy chỉnh",
  "medium": "Trung bình",
  "fullscreen": "Toàn màn hình",
  "verticalPadding": "Khoảng đệm dọc",
  "paddingHelp": "Kéo để đặt khoảng trống. Trong chế độ Tùy chỉnh, tùy chọn này trực tiếp kiểm soát chiều cao.",
  "textColour": "Màu chữ & nút",
  "auto": "Tự động",
  "white": "Trắng",
  "dark": "Tối",
  "colourHelp": "Áp dụng cho tiêu đề, văn bản, và cả hai nút hành động."
};

enData.heroBlock = enHero;
viData.heroBlock = viHero;

fs.writeFileSync(enFile, JSON.stringify(enData, null, 2) + '\n');
fs.writeFileSync(viFile, JSON.stringify(viData, null, 2) + '\n');
console.log('Dictionaries updated!');
