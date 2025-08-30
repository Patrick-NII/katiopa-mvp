'use client'

import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react'
import PerformanceCharts from './PerformanceCharts'

interface StatisticsTabProps {
  user: any
  activities: any[]
  summary: any
}

export default function StatisticsTab({
  user,
  activities,
  summary
}: StatisticsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* En-tête des statistiques */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-8 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">📊 Statistiques détaillées</h1>
        <p className="text-green-100 text-lg">
          Analysez votre progression avec des graphiques et métriques avancées
        </p>
      </div>

      {/* Métriques clés */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Sessions totales</h3>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Dernière session : {activities.length > 0 ? 
              new Date(activities[0].createdAt).toLocaleDateString('fr-FR') : 'Aucune'
            }
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Score moyen</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary && summary.length > 0 
                  ? Math.round(summary.reduce((acc, s) => acc + s.avg, 0) / summary.length)
                  : 'N/A'
                }/100
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Sur {summary ? summary.length : 0} domaine(s)
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Temps total</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary?.totalTime || 0} min
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Moyenne : {activities.length > 0 ? 
              Math.round(activities.reduce((acc, a) => acc + a.durationMs, 0) / (activities.length * 1000 * 60))
              : 0
            } min/session
          </div>
        </motion.div>
      </div>

      {/* Graphiques de performance */}
      <motion.div 
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
            <LineChart size={20} className="text-white" />
          </div>
          Graphiques de performance
        </h3>
        
        <PerformanceCharts 
          userId={user?.id}
          memberSince={user?.createdAt}
          activities={activities}
          summary={summary}
        />
      </motion.div>

      {/* Analyse par domaine */}
      <motion.div 
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <PieChart size={20} className="text-white" />
          </div>
          Analyse par domaine
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary?.domains?.map((domain, index) => (
            <motion.div 
              key={domain.domain}
              className="p-6 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 capitalize">{domain.domain}</h4>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 size={20} className="text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Score moyen</span>
                  <span className="font-bold text-lg text-gray-900">{domain.averageScore}/100</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${domain.averageScore}%` }}
                    transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                  />
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </motion.div>
          )) || (
            <div className="col-span-full text-center py-8 text-gray-500">
              Aucun domaine disponible
            </div>
          )}
        </div>
      </motion.div>

      {/* Tendances temporelles */}
      <motion.div 
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
            <TrendingUp size={20} className="text-white" />
          </div>
          Tendances et évolution
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3">Progression hebdomadaire</h4>
            <div className="space-y-2">
              {[75, 82, 78, 85, 88, 90, 87].map((score, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="text-sm text-blue-700 w-16">Sem {index + 1}</span>
                  <div className="flex-1 bg-blue-200 rounded-full h-2">
                    <motion.div 
                      className="bg-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${score}%` }}
                      transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                    />
                  </div>
                  <span className="text-sm font-medium text-blue-900 w-12">{score}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-900 mb-3">Objectifs atteints</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Pratique quotidienne</span>
                <span className="ml-auto text-sm font-medium text-green-900">✅</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-800">Score > 80%</span>
                <span className="ml-auto text-sm font-medium text-green-900">✅</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-yellow-800">3 domaines actifs</span>
                <span className="ml-auto text-sm font-medium text-yellow-900">🔄</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-800">Niveau expert</span>
                <span className="ml-auto text-sm font-medium text-gray-900">⏳</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 