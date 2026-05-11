import { useState, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2, ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { uploadImageToStorage } from '@/lib/image-utils'
import type { ThemeSettings, PublishingSettings } from '../types'

interface GlobalSettingsPanelProps {
  theme: ThemeSettings | null
  publishing: PublishingSettings | null
  onThemeChange: (updated: Partial<ThemeSettings>) => void
  onPublishingChange: (updated: Partial<PublishingSettings>) => void
}

const FONTS = ['Inter', 'Outfit', 'Playfair Display', 'Lora', 'Space Grotesk', 'Roboto Mono']

export function GlobalSettingsPanel({
  theme,
  publishing,
  onThemeChange,
  onPublishingChange,
}: GlobalSettingsPanelProps) {
  const t = theme || {} as ThemeSettings
  const p = publishing || {} as PublishingSettings

  const faviconRef = useRef<HTMLInputElement>(null)
  const webclipRef = useRef<HTMLInputElement>(null)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [uploadingWebclip, setUploadingWebclip] = useState(false)

  async function handleUploadFavicon(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFavicon(true)
    try {
      const path = `${p.business_id}/favicon-${Date.now()}.png`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 48, maxHeight: 48, quality: 1, targetSizeKB: 50, format: 'image/png'
      })
      onPublishingChange({ favicon_url: url })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingFavicon(false)
      if (faviconRef.current) faviconRef.current.value = ''
    }
  }

  async function handleUploadWebclip(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingWebclip(true)
    try {
      const path = `${p.business_id}/webclip-${Date.now()}.png`
      const url = await uploadImageToStorage('page-images', path, file, {
        maxWidth: 256, maxHeight: 256, quality: 1, targetSizeKB: 200, format: 'image/png'
      })
      onPublishingChange({ apple_touch_icon_url: url })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingWebclip(false)
      if (webclipRef.current) webclipRef.current.value = ''
    }
  }

  return (
    <div className="space-y-8 p-4">
      {/* ── SEO & Meta ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">SEO & Search</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Page Title</Label>
            <Input 
              value={p.seo_title || ''} 
              onChange={e => onPublishingChange({ seo_title: e.target.value })}
              placeholder="e.g. My Awesome Restaurant"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Meta Description</Label>
            <Textarea 
              value={p.seo_description || ''} 
              onChange={e => onPublishingChange({ seo_description: e.target.value })}
              placeholder="Brief description for Google search results..."
              className="text-xs min-h-[80px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Favicon (48x48)</Label>
              <div className="flex flex-col gap-2">
                {p.favicon_url ? (
                  <div className="relative size-12 border border-border rounded overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    <img src={p.favicon_url} alt="Favicon" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onPublishingChange({ favicon_url: null })}
                      className="absolute top-0.5 right-0.5 bg-black/50 hover:bg-black/80 text-white rounded-full p-0.5"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <div className="size-12 border border-border border-dashed rounded bg-muted/50 flex items-center justify-center shrink-0">
                    {uploadingFavicon ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ImageIcon className="size-4 text-muted-foreground/50" />}
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" ref={faviconRef} onChange={handleUploadFavicon} />
                <button
                  type="button"
                  onClick={() => faviconRef.current?.click()}
                  disabled={uploadingFavicon}
                  className="text-[10px] bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1 rounded w-fit"
                >
                  {uploadingFavicon ? 'Uploading...' : p.favicon_url ? 'Replace' : 'Upload PNG'}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Webclip (256x256)</Label>
              <div className="flex flex-col gap-2">
                {p.apple_touch_icon_url ? (
                  <div className="relative size-16 border border-border rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                    <img src={p.apple_touch_icon_url} alt="Webclip" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => onPublishingChange({ apple_touch_icon_url: null })}
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/80 text-white rounded-full p-1"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ) : (
                  <div className="size-16 border border-border border-dashed rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    {uploadingWebclip ? <Loader2 className="size-5 animate-spin text-muted-foreground" /> : <ImageIcon className="size-5 text-muted-foreground/50" />}
                  </div>
                )}
                <input type="file" accept="image/*" className="hidden" ref={webclipRef} onChange={handleUploadWebclip} />
                <button
                  type="button"
                  onClick={() => webclipRef.current?.click()}
                  disabled={uploadingWebclip}
                  className="text-[10px] bg-secondary text-secondary-foreground hover:bg-secondary/80 px-2 py-1 rounded w-fit"
                >
                  {uploadingWebclip ? 'Uploading...' : p.apple_touch_icon_url ? 'Replace' : 'Upload PNG'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Analytics ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Analytics & Tracking</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Google Analytics ID</Label>
            <Input 
              value={(p as any).google_analytics_id || ''} 
              onChange={e => onPublishingChange({ google_analytics_id: e.target.value } as any)}
              placeholder="G-XXXXXXXXXX"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Facebook Pixel ID</Label>
            <Input 
              value={(p as any).facebook_pixel_id || ''} 
              onChange={e => onPublishingChange({ facebook_pixel_id: e.target.value } as any)}
              placeholder="1234567890"
              className="text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Google Search Console Tag</Label>
            <Input 
              value={p.gsc_verification || ''} 
              onChange={e => onPublishingChange({ gsc_verification: e.target.value })}
              placeholder="HTML tag content..."
              className="text-xs"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* ── Theme (Colors & Typography) ── */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm">Design Theme</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Brand Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t.primary_color || '#E85D26'}
                  onChange={e => onThemeChange({ primary_color: e.target.value })}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{t.primary_color}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Background</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={t.background_color || '#FFFFFF'}
                  onChange={e => onThemeChange({ background_color: e.target.value })}
                  className="size-8 rounded border border-border cursor-pointer"
                />
                <span className="text-[11px] font-mono text-muted-foreground truncate">{t.background_color}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs">Heading Font</Label>
            <Select value={t.heading_font_family || 'Inter'} onValueChange={v => onThemeChange({ heading_font_family: v })}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Body Font</Label>
            <Select value={t.font_family || 'Inter'} onValueChange={v => onThemeChange({ font_family: v })}>
              <SelectTrigger className="text-xs h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
