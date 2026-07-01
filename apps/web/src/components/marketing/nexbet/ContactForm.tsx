'use client'

import { useState } from 'react'
import { submitContactFormAction } from '@/app/actions/contact'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'
import type { SupportedLocale } from '@/i18n/locale'
import { getMarketingCopy } from '@/lib/marketing-copy'

export function ContactForm({ locale }: { locale: SupportedLocale }) {
  const copy = getMarketingCopy(locale)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    const result = await submitContactFormAction(new FormData(e.currentTarget))
    if (result.success) {
      setStatus('success')
      e.currentTarget.reset()
    } else {
      setStatus('error')
      setError(result.error || 'Something went wrong.')
    }
  }

  return (
    <>
      <NexbetPageHeader badge={copy.contact.badge} title={copy.contact.title} description={copy.contact.description} />
      <section className="section_features">
        <div className="padding-global">
          <div className="container-large">
            <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
              {status === 'success' ? (
                <div className="impact_item is-medium" style={{ textAlign: 'center' }}>
                  <p className="text-color-secondary">{copy.contact.success}</p>
                  <button type="button" className="button w-inline-block" onClick={() => setStatus('idle')}>
                    <div className="button_mask">
                      <div className="button_text">{copy.contact.send}</div>
                    </div>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="features_card is-large" style={{ padding: '2rem' }}>
                  {status === 'error' && (
                    <p className="text-color-secondary" style={{ color: '#dc2626', marginBottom: '1rem' }}>
                      {error}
                    </p>
                  )}
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="name" className="text-weight-medium">
                      {copy.contact.name}
                    </label>
                    <input id="name" name="name" required className="marketing-input" />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="email" className="text-weight-medium">
                      {copy.contact.email}
                    </label>
                    <input id="email" name="email" type="email" required className="marketing-input" />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="message" className="text-weight-medium">
                      {copy.contact.message}
                    </label>
                    <textarea id="message" name="message" required rows={5} className="marketing-textarea" />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="button w-inline-block"
                    style={{ width: '100%' }}
                  >
                    <div className="button_mask">
                      <div className="button_text">{status === 'loading' ? copy.contact.sending : copy.contact.send}</div>
                    </div>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
    </>
  )
}
