'use client'

import { useState, useEffect } from 'react'

interface CurrentSession {
  sessionId: string
  userType: 'CHILD' | 'PARENT'
  firstName?: string
  lastName?: string
}

export function useCurrentSession() {
  const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Récupérer la session depuis localStorage
    const sessionId = localStorage.getItem('currentSessionId')
    const userType = localStorage.getItem('currentUserType') as 'CHILD' | 'PARENT'

    if (sessionId && userType) {
      setCurrentSession({
        sessionId,
        userType,
        firstName: 'Utilisateur', // TODO: Récupérer depuis l'API
        lastName: 'Test'
      })
    }

    setLoading(false)
  }, [])

  const login = (sessionId: string, userType: 'CHILD' | 'PARENT') => {
    localStorage.setItem('currentSessionId', sessionId)
    localStorage.setItem('currentUserType', userType)
    
    setCurrentSession({
      sessionId,
      userType,
      firstName: 'Utilisateur',
      lastName: 'Test'
    })
  }

  const logout = () => {
    localStorage.removeItem('currentSessionId')
    localStorage.removeItem('currentUserType')
    setCurrentSession(null)
  }

  return {
    currentSession,
    loading,
    login,
    logout,
    isLoggedIn: !!currentSession
  }
}

