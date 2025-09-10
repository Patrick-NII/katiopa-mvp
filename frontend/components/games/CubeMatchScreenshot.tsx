'use client'

import React from 'react'

export default function CubeMatchScreenshot() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-emerald-100 to-blue-100 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-xl sm:rounded-2xl flex items-center justify-center border-2 border-dashed border-emerald-300 dark:border-emerald-600 relative overflow-hidden">
      {/* Simulation du jeu CubeMatch */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/10 dark:to-blue-900/10">
        {/* Header du jeu */}
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-white/20 rounded flex items-center justify-center">
              <span className="text-xs font-bold">CM</span>
            </div>
            <span className="text-sm font-semibold">CubeMatch</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span>Score: 150</span>
            <span>•</span>
            <span>Cible: 12</span>
            <span>•</span>
            <span>Niveau: 2</span>
          </div>
        </div>
        
        {/* Plateau de jeu */}
        <div className="p-4 flex justify-center">
          <div className="grid grid-cols-6 gap-1 bg-white rounded-lg p-2 shadow-lg">
            {Array.from({ length: 36 }, (_, i) => {
              const row = Math.floor(i / 6)
              const col = i % 6
              const value = Math.floor(Math.random() * 9) + 1
              const isSelected = (row === 1 && col === 2) || (row === 1 && col === 3) || (row === 2 && col === 2)
              
              return (
                <div
                  key={i}
                  className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-blue-500 text-white transform scale-110'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {value}
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 dark:bg-gray-800/90 rounded-lg p-2 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-300">
            Sélectionnez des cases adjacentes pour atteindre la cible de <span className="font-semibold text-green-600">12</span>
          </p>
        </div>
        
        {/* Effet de brillance */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>
      
      {/* Overlay avec icône de jeu */}
      <div className="relative z-10 text-center p-4">
        <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-xl">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <p className="text-emerald-600 dark:text-emerald-400 font-semibold text-base sm:text-lg">CubeMatch en action</p>
        <p className="text-emerald-500 dark:text-emerald-500 text-xs sm:text-sm">Jeu de calcul interactif</p>
      </div>
    </div>
  )
}
