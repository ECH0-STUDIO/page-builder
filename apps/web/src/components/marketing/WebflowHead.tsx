/** Inject Webflow <style> blocks from export head (animation / layout helpers). */
export function WebflowHead({ headHtml }: { headHtml: string }) {
  const styles = headHtml.match(/<style[\s\S]*?<\/style>/gi) ?? []
  if (styles.length === 0) return null

  return (
    <>
      {styles.map((styleTag, i) => (
        <span key={i} dangerouslySetInnerHTML={{ __html: styleTag }} />
      ))}
    </>
  )
}
