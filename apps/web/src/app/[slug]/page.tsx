import { notFound, redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import Script from 'next/script'
import type { Metadata } from 'next'
import type { PageBlock, HeroConfig, TextImageConfig, ContactConfig, MenuGridConfig, NavbarConfig, QRCodeConfig } from '@/components/page-builder/types'
import { HeroRender } from '@/components/page-builder/render/HeroRender'
import { TextImageRender } from '@/components/page-builder/render/TextImageRender'
import { ContactRender } from '@/components/page-builder/render/ContactRender'
import { NavbarRender } from '@/components/page-builder/render/NavbarRender'
import { MenuGridRender } from '@/components/page-builder/render/MenuGridRender'
import { QRCodeRender } from '@/components/page-builder/render/QRCodeRender'
import { FooterRender } from '@/components/page-builder/render/FooterRender'
import { BrowseOnlyCartProvider } from '@/components/page-builder/render/CartContext'
import { defaultNavbarConfig, defaultFooterConfig, defaultThemeSettings, type FooterConfig, type ThemeSettings } from '@/components/page-builder/types'
import { resolveBlockSpacing } from '@/components/page-builder/spacing-utils'
import { getBlockSurfaceLayers } from '@/components/page-builder/block-section-style'
import { SectionShellOverlay, SectionShellContent } from '@/components/page-builder/SectionShellOverlay'
import { buildThemeStyle, resolveThemeTokens } from '@/components/page-builder/theme-tokens'
import { scopeCSS } from '@/lib/scope-css'
import { ViewTracker } from '@/components/ViewTracker'
import { AnalyticsScripts } from '@/components/AnalyticsScripts'
import {
  buildRestaurantSchema, buildMenuSchema, buildWebSiteSchema, serializeSchemas,
} from '@/lib/schema'
import { resolvePublicStoreUrl } from '@/lib/site-urls'
import { buildStoreMetadata } from '@/lib/store-metadata'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { resolveLiveLocale } from '@/i18n/locale'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'

// ─── SEO ──────────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: business } = await db
    .from('businesses')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!business) return { title: 'Not Found' }

  const { data: pub } = await db
    .from('publishing_settings')
    .select(
      'seo_title, seo_description, og_image_url, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified',
    )
    .eq('business_id', business.id)
    .single()

  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
  })
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const tableParam = (sp.table ?? '').trim()
  if (tableParam) {
    redirect(`/${slug}/order?table=${encodeURIComponent(tableParam)}`)
  }

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase

  const { data: business } = await db
    .from('businesses')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!business) notFound()

  const { data: pubSettings } = await db
    .from('publishing_settings')
    .select('*')
    .eq('business_id', business.id)
    .single()

  if (!pubSettings?.published) notFound()

  let pageBlocksRaw = pubSettings?.published_blocks as PageBlock[] | null | undefined
  let themeRaw = pubSettings?.published_theme

  if (!pageBlocksRaw || !themeRaw) {
    const [blocksRes, themeRes] = await Promise.all([
      db.from('page_blocks')
        .select('*')
        .eq('business_id', business.id)
        .eq('visible', true)
        .order('sort_order', { ascending: true }),
      db.from('theme_settings')
        .select('*')
        .eq('business_id', business.id)
        .maybeSingle(),
    ])
    pageBlocksRaw = (blocksRes.data as PageBlock[]) ?? []
    themeRaw = themeRes.data
  } else {
    pageBlocksRaw = pageBlocksRaw.filter(b => b.visible)
  }

  const bodyFont: string = themeRaw?.font_family ?? 'Inter'
  const headingFontRaw: string = themeRaw?.heading_font_family ?? 'Inter'
  const themeForTokens: Partial<ThemeSettings> = {
    primary_color: themeRaw?.primary_color ?? defaultThemeSettings.primary_color,
    background_color: themeRaw?.background_color ?? defaultThemeSettings.background_color,
    text_color: themeRaw?.text_color ?? defaultThemeSettings.text_color,
  }
  const themeTokens = resolveThemeTokens(themeForTokens)
  const navbarConfig: NavbarConfig = (themeRaw?.navbar_config as NavbarConfig | null) ?? defaultNavbarConfig
  const footerConfig: FooterConfig = (themeRaw?.footer_config as FooterConfig | null) ?? defaultFooterConfig

  // Payment settings — VietQR is stored directly on the business row
  const paymentSettings: PaymentSettings = (business.payment_settings as PaymentSettings | null) ?? {}

  const fontsToLoad = [...new Set([bodyFont, headingFontRaw])]
  const googleFontUrl = fontsToLoad.length > 0
    ? `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    : null

  const pageBlocks: PageBlock[] = (pageBlocksRaw ?? []).map(b => ({
    ...b,
    spacing: resolveBlockSpacing(
      b.type,
      b.spacing,
      b.type === 'hero' ? { heroConfig: b.config as HeroConfig } : undefined,
    ),
    custom_css: b.custom_css ?? '',
    block_anchor_id: b.block_anchor_id ?? null,
  }))

  // Fetch menu data only if page has a menu_grid block
  const hasMenuGrid = pageBlocks.some(b => b.type === 'menu_grid')
  let menuCategories: MenuCategory[] = []
  let menuItems: MenuItem[] = []
  let variantGroups: VariantGroup[] = []
  let variantOptions: VariantOption[] = []

  if (hasMenuGrid) {
    const [{ data: cats }, { data: itms }] = await Promise.all([
      db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
      db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    ])
    menuCategories = normalizeMenuCategories((cats ?? []) as Record<string, unknown>[])
    menuItems = normalizeMenuItems((itms ?? []) as Record<string, unknown>[])

    if (menuItems.length > 0) {
      const itemIds = menuItems.map((i: MenuItem) => i.id)
      variantGroups = []
      for (let i = 0; i < itemIds.length; i += 50) {
        const chunk = itemIds.slice(i, i + 50)
        const { data: vGroups } = await db.from('menu_item_variant_groups').select('*').in('item_id', chunk).order('sort_order')
        if (vGroups) variantGroups.push(...vGroups)
      }
      if (variantGroups.length > 0) {
        const groupIds = variantGroups.map((g: VariantGroup) => g.id)
        variantOptions = []
        for (let i = 0; i < groupIds.length; i += 50) {
          const chunk = groupIds.slice(i, i + 50)
          const { data: vOpts } = await db.from('menu_item_variant_options').select('*').in('group_id', chunk).order('sort_order')
          if (vOpts) variantOptions.push(...vOpts)
        }
      }
    }
  }

  // Resolved public store URL for QR Code blocks and schema.org (custom domain when verified)
  const storePub = {
    custom_domain: pubSettings?.custom_domain ?? null,
    custom_domain_verified: Boolean(
      (pubSettings as { custom_domain_verified?: boolean | null } | null)?.custom_domain_verified,
    ),
  }
  const storeUrl = resolvePublicStoreUrl(slug, storePub)

  // ─── Schema.org JSON-LD ─────────────────────────────────────────────────────
  const pubInfo = {
    seo_title: pubSettings?.seo_title ?? null,
    seo_description: pubSettings?.seo_description ?? null,
    og_image_url: pubSettings?.og_image_url ?? null,
  }
  const schemas: object[] = [
    buildRestaurantSchema(business, pubInfo, storeUrl),
    buildWebSiteSchema(business, pubInfo, storeUrl),
  ]
  if (hasMenuGrid && menuCategories.length > 0) {
    schemas.push(buildMenuSchema(business, pubInfo, menuCategories, menuItems, storeUrl))
  }
  const schemaJson = serializeSchemas(schemas)

  const cookieStore = await cookies()
  const visitorLocale = resolveLiveLocale(
    cookieStore.get('NEXT_LOCALE')?.value,
    pubSettings?.language ?? null,
  )

  return (
    <BrowseOnlyCartProvider>
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center">
    <div
      lang={visitorLocale}
      className="min-h-screen w-full max-w-[1440px] mx-auto relative shadow-2xl flex flex-col"
      style={{
        fontFamily: bodyFont !== 'Inter' ? `'${bodyFont}', sans-serif` : undefined,
        ...buildThemeStyle(themeForTokens),
      }}
    >
      {/* Silent visit tracker */}
      <ViewTracker slug={slug} />

      {/* Schema.org JSON-LD + analytics (GSC/canonical/icons come from generateMetadata → <head>) */}
      <Script id="schema-json" type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />

      <AnalyticsScripts
        google_analytics_id={pubSettings?.google_analytics_id}
        facebook_pixel_id={pubSettings?.facebook_pixel_id}
        tiktok_pixel_id={pubSettings?.tiktok_pixel_id}
      />

      {/* Google Fonts & Typography */}
      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: '${bodyFont}', sans-serif !important; }
        h1, h2, h3, h4, h5, h6 { font-family: '${headingFontRaw}', sans-serif !important; }
      ` }} />

      {/* Permanent navbar */}
      <NavbarRender
        config={navbarConfig}
        businessName={business.name}
        logoUrl={business.logo_url ?? undefined}
      />

      <main>
        {pageBlocks
          .filter(b => (b.type as string) !== 'navbar')
          .map(block => {
            const { margin, shell, contentInset, overlayOpacity } = getBlockSurfaceLayers(block)

            return (
              <div
                key={block.id}
                id={block.block_anchor_id ?? `block-${block.id}`}
                style={margin}
              >
                {block.custom_css && (
                  <style dangerouslySetInnerHTML={{
                    __html: scopeCSS(block.custom_css, `[data-live-block="${block.id}"]`),
                  }} />
                )}
                <div data-live-block={block.id} style={shell}>
                  <SectionShellOverlay opacity={overlayOpacity} />
                  <SectionShellContent overlayOpacity={overlayOpacity}>
                  {block.type === 'hero' && (
                    <HeroRender
                      config={block.config as HeroConfig}
                      businessName={business.name}
                      brandColor={themeTokens.brandColor}
                      contentInset={contentInset}
                    />
                  )}
                  {block.type === 'text_image' && (
                    <TextImageRender
                      config={block.config as TextImageConfig}
                      brandColor={themeTokens.brandColor}
                      defaultTextColor={themeTokens.pageText}
                    />
                  )}
                  {block.type === 'contact' && (
                    <ContactRender
                      config={block.config as ContactConfig}
                      business={business}
                    />
                  )}
                  {block.type === 'menu_grid' && (
                    <MenuGridRender
                      config={block.config as MenuGridConfig}
                      data={{
                        categories: menuCategories,
                        items: menuItems,
                        variantGroups,
                        variantOptions,
                        businessSlug: slug,
                      }}
                      brandColor={themeTokens.brandColor}
                      browseOnly
                    />
                  )}
                  {block.type === 'qr_code' && (() => {
                    const qrConfig = block.config as QRCodeConfig
                    const targetUrl = qrConfig.target === 'custom' && qrConfig.custom_url
                      ? qrConfig.custom_url
                      : storeUrl
                    return <QRCodeRender config={qrConfig} targetUrl={targetUrl} paymentSettings={paymentSettings} />
                  })()}
                  </SectionShellContent>
                </div>
              </div>
            )
          })}
      </main>

      {/* Permanent footer */}
      <FooterRender
        config={footerConfig}
        businessName={business.name}
        logoUrl={business.logo_url}
      />

      {/* Landing is browse-only — cart/order lives on /{slug}/order */}
    </div>
    </div>
    </BrowseOnlyCartProvider>
  )
}
