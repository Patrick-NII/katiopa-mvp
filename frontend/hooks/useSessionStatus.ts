'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { authAPI } from '@/lib/api'

interface SessionStatus {
  isOnline: boolean
  lastActivity: Date
  sessionId: string
}

interface UseSessionStatusProps {
  sessionId: string
  onStatusChange?: (status: SessionStatus) => void
}

export function useSessionStatus({ sessionId, onStatusChange }: UseSessionStatusProps) {
  const [status, setStatus] = useState<SessionStatus>({
    isOnline: true,
    lastActivity: new Date(),
    sessionId
  })
  const [isUpdating, setIsUpdating] = useState(false)
  const isOnlineRef = useRef(true)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Fonction pour mettre à jour le statut côté backend
  const updateBackendStatus = useCallback(async (isOnline: boolean) => {
    if (isUpdating) return
    
    try {
      setIsUpdating(true)
      
      const response = await fetch('/api/sessions/status', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          isOnline
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newStatus: SessionStatus = {
          isOnline: data.isOnline,
          lastActivity: new Date(data.lastActivity),
          sessionId
        }
        
        setStatus(newStatus)
        isOnlineRef.current = data.isOnline
        onStatusChange?.(newStatus)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    } finally {
      setIsUpdating(false)
    }
  }, [sessionId, isUpdating, onStatusChange])

  // Fonction pour signaler la déconnexion
  const signalDisconnect = useCallback(() => {
    if (!isOnlineRef.current) return
    
    // Mettre à jour immédiatement l'état local
    const newStatus: SessionStatus = {
      isOnline: false,
      lastActivity: new Date(),
      sessionId
    }
    setStatus(newStatus)
    isOnlineRef.current = false
    onStatusChange?.(newStatus)

    // Mettre à jour le backend avec un délai pour éviter les appels multiples
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      updateBackendStatus(false)
    }, 1000)
  }, [sessionId, onStatusChange, updateBackendStatus])

  // Fonction pour signaler la connexion
  const signalConnect = useCallback(() => {
    if (isOnlineRef.current) return
    
    // Mettre à jour immédiatement l'état local
    const newStatus: SessionStatus = {
      isOnline: true,
      lastActivity: new Date(),
      sessionId
    }
    setStatus(newStatus)
    isOnlineRef.current = true
    onStatusChange?.(newStatus)

    // Mettre à jour le backend
    updateBackendStatus(true)
  }, [sessionId, onStatusChange, updateBackendStatus])

  // Gérer les événements de déconnexion
  useEffect(() => {
    const handleBeforeUnload = () => {
      signalDisconnect()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        signalDisconnect()
      } else {
        signalConnect()
      }
    }

    const handleLogout = async () => {
      signalDisconnect()
    }

    // Écouter les événements de déconnexion
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Écouter les événements de logout depuis d'autres composants
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cubeai:auth' && e.newValue?.includes('logged_out')) {
        signalDisconnect()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)

    // Écouter les événements de focus pour détecter le retour
    const handleFocus = () => {
      if (!document.hidden) {
        signalConnect()
      }
    }
    
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
      
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [signalDisconnect, signalConnect])

  // Vérifier le statut initial au montage
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await fetch('/api/sessions/children', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const sessions = await response.json()
          const currentSession = sessions.find((s: any) => s.sessionId === sessionId)
          
          if (currentSession) {
            const newStatus: SessionStatus = {
              isOnline: !!currentSession.currentSessionStartTime,
              lastActivity: new Date(currentSession.lastActivity || currentSession.createdAt),
              sessionId
            }
            
            setStatus(newStatus)
            isOnlineRef.current = newStatus.isOnline
            onStatusChange?.(newStatus)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut initial:', error)
      }
    }

    checkInitialStatus()
  }, [sessionId, onStatusChange])

  return {
    status,
    signalConnect,
    signalDisconnect,
    isUpdating
  }
}
