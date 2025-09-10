'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Target, 
  Calendar, 
  Zap,
  ArrowRight,
  Users,
  Brain,
  BarChart3,
  Sparkles,
  FileText,
  MessageSquare,
  ClipboardList,
  Award,
  Clock,
  CheckCircle
} from 'lucide-react'
import RadarChart from '../charts/RadarChart'

interface DashboardOverviewProps {
  user: any
  userType: 'CHILD' | 'PARENT'
  childSessions?: any[]
  onNavigate: (tab: string) => void
}

export default function DashboardOverview({ 
  user, 
  userType, 
  childSessions = [],
  onNavigate 
}: DashboardOverviewProps) {
  console.log('🎨 DashboardOverview rendu avec:', { user, userType, childSessions })
  const [quickStats, setQuickStats] = useState({
    todayProgress: 0,
    weeklyGoal: 5,
    streak: 0,
    totalTime: 0
  })

  const isChild = userType === 'CHILD'

  // Données des enfants pour le radar chart (nouvelle interface)
  const childrenProfiles = [
    {
      id: 'milan',
      name: 'Milan',
      color: '#3B82F6',
      data: [
        { competence: 'mathematiques', score: 6, maxScore: 10 },
        { competence: 'programmation', score: 5, maxScore: 10 },
        { competence: 'creativite', score: 7, maxScore: 10 },
        { competence: 'collaboration', score: 4, maxScore: 10 },
        { competence: 'concentration', score: 6, maxScore: 10 },
        { competence: 'resolution_problemes', score: 5, maxScore: 10 },
        { competence: 'communication', score: 6, maxScore: 10 },
        { competence: 'connaissances_generales', score: 5, maxScore: 10 },
        { competence: 'sens_critique', score: 4, maxScore: 10 },
        { competence: 'reflexion_logique', score: 6, maxScore: 10 }
      ]
    },
    {
      id: 'aylon',
      name: 'Aylon',
      color: '#8B5CF6',
      data: [
        { competence: 'mathematiques', score: 8, maxScore: 10 },
        { competence: 'programmation', score: 7, maxScore: 10 },
        { competence: 'creativite', score: 9, maxScore: 10 },
        { competence: 'collaboration', score: 6, maxScore: 10 },
        { competence: 'concentration', score: 7, maxScore: 10 },
        { competence: 'resolution_problemes', score: 8, maxScore: 10 },
        { competence: 'communication', score: 7, maxScore: 10 },
        { competence: 'connaissances_generales', score: 6, maxScore: 10 },
        { competence: 'sens_critique', score: 5, maxScore: 10 },
        { competence: 'reflexion_logique', score: 8, maxScore: 10 }
      ]
    }
  ]

  // Données pour l'enfant (mode enfant)
  const childProfile = {
    id: 'current-child',
    name: user?.firstName || 'Enfant',
    color: '#3B82F6',
    data: [
      { competence: 'mathematiques', score: 7, maxScore: 10 },
      { competence: 'programmation', score: 6, maxScore: 10 },
      { competence: 'creativite', score: 8, maxScore: 10 },
      { competence: 'collaboration', score: 5, maxScore: 10 },
      { competence: 'concentration', score: 7, maxScore: 10 },
      { competence: 'resolution_problemes', score: 6, maxScore: 10 },
      { competence: 'communication', score: 8, maxScore: 10 },
      { competence: 'connaissances_generales', score: 7, maxScore: 10 },
      { competence: 'sens_critique', score: 6, maxScore: 10 },
      { competence: 'reflexion_logique', score: 7, maxScore: 10 }
    ]
  }

  // Données rapides pour la vue d'ensemble
  const quickActions = isChild ? [
    {
      id: 'experiences',
      title: 'Mes Expériences',
      description: 'Continuer mon apprentissage',
      icon: Brain,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      id: 'bubix',
      title: 'Bubix',
      description: 'Mon assistant IA',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    }
  ] : [
    {
      id: 'analytics',
      title: 'Analytics & Statistiques',
      description: 'Suivi détaillé des performances',
      icon: BarChart3,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      id: 'family',
      title: 'Gestion Familiale',
      description: 'Suivi des enfants',
      icon: Users,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      id: 'bubix',
      title: 'Bubix Assistant',
      description: 'Analyses pédagogiques',
      icon: Sparkles,
      color: 'from-blue-500 to-indigo-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    }
  ]

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        <div className="space-y-6">
          {/* En-tête de bienvenue avec genre si pas de genre, on affiche Bonjour  et firstname uniquement. {user?.gender === 'FEMALE' ? 'Madame' : 'Monsieur'} */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Bonjour {user?.firstName} ! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isChild 
                ? "Prêt(e) pour une nouvelle aventure d'apprentissage ?" 
                : "Suivez la progression de vos enfants"
              }
            </p>
          </motion.div>

          {/* Statistiques rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Bilans</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">3</p>
                </div>
                <FileText className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Réunions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Évaluations</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">5</p>
                </div>
                <ClipboardList className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Prochaine</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">15/02</p>
                </div>
                <Calendar className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </motion.div>

          

          

          {/* Radar Chart pour les parents */}
          {!isChild && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <RadarChart 
                isChild={false}
                userType="PARENT"
                className="mb-8"
                compareModeDefault={true}
              />
            </motion.div>
          )}

          {/* Radar Chart pour les enfants */}
          {isChild && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <RadarChart 
                isChild={true}
                userType="CHILD"
                className="mb-8"
              />
            </motion.div>
          )}


          {/* Actions rapides */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {quickActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                onClick={() => onNavigate(action.id)}
                className={`${action.bgColor} dark:bg-gray-800 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105 group`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color}`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </div>
                <h3 className={`text-lg font-semibold ${action.textColor} dark:text-gray-200 mb-2`}>
                  {action.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {action.description}
                </p>
              </motion.button>
            ))}
          </motion.div>

          {/* Message d'encouragement */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {isChild ? "Continuez comme ça !" : "Excellente progression !"}
                </h4>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {isChild 
                    ? "Vous progressez bien dans votre apprentissage. Gardez le rythme !"
                    : "Vos enfants montrent une belle progression. Félicitations !"
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
