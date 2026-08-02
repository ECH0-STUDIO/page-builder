export default function ExploreMarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <link rel="stylesheet" href="/marketing/css/normalize.css" />
      <link rel="stylesheet" href="/marketing/css/webflow.css" />
      <link
        rel="stylesheet"
        href="/marketing/css/thais-fantabulous-site-defac5.webflow.css"
      />
      {children}
    </>
  )
}
