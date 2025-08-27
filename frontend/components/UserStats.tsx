'use client'
import { useState, useEffect } from 'react'

interface UserStatsProps {
  userId: string
}

interface UserStats {
  level: number
  experience: number
  totalTime: number
  activitiesCount: number
  averageScore: number
  badges: string[]
  streak: number
}

export default function UserStats({ userId }: UserStatsProps) {
  const [stats, setStats] = useState<UserStats>({
    level: 1,
    experience: 0,
    totalTime: 0,
    activitiesCount: 0,
    averageScore: 0,
    badges: [],
    streak: 0
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

  // Générer des badges basés sur les performances
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
    
    return badges
  }

  // Calculer la série de connexions
  const calculateStreak = (): number => {
    // Pour l'instant, on simule une série
    // Plus tard, on pourra l'implémenter avec la base de données
    return Math.floor(Math.random() * 7) + 1
  }

  useEffect(() => {
    // Simuler le chargement des statistiques
    // Plus tard, on fera un appel API réel
    const mockActivities = [
      { score: 85, durationMs: 25000, attempts: 1, domain: 'maths' },
      { score: 92, durationMs: 18000, attempts: 1, domain: 'coding' },
      { score: 78, durationMs: 35000, attempts: 2, domain: 'maths' },
      { score: 88, durationMs: 22000, attempts: 1, domain: 'coding' },
      { score: 95, durationMs: 15000, attempts: 1, domain: 'maths' }
    ]

    const experience = calculateExperience(mockActivities)
    const level = calculateLevel(experience)
    const totalTime = calculateTotalTime(mockActivities)
    const averageScore = calculateAverageScore(mockActivities)
    const badges = generateBadges(mockActivities, averageScore)
    const streak = calculateStreak()

    setStats({
      level,
      experience,
      totalTime,
      activitiesCount: mockActivities.length,
      averageScore,
      badges,
      streak
    })
  }, [userId])

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