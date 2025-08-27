import { useState, useEffect } from 'react'

interface TotalConnectionTimeInfo {
  totalTimeFormatted: string
  totalHours: number
  totalMinutes: number
  totalSeconds: number
  isActive: boolean
}

/**
 * Hook pour calculer le temps total de connexion depuis l'inscription
 * Simule l'accumulation du temps de toutes les sessions
 */
export function useTotalConnectionTime(registrationDate: string): TotalConnectionTimeInfo {
  const [totalTime, setTotalTime] = useState<TotalConnectionTimeInfo>({
    totalTimeFormatted: '00:00:00',
    totalHours: 0,
    totalMinutes: 0,
    totalSeconds: 0,
    isActive: true
  })

  useEffect(() => {
    if (!registrationDate) {
      setTotalTime({
        totalTimeFormatted: '00:00:00',
        totalHours: 0,
        totalMinutes: 0,
        totalSeconds: 0,
        isActive: false
      })
      return
    }

    try {
      const registration = new Date(registrationDate)
      const now = new Date()
      
      // Calculer le temps écoulé depuis l'inscription
      const timeSinceRegistration = now.getTime() - registration.getTime()
      
      // Simuler un temps de connexion total (en réalité, ceci viendrait de la base de données)
      // Pour la démonstration, on utilise 25% du temps écoulé comme temps de connexion
      const simulatedConnectionTime = Math.floor(timeSinceRegistration * 0.25)
      
      // Convertir en heures, minutes, secondes
      const totalHours = Math.floor(simulatedConnectionTime / (1000 * 60 * 60))
      const totalMinutes = Math.floor((simulatedConnectionTime % (1000 * 60 * 60)) / (1000 * 60))
      const totalSeconds = Math.floor((simulatedConnectionTime % (1000 * 60)) / 1000)
      
      // Formater le temps
      const totalTimeFormatted = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`
      
      setTotalTime({
        totalTimeFormatted,
        totalHours,
        totalMinutes,
        totalSeconds,
        isActive: true
      })
    } catch (error) {
      console.error('Erreur lors du calcul du temps de connexion total:', error)
      setTotalTime({
        totalTimeFormatted: '00:00:00',
        totalHours: 0,
        totalMinutes: 0,
        totalSeconds: 0,
        isActive: false
      })
    }
  }, [registrationDate])

  // Mettre à jour le temps toutes les secondes pour simuler le temps réel
  useEffect(() => {
    if (!totalTime.isActive) return

    const timer = setInterval(() => {
      setTotalTime(prev => {
        const newSeconds = prev.totalSeconds + 1
        const newMinutes = prev.totalMinutes + Math.floor(newSeconds / 60)
        const newHours = prev.totalHours + Math.floor(newMinutes / 60)
        
        const finalSeconds = newSeconds % 60
        const finalMinutes = newMinutes % 60
        
        return {
          ...prev,
          totalSeconds: finalSeconds,
          totalMinutes: finalMinutes,
          totalHours: newHours,
          totalTimeFormatted: `${newHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}:${finalSeconds.toString().padStart(2, '0')}`
        }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [totalTime.isActive])

  return totalTime
} 