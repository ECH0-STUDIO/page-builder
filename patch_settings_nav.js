const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

if (!en.settings.tabs.credits) {
  en.settings.tabs.credits = "Billing & Credits"
  vi.settings.tabs.credits = "Thanh toán & Tín dụng"
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Dictionaries updated for settings.tabs.credits!')

const compPath = './apps/web/src/app/(dashboard)/dashboard/settings/SettingsNav.tsx'
let comp = fs.readFileSync(compPath, 'utf8')
comp = comp.replace(/title: 'Billing & Credits',/g, "title: t('settings.tabs.credits'),")
fs.writeFileSync(compPath, comp)
console.log('SettingsNav updated!')
