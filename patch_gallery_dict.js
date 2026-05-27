const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

en.gallery = {
  title: "Media Gallery",
  description: "Manage your uploaded images across all your pages and menus.",
  storageUsed: "Storage Used",
  creditCost: "Credit Usage",
  creditCostDesc: "1 Credit per 20 MB",
  deleteImage: "Delete Image",
  confirmDelete: "Are you sure you want to delete this image? If it is currently used on your live website, it will appear broken!",
  uploading: "Uploading...",
  uploadNew: "Upload New Image",
  noImages: "No images found.",
  deleting: "Deleting..."
}

vi.gallery = {
  title: "Thư viện Ảnh",
  description: "Quản lý hình ảnh đã tải lên trên tất cả các trang và thực đơn của bạn.",
  storageUsed: "Dung lượng đã sử dụng",
  creditCost: "Tín dụng sử dụng",
  creditCostDesc: "1 Tín dụng cho mỗi 20 MB",
  deleteImage: "Xóa Ảnh",
  confirmDelete: "Bạn có chắc chắn muốn xóa ảnh này không? Nếu ảnh này đang được sử dụng trên trang web của bạn, nó sẽ bị lỗi hiển thị!",
  uploading: "Đang tải lên...",
  uploadNew: "Tải ảnh mới",
  noImages: "Chưa có ảnh nào.",
  deleting: "Đang xóa..."
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Dictionaries updated for gallery!')
