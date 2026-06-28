import { notFound } from 'next/navigation'
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
import { PaymentDrawer } from '@/components/page-builder/render/PaymentDrawer'
import { LiveStoreCart } from '@/components/page-builder/render/LiveStoreCart'
import { CartProvider } from '@/components/page-builder/render/CartContext'
import { defaultSpacing, defaultNavbarConfig, defaultFooterConfig, type FooterConfig } from '@/components/page-builder/types'
import { scopeCSS } from '@/lib/scope-css'
import { ViewTracker } from '@/components/ViewTracker'
import {
  buildRestaurantSchema, buildMenuSchema, buildWebSiteSchema, serializeSchemas,
} from '@/lib/schema'
import { getMarketingBaseUrl, getPublicStoreUrl, isSplitDomainDeployment, getAppBaseUrl } from '@/lib/site-urls'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'

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
    .select('seo_title, seo_description, og_image_url, favicon_url, apple_touch_icon_url')
    .eq('business_id', business.id)
    .single()

  const title = pub?.seo_title || business.name
  const description = pub?.seo_description || `Visit ${business.name} — menu, contact, and more.`

  return {
    title,
    description,
    openGraph: pub?.og_image_url
      ? { title, description, images: [{ url: pub.og_image_url }] }
      : undefined,
    icons: {
      icon: pub?.favicon_url ? [{ url: pub.favicon_url, sizes: '48x48', type: 'image/png' }] : undefined,
      apple: pub?.apple_touch_icon_url ? [{ url: pub.apple_touch_icon_url, sizes: '256x256', type: 'image/png' }] : undefined,
    },
  }
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function SlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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
        .select('font_family, heading_font_family, navbar_config, footer_config')
        .eq('business_id', business.id)
        .single(),
    ])
    pageBlocksRaw = (blocksRes.data as PageBlock[]) ?? []
    themeRaw = themeRes.data
  } else {
    pageBlocksRaw = pageBlocksRaw.filter(b => b.visible)
  }

  const bodyFont: string = themeRaw?.font_family ?? 'Inter'
  const headingFontRaw: string = themeRaw?.heading_font_family ?? 'Inter'
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
    spacing: b.spacing ?? defaultSpacing,
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
    menuCategories = cats ?? []
    menuItems = itms ?? []

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

  // Resolved base URL for QR Code blocks and schema.org
  const baseUrl = isSplitDomainDeployment() ? getMarketingBaseUrl() : getAppBaseUrl()
  const pageUrl = getPublicStoreUrl(slug)

  // ─── Schema.org JSON-LD ─────────────────────────────────────────────────────
  const pubInfo = {
    seo_title: pubSettings?.seo_title ?? null,
    seo_description: pubSettings?.seo_description ?? null,
    og_image_url: pubSettings?.og_image_url ?? null,
  }
  const schemas: object[] = [
    buildRestaurantSchema(business, pubInfo, baseUrl),
    buildWebSiteSchema(business, pubInfo, baseUrl),
  ]
  if (hasMenuGrid && menuCategories.length > 0) {
    schemas.push(buildMenuSchema(business, pubInfo, menuCategories, menuItems, baseUrl))
  }
  const schemaJson = serializeSchemas(schemas)

  // Language for html[lang]
  const pageLanguage = pubSettings?.language ?? 'en'

  return (
    <CartProvider>
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center">
    <div
      lang={pageLanguage}
      className="min-h-screen bg-white w-full max-w-[1440px] mx-auto relative shadow-2xl overflow-hidden flex flex-col"
      style={{ fontFamily: bodyFont !== 'Inter' ? `'${bodyFont}', sans-serif` : undefined }}
    >
      {/* Silent visit tracker */}
      <ViewTracker slug={slug} />

      {/* ── SEO head tags ── */}
      <link rel="canonical" href={pageUrl} />
      {pubSettings?.favicon_url && <link rel="icon" href={pubSettings.favicon_url} />}
      {pubSettings?.apple_touch_icon_url && <link rel="apple-touch-icon" href={pubSettings.apple_touch_icon_url} />}
      {pubSettings?.gsc_verification && (
        <meta name="google-site-verification" content={pubSettings.gsc_verification} />
      )}
      <link rel="alternate" hrefLang={pageLanguage} href={pageUrl} />
      {/* Twitter card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pubSettings?.seo_title || business.name} />
      {pubSettings?.seo_description && <meta name="twitter:description" content={pubSettings.seo_description} />}
      {pubSettings?.og_image_url && <meta name="twitter:image" content={pubSettings.og_image_url} />}
      {/* Schema.org JSON-LD */}
      <Script id="schema-json" type="application/ld+json" dangerouslySetInnerHTML={{ __html: schemaJson }} />

      {/* Analytics & Tracking */}
      {(pubSettings as any)?.google_analytics_id && (
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${(pubSettings as any).google_analytics_id}`}
          strategy="afterInteractive"
        />
      )}
      {(pubSettings as any)?.google_analytics_id && (
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${(pubSettings as any).google_analytics_id}');
          `}
        </Script>
      )}

      {(pubSettings as any)?.facebook_pixel_id && (
        <Script id="facebook-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${(pubSettings as any).facebook_pixel_id}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}

      {(pubSettings as any)?.tiktok_pixel_id && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`
            !function (w, d, t) {
              w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
              ttq.load('${(pubSettings as any).tiktok_pixel_id}');
              ttq.page();
            }(window, document, 'ttq');
          `}
        </Script>
      )}

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
            const spacing = block.spacing ?? defaultSpacing
            const blockStyle: React.CSSProperties = {
              marginTop: spacing.margin_top,
              marginBottom: spacing.margin_bottom,
            }
            const innerStyle: React.CSSProperties = {
              paddingTop: spacing.padding_top,
              paddingRight: spacing.padding_right,
              paddingBottom: spacing.padding_bottom,
              paddingLeft: spacing.padding_left,
            }

            return (
              <div
                key={block.id}
                id={block.block_anchor_id ?? `block-${block.id}`}
                style={blockStyle}
              >
                {block.custom_css && (
                  <style dangerouslySetInnerHTML={{
                    __html: scopeCSS(block.custom_css, `[data-live-block="${block.id}"]`),
                  }} />
                )}
                <div data-live-block={block.id} style={innerStyle}>
                  {block.type === 'hero' && (
                    <HeroRender config={block.config as HeroConfig} businessName={business.name} />
                  )}
                  {block.type === 'text_image' && (
                    <TextImageRender config={block.config as TextImageConfig} />
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
                    />
                  )}
                  {block.type === 'qr_code' && (() => {
                    const qrConfig = block.config as QRCodeConfig
                    const targetUrl = qrConfig.target === 'custom' && qrConfig.custom_url
                      ? qrConfig.custom_url
                      : `${baseUrl}/${slug}`
                    return <QRCodeRender config={qrConfig} targetUrl={targetUrl} paymentSettings={paymentSettings} />
                  })()}
                </div>
              </div>
            )
          })}
      </main>

      {/* Permanent footer */}
      <FooterRender
        config={footerConfig}
        businessName={business.name}
      />

      <LiveStoreCart businessId={business.id} paymentSettings={paymentSettings} />
    </div>
    </div>
    </CartProvider>
  )
}
