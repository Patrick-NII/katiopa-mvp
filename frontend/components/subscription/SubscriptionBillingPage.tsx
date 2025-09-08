'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  Download, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Star,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Plus,
  Minus,
  ArrowRight
} from 'lucide-react'

interface SubscriptionBillingPageProps {
  user: any
}

interface Plan {
  id: string
  name: string
  price: number
  originalPrice?: number
  features: string[]
  maxMembers: number
  popular?: boolean
  color: string
}

interface PaymentHistory {
  id: string
  date: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  plan: string
  method: string
}

export default function SubscriptionBillingPage({ user }: SubscriptionBillingPageProps) {
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans')
  const [currentPlan, setCurrentPlan] = useState<string>('maitre')
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(false)

  const plans: Plan[] = [
    {
      id: 'decouverte',
      name: 'Découverte',
      price: 0,
      features: [
        '1 enfant',
        'Accès aux modules de base',
        'Support par email',
        'Rapports mensuels'
      ],
      maxMembers: 1,
      color: 'from-gray-500 to-gray-600'
    },
    {
      id: 'explorateur',
      name: 'Explorateur',
      price: 19.99,
      originalPrice: 29.99,
      features: [
        '3 enfants',
        'Tous les modules d\'apprentissage',
        'Analytics avancées',
        'Support prioritaire',
        'Rapports hebdomadaires'
      ],
      maxMembers: 3,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'maitre',
      name: 'Maître',
      price: 39.99,
      originalPrice: 49.99,
      features: [
        '5 enfants',
        'Tous les modules + IA avancée',
        'Analytics premium',
        'Support 24/7',
        'Rapports quotidiens',
        'Personnalisation avancée'
      ],
      maxMembers: 5,
      popular: true,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'entreprise',
      name: 'Entreprise',
      price: 99.99,
      features: [
        'Enfants illimités',
        'Toutes les fonctionnalités',
        'API personnalisée',
        'Support dédié',
        'Intégrations avancées',
        'Formation personnalisée'
      ],
      maxMembers: -1,
      color: 'from-orange-500 to-orange-600'
    }
  ]

  // Données simulées pour l'historique des paiements
  useEffect(() => {
    setPaymentHistory([
      {
        id: '1',
        date: '2024-01-15',
        amount: 39.99,
        status: 'paid',
        plan: 'Maître',
        method: 'Carte bancaire'
      },
      {
        id: '2',
        date: '2023-12-15',
        amount: 39.99,
        status: 'paid',
        plan: 'Maître',
        method: 'Carte bancaire'
      },
      {
        id: '3',
        date: '2023-11-15',
        amount: 29.99,
        status: 'paid',
        plan: 'Explorateur',
        method: 'PayPal'
      }
    ])
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé'
      case 'pending': return 'En attente'
      case 'failed': return 'Échec'
      default: return 'Inconnu'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Abonnements & Facturation
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gérez votre abonnement et consultez votre historique de paiements
        </p>
      </div>

      {/* Onglets */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'plans'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Crown className="w-4 h-4" />
          Plans & Abonnements
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'billing'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Facturation
        </button>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'plans' ? (
          <div className="space-y-6">
            {/* Plan actuel */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Plan Actuel
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Votre abonnement actuel
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xl font-bold">Maître</h4>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    <span className="text-sm font-medium">Populaire</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-3xl font-bold">{formatPrice(39.99)}</span>
                  <span className="text-sm opacity-80">/mois</span>
                  <span className="text-sm line-through opacity-60">{formatPrice(49.99)}</span>
                </div>
                <p className="text-sm opacity-90 mb-4">
                  Prochaine facturation: 15 février 2024
                </p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                    Modifier le plan
                  </button>
                  <button className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
                    Annuler l'abonnement
                  </button>
                </div>
              </div>
            </div>

            {/* Plans disponibles */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Plans Disponibles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-xl border border-white/20 dark:border-gray-700/50 p-4 relative ${
                      plan.popular ? 'ring-2 ring-purple-500' : ''
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <span className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                          Populaire
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                        <Crown className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {plan.name}
                      </h4>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {formatPrice(plan.price)}
                        </span>
                        {plan.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(plan.originalPrice)}
                          </span>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">/mois</span>
                      </div>
                    </div>

                    <ul className="space-y-2 mb-4">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        plan.id === currentPlan
                          ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 cursor-not-allowed'
                          : `bg-gradient-to-r ${plan.color} hover:opacity-90 text-white`
                      }`}
                      disabled={plan.id === currentPlan}
                    >
                      {plan.id === currentPlan ? 'Plan actuel' : 'Choisir ce plan'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Résumé facturation */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total payé</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(109.97)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Paiements</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {paymentHistory.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Prochaine facture</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {formatPrice(39.99)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Historique des paiements */}
            <div className="backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 rounded-2xl border border-white/20 dark:border-gray-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Historique des Paiements
                </h3>
                <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/20 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Exporter
                </button>
              </div>

              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 bg-white/20 dark:bg-gray-800/20 rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {payment.plan}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(payment.date).toLocaleDateString('fr-FR')} • {payment.method}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold text-gray-900 dark:text-white">
                        {formatPrice(payment.amount)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
