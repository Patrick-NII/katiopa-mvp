'use client'

import React from 'react'

interface StatsTabProps {
  userType: 'CHILD' | 'PARENT' | 'TEACHER' | 'ADMIN'
}

export default function StatsTab({ userType }: StatsTabProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          📊 Statistiques & Analyses
        </h1>
        <p className="text-lg text-gray-600">
          Suivez vos progrès et performances d'apprentissage
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Statistiques en cours de développement
          </h2>
          <p className="text-gray-600">
            Cette section sera bientôt disponible avec des statistiques détaillées sur vos activités d'apprentissage.
          </p>
        </div>
      </div>
    </div>
  )
}
