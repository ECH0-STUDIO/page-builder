/** Public URL for Webflow export assets copied to /public/marketing/images */
export function mImg(path: string): string {
  const clean = path.replace(/^\//, '')
  return `/marketing/images/${clean.split('/').map(encodeURIComponent).join('/')}`
}
