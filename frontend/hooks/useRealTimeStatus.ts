'use client'

import { useState, useEffect, useCallback } from 'react'

interface SessionStatus {
  sessionId: string
  isOnline: boolean
  lastActivity: Date
  currentSessionStartTime: Date | null
  totalTime: number // en minutes
}

interface UseRealTimeStatusProps {
  childSessions: any[]
  refreshInterval?: number // en millisecondes
}

export function useRealTimeStatus({ childSessions, refreshInterval = 10000 }: UseRealTimeStatusProps) {
  const [sessionStatuses, setSessionStatuses] = useState<Record<string, SessionStatus>>({})
  const [isLoading, setIsLoading] = useState(false)

  const fetchSessionStatuses = useCallback(async () => {
    if (childSessions.length === 0) return

    try {
      setIsLoading(true)
      const response = await fetch('/api/sessions/children', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const sessions = await response.json()
        const newStatuses: Record<string, SessionStatus> = {}

        sessions.forEach((session: any) => {
          const now = new Date()
          let totalTime = session.totalTime || 0

          // Calculer le temps de session actuelle si en ligne
          if (session.currentSessionStartTime) {
            const sessionStart = new Date(session.currentSessionStartTime)
            const currentSessionTime = Math.floor((now.getTime() - sessionStart.getTime()) / (1000 * 60))
            totalTime += currentSessionTime
          }

          newStatuses[session.sessionId] = {
            sessionId: session.sessionId,
            isOnline: !!session.currentSessionStartTime,
            lastActivity: new Date(session.lastActivity || session.createdAt),
            currentSessionStartTime: session.currentSessionStartTime ? new Date(session.currentSessionStartTime) : null,
            totalTime
          }
        })

        setSessionStatuses(newStatuses)
      } else {
        console.warn('Erreur lors de la récupération du statut:', response.status)
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
    } finally {
      setIsLoading(false)
    }
  }, [childSessions])

  // Polling automatique
  useEffect(() => {
    fetchSessionStatuses()

    const interval = setInterval(fetchSessionStatuses, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchSessionStatuses, refreshInterval])

  // Mise à jour manuelle
  const refreshStatus = useCallback(() => {
    fetchSessionStatuses()
  }, [fetchSessionStatuses])

  return {
    sessionStatuses,
    isLoading,
    refreshStatus
  }
}
