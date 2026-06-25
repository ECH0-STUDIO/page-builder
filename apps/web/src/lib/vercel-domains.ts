/**
 * Optionally register a custom domain with the Vercel project.
 * Requires VERCEL_TOKEN and VERCEL_PROJECT_ID in environment variables.
 */
export async function addDomainToVercel(domain: string): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!token || !projectId) {
    return { ok: true, skipped: true }
  }

  try {
    const res = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: domain }),
    })

    if (res.ok || res.status === 409) {
      return { ok: true }
    }

    const body = await res.text()
    return { ok: false, error: body || `Vercel API error ${res.status}` }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Vercel request failed' }
  }
}

export async function removeDomainFromVercel(domain: string): Promise<{ ok: boolean; skipped?: boolean }> {
  const token = process.env.VERCEL_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!token || !projectId) {
    return { ok: true, skipped: true }
  }

  try {
    await fetch(`https://api.vercel.com/v9/projects/${projectId}/domains/${domain}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    return { ok: true }
  } catch {
    return { ok: false }
  }
}
