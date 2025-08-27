import { useState, useEffect } from 'react'

interface SessionInfo {
  sessionStartTime: number
  currentSessionTime: number
  isActive: boolean
}

export function useSession() {
  const [sessionInfo, setSessionInfo] = useState<SessionInfo>({
    sessionStartTime: 0,
    currentSessionTime: 0,
    isActive: false
  })

  useEffect(() => {
    // Récupérer ou créer le temps de début de session
    let sessionStartTime = localStorage.getItem('sessionStartTime')
    
    if (!sessionStartTime) {
      sessionStartTime = Date.now().toString()
      localStorage.setItem('sessionStartTime', sessionStartTime)
    }

    const startTime = parseInt(sessionStartTime)
    setSessionInfo(prev => ({ ...prev, sessionStartTime: startTime, isActive: true }))

    // Mettre à jour le temps de session chaque seconde
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setSessionInfo(prev => ({ ...prev, currentSessionTime: elapsed }))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const resetSession = () => {
    const newStartTime = Date.now()
    localStorage.setItem('sessionStartTime', newStartTime.toString())
    setSessionInfo({
      sessionStartTime: newStartTime,
      currentSessionTime: 0,
      isActive: true
    })
  }

  const clearSession = () => {
    localStorage.removeItem('sessionStartTime')
    setSessionInfo({
      sessionStartTime: 0,
      currentSessionTime: 0,
      isActive: false
    })
  }

  return {
    ...sessionInfo,
    resetSession,
    clearSession
  }
} 