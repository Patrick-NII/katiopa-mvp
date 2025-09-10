'use client'

import { useState, useEffect } from 'react'

interface ChildSession {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  age?: number
  grade?: string
  gender: string
  createdAt: string
  lastLoginAt?: string
}

interface UseChildSessionsProps {
  userType: 'CHILD' | 'PARENT'
}

export function useChildSessions({ userType }: UseChildSessionsProps) {
  const [childSessions, setChildSessions] = useState<ChildSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChildSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchSessions()
  }, [userType])

  const fetchSessions = async () => {
    try {
      setLoading(true)
      setError('')

      console.log('🔍 useChildSessions Debug:', { userType })

      // Utiliser les routes de test qui fonctionnent
      console.log('🔍 Utilisation des routes de test pour les sessions')

      if (userType === 'PARENT') {
        // Utiliser les routes de test qui fonctionnent
        console.log('🔍 Utilisation des routes de test pour les sessions enfants')
        const response = await fetch('/api/sessions-test/children', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Erreur lors du chargement des sessions enfants')
        }

        const data = await response.json()
        console.log('✅ Sessions enfants récupérées:', data.data?.length || 0, 'sessions')
        setChildSessions(data.data || [])
      } else {
        // Utiliser les routes de test qui fonctionnent
        console.log('🔍 Utilisation des routes de test pour la session actuelle')
        const response = await fetch('/api/sessions-test/current', {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error('Erreur lors du chargement de la session actuelle')
        }

        const data = await response.json()
        const session = data.data
        
        if (session) {
          console.log('✅ Session actuelle récupérée:', session.firstName, session.sessionId)
          setCurrentSession(session)
          setChildSessions([session]) // Pour compatibilité avec le radar chart
        } else {
          console.log('⚠️ Aucune session actuelle trouvée')
          setCurrentSession(null)
          setChildSessions([])
        }
      }
      
    } catch (err) {
      console.error('Erreur lors du chargement des sessions:', err)
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      
      // Pas de fallback - utiliser seulement les vraies données
      console.log('❌ Aucune session trouvée - pas de fallback')
      setChildSessions([])
      setCurrentSession(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshSessions = () => {
    fetchSessions()
  }

  return {
    childSessions,
    currentSession,
    loading,
    error,
    refreshSessions
  }
}
