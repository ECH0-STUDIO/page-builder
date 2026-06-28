export function NexbetPageHeader({
  badge,
  title,
  description,
  center = true,
}: {
  badge?: string
  title: string
  description: string
  center?: boolean
}) {
  return (
    <>
      <div className="padding-section-medium" />
      <div className="padding-global">
        <div className="container-large">
          <div className="features_header">
            {badge && (
              <div className="tag-item w-variant-17e1f4b8-a107-555d-b66e-feb7c5abc5b1">
                <div>{badge}</div>
              </div>
            )}
            <div className="max-title is-36rem">
              <h1 className={center ? 'text-align-center' : undefined}>{title}</h1>
            </div>
            <div className="max-description is-23rem">
              <div className={`text-color-secondary${center ? ' text-align-center' : ''}`}>{description}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
