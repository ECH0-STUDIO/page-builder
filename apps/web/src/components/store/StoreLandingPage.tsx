import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Script from 'next/script'
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
import { resolvePublicStoreUrl, resolveQrCustomUrl } from '@/lib/site-urls'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { resolveLiveLocale, type SupportedLocale } from '@/i18n/locale'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import { languageConfigFromPublishing } from '@/lib/store-routing'
import type { StoreLanguageConfig } from '@/i18n/store-locale'
import { StoreLanguageSwitcher } from '@/components/store/StoreLanguageSwitcher'

export interface StoreLandingPageProps {
  slug: string
  pathLocale?: SupportedLocale | null
  languageConfig?: StoreLanguageConfig
  tableRedirect?: string | null
}

export async function StoreLandingPage({
  slug,
  pathLocale = null,
  languageConfig: languageConfigProp,
  tableRedirect,
}: StoreLandingPageProps) {
  if (tableRedirect) {
    redirect(tableRedirect)
  }

  const supabase = await createClient()
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

  const languageConfig = languageConfigProp ?? languageConfigFromPublishing(pubSettings)
  const primaryLocale = languageConfig.primary_locale
  const visitorLocale = resolveLiveLocale({
    pathLocale,
    storePrimary: primaryLocale,
    dualEnabled: languageConfig.dual_language_enabled,
  })

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

  const storePub = {
    custom_domain: pubSettings?.custom_domain ?? null,
    custom_domain_verified: Boolean(
      (pubSettings as { custom_domain_verified?: boolean | null } | null)?.custom_domain_verified,
    ),
  }
  const storeUrl = resolvePublicStoreUrl(slug, storePub)

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

  const renderLocale = { locale: visitorLocale, primaryLocale }

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
      <ViewTracker slug={slug} />

      <Script id="schema-json" type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />

      <AnalyticsScripts
        google_analytics_id={pubSettings?.google_analytics_id}
        facebook_pixel_id={pubSettings?.facebook_pixel_id}
        tiktok_pixel_id={pubSettings?.tiktok_pixel_id}
      />

      {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
      <style dangerouslySetInnerHTML={{ __html: `
        body { font-family: '${bodyFont}', sans-serif !important; }
        h1, h2, h3, h4, h5, h6 { font-family: '${headingFontRaw}', sans-serif !important; }
      ` }} />

      <NavbarRender
        config={navbarConfig}
        businessName={business.name}
        logoUrl={business.logo_url ?? undefined}
        {...renderLocale}
        languageSwitcher={
          <StoreLanguageSwitcher
            slug={slug}
            currentLocale={visitorLocale}
            languageConfig={languageConfig}
            kind="landing"
          />
        }
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
                      {...renderLocale}
                    />
                  )}
                  {block.type === 'text_image' && (
                    <TextImageRender
                      config={block.config as TextImageConfig}
                      brandColor={themeTokens.brandColor}
                      defaultTextColor={themeTokens.pageText}
                      {...renderLocale}
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
                      {...renderLocale}
                    />
                  )}
                  {block.type === 'qr_code' && (() => {
                    const qrConfig = block.config as QRCodeConfig
                    const targetUrl = qrConfig.target === 'custom' && qrConfig.custom_url
                      ? resolveQrCustomUrl(slug, storePub, storeUrl, qrConfig.custom_url)
                      : storeUrl
                    return (
                      <QRCodeRender
                        config={qrConfig}
                        targetUrl={targetUrl}
                        paymentSettings={paymentSettings}
                        {...renderLocale}
                      />
                    )
                  })()}
                  </SectionShellContent>
                </div>
              </div>
            )
          })}
      </main>

      <FooterRender
        config={footerConfig}
        businessName={business.name}
        logoUrl={business.logo_url}
        {...renderLocale}
      />
    </div>
    </div>
    </BrowseOnlyCartProvider>
  )
}
