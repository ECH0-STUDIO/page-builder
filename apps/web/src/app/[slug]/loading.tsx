export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <div className="h-14 border-b border-border bg-muted/40" />
      <div className="mx-auto max-w-[1440px] px-4 py-8 space-y-6">
        <div className="h-56 rounded-xl bg-muted/60" />
        <div className="h-8 w-64 rounded-md bg-muted/60" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="h-40 rounded-xl bg-muted/50" />
          <div className="h-40 rounded-xl bg-muted/50" />
          <div className="h-40 rounded-xl bg-muted/50" />
        </div>
      </div>
    </div>
  )
}
