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
import { useTranslation } from '@/i18n/I18nProvider'

type Step = 1 | 2

export default function NewBusinessPage() {
  const router = useRouter()
  const { t } = useTranslation()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugEdited, setSlugEdited] = useState(false)
  const [category, setCategory] = useState('')
  const [step, setStep] = useState<Step>(1)
  const [saving, setSaving] = useState(false)

  if (!slugEdited && name && slug !== slugify(name)) {
    setSlug(slugify(name))
  }

  const checkSlug = useCallback(async (value: string) => {
    if (value.length < 2) { setSlugStatus('idle'); return }
    setSlugStatus('checking')
    const available = await checkSlugAvailable(value)
    setSlugStatus(available ? 'available' : 'taken')
  }, [])

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
      toast.success(t('onboarding.created'))
      router.push('/dashboard')
      router.refresh()
    } else {
      toast.error(result.error)
      setSaving(false)
    }
  }

  return (
    <div>
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

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('onboarding.nameTitle')}</CardTitle>
            <CardDescription>{t('onboarding.nameDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleStep1Submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="biz-name">{t('onboarding.businessName')}</Label>
                <Input
                  id="biz-name"
                  placeholder={t('onboarding.namePlaceholder')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="biz-slug">
                  {t('onboarding.slugLabel')}
                  {slugStatus === 'checking' && (
                    <span className="ml-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                      <Loader2 className="size-3 animate-spin" /> {t('onboarding.checking')}
                    </span>
                  )}
                  {slugStatus === 'available' && (
                    <span className="ml-2 text-xs text-green-600 dark:text-green-400 inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> {t('onboarding.available')}
                    </span>
                  )}
                  {slugStatus === 'taken' && (
                    <span className="ml-2 text-xs text-destructive inline-flex items-center gap-1">
                      <AlertCircle className="size-3" /> {t('onboarding.taken')}
                    </span>
                  )}
                </Label>
                <div className="flex items-center min-w-0">
                  <span className="px-2 sm:px-3 py-2 bg-muted border border-r-0 border-input rounded-l-md text-xs sm:text-sm text-muted-foreground shrink-0 max-w-[40%] truncate">
                    eatery.app/
                  </span>
                  <Input
                    id="biz-slug"
                    className="rounded-l-none min-w-0"
                    placeholder="la-cafe"
                    value={slug}
                    onChange={e => handleSlugChange(e.target.value)}
                    required
                    minLength={2}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{t('onboarding.slugHint')}</p>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={slugStatus !== 'available' || !name || !slug}
              >
                {t('onboarding.continue')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('onboarding.categoryTitle')}</CardTitle>
            <CardDescription>{t('onboarding.categoryDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinish} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="biz-category">{t('onboarding.category')}</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="biz-category" className="w-full">
                    <SelectValue placeholder={t('onboarding.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {t(`onboarding.categories.${cat.value}`)}
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
                  {t('onboarding.back')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!category || saving}
                >
                  {saving ? (
                    <><Loader2 className="size-4 animate-spin mr-2" />{t('onboarding.creating')}</>
                  ) : t('onboarding.create')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
