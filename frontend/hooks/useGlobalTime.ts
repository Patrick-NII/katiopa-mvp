import { useState, useEffect } from 'react'

interface GlobalTimeInfo {
  totalTimeSinceRegistration: string
  daysSinceRegistration: number
  weeksSinceRegistration: number
  monthsSinceRegistration: number
  yearsSinceRegistration: number
  memberSinceFormatted: string
  isActive: boolean
}

export function useGlobalTime(registrationDate: string | null): GlobalTimeInfo {
  const [globalTime, setGlobalTime] = useState<GlobalTimeInfo>({
    totalTimeSinceRegistration: '00:00:00',
    daysSinceRegistration: 0,
    weeksSinceRegistration: 0,
    monthsSinceRegistration: 0,
    yearsSinceRegistration: 0,
    memberSinceFormatted: '',
    isActive: false
  })

  useEffect(() => {
    if (!registrationDate) {
      setGlobalTime({
        totalTimeSinceRegistration: '00:00:00',
        daysSinceRegistration: 0,
        weeksSinceRegistration: 0,
        monthsSinceRegistration: 0,
        yearsSinceRegistration: 0,
        memberSinceFormatted: 'Date inconnue',
        isActive: false
      })
      return
    }

    const calculateGlobalTime = () => {
      try {
        const registration = new Date(registrationDate)
        const now = new Date()
        
        if (isNaN(registration.getTime())) {
          throw new Error('Date d\'inscription invalide')
        }

        // Calculer la différence en millisecondes
        const diffMs = now.getTime() - registration.getTime()
        
        // Convertir en différentes unités
        const diffSeconds = Math.floor(diffMs / 1000)
        const diffMinutes = Math.floor(diffSeconds / 60)
        const diffHours = Math.floor(diffMinutes / 60)
        const diffDays = Math.floor(diffHours / 24)
        const diffWeeks = Math.floor(diffDays / 7)
        const diffMonths = Math.floor(diffDays / 30.44) // Moyenne des mois
        const diffYears = Math.floor(diffDays / 365.25) // Moyenne des années

        // Formater le temps total depuis l'inscription
        const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
        const totalMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        const totalSeconds = Math.floor((diffMs % (1000 * 60)) / 1000)
        
        const totalTimeFormatted = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`

        // Formater la date d'inscription
        const memberSinceFormatted = registration.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })

        setGlobalTime({
          totalTimeSinceRegistration: totalTimeFormatted,
          daysSinceRegistration: diffDays,
          weeksSinceRegistration: diffWeeks,
          monthsSinceRegistration: diffMonths,
          yearsSinceRegistration: diffYears,
          memberSinceFormatted,
          isActive: true
        })
      } catch (error) {
        console.error('Erreur lors du calcul du temps global:', error)
        setGlobalTime({
          totalTimeSinceRegistration: '00:00:00',
          daysSinceRegistration: 0,
          weeksSinceRegistration: 0,
          monthsSinceRegistration: 0,
          yearsSinceRegistration: 0,
          memberSinceFormatted: 'Date invalide',
          isActive: false
        })
      }
    }

    // Calculer immédiatement
    calculateGlobalTime()
    
    // Mettre à jour chaque seconde
    const interval = setInterval(calculateGlobalTime, 1000)
    
    return () => clearInterval(interval)
  }, [registrationDate])

  return globalTime
} 