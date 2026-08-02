/** Page builder is full-viewport — no dashboard chrome padding or scroll. */
export default function PageBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-30 bg-background">
      {children}
    </div>
  )
}
