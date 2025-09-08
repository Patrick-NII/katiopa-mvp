'use client'

import React, { useState, useEffect } from 'react'
import { 
  Gamepad2, 
  Puzzle, 
  Brain, 
  Zap, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Heart,
  Play,
  Users
} from 'lucide-react'
import DecorativeCubes from '@/components/DecorativeCubes';

export default function PlayCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  return (
    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        <DecorativeCubes variant="default" />
        {/* En-tête PlayCube */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg mb-4">
            <Gamepad2 className="w-6 h-6 mr-2" />
            <span className="font-bold text-xl">PlayCube</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Jeux de Détente & Éducatifs
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Amuse-toi tout en apprenant ! Découvre des jeux captivants qui stimulent ton cerveau.
          </p>
        </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Niveau actuel</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentLevel}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-pink-600" />
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
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Star className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Étoiles</p>
          <p className="text-2xl font-bold text-gray-900">⭐⭐⭐</p>
        </div>
      </div>

      {/* Catégories de jeux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Puzzle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Puzzles</h3>
              <p className="text-sm text-gray-600">Logique & réflexion</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">5 jeux disponibles</span>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Jouer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Mémoire</h3>
              <p className="text-sm text-gray-600">Entraînement cérébral</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">3 jeux disponibles</span>
            <button className="px-4 py-2 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition-colors">
              Jouer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Multijoueur</h3>
              <p className="text-sm text-gray-600">Joue avec des amis</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">2 jeux disponibles</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Jouer
            </button>
          </div>
        </div>
      </div>

      {/* Jeux populaires */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Jeux populaires</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Puzzle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sudoku Coloré</h3>
                <p className="text-sm text-gray-600">Niveau facile</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.8</span>
              </div>
              <button className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors">
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Memory Match</h3>
                <p className="text-sm text-gray-600">Niveau moyen</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.6</span>
              </div>
              <button className="px-3 py-1 bg-pink-600 text-white rounded text-xs hover:bg-pink-700 transition-colors">
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Quiz Battle</h3>
                <p className="text-sm text-gray-600">Multijoueur</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.9</span>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Défis quotidiens */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Défi du jour</h2>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            🎯 Défi spécial : Marathon de puzzles
          </h3>
          <p className="text-gray-700 mb-4">
            Résous 5 puzzles en moins de 10 minutes et gagne des points bonus !
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Temps: 10 min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Bonus: +100 points</span>
            </div>
          </div>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
            🚀 Commencer le défi
          </button>
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
            <p className="text-sm font-medium text-gray-900">Premier jeu</p>
            <p className="text-xs text-gray-500">Partie terminée</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Puzzle Master</p>
            <p className="text-xs text-gray-500">50 puzzles résolus</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">En progression</p>
            <p className="text-xs text-gray-500">7 jours consécutifs</p>
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
    </div>
  )
}
