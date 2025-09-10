'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Play, 
  Clock, 
  Star, 
  Target, 
  CheckCircle, 
  AlertCircle,
  Trophy,
  Brain,
  Zap
} from 'lucide-react'

interface Exercise {
  id: string
  title: string
  description: string
  type: string
  difficulty: number
  estimatedTime: number
  instructions?: any
  content?: any
}

interface Competence {
  id: string
  type: string
  name: string
  description: string
  icon?: string
  color?: string
  exercises: Exercise[]
}

interface CompetencesExercisesProps {
  userSessionId: string
  className?: string
}

export default function CompetencesExercises({ userSessionId, className = '' }: CompetencesExercisesProps) {
  const [competences, setCompetences] = useState<Competence[]>([])
  const [selectedCompetence, setSelectedCompetence] = useState<string>('')
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    fetchCompetences()
  }, [])

  const fetchCompetences = async () => {
    try {
      // Données de test pour les compétences et exercices
      const testCompetences: Competence[] = [
        {
          id: 'math',
          type: 'MATHEMATIQUES',
          name: 'Mathématiques',
          description: 'Compétences en calcul, géométrie et résolution de problèmes mathématiques',
          icon: '🔢',
          color: '#3B82F6',
          exercises: [
            {
              id: 'math1',
              title: 'Calcul Mental Rapide',
              description: 'Résolvez des opérations mathématiques de base en temps limité',
              type: 'QUIZ',
              difficulty: 2,
              estimatedTime: 5,
              instructions: { text: 'Résolvez le plus rapidement possible les opérations affichées' },
              content: { questions: [] }
            },
            {
              id: 'math2',
              title: 'Géométrie Spatiale',
              description: 'Reconnaissance de formes et calculs d\'aires',
              type: 'INTERACTIF',
              difficulty: 3,
              estimatedTime: 10,
              instructions: { text: 'Identifiez les formes et calculez leurs propriétés' },
              content: { shapes: [] }
            }
          ]
        },
        {
          id: 'prog',
          type: 'PROGRAMMATION',
          name: 'Programmation',
          description: 'Logique algorithmique et résolution de problèmes informatiques',
          icon: '💻',
          color: '#8B5CF6',
          exercises: [
            {
              id: 'prog1',
              title: 'Séquence d\'Instructions',
              description: 'Organisez les instructions dans le bon ordre',
              type: 'INTERACTIF',
              difficulty: 2,
              estimatedTime: 8,
              instructions: { text: 'Glissez les instructions dans le bon ordre pour créer un programme' },
              content: { instructions: [] }
            }
          ]
        },
        {
          id: 'crea',
          type: 'CREATIVITE',
          name: 'Créativité',
          description: 'Expression artistique et pensée créative',
          icon: '🎨',
          color: '#EC4899',
          exercises: [
            {
              id: 'crea1',
              title: 'Dessin Libre',
              description: 'Créez une œuvre d\'art numérique',
              type: 'CREATIF',
              difficulty: 1,
              estimatedTime: 15,
              instructions: { text: 'Utilisez les outils de dessin pour créer votre œuvre' },
              content: { tools: [] }
            }
          ]
        },
        {
          id: 'collab',
          type: 'COLLABORATION',
          name: 'Collaboration',
          description: 'Travail en équipe et communication interpersonnelle',
          icon: '🤝',
          color: '#10B981',
          exercises: [
            {
              id: 'collab1',
              title: 'Projet en Équipe',
              description: 'Collaborez sur un projet commun',
              type: 'COLLABORATIF',
              difficulty: 4,
              estimatedTime: 25,
              instructions: { text: 'Travaillez ensemble pour résoudre un défi' },
              content: { roles: [] }
            }
          ]
        },
        {
          id: 'conc',
          type: 'CONCENTRATION',
          name: 'Concentration',
          description: 'Attention soutenue et focus',
          icon: '🎯',
          color: '#F59E0B',
          exercises: [
            {
              id: 'conc1',
              title: 'Mémoire Visuelle',
              description: 'Mémorisez et reproduisez des séquences',
              type: 'PRATIQUE',
              difficulty: 2,
              estimatedTime: 10,
              instructions: { text: 'Observez la séquence puis reproduisez-la' },
              content: { sequences: [] }
            }
          ]
        }
      ]

      setCompetences(testCompetences)
      
      // Sélectionner la première compétence par défaut
      if (testCompetences.length > 0) {
        setSelectedCompetence(testCompetences[0].id)
      }

      // Essayer quand même l'API pour voir si elle fonctionne
      try {
        const response = await fetch('/api/competences', {
          credentials: 'include'
        })
        
        if (response.ok) {
          const data = await response.json()
          console.log('Données API compétences récupérées:', data)
        }
      } catch (apiError) {
        console.log('API compétences non disponible, utilisation des données de test')
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'text-green-600 bg-green-100'
    if (difficulty <= 3) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return 'Facile'
    if (difficulty <= 3) return 'Moyen'
    return 'Difficile'
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'QUIZ': return <Target className="w-4 h-4" />
      case 'INTERACTIF': return <Play className="w-4 h-4" />
      case 'CREATIF': return <Brain className="w-4 h-4" />
      case 'COLLABORATIF': return <Zap className="w-4 h-4" />
      case 'REFLEXION': return <Brain className="w-4 h-4" />
      case 'PRATIQUE': return <CheckCircle className="w-4 h-4" />
      default: return <Play className="w-4 h-4" />
    }
  }

  const startExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise)
  }

  const closeExercise = () => {
    setSelectedExercise(null)
  }

  if (loading) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
        <div className="flex items-center gap-3 text-red-600">
          <AlertCircle className="w-6 h-6" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const currentCompetence = competences.find(c => c.id === selectedCompetence)

  return (
    <div className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-6 ${className}`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mes Exercices d'Apprentissage
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          Choisis une compétence et lance-toi dans les exercices !
        </p>
      </motion.div>

      {/* Sélection des compétences */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Choisis ta compétence :
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {competences.map((competence, index) => (
            <motion.button
              key={competence.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              onClick={() => setSelectedCompetence(competence.id)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedCompetence === competence.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-purple-300'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">{competence.icon}</div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {competence.name}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  {competence.exercises.length} exercices
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Exercices de la compétence sélectionnée */}
      {currentCompetence && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{currentCompetence.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentCompetence.name}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {currentCompetence.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentCompetence.exercises.map((exercise, index) => (
              <motion.div
                key={exercise.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/20 dark:border-gray-600/50 p-4 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTypeIcon(exercise.type)}
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {exercise.title}
                    </h4>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                    {getDifficultyLabel(exercise.difficulty)}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  {exercise.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {exercise.estimatedTime} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4" />
                      {exercise.difficulty}/5
                    </div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startExercise(exercise)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Commencer
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Modal d'exercice */}
      {selectedExercise && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeExercise}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedExercise.title}
              </h3>
              <button
                onClick={closeExercise}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {selectedExercise.description}
              </p>

              {selectedExercise.instructions && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Instructions :
                  </h4>
                  <p className="text-blue-800 dark:text-blue-200">
                    {selectedExercise.instructions.text || 'Suivez les instructions affichées.'}
                  </p>
                </div>
              )}

              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  L'exercice sera bientôt disponible !
                </p>
                <button
                  onClick={closeExercise}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
