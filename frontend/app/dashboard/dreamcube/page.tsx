'use client'

import React, { useState, useEffect } from 'react'
import { 
  Heart, 
  Target, 
  Star, 
  Zap, 
  Trophy, 
  Clock, 
  TrendingUp,
  BookOpen,
  Play,
  Users,
  Lightbulb,
  Award,
  Code,
  FlaskConical
} from 'lucide-react'

export default function DreamCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 p-6">
      {/* En-tête DreamCube */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg mb-4">
          <Heart className="w-6 h-6 mr-2" />
          <span className="font-bold text-xl">DreamCube</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          💫 Espace de Rêve & Objectifs
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Rêve grand et fixe-toi des objectifs ! Découvre des métiers passionnants et construis ton avenir.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-pink-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Niveau actuel</p>
          <p className="text-2xl font-bold text-gray-900">{currentLevel}</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Trophy className="w-6 h-6 text-rose-600" />
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

      {/* Mes objectifs */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Mes objectifs</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Lire 20 livres</h3>
                <p className="text-sm text-gray-600">Progression: 15/20</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-pink-500 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
            <span className="text-xs text-gray-500">75% terminé</span>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Play className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Apprendre la guitare</h3>
                <p className="text-sm text-gray-600">Progression: 3/10 leçons</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
            </div>
            <span className="text-xs text-gray-500">30% terminé</span>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Gagner un concours</h3>
                <p className="text-sm text-gray-600">Progression: En cours</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>
            <span className="text-xs text-gray-500">45% terminé</span>
          </div>
        </div>
      </div>

      {/* Découverte des métiers */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Découverte des métiers</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Développeur</h3>
                <p className="text-sm text-gray-600">Créer des applications</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.9</span>
              </div>
              <button className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors">
                Découvrir
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Scientifique</h3>
                <p className="text-sm text-gray-600">Explorer et découvrir</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.7</span>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                Découvrir
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Médecin</h3>
                <p className="text-sm text-gray-600">Soigner et aider</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.8</span>
              </div>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
                Découvrir
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
            🎯 Défi spécial : Planifier mon avenir
          </h3>
          <p className="text-gray-700 mb-4">
            Crée un plan d'action pour atteindre ton objectif principal et gagne des points bonus !
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Temps: 15 min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Bonus: +120 points</span>
            </div>
          </div>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
            🚀 Commencer le défi
          </button>
        </div>
      </div>

      {/* Inspirations et citations */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Star className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Inspirations du jour</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">💭 Citation inspirante</h3>
            <blockquote className="text-gray-700 italic text-sm">
              "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte."
            </blockquote>
            <p className="text-xs text-gray-500 mt-2">- Winston Churchill</p>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
            <h3 className="font-semibold text-gray-900 mb-2">🎬 Film motivant</h3>
            <p className="text-gray-700 text-sm">
              "Les Chèvres du Pentagone" - Une histoire de persévérance et de rêves impossibles qui deviennent réalité.
            </p>
            <p className="text-xs text-gray-500 mt-2">Durée: 1h 54min</p>
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
            <p className="text-sm font-medium text-gray-900">Premier rêve</p>
            <p className="text-xs text-gray-500">Objectif défini</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Rêveur</p>
            <p className="text-xs text-gray-500">5 objectifs créés</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
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
