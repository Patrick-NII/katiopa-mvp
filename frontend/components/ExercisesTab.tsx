'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Play, 
  Pause, 
  Target,
  Calendar,
  TrendingUp,
  Award,
  Timer
} from 'lucide-react'

interface Exercise {
  id: string
  title: string
  domain: string
  difficulty: 'facile' | 'moyen' | 'difficile'
  estimatedTime: number // en minutes
  status: 'en_cours' | 'termine' | 'en_attente' | 'non_commence'
  submittedAt?: Date
  completedAt?: Date
  score?: number
}

interface WeeklySchedule {
  day: string
  date: string
  activities: Array<{
    time: string
    title: string
    type: 'cours' | 'exercice' | 'projet' | 'revision'
    duration: number
    status: 'planifie' | 'en_cours' | 'termine'
  }>
}

export default function ExercisesTab() {
  const [currentTime] = useState(new Date())
  
  // Données simulées pour les exercices
  const exercises: Exercise[] = [
    {
      id: '1',
      title: 'Addition avec retenue',
      domain: 'Mathématiques',
      difficulty: 'facile',
      estimatedTime: 15,
      status: 'en_cours',
      submittedAt: new Date(Date.now() - 16 * 60 * 1000), // 16 minutes ago
      score: 85
    },
    {
      id: '2',
      title: 'Problèmes de logique',
      domain: 'Mathématiques',
      difficulty: 'moyen',
      estimatedTime: 20,
      status: 'en_attente',
      submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 heures ago
    },
    {
      id: '3',
      title: 'Lecture de texte court',
      domain: 'Français',
      difficulty: 'facile',
      estimatedTime: 10,
      status: 'termine',
      completedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      score: 92
    },
    {
      id: '4',
      title: 'Introduction à l\'IA',
      domain: 'Sciences',
      difficulty: 'difficile',
      estimatedTime: 25,
      status: 'non_commence'
    }
  ]

  // Planning hebdomadaire simulé
  const weeklySchedule: WeeklySchedule[] = [
    {
      day: 'Lundi',
      date: '25 août',
      activities: [
        { time: '09:00', title: 'Objectifs de la semaine', type: 'cours', duration: 15, status: 'termine' },
        { time: '10:15', title: 'Cours Mathématiques', type: 'cours', duration: 45, status: 'termine' },
        { time: '11:15', title: 'Dojo Addition', type: 'exercice', duration: 30, status: 'termine' },
        { time: '14:00', title: 'Projet Calcul', type: 'projet', duration: 60, status: 'en_cours' }
      ]
    },
    {
      day: 'Mardi',
      date: '26 août',
      activities: [
        { time: '09:00', title: 'Week 13: IA & Logique', type: 'cours', duration: 45, status: 'planifie' },
        { time: '09:15', title: 'Live Coding', type: 'exercice', duration: 30, status: 'planifie' },
        { time: '10:15', title: 'Support individuel', type: 'cours', duration: 30, status: 'planifie' },
        { time: '11:15', title: 'Quêtes Mathématiques', type: 'exercice', duration: 45, status: 'planifie' },
        { time: '14:00', title: 'Projet IA', type: 'projet', duration: 90, status: 'planifie' }
      ]
    },
    {
      day: 'Mercredi',
      date: '27 août',
      activities: [
        { time: '09:00', title: 'Stand Up', type: 'cours', duration: 15, status: 'planifie' },
        { time: '09:15', title: 'Support individuel', type: 'cours', duration: 30, status: 'planifie' },
        { time: '11:11', title: 'Quêtes Français', type: 'exercice', duration: 45, status: 'planifie' },
        { time: '14:00', title: 'Travail autonome', type: 'revision', duration: 120, status: 'planifie' }
      ]
    },
    {
      day: 'Jeudi',
      date: '28 août',
      activities: [
        { time: '09:00', title: 'Stand Up', type: 'cours', duration: 15, status: 'planifie' },
        { time: '09:15', title: 'Dojo Logique', type: 'exercice', duration: 30, status: 'planifie' },
        { time: '11:11', title: 'Quêtes Sciences', type: 'exercice', duration: 45, status: 'planifie' },
        { time: '14:00', title: 'Projet Final', type: 'projet', duration: 120, status: 'planifie' }
      ]
    },
    {
      day: 'Vendredi',
      date: '29 août',
      activities: [
        { time: '09:00', title: 'Dojo Final', type: 'exercice', duration: 45, status: 'planifie' },
        { time: '11:00', title: 'Veille technologique', type: 'cours', duration: 30, status: 'planifie' },
        { time: '15:00', title: 'Rétrospective', type: 'cours', duration: 45, status: 'planifie' },
        { time: '16:00', title: 'Quiz de fin de semaine', type: 'exercice', duration: 30, status: 'planifie' }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'en_cours':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'termine':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'en_attente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'planifie':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'facile':
        return 'bg-green-100 text-green-800'
      case 'moyen':
        return 'bg-yellow-100 text-yellow-800'
      case 'difficile':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffMins < 60) {
      return `depuis ${diffMins} minute${diffMins > 1 ? 's' : ''}`
    } else {
      return `depuis ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      {/* En-tête des exercices */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-8 rounded-xl">
        <h1 className="text-3xl font-bold mb-2">📚 Bibliothèque d'exercices</h1>
        <p className="text-orange-100 text-lg">
          Découvrez et pratiquez des exercices adaptés à votre niveau
        </p>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Target size={20} />
            <span>Objectifs de la semaine: {weeklySchedule[0].activities.length} activités</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <span>Lundi 25 août 2025 → Dimanche 31 août 2025</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Planning hebdomadaire - 2 colonnes */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar size={20} />
              Planning hebdomadaire
            </h3>
            
            <div className="space-y-4">
              {weeklySchedule.map((day, dayIndex) => (
                <motion.div 
                  key={day.day}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: dayIndex * 0.1 }}
                >
                  {/* En-tête du jour */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{day.day} {day.date}</h4>
                  </div>
                  
                  {/* Activités du jour */}
                  <div className="divide-y divide-gray-100">
                    {day.activities.map((activity, activityIndex) => (
                      <div key={activityIndex} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-16 text-sm font-mono text-gray-600">
                              {activity.time}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{activity.title}</div>
                              <div className="text-sm text-gray-500">
                                {activity.type} • {activity.duration} min
                              </div>
                            </div>
                          </div>
                          
                          <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(activity.status)}`}>
                            {activity.status === 'en_cours' ? 'En cours' :
                             activity.status === 'termine' ? 'Terminé' : 'Planifié'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Exercices en cours et statuts - 1 colonne */}
        <div className="space-y-6">
          {/* Exercices en attente de correction */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={18} />
              En attente de correction
            </h4>
            
            <div className="space-y-3">
              {exercises.filter(e => e.status === 'en_attente').map((exercise) => (
                <div key={exercise.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="font-medium text-yellow-900">{exercise.title}</div>
                  <div className="text-sm text-yellow-700">{exercise.domain}</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {exercise.submittedAt && getTimeAgo(exercise.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quêtes en cours */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target size={18} />
              Quêtes en cours
            </h4>
            
            <div className="space-y-3">
              {exercises.filter(e => e.status === 'en_cours').map((exercise) => (
                <div key={exercise.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-900">{exercise.title}</div>
                  <div className="text-sm text-blue-700">{exercise.domain}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                      {exercise.difficulty}
                    </span>
                    <span className="text-xs text-blue-600">
                      {exercise.estimatedTime} min
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {exercise.submittedAt && getTimeAgo(exercise.submittedAt)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp size={18} />
              Progression
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Exercices terminés</span>
                <span className="font-bold text-green-600">
                  {exercises.filter(e => e.status === 'termine').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">En cours</span>
                <span className="font-bold text-blue-600">
                  {exercises.filter(e => e.status === 'en_cours').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">En attente</span>
                <span className="font-bold text-yellow-600">
                  {exercises.filter(e => e.status === 'en_attente').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Score moyen</span>
                <span className="font-bold text-purple-600">
                  {Math.round(exercises.filter(e => e.score).reduce((acc, e) => acc + (e.score || 0), 0) / exercises.filter(e => e.score).length)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 