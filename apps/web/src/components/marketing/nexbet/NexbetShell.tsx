import { NexbetNav } from './NexbetNav'
import { NexbetFooter } from './NexbetFooter'

export function NexbetShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-wrapper">
      <NexbetNav />
      <main className="main-wrapper">{children}</main>
      <NexbetFooter />
    </div>
  )
}
