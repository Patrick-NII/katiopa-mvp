'use client'

import React, { useState, useEffect } from 'react'
import { 
  Globe, 
  Users, 
  MessageCircle, 
  Zap, 
  Target, 
  Trophy, 
  Star, 
  Clock, 
  TrendingUp,
  Heart,
  Play,
  BookOpen,
  Award,
  Send,
  Code,
  Lightbulb,
  Calendar
} from 'lucide-react'

export default function ComCubePage() {
  const [currentLevel, setCurrentLevel] = useState(1)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 p-6">
      {/* En-tête ComCube */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg mb-4">
          <Globe className="w-6 h-6 mr-2" />
          <span className="font-bold text-xl">ComCube</span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🌍 Communauté & Partage
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Rejoins une communauté passionnée ! Partage tes découvertes, apprends des autres et crée des liens.
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 text-indigo-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Amis</p>
          <p className="text-2xl font-bold text-gray-900">24</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <MessageCircle className="w-6 h-6 text-purple-600" />
          </div>
          <p className="text-sm font-medium text-gray-600">Messages</p>
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

      {/* Forums de discussion */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Forums de discussion</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mathématiques</h3>
                <p className="text-sm text-gray-600">156 discussions</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-gray-600">89 membres</span>
              </div>
              <button className="px-3 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 transition-colors">
                Rejoindre
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Code className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Programmation</h3>
                <p className="text-sm text-gray-600">203 discussions</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-gray-600">124 membres</span>
              </div>
              <button className="px-3 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700 transition-colors">
                Rejoindre
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Sciences</h3>
                <p className="text-sm text-gray-600">98 discussions</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-pink-600" />
                <span className="text-sm text-gray-600">67 membres</span>
              </div>
              <button className="px-3 py-1 bg-pink-600 text-white rounded text-xs hover:bg-pink-700 transition-colors">
                Rejoindre
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Défis communautaires */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Défis communautaires</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🎯 Défi : Créer un tutoriel
            </h3>
            <p className="text-gray-700 mb-4">
              Partage tes connaissances en créant un tutoriel sur un sujet que tu maîtrises !
            </p>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600">Temps: 30 min</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600">Bonus: +150 points</span>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
              🚀 Participer
            </button>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              🌟 Défi : Aider 3 personnes
            </h3>
            <p className="text-gray-700 mb-4">
              Réponds aux questions de 3 autres membres de la communauté !
            </p>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Objectif: 3/3</span>
              </div>
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Bonus: +100 points</span>
              </div>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow">
              🚀 Participer
            </button>
          </div>
        </div>
      </div>

      {/* Messages récents */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Messages récents</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-indigo-600">A</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">Alice-12</span>
                <span className="text-xs text-gray-500">il y a 2h</span>
              </div>
              <p className="text-gray-700 text-sm">
                Quelqu'un peut m'aider avec les fractions ? Je n'arrive pas à comprendre la simplification...
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Répondre</span>
                </button>
                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>J'aime</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-purple-600">M</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="font-medium text-gray-900">Max-15</span>
                <span className="text-xs text-gray-500">il y a 4h</span>
              </div>
              <p className="text-gray-700 text-sm">
                J'ai créé un petit jeu en Python ! Voulez-vous que je vous montre le code ?
              </p>
              <div className="flex items-center space-x-4 mt-3">
                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-purple-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Répondre</span>
                </button>
                <button className="flex items-center space-x-1 text-sm text-gray-600 hover:text-red-600 transition-colors">
                  <Heart className="w-4 h-4" />
                  <span>J'aime</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Événements communautaires */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Événements à venir</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-2">📚 Club de lecture</h3>
            <p className="text-gray-700 text-sm mb-3">
              Discussion sur "Le Petit Prince" - Samedi à 14h
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">15 participants</span>
              <button className="px-3 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 transition-colors">
                Participer
              </button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <h3 className="font-semibold text-gray-900 mb-2">🎮 Tournoi de jeux</h3>
            <p className="text-gray-700 text-sm mb-3">
              Compétition amicale de puzzles - Dimanche à 16h
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">28 participants</span>
              <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
                Participer
              </button>
            </div>
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
            <p className="text-sm font-medium text-gray-900">Premier message</p>
            <p className="text-xs text-gray-500">Message envoyé</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-sm font-medium text-gray-900">Aidant</p>
            <p className="text-xs text-gray-500">10 réponses données</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-8 h-8 text-purple-600" />
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
  )
}
