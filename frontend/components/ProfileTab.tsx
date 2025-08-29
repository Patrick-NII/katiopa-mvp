'use client';

import { motion } from 'framer-motion';

interface ProfileTabProps {
  user: {
    id: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    userType: string;
    subscriptionType: string;
  };
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ user }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Profil Utilisateur</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Informations Personnelles</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Prénom</label>
                <p className="text-gray-900">{user.firstName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Nom</label>
                <p className="text-gray-900">{user.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Type d'utilisateur</label>
                <p className="text-gray-900">{user.userType === 'PARENT' ? 'Parent' : 'Enfant'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">ID de session</label>
                <p className="text-gray-900 font-mono text-sm">{user.sessionId}</p>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Compte</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">Plan d'abonnement</label>
                <p className="text-gray-900">{user.subscriptionType}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Statut</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Actif
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
