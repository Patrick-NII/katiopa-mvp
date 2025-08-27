'use client'

import { motion } from 'framer-motion'
import { 
  Activity, 
  TrendingUp, 
  Target, 
  Award,
  BarChart3,
  Clock,
  Zap
} from 'lucide-react'
import AnimatedLLMButton from './AnimatedLLMButton'
import AdvancedLLMResults from './AdvancedLLMResults'
import UserStats from './UserStats'

interface DashboardTabProps {
  user: any
  activities: any[]
  summary: any[]
  llmResponse: any
  loading: boolean
  focus: string
  onFocusChange: (focus: string) => void
  onEvaluateLLM: () => void
  onExerciseSelect: (nodeKey: string) => void
}

export default function DashboardTab({
  user,
  activities,
  summary,
  llmResponse,
  loading,
  focus,
  onFocusChange,
  onEvaluateLLM,
  onExerciseSelect
}: DashboardTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* En-tête du dashboard */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">Bonjour {user?.name} ! 👋</h1>
        <p className="text-blue-100 text-lg">
          Voici votre tableau de bord personnalisé pour suivre votre progression
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Activity size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Activités totales</h3>
              <p className="text-2xl font-bold text-gray-900">{activities.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+15% ce mois</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Score moyen</h3>
              <p className="text-2xl font-bold text-gray-900">
                {summary.length > 0 
                  ? Math.round(summary.reduce((acc, s) => acc + s.avg, 0) / summary.length)
                  : 'N/A'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+8% cette semaine</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Domaines actifs</h3>
              <p className="text-2xl font-bold text-gray-900">{summary.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-purple-600">
            <Zap size={16} />
            <span>3 matières</span>
          </div>
        </motion.div>

        <motion.div 
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Temps total</h3>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(activities.reduce((acc, a) => acc + a.durationMs, 0) / (1000 * 60))} min
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-orange-600">
            <Award size={16} />
            <span>Niveau 3</span>
          </div>
        </motion.div>
      </div>

      {/* Section LLM avec bouton animé */}
      <motion.div 
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          Évaluation IA Katiopa
        </h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Choisissez votre matière de focus :
          </label>
          <select 
            value={focus} 
            onChange={(e) => onFocusChange(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px] mb-6 text-base"
          >
            <option value="maths">🔢 Mathématiques</option>
            <option value="coding">💻 Programmation</option>
            <option value="reading">📚 Lecture</option>
            <option value="science">🔬 Sciences</option>
            <option value="ai">🤖 IA & Logique</option>
          </select>
          
          {/* Bouton LLM animé */}
          <AnimatedLLMButton 
            onClick={onEvaluateLLM}
            loading={loading}
            disabled={loading}
            subscriptionType={user.subscriptionType}
            focus={focus}
            className="max-w-md"
          />
        </div>

        {/* Résultats LLM avancés */}
        {llmResponse && (
          <AdvancedLLMResults 
            result={llmResponse}
            subscriptionType={user.subscriptionType}
            onExerciseSelect={onExerciseSelect}
          />
        )}
      </motion.div>

      {/* Résumé par domaine */}
      <motion.div 
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Résumé par domaine</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summary.map((s, index) => (
            <motion.div 
              key={s.domain} 
              className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
            >
              <span className="capitalize font-medium text-gray-700">{s.domain}</span>
              <span className="font-bold text-lg text-gray-900">{Math.round(s.avg)}/100</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Statistiques utilisateur */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <UserStats 
          activities={activities}
          memberSince={user?.createdAt}
        />
      </motion.div>
    </motion.div>
  )
} 