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
  Sparkles
} from 'lucide-react'
import WeeklyCycle from '../WeeklyCycle'

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
    <div className="space-y-6">
      {/* En-tête de bienvenue */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Bonjour {user?.firstName} ! 👋
        </h1>
        <p className="text-gray-600">
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
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progression</p>
              <p className="text-2xl font-bold text-green-600">{quickStats.todayProgress}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Objectif</p>
              <p className="text-2xl font-bold text-blue-600">{quickStats.weeklyGoal}/7</p>
            </div>
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Série</p>
              <p className="text-2xl font-bold text-orange-600">{quickStats.streak}</p>
            </div>
            <Zap className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Temps</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(quickStats.totalTime / 60)}min</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </motion.div>

      {/* Cycle d'apprentissage hebdomadaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <WeeklyCycle
          childName={user?.firstName || 'Utilisateur'}
          currentDay={new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}
          interactive={isChild}
        />
      </motion.div>

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
            className={`${action.bgColor} border-2 border-transparent hover:border-gray-300 rounded-xl p-6 text-left transition-all duration-200 hover:shadow-lg hover:scale-105 group`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${action.color}`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </div>
            <h3 className={`text-lg font-semibold ${action.textColor} mb-2`}>
              {action.title}
            </h3>
            <p className="text-gray-600 text-sm">
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
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">
              {isChild ? "Continuez comme ça !" : "Excellente progression !"}
            </h4>
            <p className="text-gray-600 text-sm">
              {isChild 
                ? "Vous progressez bien dans votre apprentissage. Gardez le rythme !"
                : "Vos enfants montrent une belle progression. Félicitations !"
              }
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
