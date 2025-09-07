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

export default function UpgradePage() {
  // Props par défaut pour le développement
  const childName = 'votre enfant';
  const level = 'élevé';
  const reason = 'performance';
  const triggerData = {};
  const upgradeEventId = null;
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [isApplyingPromo, setIsApplyingPromo] = useState(false)
  const [appliedPromo, setAppliedPromo] = useState<any>(null)
  const [paymentStep, setPaymentStep] = useState<'selection' | 'verification' | 'payment' | 'confirmation'>('selection')
  const [paymentData, setPaymentData] = useState<any>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Données des plans avec prix et fonctionnalités
  const plans = [
    {
      id: 'FREE',
      name: 'Gratuit',
      subtitle: 'Le premier pas vers l\'aventure',
      price: 0,
      originalPrice: 0,
      period: 'mois',
      color: 'from-gray-400 to-gray-500',
      icon: Star,
      features: [
        '1 parent + 1 enfant',
        'Bubix (version simplifiée)',
        'MathCube pour découvrir les bases',
        'Expériences (lite) : mini-dashboard',
        '1 analyse simple par semaine',
        'Radar de connaissance : petit cerveau',
        'Support : Email uniquement',
        'Stockage : 30 jours'
      ],
      limitations: [
        '❌ Pas d\'accès aux analyses avancées',
        '❌ Pas d\'export de données',
        '❌ Support limité',
        '❌ Pas de rapports détaillés'
      ],
      benefits: [
        'Découverte gratuite',
        'Premiers pas avec l\'IA',
        'Test des fonctionnalités de base'
      ]
    },
    {
      id: 'DECOUVERTE',
      name: 'Découverte',
      subtitle: 'Le premier pas vers l\'aventure',
      price: 4.99,
      originalPrice: 6.99,
      period: 'mois',
      color: 'from-green-500 to-emerald-500',
      icon: Sparkles,
      features: [
        '1 parent + 1 enfant',
        'Bubix (version simplifiée) pour poser des questions',
        'MathCube pour découvrir les bases en jouant',
        'Expériences (lite) : mini-dashboard',
        '1 analyse simple par semaine',
        'Radar de connaissance : petit cerveau qui commence',
        'Support : Email uniquement',
        'IA : GPT-3.5-turbo limité'
      ],
      limitations: [
        '❌ Analyses limitées',
        '❌ Pas d\'export',
        '❌ Support email uniquement',
        '❌ Pas de certificats'
      ],
      benefits: [
        'Idéal pour tester CubeAI',
        'Premier goût de l\'apprentissage ludique',
        'Découverte progressive'
      ]
    },
    {
      id: 'EXPLORATEUR',
      name: 'Explorateur',
      subtitle: 'L\'univers complet CubeAI',
      price: 29.99,
      originalPrice: 39.99,
      period: 'mois',
      color: 'from-blue-500 to-purple-500',
      icon: Zap,
      features: [
        '1 parent + 2 enfants',
        'Bubix (avancé, personnalisable : professeur, coach ou ami)',
        'Tous les onglets enfants : MathCube, CodeCube, PlayCube, ScienceCube, DreamCube, Expériences',
        'Dashboard parental complet + ComCube',
        'Analyses hebdomadaires + export PDF/Excel',
        'Radar de connaissance complet (cerveau qui relie toutes les notions)',
        'Certificats simples pour valoriser les progrès',
        'Support : Email, chat et téléphone',
        'IA : GPT-4o-mini custom (analyses)'
      ],
      limitations: [
        '❌ Pas d\'analyses prédictives',
        '❌ Pas de contenu exclusif',
        '❌ Support standard'
      ],
      benefits: [
        'Le plan parfait pour accompagner la scolarité',
        'Transformer chaque devoir en aventure motivante',
        'Accès complet à tous les univers'
      ],
      popular: true
    },
    {
      id: 'MAITRE',
      name: 'Maître',
      subtitle: 'L\'excellence éducative pour les familles ambitieuses',
      price: 59.99,
      originalPrice: 79.99,
      period: 'mois',
      color: 'from-purple-600 to-pink-600',
      icon: Crown,
      features: [
        '1 parent + 4 enfants',
        'Bubix premium (le plus avancé) : prédictions, adaptation automatique',
        'Analyses quotidiennes et prédictives : coach virtuel',
        'Radar de connaissance évolutif dense : cerveau digital qui grandit',
        'Contenus exclusifs : exercices premium, défis communautaires',
        'Diplômes officiels et badges de progression',
        'Dashboard parental enrichi : comparatifs évolutifs',
        'Sauvegarde cloud automatique + historique illimité',
        'Support VIP prioritaire (WhatsApp & téléphone dédié)',
        'IA : GPT-4o premium adaptatif'
      ],
      limitations: [
        '✅ Aucune limitation',
        '✅ Accès complet à toutes les fonctionnalités'
      ],
      benefits: [
        'Pour les parents qui veulent offrir les meilleures chances de réussite',
        'Suivi de chaque étape de l\'évolution',
        'Excellence éducative garantie'
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

  // Passer à l'étape de vérification
  const proceedToVerification = () => {
    if (!selectedPlan) return
    
    const plan = plans.find(p => p.id === selectedPlan)
    if (!plan) return
    
    setPaymentData({
      plan,
      finalPrice: getFinalPrice(plan),
      promo: appliedPromo
    })
    setPaymentStep('verification')
  }

  // Traiter le paiement
  const processPayment = async (paymentInfo: any) => {
    setIsProcessingPayment(true)
    
    try {
      // Simuler le traitement du paiement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Appel API pour mettre à jour l'abonnement
      const response = await fetch('/api/upgrade/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: paymentData.plan.id,
          paymentInfo,
          promoCode: appliedPromo?.code,
          upgradeEventId
        })
      })
      
      if (response.ok) {
        setPaymentStep('confirmation')
        // Envoyer email de confirmation
        await fetch('/api/upgrade/send-confirmation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            planId: paymentData.plan.id,
            email: paymentInfo.email,
            childName
          })
        })
      } else {
        throw new Error('Erreur lors du paiement')
      }
    } catch (error) {
      console.error('Erreur de paiement:', error)
      alert('Erreur lors du traitement du paiement. Veuillez réessayer.')
    } finally {
      setIsProcessingPayment(false)
    }
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
    if (level === 'élevé') {
      return `🌟 **${childName} atteint un niveau exceptionnel !**

Nous sommes impressionnés par les capacités extraordinaires de ${childName}. Pour continuer à nourrir ce potentiel exceptionnel, nous vous proposons nos outils les plus avancés.

🔒 **Votre tranquillité :**
Nous nous engageons à protéger et développer le potentiel unique de ${childName}.`
    } else if (level === 'élevé') {
      return `🚀 **${childName} montre un potentiel remarquable !**

Les progrès de ${childName} sont impressionnants. Pour l'accompagner au mieux dans son développement, nous vous proposons nos outils d'optimisation.

🔒 **Votre tranquillité :**
Nous nous engageons à utiliser ces outils pour le bien-être et la progression de ${childName}.`
    } else {
      return `💫 **Découvrez le potentiel de ${childName} !**

Chaque enfant a des capacités uniques à révéler. Nos outils d'accompagnement vous aident à découvrir et développer le potentiel de ${childName}.

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

        {/* Section Gains Observés */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12"
        >
          <div className="text-center mb-8">
            <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-3" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Gains Observés</h3>
            <p className="text-gray-600">Résultats mesurables de nos utilisateurs</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-green-50 rounded-xl">
              <div className="text-3xl font-bold text-green-600 mb-2">+85%</div>
              <div className="text-sm text-green-700 font-medium">Amélioration des scores</div>
              <div className="text-xs text-green-600 mt-1">Moyenne sur 3 mois</div>
            </div>
            <div className="text-center p-6 bg-blue-50 rounded-xl">
              <div className="text-3xl font-bold text-blue-600 mb-2">+60%</div>
              <div className="text-sm text-blue-700 font-medium">Temps d'attention</div>
              <div className="text-xs text-blue-600 mt-1">Sessions plus longues</div>
            </div>
            <div className="text-center p-6 bg-purple-50 rounded-xl">
              <div className="text-3xl font-bold text-purple-600 mb-2">+90%</div>
              <div className="text-sm text-purple-700 font-medium">Satisfaction parents</div>
              <div className="text-xs text-purple-600 mt-1">Recommandation</div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <strong>Étude réalisée sur 1000+ familles</strong> utilisant CubeAI depuis plus de 6 mois
            </p>
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

                <div className="space-y-4 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">✅ Fonctionnalités incluses :</h4>
                    <div className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-start">
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.limitations && plan.limitations.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">⚠️ Limitations :</h4>
                      <div className="space-y-2">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <div key={limitationIndex} className="flex items-start">
                            <span className="text-xs text-gray-600">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">💎 Avantages :</h4>
                  {plan.benefits.map((benefit, benefitIndex) => (
                    <div key={benefitIndex} className="flex items-center text-sm text-gray-600">
                      <Heart className="w-4 h-4 text-red-400 mr-2" />
                      {benefit}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (plan.id === 'FREE') {
                      // Pour le plan gratuit, rediriger vers le dashboard
                      window.location.href = '/dashboard'
                    } else {
                      setSelectedPlan(plan.id)
                      proceedToVerification()
                    }
                  }}
                  className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-300 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                      : plan.id === 'FREE'
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {plan.id === 'FREE' ? 'Continuer gratuitement' : 'Choisir ce plan'}
                  <ArrowRight className="w-4 h-4 inline ml-2" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Étapes de paiement */}
        {paymentStep === 'verification' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12"
          >
            <div className="text-center mb-8">
              <Shield className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Vérification des informations</h3>
              <p className="text-gray-600">Confirmez votre sélection avant le paiement</p>
            </div>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Récapitulatif de votre commande</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Plan sélectionné :</span>
                    <span className="font-semibold">{paymentData.plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Prix mensuel :</span>
                    <span className="font-semibold">€{paymentData.plan.price}</span>
                  </div>
                  {paymentData.promo && (
                    <div className="flex justify-between text-green-600">
                      <span>Code promo {paymentData.promo.code} :</span>
                      <span>-{paymentData.promo.discount}%</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between text-lg font-bold">
                    <span>Total mensuel :</span>
                    <span>€{paymentData.finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setPaymentStep('selection')}
                  className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => setPaymentStep('payment')}
                  className="flex-1 py-3 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Continuer vers le paiement
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {paymentStep === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12"
          >
            <div className="text-center mb-8">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Informations de paiement</h3>
              <p className="text-gray-600">Paiement sécurisé pour {childName}</p>
            </div>
            
            <div className="max-w-md mx-auto">
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.target as HTMLFormElement)
                const paymentInfo = {
                  email: formData.get('email'),
                  cardNumber: formData.get('cardNumber'),
                  expiryDate: formData.get('expiryDate'),
                  cvv: formData.get('cvv'),
                  name: formData.get('name')
                }
                processPayment(paymentInfo)
              }}>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom sur la carte</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de carte</label>
                    <input
                      type="text"
                      name="cardNumber"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="1234 5678 9012 3456"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date d'expiration</label>
                      <input
                        type="text"
                        name="expiryDate"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="MM/AA"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setPaymentStep('verification')}
                    className="flex-1 py-3 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="flex-1 py-3 px-6 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {isProcessingPayment ? 'Traitement...' : `Payer €${paymentData.finalPrice.toFixed(2)}`}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {paymentStep === 'confirmation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-12"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Paiement confirmé !</h3>
              <p className="text-gray-600 mb-6">
                Félicitations ! Votre abonnement {paymentData.plan.name} est maintenant actif pour {childName}.
              </p>
              
              <div className="bg-green-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold text-green-800 mb-3">Prochaines étapes :</h4>
                <ul className="text-left text-green-700 space-y-2">
                  <li>✅ Email de confirmation envoyé</li>
                  <li>✅ Abonnement activé dans votre compte</li>
                  <li>✅ Accès immédiat à toutes les fonctionnalités</li>
                  <li>✅ Prochain prélèvement : {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')}</li>
                </ul>
              </div>
              
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Accéder à votre dashboard
              </button>
            </div>
          </motion.div>
        )}

        {/* Code Promo Section - seulement si pas en cours de paiement */}
        {paymentStep === 'selection' && (
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
        )}

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
