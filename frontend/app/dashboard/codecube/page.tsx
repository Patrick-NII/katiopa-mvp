'use client'

import React, { useState, useEffect } from 'react'
import { 
  Code, 
  Terminal, 
  Bug, 
  Zap, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Brain,
  Heart,
  Play
} from 'lucide-react'

export default function CodeCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      {/* En-tête CodeCube */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg mb-4">
          <Code className="w-6 h-6 mr-2" />
          <span className="font-bold text-xl">CodeCube</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          💻 Initiation à la Programmation
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Découvre le monde fascinant du code ! Apprends à programmer avec des exercices ludiques et progressifs.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-green-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Niveau actuel</p>
          <p className="text-2xl font-bold text-gray-900">{currentLevel}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Score total</p>
          <p className="text-2xl font-bold text-gray-900">{score}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Série actuelle</p>
          <p className="text-2xl font-bold text-gray-900">{streak}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Étoiles</p>
          <p className="text-2xl font-bold text-gray-900">⭐⭐⭐</p>
        </div>
      </div>

      {/* Modules d'apprentissage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Terminal className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Premiers pas</h3>
              <p className="text-sm text-gray-600">Niveau {currentLevel}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 80%</span>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Continuer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bug className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Débogage</h3>
              <p className="text-sm text-gray-600">Niveau {currentLevel}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 60%</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
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
              <h3 className="font-semibold text-gray-900">Logique</h3>
              <p className="text-sm text-gray-600">Niveau {currentLevel}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 30%</span>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Commencer
            </button>
          </div>
        </div>
      </div>

      {/* Défis quotidiens */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Défi du jour</h2>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🎯 Défi spécial : Créer une boucle simple
          </h3>
          <p className="text-gray-700 mb-4">
            Écris ton premier programme avec une boucle et gagne des points bonus !
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Temps: 5 min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-600">Bonus: +75 points</span>
            </div>
          </div>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
            🚀 Commencer le défi
          </button>
        </div>
      </div>

      {/* Éditeur de code simple */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Play className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Éditeur de code</h2>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 font-mono text-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-green-400">main.py</span>
            <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
              ▶️ Exécuter
            </button>
          </div>
          <div className="text-gray-300 space-y-1">
            <div><span className="text-blue-400">print</span><span className="text-yellow-400">(</span><span className="text-green-400">"Hello, World!"</span><span className="text-yellow-400">)</span></div>
            <div><span className="text-blue-400">for</span> <span className="text-purple-400">i</span> <span className="text-blue-400">in</span> <span className="text-blue-400">range</span><span className="text-yellow-400">(</span><span className="text-orange-400">5</span><span className="text-yellow-400">):</span></div>
            <div className="ml-4"><span className="text-blue-400">print</span><span className="text-yellow-400">(</span><span className="text-purple-400">i</span><span className="text-yellow-400">)</span></div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Sortie :</h4>
          <div className="font-mono text-sm text-gray-700">
            Hello, World!<br/>
            0<br/>
            1<br/>
            2<br/>
            3<br/>
            4
          </div>
        </div>
      </div>

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
            <p className="text-sm font-medium text-gray-900">Premier code</p>
            <p className="text-xs text-gray-500">Programme créé</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Debugger</p>
            <p className="text-xs text-gray-500">10 bugs corrigés</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">En progression</p>
            <p className="text-xs text-gray-500">3 jours consécutifs</p>
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
