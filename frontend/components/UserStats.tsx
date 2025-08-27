'use client'
import { useState, useEffect } from 'react'

interface UserStatsProps {
  userId: string
  activities: Array<{
    id: string
    domain: string
    nodeKey: string
    score: number
    attempts: number
    durationMs: number
    createdAt: string
  }>
  memberSince: string
}

interface UserStats {
  level: number
  experience: number
  totalTime: number
  activitiesCount: number
  averageScore: number
  badges: string[]
  streak: number
  domains: string[]
  lastActivity: string | null
}

export default function UserStats({ userId, activities, memberSince }: UserStatsProps) {
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    experience: 0,
    totalTime: 0,
    activitiesCount: 0,
    averageScore: 0,
    badges: [],
    streak: 0,
    domains: [],
    lastActivity: null
  })

  // Calculer le niveau basé sur l'expérience
  const calculateLevel = (experience: number): number => {
    return Math.floor(experience / 100) + 1
  }

  // Calculer l'expérience basée sur les activités
  const calculateExperience = (activities: any[]): number => {
    let exp = 0
    activities.forEach(activity => {
      // Base XP par activité
      exp += 10
      
      // Bonus pour les bons scores
      if (activity.score >= 80) exp += 20
      else if (activity.score >= 60) exp += 10
      
      // Bonus pour la rapidité
      if (activity.durationMs < 30000) exp += 5
      
      // Bonus pour les tentatives réussies
      if (activity.attempts === 1) exp += 5
    })
    return exp
  }

  // Calculer le temps total
  const calculateTotalTime = (activities: any[]): number => {
    return activities.reduce((total, activity) => total + activity.durationMs, 0)
  }

  // Calculer la moyenne des scores
  const calculateAverageScore = (activities: any[]): number => {
    if (activities.length === 0) return 0
    const total = activities.reduce((sum, activity) => sum + activity.score, 0)
    return Math.round(total / activities.length)
  }

  // Obtenir les domaines uniques
  const getUniqueDomains = (activities: any[]): string[] => {
    return Array.from(new Set(activities.map(a => a.domain)))
  }

  // Générer des badges basés sur les performances réelles
  const generateBadges = (activities: any[], averageScore: number): string[] => {
    const badges: string[] = []
    
    if (activities.length >= 10) badges.push('🎯 Persévérant')
    if (activities.length >= 25) badges.push('🏆 Champion')
    if (averageScore >= 80) badges.push('⭐ Excellent')
    if (averageScore >= 90) badges.push('👑 Maître')
    
    // Badges par domaine
    const domains = activities.map(a => a.domain)
    if (domains.filter(d => d === 'maths').length >= 5) badges.push('🧮 Mathématicien')
    if (domains.filter(d => d === 'coding').length >= 5) badges.push('💻 Codeur')
    
    // Badge pour la rapidité
    const fastActivities = activities.filter(a => a.durationMs < 30000)
    if (fastActivities.length >= 3) badges.push('⚡ Rapide')
    
    // Badge pour la précision
    const accurateActivities = activities.filter(a => a.attempts === 1)
    if (accurateActivities.length >= 5) badges.push('🎯 Précis')
    
    return badges
  }

  // Calculer la série de connexions (simulation basée sur les activités)
  const calculateStreak = (activities: any[]): number => {
    if (activities.length === 0) return 0
    
    // Trier les activités par date
    const sortedActivities = activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    let streak = 1
    let currentDate = new Date(sortedActivities[0].createdAt)
    
    for (let i = 1; i < sortedActivities.length; i++) {
      const activityDate = new Date(sortedActivities[i].createdAt)
      const diffTime = Math.abs(currentDate.getTime() - activityDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays === 1) {
        streak++
        currentDate = activityDate
      } else if (diffDays > 1) {
        break
      }
    }
    
    return Math.min(streak, 7) // Limiter à 7 jours
  }

  // Obtenir la dernière activité
  const getLastActivity = (activities: any[]): string | null => {
    if (activities.length === 0) return null
    
    const lastActivity = activities.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
    
    return lastActivity.createdAt
  }

  useEffect(() => {
    if (activities.length > 0) {
      const experience = calculateExperience(activities)
      const level = calculateLevel(experience)
      const totalTime = calculateTotalTime(activities)
      const averageScore = calculateAverageScore(activities)
      const badges = generateBadges(activities, averageScore)
      const streak = calculateStreak(activities)
      const domains = getUniqueDomains(activities)
      const lastActivity = getLastActivity(activities)

      setStats({
        level,
        experience,
        totalTime,
        activitiesCount: activities.length,
        averageScore,
        badges,
        streak,
        domains,
        lastActivity
      })
    }
  }, [activities])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })
  }

  const formatTime = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Statistiques détaillées</h3>
      
      {/* Grille de statistiques sur toute la largeur */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-2xl font-bold text-blue-600 mb-1">{stats.activitiesCount}</div>
          <div className="text-xs text-blue-700 font-medium">Activités</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-2xl font-bold text-green-600 mb-1">{stats.averageScore}%</div>
          <div className="text-xs text-green-700 font-medium">Moyenne</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-2xl font-bold text-purple-600 mb-1">{stats.streak}</div>
          <div className="text-xs text-purple-700 font-medium">Jours consécutifs</div>
        </div>
        <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-600 mb-1">{stats.badges.length}</div>
          <div className="text-xs text-yellow-700 font-medium">Badges</div>
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-lg font-bold text-gray-600 mb-1">{stats.domains.length}</div>
          <div className="text-xs text-gray-500">Domaines actifs</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-lg font-bold text-gray-600 mb-1">{formatTime(stats.totalTime)}</div>
          <div className="text-xs text-gray-500">Temps total</div>
        </div>
        <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-lg font-bold text-gray-600 mb-1">
            {stats.lastActivity ? formatDate(stats.lastActivity) : 'Aucune'}
          </div>
          <div className="text-xs text-gray-500">Dernière activité</div>
        </div>
      </div>

      {/* Badges obtenus */}
      {stats.badges.length > 0 && (
        <div className="mb-6">
          <h4 className="text-base font-medium text-gray-800 mb-3">Badges obtenus</h4>
          <div className="flex flex-wrap gap-2">
            {stats.badges.map((badge, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progression du niveau sur toute la largeur */}
      <div>
        <h4 className="text-base font-medium text-gray-800 mb-3">Progression du niveau</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600 mb-1">{stats.level}</div>
              <div className="text-xs text-gray-600">Niveau actuel</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-green-600 mb-1">{stats.experience} XP</div>
              <div className="text-xs text-gray-600">Expérience</div>
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600 mb-1">{100 - (stats.experience % 100)} XP</div>
              <div className="text-xs text-gray-600">Prochain niveau</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 