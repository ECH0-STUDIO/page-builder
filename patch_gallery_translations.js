const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

if (!en.gallery.quotaTitle) {
  en.gallery.quotaTitle = "Storage Quota Tracker"
  en.gallery.quotaUsage = "Current Usage"
  en.gallery.billingCycleEnds = "Billing Cycle Ends"
  en.gallery.projectedCharge = "Projected Charge on Renewal"
  en.gallery.credits = "Credits"
  en.gallery.quotaExplanation = "You purchase storage quota in advance using credits (1 credit = 20MB). If you delete images to drop your usage, your next month's renewal charge will automatically decrease!"
  
  vi.gallery.quotaTitle = "Trình theo dõi dung lượng"
  vi.gallery.quotaUsage = "Đang sử dụng"
  vi.gallery.billingCycleEnds = "Chu kỳ kết thúc vào"
  vi.gallery.projectedCharge = "Chi phí gia hạn dự kiến"
  vi.gallery.credits = "Credits"
  vi.gallery.quotaExplanation = "Bạn mua trước dung lượng bằng credit (1 credit = 20MB). Nếu bạn xóa ảnh để giảm dung lượng, chi phí gia hạn tháng tiếp theo sẽ tự động giảm xuống!"
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Dictionaries updated for storage quota!')
