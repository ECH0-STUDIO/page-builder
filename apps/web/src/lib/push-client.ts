/** Browser-side Web Push helpers for Live Orders. */

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** Register sw-push.js and return its registration (not another SW that may control the page). */
export async function getPushRegistration(): Promise<ServiceWorkerRegistration> {
  await navigator.serviceWorker.register('/sw-push.js', { scope: '/', updateViaCache: 'none' })
  const registration = await navigator.serviceWorker.getRegistration('/')
  if (registration?.active?.scriptURL?.includes('sw-push.js')) {
    return registration
  }
  // Wait for our worker to activate
  const ready = await navigator.serviceWorker.ready
  if (ready.active?.scriptURL?.includes('sw-push.js')) {
    return ready
  }
  return registration ?? ready
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscription> {
  const registration = await getPushRegistration()
  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    await existing.unsubscribe()
  }
  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })
}

export async function getActivePushSubscription(): Promise<PushSubscription | null> {
  try {
    const registration = await getPushRegistration()
    return registration.pushManager.getSubscription()
  } catch {
    return null
  }
}
