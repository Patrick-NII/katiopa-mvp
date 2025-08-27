'use client'
import { apiPost } from '@/lib/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { Field } from '@/components/Field'
import PasswordInput from '@/components/PasswordInput'
import { Alert } from '@/components/Alert'

export default function Login() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setFieldErrors({}); setLoading(true)
    try {
      const res = await apiPost<{ token: string }>("/auth/login", form)
      localStorage.setItem('token', res.token)
      router.push('/dashboard')
    } catch (err: any) {
      try {
        const parsed = JSON.parse(err.message)
        const fe = parsed?.error?.details?.fieldErrors || parsed?.error?.fieldErrors
        if (fe) {
          const out: Record<string,string> = {}
          Object.entries(fe).forEach(([k,v]: any) => { out[k] = Array.isArray(v) ? v[0] : String(v) })
          setFieldErrors(out)
        } else setError(parsed?.error?.message || 'Identifiants incorrects.')
      } catch { setError('Identifiants incorrects.') }
    } finally { setLoading(false) }
  }

  return (
    <>
      <NavBar />
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-1xl font-semibold">Connexion</h1>
          <p className="text-gray-600 mb-4">Ravi de vous revoir.</p>
          {error && <div className="mb-3"><Alert>{error}</Alert></div>}
          <form onSubmit={submit} className="space-y-3" noValidate>
            <Field label="Email" error={fieldErrors.email}>
              <input type="email" className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required autoComplete="email"/>
            </Field>
            <Field label="Mot de passe" error={fieldErrors.password}>
              <PasswordInput value={form.password} onChange={e=>setForm({...form, password:(e.target as HTMLInputElement).value})} required autoComplete="current-password"/>
            </Field>
            <div className="flex items-center justify-between">
              <a className="text-xs text-gray-500 underline" href="#">Mot de passe oublié ?</a>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? <span className="spinner mr-2"/> : null} Se connecter</button>
            <p className="text-xs text-center text-gray-500">Pas de compte ? <a href="/register" className="underline">Créer un compte</a></p>
          </form>
        </div>
      </div>
    </>
  )
}