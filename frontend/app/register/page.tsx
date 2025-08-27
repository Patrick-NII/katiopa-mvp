'use client'
import { apiPost } from '@/lib/api'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '@/components/NavBar'
import { Field } from '@/components/Field'
import PasswordInput from '@/components/PasswordInput'
import { Alert } from '@/components/Alert'

export default function Register() {
  const router = useRouter()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setFieldErrors({}); setLoading(true)
    try {
      const res = await apiPost<{ token: string }>("/auth/register", form)
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
        } else setError(parsed?.error?.message || 'Une erreur est survenue.')
      } catch { setError('Impossible de terminer l\'inscription. Vérifie les champs et réessaie.') }
    } finally { setLoading(false) }
  }

  return (
    <>
      <NavBar />
      <div className="container-narrow">
        <div className="card">
          <h1 className="text-2xl font-semibold">Créer un compte</h1>
          <p className="text-gray-600 mb-4">Rejoins Katiopa pour apprendre en s'amusant.</p>
          {error && <div className="mb-3"><Alert>{error}</Alert></div>}
          <form onSubmit={submit} className="space-y-3" noValidate>
            <Field label="Prénom" error={fieldErrors.firstName}>
              <input className="input" value={form.firstName} onChange={e=>setForm({...form, firstName:e.target.value})} required minLength={2} autoComplete="given-name"/>
            </Field>
            <Field label="Nom" error={fieldErrors.lastName}>
              <input className="input" value={form.lastName} onChange={e=>setForm({...form, lastName:e.target.value})} required minLength={2} autoComplete="family-name"/>
            </Field>
            <Field label="Email" error={fieldErrors.email}>
              <input type="email" className="input" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} required autoComplete="email"/>
            </Field>
            <Field label="Mot de passe" error={fieldErrors.password}>
              <PasswordInput value={form.password} onChange={e=>setForm({...form, password:(e.target as HTMLInputElement).value})} required minLength={6} autoComplete="new-password"/>
              <p className="text-xs text-gray-500 mt-1">Au moins 6 caractères.</p>
            </Field>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>{loading ? <span className="spinner mr-2"/> : null} S'inscrire</button>
            <p className="text-xs text-center text-gray-500">Déjà un compte ? <a href="/login" className="underline">Se connecter</a></p>
          </form>
        </div>
      </div>
    </>
  )
}