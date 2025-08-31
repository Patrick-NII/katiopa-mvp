"use client";

import { motion } from "framer-motion";
import { Shield, Moon, Bell } from "lucide-react";

interface KidsSettingsTabProps {
  user: {
    firstName?: string;
  } | null;
}

export default function KidsSettingsTab({ user }: KidsSettingsTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Réglages</h2>
        <p className="text-gray-600">
          {user?.firstName ? `${user.firstName}, ` : ''}personnalise ton expérience.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
            <Shield size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Sécurité</h3>
          <p className="text-sm text-gray-600 mb-4">Ton compte est sécurisé et protégé.</p>
          <button className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition">
            En savoir plus
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
            <Moon size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Affichage</h3>
          <p className="text-sm text-gray-600 mb-4">Bientôt: mode sombre et thèmes.</p>
          <button className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition">
            Préférences
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-4">
            <Bell size={22} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">Notifications</h3>
          <p className="text-sm text-gray-600 mb-4">Rappels et nouveaux défis.</p>
          <button className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition">
            Configurer
          </button>
        </div>
      </div>
    </motion.div>
  );
}

