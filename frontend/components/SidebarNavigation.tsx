'use client'

import { useState } from 'react'
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
  Users
} from 'lucide-react'
import AnimatedIcon from './AnimatedIcons'

export type NavigationTab = 
  | 'dashboard'
  | 'reglages'
  | 'facturation'
  | 'abonnements'
  | 'informations'
  | 'statistiques'
  | 'experiences'
  | 'aide'
  | 'communautes'
  | 'photo'
  | 'jeux'
  | 'family-members'

interface SidebarNavigationProps {
  activeTab: NavigationTab
  onTabChange: (tab: NavigationTab) => void
  userSubscriptionType: string
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

interface TabItem {
  id: NavigationTab
  label: string
  icon: any
  description: string
  available: boolean
  badge?: string
}

// Composant personnalisé pour l'icône cube
const CubeIcon = ({ size = 18, className = "" }) => {
  return (
    <div className={className}>
      <img 
        src="/icons/cube-icon.svg" 
        alt="Cube icon"
        style={{ width: size, height: size }}
      />
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
  // Normaliser le type d'abonnement
  const normalizedType = userSubscriptionType?.toUpperCase() || 'FREE'
  
  const isFree = normalizedType === 'FREE'
  const isPro = normalizedType === 'PRO'
  const isProPlus = normalizedType === 'PRO_PLUS'
  const isEnterprise = normalizedType === 'ENTERPRISE'
  const isPremium = isPro || isProPlus || isEnterprise
  
  // Déterminer les permissions selon le type d'utilisateur
  const isChild = userType === 'CHILD'
  const isParent = userType === 'PARENT'
  const isTeacher = userType === 'TEACHER'
  const isAdmin = userType === 'ADMIN'
  
  // Supporter un mode contrôlé/non-contrôlé pour la rétractation
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = typeof collapsedProp === 'boolean' ? collapsedProp : internalCollapsed
  const toggleCollapsed = () => {
    if (onCollapsedChange) return onCollapsedChange(!collapsed)
    setInternalCollapsed(v => !v)
  }

  let tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble et statistiques',
      available: !isChild // Seuls les parents ont accès au dashboard
    },
    {
      id: 'statistiques',
      label: 'Statistiques',
      icon: BarChart3,
      description: 'Graphiques et analyses détaillées',
      available: !isChild && !isFree // Parents + comptes Pro et supérieurs
    },
    {
      id: 'experiences',
      label: 'Expériences',
      icon: CubeIcon,
      description: 'Toutes les fonctionnalités CubeAI',
      available: true // Tous les utilisateurs ont accès aux expériences
    },
    {
      id: 'informations',
      label: 'Profil & Préférences',
      icon: User,
      description: 'Informations personnelles et objectifs',
      available: !isChild // Seuls les parents ont accès au profil
    },
    {
      id: 'abonnements',
      label: 'Abonnements',
      icon: Crown,
      description: 'Plans et fonctionnalités',
      available: !isChild, // Seuls les parents ont accès aux abonnements
      badge: isFree ? 'Gratuit' : isPro ? 'Pro' : isProPlus ? 'Pro Plus' : 'Entreprise'
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
      available: !isChild && !isFree // Parents + comptes Pro et supérieurs
    },
    // Nouveaux onglets pour les enfants (réduits à une expérience unique)
    {
      id: 'jeux',
      label: 'Jeux',
      icon: Target,
      description: 'Apprenez en vous amusant',
      available: isChild // Seuls les enfants ont accès aux jeux
    },
    {
      id: 'reglages',
      label: 'Réglages',
      icon: Settings,
      description: 'Configuration et sécurité',
      available: true
    },
    {
      id: 'aide',
      label: 'Aide & Support',
      icon: HelpCircle,
      description: 'Documentation et assistance',
      available: true
    }
  ]

  // Espace enfant: ne conserver que Expériences, Jeux, Réglages
  if (isChild) {
    const keep: NavigationTab[] = ['experiences', 'jeux', 'reglages']
    tabs = tabs.filter(t => keep.includes(t.id))
  }

  return (
    <motion.div 
      className={`fixed left-0 top-0 h-screen ${collapsed ? 'w-16' : 'w-64'} bg-white shadow-2xl z-50 flex flex-col transition-[width] duration-300`}
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* En-tête de la sidebar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg"
            animate={{ 
              scale: [1, 1.05, 1],
              rotate: [0, 2, -2, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <AnimatedIcon type="home" className="w-5 h-5 text-white" />
          </motion.div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">CubeAI</h1>
              <p className="text-m text-gray-700">Espace personnel</p>
            </div>
          )}
          {/* Bouton rétractable */}
          <button 
            onClick={toggleCollapsed} 
            className={`ml-auto p-2 rounded-md hover:bg-gray-100 text-gray-600 transition ${collapsed ? 'mx-auto' : ''}`}
            aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-180' : 'rotate-0'}`} />
          </button>
        </div>
        
        {/* Indicateur de type de compte */}
        <div className={`px-3 py-2 rounded-lg text-sm font-bold ${collapsed ? 'text-center' : 'text-center'} ${
          isPremium 
            ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
            : 'bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-md'
        }`}>
          {!collapsed && (isPremium ? '✨ Compte Premium' : '🎁 Compte Gratuit')}
        </div>
      </div>

      {/* Navigation des onglets - verticale */}
      <div className="flex-1 py-4">
        <nav className="space-y-3 px-3">
          {tabs.map((tab) => (
            tab.available && (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  w-full flex items-center gap-3 ${collapsed ? 'px-2 py-3 justify-center' : 'px-3 py-4'} rounded-lg text-sm font-semibold
                  ${activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-700'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={tab.label}
              >
                <div className={`
                  ${activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'text-black'
                  }
                `}>
                  <tab.icon size={16} />
                </div>
                {!collapsed && (
                  <span className="flex-1 text-left font-semibold">{tab.label}</span>
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
                  <motion.div
                    className={`${collapsed ? 'hidden' : ''} w-2 h-2 bg-white rounded-full`}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            )
          ))}
        </nav>
      </div>

      {/* Footer de la sidebar */}
      <div className="p-3 border-t border-gray-200">
        {!collapsed && (
          <div className="text-xs text-gray-700 text-center font-medium">
            <p>Version 1.0.0</p>
            <p>© 2025 CubeAI</p>
          </div>
        )}
      </div>
    </motion.div>
  )
} 
