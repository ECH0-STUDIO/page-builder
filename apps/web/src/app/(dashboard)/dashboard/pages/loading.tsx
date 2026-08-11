import { Loader2 } from 'lucide-react'

/** Shown while the landing / order builder route is loading after a mode switch. */
export default function PageBuilderLoading() {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-background">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Loading…
      </div>
    </div>
  )
}
