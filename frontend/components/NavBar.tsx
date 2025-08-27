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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Katiopa - Plus grand et typographie distinctive */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl font-black">K</span>
            </div>
            <span className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              KATIOPA
            </span>
          </Link>
          
          <div className="flex items-center space-x-8">
            {token ? (
              <>
                {/* Timer de session actuel uniquement */}
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-mono font-medium">
                    Session: {formatTime(currentSessionTime)}
                  </span>
                </div>
                
                {/* Profil utilisateur compact */}
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {user ? user.role.toLowerCase() : 'connecté'}
                    </div>
                  </div>
                  
                  {/* Avatar mini */}
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() : 'U'}
                    </span>
                  </div>
                </div>
                
                {/* Navigation */}
                <Link href="/dashboard" className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                  Dashboard
                </Link>
                
                <button 
                  onClick={handleLogout} 
                  className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors">
                  Connexion
                </Link>
                <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all">
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