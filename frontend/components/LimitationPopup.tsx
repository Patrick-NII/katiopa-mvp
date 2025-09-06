import React, { useState, useEffect } from 'react'
import { X, Star, Shield, TrendingUp, Heart } from 'lucide-react'

interface LimitationPopupProps {
  isVisible: boolean
  message: string
  isCommercial: boolean
  showUpgrade: boolean
  childName?: string
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
  childName,
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

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md mx-4 p-6 transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Header avec icône */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isCommercial ? (
              <div className="p-2 bg-blue-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            ) : (
              <div className="p-2 bg-green-100 rounded-full">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              {isCommercial ? 'Progression de votre enfant' : 'Message de Bubix'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Message principal */}
        <div className="mb-6">
          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line">
            {message}
          </div>
        </div>

        {/* Actions */}
        {showUpgrade && isCommercial && (
          <div className="space-y-3">
            {/* Bouton principal - Upgrade */}
            <button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Star className="w-5 h-5" />
              Découvrir les fonctionnalités avancées
            </button>

            {/* Boutons secondaires */}
            <div className="flex gap-2">
              <button
                onClick={onRemindLater}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Voir plus tard
              </button>
              <button
                onClick={onDismiss}
                className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Non, merci
              </button>
            </div>
          </div>
        )}

        {/* Message pour enfants - pas d'actions commerciales */}
        {!isCommercial && (
          <div className="text-center">
            <button
              onClick={handleClose}
              className="bg-green-100 text-green-700 py-2 px-6 rounded-lg font-medium hover:bg-green-200 transition-colors"
            >
              Merci Bubix ! 🌟
            </button>
          </div>
        )}

        {/* Footer avec rassurance */}
        {isCommercial && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Votre confiance est précieuse. Nous protégeons la progression de {childName || 'votre enfant'}.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
