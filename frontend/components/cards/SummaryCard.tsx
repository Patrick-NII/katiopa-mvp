'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronRight, 
  Play, 
  Eye, 
  Settings, 
  BarChart3,
  Users,
  MessageCircle,
  BookOpen,
  Code,
  Gamepad2,
  Lightbulb,
  Heart,
  Target,
  TrendingUp,
  Calendar,
  Award
} from 'lucide-react'

interface SummaryCardProps {
  title: string
  description: string
  icon: React.ReactNode
  value?: string | number
  trend?: 'up' | 'down' | 'stable'
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'indigo'
  actionLabel?: string
  onAction?: () => void
  className?: string
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  description,
  icon,
  value,
  trend,
  color = 'blue',
  actionLabel = 'Accéder',
  onAction,
  className = ''
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600'
  }

  const trendIcons = {
    up: <TrendingUp className="w-4 h-4 text-green-500" />,
    down: <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />,
    stable: <div className="w-4 h-4 bg-gray-400 rounded-full" />
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6 cursor-pointer transition-all duration-200 hover:shadow-2xl ${className}`}
      onClick={onAction}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center shadow-lg`}>
          {icon}
        </div>
        
        {value && (
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </div>
            {trend && (
              <div className="flex items-center gap-1 mt-1">
                {trendIcons[trend]}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {trend === 'up' ? '+12%' : trend === 'down' ? '-5%' : '0%'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {actionLabel}
        </span>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
    </motion.div>
  )
}

// Composants spécialisés pour différents types de contenu
export const AnalyticsSummaryCard: React.FC<{
  title: string
  description: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  onViewDetails?: () => void
}> = ({ title, description, value, trend, onViewDetails }) => (
  <SummaryCard
    title={title}
    description={description}
    icon={<BarChart3 className="w-6 h-6 text-white" />}
    value={value}
    trend={trend}
    color="blue"
    actionLabel="Voir détails"
    onAction={onViewDetails}
  />
)

export const FamilySummaryCard: React.FC<{
  title: string
  description: string
  childrenCount: number
  onManageFamily?: () => void
}> = ({ title, description, childrenCount, onManageFamily }) => (
  <SummaryCard
    title={title}
    description={description}
    icon={<Users className="w-6 h-6 text-white" />}
    value={`${childrenCount} enfant${childrenCount > 1 ? 's' : ''}`}
    color="green"
    actionLabel="Gérer famille"
    onAction={onManageFamily}
  />
)

export const BubixSummaryCard: React.FC<{
  title: string
  description: string
  conversationsCount: number
  onOpenChat?: () => void
}> = ({ title, description, conversationsCount, onOpenChat }) => (
  <SummaryCard
    title={title}
    description={description}
    icon={<MessageCircle className="w-6 h-6 text-white" />}
    value={`${conversationsCount} conversations`}
    color="purple"
    actionLabel="Ouvrir chat"
    onAction={onOpenChat}
  />
)

export const LearningModuleCard: React.FC<{
  title: string
  description: string
  progress: number
  moduleType: 'math' | 'code' | 'play' | 'science' | 'dream'
  onPlay?: () => void
}> = ({ title, description, progress, moduleType, onPlay }) => {
  const moduleIcons = {
    math: <BookOpen className="w-6 h-6 text-white" />,
    code: <Code className="w-6 h-6 text-white" />,
    play: <Gamepad2 className="w-6 h-6 text-white" />,
    science: <Lightbulb className="w-6 h-6 text-white" />,
    dream: <Heart className="w-6 h-6 text-white" />
  }

  const moduleColors = {
    math: 'blue' as const,
    code: 'green' as const,
    play: 'orange' as const,
    science: 'purple' as const,
    dream: 'pink' as const
  }

  return (
    <SummaryCard
      title={title}
      description={description}
      icon={moduleIcons[moduleType]}
      value={`${progress}%`}
      color={moduleColors[moduleType]}
      actionLabel="Jouer"
      onAction={onPlay}
    />
  )
}

export const SettingsSummaryCard: React.FC<{
  title: string
  description: string
  onOpenSettings?: () => void
}> = ({ title, description, onOpenSettings }) => (
  <SummaryCard
    title={title}
    description={description}
    icon={<Settings className="w-6 h-6 text-white" />}
    color="indigo"
    actionLabel="Configurer"
    onAction={onOpenSettings}
  />
)

export const ProgressSummaryCard: React.FC<{
  title: string
  description: string
  currentGoal: number
  totalGoal: number
  onViewProgress?: () => void
}> = ({ title, description, currentGoal, totalGoal, onViewProgress }) => (
  <SummaryCard
    title={title}
    description={description}
    icon={<Target className="w-6 h-6 text-white" />}
    value={`${currentGoal}/${totalGoal}`}
    color="green"
    actionLabel="Voir progression"
    onAction={onViewProgress}
  />
)

export default SummaryCard
