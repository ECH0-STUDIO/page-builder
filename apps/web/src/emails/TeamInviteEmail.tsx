import * as React from 'react'

interface TeamInviteEmailProps {
  businessName: string
  invitedByEmail: string
  role: string
  inviteLink: string
}

export const TeamInviteEmail: React.FC<Readonly<TeamInviteEmailProps>> = ({
  businessName,
  invitedByEmail,
  role,
  inviteLink,
}) => {
  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto', padding: '20px', color: '#333' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>
        You've been invited to join {businessName}
      </h1>
      <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '24px' }}>
        <strong>{invitedByEmail}</strong> has invited you to join their team on Eatery as a <strong>{role}</strong>.
      </p>
      <div style={{ marginBottom: '32px' }}>
        <a 
          href={inviteLink}
          style={{
            backgroundColor: '#000',
            color: '#fff',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}
        >
          Accept Invitation
        </a>
      </div>
      <p style={{ fontSize: '14px', color: '#666', lineHeight: '1.5' }}>
        If you don't have an Eatery account yet, you'll be prompted to create one securely before joining the team.
      </p>
      <hr style={{ border: 'none', borderTop: '1px solid #eaeaea', margin: '32px 0' }} />
      <p style={{ fontSize: '12px', color: '#999' }}>
        This invitation was intended for you. If you were not expecting this invitation, you can ignore this email.
      </p>
    </div>
  )
}
