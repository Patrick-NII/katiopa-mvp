export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000').replace(/\/$/, '');

function authHeaders() {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(r: Response): Promise<T> {
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(text || `HTTP ${r.status}`);
  }
  return r.json() as Promise<T>;
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  return handle<T>(await fetch(url, { 
    headers: { 
      'Content-Type': 'application/json', 
      ...authHeaders() 
    } 
  }));
}

export async function apiPost<T>(path: string, body?: any): Promise<T> {
  const url = `${API_BASE}${path.startsWith('/') ? path : '/' + path}`;
  return handle<T>(await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json', 
      ...authHeaders() 
    },
    body: JSON.stringify(body ?? {})
  }));
}