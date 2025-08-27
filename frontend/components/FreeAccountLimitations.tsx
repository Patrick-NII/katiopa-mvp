'use client'

interface FreeAccountLimitationsProps {
  currentFeatures: string[]
  premiumFeatures: string[]
}

export default function FreeAccountLimitations({ 
  currentFeatures, 
  premiumFeatures 
}: FreeAccountLimitationsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-8 mb-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan de votre compte</h3>
        <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full">
          <span className="text-lg mr-2">🆓</span>
          <span className="font-medium">Compte Gratuit</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fonctionnalités actuelles */}
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
            <span className="mr-2">✅</span>
            Ce qui est inclus
          </h4>
          <ul className="space-y-3">
            {currentFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 mr-2">•</span>
                <span className="text-green-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Fonctionnalités premium */}
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
            <span className="mr-2">⭐</span>
            Débloqué avec Premium
          </h4>
          <ul className="space-y-3">
            {premiumFeatures.map((feature, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-blue-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Call to action */}
      <div className="mt-8 text-center">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
          <h4 className="text-xl font-bold text-gray-900 mb-3">🚀 Prêt à passer au niveau supérieur ?</h4>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Débloquez toutes les fonctionnalités avancées, graphiques détaillés, 
            statistiques complètes et bien plus encore avec un compte Premium !
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              Voir les plans Premium
            </button>
            <button className="px-8 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Comparer les plans
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 