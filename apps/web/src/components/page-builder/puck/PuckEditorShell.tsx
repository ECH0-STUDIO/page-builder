'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Data } from '@puckeditor/core'
import { Puck } from '@puckeditor/core'
import '@puckeditor/core/puck.css'
import './eatery-puck.css'
import { toast } from 'sonner'
import { Settings, Menu, PanelBottom } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { useTranslation } from '@/i18n/I18nProvider'

import { PublishBar, type SaveStatus } from '../PublishBar'
import { GlobalSettingsPanel } from '../blocks/GlobalSettingsPanel'
import { NavbarSettings } from '../blocks/NavbarBlock'
import { FooterSettings } from '../blocks/FooterBlock'
import { normalizePageBlock } from '../spacing-utils'
import { buildThemeStyle, resolveThemeTokens } from '../theme-tokens'
import { pageBlocksToPuckData, puckDataToPageBlocks } from './adapters'
import { createPuckConfig } from './config'
import type { MenuGridData } from '../render/MenuGridRender'

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

type PageSettingsPanel = 'theme' | 'navbar' | 'footer' | null

interface PuckEditorShellProps {
  business: Business
  initialBlocks: PageBlock[]
  initialPublishing: PublishingSettings | null
  initialTheme: ThemeSettings | null
  initialCategories: MenuCategory[]
  initialItems: MenuItem[]
  initialVariantGroups: VariantGroup[]
  initialVariantOptions: VariantOption[]
}

export function PuckEditorShell({
  business,
  initialBlocks,
  initialPublishing,
  initialTheme,
  initialCategories,
  initialItems,
  initialVariantGroups,
  initialVariantOptions,
}: PuckEditorShellProps) {
  const { t } = useTranslation()

  const normalizedInitial = useMemo(
    () =>
      initialBlocks
        .filter(b => (b.type as string) !== 'navbar')
        .map(b => normalizePageBlock(b)),
    [initialBlocks],
  )

  const [puckData, setPuckData] = useState<Data>(() => pageBlocksToPuckData(normalizedInitial))
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [published, setPublished] = useState(initialPublishing?.published ?? false)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(
    initialPublishing?.has_unpublished_changes ?? false,
  )
  const [publishing, setPublishing] = useState(false)
  const [theme, setTheme] = useState<ThemeSettings | null>(initialTheme)
  const [publishingSettings, setPublishingSettings] = useState<PublishingSettings | null>(
    initialPublishing,
  )
  const [pagePanel, setPagePanel] = useState<PageSettingsPanel>(null)

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveThemeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveNavbarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveFooterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savePubTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const puckDataRef = useRef(puckData)
  puckDataRef.current = puckData

  const themeTokens = resolveThemeTokens(theme)
  const navbarConfig: NavbarConfig = theme?.navbar_config ?? defaultNavbarConfig
  const footerConfig: FooterConfig = theme?.footer_config ?? defaultFooterConfig
  const fontFamily = theme?.font_family ?? defaultThemeSettings.font_family
  const headingFont = theme?.heading_font_family ?? theme?.font_family ?? defaultThemeSettings.font_family

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

  const blocksForSettings = useMemo(
    () => puckDataToPageBlocks(puckData, business.id),
    [puckData, business.id],
  )

  const renderCtx = useMemo(
    () => ({
      business,
      menuGridData,
      brandColor: themeTokens.brandColor,
      defaultTextColor: themeTokens.pageText,
      qrDownloadLabel: t('qrCodeBlock.saveQrCode'),
    }),
    [business, menuGridData, themeTokens, t],
  )

  const puckConfig = useMemo(
    () =>
      createPuckConfig({
        business,
        blocks: blocksForSettings as PageBlock[],
        categories: initialCategories,
        items: initialItems,
        brandColor: themeTokens.brandColor,
        defaultTextColor: themeTokens.pageText,
        renderCtx,
        theme,
        navbarConfig,
        footerConfig,
        headingFont,
        bodyFont: fontFamily,
        t,
      }),
    [
      business,
      blocksForSettings,
      initialCategories,
      initialItems,
      themeTokens,
      renderCtx,
      theme,
      navbarConfig,
      footerConfig,
      headingFont,
      fontFamily,
      t,
    ],
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

  const handlePuckChange = useCallback(
    (data: Data) => {
      setPuckData(data)
      if (isFirstRender.current) {
        isFirstRender.current = false
        return
      }
      triggerAutoSave(data)
    },
    [triggerAutoSave],
  )

  function saveNow() {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    performSave(puckDataRef.current)
  }

  async function handlePublish(state: boolean) {
    setPublishing(true)
    if (state) saveNow()
    try {
      const res = await togglePublishAction(business.id, state)
      if (res.success) {
        setPublished(state)
        setPublishingSettings(res.data)
        setHasUnpublishedChanges(res.data?.has_unpublished_changes ?? false)
        toast.success(state ? 'Page published successfully!' : 'Page unpublished')
      } else {
        toast.error(res.error)
      }
    } catch {
      toast.error('Failed to toggle publish status')
    }
    setPublishing(false)
  }

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
            else toast.error('Failed to save theme: ' + res.error)
          })
        }, 1000)
        return next
      })
    },
    [business.id],
  )

  const handleNavbarChange = useCallback(
    (updated: NavbarConfig) => {
      setTheme(prev => {
        const next = prev
          ? { ...prev, navbar_config: updated }
          : ({ ...defaultThemeSettings, business_id: business.id, id: '', navbar_config: updated } as ThemeSettings)
        if (saveNavbarTimer.current) clearTimeout(saveNavbarTimer.current)
        saveNavbarTimer.current = setTimeout(() => {
          saveNavbarAction(business.id, updated).then(res => {
            if (res.success) setHasUnpublishedChanges(true)
            else toast.error('Failed to save navbar: ' + res.error)
          })
        }, 1000)
        return next
      })
    },
    [business.id],
  )

  const handleFooterChange = useCallback(
    (updated: FooterConfig) => {
      setTheme(prev => {
        const next = prev
          ? { ...prev, footer_config: updated }
          : ({ ...defaultThemeSettings, business_id: business.id, id: '', footer_config: updated } as ThemeSettings)
        if (saveFooterTimer.current) clearTimeout(saveFooterTimer.current)
        saveFooterTimer.current = setTimeout(() => {
          saveFooterAction(business.id, updated).then(res => {
            if (res.success) setHasUnpublishedChanges(true)
            else toast.error('Failed to save footer: ' + res.error)
          })
        }, 1000)
        return next
      })
    },
    [business.id],
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

  return (
    <div className="eatery-puck-shell eatery-puck">
      <PublishBar
        businessName={business.name}
        slug={business.slug}
        published={published}
        hasUnpublishedChanges={hasUnpublishedChanges}
        saveStatus={saveStatus}
        onPublish={handlePublish}
        publishing={publishing}
        onTogglePreview={() => {
          if (business.slug) {
            window.open(`/${business.slug}`, '_blank')
          }
        }}
      />

      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border bg-muted/30 shrink-0">
        <span className="text-xs text-muted-foreground mr-1">{t('pageBuilder.pageSettings')}</span>
        <Button
          type="button"
          variant={pagePanel === 'navbar' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setPagePanel('navbar')}
        >
          <Menu className="size-3.5" />
          {t('pageBuilder.header')}
        </Button>
        <Button
          type="button"
          variant={pagePanel === 'footer' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setPagePanel('footer')}
        >
          <PanelBottom className="size-3.5" />
          {t('pageBuilder.footer')}
        </Button>
        <Button
          type="button"
          variant={pagePanel === 'theme' ? 'default' : 'outline'}
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setPagePanel('theme')}
        >
          <Settings className="size-3.5" />
          {t('pageBuilder.globalSettings')}
        </Button>
      </div>

      <div className="eatery-puck-editor" style={buildThemeStyle(theme)}>
        <Puck
          config={puckConfig}
          data={puckData}
          onChange={handlePuckChange}
          onPublish={data => {
            setPuckData(data)
            saveNow()
          }}
          headerTitle={business.name}
          headerPath={t('sidebar.pageBuilder')}
          iframe={{ enabled: true }}
        />
      </div>

      <Dialog open={pagePanel !== null} onOpenChange={open => !open && setPagePanel(null)}>
        <DialogContent className={cn('max-w-lg max-h-[85vh] overflow-y-auto')}>
          <DialogHeader>
            <DialogTitle>
              {pagePanel === 'navbar' && t('pageBuilder.navbar')}
              {pagePanel === 'footer' && t('pageBuilder.footer')}
              {pagePanel === 'theme' && t('pageBuilder.globalSettings')}
            </DialogTitle>
          </DialogHeader>
          {pagePanel === 'navbar' && (
            <NavbarSettings
              config={navbarConfig}
              businessId={business.id}
              blocks={blocksForSettings as PageBlock[]}
              onChange={handleNavbarChange}
            />
          )}
          {pagePanel === 'footer' && (
            <FooterSettings
              config={footerConfig}
              businessId={business.id}
              onChange={handleFooterChange}
            />
          )}
          {pagePanel === 'theme' && (
            <GlobalSettingsPanel
              theme={theme}
              publishing={publishingSettings}
              onThemeChange={handleThemeChange}
              onPublishingChange={handlePublishingChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
