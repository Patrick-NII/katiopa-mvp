'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Settings, 
  CreditCard, 
  Crown, 
  User, 
  BarChart3, 
  BookOpen, 
  HelpCircle,
  ChevronRight,
  Home,
  Target,
  TrendingUp,
  Users,
  LogOut,
  Box,
  Code,
  Gamepad2,
  Heart,
  Lightbulb,
  Globe,
  Sparkles,
  Brain,
  MessageCircle,
  Sun,
  Moon,
  Monitor,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAvatar } from '@/contexts/AvatarContext'
import { useTheme } from '@/contexts/ThemeContext'

export type NavigationTab = 
  | 'dashboard'
  | 'analytics'
  | 'experiences'
  | 'family'
  | 'bubix-assistant'
  | 'bubix'
  | 'reglages'
  | 'facturation'
  | 'abonnements'
  | 'family-members'
  | 'mathcube'
  | 'codecube'
  | 'playcube'
  | 'sciencecube'
  | 'dreamcube'
  | 'comcube'

interface ModularNavigationProps {
  activeTab: NavigationTab
  onTabChange: (tab: NavigationTab) => void
  userSubscriptionType: string
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

interface UserInfo {
  sessionId: string
  firstName: string
  lastName: string
  userType: string
  subscriptionType: string
  avatarPath?: string
}

interface NavigationSection {
  id: string
  title: string
  icon: any
  items: NavigationItem[]
  available: boolean
}

interface NavigationItem {
  id: NavigationTab
  label: string
  icon: any
  description: string
  available: boolean
  badge?: string
  isNew?: boolean
}

export default function ModularNavigation({ 
  activeTab, 
  onTabChange, 
  userSubscriptionType,
  userType,
  collapsed: collapsedProp,
  onCollapsedChange
}: ModularNavigationProps) {
  
  const { selectedAvatar } = useAvatar()
  const { theme, setTheme, isDark } = useTheme()
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))
  
  const isChild = userType === 'CHILD'
  const isParent = userType === 'PARENT'
  
  // Normaliser le type d'abonnement
  const normalizedType = userSubscriptionType?.toUpperCase() || 'FREE'
  
  const isFree = normalizedType === 'FREE'
  const isDecouverte = normalizedType === 'DECOUVERTE'
  const isExplorateur = normalizedType === 'EXPLORATEUR'
  const isMaitre = normalizedType === 'MAITRE'
  const isEnterprise = normalizedType === 'ENTERPRISE'
  const isPremium = isExplorateur || isMaitre || isEnterprise

  // Nouveau mapping commercial (Découverte, Explorateur, Maître)
  type PlanTier = 'DECOUVERTE' | 'EXPLORATEUR' | 'MAITRE' | 'ENTERPRISE'
  const planTier: PlanTier = (
    isFree ? 'DECOUVERTE' :
    isDecouverte ? 'DECOUVERTE' :
    isExplorateur ? 'EXPLORATEUR' :
    isMaitre ? 'MAITRE' :
    'ENTERPRISE'
  )

  // Charger les informations utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await authAPI.verify()
        if (response.success && response.user) {
          setUser(response.user)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'utilisateur:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadUser()
  }, [])

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth < 768) {
        onCollapsedChange?.(true)
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [onCollapsedChange])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      router.push('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  // Définir les sections de navigation selon le type d'utilisateur
  const getNavigationSections = (): NavigationSection[] => {
    if (isChild) {
      return [
        {
          id: 'main',
          title: 'Principal',
          icon: Home,
          available: true,
          items: [
            {
              id: 'experiences',
              label: 'Mes Expériences',
              icon: Brain,
              description: 'Apprentissage et jeux',
              available: true,
              isNew: true
            },
            {
              id: 'bubix',
              label: 'Bubix',
              icon: MessageCircle,
              description: 'Assistant IA',
              available: true
            }
          ]
        },
        {
          id: 'learning',
          title: 'Modules d\'Apprentissage',
          icon: BookOpen,
          available: true,
          items: [
            {
              id: 'mathcube',
              label: 'MathCube',
              icon: BookOpen,
              description: 'Mathématiques rigoureuses',
              available: true
            },
            {
              id: 'codecube',
              label: 'CodeCube',
              icon: Code,
              description: 'Programmation et logique',
              available: true
            },
            {
              id: 'playcube',
              label: 'PlayCube',
              icon: Gamepad2,
              description: 'Apprentissage par le jeu',
              available: true
            },
            {
              id: 'sciencecube',
              label: 'ScienceCube',
              icon: Lightbulb,
              description: 'Sciences et découverte',
              available: true
            },
            {
              id: 'dreamcube',
              label: 'DreamCube',
              icon: Heart,
              description: 'Créativité et émotions',
              available: true
            }
          ]
        },
        {
          id: 'settings',
          title: 'Paramètres',
          icon: Settings,
          available: true,
          items: [
            {
              id: 'reglages',
              label: 'Réglages',
              icon: Settings,
              description: 'Configuration personnelle',
              available: true
            }
          ]
        }
      ]
    } else {
      // Navigation pour les parents
      return [
        {
          id: 'main',
          title: 'Principal',
          icon: Home,
          available: true,
          items: [
            {
              id: 'dashboard',
              label: 'Dashboard',
              icon: LayoutDashboard,
              description: 'Vue d\'ensemble',
              available: true
            },
            {
              id: 'analytics',
              label: 'Analytics',
              icon: BarChart3,
              description: 'Statistiques détaillées',
              available: true,
              isNew: true
            },
            {
              id: 'family',
              label: 'Gestion Familiale',
              icon: Users,
              description: 'Suivi des enfants',
              available: true,
              isNew: true
            },
            {
              id: 'bubix-assistant',
              label: 'Bubix Assistant',
              icon: MessageCircle,
              description: 'Analyses pédagogiques',
              available: true,
              isNew: true
            }
          ]
        },
        {
          id: 'subscription',
          title: 'Abonnement',
          icon: Crown,
          available: true,
          items: [
            {
              id: 'abonnements',
              label: 'Abonnements',
              icon: Crown,
              description: 'Plans et fonctionnalités',
              available: true,
              badge: planTier === 'DECOUVERTE' ? 'Découverte' : 
                     planTier === 'EXPLORATEUR' ? 'Explorateur' : 
                     planTier === 'MAITRE' ? 'Maître' : 'Entreprise'
            },
            {
              id: 'facturation',
              label: 'Facturation',
              icon: CreditCard,
              description: 'Historique et paiements',
              available: true
            }
          ]
        },
        {
          id: 'settings',
          title: 'Paramètres',
          icon: Settings,
          available: true,
          items: [
            {
              id: 'reglages',
              label: 'Réglages',
              icon: Settings,
              description: 'Configuration et sécurité',
              available: true
            }
          ]
        }
      ]
    }
  }

  const navigationSections = getNavigationSections()

  if (isLoading) {
    return (
      <div className="w-20 md:w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ width: collapsedProp ? 64 : 224 }}
      animate={{ width: collapsedProp ? 64 : 224 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="fixed left-0 top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-r border-white/20 dark:border-gray-700/50 h-screen flex flex-col shadow-2xl"
    >
      {/* En-tête */}
      <div className="p-4 border-b border-white/20 dark:border-gray-700/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
            title="Retour à l'accueil"
          >
            <span className="text-white font-bold text-sm">C</span>
          </button>
          {!collapsedProp && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">CubeAI</h1>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {isChild ? 'Espace Enfant' : 'Espace Parent'}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        {navigationSections.map((section) => (
          <div key={section.id} className="mb-4">
            {/* En-tête de section */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-2 text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4 text-gray-800 dark:text-gray-100" />
                {!collapsedProp && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2, delay: 0.1 }}
                    className="text-sm font-medium"
                  >
                    {section.title}
                  </motion.span>
                )}
              </div>
              {!collapsedProp && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                >
                  {expandedSections.has(section.id) ? 
                    <ChevronUp className="w-4 h-4 text-gray-800 dark:text-gray-100" /> : 
                    <ChevronDown className="w-4 h-4 text-gray-800 dark:text-gray-100" />
                  }
                </motion.div>
              )}
            </button>

            {/* Items de la section */}
            {expandedSections.has(section.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-2 space-y-1"
              >
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    disabled={!item.available}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 backdrop-blur-sm ${
                      activeTab === item.id
                        ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-800 dark:text-blue-200 border border-blue-300/30 dark:border-blue-500/30'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    } ${!item.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <item.icon className={`w-4 h-4 flex-shrink-0 ${
                      activeTab === item.id 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-800 dark:text-gray-100'
                    }`} />
                    {!collapsedProp && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2, delay: 0.1 }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.isNew && (
                            <span className="px-1.5 py-0.5 bg-green-500/20 text-green-700 dark:text-green-300 text-xs rounded-full backdrop-blur-sm border border-green-300/30">
                              Nouveau
                            </span>
                          )}
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs rounded-full backdrop-blur-sm border border-blue-300/30">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {item.description}
                        </p>
                      </motion.div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Pied de page */}
      <div className="p-4 border-t border-white/20 dark:border-gray-700/50 backdrop-blur-sm">
        {!collapsedProp && user && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, delay: 0.1 }}
            className="flex items-center gap-3 mb-4"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-lg">
              {user.firstName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {planTier}
              </p>
            </div>
          </motion.div>
        )}
        
        <div className="flex items-center justify-between">
          <motion.button
            onClick={() => onCollapsedChange?.(!collapsedProp)}
            className="p-3 text-gray-800 dark:text-gray-100 hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-all duration-200 backdrop-blur-sm"
            title={collapsedProp ? 'Développer' : 'Réduire'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ChevronRight className={`w-5 h-5 transition-transform ${collapsedProp ? '' : 'rotate-180'}`} />
          </motion.button>
          
          {!collapsedProp && (
            <motion.button
              onClick={handleLogout}
              className="p-3 text-gray-800 dark:text-gray-100 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all duration-200 backdrop-blur-sm"
              title="Déconnexion"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <LogOut className="w-5 h-5" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
