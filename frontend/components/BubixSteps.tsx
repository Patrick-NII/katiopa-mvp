'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, Shield, Database, Brain, AlertCircle } from 'lucide-react'

interface BubixStepsProps {
  isVisible: boolean
  currentStep: string
  isCompleted: boolean
  error?: string
}

interface Step {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  percentage: number
}

export default function BubixSteps({ isVisible, currentStep, isCompleted, error }: BubixStepsProps) {
  const [currentStepData, setCurrentStepData] = useState<Step | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const steps: Step[] = [
    {
      id: 'auth',
      title: 'Vérification d\'authentification',
      description: 'Validation du token JWT et des permissions',
      icon: Shield,
      percentage: 10
    },
    {
      id: 'parent',
      title: 'Vérification du compte parent',
      description: 'Contrôle de l\'email et du statut du compte',
      icon: Shield,
      percentage: 20
    },
    {
      id: 'child',
      title: 'Vérification de la session enfant',
      description: 'Validation de l\'appartenance et du statut',
      icon: Shield,
      percentage: 30
    },
    {
      id: 'security',
      title: 'Contrôle de sécurité avancé',
      description: 'Détection des conflits et vérifications croisées',
      icon: Shield,
      percentage: 40
    },
    {
      id: 'data',
      title: 'Récupération des données',
      description: 'Collecte des informations réelles de l\'enfant',
      icon: Database,
      percentage: 60
    },
    {
      id: 'ai',
      title: 'Traitement par l\'IA',
      description: 'Analyse et génération du rapport par Bubix',
      icon: Brain,
      percentage: 100
    }
  ];

  useEffect(() => {
    if (!isVisible) {
      setCurrentStepData(null);
      setProgressPercentage(0);
      return;
    }

    const step = steps.find(s => s.id === currentStep);
    if (step) {
      setCurrentStepData(step);
      setProgressPercentage(step.percentage);
    }
  }, [isVisible, currentStep]);

  if (!isVisible) return null;

  const IconComponent = currentStepData?.icon || Brain;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-200 rounded-xl p-4 mt-3 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <motion.div
              animate={{ 
                scale: isCompleted ? 1 : [1, 1.1, 1],
                rotate: isCompleted ? 0 : [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2, 
                repeat: isCompleted ? 0 : Infinity, 
                ease: "easeInOut" 
              }}
              className={`p-2 rounded-lg ${
                isCompleted 
                  ? 'bg-mint-100 text-mint-600' 
                  : error
                  ? 'bg-red-100 text-red-600'
                  : 'bg-sky-100 text-sky-600'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="w-5 h-5" />
              ) : error ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <IconComponent className="w-5 h-5" />
              )}
            </motion.div>
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 text-sm">
              {isCompleted ? 'Analyse terminée' : error ? 'Erreur détectée' : 'Bubix en action'}
            </h4>
            <p className="text-xs text-gray-600">
              {isCompleted ? 'Rapport généré avec succès' : error ? 'Une erreur est survenue' : 'Traitement en cours...'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-sky-600">
            {progressPercentage}%
          </div>
          <div className="text-xs text-gray-500">
            Progression
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            className={`h-2 rounded-full ${
              isCompleted 
                ? 'bg-gradient-to-r from-mint-400 to-mint-600' 
                : error
                ? 'bg-gradient-to-r from-red-400 to-red-600'
                : 'bg-gradient-to-r from-sky-400 to-violet-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Étape actuelle */}
      <AnimatePresence mode="wait">
        {currentStepData && !isCompleted && !error && (
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/60 backdrop-blur-sm rounded-lg p-3 border border-white/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="text-sky-600"
                >
                  <Clock className="w-4 h-4" />
                </motion.div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">
                  {currentStepData.title}
                </p>
                <p className="text-xs text-gray-600">
                  {currentStepData.description}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message de succès */}
      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-mint-50 border border-mint-200 rounded-lg p-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-mint-600" />
            <p className="text-sm text-mint-800 font-medium">Analyse terminée avec succès !</p>
          </div>
        </motion.div>
      )}

      {/* Message d'erreur */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-lg p-3"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800 font-medium">Erreur détectée</p>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </motion.div>
      )}
    </motion.div>
  )
}
