'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Gamepad2, 
  BookOpen, 
  Code, 
  Lightbulb, 
  Heart,
  Trophy,
  Target,
  Clock,
  Star,
  ChevronRight,
  Play,
  Zap
} from 'lucide-react'
import WeeklyCycle from '../../../components/WeeklyCycle'
import RadarChart from '../../../components/charts/RadarChart'
import CompetencesExercises from '../../../components/exercises/CompetencesExercises'
import { RadarDataProvider } from '../../../contexts/RadarDataContext'

interface ExperiencesPageProps {
  user: any
  userType: 'CHILD' | 'PARENT'
}

function ExperiencesPage({ user, userType }: ExperiencesPageProps) {
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [progress, setProgress] = useState({
    mathcube: 75,
    codecube: 60,
    playcube: 90,
    sciencecube: 45,
    dreamcube: 30
  })

  // Le RadarChart récupère automatiquement les vraies données via useRadarData
  // Plus besoin de données simulées

  const isChild = userType === 'CHILD'

  // Modules d'apprentissage avec leurs détails
  const learningModules = [
    {
      id: 'mathcube',
      name: 'MathCube',
      description: 'Apprentissage rigoureux des mathématiques',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-200',
      progress: progress.mathcube,
      difficulty: 'Moyen',
      estimatedTime: '15 min',
      principle: 'Méthode de Singapour',
      features: ['Calcul mental', 'Géométrie', 'Logique']
    },
    {
      id: 'codecube',
      name: 'CodeCube',
      description: 'Développement des compétences numériques',
      icon: Code,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      borderColor: 'border-purple-200',
      progress: progress.codecube,
      difficulty: 'Difficile',
      estimatedTime: '20 min',
      principle: 'Méthode estonienne',
      features: ['Programmation', 'Algorithmes', 'Logique']
    },
    {
      id: 'playcube',
      name: 'PlayCube',
      description: 'Apprentissage par le jeu et la créativité',
      icon: Gamepad2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      progress: progress.playcube,
      difficulty: 'Facile',
      estimatedTime: '10 min',
      principle: 'Méthode finlandaise',
      features: ['Jeux éducatifs', 'Créativité', 'Collaboration']
    },
    {
      id: 'sciencecube',
      name: 'ScienceCube',
      description: 'Exploration scientifique et découverte',
      icon: Lightbulb,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      progress: progress.sciencecube,
      difficulty: 'Moyen',
      estimatedTime: '25 min',
      principle: 'Méthode américaine',
      features: ['Expériences', 'Observation', 'Hypothèses']
    },
    {
      id: 'dreamcube',
      name: 'DreamCube',
      description: 'Développement personnel et émotionnel',
      icon: Heart,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50',
      textColor: 'text-pink-700',
      borderColor: 'border-pink-200',
      progress: progress.dreamcube,
      difficulty: 'Facile',
      estimatedTime: '12 min',
      principle: 'Méthode Reggio',
      features: ['Émotions', 'Créativité', 'Expression']
    }
  ]

  const achievements = [
    {
      id: 'streak_7',
      title: 'Série de 7 jours',
      description: 'Apprentissage quotidien pendant une semaine',
      icon: Trophy,
      earned: true,
      color: 'text-yellow-500'
    },
    {
      id: 'math_master',
      title: 'Maître des Maths',
      description: 'Complétion de 10 exercices de MathCube',
      icon: BookOpen,
      earned: true,
      color: 'text-blue-500'
    },
    {
      id: 'code_ninja',
      title: 'Ninja du Code',
      description: 'Résolution de 5 défis de programmation',
      icon: Code,
      earned: false,
      color: 'text-gray-400'
    },
    {
      id: 'creative_genius',
      title: 'Génie Créatif',
      description: 'Création de 3 projets artistiques',
      icon: Lightbulb,
      earned: false,
      color: 'text-gray-400'
    }
  ]

  const todayRecommendations = [
    {
      module: 'MathCube',
      activity: 'Addition et Soustraction',
      difficulty: 'Facile',
      estimatedTime: '10 min',
      reason: 'Renforcer les bases'
    },
    {
      module: 'PlayCube',
      activity: 'Jeu de Mémoire',
      difficulty: 'Facile',
      estimatedTime: '8 min',
      reason: 'Développer la concentration'
    },
    {
      module: 'ScienceCube',
      activity: 'Observation des Plantes',
      difficulty: 'Moyen',
      estimatedTime: '15 min',
      reason: 'Explorer la nature'
    }
  ]

  return (
    <RadarDataProvider>
      <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="h-full overflow-y-auto p-4 md:p-5 lg:p-6">
        <div className="space-y-6">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Mes Expériences d'Apprentissage 🎯
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {isChild 
                ? "Explorez, apprenez et progressez à votre rythme !" 
                : "Suivez les expériences d'apprentissage de vos enfants"
              }
            </p>
          </motion.div>

          {/* Cycle d'apprentissage hebdomadaire */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <WeeklyCycle
              childName={user?.firstName || 'Utilisateur'}
              currentDay={new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()}
              interactive={isChild}
            />
          </motion.div>

      {/* Recommandations du jour */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Recommandations du jour
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {todayRecommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{rec.module}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                  {rec.difficulty}
                </span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{rec.activity}</h4>
              <p className="text-sm text-gray-600 mb-2">{rec.reason}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {rec.estimatedTime}
                </span>
                {isChild && (
                  <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors">
                    Commencer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      

      {/* Récompenses et succès */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Trophy className="w-5 h-5 text-yellow-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Mes Récompenses
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <div key={achievement.id} className="text-center">
              <div className={`p-4 rounded-full mx-auto mb-2 ${
                achievement.earned ? 'bg-yellow-100' : 'bg-gray-100'
              }`}>
                <achievement.icon className={`w-8 h-8 mx-auto ${
                  achievement.earned ? achievement.color : 'text-gray-400'
                }`} />
              </div>
              <h4 className={`text-sm font-semibold ${
                achievement.earned ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {achievement.title}
              </h4>
              <p className={`text-xs ${
                achievement.earned ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {achievement.description}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Exercices des Compétences pour les enfants */}
      {isChild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <CompetencesExercises 
            userSessionId="current-child"
            className="mb-8"
          />
        </motion.div>
      )}

      {/* Radar Chart pour les enfants */}
      {isChild && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <RadarChart 
            isChild={false}
            userType="PARENT"
            className="mb-8"
          />
        </motion.div>
      )}
      
        </div>
      </div>
      </div>
    </RadarDataProvider>
  )
}

export default function ExperiencesPageWrapper() {
  // Données simulées pour la page experiences
  const user = {
    firstName: 'Enfant',
    lastName: 'Test',
    userType: 'CHILD'
  }

  return <ExperiencesPage user={user} userType="CHILD" />
}
