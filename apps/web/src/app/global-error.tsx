'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary for errors thrown in the root layout, where no other
 * boundary can catch them. Must render its own <html>/<body>, and cannot rely
 * on providers or fonts because the tree that would supply them is what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Root layout error:', error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#fafafa',
            color: '#18181b',
          }}
        >
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 8px' }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '0.925rem', lineHeight: 1.5, color: '#52525b', margin: '0 0 20px' }}>
              Đã xảy ra lỗi. Vui lòng thử lại.
            </p>
            <button
              onClick={reset}
              style={{
                border: 'none',
                borderRadius: '9999px',
                background: '#18181b',
                color: '#fff',
                padding: '10px 22px',
                fontSize: '0.925rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Try again
            </button>
            {error.digest && (
              <p style={{ fontSize: '0.75rem', color: '#a1a1aa', marginTop: '16px' }}>
                Reference: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
