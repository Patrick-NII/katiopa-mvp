'use client'

import React, { useState } from 'react'
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
  ChevronRight,
  Eye,
  Play,
  Settings
} from 'lucide-react'
import { useModals } from '@/hooks/useModals'
import ModalSystem from '@/components/modals/ModalSystem'
import AnalyticsModal from '@/components/modals/AnalyticsModal'
import SummaryCard, { 
  AnalyticsSummaryCard, 
  FamilySummaryCard, 
  ProgressSummaryCard 
} from '@/components/cards/SummaryCard'

interface AnalyticsPageProps {
  user: any
  childSessions: any[]
}

export default function AnalyticsPage({ user, childSessions }: AnalyticsPageProps) {
  const { modals, modalStates, openModal, closeModal, updateModal } = useModals()
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week')

  const isChild = user?.userType === 'CHILD'

  // Statistiques globales
  const globalStats = {
    totalTime: 0,
    averageScore: 0,
    totalActivities: 0,
    completionRate: 0,
    weeklyProgress: 0,
    activeChildren: childSessions?.length || 0
  }

  const analyticsSections = [
    {
      id: 'overview',
      title: 'Vue d\'ensemble',
      description: 'Statistiques générales et tendances',
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      color: 'blue' as const,
      value: `${globalStats.totalActivities} activités`
    },
    {
      id: 'performance',
      title: 'Performances',
      description: 'Analyse détaillée des performances',
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      color: 'green' as const,
      value: `${globalStats.averageScore}%`
    },
    {
      id: 'time',
      title: 'Temps d\'apprentissage',
      description: 'Suivi du temps passé sur les activités',
      icon: <Clock className="w-6 h-6 text-white" />,
      color: 'purple' as const,
      value: `${globalStats.totalTime}min`
    },
    {
      id: 'goals',
      title: 'Objectifs',
      description: 'Progression vers les objectifs fixés',
      icon: <Target className="w-6 h-6 text-white" />,
      color: 'orange' as const,
      value: `${globalStats.completionRate}%`
    },
    {
      id: 'achievements',
      title: 'Récompenses',
      description: 'Badges et récompenses obtenus',
      icon: <Award className="w-6 h-6 text-white" />,
      color: 'pink' as const,
      value: '0 badges'
    },
    {
      id: 'schedule',
      title: 'Planning',
      description: 'Calendrier des activités et sessions',
      icon: <Calendar className="w-6 h-6 text-white" />,
      color: 'indigo' as const,
      value: 'Cette semaine'
    }
  ]

  const childSpecificSections = [
    {
      id: 'my-progress',
      title: 'Ma Progression',
      description: 'Suivez votre évolution personnelle',
      icon: <TrendingUp className="w-6 h-6 text-white" />,
      color: 'blue' as const,
      value: `${globalStats.weeklyProgress}%`
    },
    {
      id: 'my-games',
      title: 'Mes Jeux',
      description: 'Statistiques de vos jeux préférés',
      icon: <Award className="w-6 h-6 text-white" />,
      color: 'green' as const,
      value: '5 jeux'
    }
  ]

  const parentSpecificSections = [
    {
      id: 'children-comparison',
      title: 'Comparaison Enfants',
      description: 'Comparez les performances de vos enfants',
      icon: <Users className="w-6 h-6 text-white" />,
      color: 'purple' as const,
      value: `${globalStats.activeChildren} enfants`
    },
    {
      id: 'family-report',
      title: 'Rapport Familial',
      description: 'Rapport global de la famille',
      icon: <BarChart3 className="w-6 h-6 text-white" />,
      color: 'orange' as const,
      value: 'Mensuel'
    }
  ]

  const allSections = isChild 
    ? [...analyticsSections, ...childSpecificSections]
    : [...analyticsSections, ...parentSpecificSections]

  const openAnalyticsModal = (sectionId: string) => {
    const section = allSections.find(s => s.id === sectionId)
    if (!section) return

    openModal({
      id: `analytics-${sectionId}`,
      title: section.title,
      size: 'large',
      closable: true,
      minimizable: true,
      maximizable: true,
      onClose: () => closeModal(`analytics-${sectionId}`),
      children: (
        <AnalyticsModal
          sectionId={sectionId}
          title={section.title}
          icon={section.icon}
          color={section.color}
          userType={user?.userType || 'CHILD'}
          onClose={() => closeModal(`analytics-${sectionId}`)}
        />
      )
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Analytics & Statistiques
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          {isChild ? 'Suivez votre progression' : 'Analysez les performances de vos enfants'}
        </p>
      </div>

      {/* Filtres rapides */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setTimeRange('week')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === 'week' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
          }`}
        >
          Cette semaine
        </button>
        <button
          onClick={() => setTimeRange('month')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === 'month' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
          }`}
        >
          Ce mois
        </button>
        <button
          onClick={() => setTimeRange('quarter')}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            timeRange === 'quarter' 
              ? 'bg-blue-500 text-white' 
              : 'bg-white/20 text-gray-700 dark:text-gray-300 hover:bg-white/30'
          }`}
        >
          Ce trimestre
        </button>
      </div>

      {/* Sections Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {allSections.map((section) => (
            <SummaryCard
              key={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              value={section.value}
              color={section.color}
              actionLabel="Voir détails"
              onAction={() => openAnalyticsModal(section.id)}
            />
          ))}
        </div>
      </div>

      {/* Modal System */}
      <ModalSystem 
        modals={modals}
        modalStates={modalStates}
        onModalChange={(id, updates) => updateModal(id, updates)}
      />
    </div>
  )
}
