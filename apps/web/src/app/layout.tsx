import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Plus_Jakarta_Sans } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/ThemeProvider'
import QueryProvider from '@/lib/react-query/QueryProvider'
import { GlobalNavLoader } from '@/components/GlobalNavLoader'
import './globals.css'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--loaded-font',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: {
    default: 'Eatery — Digital Pages for Restaurants & Cafes',
    template: '%s | Eatery',
  },
  description:
    'Build a beautiful digital menu page, generate QR codes, and export print menus — all in minutes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Forcing light class on html directly causes hydration mismatch with next-themes.
    // Instead we let next-themes handle it at the root level, but we set defaultTheme to light.
    <html lang="en" suppressHydrationWarning>
      <body className={plusJakartaSans.variable} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Suspense fallback={null}>
              <GlobalNavLoader />
            </Suspense>
            <Toaster richColors position="top-right" />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
