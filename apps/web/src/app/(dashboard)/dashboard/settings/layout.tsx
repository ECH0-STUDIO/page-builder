import Link from 'next/link'
import { headers } from 'next/headers'
import { SettingsNav } from './SettingsNav'
import { getServerTranslation } from '@/i18n/getDictionary'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { t } = await getServerTranslation()

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{t('settings.title')}</h1>
        <p className="text-muted-foreground mt-1">
          {t('settings.description')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-[200px] shrink-0">
          <SettingsNav />
        </aside>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
