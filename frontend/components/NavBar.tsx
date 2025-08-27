'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function NavBar() {
  const [token, setToken] = useState<string | null>(null)
  useEffect(() => setToken(localStorage.getItem('token')), [])

  return (
    <nav className="container-narrow flex justify-between items-center py-4">
      <Link href="/" className="font-semibold">Katiopa</Link>
      <div className="space-x-3">
        {token ? (
          <>
            <Link href="/dashboard" className="btn">Dashboard</Link>
            <button className="btn" onClick={() => { localStorage.removeItem('token'); location.href='/' }}>Déconnexion</button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn">Connexion</Link>
            <Link href="/register" className="btn btn-primary">Inscription</Link>
          </>
        )}
      </div>
    </nav>
  )
}