import { Resend } from 'resend'
import { TeamInviteEmail } from '@/emails/TeamInviteEmail'
import React from 'react'

const apiKey = process.env.RESEND_API_KEY
const resend = apiKey ? new Resend(apiKey) : null

// The sender email should ideally be configured in env, falling back to a default
const SENDER_EMAIL = process.env.NEXT_PUBLIC_SENDER_EMAIL || 'noreply@eatery.com'

export async function sendTeamInvite(params: {
  toEmail: string
  businessName: string
  invitedByEmail: string
  role: string
  inviteLink: string
}) {
  try {
    if (!resend) {
      console.log('\n======================================================')
      console.log('📧 DEVELOPMENT MODE: Mock Email Sent (RESEND_API_KEY missing)')
      console.log(`To: ${params.toEmail}`)
      console.log(`Subject: You've been invited to join ${params.businessName} on Eatery`)
      console.log(`Invite Link (Click to test): ${params.inviteLink}`)
      console.log('======================================================\n')
      return { success: true, data: { id: 'mock_id_dev_mode' } }
    }

    const { data, error } = await resend.emails.send({
      from: `Eatery <${SENDER_EMAIL}>`,
      to: params.toEmail,
      subject: `You've been invited to join ${params.businessName} on Eatery`,
      react: React.createElement(TeamInviteEmail, {
        businessName: params.businessName,
        invitedByEmail: params.invitedByEmail,
        role: params.role,
        inviteLink: params.inviteLink,
      }),
    })

    if (error) {
      console.error('Resend API Error:', error)
      return { error: error.message }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('Failed to send email:', err)
    return { error: err.message || 'Failed to send email' }
  }
}
