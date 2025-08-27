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
    <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Statistiques détaillées</h3>
      
      {/* Grille de statistiques sur toute la largeur */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.activitiesCount}</div>
          <div className="text-sm text-blue-700 font-medium">Activités</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.averageScore}%</div>
          <div className="text-sm text-green-700 font-medium">Moyenne</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.streak}</div>
          <div className="text-sm text-purple-700 font-medium">Jours consécutifs</div>
        </div>
        <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200">
          <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.badges.length}</div>
          <div className="text-sm text-yellow-700 font-medium">Badges</div>
        </div>
      </div>

      {/* Badges obtenus */}
      {stats.badges.length > 0 && (
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Badges obtenus</h4>
          <div className="flex flex-wrap gap-3">
            {stats.badges.map((badge, index) => (
              <span 
                key={index}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-full shadow-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progression du niveau sur toute la largeur */}
      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Progression du niveau</h4>
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{stats.level}</div>
              <div className="text-sm text-gray-600">Niveau actuel</div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.experience} XP</div>
              <div className="text-sm text-gray-600">Expérience</div>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 mb-1">{100 - (stats.experience % 100)} XP</div>
              <div className="text-sm text-gray-600">Prochain niveau</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 