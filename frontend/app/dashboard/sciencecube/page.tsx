'use client'

import React, { useState, useEffect } from 'react'
import { 
  Lightbulb, 
  FlaskConical, 
  Atom, 
  Zap, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Heart,
  Play,
  BookOpen,
  Globe
} from 'lucide-react'
import DecorativeCubes from '@/components/DecorativeCubes';

export default function ScienceCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-100 p-6 relative overflow-hidden">
      <DecorativeCubes variant="default" />
      {/* En-tête ScienceCube */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg mb-4">
          <Lightbulb className="w-6 h-6 mr-2" />
          <span className="font-bold text-xl">ScienceCube</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🔬 Découvertes Scientifiques
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore le monde fascinant des sciences ! Découvre la nature, l'espace et les phénomènes qui nous entourent.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-6 h-6 text-cyan-600" />
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

      {/* Domaines scientifiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <FlaskConical className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Chimie</h3>
              <p className="text-sm text-gray-600">Réactions et molécules</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 70%</span>
            <button className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 transition-colors">
              Continuer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Atom className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Physique</h3>
              <p className="text-sm text-gray-600">Forces et énergie</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 55%</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Continuer
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Biologie</h3>
              <p className="text-sm text-gray-600">Vie et écosystèmes</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Progression: 40%</span>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Commencer
            </button>
          </div>
        </div>
      </div>

      {/* Expériences virtuelles */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
            <FlaskConical className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Expériences virtuelles</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                <FlaskConical className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Réaction acide-base</h3>
                <p className="text-sm text-gray-600">Niveau facile</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.9</span>
              </div>
              <button className="px-3 py-1 bg-cyan-600 text-white rounded text-xs hover:bg-cyan-700 transition-colors">
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Atom className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Circuit électrique</h3>
                <p className="text-sm text-gray-600">Niveau moyen</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.7</span>
              </div>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                <Play className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Écosystème</h3>
                <p className="text-sm text-gray-600">Niveau avancé</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600">4.8</span>
              </div>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
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
            🎯 Défi spécial : Découverte de l'espace
          </h3>
          <p className="text-gray-700 mb-4">
            Explore le système solaire et réponds à 10 questions sur les planètes !
          </p>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Temps: 8 min</span>
            </div>
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-gray-600">Bonus: +80 points</span>
            </div>
          </div>
          <button className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
            🚀 Commencer le défi
          </button>
        </div>
      </div>

      {/* Bibliothèque scientifique */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Bibliothèque scientifique</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <h3 className="font-semibold text-gray-900 mb-2">📚 Livres recommandés</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• "Les mystères de l'atome" - Niveau débutant</li>
              <li>• "Voyage dans l'espace" - Niveau intermédiaire</li>
              <li>• "La vie secrète des plantes" - Niveau avancé</li>
            </ul>
          </div>
          
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">🎥 Vidéos éducatives</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• "Comment fonctionne la gravité" - 5 min</li>
              <li>• "Les réactions chimiques" - 8 min</li>
              <li>• "L'évolution des espèces" - 12 min</li>
            </ul>
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
            <p className="text-sm font-medium text-gray-900">Premier pas</p>
            <p className="text-xs text-gray-500">Expérience réussie</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-8 h-8 text-cyan-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Scientifique</p>
            <p className="text-xs text-gray-500">10 expériences réussies</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">En progression</p>
            <p className="text-xs text-gray-500">4 jours consécutifs</p>
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
