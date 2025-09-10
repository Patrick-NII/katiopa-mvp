'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Calendar, BookOpen, Code, Gamepad2, Globe, BarChart3, Heart, Target, Star, Clock, CheckCircle, Circle } from 'lucide-react'

interface ProgrammePageProps {
  user: any
  userType: 'CHILD' | 'PARENT'
  childSessions?: any[]
}

function ProgrammePage({ user, userType, childSessions = [] }: ProgrammePageProps) {
  // Données simulées pour le cycle d'apprentissage
  const weeklyCycle = [
    {
      day: 'Lundi',
      title: 'MathCube rigoureux',
      description: 'Renforcement des bases mathématiques',
      icon: BookOpen,
      status: 'completed',
      progress: 100
    },
    {
      day: 'Mardi',
      title: 'CodeCube logique',
      description: 'Développement des compétences numériques',
      icon: Code,
      status: 'current',
      progress: 60
    },
    {
      day: 'Mercredi',
      title: 'PlayCube créatif',
      description: 'Apprentissage par le jeu',
      icon: Gamepad2,
      status: 'pending',
      progress: 0
    },
    {
      day: 'Jeudi',
      title: 'ScienceCube transdisciplinaire',
      description: 'Découverte scientifique',
      icon: Globe,
      status: 'pending',
      progress: 0
    },
    {
      day: 'Vendredi',
      title: 'Auto-évaluation + radar',
      description: 'Bilan des compétences',
      icon: BarChart3,
      status: 'pending',
      progress: 0
    },
    {
      day: 'Week-end',
      title: 'Activités libres parent-enfant',
      description: 'Temps de partage familial',
      icon: Heart,
      status: 'pending',
      progress: 0
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'current':
        return <Circle className="w-5 h-5 text-purple-500 fill-current" />
      case 'pending':
        return <Circle className="w-5 h-5 text-gray-300" />
      default:
        return <Circle className="w-5 h-5 text-gray-300" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50 dark:bg-green-900/20'
      case 'current':
        return 'border-purple-200 bg-purple-50 dark:bg-purple-900/20'
      case 'pending':
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
      default:
        return 'border-gray-200 bg-gray-50 dark:bg-gray-800/50'
    }
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto">
      <div className="h-screen py-3 md:py-4 lg:py-5 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-4 md:p-5 lg:p-6 h-full flex flex-col w-full"
        >
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-8 h-8 text-purple-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Programme Pédagogique
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300">
              Cycle d'apprentissage hebdomadaire adapté pour {user?.firstName || 'votre enfant'}
            </p>
          </div>

          {/* Statistiques du programme */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Target className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Objectif</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">5/7</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Série</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">3</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Temps</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">45min</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Progression</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">25%</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Cycle d'apprentissage hebdomadaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-purple-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Cycle d'apprentissage hebdomadaire
              </h2>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Programme pédagogique adapté pour {user?.firstName || 'votre enfant'}
            </p>

            {/* Aujourd'hui - Jour actuel */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5" />
                  <h3 className="font-bold text-lg">Aujourd'hui - Mardi</h3>
                </div>
                <div className="flex items-center gap-3">
                  <Code className="w-6 h-6" />
                  <div>
                    <p className="font-semibold">CodeCube logique</p>
                    <p className="text-purple-100">Développement des compétences numériques</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grille des jours de la semaine */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {weeklyCycle.map((day, index) => {
                const IconComponent = day.icon
                return (
                  <motion.div
                    key={day.day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className={`rounded-xl border-2 p-4 transition-all duration-300 ${getStatusColor(day.status)}`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(day.status)}
                      <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{day.day}</h3>
                    </div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{day.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">{day.description}</p>
                    
                    {/* Barre de progression */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          day.status === 'completed' ? 'bg-green-500' :
                          day.status === 'current' ? 'bg-purple-500' : 'bg-gray-300'
                        }`}
                        style={{ width: `${day.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{day.progress}%</p>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>

          {/* Progression de la semaine */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Progression de la semaine
                </h2>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-300">1/6 jours</p>
                <p className="text-lg font-bold text-purple-600">25% de la semaine complétée</p>
              </div>
            </div>

            {/* Barre de progression globale */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-4">
              <div
                className="h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
                style={{ width: '25%' }}
              ></div>
            </div>

            {/* Conseils pédagogiques */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Star className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Conseil pédagogique</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                Proposez à {user?.firstName || 'votre enfant'} des défis de programmation créatifs pour développer sa logique et sa créativité numérique.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ProgrammePageWrapper() {
  // Données simulées pour la page programme
  const user = {
    firstName: 'Parent',
    lastName: 'Test',
    userType: 'PARENT'
  }
  
  const childSessions = [
    {
      id: 'milan',
      firstName: 'Milan',
      lastName: 'Test'
    },
    {
      id: 'aylon',
      firstName: 'Aylon',
      lastName: 'Test'
    }
  ]

  return <ProgrammePage user={user} userType="PARENT" childSessions={childSessions} />
}
