'use server'

import { Resend } from 'resend'

const CONTACT_TO = process.env.CONTACT_EMAIL || 'hello@eateryvn.com'
const SENDER = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'noreply@eateryvn.com'

export async function submitContactFormAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim()
  const email = String(formData.get('email') || '').trim()
  const message = String(formData.get('message') || '').trim()

  if (!name || !email || !message) {
    return { success: false, error: 'Please fill in all fields.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[contact] Mock send:', { name, email, message })
    return { success: true }
  }

  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: `Eatery Contact <${SENDER}>`,
    to: CONTACT_TO,
    replyTo: email,
    subject: `Contact form: ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  })

  if (error) {
    console.error('Contact form email error:', error)
    return { success: false, error: 'Could not send your message. Please try again later.' }
  }

  return { success: true }
}
