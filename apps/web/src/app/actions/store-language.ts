'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { assertOwnerOrManager } from '@/lib/business-auth'
import { isSupportedLocale, type SupportedLocale } from '@/i18n/locale'
import {
  enabledLocalesForPrimary,
  parseStoreLanguageConfig,
  type StoreLanguageConfig,
} from '@/i18n/store-locale'
import { runDualLanguageSetup } from '@/lib/dual-language-setup'
import { revalidateLiveStorePaths } from '@/lib/revalidate-store'

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

async function loadPublishingRow(db: Awaited<ReturnType<typeof createClient>>, businessId: string) {
  const { data, error } = await db
    .from('publishing_settings')
    .select(
      'language, dual_language_enabled, dual_language_setup_status, enabled_locales',
    )
    .eq('business_id', businessId)
    .single()
  if (error) return { error: error.message, data: null }
  return { error: null, data }
}

export async function getStoreLanguageSettingsAction(
  businessId: string,
): Promise<ActionResult<StoreLanguageConfig>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: 'Forbidden' }

  const { data, error } = await loadPublishingRow(supabase, businessId)
  if (error || !data) return { success: false, error: error ?? 'Settings not found' }

  return { success: true, data: parseStoreLanguageConfig(data) }
}

export async function updateStorePrimaryLocaleAction(
  businessId: string,
  primary: SupportedLocale,
): Promise<ActionResult<StoreLanguageConfig>> {
  if (!isSupportedLocale(primary)) {
    return { success: false, error: 'Invalid language' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: 'Forbidden' }

  const { data: existing } = await loadPublishingRow(supabase, businessId)
  if (!existing) return { success: false, error: 'Settings not found' }

  const dual = Boolean(existing.dual_language_enabled)
  const enabled = enabledLocalesForPrimary(primary, dual)

  const { error } = await supabase
    .from('publishing_settings')
    .update({
      language: primary,
      enabled_locales: enabled,
    })
    .eq('business_id', businessId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/settings/language')
  await revalidateLiveStorePaths(supabase, businessId)

  return {
    success: true,
    data: parseStoreLanguageConfig({
      ...existing,
      language: primary,
      enabled_locales: enabled,
    }),
  }
}

export async function enableDualLanguageAction(
  businessId: string,
): Promise<
  ActionResult<StoreLanguageConfig & { setupSteps: { id: string; label: string }[] }>
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: 'Forbidden' }

  const { data: existing, error: loadErr } = await loadPublishingRow(supabase, businessId)
  if (loadErr || !existing) {
    return { success: false, error: loadErr ?? 'Settings not found' }
  }

  const primary = isSupportedLocale(existing.language) ? existing.language : 'vi'
  const enabled = enabledLocalesForPrimary(primary, true)

  await supabase
    .from('publishing_settings')
    .update({
      dual_language_setup_status: 'running',
      dual_language_enabled: true,
      enabled_locales: enabled,
    })
    .eq('business_id', businessId)

  const setup = await runDualLanguageSetup(supabase, businessId, primary)

  if (!setup.ok) {
    await supabase
      .from('publishing_settings')
      .update({
        dual_language_setup_status: 'failed',
        dual_language_enabled: false,
        enabled_locales: enabledLocalesForPrimary(primary, false),
      })
      .eq('business_id', businessId)
    return { success: false, error: setup.error ?? 'Setup failed' }
  }

  await supabase
    .from('publishing_settings')
    .update({ dual_language_setup_status: 'ready' })
    .eq('business_id', businessId)

  revalidatePath('/dashboard/settings/language')
  revalidatePath('/dashboard/page-builder')
  revalidatePath('/dashboard/order-page')
  revalidatePath('/dashboard/menu')
  await revalidateLiveStorePaths(supabase, businessId)

  const config = parseStoreLanguageConfig({
    ...existing,
    dual_language_enabled: true,
    dual_language_setup_status: 'ready',
    enabled_locales: enabled,
  })

  return {
    success: true,
    data: { ...config, setupSteps: setup.steps },
  }
}

export async function disableDualLanguageAction(
  businessId: string,
): Promise<ActionResult<StoreLanguageConfig>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const access = await assertOwnerOrManager(supabase, user.id, businessId)
  if (!access.ok) return { success: false, error: 'Forbidden' }

  const { data: existing, error: loadErr } = await loadPublishingRow(supabase, businessId)
  if (loadErr || !existing) {
    return { success: false, error: loadErr ?? 'Settings not found' }
  }

  const primary = isSupportedLocale(existing.language) ? existing.language : 'vi'
  const enabled = enabledLocalesForPrimary(primary, false)

  const { error } = await supabase
    .from('publishing_settings')
    .update({
      dual_language_enabled: false,
      dual_language_setup_status: 'idle',
      enabled_locales: enabled,
    })
    .eq('business_id', businessId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/dashboard/settings/language')
  revalidatePath('/dashboard/page-builder')
  revalidatePath('/dashboard/order-page')
  revalidatePath('/dashboard/menu')
  await revalidateLiveStorePaths(supabase, businessId)

  return {
    success: true,
    data: parseStoreLanguageConfig({
      ...existing,
      dual_language_enabled: false,
      dual_language_setup_status: 'idle',
      enabled_locales: enabled,
    }),
  }
}
