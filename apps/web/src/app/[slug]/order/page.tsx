import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import type { MenuGridConfig, PageBlock } from '@/components/page-builder/types'
import { defaultMenuGridConfig, defaultThemeSettings, type ThemeSettings } from '@/components/page-builder/types'
import { MenuGridRender } from '@/components/page-builder/render/MenuGridRender'
import { LiveStoreCart } from '@/components/page-builder/render/LiveStoreCart'
import { CartProvider } from '@/components/page-builder/render/CartContext'
import { buildThemeStyle, resolveThemeTokens } from '@/components/page-builder/theme-tokens'
import { ViewTracker } from '@/components/ViewTracker'
import { getPublicStoreUrl } from '@/lib/site-urls'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { PaymentSettings } from '@/lib/vietqr-utils'
import { resolveLiveLocale } from '@/i18n/locale'
import { normalizeMenuCategories, normalizeMenuItems } from '@/i18n/menu-content'
import { OrderPageHeader } from '@/components/order-page/OrderPageHeader'
import { OrderPromoCarousel } from '@/components/order-page/OrderPromoCarousel'
import { buildPromoSlides } from '@/components/order-page/buildPromoSlides'

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
    .select('seo_title, favicon_url, apple_touch_icon_url')
    .eq('business_id', business.id)
    .single()

  const title = `${business.name} — Order`

  return {
    title,
    description: `Order from ${business.name}`,
    icons: {
      icon: pub?.favicon_url ? [{ url: pub.favicon_url, sizes: '48x48', type: 'image/png' }] : undefined,
      apple: pub?.apple_touch_icon_url ? [{ url: pub.apple_touch_icon_url, sizes: '256x256', type: 'image/png' }] : undefined,
    },
  }
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

  // Prefer menu_grid settings from the published landing page when available
  const publishedMenuBlock = (pageBlocksRaw ?? []).find(b => b.type === 'menu_grid')
  const menuConfig: MenuGridConfig = publishedMenuBlock
    ? {
        ...defaultMenuGridConfig,
        ...(publishedMenuBlock.config as MenuGridConfig),
        category_ids: [],
        selection_mode: 'category',
        item_ids: [],
        heading: '',
        description: '',
      }
    : { ...defaultMenuGridConfig }

  const promoSlides = buildPromoSlides({
    businessName: business.name,
    ogImageUrl: pubSettings?.og_image_url,
    pageBlocks: (pageBlocksRaw ?? []) as PageBlock[],
    menuItems,
  })

  const cookieStore = await cookies()
  const visitorLocale = resolveLiveLocale(
    cookieStore.get('NEXT_LOCALE')?.value,
    pubSettings?.language ?? null,
  )

  const pageUrl = `${getPublicStoreUrl(slug)}/order`

  return (
    <CartProvider>
      <div className="min-h-screen bg-[#f3f4f6] flex flex-col items-center">
        <div
          lang={visitorLocale}
          className="min-h-screen w-full max-w-[1440px] mx-auto relative shadow-2xl flex flex-col bg-white"
          style={{
            fontFamily: bodyFont !== 'Inter' ? `'${bodyFont}', sans-serif` : undefined,
            ...buildThemeStyle(themeForTokens),
          }}
        >
          <ViewTracker slug={slug} />

          <link rel="canonical" href={pageUrl} />
          {pubSettings?.favicon_url && <link rel="icon" href={pubSettings.favicon_url} />}
          {googleFontUrl && <link rel="stylesheet" href={googleFontUrl} />}
          <style dangerouslySetInnerHTML={{ __html: `
            body { font-family: '${bodyFont}', sans-serif !important; }
            h1, h2, h3, h4, h5, h6 { font-family: '${headingFontRaw}', sans-serif !important; }
          ` }} />

          <Suspense fallback={
            <div className="h-14 border-b border-black/6 bg-white/92" />
          }>
            <OrderPageHeader
              slug={slug}
              businessName={business.name}
              logoUrl={business.logo_url}
              brandColor={themeTokens.brandColor}
            />
          </Suspense>

          <OrderPromoCarousel
            slides={promoSlides}
            businessName={business.name}
            brandColor={themeTokens.brandColor}
          />

          <main className="flex-1">
            <MenuGridRender
              config={menuConfig}
              data={{
                categories: menuCategories,
                items: menuItems,
                variantGroups,
                variantOptions,
                businessSlug: slug,
              }}
              brandColor={themeTokens.brandColor}
            />
          </main>

          <LiveStoreCart
            businessId={business.id}
            paymentSettings={paymentSettings}
            locale={visitorLocale}
          />
        </div>
      </div>
    </CartProvider>
  )
}
