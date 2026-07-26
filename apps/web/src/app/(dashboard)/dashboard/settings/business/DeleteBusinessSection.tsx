'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { deleteBusinessAction } from '@/app/actions/business'
import { ACTIVE_BUSINESS_STORAGE_KEY, setActiveBusinessId } from '@/lib/active-business'
import { useTranslation } from '@/i18n/I18nProvider'

type Props = {
  businessId: string
  businessName: string
  isOwner: boolean
}

export function DeleteBusinessSection({ businessId, businessName, isOwner }: Props) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [deleting, setDeleting] = useState(false)

  const nameMatches = confirmName.trim() === businessName.trim()

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setConfirmName('')
  }

  async function handleDelete() {
    if (!nameMatches) return
    setDeleting(true)

    const result = await deleteBusinessAction({
      businessId,
      confirmName: confirmName.trim(),
    })

    if (!result.success) {
      toast.error(result.error)
      setDeleting(false)
      return
    }

    toast.success(t('settings.business.deleteSuccess'))

    if (result.nextBusinessId) {
      setActiveBusinessId(result.nextBusinessId)
      window.location.assign('/dashboard')
      return
    }

    localStorage.removeItem(ACTIVE_BUSINESS_STORAGE_KEY)
    document.cookie = `${ACTIVE_BUSINESS_STORAGE_KEY}=; path=/; max-age=0; SameSite=Lax`
    window.location.assign('/onboarding/new-business')
  }

  if (!isOwner) {
    return (
      <p className="text-sm text-muted-foreground">{t('settings.business.ownerOnly')}</p>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive">
          {t('settings.business.deleteButton')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5 shrink-0" />
            {t('settings.business.deleteTitle')}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-3 text-left text-sm text-muted-foreground">
              <p>{t('settings.business.deleteWarning')}</p>
              <p>
                {t('settings.business.deleteTypePrompt')}{' '}
                <span className="font-semibold text-foreground">{businessName}</span>{' '}
                {t('settings.business.deleteTypeSuffix')}
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="delete-business-confirm">{t('settings.business.deleteConfirmLabel')}</Label>
          <Input
            id="delete-business-confirm"
            value={confirmName}
            onChange={e => setConfirmName(e.target.value)}
            placeholder={businessName}
            autoComplete="off"
            disabled={deleting}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={deleting}
          >
            {t('settings.business.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!nameMatches || deleting}
            onClick={handleDelete}
          >
            {deleting ? (
              <><Loader2 className="size-4 animate-spin mr-2" />{t('settings.business.deleting')}</>
            ) : (
              t('settings.business.deleteConfirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
