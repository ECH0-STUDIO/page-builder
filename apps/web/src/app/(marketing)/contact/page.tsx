'use client'

import { useState } from 'react'
import { submitContactFormAction } from '@/app/actions/contact'
import { NexbetShell } from '@/components/marketing/nexbet/NexbetShell'
import { NexbetPageHeader } from '@/components/marketing/nexbet/NexbetPageHeader'

export default function ContactPage() {
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
    <NexbetShell>
      <NexbetPageHeader
        badge="Contact"
        title="Talk to the Eatery team"
        description="Questions about setup, credits, or partnerships? We typically reply within 1–2 business days."
      />
      <section className="section_features">
        <div className="padding-global">
          <div className="container-large">
            <div style={{ maxWidth: '32rem', margin: '0 auto' }}>
              {status === 'success' ? (
                <div className="impact_item is-medium" style={{ textAlign: 'center' }}>
                  <h2 className="h5">Message sent</h2>
                  <p className="text-color-secondary">Thanks for reaching out. We will get back to you soon.</p>
                  <button type="button" className="button w-inline-block" onClick={() => setStatus('idle')}>
                    <div className="button_mask">
                      <div className="button_text">Send another</div>
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
                      Name
                    </label>
                    <input id="name" name="name" required className="marketing-input" placeholder="Your name" />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="email" className="text-weight-medium">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="marketing-input"
                      placeholder="you@restaurant.com"
                    />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label htmlFor="message" className="text-weight-medium">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      className="marketing-textarea"
                      placeholder="How can we help?"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="button w-inline-block"
                    style={{ width: '100%' }}
                  >
                    <div className="button_mask">
                      <div className="button_text">{status === 'loading' ? 'Sending…' : 'Send message'}</div>
                    </div>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        <div className="padding-section-medium" />
      </section>
    </NexbetShell>
  )
}
