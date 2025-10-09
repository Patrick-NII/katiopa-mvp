/**
 * 🎯 CUBEMATCH GAME CONFIG - INDEX
 * 
 * Point d'entrée central pour la configuration du jeu CubeMatch
 * Exporte tous les modules nécessaires
 */

// Configuration de base
export {
  type Operator,
  type RNG,
  type OperatorStrategy,
  type DifficultyModel,
  type ScoringModel,
  type GridModel,
  type SelectionRules,
  type TimerModel,
  type GameConfig,
  DefaultConfig,
  mergeConfig,
  createAgeSpecificConfig,
  pickWeighted,
  shuffle,
  clamp
} from './cubematch-config'

// Stratégies d'opérateurs avancées
export {
  type OperatorConfig,
  type GenerationContext,
  AdvancedAddStrategy,
  AdvancedSubStrategy,
  AdvancedMulStrategy,
  AdvancedDivStrategy,
  AdvancedMixedStrategy,
  OperatorStrategyFactory,
  SolvabilityValidator
} from './operator-strategies'

// Générateur de grille
export {
  type GridCell,
  type GridGenerationResult,
  type GridGeneratorConfig,
  GridGenerator
} from './grid-generator'

// Moteur de jeu
export {
  type Cell,
  type GameState,
  type GameMetrics,
  CubeMatchGameEngine
} from './cubematch-game-engine'

// Adaptateur pour l'intégration
export {
  type GameStats,
  type GameConfig as GameConfigUI,
  CubeMatchAdapter
} from './cubematch-adapter'

// Modèles adaptatifs avancés (Phase 3)
export {
  type PerformanceWindow,
  type AdaptationConfig,
  AdvancedDifficultyModel,
  AdvancedScoringModel,
  AdvancedTimerModel,
  AdaptiveModelsFactory,
  PerformanceAnalyzer
} from './adaptive-models'

// Builder de configuration
export {
  type GameConfigOptions,
  CubeMatchConfigBuilder,
  ConfigPresets,
  createStandardConfig,
  createCustomConfig,
  createPresetConfig
} from './config-builder'

// Métriques avancées (Phase 4)
export {
  type RoundMetrics,
  type SessionMetrics,
  type GameMetricsForBubiX,
  MetricsCollector
} from './game-metrics'

