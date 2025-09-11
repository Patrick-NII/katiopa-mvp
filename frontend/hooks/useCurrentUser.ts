/**
 * 👤 Hook pour récupérer l'utilisateur courant
 * 
 * Accès simple à l'utilisateur authentifié dans toute l'application
 */

import { useState, useEffect } from 'react'

interface User {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  userType: string
  subscriptionType: string
}

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/auth/verify', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Erreur récupération utilisateur:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  return { user, loading }
}
