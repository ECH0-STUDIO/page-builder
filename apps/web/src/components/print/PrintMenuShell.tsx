'use client'

import { useState, useEffect } from 'react'
import { PrintMenuPreview, DEFAULT_PRINT_SETTINGS } from '@/components/print/PrintMenuPreview'
import { PrintMenuControls } from '@/components/print/PrintMenuControls'
import type { PrintSettings } from '@/components/print/PrintMenuPreview'
import type { MenuCategory, MenuItem } from '@/app/actions/menu'

interface PrintMenuShellProps {
  business: { name: string; logo_url?: string | null }
  categories: MenuCategory[]
  items: MenuItem[]
}

export function PrintMenuShell({ business, categories, items }: PrintMenuShellProps) {
  // Pre-fill heading_text with the business name
  const [settings, setSettings] = useState<PrintSettings>({
    ...DEFAULT_PRINT_SETTINGS,
    heading_text: business.name,
    selectedCategories: categories.filter(c => c.visible).map(c => c.id),
  })

  const [isLoaded, setIsLoaded] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`print_settings_${business.name}`)
      if (saved) {
        setSettings({ ...DEFAULT_PRINT_SETTINGS, ...JSON.parse(saved) })
      }
    } catch (e) {}
    setIsLoaded(true)
  }, [business.name])

  const handleSave = () => {
    setIsSaving(true)
    localStorage.setItem(`print_settings_${business.name}`, JSON.stringify(settings))
    setTimeout(() => setIsSaving(false), 500)
  }

  if (!isLoaded) return null // prevent hydration mismatch

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)] min-h-[600px]">
      {/* Preview — takes remaining width */}
      <div className="flex-1 min-w-0 flex flex-col">
        <PrintMenuPreview 
          business={business} 
          categories={categories} 
          items={items} 
          settings={settings}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>

      {/* Controls — fixed width right panel */}
      <div className="w-64 shrink-0">
        <PrintMenuControls settings={settings} onChange={setSettings} categories={categories} />
      </div>
    </div>
  )
}
