'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useSession } from '../hooks/useSession'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  createdAt?: string
}

export default function NavBar() {
  const [token, setToken] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const { currentSessionTime, clearSession } = useSession()
  
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
    clearSession()
    setToken(null)
    setUser(null)
    window.location.href = '/'
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo CubeAI à gauche */}
          <Link href="/" className="flex items-center">
            <span className="text-2xl font-black text-gray-900 tracking-wider">
              CubeAI
            </span>
          </Link>
          
          <div className="flex items-center space-x-8">
            {token ? (
              <>
                {/* Informations utilisateur et session sur une ligne */}
                <div className="flex items-center space-x-6">
                  {/* Nom et rôle */}
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user ? user.role.toLowerCase() : 'connecté'}
                    </div>
                  </div>
                  
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 'U'}
                    </span>
                  </div>
                  
                  {/* Durée de session */}
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-mono text-gray-600">
                      {formatTime(currentSessionTime)}
                    </span>
                  </div>
                </div>
                
                {/* Boutons à droite superposés */}
                <div className="flex flex-col space-y-2">
                  <Link href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm">
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout} 
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors text-sm"
                  >
                    Déconnexion
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                  Inscription
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}