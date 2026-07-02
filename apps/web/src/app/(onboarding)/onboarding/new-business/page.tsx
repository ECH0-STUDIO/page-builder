'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { slugify, checkSlugAvailable } from '@/lib/business'
import { createBusinessAction } from '@/app/actions/business'

export default function NewBusinessPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [slugEdited, setSlugEdited] = useState(false)
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (slugStatus !== 'available' || !name || !slug) return
    setSaving(true)

    const result = await createBusinessAction({ name, slug })

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
      <Card>
        <CardHeader>
          <CardTitle>Name your restaurant</CardTitle>
          <CardDescription>
            This becomes your public page URL. You can change it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="biz-name">Restaurant name</Label>
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
              disabled={slugStatus !== 'available' || !name || !slug || saving}
            >
              {saving ? (
                <><Loader2 className="size-4 animate-spin mr-2" />Creating…</>
              ) : 'Create restaurant'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
