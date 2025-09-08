'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Target,
  Award,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Eye,
  Play,
  Settings,
  PieChart,
  Activity,
  Zap,
  Star,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react'

interface AnalyticsModalProps {
  sectionId: string
  title: string
  icon: React.ReactNode
  color: string
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  onClose: () => void
}

const AnalyticsModal: React.FC<AnalyticsModalProps> = ({ 
  sectionId, 
  title, 
  icon, 
  color, 
  userType, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const isChild = userType === 'CHILD'

  // Données simulées pour les analytics
  const mockData = {
    overview: {
      totalTime: 120,
      averageScore: 85,
      totalActivities: 45,
      completionRate: 92,
      weeklyProgress: 78,
      activeDays: 5
    },
    performance: {
      math: { score: 88, time: 45, activities: 12 },
      code: { score: 82, time: 38, activities: 8 },
      science: { score: 90, time: 25, activities: 6 },
      games: { score: 95, time: 12, activities: 19 }
    },
    time: {
      daily: [
        { day: 'Lun', time: 25 },
        { day: 'Mar', time: 30 },
        { day: 'Mer', time: 20 },
        { day: 'Jeu', time: 35 },
        { day: 'Ven', time: 15 },
        { day: 'Sam', time: 10 },
        { day: 'Dim', time: 5 }
      ],
      weekly: [
        { week: 'Sem 1', time: 180 },
        { week: 'Sem 2', time: 220 },
        { week: 'Sem 3', time: 195 },
        { week: 'Sem 4', time: 240 }
      ]
    },
    goals: {
      current: [
        { name: 'Mathématiques', progress: 75, target: 100 },
        { name: 'Programmation', progress: 60, target: 80 },
        { name: 'Sciences', progress: 90, target: 100 },
        { name: 'Jeux éducatifs', progress: 45, target: 60 }
      ],
      completed: [
        { name: 'Alphabétisation', completed: true, date: '2024-01-15' },
        { name: 'Nombres 1-10', completed: true, date: '2024-01-20' },
        { name: 'Formes géométriques', completed: true, date: '2024-01-25' }
      ]
    },
    achievements: {
      badges: [
        { name: 'Premier Pas', description: 'Première activité terminée', earned: true, date: '2024-01-10' },
        { name: 'Mathématicien', description: '10 exercices de maths réussis', earned: true, date: '2024-01-15' },
        { name: 'Codeur', description: 'Premier programme créé', earned: false, date: null },
        { name: 'Scientifique', description: '5 expériences réussies', earned: true, date: '2024-01-20' }
      ],
      streaks: {
        current: 7,
        longest: 12,
        total: 45
      }
    }
  }

  // Charger les données
  useEffect(() => {
    setLoading(true)
    // Simulation d'un appel API
    setTimeout(() => {
      setAnalyticsData(mockData)
      setLoading(false)
    }, 1000)
  }, [timeRange])

  // Définir les onglets selon la section
  const getTabs = () => {
    switch (sectionId) {
      case 'overview':
        return [
          { id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'trends', label: 'Tendances', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'comparison', label: 'Comparaison', icon: <Users className="w-4 h-4" /> }
        ]
      case 'performance':
        return [
          { id: 'subjects', label: 'Matières', icon: <Target className="w-4 h-4" /> },
          { id: 'skills', label: 'Compétences', icon: <Zap className="w-4 h-4" /> },
          { id: 'progress', label: 'Progression', icon: <Activity className="w-4 h-4" /> }
        ]
      case 'time':
        return [
          { id: 'daily', label: 'Quotidien', icon: <Calendar className="w-4 h-4" /> },
          { id: 'weekly', label: 'Hebdomadaire', icon: <Clock className="w-4 h-4" /> },
          { id: 'patterns', label: 'Habitudes', icon: <PieChart className="w-4 h-4" /> }
        ]
      case 'goals':
        return [
          { id: 'current', label: 'En cours', icon: <Target className="w-4 h-4" /> },
          { id: 'completed', label: 'Terminés', icon: <CheckCircle className="w-4 h-4" /> },
          { id: 'planning', label: 'Planification', icon: <Calendar className="w-4 h-4" /> }
        ]
      case 'achievements':
        return [
          { id: 'badges', label: 'Badges', icon: <Award className="w-4 h-4" /> },
          { id: 'streaks', label: 'Séries', icon: <Star className="w-4 h-4" /> },
          { id: 'milestones', label: 'Étapes', icon: <Target className="w-4 h-4" /> }
        ]
      default:
        return [{ id: 'overview', label: 'Vue d\'ensemble', icon: <BarChart3 className="w-4 h-4" /> }]
    }
  }

  const tabs = getTabs()

  // Composant de métrique
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon, 
    color = 'blue' 
  }: { 
    title: string
    value: string | number
    change?: string
    icon: React.ReactNode
    color?: string
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      pink: 'from-pink-500 to-pink-600',
      indigo: 'from-indigo-500 to-indigo-600'
    }

    return (
      <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className={`w-8 h-8 bg-gradient-to-r ${colorClasses[color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
            {icon}
          </div>
          {change && (
            <span className={`text-xs font-medium ${
              change.startsWith('+') ? 'text-green-500' : 
              change.startsWith('-') ? 'text-red-500' : 
              'text-gray-500'
            }`}>
              {change}
            </span>
          )}
        </div>
        <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          {value}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          {title}
        </div>
      </div>
    )
  }

  // Composant de barre de progression
  const ProgressBar = ({ 
    label, 
    progress, 
    target, 
    color = 'blue' 
  }: { 
    label: string
    progress: number
    target: number
    color?: string
  }) => {
    const percentage = Math.min((progress / target) * 100, 100)
    
    const colorClasses = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      pink: 'bg-pink-500',
      indigo: 'bg-indigo-500'
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-900 dark:text-white font-medium">{label}</span>
          <span className="text-gray-600 dark:text-gray-300">{progress}/{target}</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${colorClasses[color as keyof typeof colorClasses]}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }

  // Rendu du contenu selon l'onglet actif
  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Chargement...</span>
        </div>
      )
    }

    switch (sectionId) {
      case 'overview':
        if (activeTab === 'overview') {
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <MetricCard
                  title="Temps total"
                  value={`${analyticsData?.overview.totalTime || 0}min`}
                  change="+12%"
                  icon={<Clock className="w-4 h-4 text-white" />}
                  color="blue"
                />
                <MetricCard
                  title="Score moyen"
                  value={`${analyticsData?.overview.averageScore || 0}%`}
                  change="+5%"
                  icon={<Target className="w-4 h-4 text-white" />}
                  color="green"
                />
                <MetricCard
                  title="Activités"
                  value={analyticsData?.overview.totalActivities || 0}
                  change="+8"
                  icon={<Activity className="w-4 h-4 text-white" />}
                  color="purple"
                />
                <MetricCard
                  title="Taux de réussite"
                  value={`${analyticsData?.overview.completionRate || 0}%`}
                  change="+3%"
                  icon={<CheckCircle className="w-4 h-4 text-white" />}
                  color="orange"
                />
                <MetricCard
                  title="Progression"
                  value={`${analyticsData?.overview.weeklyProgress || 0}%`}
                  change="+15%"
                  icon={<TrendingUp className="w-4 h-4 text-white" />}
                  color="pink"
                />
                <MetricCard
                  title="Jours actifs"
                  value={`${analyticsData?.overview.activeDays || 0}/7`}
                  change="+2"
                  icon={<Calendar className="w-4 h-4 text-white" />}
                  color="indigo"
                />
              </div>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Tendances et comparaisons
              </h3>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300">
                  Graphiques de tendances et comparaisons disponibles ici
                </p>
              </div>
            </div>
          </div>
        )

      case 'performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(analyticsData?.performance || {}).map(([subject, data]: [string, any]) => (
                <div key={subject} className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 capitalize">
                    {subject}
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Score</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{data.score}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Temps</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{data.time}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Activités</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{data.activities}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )

      case 'goals':
        if (activeTab === 'current') {
          return (
            <div className="space-y-4">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Objectifs en cours
                </h3>
                <div className="space-y-4">
                  {analyticsData?.goals.current.map((goal: any, index: number) => (
                    <ProgressBar
                      key={index}
                      label={goal.name}
                      progress={goal.progress}
                      target={goal.target}
                      color={['blue', 'green', 'purple', 'orange'][index % 4]}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        }
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Objectifs terminés
              </h3>
              <div className="space-y-3">
                {analyticsData?.goals.completed.map((goal: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span className="text-gray-900 dark:text-white font-medium">{goal.name}</span>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{goal.date}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case 'achievements':
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Badges et récompenses
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData?.achievements.badges.map((badge: any, index: number) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    badge.earned 
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' 
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      <Award className={`w-6 h-6 ${badge.earned ? 'text-yellow-500' : 'text-gray-400'}`} />
                      <div>
                        <h4 className={`font-medium ${badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {badge.name}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{badge.description}</p>
                        {badge.earned && badge.date && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Obtenu le {badge.date}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-4">
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Analytics {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Les graphiques et statistiques détaillées pour {title.toLowerCase()} seront disponibles ici.
                </p>
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className={`w-16 h-16 bg-gradient-to-r ${
          color === 'blue' ? 'from-blue-500 to-blue-600' :
          color === 'green' ? 'from-green-500 to-green-600' :
          color === 'purple' ? 'from-purple-500 to-purple-600' :
          color === 'orange' ? 'from-orange-500 to-orange-600' :
          color === 'pink' ? 'from-pink-500 to-pink-600' :
          'from-indigo-500 to-indigo-600'
        } rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
          {icon}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h2>
      </div>

      {/* Filtres de temps */}
      <div className="flex justify-center space-x-2">
        {(['week', 'month', 'quarter'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
            }`}
          >
            {range === 'week' ? 'Cette semaine' : 
             range === 'month' ? 'Ce mois' : 'Ce trimestre'}
          </button>
        ))}
      </div>

      {/* Onglets */}
      {tabs.length > 1 && (
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Contenu */}
      <div className="max-h-96 overflow-y-auto">
        {renderTabContent()}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setLoading(true)}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualiser
        </button>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Fermer
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsModal
