'use client'

import { useState } from 'react'
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
  Box
} from 'lucide-react'
import AnimatedIcon from './AnimatedIcons'
import { CubeAILogo } from '@/components/MulticolorText'

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

  // Déterminer les couleurs selon le type d'abonnement (basé sur les cartes)
  const getSubscriptionColors = () => {
    if (isProPlus || isEnterprise) {
      return {
        gradient: 'from-orange-500 to-violet-600',
        hoverGradient: 'from-orange-600 to-violet-700',
        buttonBg: 'bg-orange-500',
        buttonHover: 'hover:bg-orange-600',
        lightBg: 'bg-orange-50',
        lightText: 'text-orange-700',
        lightBgHover: 'hover:bg-orange-100',
        iconBg: 'bg-orange-100',
        primary: 'orange',
        cubeGradient: 'from-orange-500 to-violet-600'
      }
    } else if (isPro) {
      return {
        gradient: 'from-violet-600 to-pink-500',
        hoverGradient: 'from-violet-700 to-pink-600',
        buttonBg: 'bg-violet-600',
        buttonHover: 'hover:bg-violet-700',
        lightBg: 'bg-violet-50',
        lightText: 'text-violet-700',
        lightBgHover: 'hover:bg-violet-100',
        iconBg: 'bg-violet-100',
        primary: 'violet',
        cubeGradient: 'from-violet-600 to-pink-500'
      }
    } else {
      return {
        gradient: 'from-blue-600 to-purple-600',
        hoverGradient: 'from-blue-700 to-purple-700',
        buttonBg: 'bg-blue-600',
        buttonHover: 'hover:bg-blue-700',
        lightBg: 'bg-blue-50',
        lightText: 'text-blue-700',
        lightBgHover: 'hover:bg-blue-100',
        iconBg: 'bg-blue-100',
        primary: 'blue',
        cubeGradient: 'from-blue-500 to-purple-600'
      }
    }
  }

  const colors = getSubscriptionColors()
  
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
      icon: Box,
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
      {/* En-tête de la sidebar — branding unifié */}
      <div className="relative p-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${colors.gradient} rounded-lg flex items-center justify-center shadow-lg flex-shrink-0`}>
            <span className="font-title text-white text-2xl leading-none">C</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <CubeAILogo className="text-4xl" />
            </div>
          )}
          {/* Bouton rétractable aligné au logo */}
          <button 
            onClick={toggleCollapsed} 
            className="ml-1 p-2 rounded-md hover:bg-gray-100 text-gray-600 transition"
            aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-0' : '-rotate-180'}`} />
          </button>
        </div>

        {/* Indicateur de type de compte */}
        {!collapsed && (
          <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-bold text-center bg-gradient-to-r ${colors.gradient} text-white shadow-md`}>
            {isFree ? '🎁 Gratuit' : isPro ? '✨ Pro' : isProPlus ? '✨ Pro Plus' : isEnterprise ? '✨ Entreprise' : '✨ Premium'}
          </div>
        )}
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
                  group relative w-full flex items-center gap-2 ${collapsed ? 'px-2 py-3 justify-center' : 'px-3 py-4'} rounded-lg text-sm font-semibold
                  ${activeTab === tab.id
                    ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg transform scale-105`
                    : 'text-gray-700'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                title={tab.label}
                aria-label={tab.label}
              >
                <div className={`${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-10 text-gray-800'} w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0`}>
                                  {tab.icon === Cube3DIcon ? (
                  <Cube3DIcon size={20} colors={colors} />
                ) : (
                    <tab.icon size={20} />
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

      {/* Actions rapides: Accueil + Déconnexion */}
      <div className="px-3 pb-3 space-y-2">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push('/')}
          className={`
            group relative w-full flex items-center gap-3 ${collapsed ? 'px-2 py-3 justify-center' : 'px-3 py-3'}
            rounded-lg text-sm font-semibold bg-white-100 hover:bg-gray-200 text-gray-300 transition
          `}
          title="Accueil"
          aria-label="Accueil"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-gray-700 shadow-sm">
            <Home size={20} />
          </div>
          {!collapsed && <span>Accueil</span>}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-150 delay-150">
              <div className="relative px-2 py-1 rounded-md bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 shadow-md"></div>
                Accueil
              </div>
            </div>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={async () => { try { await (await import('@/lib/api')).authAPI.logout(); router.push('/login'); } catch (e) {} }}
          className={`
            group relative w-full flex items-center gap-3 ${collapsed ? 'px-2 py-3 justify-center' : 'px-3 py-3'}
            rounded-lg text-sm font-semibold bg-white-50 hover:bg-red-100 text-red-300 transition
          `}
          title="Déconnexion"
          aria-label="Déconnexion"
        >
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white text-red-700 shadow-sm">
            <LogOut size={20} />
          </div>
          {!collapsed && <span>Déconnexion</span>}
          {collapsed && (
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50 pointer-events-none opacity-0 translate-x-0 group-hover:opacity-100 group-hover:translate-x-1 transition duration-150 delay-150">
              <div className="relative px-2 py-1 rounded-md bg-gray-900 text-white text-xs shadow-lg whitespace-nowrap">
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 shadow-md"></div>
                Déconnexion
              </div>
            </div>
          )}
        </motion.button>
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
