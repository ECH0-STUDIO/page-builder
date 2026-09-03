import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { MenuGridConfig, PageBlock } from '@/components/page-builder/types'
import { defaultThemeSettings, type ThemeSettings } from '@/components/page-builder/types'
import { CartProvider } from '@/components/page-builder/render/CartContext'
import { buildThemeStyle, resolveThemeTokens } from '@/components/page-builder/theme-tokens'
import { ViewTracker } from '@/components/ViewTracker'
import { AnalyticsScripts } from '@/components/AnalyticsScripts'
import { buildStoreMetadata } from '@/lib/store-metadata'
import { orderChromeTokens } from '@/lib/color-contrast'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { resolveLiveLocale } from '@/i18n/locale'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import { OrderPageHeader } from '@/components/order-page/OrderPageHeader'
import { OrderPageLive } from '@/components/order-page/OrderPageLive'
import { StoreLanguageSwitcher } from '@/components/store/StoreLanguageSwitcher'
import { loadStoreLocaleAccess, allPublicLocales } from '@/lib/store-locale-access'
import { toStoreLocaleCode } from '@/i18n/store-locales'
import { resolvePromoSlides } from '@/components/order-page/buildPromoSlides'
import {
  normalizeCarouselAspect,
  normalizeCarouselAspectMobile,
  normalizeOrderPromoSlides,
} from '@/components/order-page/promo-slides'
import {
  normalizeOrderMenuConfig,
  resolveOrderMenuConfig,
} from '@/components/order-page/order-menu-config'
import {
  formatHoursRange,
  getTodayHours,
  isBusinessOpenNow,
  normalizeOpeningHours,
} from '@/lib/opening-hours'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
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
      'seo_title, favicon_url, apple_touch_icon_url, gsc_verification, custom_domain, custom_domain_verified',
    )
    .eq('business_id', business.id)
    .single()

  return buildStoreMetadata({
    slug,
    businessName: business.name,
    pub: pub as Parameters<typeof buildStoreMetadata>[0]['pub'],
    title: `${business.name} — Order`,
    description: `Order from ${business.name}`,
    pathSuffix: '/order',
  })
}

export default async function OrderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
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

  // Order page has its own publish flag (falls back to landing if column not migrated)
  const orderPublished =
    pubSettings?.order_published == null
      ? Boolean(pubSettings?.published)
      : Boolean(pubSettings.order_published)
  if (!orderPublished) notFound()

  // Brand/fonts always come from live theme_settings so Order Page edits apply immediately
  const publishedBlocks = pubSettings?.published_blocks as PageBlock[] | null | undefined
  const [blocksRes, liveThemeRes] = await Promise.all([
    publishedBlocks
      ? Promise.resolve({ data: null })
      : db.from('page_blocks')
        .select('*')
        .eq('business_id', business.id)
        .eq('visible', true)
        .order('sort_order', { ascending: true }),
    db.from('theme_settings')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle(),
  ])

  const pageBlocksRaw: PageBlock[] = publishedBlocks
    ? publishedBlocks.filter(b => b.visible)
    : ((blocksRes.data as PageBlock[] | null) ?? [])

  const themeRaw = liveThemeRes.data ?? pubSettings?.published_theme
  const bodyFont: string = themeRaw?.font_family ?? 'Inter'
  const headingFontRaw: string = themeRaw?.heading_font_family ?? 'Inter'
  const themeForTokens: Partial<ThemeSettings> = {
    primary_color: themeRaw?.primary_color ?? defaultThemeSettings.primary_color,
    background_color: themeRaw?.background_color ?? defaultThemeSettings.background_color,
    text_color: themeRaw?.text_color ?? defaultThemeSettings.text_color,
  }
  const themeTokens = resolveThemeTokens(themeForTokens)
  const paymentSettings: PaymentSettings = (business.payment_settings as PaymentSettings | null) ?? {}

  const fontsToLoad = [...new Set([bodyFont, headingFontRaw])]
  const googleFontUrl = fontsToLoad.length > 0
    ? `https://fonts.googleapis.com/css2?${fontsToLoad.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    : null

  // Always load full menu for the order page
  const [{ data: cats }, { data: itms }] = await Promise.all([
    db.from('menu_categories').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
    db.from('menu_items').select('*').eq('business_id', business.id).order('sort_order', { ascending: true }),
  ])
  const menuCategories: MenuCategory[] = normalizeMenuCategories((cats ?? []) as Record<string, unknown>[])
  const menuItems: MenuItem[] = normalizeMenuItems((itms ?? []) as Record<string, unknown>[])

  let variantGroups: VariantGroup[] = []
  let variantOptions: VariantOption[] = []

  if (menuItems.length > 0) {
    const itemIds = menuItems.map((i: MenuItem) => i.id)
    for (let i = 0; i < itemIds.length; i += 50) {
      const chunk = itemIds.slice(i, i + 50)
      const { data: vGroups } = await db.from('menu_item_variant_groups').select('*').in('item_id', chunk).order('sort_order')
      if (vGroups) variantGroups.push(...vGroups)
    }
    if (variantGroups.length > 0) {
      const groupIds = variantGroups.map((g: VariantGroup) => g.id)
      for (let i = 0; i < groupIds.length; i += 50) {
        const chunk = groupIds.slice(i, i + 50)
        const { data: vOpts } = await db.from('menu_item_variant_options').select('*').in('group_id', chunk).order('sort_order')
        if (vOpts) variantOptions.push(...vOpts)
      }
    }
  }

  // Prefer dedicated order menu config; else landing menu_grid styling with all items
  const publishedMenuBlock = (pageBlocksRaw ?? []).find(b => b.type === 'menu_grid')
  const menuConfigBase: MenuGridConfig = resolveOrderMenuConfig({
    configured: normalizeOrderMenuConfig(
      (pubSettings as { order_menu_config?: unknown } | null)?.order_menu_config,
    ),
    landingMenuGrid: publishedMenuBlock
      ? (publishedMenuBlock.config as MenuGridConfig)
      : null,
  })
  // Order page menu styling — card text stays dark on white cards.
  const menuConfig: MenuGridConfig = {
    ...menuConfigBase,
  }

  const promoSlides = resolvePromoSlides({
    configured: normalizeOrderPromoSlides(
      (pubSettings as { order_promo_slides?: unknown } | null)?.order_promo_slides,
    ),
    businessName: business.name,
  })

  const carouselDesktop = normalizeCarouselAspect(
    (pubSettings as { order_carousel_aspect_desktop?: unknown } | null)
      ?.order_carousel_aspect_desktop,
    '16/9',
  )
  const carouselMobile = normalizeCarouselAspectMobile(
    (pubSettings as { order_carousel_aspect_mobile?: unknown } | null)
      ?.order_carousel_aspect_mobile ?? 'same',
  )

  const cookieStore = await cookies()
  const visitorLocale = resolveLiveLocale(
    cookieStore.get('NEXT_LOCALE')?.value,
    pubSettings?.language ?? null,
  )

  const orderBgColor =
    (pubSettings as { order_background_color?: string | null } | null)?.order_background_color
    || '#ffffff'
  const orderBgImage =
    (pubSettings as { order_background_image_url?: string | null } | null)?.order_background_image_url
    || null
  const orderChrome = orderChromeTokens(orderBgColor, themeTokens.brandColor)

  const openingHours = normalizeOpeningHours(business.opening_hours)
  const orderingOpen = isBusinessOpenNow(openingHours)
  const todayHoursLabel = formatHoursRange(getTodayHours(openingHours))

  const localeAccess = await loadStoreLocaleAccess(slug)
  const primaryLocale = localeAccess?.primary ?? toStoreLocaleCode(pubSettings?.language)
  const publicLocales = localeAccess ? allPublicLocales(localeAccess) : [primaryLocale]

  return (
    <CartProvider>
      <div
        className="min-h-screen flex flex-col items-center"
        style={
          orderBgImage
            ? {
                backgroundImage: `linear-gradient(rgba(0,0,0,0.35), rgba(0,0,0,0.35)), url(${orderBgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundColor: orderBgColor,
              }
            : { backgroundColor: orderBgColor }
        }
      >
        <div
          lang={visitorLocale}
          className="min-h-screen w-full max-w-[430px] md:max-w-5xl mx-auto relative flex flex-col"
          style={{
            fontFamily: bodyFont !== 'Inter' ? `'${bodyFont}', sans-serif` : undefined,
            ...buildThemeStyle(themeForTokens),
            backgroundColor: orderBgColor,
          }}
        >
          <ViewTracker slug={slug} />

          {publicLocales.length > 1 && (
            <Suspense fallback={null}>
              <StoreLanguageSwitcher
                slug={slug}
                primary={primaryLocale}
                locales={publicLocales}
                kind="order"
              />
            </Suspense>
          )}

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

          <Suspense fallback={
            <div className="h-14 border-b border-black/6 bg-white" />
          }>
            <OrderPageHeader
              slug={slug}
              businessName={business.name}
              logoUrl={business.logo_url}
              brandColor={themeTokens.brandColor}
              chrome={orderChrome}
            />
          </Suspense>

          <OrderPageLive
            businessId={business.id}
            businessName={business.name}
            brandColor={themeTokens.brandColor}
            bgColor={orderBgColor}
            promoSlides={promoSlides}
            aspectDesktop={carouselDesktop}
            aspectMobile={carouselMobile}
            menuConfig={menuConfig}
            categories={menuCategories}
            items={menuItems}
            variantGroups={variantGroups}
            variantOptions={variantOptions}
            slug={slug}
            paymentSettings={paymentSettings}
            locale={visitorLocale}
            orderingOpen={orderingOpen}
            todayHoursLabel={todayHoursLabel}
          />
        </div>
      </div>
    </CartProvider>
  )
}
