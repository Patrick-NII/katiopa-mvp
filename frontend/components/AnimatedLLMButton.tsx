'use client'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Zap, 
  Crown, 
  Gift, 
  Lock, 
  Sparkles, 
  Target, 
  TrendingUp,
  Clock,
  Star,
  Rocket,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Award,
  Trophy,
  Medal,
  Fire,
  Heart,
  Diamond,
  Gem,
  Lightning,
  Sun,
  Moon,
  Cloud,
  Leaf,
  Flower,
  Tree,
  Mountain,
  Wave,
  Flame,
  Star2,
  Sparkle,
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

interface AnimatedLLMButtonProps {
  onClick: () => void
  loading: boolean
  disabled?: boolean
  subscriptionType?: 'free' | 'premium' | 'enterprise'
  focus: string
  className?: string
}

export default function AnimatedLLMButton({ 
  onClick, 
  loading, 
  disabled = false, 
  subscriptionType = 'free',
  focus,
  className = ""
}: AnimatedLLMButtonProps) {
  const isFreeAccount = subscriptionType === 'free'
  const isPremiumAccount = subscriptionType === 'premium' || subscriptionType === 'enterprise'

  // Déterminer le style et l'icône selon le type de compte
  const getButtonStyle = () => {
    if (isPremiumAccount) {
      return {
        bg: 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700',
        icon: <Crown size={20} />,
        text: 'Évaluation Premium',
        description: 'IA avancée avec mémoire et suivi personnalisé'
      }
    } else {
      return {
        bg: 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600',
        icon: <Gift size={20} />,
        text: 'Évaluation Basique',
        description: 'IA simple pour comptes gratuits'
      }
    }
  }

  const buttonStyle = getButtonStyle()

  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Bouton principal */}
      <motion.button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          relative w-full px-8 py-4 rounded-xl font-medium text-white transition-all duration-300
          ${buttonStyle.bg}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          shadow-lg hover:shadow-xl
        `}
        whileHover={!disabled && !loading ? { 
          scale: 1.02,
          y: -2,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
      >
        {/* Contenu du bouton */}
        <div className="flex items-center justify-center gap-3">
          {/* Icône principale */}
          <motion.div
            animate={loading ? { 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            } : {
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: loading ? 1 : 2,
              repeat: loading ? Infinity : Infinity,
              ease: "easeInOut"
            }}
          >
            {loading ? <Brain size={20} /> : buttonStyle.icon}
          </motion.div>

          {/* Texte et description */}
          <div className="text-center">
            <div className="text-lg font-semibold">
              {loading ? 'Évaluation en cours...' : buttonStyle.text}
            </div>
            <div className="text-sm opacity-90">
              {loading ? 'Analyse des données...' : buttonStyle.description}
            </div>
          </div>

          {/* Icône de focus */}
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
            <Target size={16} />
          </motion.div>
        </div>

        {/* Indicateur de domaine */}
        <div className="absolute top-2 right-2">
          <motion.div
            className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-medium"
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {focus}
          </motion.div>
        </div>

        {/* Effet de brillance au survol */}
        {!disabled && !loading && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
            initial={{ x: '-100%' }}
            whileHover={{ 
              x: '100%',
              opacity: [0, 0.3, 0]
            }}
            transition={{ duration: 0.6 }}
          />
        )}
      </motion.button>

      {/* Indicateurs de fonctionnalités selon le plan */}
      <div className="mt-3 flex justify-center gap-4">
        {isPremiumAccount ? (
          <>
            <motion.div 
              className="flex items-center gap-2 text-sm text-purple-600"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ 
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Brain size={14} />
              </motion.div>
              Mémoire IA
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-sm text-blue-600"
              whileHover={{ scale: 1.05 }}
            >
              <motion.div
                animate={{ 
                  y: [0, -3, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <TrendingUp size={14} />
              </motion.div>
              Suivi avancé
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 text-sm text-green-600"
              whileHover={{ scale: 1.05 }}
            >
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
                <Star size={14} />
              </motion.div>
              Recommandations
            </motion.div>
          </>
        ) : (
          <motion.div 
            className="flex items-center gap-2 text-sm text-orange-600"
            whileHover={{ scale: 1.05 }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Lock size={14} />
            </motion.div>
            Débloquez Premium pour plus de fonctionnalités
          </motion.div>
        )}
      </div>

      {/* Animation de particules pour les comptes premium */}
      {isPremiumAccount && !loading && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full"
              animate={{
                x: [0, Math.random() * 200 - 100],
                y: [0, Math.random() * 200 - 100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeOut"
              }}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${20 + (i * 10)}%`
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  )
} 