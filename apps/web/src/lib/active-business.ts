/** Client + server cookie/localStorage key for the selected business. */
export const ACTIVE_BUSINESS_STORAGE_KEY = 'eatery_current_business_id'

/** Persist active business on the client (cookie + localStorage). */
export function setActiveBusinessId(id: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_BUSINESS_STORAGE_KEY, id)
  document.cookie = `${ACTIVE_BUSINESS_STORAGE_KEY}=${id}; path=/; max-age=31536000; SameSite=Lax`
}
