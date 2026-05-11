/**
 * schema.ts — Schema.org JSON-LD builders for the live page
 *
 * Auto-generated from existing page/business data.
 * Not user-editable — injected as <script type="application/ld+json"> in <head>.
 */

interface OpeningHour {
  day: string
  open: boolean
  from: string
  to: string
}

interface Business {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string | null
  city: string | null
  phone: string | null
  email: string | null
  opening_hours: OpeningHour[] | null
  social_links: Record<string, string> | null
}

interface PublishingInfo {
  seo_title: string | null
  seo_description: string | null
  og_image_url: string | null
}

interface MenuCategory {
  id: string
  name: string
}

interface MenuItem {
  category_id: string
  name: string
  description: string | null
  price: number
}

// Day-of-week abbreviations for schema.org openingHoursSpecification
const DAY_MAP: Record<string, string> = {
  monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
  thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
}

// ─── RestaurantSchema ─────────────────────────────────────────────────────────

export function buildRestaurantSchema(
  business: Business,
  pub: PublishingInfo,
  baseUrl: string
): object {
  const pageUrl = `${baseUrl}/${business.slug}`

  // Build social sameAs array from non-empty social links
  const sameAs = Object.values(business.social_links ?? {}).filter(Boolean)

  // Build opening hours spec
  const openingHoursSpec = (business.opening_hours ?? [])
    .filter((h: OpeningHour) => h.open && h.from && h.to)
    .map((h: OpeningHour) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${DAY_MAP[h.day.toLowerCase()] ?? h.day}`,
      opens: h.from,
      closes: h.to,
    }))

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': ['Restaurant', 'LocalBusiness'],
    name: pub.seo_title || business.name,
    url: pageUrl,
    ...(business.logo_url && { logo: business.logo_url }),
    ...(pub.og_image_url && { image: pub.og_image_url }),
    ...(pub.seo_description && { description: pub.seo_description }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
  }

  if (business.address || business.city) {
    schema.address = {
      '@type': 'PostalAddress',
      ...(business.address && { streetAddress: business.address }),
      ...(business.city && { addressLocality: business.city }),
    }
  }

  if (openingHoursSpec.length > 0) {
    schema.openingHoursSpecification = openingHoursSpec
  }

  if (sameAs.length > 0) schema.sameAs = sameAs

  // Link to the menu page itself (self-referential)
  schema.hasMenu = {
    '@type': 'Menu',
    url: pageUrl,
  }

  return schema
}

// ─── MenuSchema ───────────────────────────────────────────────────────────────

export function buildMenuSchema(
  business: Business,
  pub: PublishingInfo,
  categories: MenuCategory[],
  items: MenuItem[],
  baseUrl: string
): object {
  const pageUrl = `${baseUrl}/${business.slug}`

  const menuSections = categories
    .map(cat => {
      const catItems = items.filter(i => i.category_id === cat.id)
      if (catItems.length === 0) return null
      return {
        '@type': 'MenuSection',
        name: cat.name,
        hasMenuItem: catItems.map(item => ({
          '@type': 'MenuItem',
          name: item.name,
          ...(item.description && { description: item.description }),
          offers: {
            '@type': 'Offer',
            price: item.price,
            priceCurrency: 'VND',
          },
        })),
      }
    })
    .filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${pub.seo_title || business.name} — Menu`,
    url: pageUrl,
    ...(menuSections.length > 0 && { hasMenuSection: menuSections }),
  }
}

// ─── WebSiteSchema ────────────────────────────────────────────────────────────

export function buildWebSiteSchema(business: Business, pub: PublishingInfo, baseUrl: string): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: pub.seo_title || business.name,
    url: `${baseUrl}/${business.slug}`,
  }
}

// ─── Serialize all schemas as a single array ──────────────────────────────────

export function serializeSchemas(schemas: object[]): string {
  return JSON.stringify(schemas.length === 1 ? schemas[0] : schemas, null, 0)
}
