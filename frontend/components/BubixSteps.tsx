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
  status: 'pending' | 'active' | 'completed' | 'error'
}

export default function BubixSteps({ isVisible, currentStep, isCompleted, error }: BubixStepsProps) {
  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'auth',
      title: 'Vérification d\'authentification',
      description: 'Validation du token JWT et des permissions',
      icon: Shield,
      status: 'pending'
    },
    {
      id: 'parent',
      title: 'Vérification du compte parent',
      description: 'Contrôle de l\'email et du statut du compte',
      icon: Shield,
      status: 'pending'
    },
    {
      id: 'child',
      title: 'Vérification de la session enfant',
      description: 'Validation de l\'appartenance et du statut',
      icon: Shield,
      status: 'pending'
    },
    {
      id: 'security',
      title: 'Contrôle de sécurité avancé',
      description: 'Détection des conflits et vérifications croisées',
      icon: Shield,
      status: 'pending'
    },
    {
      id: 'data',
      title: 'Récupération des données',
      description: 'Collecte des informations réelles de l\'enfant',
      icon: Database,
      status: 'pending'
    },
    {
      id: 'ai',
      title: 'Traitement par l\'IA',
      description: 'Analyse et génération du rapport par Bubix',
      icon: Brain,
      status: 'pending'
    }
  ])

  useEffect(() => {
    if (!isVisible) {
      // Reset all steps when not visible
      setSteps(prev => prev.map(step => ({ ...step, status: 'pending' })))
      return
    }

    // Update steps based on current step
    setSteps(prev => prev.map(step => {
      if (step.id === currentStep) {
        return { ...step, status: 'active' }
      } else if (prev.findIndex(s => s.id === step.id) < prev.findIndex(s => s.id === currentStep)) {
        return { ...step, status: 'completed' }
      } else {
        return { ...step, status: 'pending' }
      }
    }))
  }, [isVisible, currentStep])

  useEffect(() => {
    if (error) {
      setSteps(prev => prev.map(step => 
        step.id === currentStep ? { ...step, status: 'error' } : step
      ))
    }
  }, [error, currentStep])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Brain className="w-5 h-5 text-blue-600" />
        <h4 className="font-semibold text-blue-800">Bubix en action</h4>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="ml-auto"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
          </motion.div>
        )}
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {steps.map((step, index) => {
            const IconComponent = step.icon
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-2 rounded-md transition-all duration-300 ${
                  step.status === 'active' 
                    ? 'bg-blue-100 border border-blue-300' 
                    : step.status === 'completed'
                    ? 'bg-green-50 border border-green-200'
                    : step.status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-gray-50'
                }`}
              >
                <div className={`flex-shrink-0 ${
                  step.status === 'active' 
                    ? 'text-blue-600' 
                    : step.status === 'completed'
                    ? 'text-green-600'
                    : step.status === 'error'
                    ? 'text-red-600'
                    : 'text-gray-400'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : step.status === 'error' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : step.status === 'active' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Clock className="w-4 h-4" />
                    </motion.div>
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${
                    step.status === 'active' 
                      ? 'text-blue-800' 
                      : step.status === 'completed'
                      ? 'text-green-800'
                      : step.status === 'error'
                      ? 'text-red-800'
                      : 'text-gray-600'
                  }`}>
                    {step.title}
                  </p>
                  <p className={`text-xs ${
                    step.status === 'active' 
                      ? 'text-blue-600' 
                      : step.status === 'completed'
                      ? 'text-green-600'
                      : step.status === 'error'
                      ? 'text-red-600'
                      : 'text-gray-500'
                  }`}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-sm text-red-800 font-medium">Erreur détectée</p>
          </div>
          <p className="text-xs text-red-600 mt-1">{error}</p>
        </motion.div>
      )}

      {isCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <p className="text-sm text-green-800 font-medium">Analyse terminée avec succès !</p>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
