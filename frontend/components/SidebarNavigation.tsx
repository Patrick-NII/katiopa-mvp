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

interface SidebarNavigationProps {
  activeTab: NavigationTab
  onTabChange: (tab: NavigationTab) => void
  userSubscriptionType: string
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
  userSubscriptionType 
}: SidebarNavigationProps) {
  const isPremium = userSubscriptionType === 'premium' || userSubscriptionType === 'enterprise'

  const tabs: TabItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Vue d\'ensemble et statistiques',
      available: true
    },
    {
      id: 'statistiques',
      label: 'Statistiques',
      icon: BarChart3,
      description: 'Graphiques et analyses détaillées',
      available: true
    },
    {
      id: 'exercices',
      label: 'Exercices',
      icon: BookOpen,
      description: 'Bibliothèque et progression',
      available: true
    },
    {
      id: 'informations',
      label: 'Profil & Préférences',
      icon: User,
      description: 'Informations personnelles et objectifs',
      available: true
    },
    {
      id: 'abonnements',
      label: 'Abonnements',
      icon: Crown,
      description: 'Plans et fonctionnalités',
      available: true,
      badge: isPremium ? 'Premium' : 'Gratuit'
    },
    {
      id: 'facturation',
      label: 'Facturation',
      icon: CreditCard,
      description: 'Historique et paiements',
      available: isPremium
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
      className="w-64 bg-white border-r border-gray-200 h-screen overflow-y-auto"
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* En-tête de la sidebar */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-4">
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
        <div className={`px-3 py-2 rounded-lg text-center text-sm font-medium ${
          isPremium 
            ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 border border-purple-200'
            : 'bg-gray-100 text-gray-700 border border-gray-200'
        }`}>
          {isPremium ? '✨ Compte Premium' : '🎁 Compte Gratuit'}
        </div>
      </div>

      {/* Navigation des onglets */}
      <nav className="p-4 space-y-2">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            disabled={!tab.available}
            className={`w-full group relative ${
              !tab.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            whileHover={tab.available ? { scale: 1.02 } : {}}
            whileTap={tab.available ? { scale: 0.98 } : {}}
          >
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${activeTab === tab.id
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }
            `}>
              <motion.div
                animate={activeTab === tab.id ? { 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -5, 0]
                } : {}}
                transition={{ duration: 0.5 }}
              >
                <tab.icon size={20} />
              </motion.div>
              
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tab.label}</span>
                  {tab.badge && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isPremium 
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                </div>
                <p className={`text-xs ${
                  activeTab === tab.id ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {tab.description}
                </p>
              </div>
              
              {activeTab === tab.id && (
                <motion.div
                  className="absolute right-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <ChevronRight size={16} />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </nav>

      {/* Section d'aide rapide */}
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
            <Target size={16} />
            Conseil du jour
          </h3>
          <p className="text-xs text-green-800">
            Pratiquez régulièrement pour maintenir votre progression. L'IA Coach vous guide !
          </p>
        </div>
      </div>

      {/* Indicateur de progression */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progression globale</span>
            <span className="font-medium text-gray-900">75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: '75%' }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <TrendingUp size={14} />
            <span>+12% ce mois</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 