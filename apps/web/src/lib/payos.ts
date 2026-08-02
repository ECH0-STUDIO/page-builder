import { PayOS } from '@payos/node'

const clientId = process.env.PAYOS_CLIENT_ID
const apiKey = process.env.PAYOS_API_KEY
const checksumKey = process.env.PAYOS_CHECKSUM_KEY

const missing =
  !clientId || !apiKey || !checksumKey ||
  clientId === 'dummy_client_id' ||
  apiKey === 'dummy_api_key' ||
  checksumKey === 'dummy_checksum_key'

if (missing && process.env.NODE_ENV === 'production') {
  console.error(
    '[payos] PAYOS_CLIENT_ID / PAYOS_API_KEY / PAYOS_CHECKSUM_KEY are missing or dummy. Credit checkout will fail.',
  )
}

export const payos = new PayOS({
  clientId: clientId || 'dummy_client_id',
  apiKey: apiKey || 'dummy_api_key',
  checksumKey: checksumKey || 'dummy_checksum_key',
})
