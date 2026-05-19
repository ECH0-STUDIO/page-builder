import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function safeToPng(element: HTMLElement, options?: any) {
  const { toPng } = await import('html-to-image')
  
  // Monkey-patch CSSStyleSheet.prototype.cssRules to suppress CORS SecurityError
  // html-to-image crashes when trying to access cssRules of cross-origin stylesheets
  const styleSheetProto = CSSStyleSheet.prototype
  const originalCssRules = Object.getOwnPropertyDescriptor(styleSheetProto, 'cssRules')
  let patched = false

  if (originalCssRules) {
    Object.defineProperty(styleSheetProto, 'cssRules', {
      get() {
        try {
          return originalCssRules.get?.call(this)
        } catch (e) {
          if (e instanceof DOMException && e.name === 'SecurityError') {
            return [] // Suppress CORS error
          }
          throw e
        }
      },
      configurable: true
    })
    patched = true
  }

  try {
    return await toPng(element, options)
  } finally {
    if (patched && originalCssRules) {
      Object.defineProperty(styleSheetProto, 'cssRules', originalCssRules)
    }
  }
}
