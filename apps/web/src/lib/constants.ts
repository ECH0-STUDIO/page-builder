// Business tags — edit here to add/remove amenity options (business profile)

/** Default `businesses.category` for new businesses (restaurant MVP). */
export const DEFAULT_BUSINESS_CATEGORY = ['restaurant'] as const

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

export type SocialKey = typeof SOCIAL_LINKS_CONFIG[number]['key']
