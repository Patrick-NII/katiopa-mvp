'use client'

import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Calculator, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Brain,
  Zap,
  Heart,
  Gamepad2,
  Play
} from 'lucide-react'
import Link from 'next/link'
import DecorativeCubes from '@/components/DecorativeCubes';

export default function MathCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 relative overflow-hidden">
      <DecorativeCubes variant="default" />

      {/* Espacement */}
      <div className="mb-20"></div>
      

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Target className="w-7 h-7 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Niveau actuel</p>
          <p className="text-3xl font-bold text-gray-900">{currentLevel}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-7 h-7 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Score total</p>
          <p className="text-3xl font-bold text-gray-900">{score}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <TrendingUp className="w-7 h-7 text-orange-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Série actuelle</p>
          <p className="text-3xl font-bold text-gray-900">{streak}</p>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Star className="w-7 h-7 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-600 mb-1">Étoiles</p>
          <p className="text-3xl font-bold text-gray-900">⭐⭐⭐</p>
        </div>
      </div>

      {/* Modules d'apprentissage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calculator className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Addition & Soustraction</h3>
              <p className="text-sm text-gray-600">Niveau {currentLevel}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 75%</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Continuer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Multiplication</h3>
              <p className="text-sm text-gray-600">Niveau {currentLevel}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 45%</span>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Continuer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Géométrie</h3>
              <p className="text-sm text-gray-600">Niveau {currentLevel}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 20%</span>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Commencer
            </button>
          </div>
        </div>
      </div>

      {/* Jeu CubeMatch - Section spéciale avec effet gloss */}
      <div className="relative">
        {/* Effet de brillance/gloss */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-6 -translate-y-20 pointer-events-none"></div>
        
        <div className="relative bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl p-8 shadow-2xl border border-emerald-200 mb-8 backdrop-blur-sm">
          {/* Effet de reflet */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-3xl pointer-events-none"></div>
          
          {/* Contenu principal */}
          <div className="relative z-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <Gamepad2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  🎮 CubeMatch
                </h2>
                <p className="text-gray-600 text-lg">Le jeu de calcul le plus amusant !</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Description du jeu */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <img src="/images/tabs/cubematch.svg" alt="CubeMatch" className="w-5 h-5" />
                    </div>
                    Comment jouer
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-3">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                      Sélectionne des cases adjacentes pour former des calculs
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                      Atteins la cible pour marquer des points
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                      Plus tu vas vite, plus tu gagnes de points !
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full mt-2 flex-shrink-0 shadow-sm"></span>
                      Monte en niveau et débloque de nouveaux défis
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Objectifs pédagogiques</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Calcul mental</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <Target className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Stratégie</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="font-medium">Rapidité</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                      <Brain className="w-5 h-5 text-purple-600" />
                      <span className="font-medium">Logique</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Statistiques et bouton de jeu */}
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/50">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">📊 Mes statistiques</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                      <div className="text-3xl font-bold text-emerald-600">1,247</div>
                      <div className="text-sm text-gray-600 font-medium">Score total</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-3xl font-bold text-blue-600">8</div>
                      <div className="text-sm text-gray-600 font-medium">Niveau atteint</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-xl">
                      <div className="text-3xl font-bold text-orange-600">156</div>
                      <div className="text-sm text-gray-600 font-medium">Parties jouées</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <div className="text-3xl font-bold text-purple-600">23</div>
                      <div className="text-sm text-gray-600 font-medium">Série max</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                  {/* Effet de brillance sur le bouton */}
                  <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-4">🚀 Prêt à jouer ?</h3>
                    <p className="text-emerald-100 mb-6 text-lg">
                      Défie tes limites et améliore tes compétences en calcul mental !
                    </p>
                    <Link 
                      href="/dashboard/mathcube/cubematch" 
                      className="inline-flex items-center justify-center w-full px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      <Play className="w-6 h-6 mr-3" />
                      Jouer maintenant
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Défis quotidiens 
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Défi du jour</h2>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <img src="/images/tabs/cubematch.svg" alt="CubeMatch" className="w-6 h-6" />
            🎯 Défi CubeMatch : Série de calculs rapides
          </h3>
          <p className="text-gray-700 mb-4">
            Résous 10 calculs en moins de 2 minutes dans CubeMatch et gagne des points bonus !
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Temps: 2 min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Bonus: +50 points</span>
            </div>
          </div>
          <Link href="/dashboard/mathcube/cubematch" className="mt-4 inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
            <Play className="w-5 h-5 mr-2" />
            🚀 Commencer le défi
          </Link>
        </div>
      </div>*/}

      {/* Récompenses et badges */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Heart className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mes récompenses</h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-8 h-8 text-yellow-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Premier pas</p>
            <p className="text-xs text-gray-500">Niveau 1 atteint</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Calculateur</p>
            <p className="text-xs text-gray-500">100 calculs réussis</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">En progression</p>
            <p className="text-xs text-gray-500">5 jours consécutifs</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Target className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">Prochain objectif</p>
            <p className="text-xs text-gray-400">Niveau 2</p>
          </div>
        </div>
      </div>
    </div>
  )
}
