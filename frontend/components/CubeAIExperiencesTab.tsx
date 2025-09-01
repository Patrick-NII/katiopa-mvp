'use client'

import React, { useState, useEffect } from 'react'
import { 
  Trophy, 
  Target, 
  Calendar, 
  Star, 
  Clock, 
  TrendingUp,
  Sparkles,
  BookOpen,
  Gamepad2,
  Lightbulb,
  ChevronRight,
  Users,
  BarChart3,
  Zap
} from 'lucide-react'
import { 
  gamesAPI, 
  exercisesAPI, 
  scheduleAPI, 
  welcomeMessageAPI, 
  recommendationsAPI, 
  statsAPI,
  formatDuration,
  formatScore,
  getDifficultyColor,
  getGameTypeIcon
} from '@/lib/api/experiences'

interface CubeAIExperiencesTabProps {
  userType: 'CHILD' | 'PARENT'
  userSubscriptionType: string
  firstName: string
  lastName: string
}

export default function CubeAIExperiencesTab({ 
  userType, 
  userSubscriptionType, 
  firstName, 
  lastName 
}: CubeAIExperiencesTabProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [games, setGames] = useState<any[]>([])
  const [exercises, setExercises] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [welcomeMessage, setWelcomeMessage] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [activityStats, setActivityStats] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Données par défaut pour éviter les erreurs 404
      const defaultGames = [
        {
          id: '1',
          title: 'CubeMatch',
          description: 'Jeu de calcul mental avec des cubes',
          domain: 'math',
          type: 'PUZZLE',
          difficulty: 'MEDIUM',
          estimatedTime: 10,
          minAge: 8,
          maxAge: 15,
          tags: ['math', 'calcul', 'mental'],
          isActive: true,
          rating: 4.5,
          totalPlays: 150,
          completionRate: 85,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      const defaultExercises = [
        {
          id: '1',
          title: 'Addition et Soustraction',
          description: 'Exercices de calcul mental avec additions et soustractions',
          domain: 'math',
          difficulty: 'EASY',
          estimatedTime: 15,
          tags: ['math', 'calcul'],
          isActive: true,
          rating: 4.2,
          totalAttempts: 200,
          completionRate: 90,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      const defaultSchedule = [
        {
          id: '1',
          title: 'Séance de mathématiques',
          description: 'Exercices de calcul mental',
          startTime: '09:00',
          endTime: '10:00',
          duration: 60,
          type: 'EXERCISE',
          status: 'PLANNED',
          priority: 'MEDIUM',
          isRecurring: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ]

      const defaultWelcomeMessage = {
        id: '1',
        content: `Salut ${firstName} ! Je suis Bubix, ton ami IA ! Ensemble, nous allons apprendre plein de choses amusantes ! Prêt(e) pour l'aventure ?`,
        messageType: 'DAILY_GREETING',
        isGenerated: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const defaultRecommendations = [
        {
          id: '1',
          type: 'GAME',
          title: 'Essaie CubeMatch !',
          description: 'Un nouveau jeu de calcul mental t\'attend',
          targetId: '1',
          priority: 'HIGH',
          isRead: false,
          createdAt: new Date().toISOString()
        }
      ]

      const defaultStats = {
        totalActivities: 25,
        totalDuration: 180,
        averageScore: 85,
        topDomains: ['Mathématiques', 'Français', 'Sciences'],
        recentActivities: [
          { id: '1', title: 'CubeMatch', score: 95, duration: 15, date: new Date().toISOString() }
        ]
      }

      // Utiliser les données par défaut
      setGames(defaultGames)
      setExercises(defaultExercises)
      setSchedule(defaultSchedule)
      setWelcomeMessage(defaultWelcomeMessage)
      setRecommendations(defaultRecommendations)
      setActivityStats(defaultStats)

      // Commenté temporairement pour éviter les erreurs 404
      /*
      const [gamesData, exercisesData, scheduleData, welcomeData, recommendationsData, statsData] = await Promise.allSettled([
        gamesAPI.getAll(),
        exercisesAPI.getAll(),
        scheduleAPI.getUserSchedule(),
        welcomeMessageAPI.getPersonalized(),
        recommendationsAPI.getPersonalized(),
        statsAPI.getActivityStats()
      ])

      setGames(gamesData.status === 'fulfilled' ? gamesData.value : [])
      setExercises(exercisesData.status === 'fulfilled' ? exercisesData.value : [])
      setSchedule(scheduleData.status === 'fulfilled' ? scheduleData.value : [])
      setWelcomeMessage(welcomeData.status === 'fulfilled' ? welcomeData.value : null)
      setRecommendations(recommendationsData.status === 'fulfilled' ? recommendationsData.value : [])
      setActivityStats(statsData.status === 'fulfilled' ? statsData.value : null)
      */
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalRanking = () => {
    if (!activityStats) return []
    
    const domains = ['Mathématiques', 'Français', 'Sciences', 'Programmation']
    return domains.map(domain => ({
      domain,
      score: Math.floor(Math.random() * 100) + 50, // Simulation pour l'instant
      rank: Math.floor(Math.random() * 10) + 1
    })).sort((a, b) => a.rank - b.rank)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium">Chargement de vos expériences...</p>
        </div>
      </div>
    )
  }

  if (userType === 'PARENT') {
    return <ParentInterface 
      firstName={firstName}
      lastName={lastName}
      userSubscriptionType={userSubscriptionType}
      activityStats={activityStats}
      recommendations={recommendations}
      schedule={schedule}
    />
  }

  return <ChildInterface 
    firstName={firstName}
    userSubscriptionType={userSubscriptionType}
    welcomeMessage={welcomeMessage}
    topExercises={exercises.slice(0, 5)}
    topGames={games.slice(0, 5)}
    ranking={calculateTotalRanking()}
  />
}

// Interface Parents - Design épuré et moderne
function ParentInterface({ 
  firstName, 
  lastName, 
  userSubscriptionType,
  activityStats, 
  recommendations, 
  schedule 
}: any) {
  const getSubscriptionColors = () => {
    switch (userSubscriptionType) {
      case 'PRO':
        return { primary: 'from-blue-500 to-indigo-600', secondary: 'bg-blue-50', accent: 'text-blue-600' }
      case 'PREMIUM':
        return { primary: 'from-fuchsia-500 to-violet-600', secondary: 'bg-fuchsia-50', accent: 'text-fuchsia-600' }
      case 'ENTERPRISE':
        return { primary: 'from-purple-500 to-pink-600', secondary: 'bg-purple-50', accent: 'text-purple-600' }
      default:
        return { primary: 'from-blue-500 to-violet-600', secondary: 'bg-blue-50', accent: 'text-blue-600' }
    }
  }

  const colors = getSubscriptionColors()

  return (
    <div className="space-y-8 p-6">
      {/* En-tête personnalisé */}
      <div className="text-center space-y-4">
        <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${colors.primary} text-white shadow-lg`}>
          <Sparkles className="w-5 h-5 mr-2" />
          <span className="font-semibold">Tableau de bord Parent</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bonjour {firstName} {lastName} 👋
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Suivez les progrès de votre enfant et découvrez des recommandations personnalisées
        </p>
      </div>

      {/* Statistiques d'activité */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Temps total</p>
                <p className="text-2xl font-bold text-gray-900">{formatDuration(activityStats.totalTime)}</p>
              </div>
              <div className={`p-3 rounded-full ${colors.secondary}`}>
                <Clock className={`w-6 h-6 ${colors.accent}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Jeux joués</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats.gamesPlayed}</p>
              </div>
              <div className={`p-3 rounded-full ${colors.secondary}`}>
                <Gamepad2 className={`w-6 h-6 ${colors.accent}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Exercices</p>
                <p className="text-2xl font-bold text-gray-900">{activityStats.exercisesCompleted}</p>
              </div>
              <div className={`p-3 rounded-full ${colors.secondary}`}>
                <BookOpen className={`w-6 h-6 ${colors.accent}`} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score moyen</p>
                <p className="text-2xl font-bold text-gray-900">{formatScore(activityStats.averageGameScore)}</p>
              </div>
              <div className={`p-3 rounded-full ${colors.secondary}`}>
                <Trophy className={`w-6 h-6 ${colors.accent}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommandations IA */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gradient-to-r ${colors.primary}`}>
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Recommandations de Bubix</h2>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.slice(0, 6).map((rec: any) => (
              <div key={rec.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${colors.secondary}`}>
                    {rec.type === 'GAME' ? (
                      <Gamepad2 className={`w-5 h-5 ${colors.accent}`} />
                    ) : (
                      <BookOpen className={`w-5 h-5 ${colors.accent}`} />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{rec.reason}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{formatScore(rec.score)}</span>
                      </div>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 capitalize">{rec.type.toLowerCase()}</span>
                            </div>
                              </div>
                            </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Planning */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gradient-to-r ${colors.primary}`}>
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Planning de la semaine</h2>
          </div>
          <button className={`px-4 py-2 rounded-lg bg-gradient-to-r ${colors.primary} text-white text-sm font-medium hover:shadow-lg transition-shadow`}>
            Modifier
          </button>
                          </div>
                          
        {schedule.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.slice(0, 6).map((event: any) => (
              <div key={event.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{event.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-600">{formatDuration(event.duration)}</span>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    event.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {event.status === 'COMPLETED' ? 'Terminé' :
                     event.status === 'IN_PROGRESS' ? 'En cours' : 'Planifié'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun événement planifié</h3>
            <p className="text-gray-600 mb-4">Créez le premier événement pour organiser l'apprentissage</p>
            <button className={`px-6 py-3 rounded-lg bg-gradient-to-r ${colors.primary} text-white font-medium hover:shadow-lg transition-shadow`}>
              Créer un événement
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Interface Enfants - Design ludique et motivant
function ChildInterface({ 
  firstName, 
  userSubscriptionType,
  welcomeMessage, 
  topExercises, 
  topGames, 
  ranking 
}: any) {
  const getSubscriptionColors = () => {
    switch (userSubscriptionType) {
      case 'PRO':
        return { primary: 'from-blue-500 to-indigo-600', secondary: 'bg-blue-50', accent: 'text-blue-600' }
      case 'PREMIUM':
        return { primary: 'from-fuchsia-500 to-violet-600', secondary: 'bg-fuchsia-50', accent: 'text-fuchsia-600' }
      case 'ENTERPRISE':
        return { primary: 'from-purple-500 to-pink-600', secondary: 'bg-purple-50', accent: 'text-purple-600' }
      default:
        return { primary: 'from-blue-500 to-violet-600', secondary: 'bg-blue-50', accent: 'text-blue-600' }
    }
  }

  const colors = getSubscriptionColors()

  return (
    <div className="space-y-8 p-6">
      {/* Message d'accueil personnalisé */}
      <div className="text-center space-y-6">
        <div className={`inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r ${colors.primary} text-white shadow-lg`}>
          <Sparkles className="w-5 h-5 mr-2" />
          <span className="font-semibold">Salut {firstName} !</span>
        </div>
        
        {welcomeMessage ? (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {welcomeMessage.content}
            </h1>
            <p className="text-lg text-gray-600">
              Prêt(e) pour une nouvelle aventure d'apprentissage ?
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Salut {firstName} ! Je suis Bubix, ton ami IA !
            </h1>
            <p className="text-lg text-gray-600">
              Ensemble, nous allons apprendre plein de choses amusantes ! Prêt(e) pour l'aventure ?
            </p>
          </div>
        )}
      </div>

      {/* Raccourcis rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${colors.primary} flex items-center justify-center`}>
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Exercices</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${colors.primary} flex items-center justify-center`}>
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Jeux</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${colors.primary} flex items-center justify-center`}>
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Classement</h3>
        </div>

        <div className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
          <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${colors.primary} flex items-center justify-center`}>
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-semibold text-gray-900 text-sm">Planning</h3>
        </div>
      </div>

      {/* Top exercices */}
      {topExercises.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gradient-to-r ${colors.primary}`}>
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Exercices populaires</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topExercises.map((exercise: any) => (
              <div key={exercise.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">{exercise.title}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{exercise.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{formatDuration(exercise.estimatedTime)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">{formatScore(exercise.rating)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top jeux */}
      {topGames.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gradient-to-r ${colors.primary}`}>
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Jeux populaires</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topGames.map((game: any) => (
              <div key={game.id} className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm flex-1">{game.title}</h3>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(game.difficulty)}`}>
                    {game.difficulty}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-3 line-clamp-2">{game.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600">{formatDuration(game.estimatedTime)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs text-gray-600">{formatScore(game.rating)}</span>
                  </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Classement */}
      {ranking.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-gradient-to-r ${colors.primary}`}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Ton classement</h2>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="space-y-4">
              {ranking.map((rank: any, index: number) => (
                <div key={rank.domain} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{rank.domain}</h3>
                      <p className="text-sm text-gray-600">Score: {rank.score}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">#{rank.rank}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      </div>
  )
} 