'use client'
import { useState, useEffect } from 'react'
import { useSession } from '../hooks/useSession'
import { motion } from 'framer-motion'
import { 
  User, 
  Crown, 
  Star, 
  Phone, 
  Globe, 
  Settings, 
  Bell, 
  Calendar,
  Clock,
  TrendingUp,
  Zap,
  Target,
  Award,
  Gift,
  Lock,
  Unlock,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ArrowRight,
  Gift2,
  Lock2,
  Unlock2,
  Shield2,
  Award2,
  Medal,
  Fire,
  Heart,
  Rocket,
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
  RedBilledTropicbird2,
  BarChart3
} from 'lucide-react'

interface UserProfileProps {
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    role: string
    createdAt: string
    phone?: string
    country?: string
    timezone?: string
    preferences?: {
      language: string
      theme: string
      notifications: boolean
    }
    subscriptionType?: 'free' | 'premium' | 'enterprise'
  }
  level: number
  experience: number
  totalTime: number
  subscription?: {
    plan: string
    status: string
    startDate: string
    endDate: string
    nextBilling: string
    amount: number
    currency: string
  }
  billing?: {
    invoices: Array<{
      id: string
      date: string
      amount: number
      status: string
    }>
    totalSpent: number
  }
}

export default function UserProfile({ user, level, experience, totalTime, subscription, billing }: UserProfileProps) {
  const { currentSessionTime } = useSession()
  const [avatarUrl, setAvatarUrl] = useState('')

  // Déterminer si c'est un compte gratuit
  const isFreeAccount = user.subscriptionType === 'free' || !subscription

  // Générer un avatar basé sur les initiales
  useEffect(() => {
    const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    
    // Créer un avatar SVG avec les initiales
    const svg = `
      <svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <rect width="80" height="80" fill="${randomColor}" rx="40"/>
        <text x="40" y="50" font-family="Arial, sans-serif" font-size="32" font-weight="bold" 
              text-anchor="middle" fill="white">${initials}</text>
      </svg>
    `
    const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`
    setAvatarUrl(dataUrl)
  }, [user.firstName, user.lastName])

  // Formater le temps
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatTotalTime = (milliseconds: number) => {
    if (milliseconds === 0) return '0m'
    
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  const formatRegistrationDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date inconnue'
      }
      const day = date.getDate().toString().padStart(2, '0')
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (error) {
      return 'Date inconnue'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Date invalide'
      }
      return date.toLocaleDateString('fr-FR', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
      })
    } catch (error) {
      return 'Date invalide'
    }
  }

  // Calculer le niveau et l'expérience
  const experienceToNextLevel = 100 - (experience % 100)
  const progressPercentage = (experience % 100)

  // Calculer le temps total réel (session actuelle + temps cumulé)
  const effectiveTotalTime = totalTime + (currentSessionTime * 1000)

  // Calculer l'ancienneté
  const calculateMembershipDuration = () => {
    try {
      const memberSince = new Date(user.createdAt)
      if (isNaN(memberSince.getTime())) {
        return 'Durée inconnue'
      }
      
      const now = new Date()
      const yearsDiff = now.getFullYear() - memberSince.getFullYear()
      const monthsDiff = now.getMonth() - memberSince.getMonth()
      const daysDiff = now.getDate() - memberSince.getDate()
      
      if (yearsDiff > 0) {
        return `${yearsDiff} an${yearsDiff > 1 ? 's' : ''}`
      } else if (monthsDiff > 0) {
        return `${monthsDiff} mois`
      } else {
        return `${daysDiff} jour${daysDiff > 1 ? 's' : ''}`
      }
    } catch (error) {
      return 'Durée inconnue'
    }
  }

  const membershipDuration = calculateMembershipDuration()

  return (
    <motion.div 
      className="bg-white rounded-xl shadow-sm p-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Première ligne : Avatar et informations utilisateur */}
      <div className="flex items-start space-x-8 mb-8">
        {/* Avatar */}
        <motion.div 
          className="relative flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.2 }}
        >
          <img 
            src={avatarUrl} 
            alt={`Avatar de ${user.firstName} ${user.lastName}`}
            className="w-20 h-20 rounded-full border-2 border-gray-200"
          />
          {/* Indicateur de niveau */}
          <motion.div 
            className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {level}
          </motion.div>
        </motion.div>

        {/* Informations utilisateur */}
        <div className="flex-1 space-y-3">
          <h2 className="text-2xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-gray-600">{user.email}</p>
          <div className="flex flex-wrap gap-3">
            <motion.span 
              className="text-sm text-gray-500 capitalize bg-gray-100 px-3 py-1 rounded-full flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <User size={14} />
              Rôle: {user.role.toLowerCase()}
            </motion.span>
            <motion.span 
              className="text-sm text-gray-500 bg-blue-50 px-3 py-1 rounded-full flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <Calendar size={14} />
              Membre depuis le {formatRegistrationDate(user.createdAt)} ({membershipDuration})
            </motion.span>
            <motion.span 
              className={`text-sm px-3 py-1 rounded-full flex items-center gap-2 ${
                isFreeAccount 
                  ? 'text-orange-600 bg-orange-50' 
                  : 'text-green-600 bg-green-50'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              {isFreeAccount ? (
                <>
                  <Gift size={14} />
                  Compte Gratuit
                </>
              ) : (
                <>
                  <Crown size={14} />
                  Compte Premium
                </>
              )}
            </motion.span>
            {user.phone && (
              <motion.span 
                className="text-sm text-gray-500 bg-green-50 px-3 py-1 rounded-full flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Phone size={14} />
                {user.phone}
              </motion.span>
            )}
            {user.country && (
              <motion.span 
                className="text-sm text-gray-500 bg-purple-50 px-3 py-1 rounded-full flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
              >
                <Globe size={14} />
                {user.country}
              </motion.span>
            )}
          </div>
          {user.preferences && (
            <div className="flex flex-wrap gap-2">
              <motion.span 
                className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
              >
                <Globe size={12} />
                Langue: {user.preferences.language}
              </motion.span>
              <motion.span 
                className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
              >
                <Sun size={12} />
                Thème: {user.preferences.theme}
              </motion.span>
              <motion.span 
                className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded flex items-center gap-1"
                whileHover={{ scale: 1.05 }}
              >
                <Bell size={12} />
                Notifications: {user.preferences.notifications ? 'Activées' : 'Désactivées'}
              </motion.span>
            </div>
          )}
        </div>

        {/* Informations de connexion détaillées */}
        <div className="flex-shrink-0 space-y-3">
          <motion.div 
            className="bg-green-50 p-3 rounded-lg border border-green-200"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-green-600 font-medium mb-1 flex items-center gap-2">
              <Clock size={14} />
              Session actuelle
            </div>
            <div className="text-lg font-mono font-bold text-green-700">
              {formatTime(currentSessionTime)}
            </div>
          </motion.div>
          <motion.div 
            className="bg-blue-50 p-3 rounded-lg border border-blue-200"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-sm text-blue-600 font-medium mb-1 flex items-center gap-2">
              <TrendingUp size={14} />
              Temps total
            </div>
            <div className="text-lg font-mono font-bold text-blue-700">
              {formatTotalTime(effectiveTotalTime)}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Deuxième ligne : Barre de progression du niveau */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-base font-medium text-gray-700 flex items-center gap-2">
            <Target size={16} />
            Niveau {level} - {experience} XP
          </span>
          <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            {experienceToNextLevel} XP pour le niveau {level + 1}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div 
            className="bg-blue-600 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
      </motion.div>

      {/* Troisième ligne : Statistiques rapides sur toute la largeur */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <motion.div 
          className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-blue-600 mb-1">{level}</div>
          <div className="text-xs text-blue-700 font-medium">Niveau</div>
        </motion.div>
        <motion.div 
          className="text-center p-4 bg-green-50 rounded-lg border border-green-200"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-green-600 mb-1">{experience}</div>
          <div className="text-xs text-green-700 font-medium">XP Total</div>
        </motion.div>
        <motion.div 
          className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-purple-600 mb-1">
            {Math.floor(effectiveTotalTime / 3600000)}h
          </div>
          <div className="text-xs text-purple-700 font-medium">Temps Total</div>
        </motion.div>
        <motion.div 
          className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200"
          whileHover={{ scale: 1.05, y: -5 }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {Math.floor(currentSessionTime / 60)}
          </div>
          <div className="text-xs text-orange-700 font-medium">Min Session</div>
        </motion.div>
      </div>

      {/* Bloc d'abonnements et facturation - UNIQUEMENT pour les comptes premium */}
      {!isFreeAccount && subscription && (
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Crown size={20} />
            Abonnement et facturation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Plan actuel</div>
              <div className="text-lg font-bold text-blue-800">{subscription.plan}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Statut</div>
              <div className={`text-lg font-bold px-2 py-1 rounded-full text-sm ${
                subscription.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {subscription.status === 'active' ? 'Actif' : 'Inactif'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Prochaine facturation</div>
              <div className="text-lg font-bold text-blue-800">{formatDate(subscription.nextBilling)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-1">Montant</div>
              <div className="text-lg font-bold text-blue-800">{subscription.amount} {subscription.currency}</div>
            </div>
          </div>
          
          {billing && billing.invoices.length > 0 && (
            <div className="mt-4">
              <h4 className="text-base font-medium text-blue-800 mb-3">Dernières factures</h4>
              <div className="space-y-2">
                {billing.invoices.slice(0, 3).map((invoice) => (
                  <motion.div 
                    key={invoice.id} 
                    className="flex justify-between items-center bg-white p-3 rounded-lg border border-blue-100"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-blue-600">#{invoice.id}</span>
                      <span className="text-sm text-gray-600">{formatDate(invoice.date)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">{invoice.amount} {subscription.currency}</span>
                      <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status === 'paid' ? (
                          <>
                            <CheckCircle size={12} />
                            Payée
                          </>
                        ) : (
                          <>
                            <AlertCircle size={12} />
                            En attente
                          </>
                        )}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 text-right">
                <span className="text-sm text-blue-600">
                  Total dépensé: {billing.totalSpent} {subscription.currency}
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Bloc d'upgrade pour les comptes gratuits */}
      {isFreeAccount && (
        <motion.div 
          className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-200 p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <Rocket size={20} />
            Passez à la vitesse supérieure !
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl mb-2">
                <BarChart3 size={32} className="mx-auto text-orange-600" />
              </div>
              <div className="text-sm text-orange-700 font-medium">Statistiques avancées</div>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl mb-2">
                <TrendingUp size={32} className="mx-auto text-orange-600" />
              </div>
              <div className="text-sm text-orange-700 font-medium">Graphiques détaillés</div>
            </motion.div>
            <motion.div 
              className="text-center"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-2xl mb-2">
                <Target size={32} className="mx-auto text-orange-600" />
              </div>
                              <div className="text-sm text-orange-700 font-medium">Expériences CubeAI illimitées</div>
            </motion.div>
          </div>
          <div className="text-center">
            <motion.button 
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center gap-2 mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Découvrir les plans Premium
              <ArrowRight size={16} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 