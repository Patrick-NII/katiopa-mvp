'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Star, 
  Zap, 
  Brain, 
  Target, 
  Shield, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Crown,
  Sparkles,
  Heart,
  Users,
  BarChart3,
  Clock,
  Gift
} from 'lucide-react'

interface UpgradePageProps {
  childName?: string
  level?: string
  reason?: string
  triggerData?: any
  upgradeEventId?: string
}

export default function UpgradePage({ 
  childName = 'votre enfant',
  level = 'élevé',
  reason = 'performance',
  triggerData = {},
  upgradeEventId
}: UpgradePageProps) {
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<any>(null)

  // Données des plans avec prix et fonctionnalités
  const plans = [
    {
      id: 'STARTER',
      name: 'Starter',
      subtitle: 'Accompagnement personnalisé',
      price: 9.99,
      originalPrice: 14.99,
      period: 'mois',
      color: 'from-purple-500 to-blue-500',
      icon: Star,
      features: [
        '200 messages/mois avec Bubix',
        '10 analyses détaillées/semaine',
        '50 parties CubeMatch/mois',
        'Support chat + email',
        'Stockage 90 jours',
        'Rapports mensuels'
      ],
      benefits: [
        'Accompagnement personnalisé',
        'Suivi régulier des progrès',
        'Support dédié'
      ]
    },
    {
      id: 'PRO',
      name: 'Pro',
      subtitle: 'Potentiel optimisé',
      price: 19.99,
      originalPrice: 29.99,
      period: 'mois',
      color: 'from-indigo-500 to-purple-500',
      icon: Zap,
      features: [
        'Messages illimités avec Bubix',
        'Analyses professionnelles illimitées',
        'CubeMatch illimité',
        'Support prioritaire + téléphone',
        'Stockage illimité',
        'Rapports hebdomadaires détaillés',
        'IA GPT-4o-mini avancée',
        'Profils d\'apprentissage personnalisés'
      ],
      benefits: [
        'Potentiel maximisé',
        'Résultats mesurables',
        'Support prioritaire'
      ],
      popular: true
    },
    {
      id: 'PRO_PLUS',
      name: 'Pro Plus',
      subtitle: 'Excellence éducative',
      price: 39.99,
      originalPrice: 59.99,
      period: 'mois',
      color: 'from-yellow-500 to-orange-500',
      icon: Crown,
      features: [
        'Tout Pro inclus',
        'IA GPT-4o premium',
        'Analyses prédictives',
        'Support VIP + WhatsApp',
        'Sauvegarde cloud',
        'Rapports quotidiens',
        'Contenu exclusif',
        'Profils adaptatifs avancés'
      ],
      benefits: [
        'Excellence éducative',
        'Accompagnement VIP',
        'Résultats exceptionnels'
      ]
    }
  ]

  // Codes promo disponibles
  const availablePromoCodes = [
    { code: 'WELCOME10', discount: 10, description: 'Bienvenue - 10% de réduction' },
    { code: 'CHAMPION20', discount: 20, description: 'Champion - 20% de réduction' },
    { code: 'AMBASSADEUR15', discount: 15, description: 'Ambassadeur - 15% de réduction' }
  ]

  // Appliquer un code promo
  const applyPromoCode = async () => {
    if (!promoCode.trim()) return
    
    setIsApplyingPromo(true)
    
    // Simuler la vérification du code promo
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const promo = availablePromoCodes.find(p => p.code === promoCode.toUpperCase())
    
    if (promo) {
      setAppliedPromo(promo)
    } else {
      alert('Code promo invalide')
    }
    
    setIsApplyingPromo(false)
  }

  // Calculer le prix avec promo
  const getFinalPrice = (plan: any) => {
    if (appliedPromo) {
      return plan.price * (1 - appliedPromo.discount / 100)
    }
    return plan.price
  }

  // Obtenir le message personnalisé selon le niveau détecté
  const getPersonalizedMessage = () => {
    if (level === 'exceptionnel') {
      return `🌟 **${childName} atteint un niveau exceptionnel !**

Nous sommes impressionnés par les capacités extraordinaires de ${childName}. Pour continuer à nourrir ce potentiel exceptionnel, nous vous proposons nos outils les plus avancés.

✨ **Pour ${childName} :**
• Accompagnement VIP avec IA premium
• Analyses prédictives de ses performances
• Défis adaptés à son niveau élevé
• Suivi quotidien de sa progression

🔒 **Votre tranquillité :**
Nous nous engageons à protéger et développer le potentiel unique de ${childName}.`
    } else if (level === 'élevé') {
      return `🚀 **${childName} montre un potentiel remarquable !**

Les progrès de ${childName} sont impressionnants. Pour l'accompagner au mieux dans son développement, nous vous proposons nos outils d'optimisation.

📈 **Pour ${childName} :**
• Analyses approfondies de ses performances
• Recommandations personnalisées
• Suivi détaillé de sa progression
• Accès à des exercices adaptés à son niveau

💝 **Notre engagement :**
Nous nous engageons à utiliser ces outils pour le bien-être et la progression de ${childName}.`
    } else {
      return `💫 **Découvrez le potentiel de ${childName} !**

Chaque enfant a des capacités uniques à révéler. Nos outils d'accompagnement vous aident à découvrir et développer le potentiel de ${childName}.

🎯 **Pour ${childName} :**
• Accompagnement personnalisé et bienveillant
• Suivi de ses progrès et forces
• Recommandations adaptées à son rythme
• Support dédié pour votre tranquillité

🤝 **Notre mission :**
Accompagner chaque enfant dans son épanouissement et sa réussite.`
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">CubeAI</h1>
                <p className="text-sm text-gray-500">Accompagnement éducatif intelligent</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Découvrez nos offres</p>
              <p className="text-xs text-gray-400">Personnalisées pour {childName}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Analyse personnalisée pour {childName}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Développez le potentiel de{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {childName}
            </span>
          </h1>
          
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="prose prose-lg max-w-none text-gray-700">
                {getPersonalizedMessage().split('\n').map((line, index) => (
                  <p key={index} className="mb-4">
                    {line.startsWith('**') ? (
                      <strong className="text-gray-900">{line.replace(/\*\*/g, '')}</strong>
                    ) : (
                      line
                    )}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Plans Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                plan.popular ? 'border-purple-500 scale-105' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    <Crown className="w-4 h-4 inline mr-1" />
                    Recommandé
                  </div>
                </div>
              )}
              
              <div className="p-8">
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center`}>
                    <plan.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-4">{plan.subtitle}</p>
                  
                  <div className="mb-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">
                        €{getFinalPrice(plan).toFixed(2)}
                      </span>
                      <span className="text-gray-500 ml-2">/{plan.period}</span>
                    </div>
                    {appliedPromo && (
                      <div className="text-sm text-green-600 font-medium">
                        -{appliedPromo.discount}% appliqué !
                      </div>
                    )}
                    <div className="text-sm text-gray-400 line-through">
                      €{plan.originalPrice}/{plan.period}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 mb-6">
                  {plan.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-sm text-gray-600">
                      <Heart className="w-4 h-4 text-red-400 mr-2" />
                      {benefit}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {selectedPlan === plan.id ? 'Sélectionné' : 'Choisir ce plan'}
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Code Promo Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12"
        >
          <div className="text-center mb-6">
            <Gift className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Code Promo</h3>
            <p className="text-gray-600">Réduisez encore plus votre investissement éducatif</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="flex space-x-3">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Entrez votre code promo"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={applyPromoCode}
                disabled={isApplyingPromo}
                className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition-colors"
              >
                {isApplyingPromo ? '...' : 'Appliquer'}
              </button>
            </div>
            
            {appliedPromo && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <span className="text-green-700 font-medium">
                    Code {appliedPromo.code} appliqué ! -{appliedPromo.discount}% de réduction
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Investissez dans l'avenir de {childName}
            </h3>
            <p className="text-lg mb-6 opacity-90">
              Rejoignez des milliers de parents qui font confiance à CubeAI pour accompagner leurs enfants
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-white text-purple-600 rounded-xl font-medium hover:bg-gray-100 transition-colors">
                Commencer l'essai gratuit
              </button>
              <button className="px-8 py-3 border-2 border-white text-white rounded-xl font-medium hover:bg-white hover:text-purple-600 transition-colors">
                Voir les témoignages
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Garantie satisfait ou remboursé 30 jours
            </p>
            <p className="text-sm">
              Votre confiance est précieuse. Nous nous engageons à protéger la progression de {childName}.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
