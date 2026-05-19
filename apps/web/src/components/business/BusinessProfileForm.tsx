'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2, Upload, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  updateBusiness,
  uploadLogo,
  type Business,
} from '@/lib/business'
import {
  BUSINESS_CATEGORIES,
  BUSINESS_TAGS,
  DAYS_OF_WEEK,
  HOURS,
  SOCIAL_LINKS_CONFIG,
} from '@/lib/constants'
import { useBusiness } from '@/context/BusinessContext'
import { useTranslation } from '@/i18n/I18nProvider'

type OpeningHoursEntry = {
  day: string
  open: boolean
  from: string
  to: string
}

const DEFAULT_HOURS: OpeningHoursEntry[] = DAYS_OF_WEEK.map(d => ({
  day: d.key,
  open: true,
  from: '08:00',
  to: '22:00',
}))

function CopyHoursMenu({
  sourceDay,
  onApply
}: {
  sourceDay: string
  onApply: (targetDays: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const { t } = useTranslation()

  return (
    <DropdownMenu open={open} onOpenChange={o => { setOpen(o); if (!o) setSelected([]) }}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 ml-2 text-muted-foreground hover:text-foreground shrink-0" title="Copy hours">
          <Copy className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">{t('businessProfile.copyTo')}</div>
        {DAYS_OF_WEEK.filter(d => d.key !== sourceDay).map(d => (
          <DropdownMenuCheckboxItem
            key={d.key}
            checked={selected.includes(d.key)}
            onSelect={e => e.preventDefault()}
            onCheckedChange={c => {
              if (c) setSelected(prev => [...prev, d.key])
              else setSelected(prev => prev.filter(k => k !== d.key))
            }}
          >
            {t(`businessProfile.days.${d.key}`)}
          </DropdownMenuCheckboxItem>
        ))}
        <div className="p-2 mt-1 border-t border-border">
          <Button
            size="sm"
            className="w-full text-xs h-7"
            disabled={selected.length === 0}
            onClick={() => {
              onApply(selected)
              setOpen(false)
            }}
          >
            {t('businessProfile.apply')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function BusinessProfileForm({ business }: { business: Business }) {
  const { refreshBusinesses } = useBusiness()
  const { t } = useTranslation()

  // General fields
  const [name, setName] = useState(business.name)
  const [category, setCategory] = useState<string>(business.category?.[0] ?? '')
  const [tags, setTags] = useState<string[]>(business.tags ?? [])
  const [customTagInput, setCustomTagInput] = useState('')
  const [customTagsList, setCustomTagsList] = useState<string[]>(() => {
    return (business.tags ?? []).filter(t => !BUSINESS_TAGS.includes(t as typeof BUSINESS_TAGS[number]))
  })

  // Contact
  const [address, setAddress] = useState(business.address ?? '')
  const [city, setCity] = useState(business.city ?? '')
  const [phone, setPhone] = useState(business.phone ?? '')
  const [email, setEmail] = useState(business.email ?? '')

  // Hours
  const [hours, setHours] = useState<OpeningHoursEntry[]>(() => {
    const saved = business.opening_hours as OpeningHoursEntry[] | null
    if (saved && Array.isArray(saved) && saved.length === 7) return saved
    return DEFAULT_HOURS
  })

  // Social links
  const [socials, setSocials] = useState<Record<string, string>>(() => {
    return (business.social_links as Record<string, string>) ?? {}
  })

  // Logo
  const [logoUrl, setLogoUrl] = useState(business.logo_url ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [saving, setSaving] = useState(false)

  function toggleTag(tag: string) {
    setTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function handleAddCustomTag() {
    const t = customTagInput.trim()
    if (!t) return
    if (!BUSINESS_TAGS.includes(t as typeof BUSINESS_TAGS[number]) && !customTagsList.includes(t)) {
      setCustomTagsList(prev => [...prev, t])
    }
    if (!tags.includes(t)) {
      setTags(prev => [...prev, t])
    }
    setCustomTagInput('')
  }

  function removeCustomTag(tag: string) {
    setCustomTagsList(prev => prev.filter(t => t !== tag))
    setTags(prev => prev.filter(t => t !== tag))
  }

  function setHourField(day: string, field: keyof OpeningHoursEntry, value: unknown) {
    setHours(prev =>
      prev.map(h => h.day === day ? { ...h, [field]: value } : h)
    )
  }

  function handleCopyHours(sourceEntry: OpeningHoursEntry, targetDays: string[]) {
    setHours(prev => prev.map(h => {
      if (targetDays.includes(h.day)) {
        return { ...h, open: true, from: sourceEntry.from, to: sourceEntry.to }
      }
      return h
    }))
    toast.success(`${t('businessProfile.toastHoursCopied').replace('{{count}}', String(targetDays.length))}`)
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoUploading(true)
    try {
      const url = await uploadLogo(business.id, file)
      setLogoUrl(url)
      await updateBusiness(business.id, { logo_url: url })
      await refreshBusinesses()
      toast.success(t('businessProfile.toastLogoUpdated'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('businessProfile.toastUploadFailed'))
    } finally {
      setLogoUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    // Validate social links
    for (const [key, value] of Object.entries(socials)) {
      if (!value) continue
      const url = value.toLowerCase()
      if (key === 'facebook' && !url.includes('facebook.com') && !url.includes('fb.com') && !url.includes('fb.me')) {
        toast.error(t('businessProfile.toastInvalidFacebook'))
        return
      }
      if (key === 'instagram' && !url.includes('instagram.com')) {
        toast.error(t('businessProfile.toastInvalidInstagram'))
        return
      }
      if (key === 'zalo' && !url.includes('zalo.me') && !url.includes('zalo.app')) {
        toast.error(t('businessProfile.toastInvalidZalo'))
        return
      }
      if (key === 'tiktok' && !url.includes('tiktok.com')) {
        toast.error(t('businessProfile.toastInvalidTikTok'))
        return
      }
      if (key === 'youtube' && !url.includes('youtube.com') && !url.includes('youtu.be')) {
        toast.error(t('businessProfile.toastInvalidYoutube'))
        return
      }
    }

    setSaving(true)

    try {
      await updateBusiness(business.id, {
        name,
        category: category ? [category] : [],
        tags,
        address: address || null,
        city: city || null,
        phone: phone || null,
        email: email || null,
        opening_hours: hours,
        social_links: socials,
      })
      await refreshBusinesses()
      toast.success(t('businessProfile.toastSaved'))
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('businessProfile.toastSaveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('sidebar.businessProfile')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('businessProfile.headerDesc')}
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-10">
        {/* ── Logo ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t('businessProfile.logo')}</h2>
        <div className="flex items-center gap-5">
          <Avatar className="size-20 rounded-xl border border-border">
            <AvatarImage src={logoUrl || undefined} className="object-cover" />
            <AvatarFallback className="rounded-xl text-lg font-bold bg-muted">
              {name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleLogoChange}
            />
            <Button
              type="button"
              id="upload-logo-btn"
              variant="outline"
              size="sm"
              disabled={logoUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {logoUploading ? (
                <><Loader2 className="size-4 animate-spin mr-2" /> {t('businessProfile.uploading')}</>
              ) : (
                <><Upload className="size-4 mr-2" /> {t('businessProfile.uploadLogo')}</>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">{t('businessProfile.logoHint')}</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── General ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t('businessProfile.general')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prof-name">{t('businessProfile.businessName')}</Label>
            <Input
              id="prof-name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-category">{t('businessProfile.category')}</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="prof-category">
                <SelectValue placeholder={t('businessProfile.selectCategory')} />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <Label>{t('businessProfile.tags')}</Label>
          <div className="flex flex-wrap gap-2">
            {BUSINESS_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm border transition-colors',
                  tags.includes(tag)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                )}
              >
                {BUSINESS_TAGS.includes(tag as any) ? t(`businessProfile.tagsList.${tag}`) : tag}
              </button>
            ))}
            {customTagsList.map(tag => (
              <div key={tag} className="relative inline-flex group">
                <button
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'pl-3 pr-8 py-1 rounded-full text-sm border transition-colors',
                    tags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  )}
                >
                  {tag}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeCustomTag(tag) }}
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full opacity-60 hover:opacity-100 transition-opacity",
                    tags.includes(tag) ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Delete custom tag"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder={t('businessProfile.addCustomTag')}
              value={customTagInput}
              onChange={e => setCustomTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustomTag()
                }
              }}
              className="max-w-xs"
            />
            <Button type="button" variant="secondary" onClick={() => handleAddCustomTag()}>
              {t('businessProfile.add')}
            </Button>
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Contact ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t('businessProfile.contact')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="prof-address">{t('businessProfile.address')}</Label>
            <Input
              id="prof-address"
              placeholder="123 Nguyen Hue, District 1"
              value={address}
              onChange={e => setAddress(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-city">{t('businessProfile.city')}</Label>
            <Input
              id="prof-city"
              placeholder="Ho Chi Minh City"
              value={city}
              onChange={e => setCity(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-phone">{t('businessProfile.phone')}</Label>
            <Input
              id="prof-phone"
              placeholder="+84 9xx xxx xxx"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prof-email">{t('businessProfile.email')}</Label>
            <Input
              id="prof-email"
              type="email"
              placeholder="hello@yourbusiness.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
        </div>
      </section>

      <Separator />

      {/* ── Opening Hours ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t('businessProfile.openingHours')}</h2>
        <div className="space-y-2">
          {DAYS_OF_WEEK.map(d => {
            const entry = hours.find(h => h.day === d.key) ?? { day: d.key, open: false, from: '08:00', to: '22:00' }
            return (
              <div
                key={d.key}
                className={cn(
                  'flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-4 py-3 rounded-lg border transition-colors',
                  entry.open ? 'bg-background border-border' : 'bg-muted/40 border-border/60'
                )}
              >
                <div className="flex items-center justify-between w-full md:w-auto">
                  <div className="flex items-center gap-4">
                    <Switch
                      id={`hours-${d.key}`}
                      checked={entry.open}
                      onCheckedChange={v => setHourField(d.key, 'open', v)}
                    />
                    <Label
                      htmlFor={`hours-${d.key}`}
                      className={cn('w-24 cursor-pointer text-sm font-medium', !entry.open && 'text-muted-foreground')}
                    >
                      {t(`businessProfile.days.${d.key}`)}
                    </Label>
                  </div>
                  {entry.open && <div className="md:hidden"><CopyHoursMenu sourceDay={d.key} onApply={targets => handleCopyHours(entry, targets)} /></div>}
                  {!entry.open && <span className="md:hidden text-sm text-muted-foreground">{t('businessProfile.closed')}</span>}
                </div>

                {entry.open ? (
                  <div className="flex items-center justify-between md:justify-start gap-2 md:ml-auto">
                    <Select
                      value={entry.from}
                      onValueChange={v => setHourField(d.key, 'from', v)}
                    >
                      <SelectTrigger className="flex-1 md:w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {HOURS.map(h => (
                          <SelectItem key={h.value} value={h.value} className="text-xs">
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm px-1">—</span>
                    <Select
                      value={entry.to}
                      onValueChange={v => setHourField(d.key, 'to', v)}
                    >
                      <SelectTrigger className="flex-1 md:w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48">
                        {HOURS.map(h => (
                          <SelectItem key={h.value} value={h.value} className="text-xs">
                            {h.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="hidden md:block"><CopyHoursMenu sourceDay={d.key} onApply={targets => handleCopyHours(entry, targets)} /></div>
                  </div>
                ) : (
                  <span className="hidden md:block ml-auto text-sm text-muted-foreground">{t('businessProfile.closed')}</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <Separator />

      {/* ── Social Links ── */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold">{t('businessProfile.socialLinks')}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SOCIAL_LINKS_CONFIG.map(s => (
            <div key={s.key} className="space-y-2">
              <Label htmlFor={`social-${s.key}`}>{s.label}</Label>
              <Input
                id={`social-${s.key}`}
                placeholder={s.placeholder}
                value={socials[s.key] ?? ''}
                onChange={e => setSocials(prev => ({ ...prev, [s.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Save button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          id="save-profile-btn"
          disabled={saving}
          className="min-w-32"
        >
          {saving ? (
            <><Loader2 className="size-4 animate-spin mr-2" /> {t('businessProfile.saving')}</>
          ) : t('businessProfile.saveProfile')}
        </Button>
      </div>
      </form>
    </>
  )
}
