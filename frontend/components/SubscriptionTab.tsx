'use client';

import { motion } from 'framer-motion';

interface SubscriptionTabProps {
  user: {
    id: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    userType: string;
    subscriptionType: string;
  };
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-8 rounded-xl"
      >
        <h1 className="text-3xl font-bold mb-2">👑 Plans et Abonnements</h1>
        <p className="text-yellow-100 text-lg">
          Découvrez nos plans et débloquez toutes les fonctionnalités
        </p>
        
        {/* Affichage du plan actuel */}
        <div className="mt-4 p-4 bg-white/20 rounded-lg">
          <p className="text-white text-lg font-medium">
            Votre plan actuel : <span className="font-bold text-yellow-200">
              {user.subscriptionType === 'FREE' ? 'Gratuit' : 
               user.subscriptionType === 'PRO' ? 'Pro' : 
               user.subscriptionType === 'PRO_PLUS' ? 'Pro Plus' : 
               user.subscriptionType === 'ENTERPRISE' ? 'Entreprise' : 'Inconnu'}
            </span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Plan Gratuit */}
        <div className={`bg-white p-6 rounded-xl shadow-sm border-2 ${
          user.subscriptionType === 'FREE' 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-200'
        } relative`}>
          {user.subscriptionType === 'FREE' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Plan actuel
            </div>
          )}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Gratuit</h3>
          <p className="text-3xl font-bold text-gray-900 mb-2">0€<span className="text-lg text-gray-500">/mois</span></p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                              Accès aux expériences CubeAI de base
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Statistiques simples
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Support communautaire
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              1 compte + 1 session
            </li>
          </ul>
          <button className={`w-full px-4 py-2 rounded-lg font-medium ${
            user.subscriptionType === 'FREE'
              ? 'bg-green-600 text-white cursor-default'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}>
            {user.subscriptionType === 'FREE' ? 'Plan actuel' : 'Plan actuel'}
          </button>
        </div>
        
        {/* Plan Pro */}
        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${
          user.subscriptionType === 'PRO' 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-purple-200'
        } relative`}>
          {user.subscriptionType === 'PRO' ? (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Plan actuel
            </div>
          ) : (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Recommandé
            </div>
          )}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Pro</h3>
          <p className="text-3xl font-bold text-purple-600 mb-2">19,90€<span className="text-lg text-gray-500">/mois</span></p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Tout du plan gratuit
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Graphiques avancés
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              IA Coach avancée
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              1 compte + 2 sessions
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
              Support prioritaire
            </li>
          </ul>
          <button className={`w-full px-4 py-2 rounded-lg font-medium ${
            user.subscriptionType === 'PRO'
              ? 'bg-purple-600 text-white cursor-default'
              : 'bg-purple-600 text-white hover:bg-purple-700 transition-colors'
          }`}>
            {user.subscriptionType === 'PRO' ? 'Plan actuel' : 'Choisir Pro'}
          </button>
        </div>
        
        {/* Plan Pro Plus */}
        <div className={`bg-white p-6 rounded-xl shadow-lg border-2 ${
          user.subscriptionType === 'PRO_PLUS' 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-blue-200'
        } relative`}>
          {user.subscriptionType === 'PRO_PLUS' && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
              Plan actuel
            </div>
          )}
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Plan Pro Plus</h3>
          <p className="text-3xl font-bold text-blue-600 mb-2">39,90€<span className="text-lg text-gray-500">/mois</span></p>
          <ul className="space-y-2 mb-6">
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Tout du plan Pro
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Mémoire IA avancée
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Suivi personnalisé
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              1 compte + 4 sessions
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Support dédié
            </li>
            <li className="flex items-center gap-2 text-sm text-gray-600">
              <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
              Formation parentale
            </li>
          </ul>
          <button className={`w-full px-4 py-2 rounded-lg font-medium ${
            user.subscriptionType === 'PRO_PLUS'
              ? 'bg-blue-600 text-white cursor-default'
              : 'bg-blue-600 text-white hover:bg-blue-700 transition-colors'
          }`}>
            {user.subscriptionType === 'PRO_PLUS' ? 'Plan actuel' : 'Choisir Pro Plus'}
          </button>
        </div>
      </div>
    </div>
  );
};
