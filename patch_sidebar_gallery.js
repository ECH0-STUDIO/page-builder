const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

if (!en.sidebar.gallery) en.sidebar.gallery = "Gallery"
if (!vi.sidebar.gallery) vi.sidebar.gallery = "Thư viện Ảnh"

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Sidebar gallery dictionary updated!')
