'use client'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Crown, 
  Star, 
  Target, 
  TrendingUp, 
  Clock, 
  Award, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Calendar,
  Zap,
  Rocket,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Trophy,
  Medal,
  Flame,
  Heart,
  Diamond,
  Gem,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Flower,
  Tree,
  Mountain,
  Wave,
  Star2,
  Zap2,
  Thunder,
  Rainbow,
  Butterfly,
  Bird,
  Fish,
  Cat,
  Dog,
  Lion,
  Tiger,
  Bear,
  Wolf,
  Fox,
  Deer,
  Horse,
  Cow,
  Pig,
  Sheep,
  Goat,
  Chicken,
  Duck,
  Goose,
  Swan,
  Eagle,
  Hawk,
  Owl,
  Raven,
  Crow,
  Sparrow,
  Robin,
  Bluebird,
  Cardinal,
  Goldfinch,
  Canary,
  Parrot,
  Macaw,
  Cockatoo,
  Lovebird,
  Budgie,
  Finch,
  Warbler,
  Thrush,
  Mockingbird,
  Jay,
  Magpie,
  Nuthatch,
  Woodpecker,
  Kingfisher,
  Heron,
  Crane,
  Stork,
  Pelican,
  Albatross,
  Seagull,
  Tern,
  Sandpiper,
  Plover,
  Curlew,
  Godwit,
  Snipe,
  Woodcock,
  Sanderling,
  Dunlin,
  Knot,
  Turnstone,
  Oystercatcher,
  Avocet,
  Stilt,
  Phalarope,
  Skua,
  Jaeger,
  Gull,
  Tern2,
  Noddy,
  Tropicbird,
  Frigatebird,
  Booby,
  Gannet,
  Cormorant,
  Shag,
  Anhinga,
  Darter,
  Grebe,
  Loon,
  Auk,
  Murre,
  Guillemot,
  Razorbill,
  Puffin,
  Dovekie,
  StormPetrel,
  LeachPetrel,
  WilsonPetrel,
  WhiteTailedTropicbird,
  RedTailedTropicbird,
  RedBilledTropicbird,
  WhiteTailedTropicbird2,
  RedTailedTropicbird2,
  RedBilledTropicbird2
} from 'lucide-react'

interface LLMResult {
  data_sufficiency: 'low' | 'medium' | 'high'
  confidence: number
  summary_child: string
  summary_adult: string
  key_insights: Array<{
    title: string
    evidence: string[]
    impact: 'low' | 'medium' | 'high'
  }>
  risk_flags: string[]
  recommended_exercises: Array<{
    title: string
    nodeKey: string
    why_this: string
    target_minutes: number
    success_criteria: string
  }>
  schedule_plan: {
    next_48h: Array<{
      when_local: string
      duration_min: number
      focus: string
    }>
    spaced_practice: Array<{
      nodeKey: string
      review_on: string
      reason: string
    }>
  }
  parent_coaching: string[]
  teacher_notes: string[]
  dashboards_to_update: string[]
  missing_data: string[]
}

interface AdvancedLLMResultsProps {
  result: LLMResult
  subscriptionType?: 'free' | 'premium' | 'enterprise'
  onExerciseSelect?: (nodeKey: string) => void
}

export default function AdvancedLLMResults({ 
  result, 
  subscriptionType = 'free',
  onExerciseSelect 
}: AdvancedLLMResultsProps) {
  const isFreeAccount = subscriptionType === 'free'
  const isPremiumAccount = subscriptionType === 'premium' || subscriptionType === 'enterprise'

  // Obtenir l'icône et la couleur pour la suffisance des données
  const getDataSufficiencyInfo = (sufficiency: string) => {
    switch (sufficiency) {
      case 'high':
        return { icon: <CheckCircle size={20} />, color: 'text-green-600', bg: 'bg-green-50' }
      case 'medium':
        return { icon: <Info size={20} />, color: 'text-yellow-600', bg: 'bg-yellow-50' }
      case 'low':
        return { icon: <AlertTriangle size={20} />, color: 'text-red-600', bg: 'bg-red-50' }
      default:
        return { icon: <Info size={20} />, color: 'text-gray-600', bg: 'bg-gray-50' }
    }
  }

  // Obtenir l'icône et la couleur pour l'impact
  const getImpactInfo = (impact: string) => {
    switch (impact) {
      case 'high':
        return { icon: <Flame size={16} />, color: 'text-red-600', bg: 'bg-red-100' }
      case 'medium':
        return { icon: <Zap size={16} />, color: 'text-yellow-600', bg: 'bg-yellow-100' }
      case 'low':
        return { icon: <Leaf size={16} />, color: 'text-green-600', bg: 'bg-green-100' }
      default:
        return { icon: <Info size={16} />, color: 'text-gray-600', bg: 'bg-gray-100' }
    }
  }

  // Obtenir l'icône et la couleur pour les risques
  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'burnout_risk':
        return { icon: <Flame size={16} />, color: 'text-red-600' }
      case 'inactivity_risk':
        return { icon: <Clock size={16} />, color: 'text-orange-600' }
      case 'frustration_risk':
        return { icon: <AlertTriangle size={16} />, color: 'text-yellow-600' }
      case 'overchallenge_risk':
        return { icon: <Target size={16} />, color: 'text-purple-600' }
      case 'underchallenge_risk':
        return { icon: <TrendingUp size={16} />, color: 'text-blue-600' }
      default:
        return { icon: <Info size={16} />, color: 'text-gray-600' }
    }
  }

  const dataSufficiencyInfo = getDataSufficiencyInfo(result.data_sufficiency)

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm p-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* En-tête avec indicateurs de qualité */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Brain size={24} />
          </motion.div>
          Évaluation IA Katiopa
        </h3>
        
        <div className="flex items-center gap-4">
          {/* Indicateur de suffisance des données */}
          <motion.div 
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${dataSufficiencyInfo.bg}`}
            whileHover={{ scale: 1.05 }}
          >
            {dataSufficiencyInfo.icon}
            <span className={`text-sm font-medium ${dataSufficiencyInfo.color}`}>
              Données: {result.data_sufficiency}
            </span>
          </motion.div>

          {/* Indicateur de confiance */}
          <motion.div 
            className="px-3 py-2 bg-blue-50 rounded-lg flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
          >
            <Star size={16} className="text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              Confiance: {Math.round(result.confidence * 100)}%
            </span>
          </motion.div>
        </div>
      </div>

      {/* Résumé pour l'enfant */}
      <motion.div 
        className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <h4 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart size={20} />
          </motion.div>
          Message pour toi, petit(e) champion(ne) ! 🎯
        </h4>
        <p className="text-blue-800 text-lg leading-relaxed">{result.summary_child}</p>
      </motion.div>

      {/* Résumé pour l'adulte */}
      <motion.div 
        className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <GraduationCap size={20} />
          </motion.div>
          Analyse pour parents/enseignants
        </h4>
        <div className="text-gray-700 space-y-2">
          {result.summary_adult ? (
            result.summary_adult.split('•').map((point, index) => (
              point.trim() && (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{point.trim()}</span>
                </div>
              )
            ))
          ) : (
            <div className="text-gray-500 italic">
              Aucune analyse disponible pour le moment.
            </div>
          )}
        </div>
      </motion.div>

      {/* Insights clés */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Lightbulb size={20} />
          </motion.div>
          Insights clés
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.key_insights && result.key_insights.length > 0 ? (
            result.key_insights.map((insight, index) => {
              const impactInfo = getImpactInfo(insight.impact)
              return (
                <motion.div 
                  key={index}
                  className="p-4 border rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {impactInfo.icon}
                    <span className="font-medium text-gray-900">{insight.title}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${impactInfo.bg} ${impactInfo.color}`}>
                      {insight.impact}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {insight.evidence && insight.evidence.map((evidence, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                        <span>{evidence}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )
            })
          ) : (
            <div className="col-span-2 text-center text-gray-500 italic py-8">
              Aucun insight disponible pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Exercices recommandés */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <motion.div
            animate={{ 
              x: [0, 10, 0],
              y: [0, -5, 0],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Target size={20} />
          </motion.div>
          Exercices recommandés
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.recommended_exercises && result.recommended_exercises.length > 0 ? (
            result.recommended_exercises.map((exercise, index) => (
              <motion.div 
                key={index}
                className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <h5 className="font-medium text-gray-900 mb-2">{exercise.title}</h5>
                <p className="text-sm text-gray-600 mb-3">{exercise.why_this}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-600">⏱️ {exercise.target_minutes} min</span>
                  <span className="text-green-600">🎯 {exercise.success_criteria}</span>
                </div>
                {onExerciseSelect && (
                  <motion.button
                    onClick={() => onExerciseSelect(exercise.nodeKey)}
                    className="mt-3 w-full px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Commencer cet exercice
                  </motion.button>
                )}
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center text-gray-500 italic py-8">
              Aucun exercice recommandé pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Plan de révision (Premium uniquement) */}
      {isPremiumAccount && result.schedule_plan && (
        <motion.div 
          className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h4 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Calendar size={20} />
            </motion.div>
            Plan de révision personnalisé (Premium)
          </h4>
          
          {/* Prochaines 48h */}
          <div className="mb-4">
            <h5 className="font-medium text-purple-800 mb-2">Prochaines 48h</h5>
            <div className="space-y-2">
              {result.schedule_plan.next_48h && result.schedule_plan.next_48h.length > 0 ? (
                result.schedule_plan.next_48h.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-purple-700">
                      {new Date(session.when_local).toLocaleString('fr-FR')}
                    </span>
                    <span className="text-sm text-purple-600">
                      {session.duration_min} min - {session.focus}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-purple-500 italic py-2">
                  Aucune session planifiée pour le moment.
                </div>
              )}
            </div>
          </div>

          {/* Révision espacée */}
          <div>
            <h5 className="font-medium text-purple-800 mb-2">Révision espacée</h5>
            <div className="space-y-2">
              {result.schedule_plan.spaced_practice && result.schedule_plan.spaced_practice.length > 0 ? (
                result.schedule_plan.spaced_practice.map((review, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-sm text-purple-700">
                      {new Date(review.review_on).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="text-sm text-purple-600">
                      {review.nodeKey} - {review.reason}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center text-purple-500 italic py-2">
                  Aucune révision planifiée pour le moment.
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Conseils pour parents */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Heart size={20} />
          </motion.div>
          Conseils pour les parents
        </h4>
        <div className="space-y-3">
          {result.parent_coaching && result.parent_coaching.length > 0 ? (
            result.parent_coaching.map((tip, index) => (
              <motion.div 
                key={index}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + index * 0.1 }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-yellow-800">{tip}</span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-gray-500 italic py-4">
              Aucun conseil disponible pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Notes pour enseignants (Premium uniquement) */}
      {isPremiumAccount && result.teacher_notes && (
        <motion.div 
          className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h4 className="text-lg font-semibold text-indigo-900 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <BookOpen size={20} />
            </motion.div>
            Notes pour enseignants (Premium)
          </h4>
          <div className="space-y-3">
            {result.teacher_notes.length > 0 ? (
              result.teacher_notes.map((note, index) => (
                <div key={index} className="p-3 bg-white rounded border">
                  <span className="text-indigo-800 text-sm">{note}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-indigo-500 italic py-2">
                Aucune note disponible pour le moment.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Indicateurs de risque */}
      {result.risk_flags && result.risk_flags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <AlertTriangle size={20} />
            </motion.div>
            Indicateurs d'attention
          </h4>
          <div className="flex flex-wrap gap-2">
            {result.risk_flags.map((risk, index) => {
              const riskIcon = getRiskIcon(risk)
              return (
                <motion.span 
                  key={index}
                  className="px-3 py-2 bg-red-50 text-red-700 rounded-full flex items-center gap-2 text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  {riskIcon.icon}
                  {risk.replace('_', ' ')}
                </motion.span>
              )
            })}
          </div>
        </div>
      )}

      {/* Données manquantes */}
      {result.missing_data && result.missing_data.length > 0 && (
        <motion.div 
          className="p-4 bg-orange-50 rounded-lg border border-orange-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h4 className="text-lg font-semibold text-orange-900 mb-2 flex items-center gap-2">
            <Info size={20} />
            Données manquantes pour une analyse optimale
          </h4>
          <div className="text-orange-800 text-sm">
            {result.missing_data.join(', ')}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 