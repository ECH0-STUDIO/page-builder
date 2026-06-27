'use client'

import { useState } from 'react'
import { Loader2, Mail, MessageSquare } from 'lucide-react'
import { submitContactFormAction } from '@/app/actions/contact'
import { MarketingShell } from '@/components/marketing/MarketingShell'
import { PageHeader } from '@/components/marketing/MarketingCta'

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')

    const formData = new FormData(e.currentTarget)
    const result = await submitContactFormAction(formData)

    if (result.success) {
      setStatus('success')
      e.currentTarget.reset()
    } else {
      setStatus('error')
      setError(result.error || 'Something went wrong.')
    }
  }

  return (
    <MarketingShell activeNav="/contact">
      <section className="py-16 lg:py-24">
        <div className="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            eyebrow="Contact"
            title="Talk to the Eatery team"
            description="Questions about setup, credits, or partnerships? Send us a message — we typically reply within 1–2 business days."
          />

          <div className="max-w-xl mx-auto">
            {status === 'success' ? (
              <div className="text-center p-10 rounded-2xl border border-emerald-200 bg-emerald-50">
                <Mail className="size-10 mx-auto text-emerald-600 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">Message sent</h2>
                <p className="mt-2 text-gray-600">Thanks for reaching out. We will get back to you soon.</p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="p-8 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-5"
              >
                {status === 'error' && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="you@restaurant.com"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    className="py-2.5 px-4 block w-full border border-gray-200 rounded-lg text-sm focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                    placeholder="How can we help?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      <MessageSquare className="size-4" /> Send message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </MarketingShell>
  )
}
