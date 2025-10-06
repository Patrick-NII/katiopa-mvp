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

  // Données rapides pour la vue d'ensemble (supprimées selon demande utilisateur)
  const quickActions: any[] = []

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



          
        </div>
      </div>
    </div>
  )
}
