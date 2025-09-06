'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  User, 
  Child, 
  CheckCircle, 
  Clock, 
  Brain, 
  FileText,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'loading' | 'completed' | 'error';
  duration?: number;
}

interface BubixProgressProps {
  isVisible: boolean;
  steps: ProgressStep[];
  currentStep: string;
  onComplete?: () => void;
}

export default function BubixProgress({ 
  isVisible, 
  steps, 
  currentStep, 
  onComplete 
}: BubixProgressProps) {
  // Vérification de sécurité
  if (!isVisible || !steps || steps.length === 0) {
    return null;
  }

  const getStepIcon = (step: ProgressStep) => {
    if (step.status === 'completed') {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (step.status === 'loading') {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
    } else if (step.status === 'error') {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    } else {
      return step.icon;
    }
  };

  const getStepColor = (step: ProgressStep) => {
    if (step.status === 'completed') {
      return 'border-green-200 bg-green-50';
    } else if (step.status === 'loading') {
      return 'border-blue-200 bg-blue-50';
    } else if (step.status === 'error') {
      return 'border-red-200 bg-red-50';
    } else {
      return 'border-gray-200 bg-gray-50';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            {/* En-tête */}
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <Brain className="w-8 h-8 text-purple-600" />
                <h2 className="text-xl font-bold text-gray-900">Bubix en action</h2>
              </div>
              <p className="text-sm text-gray-600">
                Analyse en cours... Veuillez patienter
              </p>
            </div>

            {/* Barre de progression globale */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Étapes détaillées */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${getStepColor(step)}`}
                >
                  <div className="flex-shrink-0">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium ${
                      step.status === 'completed' ? 'text-green-900' :
                      step.status === 'loading' ? 'text-blue-900' :
                      step.status === 'error' ? 'text-red-900' :
                      'text-gray-900'
                    }`}>
                      {step.title}
                    </h4>
                    <p className={`text-xs ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'loading' ? 'text-blue-700' :
                      step.status === 'error' ? 'text-red-700' :
                      'text-gray-600'
                    }`}>
                      {step.description}
                    </p>
                    {step.status === 'loading' && step.duration && (
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">
                          {step.duration}s
                        </span>
                      </div>
                    )}
                  </div>
                  {step.status === 'loading' && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Message de statut */}
            <div className="mt-6 text-center">
              {steps.every(step => step.status === 'completed') ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-green-600"
                >
                  <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                  <p className="text-sm font-medium">Analyse terminée !</p>
                </motion.div>
              ) : (
                <div className="text-gray-600">
                  <Clock className="w-4 h-4 mx-auto mb-1" />
                  <p className="text-xs">
                    {steps.find(step => step.status === 'loading')?.title || 'Préparation...'}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Fonction utilitaire pour créer les étapes par défaut
export function createBubixSteps(): ProgressStep[] {
  return [
    {
      id: 'auth',
      title: 'Vérification d\'authentification',
      description: 'Validation du token JWT et des permissions',
      icon: <Shield className="w-5 h-5 text-gray-600" />,
      status: 'pending'
    },
    {
      id: 'parent_verification',
      title: 'Vérification du compte parent',
      description: 'Contrôle de l\'email et du statut du compte',
      icon: <User className="w-5 h-5 text-gray-600" />,
      status: 'pending'
    },
    {
      id: 'child_verification',
      title: 'Vérification de la session enfant',
      description: 'Validation de l\'appartenance et du statut',
      icon: <Child className="w-5 h-5 text-gray-600" />,
      status: 'pending'
    },
    {
      id: 'security_check',
      title: 'Contrôle de sécurité avancé',
      description: 'Détection des conflits et vérifications croisées',
      icon: <Shield className="w-5 h-5 text-gray-600" />,
      status: 'pending'
    },
    {
      id: 'data_retrieval',
      title: 'Récupération des données',
      description: 'Collecte des informations réelles de l\'enfant',
      icon: <FileText className="w-5 h-5 text-gray-600" />,
      status: 'pending'
    },
    {
      id: 'ai_processing',
      title: 'Traitement par l\'IA',
      description: 'Analyse et génération du rapport par Bubix',
      icon: <Brain className="w-5 h-5 text-gray-600" />,
      status: 'pending'
    }
  ];
}
