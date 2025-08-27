export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!

export function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body ?? {}) })
  if (!r.ok) throw new Error(await r.text())
  return r.json()
}