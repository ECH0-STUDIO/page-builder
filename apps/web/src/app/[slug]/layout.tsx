/**
 * Dedicated layout for the public live business page.
 * Intentionally skips ThemeProvider (next-themes) to avoid the
 * "script tag inside React component" dev-overlay error and to ensure
 * the live page always renders in light mode regardless of the
 * visitor's OS preference.
 */
export default function SlugLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
