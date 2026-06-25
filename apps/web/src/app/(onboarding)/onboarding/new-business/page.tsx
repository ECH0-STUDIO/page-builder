'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { slugify, checkSlugAvailable } from '@/lib/business'
import { BUSINESS_CATEGORIES } from '@/lib/constants'
import { createBusinessAction } from '@/app/actions/business'

type Step = 1 | 2

export default function NewBusinessPage() {
  const router = useRouter()

  // Step 1
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugEdited, setSlugEdited] = useState(false)

  // Step 2
  const [category, setCategory] = useState('')

  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  // Auto-generate slug from name
  // Auto-generate slug from name during render
  if (!slugEdited && name && slug !== slugify(name)) {
    setSlug(slugify(name))
  }

  // Debounced slug check
  const checkSlug = useCallback(async (value: string) => {
    if (value.length < 2) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    const available = await checkSlugAvailable(value)
    setSlugStatus(available ? 'available' : 'taken')
  }, [])

  // Sync idle status during render
  if (!slug && slugStatus !== 'idle') {
    setSlugStatus('idle')
  }

  useEffect(() => {
    if (!slug) return
    const timer = setTimeout(() => checkSlug(slug), 400)
    return () => clearTimeout(timer)
  }, [slug, checkSlug])

  function handleSlugChange(val: string) {
    setSlugEdited(true)
    setSlug(slugify(val))
  }

  function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault()
    if (slugStatus !== 'available') return
    setStep(2)
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault()
    if (!category) return
    setSaving(true)

    const result = await createBusinessAction({ name, slug, category: [category] })

    if (result.success) {
      toast.success('Business created!')
      router.push('/dashboard')
      router.refresh()
    } else {
      toast.error(result.error)
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-8">
        {([1, 2] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-3">
            {i > 0 && <div className={cn('h-px flex-1 w-8 bg-border', step > s - 1 && 'bg-primary')} />}
            <div className={cn(
              'size-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors',
              step === s ? 'bg-primary text-primary-foreground' :
              step > s  ? 'bg-primary/20 text-primary' :
                          'bg-muted text-muted-foreground'
            )}>
              {step > s ? <CheckCircle2 className="size-4" /> : s}
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Name & Slug */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Name your business</CardTitle>
            <CardDescription>
              This becomes your public page URL. You can change it later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="biz-name">Business name</Label>
                <Input
                  id="biz-name"
                  placeholder="La Cafe, Pho 24, Tran Bakery..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="biz-slug">
                  Page URL slug
                  {slugStatus === 'checking' && (
                    <span className="ml-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> Checking…
                    </span>
                  )}
                  {slugStatus === 'available' && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Available
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="ml-2 text-xs text-destructive inline-flex items-center gap-1">
                      <AlertCircle className="size-3" /> Already taken
                    </span>
                  )}
                </Label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-muted border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                    eatery.app/
                  </span>
                  <Input
                    id="biz-slug"
                    className="rounded-l-none"
                    placeholder="la-cafe"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, numbers, and hyphens only.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={slugStatus !== 'available' || !name || !slug}
              >
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Category */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>What type of business?</CardTitle>
            <CardDescription>
              This helps customers find your restaurant online.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinish} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="biz-category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="biz-category" className="w-full">
                    <SelectValue placeholder="Select a category…" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  disabled={saving}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!category || saving}
                >
                  {saving ? (
                    <><Loader2 className="size-4 animate-spin mr-2" />Creating…</>
                  ) : 'Create business'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
