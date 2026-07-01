/** Server-rendered Webflow HTML — avoids client hydration mismatches on large markup. */
export function WebflowBody({ bodyHtml }: { bodyHtml: string }) {
  return (
    <div
      className="marketing-webflow"
      dangerouslySetInnerHTML={{ __html: bodyHtml }}
      suppressHydrationWarning
    />
  )
}
