'use client'

import { useState } from 'react'
import { Plus, Trash2, GripVertical, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { saveNavbarAction } from '@/app/actions/page-builder'
import type { NavbarConfig, NavLink, PageBlock } from '../types'

// ─── Canvas preview ────────────────────────────────────────────────────────────

export function NavbarPreview({ config }: { config: NavbarConfig }) {
  return (
    <div className="rounded-lg overflow-hidden border border-border/60 bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-bold truncate text-muted-foreground">
          Logo
        </div>
        <div className="flex gap-2">
          {config.links.slice(0, 3).map((l, i) => (
            <span key={i} className="text-[10px] text-muted-foreground truncate max-w-[60px]">{l.label}</span>
          ))}
          {config.links.length > 3 && <span className="text-[10px] text-muted-foreground">+{config.links.length - 3}</span>}
          {config.links.length === 0 && <span className="text-[10px] text-muted-foreground/40 italic">No links</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Derive anchor options from blocks list ────────────────────────────────────

function getAnchorOptions(blocks: PageBlock[]) {
  return blocks.map((b, i) => ({
    id: b.id,
    label: `${b.type.replace('_', ' ')} — block ${i + 1}`,
    anchor: `block-${b.id}`,
  }))
}

// ─── Settings form ─────────────────────────────────────────────────────────────

export function NavbarSettings({
  config,
  businessId,
  blocks,
  onChange,
}: {
  config: NavbarConfig
  businessId: string
  /** Current page blocks so anchors can reference them */
  blocks: PageBlock[]
  onChange: (c: NavbarConfig) => void
}) {
  const [saving, setSaving] = useState(false)

  function set<K extends keyof NavbarConfig>(key: K, value: NavbarConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  function addLink() {
    set('links', [...config.links, { label: 'Link', href: '#', anchor: false }])
  }

  function updateLink(i: number, patch: Partial<NavLink>) {
    const updated = config.links.map((l, idx) => idx === i ? { ...l, ...patch } : l)
    set('links', updated)
  }

  function removeLink(i: number) {
    set('links', config.links.filter((_, idx) => idx !== i))
  }

  function moveLink(i: number, dir: -1 | 1) {
    const links = [...config.links]
    const j = i + dir
    if (j < 0 || j >= links.length) return
    ;[links[i], links[j]] = [links[j], links[i]]
    set('links', links)
  }

  async function handleSave() {
    setSaving(true)
    const result = await saveNavbarAction(businessId, config)
    if (result.success) {
      toast.success('Navbar saved')
    } else {
      toast.error('Save failed: ' + result.error)
    }
    setSaving(false)
  }

  const anchorOptions = getAnchorOptions(blocks)

  return (
    <div className="space-y-5">

      {/* Save button */}
      <Button
        type="button"
        size="sm"
        className="w-full"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Check className="size-3.5 mr-1.5" />}
        {saving ? 'Saving…' : 'Save navbar'}
      </Button>

      {/* Logo / Brand */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Logo / Brand</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {([
            { value: 'business_name', label: 'Name' },
            { value: 'logo_image', label: 'Image' },
          ] as { value: NavbarConfig['logo_type']; label: string }[]).map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => set('logo_type', o.value)}
              className={cn(
                'py-1.5 rounded border text-xs transition-colors',
                config.logo_type === o.value
                  ? 'border-primary bg-primary/5 text-primary font-medium'
                  : 'border-border hover:border-foreground/30'
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Nav links */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Navigation Links</Label>
          <span className="text-[11px] text-muted-foreground">{config.links.length} link{config.links.length !== 1 ? 's' : ''}</span>
        </div>

        {config.links.length === 0 && (
          <p className="text-xs text-muted-foreground italic py-2 text-center">No links yet.</p>
        )}

        <div className="space-y-2">
          {config.links.map((link, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-muted/10 p-2.5 space-y-2">
              {/* Row: reorder + label + delete */}
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col shrink-0">
                  <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                    <GripVertical className="size-3 rotate-90" />
                  </button>
                  <button type="button" onClick={() => moveLink(i, 1)} disabled={i === config.links.length - 1}
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors">
                    <GripVertical className="size-3 -rotate-90" />
                  </button>
                </div>
                <Input
                  value={link.label}
                  onChange={e => updateLink(i, { label: e.target.value })}
                  placeholder="Link label"
                  className="h-7 text-xs flex-1"
                />
                <button type="button" onClick={() => removeLink(i)}
                  className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0">
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {/* Anchor toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor={`anchor-${i}`} className="text-xs font-normal cursor-pointer text-muted-foreground">
                  Scroll to section
                </Label>
                <Switch
                  id={`anchor-${i}`}
                  checked={link.anchor}
                  onCheckedChange={v => updateLink(i, { anchor: v, href: '#' })}
                />
              </div>

              {/* URL or anchor section picker */}
              {link.anchor ? (
                anchorOptions.length > 0 ? (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Scroll to block</Label>
                    <Select
                      value={link.href}
                      onValueChange={v => updateLink(i, { href: v })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Select a section…" />
                      </SelectTrigger>
                      <SelectContent>
                        {anchorOptions.map(opt => (
                          <SelectItem key={opt.anchor} value={opt.anchor} className="text-xs">
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">Will scroll to that section when clicked.</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded px-2 py-1.5">
                    Add more blocks to the page first, then you can scroll-link to them.
                  </p>
                )
              ) : (
                <Input
                  value={link.href}
                  onChange={e => updateLink(i, { href: e.target.value })}
                  placeholder="https://… or /page-path"
                  className="h-7 text-xs font-mono"
                />
              )}
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" className="w-full text-xs h-8" onClick={addLink}>
          <Plus className="size-3.5 mr-1.5" /> Add link
        </Button>
      </div>

      <Separator />

      {/* Appearance */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Appearance</Label>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Background</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.background_color === 'transparent' ? '#ffffff' : config.background_color}
                onChange={e => set('background_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground truncate">{config.background_color}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Link colour</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={config.text_color}
                onChange={e => set('text_color', e.target.value)}
                className="size-8 rounded border border-border cursor-pointer"
              />
              <span className="text-xs font-mono text-muted-foreground truncate">{config.text_color}</span>
            </div>
          </div>
        </div>

        {/* Presets */}
        <div className="flex gap-1.5">
          <button type="button" onClick={() => onChange({ ...config, background_color: '#ffffff', text_color: '#111111' })}
            className="flex-1 py-1 rounded border border-border text-[11px] hover:border-foreground/30 transition-colors">White</button>
          <button type="button" onClick={() => onChange({ ...config, background_color: '#111111', text_color: '#ffffff' })}
            className="flex-1 py-1 rounded border border-border text-[11px] hover:border-foreground/30 transition-colors bg-gray-900 text-white">Dark</button>
          <button type="button" onClick={() => onChange({ ...config, background_color: 'transparent', text_color: '#111111' })}
            className="flex-1 py-1 rounded border border-border text-[11px] hover:border-foreground/30 transition-colors">Glass</button>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <Label htmlFor="nav-sticky" className="text-xs cursor-pointer">Sticky navbar</Label>
            <p className="text-[11px] text-muted-foreground">Sticks to top while scrolling</p>
          </div>
          <Switch id="nav-sticky" checked={config.sticky} onCheckedChange={v => set('sticky', v)} />
        </div>
      </div>
    </div>
  )
}
