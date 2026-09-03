import Link from 'next/link'
import { Languages } from 'lucide-react'

/** Placeholder until Phase C Translation UI ships. */
export default function TranslationsIndexPage() {
  return (
    <div className="p-4 md:p-8 max-w-2xl space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
          <Languages className="size-5 text-muted-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Translations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Central place to translate your store into purchased languages.
          </p>
        </div>
      </div>
      <div className="rounded-xl border bg-muted/30 p-5 text-sm text-muted-foreground space-y-3">
        <p>
          Activate a language under{' '}
          <Link href="/dashboard/settings/languages" className="underline underline-offset-2 text-foreground">
            Settings → Store languages
          </Link>
          , then return here to fill translations (or use AI translate in a later update).
        </p>
        <p className="text-xs">
          Until the full Translation UI ships, purchased locales are live at{' '}
          <code className="px-1 py-0.5 rounded bg-muted text-foreground">/{'{locale}'}/{'{slug}'}</code>{' '}
          and fall back to your primary language content.
        </p>
      </div>
    </div>
  )
}
