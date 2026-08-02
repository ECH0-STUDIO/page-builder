export default function DashboardLoading() {
  return (
    <div className="flex-1 min-h-[50vh] p-4 md:p-8 animate-pulse">
      <div className="h-7 w-48 rounded-md bg-muted mb-3" />
      <div className="h-4 w-72 rounded-md bg-muted/70 mb-8" />
      <div className="space-y-3">
        <div className="h-24 rounded-xl bg-muted/60" />
        <div className="h-24 rounded-xl bg-muted/60" />
        <div className="h-40 rounded-xl bg-muted/60" />
      </div>
    </div>
  )
}
