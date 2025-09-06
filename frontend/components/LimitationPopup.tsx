import React, { useState, useEffect } from 'react'
import { X, Star, Shield, TrendingUp, Heart, Sparkles, Crown, Zap } from 'lucide-react'

interface LimitationPopupProps {
  isVisible: boolean
  message: string
  isCommercial: boolean
  showUpgrade: boolean
  childName?: string
  userType?: 'PARENT' | 'CHILD'
  subscriptionType?: string
  upgradeEvent?: any
  onClose: () => void
  onUpgrade: () => void
  onRemindLater: () => void
  onDismiss: () => void
}

export default function LimitationPopup({
  isVisible,
  message,
  isCommercial,
  showUpgrade,
  childName = 'votre enfant',
  userType = 'PARENT',
  subscriptionType = 'FREE',
  upgradeEvent,
  onClose,
  onUpgrade,
  onRemindLater,
  onDismiss
}: LimitationPopupProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (isVisible) {
      setIsAnimating(true)
    }
  }, [isVisible])

  if (!isVisible) return null

  const handleClose = () => {
    setIsAnimating(false)
    setTimeout(() => onClose(), 300)
  }

  // Messages différenciés selon la stratégie
  const getPersonalizedMessage = () => {
    if (userType === 'CHILD') {
      // Messages non-commerciaux pour les enfants
      return {
        title: `🌟 Ton niveau augmente !`,
        content: `Je vais faire un point avec ton papa ou ta maman pour améliorer ton niveau et continuer de grandir...`,
        icon: Sparkles,
        color: 'from-yellow-400 to-orange-400',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800'
      }
    } else {
      // Messages tactiques pour les parents selon le niveau détecté
      const performanceLevel = upgradeEvent?.triggerData?.performanceLevel || 'elevated'
      
      if (performanceLevel === 'exceptional') {
        return {
          title: `👑 ${childName} atteint un niveau exceptionnel !`,
          content: `Nous sommes impressionnés par les capacités extraordinaires de ${childName}. Pour continuer à nourrir ce potentiel exceptionnel, nous vous proposons nos outils les plus avancés.`,
          icon: Crown,
          color: 'from-yellow-500 to-orange-500',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
          benefits: [
            'Accompagnement VIP avec IA premium',
            'Analyses prédictives de ses performances',
            'Défis adaptés à son niveau élevé',
            'Suivi quotidien de sa progression'
          ]
        }
      } else if (performanceLevel === 'elevated') {
        return {
          title: `🚀 ${childName} montre un potentiel remarquable !`,
          content: `Les progrès de ${childName} sont impressionnants. Pour l'accompagner au mieux dans son développement, nous vous proposons nos outils d'optimisation.`,
          icon: Zap,
          color: 'from-blue-500 to-purple-500',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          benefits: [
            'Analyses approfondies de ses performances',
            'Recommandations personnalisées',
            'Suivi détaillé de sa progression',
            'Accès à des exercices adaptés à son niveau'
          ]
        }
      } else {
        return {
          title: `💫 Découvrez le potentiel de ${childName} !`,
          content: `Chaque enfant a des capacités uniques à révéler. Nos outils d'accompagnement vous aident à découvrir et développer le potentiel de ${childName}.`,
          icon: Heart,
          color: 'from-green-500 to-teal-500',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
          benefits: [
            'Accompagnement personnalisé et bienveillant',
            'Suivi de ses progrès et forces',
            'Recommandations adaptées à son rythme',
            'Support dédié pour votre tranquillité'
          ]
        }
      }
    }
  }

  const personalizedMessage = getPersonalizedMessage()

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-lg mx-4 p-6 transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Header avec icône personnalisée */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 bg-gradient-to-r ${personalizedMessage.color} rounded-full`}>
              <personalizedMessage.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{personalizedMessage.title}</h3>
              <p className="text-sm text-gray-500">CubeAI - Accompagnement intelligent</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu principal */}
        <div className={`${personalizedMessage.bgColor} rounded-xl p-4 mb-6`}>
          <p className={`${personalizedMessage.textColor} text-sm leading-relaxed mb-3`}>
            {personalizedMessage.content}
          </p>
          
          {personalizedMessage.benefits && (
            <div className="space-y-2">
              <p className={`${personalizedMessage.textColor} text-sm font-medium`}>
                ✨ Bénéfices pour {childName} :
              </p>
              <ul className="space-y-1">
                {personalizedMessage.benefits.map((benefit, index) => (
                  <li key={index} className={`${personalizedMessage.textColor} text-xs flex items-start`}>
                    <span className="mr-2">•</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Message de tranquillité pour les parents */}
        {userType === 'PARENT' && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <div className="flex items-start">
              <Shield className="w-4 h-4 text-gray-600 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-gray-600">
                <strong>Votre tranquillité :</strong> Nous nous engageons à protéger la progression de {childName} et à respecter son rythme d'apprentissage naturel.
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        {showUpgrade && userType === 'PARENT' ? (
          <div className="flex flex-col space-y-3">
            <button
              onClick={onUpgrade}
              className={`w-full py-3 px-4 bg-gradient-to-r ${personalizedMessage.color} text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center`}
            >
              <Star className="w-4 h-4 mr-2" />
              Découvrir les offres
            </button>
            <div className="flex space-x-2">
              <button
                onClick={onRemindLater}
                className="flex-1 py-2 px-3 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Voir plus tard
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 py-2 px-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Non, merci
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              D'accord
            </button>
          </div>
        )}
      </div>
    </div>
  )
}