/**
 * 🎯 CONFIG BUILDER - PHASE 3
 * 
 * Builder pour créer des configurations de jeu optimisées
 * Intègre les modèles adaptatifs avancés
 */

import { GameConfig, DefaultConfig, mergeConfig, createAgeSpecificConfig } from './cubematch-config'
import { 
  AdvancedDifficultyModel, 
  AdvancedScoringModel, 
  AdvancedTimerModel,
  AdaptiveModelsFactory,
  AdaptationConfig
} from './adaptive-models'
import { 
  AdvancedAddStrategy,
  AdvancedSubStrategy,
  AdvancedMulStrategy,
  AdvancedDivStrategy,
  AdvancedMixedStrategy
} from './operator-strategies'

// ----------------------------
// Types pour le builder
// ----------------------------

export interface GameConfigOptions {
  age: number
  initialDifficulty?: number
  adaptationSpeed?: 'slow' | 'medium' | 'fast'
  useAdvancedModels?: boolean
  gameDuration?: number
  enableLongDecompositions?: boolean
  customOperatorWeights?: Record<string, number>
}

// ----------------------------
// Builder de configuration
// ----------------------------

export class CubeMatchConfigBuilder {
  private options: GameConfigOptions
  private config: Partial<GameConfig>

  constructor(options: GameConfigOptions) {
    this.options = {
      useAdvancedModels: true,
      enableLongDecompositions: true,
      ...options
    }
    this.config = {}
  }

  /**
   * 🎯 Construit la configuration complète
   */
  build(): GameConfig {
    // Commencer avec la configuration de base
    let config = { ...DefaultConfig }

    // Appliquer la configuration spécifique à l'âge
    const ageConfig = createAgeSpecificConfig(this.options.age)
    config = mergeConfig(config, ageConfig)

    // Utiliser les modèles avancés si demandé
    if (this.options.useAdvancedModels) {
      config = this.applyAdvancedModels(config)
    }

    // Appliquer les stratégies d'opérateurs avancées
    config = this.applyAdvancedStrategies(config)

    // Appliquer les options personnalisées
    config = this.applyCustomOptions(config)

    // Fusionner avec la configuration personnalisée
    config = mergeConfig(config, this.config)

    console.log('🎮 Configuration CubeMatch créée:', {
      age: this.options.age,
      difficulty: this.options.initialDifficulty,
      useAdvancedModels: this.options.useAdvancedModels,
      gameDuration: config.gameDurationSec
    })

    return config
  }

  /**
   * 🎯 Applique les modèles adaptatifs avancés
   */
  private applyAdvancedModels(config: GameConfig): GameConfig {
    const adaptationConfig: Partial<AdaptationConfig> = {
      adaptationSpeed: this.options.adaptationSpeed || 'medium'
    }

    return {
      ...config,
      difficultyModel: AdaptiveModelsFactory.createDifficultyModel(this.options.age, adaptationConfig),
      scoring: AdaptiveModelsFactory.createScoringModel(this.options.age),
      timer: AdaptiveModelsFactory.createTimerModel(this.options.age)
    }
  }

  /**
   * 🎯 Applique les stratégies d'opérateurs avancées
   */
  private applyAdvancedStrategies(config: GameConfig): GameConfig {
    return {
      ...config,
      operators: {
        ADD: new AdvancedAddStrategy(),
        SUB: new AdvancedSubStrategy(),
        MUL: new AdvancedMulStrategy(),
        DIV: new AdvancedDivStrategy(),
        MIXED: new AdvancedMixedStrategy()
      }
    }
  }

  /**
   * 🎯 Applique les options personnalisées
   */
  private applyCustomOptions(config: GameConfig): GameConfig {
    const customConfig: Partial<GameConfig> = {}

    // Durée de jeu personnalisée
    if (this.options.gameDuration !== undefined) {
      customConfig.gameDurationSec = this.options.gameDuration
    }

    // Décompositions longues
    if (this.options.enableLongDecompositions !== undefined) {
      customConfig.selection = {
        ...config.selection,
        allowLongDecompositions: this.options.enableLongDecompositions
      }
    }

    // Poids des opérateurs personnalisés
    if (this.options.customOperatorWeights) {
      customConfig.operatorWeights = {
        ...config.operatorWeights,
        ...this.options.customOperatorWeights
      }
    }

    return mergeConfig(config, customConfig)
  }

  /**
   * 🎯 Définir la difficulté initiale
   */
  withInitialDifficulty(difficulty: number): this {
    this.options.initialDifficulty = difficulty
    return this
  }

  /**
   * 🎯 Définir la vitesse d'adaptation
   */
  withAdaptationSpeed(speed: 'slow' | 'medium' | 'fast'): this {
    this.options.adaptationSpeed = speed
    return this
  }

  /**
   * 🎯 Activer/désactiver les modèles avancés
   */
  withAdvancedModels(enable: boolean): this {
    this.options.useAdvancedModels = enable
    return this
  }

  /**
   * 🎯 Définir la durée du jeu
   */
  withGameDuration(seconds: number): this {
    this.options.gameDuration = seconds
    return this
  }

  /**
   * 🎯 Activer/désactiver les décompositions longues
   */
  withLongDecompositions(enable: boolean): this {
    this.options.enableLongDecompositions = enable
    return this
  }

  /**
   * 🎯 Définir les poids des opérateurs
   */
  withOperatorWeights(weights: Record<string, number>): this {
    this.options.customOperatorWeights = weights
    return this
  }

  /**
   * 🎯 Configuration personnalisée complète
   */
  withCustomConfig(config: Partial<GameConfig>): this {
    this.config = { ...this.config, ...config }
    return this
  }
}

// ----------------------------
// Presets de configuration
// ----------------------------

export class ConfigPresets {
  /**
   * 🎯 Configuration pour débutant
   */
  static beginner(age: number): GameConfig {
    return new CubeMatchConfigBuilder({ age })
      .withInitialDifficulty(0.8)
      .withAdaptationSpeed('slow')
      .withGameDuration(90)
      .withOperatorWeights({
        ADD: 2.0,
        SUB: 1.0,
        MUL: 0.3,
        DIV: 0.1,
        MIXED: 0.2
      })
      .build()
  }

  /**
   * 🎯 Configuration intermédiaire
   */
  static intermediate(age: number): GameConfig {
    return new CubeMatchConfigBuilder({ age })
      .withInitialDifficulty(1.5)
      .withAdaptationSpeed('medium')
      .withGameDuration(60)
      .withOperatorWeights({
        ADD: 1.2,
        SUB: 1.0,
        MUL: 0.8,
        DIV: 0.5,
        MIXED: 0.4
      })
      .build()
  }

  /**
   * 🎯 Configuration avancée
   */
  static advanced(age: number): GameConfig {
    return new CubeMatchConfigBuilder({ age })
      .withInitialDifficulty(2.5)
      .withAdaptationSpeed('fast')
      .withGameDuration(45)
      .withOperatorWeights({
        ADD: 1.0,
        SUB: 1.0,
        MUL: 1.0,
        DIV: 0.8,
        MIXED: 0.6
      })
      .build()
  }

  /**
   * 🎯 Configuration pour pratique (sans timer)
   */
  static practice(age: number): GameConfig {
    return new CubeMatchConfigBuilder({ age })
      .withInitialDifficulty(1.0)
      .withAdaptationSpeed('slow')
      .withGameDuration(300) // 5 minutes
      .build()
  }

  /**
   * 🎯 Configuration rapide (speed mode)
   */
  static speedMode(age: number): GameConfig {
    return new CubeMatchConfigBuilder({ age })
      .withInitialDifficulty(1.2)
      .withAdaptationSpeed('fast')
      .withGameDuration(30)
      .build()
  }

  /**
   * 🎯 Configuration pour focus sur un opérateur
   */
  static focusOperator(age: number, operator: 'ADD' | 'SUB' | 'MUL' | 'DIV'): GameConfig {
    const weights = {
      ADD: operator === 'ADD' ? 5.0 : 0.1,
      SUB: operator === 'SUB' ? 5.0 : 0.1,
      MUL: operator === 'MUL' ? 5.0 : 0.1,
      DIV: operator === 'DIV' ? 5.0 : 0.1,
      MIXED: 0.0
    }

    return new CubeMatchConfigBuilder({ age })
      .withOperatorWeights(weights)
      .withLongDecompositions(operator === 'ADD')
      .build()
  }

  /**
   * 🎯 Configuration adaptée automatiquement selon l'âge et les performances
   */
  static adaptive(age: number, performanceData?: {
    recentAccuracy: number
    averageResponseTime: number
    consecutiveErrors: number
  }): GameConfig {
    let initialDifficulty = 1.0
    let adaptationSpeed: 'slow' | 'medium' | 'fast' = 'medium'

    // Ajuster selon les performances si disponibles
    if (performanceData) {
      const { recentAccuracy, averageResponseTime, consecutiveErrors } = performanceData

      // Ajuster la difficulté initiale
      if (recentAccuracy > 85) {
        initialDifficulty = 1.8
      } else if (recentAccuracy > 70) {
        initialDifficulty = 1.3
      } else if (recentAccuracy < 55) {
        initialDifficulty = 0.9
      }

      // Ajuster la vitesse d'adaptation
      if (consecutiveErrors > 3) {
        adaptationSpeed = 'fast' // Adaptation rapide pour récupérer
      } else if (recentAccuracy > 80 && averageResponseTime < 5000) {
        adaptationSpeed = 'fast' // Progression rapide pour les bons joueurs
      } else {
        adaptationSpeed = 'medium'
      }
    }

    return new CubeMatchConfigBuilder({ age })
      .withInitialDifficulty(initialDifficulty)
      .withAdaptationSpeed(adaptationSpeed)
      .build()
  }
}

// ----------------------------
// Helpers d'export
// ----------------------------

/**
 * 🎯 Crée une configuration standard pour un âge donné
 */
export function createStandardConfig(age: number): GameConfig {
  return new CubeMatchConfigBuilder({ age }).build()
}

/**
 * 🎯 Crée une configuration personnalisée
 */
export function createCustomConfig(options: GameConfigOptions): GameConfig {
  return new CubeMatchConfigBuilder(options).build()
}

/**
 * 🎯 Crée une configuration depuis un preset
 */
export function createPresetConfig(
  preset: 'beginner' | 'intermediate' | 'advanced' | 'practice' | 'speed',
  age: number
): GameConfig {
  switch (preset) {
    case 'beginner':
      return ConfigPresets.beginner(age)
    case 'intermediate':
      return ConfigPresets.intermediate(age)
    case 'advanced':
      return ConfigPresets.advanced(age)
    case 'practice':
      return ConfigPresets.practice(age)
    case 'speed':
      return ConfigPresets.speedMode(age)
    default:
      return createStandardConfig(age)
  }
}


