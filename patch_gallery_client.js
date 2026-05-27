const fs = require('fs')

const enPath = './apps/web/src/i18n/dictionaries/en.json'
const viPath = './apps/web/src/i18n/dictionaries/vi.json'

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'))
const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'))

if (!en.gallery.inUse) {
  en.gallery.inUse = "In Use"
  en.gallery.notInUse = "Not in Use"
  en.gallery.cannotDeleteInUse = "Cannot delete an image that is currently in use."
}

if (!vi.gallery.inUse) {
  vi.gallery.inUse = "Đang sử dụng"
  vi.gallery.notInUse = "Không sử dụng"
  vi.gallery.cannotDeleteInUse = "Không thể xóa ảnh đang được sử dụng."
}

fs.writeFileSync(enPath, JSON.stringify(en, null, 2))
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2))

console.log('Dictionaries updated for inUse!')

const compPath = './apps/web/src/components/gallery/GalleryClient.tsx'
let comp = fs.readFileSync(compPath, 'utf8')

// Modify rendering
// I will replace the <div className="group relative aspect-square... "> section
const replacement = `                <div key={img.path} className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  
                  {/* Status Badge */}
                  <div className="absolute top-2 right-2">
                    {img.inUse ? (
                      <span className="px-2 py-1 text-[10px] font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm">
                        {t('gallery.inUse')}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full shadow-sm">
                        {t('gallery.notInUse')}
                      </span>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                    <p className="text-xs text-white truncate w-full text-center mb-2" title={img.name}>
                      {img.name}
                    </p>
                    <p className="text-[10px] text-gray-300 mb-3">
                      {img.size ? (img.size / 1024).toFixed(1) + ' KB' : ''}
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs w-full max-w-[100px]"
                      onClick={() => {
                        if (img.inUse) {
                          toast.error(t('gallery.cannotDeleteInUse'))
                          return
                        }
                        confirmDelete(img.bucket, img.path)
                      }}
                      disabled={deletingPath === img.path || img.inUse}
                    >
                      {deletingPath === img.path ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <><Trash2 className="size-3 mr-1" /> Delete</>
                      )}
                    </Button>
                  </div>
                </div>`

comp = comp.replace(/<div key={img\.path} className="group relative aspect-square[\s\S]*?<\/div>(\s*)<\/div>\s*\)\)\}/, replacement + '\n              ))}')
fs.writeFileSync(compPath, comp)
console.log('GalleryClient updated!')
