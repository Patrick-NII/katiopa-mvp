'use client';

import { motion } from 'framer-motion';

interface BillingTabProps {
  user: {
    id: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    userType: string;
    subscriptionType: string;
  };
}

export const BillingTab: React.FC<BillingTabProps> = ({ user }) => {
  if (user?.subscriptionType === 'FREE') {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-8 rounded-xl"
        >
          <h1 className="text-3xl font-bold mb-2">💳 Facturation</h1>
          <p className="text-red-100 text-lg">
            Cette fonctionnalité est disponible avec un compte Premium
          </p>
        </motion.div>
        
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Upgrade requis</h3>
          <p className="text-gray-600 mb-6">
            Passez à un compte Premium pour accéder à l'historique de facturation et aux options de paiement.
          </p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Voir les plans Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-8 rounded-xl"
      >
        <h1 className="text-3xl font-bold mb-2">💳 Facturation</h1>
        <p className="text-red-100 text-lg">
          Gérez vos paiements et consultez votre historique
        </p>
      </motion.div>
      
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Historique des paiements</h3>
        <p className="text-gray-600">Cette section sera développée prochainement avec l'historique complet de facturation.</p>
      </div>
    </div>
  );
};
