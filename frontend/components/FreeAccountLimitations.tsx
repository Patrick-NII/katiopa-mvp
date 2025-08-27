'use client'
import { motion } from 'framer-motion'
import { 
  Gift, 
  Crown, 
  Star, 
  CheckCircle, 
  XCircle, 
  Zap, 
  Target, 
  TrendingUp,
  BarChart3,
  Clock,
  Shield,
  Award,
  Rocket,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Lock,
  Unlock,
  Heart,
  Fire,
  Lightning,
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

interface FreeAccountLimitationsProps {
  currentFeatures: string[]
  premiumFeatures: string[]
}

export default function FreeAccountLimitations({ 
  currentFeatures, 
  premiumFeatures 
}: FreeAccountLimitationsProps) {
  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm p-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan de votre compte</h3>
        <motion.div 
          className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
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
            <Gift size={20} />
          </motion.div>
          <span className="font-medium ml-2">Compte Gratuit</span>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fonctionnalités actuelles */}
        <motion.div 
          className="bg-green-50 p-6 rounded-lg border border-green-200"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
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
              <CheckCircle size={20} className="mr-2" />
            </motion.div>
            Ce qui est inclus
          </h4>
          <ul className="space-y-3">
            {currentFeatures.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
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
                  <CheckCircle size={16} className="text-green-600 mr-2" />
                </motion.div>
                <span className="text-green-700">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Fonctionnalités premium */}
        <motion.div 
          className="bg-blue-50 p-6 rounded-lg border border-blue-200"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <motion.div
              animate={{ 
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Star size={20} className="mr-2" />
            </motion.div>
            Débloqué avec Premium
          </h4>
          <ul className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <motion.li 
                key={index} 
                className="flex items-start"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <motion.div
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 360]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Star size={16} className="text-blue-600 mr-2" />
                </motion.div>
                <span className="text-blue-700">{feature}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Call to action */}
      <motion.div 
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-xl font-bold text-gray-900 mb-3 flex items-center justify-center gap-2">
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
              <Rocket size={24} />
            </motion.div>
            Prêt à passer au niveau supérieur ?
          </h4>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Débloquez toutes les fonctionnalités avancées, graphiques détaillés, 
            statistiques complètes et bien plus encore avec un compte Premium !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button 
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Voir les plans Premium
              <ArrowRight size={16} />
            </motion.button>
            <motion.button 
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Comparer les plans
              <ChevronRight size={16} />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
} 