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
  Box,
  Code,
  Gamepad2,
  Heart,
  Lightbulb,
  Globe,
  Sparkles
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
      available: !isChild // Seuls les parents ont accès
    },
    {
      id: 'statistiques',
      label: 'Statistiques',
      icon: BarChart3,
      description: 'Graphiques et analyses détaillées',
      available: !isChild && !isFree // Parents + comptes Pro et supérieurs
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

  // Espace enfant: Expériences + tous les cubes + communauté + réglages + aide
  if (isChild) {
    const keep: NavigationTab[] = ['experiences', 'mathcube', 'codecube', 'playcube', 'sciencecube', 'dreamcube', 'comcube', 'reglages', 'aide']
    tabs = tabs.filter(t => keep.includes(t.id))
  }

  return (
    <motion.div 
      className={"fixed left-0 top-0 h-screen bg-white shadow-2xl z-50 flex flex-col overflow-hidden"}
      initial={{ width: collapsed ? 74 : 256 }}
      animate={{ width: collapsed ? 75 : 256 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* En-tête de la sidebar — branding unifié */}
      <div className="relative h-16 px-3 pr-10 border-b border-gray-200 flex items-center">
        <div className="flex items-center gap-3 w-full">
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
            className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-md hover:bg-gray-100 text-gray-600"
            aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Déplier' : 'Replier'}
          >
            <ChevronRight className={`w-4 h-4 ${collapsed ? 'rotate-0' : '-rotate-180'}`} />
          </button>
        </div>

        {/* Indicateur de type de compte (désactivé ici pour stabilité de layout) */}
      </div>

      {/* Navigation des onglets - verticale */}
      <div className="flex-1 py-4">
        <nav className="space-y-3 px-3">
          {tabs.map((tab) => (
            tab.available && (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  group relative w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-semibold
                  ${activeTab === tab.id
                    ? `bg-gradient-to-r ${colors.gradient} text-white shadow-lg`
                    : 'text-gray-700'
                  }
                `}
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
                  <div className={`${collapsed ? 'hidden' : ''} w-2 h-2 bg-white rounded-full`} />
                )}
              </button>
            )
          ))}
        </nav>
      </div>

      {/* Actions rapides: Accueil + Déconnexion */}
      <div className="px-3 pb-3 space-y-2">
        <button
          onClick={() => router.push('/')}
          className={`
            group relative w-full flex items-center gap-3 px-3 py-3
            rounded-lg text-sm font-semibold bg-white-100 hover:bg-gray-200 text-gray-300 transition
          `}
          title="Accueil"
          aria-label=""
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
        </button>
        <button
          onClick={async () => { try { await (await import('@/lib/api')).authAPI.logout(); router.push('/login'); } catch (e) {} }}
          className={`
            group relative w-full flex items-center gap-3 px-3 py-3
            rounded-lg text-sm font-semibold bg-white-50 hover:bg-red-100 text-red-300 transition
          `}
          title="Déconnexion"
          aria-label=""
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
        </button>
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
