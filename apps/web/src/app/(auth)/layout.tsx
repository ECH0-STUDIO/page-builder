import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { I18nProvider } from '@/i18n/I18nProvider'
import { getDictionary } from '@/i18n/getDictionary'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dictionary = await getDictionary()

  return (
    <I18nProvider dictionary={dictionary}>
      <div className="relative min-h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
        {/* Ambient background glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10"
        >
          <div className="absolute -top-40 -left-20 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary)/0.12) 0%, transparent 70%)',
              animation: 'authPulse 8s ease-in-out infinite alternate',
            }}
          />
          <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full"
            style={{
              background: 'radial-gradient(circle, hsl(220 79% 60% / 0.06) 0%, transparent 70%)',
              animation: 'authPulse 11s ease-in-out infinite alternate-reverse',
            }}
          />
          <div
            className="absolute inset-0 opacity-40 dark:opacity-20"
            style={{
              backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 70%)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center gap-8 animate-fade-in">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center group">
            <div className="relative w-48 h-14">
              <Image src="/logo-full.png" alt="Eatery" fill className="object-contain" priority />
            </div>
          </Link>

          {children}
        </div>

        <style>{`
          @keyframes authPulse {
            0% { transform: scale(1) translate(0, 0); }
            100% { transform: scale(1.1) translate(2%, 2%); }
          }
        `}</style>
      </div>
    </I18nProvider>
  )
}
