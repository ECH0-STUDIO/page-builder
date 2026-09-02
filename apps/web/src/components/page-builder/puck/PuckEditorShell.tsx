'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Data, Overrides } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import './eatery-puck.css'
import { toast } from 'sonner'
import { useTranslation } from '@/i18n/I18nProvider'

import { normalizePageBlock } from '../spacing-utils'
import { resolveThemeTokens } from '../theme-tokens'
import { pageBlocksToPuckData, puckDataToPageBlocks, extractChromeFromData, ensureChromeBlocks } from './adapters'
import { createStablePuckConfig, type PuckEditorRefs } from './config'
import type { MenuGridData } from '../render/MenuGridRender'
import { PuckCustomHeader, PuckDragRecovery, PuckHeaderActions, PuckPreviewSync } from './PuckEditorChrome'
import { PreviewLayoutProvider } from './PreviewLayoutContext'
import { ThemeTokensProvider } from './ThemeTokensContext'
import { createPuckPlugins, PuckSettingsContext } from './plugins'
import { resolvePublicStoreUrl } from '@/lib/site-urls'

import {
  savePageBlocksAction,
  togglePublishAction,
  saveThemeAction,
  savePublishingSettingsAction,
  saveNavbarAction,
  saveFooterAction,
} from '@/app/actions/page-builder'

import type {
  PageBlock,
  PublishingSettings,
  ThemeSettings,
  NavbarConfig,
  FooterConfig,
} from '../types'
import {
  defaultThemeSettings,
  defaultNavbarConfig,
  defaultFooterConfig,
} from '../types'
import type { Business } from '@/lib/business'
import type { MenuCategory, MenuItem, VariantGroup, VariantOption } from '@/app/actions/menu'
import type { SaveStatus } from '../PublishBar'

import type { PaymentSettings } from '@/lib/vietqr-utils'
import type { BuilderPageMode } from '@/components/page-builder/PageBuilderModeSwitcher'
import { StartPageDialog } from '../StartPageDialog'
import { PuckTemplateContext } from './PuckTemplateContext'
import { buildBlocksFromTemplate, getTemplateThemePreset } from '@/lib/apply-page-template'
import { DEFAULT_PAGE_TEMPLATE_ID } from '../templates'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { SupportedLocale } from '@/i18n/locale'
import { parseStoreLanguageConfig } from '@/i18n/store-locale'
import { EditorLocaleProvider, useEditorLocale } from '@/components/i18n/EditorLocaleContext'

interface PuckEditorShellProps {
  business: Business
  initialBlocks: PageBlock[]
  initialPublishing: PublishingSettings | null
  initialTheme: ThemeSettings | null
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
  initialVariantGroups: VariantGroup[]
  initialVariantOptions: VariantOption[]
  /** Unified builder mode — shows Landing | Order switcher when set */
  builderMode?: BuilderPageMode
}

export function PuckEditorShell(props: PuckEditorShellProps) {
  const storeLanguage = parseStoreLanguageConfig(props.initialPublishing)
  return (
    <EditorLocaleProvider storeLanguage={storeLanguage}>
      <PuckEditorShellInner {...props} />
    </EditorLocaleProvider>
  )
}

function PuckEditorShellInner({
  business,
  initialBlocks,
  initialPublishing,
  initialTheme,
  initialCategories,
  initialItems,
  initialVariantGroups,
  initialVariantOptions,
  builderMode = 'landing',
}: PuckEditorShellProps) {
  const { t } = useTranslation()
  const editorLocale = useEditorLocale()

  const normalizedInitial = useMemo(
    () =>
      initialBlocks
        .filter(b => (b.type as string) !== 'navbar')
        .map(b => normalizePageBlock(b)),
    [initialBlocks],
  )

  const [puckData, setPuckData] = useState<Data>(() =>
    pageBlocksToPuckData(normalizedInitial, {
      navbarConfig: initialTheme?.navbar_config ?? defaultNavbarConfig,
      footerConfig: initialTheme?.footer_config ?? defaultFooterConfig,
    }),
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [published, setPublished] = useState(initialPublishing?.published ?? false)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(
    initialPublishing?.has_unpublished_changes ?? false,
  )
  const [publishing, setPublishing] = useState(false)
  const [theme, setTheme] = useState<ThemeSettings | null>(initialTheme)
  const [themeRevision, setThemeRevision] = useState(0)
  const [publishingSettings, setPublishingSettings] = useState<PublishingSettings | null>(
    initialPublishing,
  )
  const [previewMode, setPreviewMode] = useState(false)
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const canvasPreviewLayout = viewMode === 'mobile' ? 'mobile' as const : 'desktop' as const
  const [leftSideBarVisible, setLeftSideBarVisible] = useState(true)
  const [rightSideBarVisible, setRightSideBarVisible] = useState(true)
  const [showStartDialog, setShowStartDialog] = useState(
    () => normalizedInitial.length === 0,
  )
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null)
  const [applyingTemplate, setApplyingTemplate] = useState(false)
  const [puckRemountKey, setPuckRemountKey] = useState(0)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => {
      if (mq.matches) {
        setLeftSideBarVisible(false)
        setRightSideBarVisible(false)
      } else {
        setLeftSideBarVisible(true)
        setRightSideBarVisible(true)
      }
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveThemeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveNavbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveFooterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savePubTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const puckDataRef = useRef(puckData)
  puckDataRef.current = puckData

  const themeTokens = useMemo(() => resolveThemeTokens(theme), [
    theme?.primary_color,
    theme?.background_color,
    theme?.text_color,
  ])
  const puckMetadata = useMemo(() => ({ themeRevision }), [themeRevision])
  const navbarConfig: NavbarConfig = theme?.navbar_config ?? defaultNavbarConfig
  const footerConfig: FooterConfig = theme?.footer_config ?? defaultFooterConfig
  const fontFamily = theme?.font_family ?? defaultThemeSettings.font_family
  const headingFont = theme?.heading_font_family ?? theme?.font_family ?? defaultThemeSettings.font_family
  const brandColor = themeTokens.brandColor
  const storeUrl = resolvePublicStoreUrl(business.slug ?? '', {
    custom_domain: publishingSettings?.custom_domain ?? null,
    custom_domain_verified: publishingSettings?.custom_domain_verified ?? false,
  })

  const menuGridData: MenuGridData = useMemo(
    () => ({
      categories: initialCategories,
      items: initialItems,
      variantGroups: initialVariantGroups,
      variantOptions: initialVariantOptions,
      businessSlug: business.slug ?? undefined,
    }),
    [initialCategories, initialItems, initialVariantGroups, initialVariantOptions, business.slug],
  )

  const blocksRef = useRef<PageBlock[]>([])
  blocksRef.current = puckDataToPageBlocks(puckData, business.id) as PageBlock[]

  const editorRefs = useRef<PuckEditorRefs>({
    getShell: () => ({
      business,
      theme,
      navbarConfig,
      footerConfig,
      headingFont,
      bodyFont: fontFamily,
      categories: initialCategories,
      items: initialItems,
      brandColor,
      previewInteractive: previewMode,
      viewMode,
      paymentSettings: business.payment_settings as PaymentSettings | null,
      contentLocale: editorLocale.contentLocale,
      primaryLocale: editorLocale.primaryLocale,
      secondaryLocked: editorLocale.secondaryLocked,
    }),
    getBlocks: () => blocksRef.current,
    getRenderCtx: () => ({
      business,
      menuGridData,
      brandColor,
      defaultTextColor: themeTokens.pageText,
      qrDownloadLabel: t('qrCodeBlock.saveQrCode'),
      storeUrl,
      previewInteractive: previewMode,
      previewLayout: canvasPreviewLayout,
      locale: editorLocale.contentLocale,
      primaryLocale: editorLocale.primaryLocale,
    }),
    t,
  })
  editorRefs.current = {
    getShell: () => ({
      business,
      theme,
      navbarConfig,
      footerConfig,
      headingFont,
      bodyFont: fontFamily,
      categories: initialCategories,
      items: initialItems,
      brandColor,
      previewInteractive: previewMode,
      viewMode,
      paymentSettings: business.payment_settings as PaymentSettings | null,
      contentLocale: editorLocale.contentLocale,
      primaryLocale: editorLocale.primaryLocale,
      secondaryLocked: editorLocale.secondaryLocked,
    }),
    getBlocks: () => blocksRef.current,
    getRenderCtx: () => ({
      business,
      menuGridData,
      brandColor,
      defaultTextColor: themeTokens.pageText,
      qrDownloadLabel: t('qrCodeBlock.saveQrCode'),
      storeUrl,
      previewInteractive: previewMode,
      previewLayout: canvasPreviewLayout,
      locale: editorLocale.contentLocale,
      primaryLocale: editorLocale.primaryLocale,
    }),
    t,
  }

  const puckConfig = useMemo(() => createStablePuckConfig(editorRefs), [])
  const puckPlugins = useMemo(() => createPuckPlugins(t), [t])

  const syncChromeFromData = useCallback(
    (data: Data) => {
      const chrome = extractChromeFromData(data)
      setTheme(prev => {
        const next = prev
          ? { ...prev, navbar_config: chrome.navbarConfig, footer_config: chrome.footerConfig }
          : ({
              ...defaultThemeSettings,
              business_id: business.id,
              id: '',
              navbar_config: chrome.navbarConfig,
              footer_config: chrome.footerConfig,
            } as ThemeSettings)

        if (saveNavbarTimer.current) clearTimeout(saveNavbarTimer.current)
        saveNavbarTimer.current = setTimeout(() => {
          saveNavbarAction(business.id, chrome.navbarConfig).then(res => {
            if (res.success) setHasUnpublishedChanges(true)
            else toast.error(t('pageBuilder.toastSaveNavbarFailed') + res.error)
          })
        }, 1000)

        if (saveFooterTimer.current) clearTimeout(saveFooterTimer.current)
        saveFooterTimer.current = setTimeout(() => {
          saveFooterAction(business.id, chrome.footerConfig).then(res => {
            if (res.success) setHasUnpublishedChanges(true)
            else toast.error(t('pageBuilder.toastSaveFooterFailed') + res.error)
          })
        }, 1000)

        return next
      })
      return chrome
    },
    [business.id, t],
  )

  const performSave = useCallback(
    async (data: Data) => {
      setSaveStatus('saving')
      try {
        const blocks = puckDataToPageBlocks(data, business.id)
        const res = await savePageBlocksAction(business.id, blocks)
        if (res.success) {
          setSaveStatus('saved')
          if (published) setHasUnpublishedChanges(true)
        } else {
          setSaveStatus('idle')
          console.error('Failed to auto-save:', res.error)
        }
      } catch (e) {
        setSaveStatus('idle')
        console.error('Save error:', e)
      }
    },
    [business.id, published],
  )

  const triggerAutoSave = useCallback(
    (data: Data) => {
      setSaveStatus('idle')
      if (saveTimer.current) clearTimeout(saveTimer.current)
      saveTimer.current = setTimeout(() => performSave(data), 1500)
    },
    [performSave],
  )

  const saveNow = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    performSave(puckDataRef.current)
  }, [performSave])

  const handlePublish = useCallback(
    async (state: boolean) => {
      setPublishing(true)
      if (state) saveNow()
      try {
        const res = await togglePublishAction(business.id, state)
        if (res.success) {
          setPublished(state)
          setPublishingSettings(res.data)
          setHasUnpublishedChanges(res.data?.has_unpublished_changes ?? false)
          toast.success(state ? t('pageBuilder.toastPublished') : t('pageBuilder.toastUnpublished'))
        } else {
          toast.error(res.error)
        }
      } catch {
        toast.error(t('pageBuilder.toastPublishFailed'))
      }
      setPublishing(false)
    },
    [business.id, saveNow, t],
  )

  const chromeProps = useMemo(
    () => ({
      saveStatus,
      published,
      hasUnpublishedChanges,
      publishing,
      slug: business.slug ?? '',
      storeUrl,
      previewMode,
      viewMode,
      onTogglePreview: () => setPreviewMode(p => !p),
      onViewModeChange: setViewMode,
      onPublish: handlePublish,
    }),
    [saveStatus, published, hasUnpublishedChanges, publishing, business.slug, storeUrl, previewMode, viewMode, handlePublish],
  )

  const puckOverrides = useMemo<Partial<Overrides>>(
    () => ({
      header: ({ actions }) => (
        <>
          <PuckPreviewSync
            previewMode={previewMode}
            viewMode={viewMode}
            themeRevision={themeRevision}
          />
          <PuckDragRecovery />
          <PuckCustomHeader
            builderMode={builderMode}
            previewMode={previewMode}
            viewMode={viewMode}
            onTogglePreview={() => setPreviewMode(p => !p)}
            onViewModeChange={setViewMode}
            chrome={actions}
          />
        </>
      ),
      headerActions: () => <PuckHeaderActions {...chromeProps} />,
    }),
    [chromeProps, previewMode, viewMode, builderMode, themeRevision],
  )

  const puckIframe = useMemo(() => ({ enabled: false as const }), [])
  const puckUi = useMemo(
    () => ({
      leftSideBarVisible: previewMode ? false : leftSideBarVisible,
      rightSideBarVisible: previewMode ? false : rightSideBarVisible,
      previewMode: previewMode ? ('interactive' as const) : ('edit' as const),
    }),
    [previewMode, leftSideBarVisible, rightSideBarVisible],
  )

  useEffect(() => {
    const families = [...new Set([fontFamily, headingFont])]
    const id = 'pb-puck-gfont'
    const link = (document.getElementById(id) as HTMLLinkElement | null) ?? document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f.replace(/ /g, '+')}:wght@400;500;600;700;800`).join('&')}&display=swap`
    if (!document.getElementById(id)) document.head.appendChild(link)
  }, [fontFamily, headingFont])

  const handlePuckChange = useCallback(
    (data: Data) => {
      const chrome = syncChromeFromData(data)
      const ensured = ensureChromeBlocks(data, chrome)
      setPuckData(ensured)
      blocksRef.current = puckDataToPageBlocks(ensured, business.id) as PageBlock[]
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      triggerAutoSave(ensured)
    },
    [triggerAutoSave, business.id, syncChromeFromData],
  )

  const handleThemeChange = useCallback(
    (updated: Partial<ThemeSettings>) => {
      setTheme(prev => {
        const next = prev
          ? { ...prev, ...updated }
          : ({ ...defaultThemeSettings, business_id: business.id, id: '', ...updated } as ThemeSettings)
        if (saveThemeTimer.current) clearTimeout(saveThemeTimer.current)
        saveThemeTimer.current = setTimeout(() => {
          saveThemeAction(business.id, {
            primary_color: next.primary_color,
            background_color: next.background_color,
            text_color: next.text_color ?? defaultThemeSettings.text_color,
            font_family: next.font_family,
            heading_font_family: next.heading_font_family || 'Inter',
          }).then(res => {
            if (res.success) setHasUnpublishedChanges(true)
            else toast.error(t('pageBuilder.toastSaveThemeFailed') + res.error)
          })
        }, 1000)
        return next
      })
      // Force Puck canvas to re-read theme refs (brand color, fonts, etc.)
      setThemeRevision(r => r + 1)
    },
    [business.id, t],
  )

  const handlePublishingChange = useCallback(
    (updated: Partial<PublishingSettings>) => {
      setPublishingSettings(prev => {
        const next = prev
          ? { ...prev, ...updated }
          : ({ business_id: business.id, ...updated } as PublishingSettings)
        if (savePubTimer.current) clearTimeout(savePubTimer.current)
        savePubTimer.current = setTimeout(() => {
          savePublishingSettingsAction(business.id, updated).then(res => {
            if (!res.success) toast.error(res.error)
          })
        }, 1000)
        return next
      })
    },
    [business.id],
  )

  const applyTemplate = useCallback(
    async (templateId: string) => {
      const newBlocks = buildBlocksFromTemplate(business.id, templateId)
      if (!newBlocks) return

      setApplyingTemplate(true)

      try {
        const themePreset = getTemplateThemePreset(templateId)
        let nextNavbar = theme?.navbar_config ?? defaultNavbarConfig
        let nextFooter = theme?.footer_config ?? defaultFooterConfig

        if (themePreset) {
          const nextTheme = theme
            ? { ...theme, ...themePreset }
            : ({
                ...defaultThemeSettings,
                business_id: business.id,
                id: '',
                ...themePreset,
              } as ThemeSettings)

          setTheme(nextTheme)
          setThemeRevision(r => r + 1)

          const themeRes = await saveThemeAction(business.id, {
            primary_color: nextTheme.primary_color,
            background_color: nextTheme.background_color,
            text_color: nextTheme.text_color ?? defaultThemeSettings.text_color,
            font_family: nextTheme.font_family,
            heading_font_family: nextTheme.heading_font_family || 'Inter',
          })
          if (!themeRes.success) {
            toast.error(t('pageBuilder.toastSaveThemeFailed') + themeRes.error)
          } else {
            setHasUnpublishedChanges(true)
          }
        }

        const newData = ensureChromeBlocks(
          pageBlocksToPuckData(newBlocks, {
            navbarConfig: nextNavbar,
            footerConfig: nextFooter,
          }),
          {
            navbarConfig: nextNavbar,
            footerConfig: nextFooter,
          },
        )

        setPuckData(newData)
        blocksRef.current = newBlocks
        setPuckRemountKey(k => k + 1)
        isFirstRender.current = false
        setShowStartDialog(false)
        setPendingTemplate(null)

        await performSave(newData)
        setHasUnpublishedChanges(true)
        toast.success(t('pageBuilder.templateApplied'))
      } catch (err) {
        console.error('[applyTemplate]', err)
        toast.error(t('pageBuilder.templateApplyFailed'))
      } finally {
        setApplyingTemplate(false)
      }
    },
    [business.id, theme, performSave, t],
  )

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      const contentBlocks = puckDataToPageBlocks(puckData, business.id)
      if (contentBlocks.length > 0) {
        setPendingTemplate(templateId)
        return
      }
      void applyTemplate(templateId)
    },
    [applyTemplate, business.id, puckData],
  )

  const confirmApplyTemplate = useCallback(() => {
    if (!pendingTemplate) return
    const id = pendingTemplate
    setPendingTemplate(null)
    void applyTemplate(id)
  }, [applyTemplate, pendingTemplate])

  const templateActions = useMemo(
    () => ({
      selectTemplate: handleSelectTemplate,
      applyingTemplate,
    }),
    [handleSelectTemplate, applyingTemplate],
  )

  const settingsContextValue = useMemo(
    () => ({
      theme,
      publishing: publishingSettings,
      onThemeChange: handleThemeChange,
      onPublishingChange: handlePublishingChange,
    }),
    [theme, publishingSettings, handleThemeChange, handlePublishingChange],
  )

  return (
    <div className="eatery-puck-shell eatery-puck">
      {applyingTemplate && (
        <div className="fixed inset-0 z-[99999] bg-background/70 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">{t('pageBuilder.applyingTemplate')}</p>
        </div>
      )}

      {showStartDialog && (
        <StartPageDialog
          onStartBlank={() => setShowStartDialog(false)}
          onUseTemplate={() => handleSelectTemplate(DEFAULT_PAGE_TEMPLATE_ID)}
        />
      )}

      {pendingTemplate && !applyingTemplate && (
        <div className="fixed inset-0 z-[99998] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h2 className="text-lg font-bold">{t('pageBuilder.applyTemplate')}</h2>
            <p className="text-sm text-muted-foreground">{t('pageBuilder.applyTemplateConfirm')}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setPendingTemplate(null)}>
                {t('pageBuilder.cancel')}
              </Button>
              <Button variant="destructive" onClick={confirmApplyTemplate}>
                {t('pageBuilder.replaceLayout')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="eatery-puck-editor">
        <PuckTemplateContext.Provider value={templateActions}>
        <PuckSettingsContext.Provider value={settingsContextValue}>
          <PreviewLayoutProvider value={canvasPreviewLayout}>
            <ThemeTokensProvider value={themeTokens}>
            <Puck
              key={puckRemountKey}
              config={puckConfig}
              data={puckData}
              onChange={handlePuckChange}
              plugins={puckPlugins}
              overrides={puckOverrides}
              iframe={puckIframe}
              ui={puckUi}
              metadata={puckMetadata}
            />
            </ThemeTokensProvider>
          </PreviewLayoutProvider>
        </PuckSettingsContext.Provider>
        </PuckTemplateContext.Provider>
      </div>
    </div>
  )
}
