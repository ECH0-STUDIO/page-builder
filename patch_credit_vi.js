const fs = require('fs')

const viPath = './apps/web/src/i18n/dictionaries/vi.json'
let vi = fs.readFileSync(viPath, 'utf8')

vi = vi.replace(/Tín dụng/g, 'Credit')
vi = vi.replace(/tín dụng/g, 'Credit')

fs.writeFileSync(viPath, vi)
console.log('Replaced Tín dụng with Credit in vi.json')
