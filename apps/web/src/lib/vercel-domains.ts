/**
 * Vercel project domain API — enables self-service custom domains for business owners.
 * Requires VERCEL_TOKEN + VERCEL_PROJECT_ID (and VERCEL_TEAM_ID if project is under a team).
 */

export interface DnsRecord {
  type: string
  name: string
  value: string
}

export interface VercelDomainResult {
  ok: boolean
  verified?: boolean
  verification?: Array<{ type: string; domain: string; value: string }>
  error?: string
  skipped?: boolean
}

function getConfig() {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID
  if (!token || !projectId) {
    return null
  }
  return { token, projectId, teamId: process.env.VERCEL_TEAM_ID }
}

function apiUrl(path: string): string {
  const teamId = process.env.VERCEL_TEAM_ID
  const url = new URL(`https://api.vercel.com${path}`)
  if (teamId) url.searchParams.set('teamId', teamId)
  return url.toString()
}

async function vercelFetch(path: string, init?: RequestInit): Promise<Response> {
  const config = getConfig()
  if (!config) throw new Error('VERCEL_NOT_CONFIGURED')

  return fetch(apiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
}

/** Standard Vercel DNS targets + optional TXT verification from add-domain response. */
export function buildDnsRecords(
  domain: string,
  verification?: Array<{ type: string; domain: string; value: string }>
): DnsRecord[] {
  const labels = domain.split('.')
  const isApex = labels.length === 2
  const records: DnsRecord[] = []

  if (isApex) {
    records.push({ type: 'A', name: '@', value: '76.76.21.21' })
  } else {
    records.push({ type: 'CNAME', name: labels[0], value: 'cname.vercel-dns.com' })
  }

  for (const v of verification ?? []) {
    const name = v.domain === domain ? '@' : v.domain.replace(`.${domain}`, '').replace(domain, '@')
    records.push({
      type: v.type,
      name: name === domain ? '@' : name,
      value: v.value,
    })
  }

  return records
}

export async function addDomainToProject(domain: string): Promise<VercelDomainResult> {
  const config = getConfig()
  if (!config) {
    return { ok: false, error: 'VERCEL_NOT_CONFIGURED', skipped: true }
  }

  try {
    const res = await vercelFetch(`/v10/projects/${config.projectId}/domains`, {
      method: 'POST',
      body: JSON.stringify({ name: domain }),
    })

    const body = await res.json().catch(() => ({}))

    if (res.ok || res.status === 409) {
      return {
        ok: true,
        verified: body.verified === true,
        verification: body.verification,
      }
    }

    return { ok: false, error: body.error?.message || body.message || `Vercel error ${res.status}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Vercel request failed' }
  }
}

export async function verifyProjectDomain(domain: string): Promise<VercelDomainResult> {
  const config = getConfig()
  if (!config) {
    return { ok: false, error: 'VERCEL_NOT_CONFIGURED', skipped: true }
  }

  try {
    const res = await vercelFetch(
      `/v9/projects/${config.projectId}/domains/${encodeURIComponent(domain)}/verify`,
      { method: 'POST' }
    )

    const body = await res.json().catch(() => ({}))

    if (res.ok) {
      return { ok: true, verified: body.verified === true }
    }

    return { ok: false, error: body.error?.message || body.message || `Verification failed (${res.status})` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Verification request failed' }
  }
}

export async function getProjectDomain(domain: string): Promise<VercelDomainResult> {
  const config = getConfig()
  if (!config) {
    return { ok: false, error: 'VERCEL_NOT_CONFIGURED', skipped: true }
  }

  try {
    const res = await vercelFetch(
      `/v9/projects/${config.projectId}/domains/${encodeURIComponent(domain)}`
    )
    const body = await res.json().catch(() => ({}))

    if (res.ok) {
      return {
        ok: true,
        verified: body.verified === true,
        verification: body.verification,
      }
    }

    return { ok: false, error: body.error?.message || 'Domain not found on project' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to fetch domain' }
  }
}

export async function getDomainConfig(domain: string): Promise<{ ok: boolean; misconfigured?: boolean; error?: string }> {
  const config = getConfig()
  if (!config) {
    return { ok: false, error: 'VERCEL_NOT_CONFIGURED' }
  }

  try {
    const res = await vercelFetch(`/v6/domains/${encodeURIComponent(domain)}/config`)
    const body = await res.json().catch(() => ({}))

    if (res.ok) {
      return { ok: true, misconfigured: body.misconfigured === true }
    }

    return { ok: false, error: body.error?.message || 'Config check failed' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Config request failed' }
  }
}

export async function removeDomainFromProject(domain: string): Promise<{ ok: boolean; skipped?: boolean }> {
  const config = getConfig()
  if (!config) return { ok: true, skipped: true }

  try {
    await vercelFetch(
      `/v9/projects/${config.projectId}/domains/${encodeURIComponent(domain)}`,
      { method: 'DELETE' }
    )
    return { ok: true }
  } catch {
    return { ok: false }
  }
}

export function isVercelDomainsConfigured(): boolean {
  return getConfig() !== null
}
