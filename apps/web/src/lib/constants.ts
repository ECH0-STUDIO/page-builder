// Business categories and tags — edit here to add/remove options
// These are used in the onboarding wizard, business profile, and marketplace filtering

export const BUSINESS_CATEGORIES = [
  { value: 'cafe',       label: 'Cafe & Coffee' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'fast_food',  label: 'Fast Food & Street Food' },
  { value: 'bakery',     label: 'Bakery & Desserts' },
  { value: 'bar',        label: 'Bar & Drinks' },
  { value: 'service',    label: 'Service Business' },
  { value: 'retail',     label: 'Retail Shop' },
  { value: 'beauty',     label: 'Beauty & Spa' },
  { value: 'other',      label: 'Other' },
] as const

export const BUSINESS_TAGS = [
  'Dine-in',
  'Takeaway',
  'Delivery',
  'Vegetarian-friendly',
  'Halal',
  'WiFi',
  'Parking',
  'Air-conditioned',
  'Family-friendly',
  'Pet-friendly',
  'Rooftop',
  'Live music',
  'Open late',
  'Open 24/7',
] as const

export const DAYS_OF_WEEK = [
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',  label: 'Tuesday' },
  { key: 'wednesday',label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday',   label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday',   label: 'Sunday' },
] as const

export const HOURS = Array.from({ length: 24 }, (_, i) => {
  const h = i.toString().padStart(2, '0')
  return [
    { value: `${h}:00`, label: `${h}:00` },
    { value: `${h}:30`, label: `${h}:30` },
  ]
}).flat()

export const SOCIAL_LINKS_CONFIG = [
  { key: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/yourpage' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourhandle' },
  { key: 'zalo',      label: 'Zalo',      placeholder: 'https://zalo.me/yourpage' },
  { key: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@yourhandle' },
  { key: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@yourchannel' },
] as const

export type CategoryValue = typeof BUSINESS_CATEGORIES[number]['value']
export type SocialKey = typeof SOCIAL_LINKS_CONFIG[number]['key']
