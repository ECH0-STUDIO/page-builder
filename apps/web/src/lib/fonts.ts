/**
 * Shared font definitions used across:
 *  - QR Print Designer
 *  - Print Menu Designer
 *  - (future) Page Builder font pickers
 */

export interface FontDef {
  value: string
  label: string
  category: 'sans' | 'serif' | 'display'
}

export const FONT_LIST: FontDef[] = [
  // ── Sans-serif ───────────────────────────────────────────
  { value: 'Inter',             label: 'Inter',              category: 'sans'    },
  { value: 'Roboto',            label: 'Roboto',             category: 'sans'    },
  { value: 'Open Sans',         label: 'Open Sans',          category: 'sans'    },
  { value: 'Lato',              label: 'Lato',               category: 'sans'    },
  { value: 'Poppins',           label: 'Poppins',            category: 'sans'    },
  { value: 'Nunito',            label: 'Nunito',             category: 'sans'    },
  { value: 'Montserrat',        label: 'Montserrat',         category: 'sans'    },
  { value: 'Raleway',           label: 'Raleway',            category: 'sans'    },
  { value: 'DM Sans',           label: 'DM Sans',            category: 'sans'    },
  { value: 'Outfit',            label: 'Outfit',             category: 'sans'    },
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans',  category: 'sans'    },
  { value: 'Josefin Sans',      label: 'Josefin Sans',       category: 'sans'    },

  // ── Serif ─────────────────────────────────────────────────
  { value: 'Playfair Display',   label: 'Playfair Display',   category: 'serif'   },
  { value: 'Lora',               label: 'Lora',               category: 'serif'   },
  { value: 'Merriweather',       label: 'Merriweather',       category: 'serif'   },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', category: 'serif'   },
  { value: 'EB Garamond',        label: 'EB Garamond',        category: 'serif'   },
  { value: 'Crimson Text',       label: 'Crimson Text',       category: 'serif'   },
  { value: 'DM Serif Display',   label: 'DM Serif Display',   category: 'serif'   },
  { value: 'Libre Baskerville',  label: 'Libre Baskerville',  category: 'serif'   },
  { value: 'Spectral',           label: 'Spectral',           category: 'serif'   },

  // ── Display / Decorative ──────────────────────────────────
  { value: 'Abril Fatface',      label: 'Abril Fatface',      category: 'display' },
  { value: 'Bebas Neue',         label: 'Bebas Neue',         category: 'display' },
  { value: 'Pacifico',           label: 'Pacifico',           category: 'display' },
  { value: 'Righteous',          label: 'Righteous',          category: 'display' },
  { value: 'Lobster',            label: 'Lobster',            category: 'display' },
  { value: 'Satisfy',            label: 'Satisfy',            category: 'display' },
  { value: 'Comfortaa',          label: 'Comfortaa',          category: 'display' },
]

/** Returns the CSS font-family stack for a given font name */
export function getFontStack(font: string): string {
  if (font === 'Inter') return 'Inter, sans-serif'
  return `'${font}', serif`
}

/** Builds a Google Fonts stylesheet URL for multiple fonts */
export function getGoogleFontUrl(fonts: string[]): string {
  const unique = [...new Set(fonts)].filter(f => f !== 'Inter')
  if (unique.length === 0) return ''
  const families = unique
    .map(f => `family=${f.replace(/ /g, '+')}:ital,wght@0,400;0,600;0,700;0,800;1,400`)
    .join('&')
  return `https://fonts.googleapis.com/css2?${families}&display=swap`
}

/** Returns <link> HTML for embedding Google Fonts in a print popup */
export function getGoogleFontLinkTag(fonts: string[]): string {
  const url = getGoogleFontUrl(fonts)
  if (!url) return ''
  return `<link rel="stylesheet" href="${url}" crossorigin="anonymous">`
}
