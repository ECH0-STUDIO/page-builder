const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

if (!en.sidebar.topUp) {
  en.sidebar.topUp = "TOP UP"
  vi.sidebar.topUp = "THÊM"
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Dictionaries updated for topUp!')

const compPath = './apps/web/src/components/dashboard/Sidebar.tsx'
let comp = fs.readFileSync(compPath, 'utf8')
comp = comp.replace(/Top Up/g, "{t('sidebar.topUp')}")
fs.writeFileSync(compPath, comp)
console.log('Sidebar updated!')
