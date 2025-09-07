'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, 
  Code, 
  Palette, 
  Globe, 
  BarChart3, 
  Heart,
  Calendar,
  Clock,
  Target,
  Sparkles,
  CheckCircle,
  Circle
} from 'lucide-react'
import { useLearningCycles } from '@/hooks/useLearningCycles'

interface WeeklyCycleProps {
  childName: string
  currentDay: string
  childSessionId?: string
  onDayClick?: (day: string) => void
  showProgress?: boolean
  interactive?: boolean // Permet de marquer les jours comme complétés
}

const WEEKLY_CYCLE = {
  monday: {
    name: 'Lundi',
    focus: 'MathCube rigoureux',
    principle: 'singapore',
    description: 'Apprentissage structuré des mathématiques',
    icon: BookOpen,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  },
  tuesday: {
    name: 'Mardi',
    focus: 'CodeCube logique',
    principle: 'estonia',
    description: 'Développement des compétences numériques',
    icon: Code,
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  wednesday: {
    name: 'Mercredi',
    focus: 'PlayCube créatif',
    principle: 'reggio',
    description: 'Expression libre et créativité',
    icon: Palette,
    color: 'from-pink-500 to-pink-600',
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200'
  },
  thursday: {
    name: 'Jeudi',
    focus: 'ScienceCube transdisciplinaire',
    principle: 'ib',
    description: 'Projets globaux et interdisciplinaires',
    icon: Globe,
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  friday: {
    name: 'Vendredi',
    focus: 'Auto-évaluation + radar',
    principle: 'finland',
    description: 'Bilan personnel et bien-être',
    icon: BarChart3,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200'
  },
  weekend: {
    name: 'Week-end',
    focus: 'Activités libres parent-enfant',
    principle: 'reggio',
    description: 'Temps familial et projets ouverts',
    icon: Heart,
    color: 'from-red-500 to-red-600',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  }
}

export default function WeeklyCycle({ 
  childName, 
  currentDay, 
  childSessionId,
  onDayClick,
  showProgress = true,
  interactive = false
}: WeeklyCycleProps) {
  const { currentCycle, loading, error, markDayCompleted } = useLearningCycles(childSessionId);
  
  const getCurrentDayInfo = () => {
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof WEEKLY_CYCLE;
    return WEEKLY_CYCLE[today] || WEEKLY_CYCLE.monday;
  };

  const currentDayInfo = getCurrentDayInfo();
  const completedDays = currentCycle?.completedDays || [];
  const progressPercentage = (completedDays.length / 6) * 100;

  // Vérification de sécurité pour éviter les erreurs de rendu
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Cycle d'apprentissage hebdomadaire</h3>
          </div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-20 bg-gray-200 rounded-xl"></div>
          <div className="h-16 bg-gray-200 rounded-xl"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Cycle d'apprentissage hebdomadaire</h3>
          </div>
          <p className="text-sm text-red-600">Erreur: {error}</p>
        </div>
      </div>
    );
  }

  const handleDayClick = async (dayKey: string) => {
    if (interactive && !completedDays.includes(dayKey)) {
      try {
        await markDayCompleted(dayKey);
        onDayClick?.(dayKey);
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    } else {
      onDayClick?.(dayKey);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête du cycle */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Cycle d'apprentissage hebdomadaire</h3>
        </div>
        <p className="text-sm text-gray-600">
          Programme pédagogique adapté pour {childName}
        </p>
      </div>

      {/* Jour actuel mis en avant */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${currentDayInfo.bgColor} ${currentDayInfo.borderColor} border-2 rounded-xl p-4 shadow-sm`}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg bg-gradient-to-r ${currentDayInfo.color} text-white`}>
            <currentDayInfo.icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className={`font-semibold ${currentDayInfo.textColor}`}>
              Aujourd'hui - {currentDayInfo.name}
            </h4>
            <p className="text-sm text-gray-600">{currentDayInfo.focus}</p>
          </div>
        </div>
        <p className={`text-sm ${currentDayInfo.textColor} font-medium`}>
          {currentDayInfo.description}
        </p>
      </motion.div>

      {/* Progression hebdomadaire */}
      {showProgress && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-gray-900">Progression de la semaine</h4>
            <span className="text-sm text-gray-600">{completedDays.length}/6 jours</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {progressPercentage.toFixed(0)}% de la semaine complétée
          </p>
        </div>
      )}

      {/* Grille des jours de la semaine */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Object.entries(WEEKLY_CYCLE).map(([dayKey, dayInfo], index) => {
          const isCompleted = completedDays.includes(dayKey);
          const isCurrentDay = dayKey === currentDay;
          const IconComponent = dayInfo.icon;

          return (
            <motion.div
              key={dayKey}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleDayClick(dayKey)}
              className={`
                ${dayInfo.bgColor} ${dayInfo.borderColor} border rounded-lg p-3 cursor-pointer transition-all duration-200
                ${isCompleted ? 'ring-2 ring-green-400' : ''}
                ${isCurrentDay ? 'ring-2 ring-blue-400 shadow-md' : 'hover:shadow-sm'}
                ${(onDayClick || interactive) ? 'hover:scale-105' : ''}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-md bg-gradient-to-r ${dayInfo.color} text-white`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h5 className={`text-sm font-semibold ${dayInfo.textColor}`}>
                    {dayInfo.name}
                  </h5>
                  {isCompleted && (
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">Terminé</span>
                    </div>
                  )}
                  {isCurrentDay && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-600" />
                      <span className="text-xs text-blue-600 font-medium">En cours</span>
                    </div>
                  )}
                </div>
              </div>
              <p className={`text-xs ${dayInfo.textColor} font-medium`}>
                {dayInfo.focus}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Conseils pédagogiques */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <h4 className="font-semibold text-blue-900">Conseil pédagogique</h4>
        </div>
        <p className="text-sm text-blue-800">
          {currentDayInfo.principle === 'singapore' && 
            "Encouragez {childName} à visualiser les concepts mathématiques avec des objets concrets avant de passer à l'abstraction."}
          {currentDayInfo.principle === 'estonia' && 
            "Proposez à {childName} des défis de programmation créatifs pour développer sa logique et sa créativité numérique."}
          {currentDayInfo.principle === 'reggio' && 
            "Laissez {childName} s'exprimer librement à travers différents médiums : dessin, musique, narration ou code."}
          {currentDayInfo.principle === 'ib' && 
            "Aidez {childName} à faire des connexions entre les différentes matières et à comprendre le monde qui l'entoure."}
          {currentDayInfo.principle === 'finland' && 
            "Prenez le temps de faire un bilan bienveillant avec {childName} sur ses apprentissages et ses progrès."}
        </p>
      </div>
    </div>
  )
}
