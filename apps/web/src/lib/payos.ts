import PayOS from '@payos/node'

const clientId = process.env.PAYOS_CLIENT_ID || 'dummy_client_id'
const apiKey = process.env.PAYOS_API_KEY || 'dummy_api_key'
const checksumKey = process.env.PAYOS_CHECKSUM_KEY || 'dummy_checksum_key'

export const payos = new PayOS(clientId, apiKey, checksumKey)
