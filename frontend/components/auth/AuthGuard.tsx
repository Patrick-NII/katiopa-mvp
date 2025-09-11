'use client'

import React, { useState, useEffect } from 'react'
import { User, Lock, LogIn } from 'lucide-react'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
  fallback?: React.ReactNode
}

interface AuthStatus {
  authenticated: boolean
  user: any | null
  loading: boolean
  error?: string
}

export default function AuthGuard({ children, requireAuth = true, fallback }: AuthGuardProps) {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    authenticated: false,
    user: null,
    loading: true
  })

  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔐 Vérification de l\'authentification...')
        
        const response = await fetch('/api/auth/status')
        const data = await response.json()
        
        setAuthStatus({
          authenticated: data.authenticated,
          user: data.user,
          loading: false,
          error: data.error
        })
        
        if (data.authenticated && data.user) {
          console.log(`✅ Utilisateur authentifié: ${data.user.firstName || data.user.username}`)
        } else {
          console.log('❌ Utilisateur non authentifié')
        }
      } catch (error) {
        console.error('❌ Erreur lors de la vérification d\'authentification:', error)
        setAuthStatus({
          authenticated: false,
          user: null,
          loading: false,
          error: 'Erreur de connexion'
        })
      }
    }

    checkAuth()
  }, [])

  // Affichage pendant le chargement
  if (authStatus.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Vérification de l'authentification...</span>
      </div>
    )
  }

  // Si l'authentification n'est pas requise, afficher le contenu
  if (!requireAuth) {
    return <>{children}</>
  }

  // Si l'utilisateur est authentifié, afficher le contenu
  if (authStatus.authenticated) {
    return <>{children}</>
  }

  // Si l'utilisateur n'est pas authentifié et que l'auth est requise
  if (fallback) {
    return <>{fallback}</>
  }

  // Message par défaut pour utilisateur non authentifié
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-white" />
        </div>
        
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          Authentification requise
        </h3>
        
        <p className="text-gray-600 mb-6 max-w-md">
          Pour sauvegarder vos scores et progresser dans le classement, 
          vous devez être connecté à votre compte.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <LogIn className="w-5 h-5" />
            Se connecter
          </button>
          
          <button
            onClick={() => window.location.href = '/register'}
            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <User className="w-5 h-5" />
            Créer un compte
          </button>
        </div>
        
        {authStatus.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{authStatus.error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
