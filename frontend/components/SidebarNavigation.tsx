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
  Monitor
} from 'lucide-react'
import { authAPI } from '@/lib/api'
import { useAvatar } from '@/contexts/AvatarContext'
import { useTheme } from '@/contexts/ThemeContext'

export type NavigationTab = 
  | 'dashboard'
  | 'bubix'
  | 'reglages'
  | 'facturation'
  | 'abonnements'
  | 'experiences'
  | 'family-members'
  | 'mathcube'
  | 'codecube'
  | 'playcube'
  | 'sciencecube'
  | 'dreamcube'
  | 'comcube'

interface SidebarNavigationProps {
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

interface TabItem {
  id: NavigationTab
  label: string
  icon: any
  description: string
  available: boolean
  badge?: string
}

// Composant personnalisé pour l'icône cube 3D
const Cube3DIcon = ({ size = 18, className = "", colors }: { size?: number, className?: string, colors: any }) => {
  return (
    <div className={`${className} relative`} style={{ width: size, height: size }}>
      {/* Cube 3D avec ombre et perspective */}
      <div className="relative w-full h-full transform rotate-45">
        {/* Face avant */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.cubeGradient} rounded-sm shadow-lg`}></div>
        {/* Face droite */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.cubeGradient} rounded-sm shadow-lg transform rotate-y-90 translate-x-1/2 origin-left`}></div>
        {/* Face supérieure */}
        <div className={`absolute inset-0 bg-gradient-to-br ${colors.cubeGradient} rounded-sm shadow-lg transform rotate-x-90 translate-y-1/2 origin-top`}></div>
        {/* Ombre portée */}
        <div className="absolute inset-0 bg-gray-800 rounded-sm transform translate-x-1 translate-y-1 opacity-30"></div>
      </div>
    </div>
  );
};

export default function SidebarNavigation({ 
  activeTab, 
  onTabChange, 
  userSubscriptionType,
  userType,
  collapsed: collapsedProp,
  onCollapsedChange
}: SidebarNavigationProps) {
  const router = useRouter()
  const { selectedAvatar } = useAvatar()
  const { theme, setTheme, isDark } = useTheme()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  
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
  
  // Déterminer les permissions selon le type d'utilisateur
  const isChild = userType === 'CHILD'
  const isParent = userType === 'PARENT'
  const isTeacher = userType === 'TEACHER'
  const isAdmin = userType === 'ADMIN'

  // État local pour la sidebar
  const [internalCollapsed, setInternalCollapsed] = useState(true)
  const collapsed = collapsedProp ?? internalCollapsed
  
  const toggleCollapsed = () => {
    const newCollapsed = !collapsed
    setInternalCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  // Obtenir les couleurs selon l'abonnement
  const getSubscriptionColors = () => {
    switch (normalizedType) {
      case 'PRO':
        return {
          gradient: 'from-blue-500 to-indigo-600',
          cubeGradient: 'from-blue-400 to-indigo-500',
          accent: 'text-blue-600',
          bg: 'bg-blue-50'
        }
      case 'PREMIUM':
      case 'PRO_PLUS':
        return {
          gradient: 'from-fuchsia-500 to-violet-600',
          cubeGradient: 'from-fuchsia-400 to-violet-500',
          accent: 'text-fuchsia-600',
          bg: 'bg-fuchsia-50'
        }
      case 'ENTERPRISE':
        return {
          gradient: 'from-purple-500 to-pink-600',
          cubeGradient: 'from-purple-400 to-pink-500',
          accent: 'text-purple-600',
          bg: 'bg-purple-50'
        }
      default:
        return {
          gradient: 'from-blue-500 to-violet-600',
          cubeGradient: 'from-blue-400 to-violet-500',
          accent: 'text-blue-600',
          bg: 'bg-blue-50'
        }
    }
  }

  const colors = getSubscriptionColors()

  // Fonctions pour calculer les tailles adaptatives selon les breakpoints
  const getSidebarWidth = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    
    if (width < 480) {
      return collapsed ? 0 : 240 // Très petit mobile
    } else if (width < 640) {
      return collapsed ? 0 : 260 // Petit mobile
    } else if (width < 768) {
      return collapsed ? 0 : 280 // Mobile standard
    } else if (width < 1024) {
      return collapsed ? 60 : 240 // Tablette
    } else if (width < 1280) {
      return collapsed ? 70 : 256 // Desktop petit
    } else if (width < 1440) {
      return collapsed ? 80 : 280 // Desktop moyen
    } else if (width < 1680) {
      return collapsed ? 90 : 300 // Desktop large
    } else {
      return collapsed ? 100 : 320 // Très grand écran
    }
  }

  const getSidebarPadding = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    
    if (width < 480) {
      return 'px-2' // Très petit mobile
    } else if (width < 640) {
      return 'px-3' // Petit mobile
    } else if (width < 768) {
      return 'px-3' // Mobile standard
    } else if (width < 1024) {
      return 'px-3' // Tablette
    } else if (width < 1280) {
      return 'px-4' // Desktop petit
    } else if (width < 1440) {
      return 'px-4' // Desktop moyen
    } else if (width < 1680) {
      return 'px-5' // Desktop large
    } else {
      return 'px-6' // Très grand écran
    }
  }

  const getIconSize = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    
    if (width < 480) {
      return 16 // Très petit mobile
    } else if (width < 640) {
      return 18 // Petit mobile
    } else if (width < 768) {
      return 18 // Mobile standard
    } else if (width < 1024) {
      return 18 // Tablette
    } else if (width < 1280) {
      return 20 // Desktop petit
    } else if (width < 1440) {
      return 20 // Desktop moyen
    } else if (width < 1680) {
      return 22 // Desktop large
    } else {
      return 24 // Très grand écran
    }
  }

  const getAvatarSize = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    
    if (width < 480) {
      return 'w-8 h-8' // Très petit mobile
    } else if (width < 640) {
      return 'w-10 h-10' // Petit mobile
    } else if (width < 768) {
      return 'w-10 h-10' // Mobile standard
    } else if (width < 1024) {
      return 'w-10 h-10' // Tablette
    } else if (width < 1280) {
      return 'w-12 h-12' // Desktop petit
    } else if (width < 1440) {
      return 'w-12 h-12' // Desktop moyen
    } else if (width < 1680) {
      return 'w-14 h-14' // Desktop large
    } else {
      return 'w-16 h-16' // Très grand écran
    }
  }

  const getLogoSize = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    
    if (width < 480) {
      return 'w-8 h-8' // Très petit mobile
    } else if (width < 640) {
      return 'w-9 h-9' // Petit mobile
    } else if (width < 768) {
      return 'w-9 h-9' // Mobile standard
    } else if (width < 1024) {
      return 'w-10 h-10' // Tablette
    } else if (width < 1280) {
      return 'w-10 h-10' // Desktop petit
    } else if (width < 1440) {
      return 'w-10 h-10' // Desktop moyen
    } else if (width < 1680) {
      return 'w-12 h-12' // Desktop large
    } else {
      return 'w-14 h-14' // Très grand écran
    }
  }

  const getTextSize = () => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 1200
    
    if (width < 480) {
      return 'text-xs' // Très petit mobile
    } else if (width < 640) {
      return 'text-sm' // Petit mobile
    } else if (width < 768) {
      return 'text-sm' // Mobile standard
    } else if (width < 1024) {
      return 'text-sm' // Tablette
    } else if (width < 1280) {
      return 'text-sm' // Desktop petit
    } else if (width < 1440) {
      return 'text-base' // Desktop moyen
    } else if (width < 1680) {
      return 'text-base' // Desktop large
    } else {
      return 'text-lg' // Très grand écran
    }
  }

  // Charger les informations utilisateur
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const response = await authAPI.verify()
        if (response.success && response.user) {
          setUser(response.user)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations utilisateur:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserInfo()
  }, [])

  // Détecter la taille d'écran avec breakpoints étendus
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      // Mobile: < 768px, Desktop: >= 768px
      setIsMobile(width < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Obtenir l'avatar par défaut basé sur le type d'utilisateur
  const getDefaultAvatar = (userType: string) => {
    const avatars = [
      '/avatar/DF43E25C-2338-4B0A-B541-F3C9C6749C70_1_105_c.jpeg',
      '/avatar/C680597F-C476-47A3-8AFD-5BF7480AB18F_1_105_c.jpeg',
      '/avatar/9032E0D4-24CB-43FF-A828-D73BACF6A2CB_1_105_c.jpeg',
      '/avatar/AFABF252-DC83-4CB8-96FD-F93E4848144F_1_105_c.jpeg',
      '/avatar/630F3A22-5A32-4B9D-89F2-BE41C6D06047_1_105_c.jpeg',
      '/avatar/B651627E-16E8-4B38-964C-52AC717EA8A6_1_105_c.jpeg',
      '/avatar/4585039E-FE54-402B-967A-49505261DCCA_1_105_c.jpeg',
      '/avatar/46634418-D597-4138-A12C-ED6DB610C8BD_1_105_c.jpeg',
      '/avatar/1643C2A2-D991-4327-878E-6A5B94E0C320_1_105_c.jpeg',
      '/avatar/17AF2653-1B7A-43F7-B376-0616FC6C0DBD_1_105_c.jpeg',
      '/avatar/45840AC6-AFFE-46E0-9668-51CFD4C9740B_1_105_c.jpeg',
      '/avatar/54E70A9E-8558-429D-87D6-52DECAAF983D_1_105_c.jpeg',
      '/avatar/4456CAC7-32C6-4419-967E-291D37C9B368_1_105_c.jpeg',
      '/avatar/358DF2B2-AE4E-4359-AB2E-DD45D240D78F_1_105_c.jpeg',
      '/avatar/013BDBD7-230C-4ECD-B292-2C66159ACCBC_1_105_c.jpeg',
      '/avatar/840CE97E-2237-41EE-9559-E3A152359D61_1_105_c.jpeg',
      '/avatar/01A68700-5E6F-4EA5-A6B6-2E954AD53A0D_1_105_c.jpeg'
    ]
    
    // Utiliser le hash du sessionId pour sélectionner un avatar de manière déterministe
    if (user?.sessionId) {
      const hash = user.sessionId.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      return avatars[Math.abs(hash) % avatars.length]
    }
    
    return avatars[0]
  }

  // Obtenir les couleurs selon l'abonnement pour l'utilisateur
  const getUserSubscriptionColors = () => {
    const type = user?.subscriptionType?.toUpperCase() || 'FREE'
    
    switch (type) {
      case 'PRO':
        return {
          gradient: 'from-blue-500 to-indigo-600',
          text: 'text-blue-600'
        }
      case 'PREMIUM':
      case 'PRO_PLUS':
        return {
          gradient: 'from-fuchsia-500 to-violet-600',
          text: 'text-fuchsia-600'
        }
      case 'ENTERPRISE':
        return {
          gradient: 'from-purple-500 to-pink-600',
          text: 'text-purple-600'
        }
      default:
        return {
          gradient: 'from-blue-500 to-violet-600',
          text: 'text-blue-600'
        }
    }
  }

  // Définir les onglets de navigation
  let tabs: TabItem[] = [
    {
      id: 'experiences',
      label: 'Expériences',
      icon: Sparkles,
      description: 'Tableau de bord central',
      available: isChild // Seuls les enfants ont accès
    },
    {
      id: 'mathcube',
      label: 'MathCube',
      icon: BookOpen,
      description: 'Mathématiques gamifiées',
      available: isChild // Seuls les enfants ont accès
    },
    {
      id: 'codecube',
      label: 'CodeCube',
      icon: Code,
      description: 'Initiation à la programmation',
      available: isChild
    },
    {
      id: 'playcube',
      label: 'PlayCube',
      icon: Gamepad2,
      description: 'Jeux de détente + éducatifs',
      available: isChild
    },
    {
      id: 'sciencecube',
      label: 'ScienceCube',
      icon: Lightbulb,
      description: 'Découvertes scientifiques',
      available: isChild
    },
    {
      id: 'dreamcube',
      label: 'DreamCube',
      icon: Heart,
      description: 'Espace de rêve, objectifs, métiers',
      available: isChild
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Suivi et statistiques',
      available: !isChild // Seuls les parents ont accès
    },
    {
      id: 'comcube',
      label: 'ComCube',
      icon: Globe,
      description: 'Communauté et partage',
      // Parents: disponible à partir d'Explorateur (planTier !== DECOUVERTE)
      available: !isChild && planTier !== 'DECOUVERTE'
    },
    {
      id: 'abonnements',
      label: 'Abonnements',
      icon: Crown,
      description: 'Plans et fonctionnalités',
      available: !isChild,
      // Badge avec les nouveaux noms commerciaux
      badge: planTier === 'DECOUVERTE' ? 'Découverte' : planTier === 'EXPLORATEUR' ? 'Explorateur' : planTier === 'MAITRE' ? 'Maître' : 'Entreprise'
    },
    {
      id: 'family-members',
      label: 'Membres de famille',
      icon: Users,
      description: 'Gérer les membres de votre famille',
      available: !isChild // Seuls les parents ont accès à la gestion des membres
    },
    {
      id: 'facturation',
      label: 'Facturation',
      icon: CreditCard,
      description: 'Historique et paiements',
      // Tous les parents abonnés (dès Découverte payant)
      available: !isChild
    },
    {
      id: 'bubix',
      label: 'Bubix',
      icon: MessageCircle,
      description: 'Assistant IA intelligent',
      available: true
    },
    {
      id: 'reglages',
      label: 'Réglages',
      icon: Settings,
      description: 'Configuration et sécurité',
      available: true
    }
  ]

  // Espace enfant: onglets selon le plan
  if (isChild) {
    let keep: NavigationTab[] = []
    if (planTier === 'DECOUVERTE') {
      // Découverte: Expériences (lite), MathCube, Bubix
      keep = ['experiences', 'mathcube', 'bubix', 'reglages']
    } else if (planTier === 'EXPLORATEUR') {
      // Explorateur: tous les onglets enfants
      keep = ['experiences', 'mathcube', 'codecube', 'playcube', 'sciencecube', 'dreamcube', 'bubix', 'reglages']
    } else {
      // Maître/Entreprise: tous les onglets enfants (contenus premium gérés dans les vues)
      keep = ['experiences', 'mathcube', 'codecube', 'playcube', 'sciencecube', 'dreamcube', 'bubix', 'reglages']
    }
    tabs = tabs.filter(t => keep.includes(t.id))
  }

  return (
    <>
      {/* Menu hamburger pour mobile - design amélioré */}
      {isMobile && (
        <button
          onClick={toggleCollapsed}
          className="fixed top-4 left-4 z-50 p-3 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-300 hover:scale-105"
          aria-label="Menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center items-center">
            <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 ${
              !collapsed ? 'rotate-45 translate-y-1.5' : ''
            } w-5 h-1`}></div>
            <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 mt-1 ${
              !collapsed ? 'opacity-0' : ''
            } w-5 h-1`}></div>
            <div className={`bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-300 mt-1 ${
              !collapsed ? '-rotate-45 -translate-y-1.5' : ''
            } w-5 h-1`}></div>
          </div>
        </button>
      )}

      {/* Overlay moderne pour mobile */}
      {isMobile && !collapsed && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={toggleCollapsed}
        />
      )}

      {/* Sidebar */}
      <motion.div 
        className={`fixed left-0 top-0 h-screen bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl z-50 flex flex-col overflow-hidden ${
          isMobile && collapsed ? 'w-0' : ''
        } ${isMobile ? 'border-r border-gray-200/50 dark:border-gray-700/50' : ''}`}
        initial={{ 
          width: getSidebarWidth(),
          x: isMobile && collapsed ? -getSidebarWidth() : 0
        }}
        animate={{ 
          width: getSidebarWidth(),
          x: isMobile && collapsed ? -getSidebarWidth() : 0
        }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      >
      {/* En-tête de la sidebar — branding unifié avec design mobile amélioré */}
      <div className={`relative ${isMobile ? 'h-20' : 'h-16'} ${getSidebarPadding()} ${isMobile ? 'pr-16' : 'pr-10'} border-b border-gray-200/50 dark:border-gray-700/50 flex items-center bg-gradient-to-r from-white/50 to-gray-50/50 dark:from-gray-900/50 dark:to-gray-800/50`}>
        <div className="flex items-center gap-3 w-full">
          <div className={`${getLogoSize()} bg-gradient-to-r ${colors.gradient} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${isMobile ? 'ring-2 ring-white/20' : ''}`}>
            <span className="font-title text-white text-2xl leading-none">C</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="logo-multicolor text-2xl md:text-4xl">
                <span>C</span><span>u</span><span>b</span><span>e</span><span>A</span><span>I</span>
              </div>
            </div>
          )}
          {/* Bouton rétractable aligné au logo */}
          <button 
            onClick={toggleCollapsed} 
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            <ChevronRight className={`w-4 h-4 ${collapsed ? 'rotate-0' : '-rotate-180'}`} />
          </button>
        </div>

        {/* Indicateur de type de compte (désactivé ici pour stabilité de layout) */}
      </div>

      {/* Navigation des onglets - verticale avec design mobile amélioré */}
      <div className={`flex-1 ${isMobile ? 'py-6' : 'py-4'} overflow-y-auto ${isMobile ? 'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent' : ''}`}>
        <nav className={`${isMobile ? 'space-y-4' : 'space-y-3'} ${getSidebarPadding()}`}>
          {tabs.map((tab) => (
            tab.available && (
              <button
                key={tab.id}
                onClick={() => {
                  onTabChange(tab.id)
                  // Fermer automatiquement la sidebar sur mobile après clic
                  if (isMobile) {
                    toggleCollapsed()
                  }
                }}
                className={`
                  group relative w-full flex items-center gap-3 ${isMobile ? 'px-4 py-3' : 'px-2 py-1'} ${isMobile ? 'rounded-xl' : 'rounded-lg'} text-sm font-semibold transition-all duration-200
                  ${activeTab === tab.id
                    ? tab.id === 'bubix'
                      ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-blue-50 shadow-lg animate-metallic'
                      : `bg-gradient-to-r ${colors.gradient} text-white shadow-lg`
                    : tab.id === 'bubix'
                      ? 'text-blue-600 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 dark:text-blue-400 dark:bg-gray-800 dark:hover:bg-gray-700'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }
                  ${isMobile ? 'hover:scale-105 hover:shadow-md' : ''}
                `}
                title={tab.label}
                aria-label={tab.label}
              >
                <div className={`${
                  activeTab === tab.id 
                    ? tab.id === 'bubix'
                      ? 'bg-blue-100/40 text-blue-50 animate-metallic'
                      : 'bg-white/20 text-white'
                    : tab.id === 'bubix'
                      ? 'bg-gradient-to-r from-blue-400 to-indigo-400 text-blue-50 shadow-lg dark:bg-gray-700 dark:text-blue-400'
                      : 'bg-gray-10 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                } ${isMobile ? 'w-12 h-12' : 'w-9 h-9'} ${isMobile ? 'rounded-xl' : 'rounded-lg'} flex items-center justify-center flex-shrink-0 ${isMobile ? 'shadow-md' : ''}`}>
                  {tab.icon === Cube3DIcon ? (
                    <Cube3DIcon size={isMobile ? getIconSize() + 4 : getIconSize()} colors={colors} />
                  ) : (
                    <tab.icon size={isMobile ? getIconSize() + 4 : getIconSize()} />
                  )}
                </div>
                {!collapsed && (
                  <span className="flex-1 text-left font-semibold">{tab.label}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-150 delay-150">
                    <div className="relative px-2 py-1 rounded-md bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
                      {/* Caret */}
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 shadow-md"></div>
                      {tab.label}
                    </div>
                  </div>
                )}
                {tab.badge && (
                  <span className={`${
                    collapsed ? 'hidden' : ''
                  } 
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-600 text-white'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
                {activeTab === tab.id && (
                  <div className={`${collapsed ? 'hidden' : ''} w-2 h-2 bg-blue-200 rounded-full ${tab.id === 'bubix' ? 'animate-metallic' : ''}`} />
                )}
              </button>
            )
          ))}
        </nav>
      </div>

      {/* En-tête utilisateur avec design mobile amélioré */}
      {!isLoading && user && (
        <div className={`${collapsed ? 'px-2' : getSidebarPadding()} ${isMobile ? 'py-6' : 'py-4'} border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/50 to-white/50 dark:from-gray-800/50 dark:to-gray-900/50`}>
          <motion.div
            className={`${collapsed ? 'flex justify-center' : 'flex items-center space-x-3'} ${isMobile ? 'p-4' : 'p-3'} ${isMobile ? 'rounded-xl' : 'rounded-lg'} ${isMobile ? 'bg-white/80 dark:bg-gray-800/80' : ''} ${isMobile ? 'shadow-md' : ''}`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Avatar */}
            <div className="relative">
              <img
                src={selectedAvatar || user.avatarPath || getDefaultAvatar(user.userType)}
                alt={`Avatar de ${user.firstName}`}
                className={`${isMobile ? 'w-16 h-16' : getAvatarSize()} rounded-full object-cover ${isMobile ? 'border-4 border-white/80' : 'border-2 border-white'} ${isMobile ? 'shadow-xl' : 'shadow-md'}`}
              />
              {/* Indicateur de statut en ligne */}
              <div className={`absolute -bottom-1 -right-1 ${isMobile ? 'w-5 h-5' : 'w-4 h-4'} bg-green-500 rounded-full ${isMobile ? 'border-3 border-white' : 'border-2 border-white'} ${isMobile ? 'shadow-lg' : ''}`}></div>
            </div>

            {/* Informations utilisateur - visible en mode expanded */}
            {!collapsed && (
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <span className={`font-semibold text-gray-900 dark:text-gray-100 ${isMobile ? 'text-base' : getTextSize()}`}>
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500 dark:text-gray-400`}>ID:</span>
                  <span className={`${isMobile ? 'text-sm' : 'text-xs'} font-mono ${getUserSubscriptionColors().text} font-semibold multicolor-id`}>
                    {user.sessionId}
                  </span>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Actions rapides: Thème + Accueil + Déconnexion sur une ligne en bas */}
      <div className={`${getSidebarPadding()} ${isMobile ? 'pb-6' : 'pb-3'} border-t border-gray-200/50 dark:border-gray-700/50`}>
        {isMobile ? (
          // Layout mobile: 3 boutons sur une ligne
          <div className="flex items-center justify-between space-x-2">
            {/* Bouton Thème */}
            <button
              onClick={() => {
                if (theme === 'light') {
                  setTheme('dark')
                } else if (theme === 'dark') {
                  setTheme('auto')
                } else {
                  setTheme('light')
                }
              }}
              className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-md"
              title={`Thème actuel: ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto'}`}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                {theme === 'light' && <Sun size={16} />}
                {theme === 'dark' && <Moon size={16} />}
                {theme === 'auto' && <Monitor size={16} />}
              </div>
              <span className="text-xs">Thème</span>
            </button>

            {/* Bouton Accueil */}
            <button
              onClick={() => {
                router.push('/')
                // Fermer automatiquement la sidebar sur mobile après clic
                if (isMobile) {
                  toggleCollapsed()
                }
              }}
              className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-semibold bg-white-100 hover:bg-gray-200 text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-all duration-200 hover:scale-105 hover:shadow-md"
              title="Accueil"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                <Home size={16} />
              </div>
              <span className="text-xs">Accueil</span>
            </button>

            {/* Bouton Déconnexion */}
            <button
              onClick={async () => { 
                try { 
                  await (await import('@/lib/api')).authAPI.logout()
                  // Fermer automatiquement la sidebar sur mobile après clic
                  if (isMobile) {
                    toggleCollapsed()
                  }
                  router.push('/login')
                } catch (e) {} 
              }}
              className="flex-1 flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-sm font-semibold bg-white-50 hover:bg-red-100 text-red-300 dark:bg-gray-800 dark:hover:bg-red-900/20 dark:text-red-400 transition-all duration-200 hover:scale-105 hover:shadow-md"
              title="Déconnexion"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white text-red-700 shadow-sm dark:bg-gray-700 dark:text-red-400">
                <LogOut size={16} />
              </div>
              <span className="text-xs">Déconnexion</span>
            </button>
          </div>
        ) : (
          // Layout desktop: boutons verticaux
          <div className="space-y-2">
            <button
              onClick={() => {
                if (theme === 'light') {
                  setTheme('dark')
                } else if (theme === 'dark') {
                  setTheme('auto')
                } else {
                  setTheme('light')
                }
              }}
              className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-all duration-200"
              title={`Thème actuel: ${theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto'}`}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                {theme === 'light' && <Sun size={getIconSize()} />}
                {theme === 'dark' && <Moon size={getIconSize()} />}
                {theme === 'auto' && <Monitor size={getIconSize()} />}
              </div>
              {!collapsed && (
                <span className="hidden md:block">
                  {theme === 'light' ? 'Mode Clair' : theme === 'dark' ? 'Mode Sombre' : 'Mode Auto'}
                </span>
              )}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-150 delay-150">
                  <div className="relative px-2 py-1 rounded-md bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 shadow-md"></div>
                    {theme === 'light' ? 'Mode Clair' : theme === 'dark' ? 'Mode Sombre' : 'Mode Auto'}
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={() => {
                router.push('/')
                // Fermer automatiquement la sidebar sur mobile après clic
                if (isMobile) {
                  toggleCollapsed()
                }
              }}
              className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold bg-white-100 hover:bg-gray-200 text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300 transition-all duration-200"
              title="Accueil"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-gray-700 shadow-sm dark:bg-gray-700 dark:text-gray-300">
                <Home size={getIconSize()} />
              </div>
              {!collapsed && <span className="hidden md:block">Accueil</span>}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-150 delay-150">
                  <div className="relative px-2 py-1 rounded-md bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 shadow-md"></div>
                    Accueil
                  </div>
                </div>
              )}
            </button>
            <button
              onClick={async () => { 
                try { 
                  await (await import('@/lib/api')).authAPI.logout()
                  // Fermer automatiquement la sidebar sur mobile après clic
                  if (isMobile) {
                    toggleCollapsed()
                  }
                  router.push('/login')
                } catch (e) {} 
              }}
              className="group relative w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-semibold bg-white-50 hover:bg-red-100 text-red-300 dark:bg-gray-800 dark:hover:bg-red-900/20 dark:text-red-400 transition-all duration-200"
              title="Déconnexion"
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-red-700 shadow-sm dark:bg-gray-700 dark:text-red-400">
                <LogOut size={getIconSize()} />
              </div>
              {!collapsed && <span className="hidden md:block">Déconnexion</span>}
              {collapsed && (
                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-150 delay-150">
                  <div className="relative px-2 py-1 rounded-md bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
                    <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 shadow-md"></div>
                    Déconnexion
                  </div>
                </div>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Footer de la sidebar avec design mobile amélioré */}
      <div className={`${getSidebarPadding()} ${isMobile ? 'py-4' : 'py-3'} border-t border-gray-200/50 dark:border-gray-700/50 bg-gradient-to-r from-gray-50/30 to-white/30 dark:from-gray-800/30 dark:to-gray-900/30`}>
        {!collapsed && (
          <div className="text-xs text-gray-700 dark:text-gray-300 text-center font-medium hidden md:block">
            <p>Version 1.0.0</p>
            <p>© 2025 CubeAI</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Thème:</span>
              <div className="flex items-center gap-1">
                {theme === 'light' && <Sun className="w-3 h-3 text-yellow-500" />}
                {theme === 'dark' && <Moon className="w-3 h-3 text-blue-400" />}
                {theme === 'auto' && <Monitor className="w-3 h-3 text-gray-500 dark:text-gray-400" />}
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {theme === 'light' ? 'Clair' : theme === 'dark' ? 'Sombre' : 'Auto'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
    </>
  )
} 
