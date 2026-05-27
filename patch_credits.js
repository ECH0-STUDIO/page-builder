const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

en.credits = {
  availableCredits: "Available Credits",
  usedForPremium: "Credits are used to access premium features.",
  buyCredits: "Buy Credits",
  purchaseMore: "Purchase more credits to continue using premium features.",
  purchaseSuccess: "Successfully purchased {{amount}} credits!",
  transactionHistory: "Transaction History",
  recentUsage: "Recent credit usage and purchases",
  noTransactions: "No transactions yet."
}

vi.credits = {
  availableCredits: "Tín dụng hiện có",
  usedForPremium: "Tín dụng được sử dụng để truy cập các tính năng cao cấp.",
  buyCredits: "Mua tín dụng",
  purchaseMore: "Mua thêm tín dụng để tiếp tục sử dụng các tính năng cao cấp.",
  purchaseSuccess: "Đã mua thành công {{amount}} tín dụng!",
  transactionHistory: "Lịch sử giao dịch",
  recentUsage: "Các giao dịch mua và sử dụng tín dụng gần đây",
  noTransactions: "Chưa có giao dịch nào."
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Dictionaries updated!')

const compPath = './apps/web/src/components/dashboard/CreditDashboard.tsx'
let comp = fs.readFileSync(compPath, 'utf8')

comp = comp.replace(/toast\.success\(\`Successfully purchased \$\{amount\} credits\!\`\)/g, "toast.success(t('credits.purchaseSuccess').replace('{{amount}}', String(amount)))")
comp = comp.replace(/Available Credits/g, "{t('credits.availableCredits')}")
comp = comp.replace(/Credits are used to access premium features\./g, "{t('credits.usedForPremium')}")
comp = comp.replace(/<CardTitle>Buy Credits<\/CardTitle>/g, "<CardTitle>{t('credits.buyCredits')}</CardTitle>")
comp = comp.replace(/Purchase more credits to continue using premium features\./g, "{t('credits.purchaseMore')}")
comp = comp.replace(/Transaction History/g, "{t('credits.transactionHistory')}")
comp = comp.replace(/Recent credit usage and purchases/g, "{t('credits.recentUsage')}")
comp = comp.replace(/<p>No transactions yet\.<\/p>/g, "<p>{t('credits.noTransactions')}</p>")

fs.writeFileSync(compPath, comp)
console.log('CreditDashboard updated!')
