/** Puck-only chrome components (not stored in page_blocks). */
export const SITE_NAVBAR = 'site_navbar' as const
export const SITE_FOOTER = 'site_footer' as const

export const CHROME_BLOCK_TYPES = [SITE_NAVBAR, SITE_FOOTER] as const
export type ChromeBlockType = (typeof CHROME_BLOCK_TYPES)[number]

export const SITE_NAVBAR_ID = 'site-navbar'
export const SITE_FOOTER_ID = 'site-footer'

export const ROOT_ZONE = 'root:default-zone'
