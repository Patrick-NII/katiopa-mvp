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
      initial={{ width: collapsedProp ? 80 : 256 }}
      animate={{ width: collapsedProp ? 80 : 256 }}
      className={`bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-screen flex flex-col transition-all duration-300 ${
        collapsedProp ? 'w-20' : 'w-64'
      }`}
    >
      {/* En-tête */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          {!collapsedProp && (
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">CubeAI</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isChild ? 'Espace Enfant' : 'Espace Parent'}
              </p>
            </div>
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
              className="w-full flex items-center justify-between p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-2">
                <section.icon className="w-4 h-4" />
                {!collapsedProp && (
                  <span className="text-sm font-medium">{section.title}</span>
                )}
              </div>
              {!collapsedProp && (
                expandedSections.has(section.id) ? 
                  <ChevronUp className="w-4 h-4" /> : 
                  <ChevronDown className="w-4 h-4" />
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
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    } ${!item.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsedProp && (
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{item.label}</span>
                          {item.isNew && (
                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                              Nouveau
                            </span>
                          )}
                          {item.badge && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.description}
                        </p>
                      </div>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Pied de page */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!collapsedProp && user && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user.firstName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {planTier}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => onCollapsedChange?.(!collapsedProp)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={collapsedProp ? 'Développer' : 'Réduire'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsedProp ? '' : 'rotate-180'}`} />
          </button>
          
          <button
            onClick={handleLogout}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
