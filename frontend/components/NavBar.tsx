'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import ConnectionTimer from './ConnectionTimer'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

export default function NavBar() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    setToken(storedToken)
    
    if (storedToken) {
      loadUserProfile()
    }
  }, [])

  async function loadUserProfile() {
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
      const response = await fetch(`${apiBase}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (err) {
      console.error('Failed to load user profile:', err)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="container-narrow flex justify-between items-center py-4 border-b border-gray-200">
      <Link href="/" className="font-semibold text-xl text-blue-600">
        🎯 Katiopa
      </Link>
      
      <div className="flex items-center space-x-4">
        {token ? (
          <>
            {/* Timer de connexion */}
            <ConnectionTimer />
            
            {/* Profil utilisateur */}
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                </div>
                <div className="text-xs text-gray-500">
                  {user ? user.role.toLowerCase() : 'connecté'}
                </div>
              </div>
              
              {/* Avatar mini */}
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">
                  {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 'U'}
                </span>
              </div>
            </div>
            
            {/* Navigation */}
            <Link href="/dashboard" className="btn">
              📊 Dashboard
            </Link>
            
            <button 
              onClick={handleLogout} 
              className="btn text-red-600 hover:bg-red-50"
            >
              🚪 Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn">
              🔑 Connexion
            </Link>
            <Link href="/register" className="btn btn-primary">
              ✨ Inscription
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}