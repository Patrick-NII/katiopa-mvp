/**
 * Système de segmentation par âge pour CubeAI
 * Adapte l'interface, le contenu et la difficulté selon l'âge de l'enfant
 */

export type AgeGroup = 'TODDLER' | 'PRESCHOOL' | 'EARLY_PRIMARY' | 'LATE_PRIMARY' | 'MIDDLE_SCHOOL'

export interface AgeSegment {
  id: AgeGroup
  name: string
  ageRange: string
  minAge: number
  maxAge: number
  description: string
  characteristics: string[]
  features: {
    showWeeklyCycle: boolean
    showAdvancedStats: boolean
    showCompetenceDetails: boolean
    showProgressTracking: boolean
    maxExerciseDifficulty: number
    enableComparison: boolean
  }
  language: {
    level: 'SIMPLE' | 'INTERMEDIATE' | 'ADVANCED'
    vocabulary: 'BASIC' | 'STANDARD' | 'RICH'
    explanations: 'MINIMAL' | 'DETAILED' | 'COMPREHENSIVE'
  }
  ui: {
    colorScheme: 'PLAYFUL' | 'BALANCED' | 'MATURE'
    iconStyle: 'EMOJI' | 'MIXED' | 'PROFESSIONAL'
    layoutComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX'
  }
}

export const AGE_SEGMENTS: Record<AgeGroup, AgeSegment> = {
  TODDLER: {
    id: 'TODDLER',
    name: 'Tout-petits',
    ageRange: '4-5 ans',
    minAge: 4,
    maxAge: 5,
    description: 'Découverte ludique et premiers apprentissages',
    characteristics: [
      'Attention courte (5-10 minutes)',
      'Apprentissage par le jeu',
      'Besoin de répétition',
      'Motivation par les récompenses visuelles'
    ],
    features: {
      showWeeklyCycle: false,
      showAdvancedStats: false,
      showCompetenceDetails: false,
      showProgressTracking: true,
      maxExerciseDifficulty: 2,
      enableComparison: false
    },
    language: {
      level: 'SIMPLE',
      vocabulary: 'BASIC',
      explanations: 'MINIMAL'
    },
    ui: {
      colorScheme: 'PLAYFUL',
      iconStyle: 'EMOJI',
      layoutComplexity: 'SIMPLE'
    }
  },
  PRESCHOOL: {
    id: 'PRESCHOOL',
    name: 'Maternelle',
    ageRange: '6-7 ans',
    minAge: 6,
    maxAge: 7,
    description: 'Apprentissages fondamentaux et développement de l\'autonomie',
    characteristics: [
      'Attention moyenne (10-15 minutes)',
      'Curiosité naturelle',
      'Début de la logique',
      'Plaisir de la découverte'
    ],
    features: {
      showWeeklyCycle: false,
      showAdvancedStats: false,
      showCompetenceDetails: true,
      showProgressTracking: true,
      maxExerciseDifficulty: 3,
      enableComparison: false
    },
    language: {
      level: 'SIMPLE',
      vocabulary: 'BASIC',
      explanations: 'MINIMAL'
    },
    ui: {
      colorScheme: 'PLAYFUL',
      iconStyle: 'EMOJI',
      layoutComplexity: 'SIMPLE'
    }
  },
  EARLY_PRIMARY: {
    id: 'EARLY_PRIMARY',
    name: 'Primaire début',
    ageRange: '8-9 ans',
    minAge: 8,
    maxAge: 9,
    description: 'Consolidation des bases et développement de la réflexion',
    characteristics: [
      'Attention soutenue (15-20 minutes)',
      'Capacité d\'abstraction émergente',
      'Goût pour les défis',
      'Début de l\'esprit critique'
    ],
    features: {
      showWeeklyCycle: true,
      showAdvancedStats: false,
      showCompetenceDetails: true,
      showProgressTracking: true,
      maxExerciseDifficulty: 4,
      enableComparison: true
    },
    language: {
      level: 'INTERMEDIATE',
      vocabulary: 'STANDARD',
      explanations: 'DETAILED'
    },
    ui: {
      colorScheme: 'BALANCED',
      iconStyle: 'MIXED',
      layoutComplexity: 'MODERATE'
    }
  },
  LATE_PRIMARY: {
    id: 'LATE_PRIMARY',
    name: 'Primaire fin',
    ageRange: '10-11 ans',
    minAge: 10,
    maxAge: 11,
    description: 'Approfondissement et préparation au collège',
    characteristics: [
      'Attention prolongée (20-30 minutes)',
      'Pensée abstraite développée',
      'Autonomie dans l\'apprentissage',
      'Intérêt pour la complexité'
    ],
    features: {
      showWeeklyCycle: true,
      showAdvancedStats: true,
      showCompetenceDetails: true,
      showProgressTracking: true,
      maxExerciseDifficulty: 5,
      enableComparison: true
    },
    language: {
      level: 'INTERMEDIATE',
      vocabulary: 'STANDARD',
      explanations: 'DETAILED'
    },
    ui: {
      colorScheme: 'BALANCED',
      iconStyle: 'MIXED',
      layoutComplexity: 'MODERATE'
    }
  },
  MIDDLE_SCHOOL: {
    id: 'MIDDLE_SCHOOL',
    name: 'Collège',
    ageRange: '12+ ans',
    minAge: 12,
    maxAge: 18,
    description: 'Maîtrise avancée et spécialisation',
    characteristics: [
      'Attention soutenue (30+ minutes)',
      'Pensée critique développée',
      'Recherche d\'autonomie',
      'Intérêt pour la performance'
    ],
    features: {
      showWeeklyCycle: true,
      showAdvancedStats: true,
      showCompetenceDetails: true,
      showProgressTracking: true,
      maxExerciseDifficulty: 5,
      enableComparison: true
    },
    language: {
      level: 'ADVANCED',
      vocabulary: 'RICH',
      explanations: 'COMPREHENSIVE'
    },
    ui: {
      colorScheme: 'MATURE',
      iconStyle: 'PROFESSIONAL',
      layoutComplexity: 'COMPLEX'
    }
  }
}

/**
 * Détermine la tranche d'âge d'un enfant
 */
export function getAgeGroup(age: number): AgeGroup {
  if (age <= 5) return 'TODDLER'
  if (age <= 7) return 'PRESCHOOL'
  if (age <= 9) return 'EARLY_PRIMARY'
  if (age <= 11) return 'LATE_PRIMARY'
  return 'MIDDLE_SCHOOL'
}

/**
 * Calcule l'âge à partir d'une date de naissance
 */
export function calculateAge(birthDate: string | Date): number {
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

/**
 * Obtient les informations de segmentation pour un âge donné
 */
export function getAgeSegment(age: number): AgeSegment {
  const ageGroup = getAgeGroup(age)
  return AGE_SEGMENTS[ageGroup]
}

/**
 * Vérifie si une fonctionnalité est disponible pour un âge donné
 */
export function isFeatureAvailable(age: number, feature: keyof AgeSegment['features']): boolean {
  const segment = getAgeSegment(age)
  return segment.features[feature] as boolean
}

/**
 * Obtient le niveau de difficulté maximum pour un âge donné
 */
export function getMaxDifficulty(age: number): number {
  const segment = getAgeSegment(age)
  return segment.features.maxExerciseDifficulty
}

/**
 * Adapte le texte selon l'âge de l'enfant
 */
export function adaptTextForAge(age: number, texts: {
  simple: string
  intermediate: string
  advanced: string
}): string {
  const segment = getAgeSegment(age)
  
  switch (segment.language.level) {
    case 'SIMPLE':
      return texts.simple
    case 'INTERMEDIATE':
      return texts.intermediate
    case 'ADVANCED':
      return texts.advanced
    default:
      return texts.intermediate
  }
}

/**
 * Obtient les couleurs adaptées à l'âge
 */
export function getAgeAppropriateColors(age: number) {
  const segment = getAgeSegment(age)
  
  switch (segment.ui.colorScheme) {
    case 'PLAYFUL':
      return {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        accent: '#45B7D1',
        success: '#96CEB4',
        warning: '#FFEAA7',
        background: 'from-pink-50 to-blue-50'
      }
    case 'BALANCED':
      return {
        primary: '#667EEA',
        secondary: '#764BA2',
        accent: '#F093FB',
        success: '#4FACFE',
        warning: '#43E97B',
        background: 'from-purple-50 to-blue-50'
      }
    case 'MATURE':
      return {
        primary: '#2D3748',
        secondary: '#4A5568',
        accent: '#667EEA',
        success: '#48BB78',
        warning: '#ED8936',
        background: 'from-gray-50 to-blue-50'
      }
    default:
      return {
        primary: '#667EEA',
        secondary: '#764BA2',
        accent: '#F093FB',
        success: '#4FACFE',
        warning: '#43E97B',
        background: 'from-purple-50 to-blue-50'
      }
  }
}
