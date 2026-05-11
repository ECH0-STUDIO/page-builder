import { FooterConfig } from '../types'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export function FooterSettings({
  config,
  onChange,
}: {
  config: FooterConfig
  onChange: (config: FooterConfig) => void
}) {
  const set = (k: keyof FooterConfig, v: any) => onChange({ ...config, [k]: v })

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-1">Footer Settings</h3>
        <p className="text-xs text-muted-foreground">Appears at the bottom of your page.</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="footer-show-business-name" className="text-xs cursor-pointer">Show business name</Label>
          <Switch
            id="footer-show-business-name"
            checked={config.show_business_name}
            onCheckedChange={v => set('show_business_name', v)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Copyright Text</Label>
          <Input 
            value={config.copyright_text} 
            onChange={e => set('copyright_text', e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colours</Label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.background_color}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Text</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.text_color}
                onChange={e => set('text_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-[11px] font-mono text-muted-foreground truncate">{config.text_color}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
