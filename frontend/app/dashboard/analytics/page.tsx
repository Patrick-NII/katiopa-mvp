'use client'

import { useState, useEffect } from 'react'
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
  Filter
} from 'lucide-react'
import CommunicationAnalytics from '../../../components/CommunicationAnalytics'
import WeeklyCycle from '../../../components/WeeklyCycle'

interface AnalyticsPageProps {
  user: any
  childSessions: any[]
}

export default function AnalyticsPage({ user, childSessions }: AnalyticsPageProps) {
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')
  const [loading, setLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<any>(null)

  // Statistiques globales
  const globalStats = {
    totalTime: 0,
    averageScore: 0,
    totalActivities: 0,
    completionRate: 0,
    weeklyProgress: 0,
    activeChildren: childSessions.length
  }

  const timeRangeOptions = [
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'quarter', label: 'Ce trimestre' }
  ]

  const loadAnalytics = async () => {
    setLoading(true)
    try {
      // Simulation de chargement des données
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAnalyticsData({
        performance: {
          averageScore: 85,
          improvement: 12,
          consistency: 78
        },
        engagement: {
          dailyActive: 5,
          weeklyActive: 7,
          averageSession: 25
        },
        learning: {
          completedModules: 15,
          inProgress: 3,
          mastery: 8
        }
      })
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [timeRange, selectedChild])

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Analytics & Statistiques 📊
          </h1>
          <p className="text-gray-600">
            Suivi détaillé des performances et de la progression
          </p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>
      </motion.div>

      {/* Statistiques globales */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temps total</p>
              <p className="text-2xl font-bold text-blue-600">{globalStats.totalTime}h</p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Score moyen</p>
              <p className="text-2xl font-bold text-green-600">{globalStats.averageScore}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activités</p>
              <p className="text-2xl font-bold text-purple-600">{globalStats.totalActivities}</p>
            </div>
            <Target className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Enfants actifs</p>
              <p className="text-2xl font-bold text-orange-600">{globalStats.activeChildren}</p>
            </div>
            <Users className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </motion.div>

      {/* Sélection d'enfant */}
      {childSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Sélectionner un enfant pour l'analyse détaillée
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {childSessions.map((child) => (
              <button
                key={child.id}
                onClick={() => setSelectedChild(child.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedChild === child.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-left">
                  <h4 className="font-semibold text-gray-900">
                    {child.firstName} {child.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {child.age ? `${child.age} ans` : 'Âge non spécifié'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Dernière activité: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cycles d'apprentissage par enfant */}
      {childSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-gray-900">
            Cycles d'apprentissage hebdomadaires
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {childSessions.map((child) => (
              <div key={child.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {child.firstName} {child.lastName}
                </h4>
                <WeeklyCycle
                  childName={`${child.firstName} ${child.lastName}`}
                  currentDay={new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}
                  childSessionId={child.id}
                />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Analytics de communication */}
      {childSessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h3 className="text-xl font-semibold text-gray-900">
            Analytics de Communication
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {childSessions.map((child) => (
              <div key={child.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">
                  {child.firstName} {child.lastName}
                </h4>
                <CommunicationAnalytics childSessionId={child.id} />
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Graphiques de performance */}
      {analyticsData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Performance Générale
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Score moyen</span>
                <span className="font-semibold text-green-600">
                  {analyticsData.performance.averageScore}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Amélioration</span>
                <span className="font-semibold text-blue-600">
                  +{analyticsData.performance.improvement}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Cohérence</span>
                <span className="font-semibold text-purple-600">
                  {analyticsData.performance.consistency}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Engagement
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actifs aujourd'hui</span>
                <span className="font-semibold text-orange-600">
                  {analyticsData.engagement.dailyActive}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actifs cette semaine</span>
                <span className="font-semibold text-blue-600">
                  {analyticsData.engagement.weeklyActive}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Session moyenne</span>
                <span className="font-semibold text-green-600">
                  {analyticsData.engagement.averageSession}min
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
