'use client'

import { useState, useEffect } from 'react'
import { Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
    <div className="flex flex-col lg:flex-row gap-6 lg:h-[calc(100vh-180px)] lg:min-h-[600px]">
      
      {/* Mobile Preview Trigger */}
      <div className="lg:hidden sticky top-0 z-10 bg-background/95 backdrop-blur pb-4 pt-2 -mx-4 px-4 border-b">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" size="lg">
              <Eye className="size-4 mr-2" /> View Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] max-w-3xl h-[90vh] p-4 flex flex-col gap-0 sm:rounded-xl">
            <DialogTitle className="sr-only">Menu Preview</DialogTitle>
            <PrintMenuPreview 
              business={business} 
              categories={categories} 
              items={items} 
              settings={settings}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Preview — hidden on mobile */}
      <div className="hidden lg:flex flex-1 min-w-0 flex-col">
        <PrintMenuPreview 
          business={business} 
          categories={categories} 
          items={items} 
          settings={settings}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>

      {/* Controls — fixed width right panel on desktop, full width on mobile */}
      <div className="w-full lg:w-80 shrink-0 overflow-y-auto pb-8">
        <PrintMenuControls settings={settings} onChange={setSettings} categories={categories} />
      </div>
    </div>
  )
}
