'use client'

import { useMemo } from 'react'
import { getAgeSegment, adaptTextForAge, getAgeAppropriateColors, isFeatureAvailable } from '../lib/ageSegmentation'

interface UseAgeAdaptationProps {
  age?: number
  defaultAge?: number
}

/**
 * Hook pour adapter l'interface selon l'âge de l'enfant
 */
export function useAgeAdaptation({ age, defaultAge = 8 }: UseAgeAdaptationProps = {}) {
  const childAge = age || defaultAge
  
  const ageSegment = useMemo(() => getAgeSegment(childAge), [childAge])
  const colors = useMemo(() => getAgeAppropriateColors(childAge), [childAge])
  
  const adaptText = useMemo(() => {
    return (texts: { simple: string; intermediate: string; advanced: string }) => 
      adaptTextForAge(childAge, texts)
  }, [childAge])
  
  const isFeatureEnabled = useMemo(() => {
    return (feature: string) => {
      switch (feature) {
        case 'weeklyCycle':
          return isFeatureAvailable(childAge, 'showWeeklyCycle')
        case 'advancedStats':
          return isFeatureAvailable(childAge, 'showAdvancedStats')
        case 'competenceDetails':
          return isFeatureAvailable(childAge, 'showCompetenceDetails')
        case 'progressTracking':
          return isFeatureAvailable(childAge, 'showProgressTracking')
        case 'comparison':
          return isFeatureAvailable(childAge, 'enableComparison')
        default:
          return true
      }
    }
  }, [childAge])
  
  const getAgeAppropriateUI = useMemo(() => {
    return {
      // Tailles de police adaptées
      fontSize: {
        title: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'text-2xl' : 
               ageSegment.ui.layoutComplexity === 'MODERATE' ? 'text-3xl' : 'text-4xl',
        subtitle: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'text-lg' : 
                  ageSegment.ui.layoutComplexity === 'MODERATE' ? 'text-xl' : 'text-2xl',
        body: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'text-base' : 
              ageSegment.ui.layoutComplexity === 'MODERATE' ? 'text-lg' : 'text-xl'
      },
      
      // Espacement adapté
      spacing: {
        section: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'mb-6' : 
                 ageSegment.ui.layoutComplexity === 'MODERATE' ? 'mb-8' : 'mb-12',
        element: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'mb-3' : 
                 ageSegment.ui.layoutComplexity === 'MODERATE' ? 'mb-4' : 'mb-6'
      },
      
      // Grilles adaptées
      grid: {
        competences: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'grid-cols-1 md:grid-cols-2' : 
                     ageSegment.ui.layoutComplexity === 'MODERATE' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 
                     'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      },
      
      // Animations adaptées
      animation: {
        duration: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'duration-300' : 
                  ageSegment.ui.layoutComplexity === 'MODERATE' ? 'duration-500' : 'duration-700',
        delay: ageSegment.ui.layoutComplexity === 'SIMPLE' ? 0.1 : 
               ageSegment.ui.layoutComplexity === 'MODERATE' ? 0.15 : 0.2
      }
    }
  }, [ageSegment])
  
  const getMotivationalMessage = useMemo(() => {
    return (context: 'success' | 'encouragement' | 'challenge') => {
      const messages = {
        success: {
          simple: ['Super ! 🌟', 'Bravo ! 🎉', 'Génial ! ✨'],
          intermediate: ['Excellent travail ! 🚀', 'Tu progresses bien ! 💪', 'Continue comme ça ! ⭐'],
          advanced: ['Performance remarquable ! 🏆', 'Maîtrise excellente ! 🎯', 'Objectif atteint ! 🏅']
        },
        encouragement: {
          simple: ['Tu peux y arriver ! 💪', 'Essaie encore ! 🌈', 'Tu apprends ! 📚'],
          intermediate: ['Persévère, tu y es presque ! 🎯', 'Chaque effort compte ! 💫', 'Tu progresses ! 📈'],
          advanced: ['La persévérance mène au succès ! 🏔️', 'Chaque défi est une opportunité ! 🚀', 'Excellence en vue ! 🎖️']
        },
        challenge: {
          simple: ['Prêt pour un nouveau jeu ? 🎮', 'Une nouvelle aventure ! 🗺️', 'Découvrons ensemble ! 🔍'],
          intermediate: ['Prêt pour le défi suivant ? ⚡', 'Nouveau niveau débloqué ! 🔓', 'Mission suivante ! 🎯'],
          advanced: ['Défi avancé disponible ! 🏆', 'Objectif supérieur activé ! 🎖️', 'Expertise en développement ! 🧠']
        }
      }
      
      const levelMessages = messages[context][ageSegment.language.level.toLowerCase() as keyof typeof messages[typeof context]]
      return levelMessages[Math.floor(Math.random() * levelMessages.length)]
    }
  }, [ageSegment])
  
  return {
    age: childAge,
    segment: ageSegment,
    colors,
    adaptText,
    isFeatureEnabled,
    ui: getAgeAppropriateUI,
    getMotivationalMessage,
    
    // Raccourcis utiles
    isYoungChild: childAge <= 7,
    isMiddleChild: childAge >= 8 && childAge <= 11,
    isOlderChild: childAge >= 12,
    
    // Helpers pour les composants
    getButtonSize: () => ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'lg' : 
                         ageSegment.ui.layoutComplexity === 'MODERATE' ? 'xl' : '2xl',
    getIconSize: () => ageSegment.ui.layoutComplexity === 'SIMPLE' ? 'w-6 h-6' : 
                       ageSegment.ui.layoutComplexity === 'MODERATE' ? 'w-8 h-8' : 'w-10 h-10',
    shouldShowFeature: (feature: string) => isFeatureEnabled(feature)
  }
}

export default useAgeAdaptation
