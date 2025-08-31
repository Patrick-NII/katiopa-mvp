"use client";

import { motion } from "framer-motion";
import { Gamepad2, Users, Image as ImageIcon, Lock } from "lucide-react";

interface KidsGamesTabProps {
  user: {
    subscriptionType: string;
    firstName?: string;
  } | null;
}

export default function KidsGamesTab({ user }: KidsGamesTabProps) {
  const type = user?.subscriptionType?.toUpperCase() || "FREE";
  const isPaid = ["PRO", "PRO_PLUS", "PREMIUM", "ENTERPRISE"].includes(type);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Jeux</h2>
        <p className="text-gray-600">
          {user?.firstName ? `${user.firstName}, ` : ''}
          découvre des expériences ludiques et apprends en t'amusant.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Jeux éducatifs */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center mb-4">
            <Gamepad2 size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Jeux éducatifs</h3>
          <p className="text-sm text-gray-600 mb-4">Sujets: maths, lecture, logique, sciences.</p>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
            Explorer
          </button>
        </div>

        {/* Communautés (premium) */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border ${isPaid ? 'border-gray-100' : 'border-yellow-200'}`}>
          <div className={`w-12 h-12 rounded-xl ${isPaid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} flex items-center justify-center mb-4`}>
            {isPaid ? <Users size={22} /> : <Lock size={22} />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Communautés</h3>
          <p className="text-sm text-gray-600 mb-4">
            {isPaid ? 'Échange avec d\'autres apprenants.' : 'Fonction premium. Abonne-toi pour y accéder.'}
          </p>
          <button
            disabled={!isPaid}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isPaid ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {isPaid ? 'Ouvrir' : 'Débloquer' }
          </button>
        </div>

        {/* Changer sa photo (premium) */}
        <div className={`bg-white rounded-2xl p-6 shadow-sm border ${isPaid ? 'border-gray-100' : 'border-yellow-200'}`}>
          <div className={`w-12 h-12 rounded-xl ${isPaid ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'} flex items-center justify-center mb-4`}>
            {isPaid ? <ImageIcon size={22} /> : <Lock size={22} />}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Changer sa photo</h3>
          <p className="text-sm text-gray-600 mb-4">
            {isPaid ? 'Personnalise ton avatar.' : 'Fonction premium. Abonne-toi pour y accéder.'}
          </p>
          <button
            disabled={!isPaid}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isPaid ? 'bg-purple-600 text-white hover:bg-purple-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
          >
            {isPaid ? 'Changer' : 'Débloquer' }
          </button>
        </div>
      </div>
    </motion.div>
  );
}

