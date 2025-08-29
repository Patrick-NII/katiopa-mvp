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
  TrendingUp
} from 'lucide-react'

export type NavigationTab = 
  | 'dashboard'
  | 'reglages'
  | 'facturation'
  | 'abonnements'
  | 'informations'
  | 'statistiques'
  | 'exercices'
  | 'aide'
  | 'communautes'
  | 'photo'
  | 'jeux'

interface SidebarNavigationProps {
  activeTab: NavigationTab
  onTabChange: (tab: NavigationTab) => void
  userSubscriptionType: string
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
}

interface TabItem {
  id: NavigationTab
  label: string
  icon: any
  description: string
  available: boolean
  badge?: string
}

export default function SidebarNavigation({ 
  activeTab, 
  onTabChange, 
  userSubscriptionType,
  userType 
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

  const tabs: TabItem[] = [
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
      id: 'exercices',
      label: 'Exercices',
      icon: BookOpen,
      description: 'Bibliothèque et progression',
      available: true // Tous les utilisateurs ont accès aux exercices
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
      id: 'facturation',
      label: 'Facturation',
      icon: CreditCard,
      description: 'Historique et paiements',
      available: !isChild && !isFree // Parents + comptes Pro et supérieurs
    },
    // Nouveaux onglets pour les enfants
    {
      id: 'communautes',
      label: 'Communautés',
      icon: Home,
      description: 'Échangez avec d\'autres apprenants',
      available: isChild // Seuls les enfants ont accès aux communautés
    },
    {
      id: 'photo',
      label: 'Changer sa photo',
      icon: User,
      description: 'Personnalisez votre profil',
      available: isChild // Seuls les enfants peuvent changer leur photo
    },
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

  return (
    <motion.div 
      className="w-full bg-white border-b border-gray-200 shadow-sm"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* En-tête de la navigation */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Home size={20} className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Katiopa</h1>
              <p className="text-sm text-gray-600">Apprentissage intelligent</p>
            </div>
          </div>
          
          {/* Indicateur de type de compte */}
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
            isPremium 
              ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200'
              : 'bg-gray-100 text-gray-700 border border-gray-200'
          }`}>
            {isPremium ? '✨ Compte Premium' : '🎁 Compte Gratuit'}
          </div>
        </div>
      </div>

      {/* Navigation des onglets - horizontale */}
      <div className="max-w-7xl mx-auto px-6">
        <nav className="flex space-x-1 pb-2 overflow-x-auto">
          {tabs.map((tab) => (
            tab.available && (
              <motion.button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-700'
                    }
                  `}>
                    {tab.badge}
                  </span>
                )}
              </motion.button>
            )
          ))}
        </nav>
      </div>
    </motion.div>
  )
} 