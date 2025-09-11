/**
 * ⚙️ CUBEMATCH SETTINGS API
 * 
 * Gestion complète des paramètres utilisateur et préférences de jeu
 * Synchronisation temps réel et personnalisation avancée
 */

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../../middleware/auth';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Schema de validation pour les paramètres
const SettingsSchema = z.object({
  // Paramètres de jeu
  gameSettings: z.object({
    gridSize: z.number().min(3).max(15).default(6),
    operator: z.enum(['ADD', 'SUB', 'MUL', 'DIV', 'MIXED']).default('ADD'),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
    timeLimit: z.number().min(30).max(600).default(60),
    unlimitedTime: z.boolean().default(false),
    allowDiagonals: z.boolean().default(false),
    autoSubmit: z.boolean().default(false),
    
    // Paramètres avancés
    spawnRate: z.number().min(1000).max(10000).default(2000),
    maxNumbers: z.number().min(5).max(15).default(9),
    infiniteCubes: z.boolean().default(false),
    cleanCubes: z.boolean().default(false)
  }),
  
  // Paramètres UI/UX
  uiSettings: z.object({
    theme: z.enum(['classic', 'modern', 'dark', 'colorful']).default('classic'),
    soundEnabled: z.boolean().default(true),
    hintsEnabled: z.boolean().default(true),
    animationsEnabled: z.boolean().default(true),
    vibrationEnabled: z.boolean().default(false),
    
    // Accessibilité
    highContrast: z.boolean().default(false),
    largeText: z.boolean().default(false),
    reducedMotion: z.boolean().default(false),
    screenReader: z.boolean().default(false),
    
    // Interface
    showGrid: z.boolean().default(true),
    showTimer: z.boolean().default(true),
    showScore: z.boolean().default(true),
    showLevel: z.boolean().default(true),
    showCombo: z.boolean().default(true)
  }),
  
  // Paramètres d'apprentissage
  learningSettings: z.object({
    adaptiveDifficulty: z.boolean().default(true),
    intelligentHints: z.boolean().default(true),
    progressTracking: z.boolean().default(true),
    personalizedChallenges: z.boolean().default(true),
    
    // Objectifs personnels
    dailyGoal: z.number().min(0).max(100).default(5), // parties par jour
    weeklyGoal: z.number().min(0).max(500).default(25), // parties par semaine
    targetAccuracy: z.number().min(50).max(100).default(80), // % précision
    targetSpeed: z.number().min(500).max(5000).default(2000) // ms par move
  }),
  
  // Paramètres de confidentialité
  privacySettings: z.object({
    shareStats: z.boolean().default(true),
    allowLeaderboard: z.boolean().default(true),
    dataCollection: z.boolean().default(true),
    anonymousAnalytics: z.boolean().default(true),
    bubixTraining: z.boolean().default(true) // Permet à BubiX d'utiliser les données
  }),
  
  // Paramètres de notification
  notificationSettings: z.object({
    dailyReminder: z.boolean().default(false),
    achievementAlerts: z.boolean().default(true),
    progressUpdates: z.boolean().default(true),
    tipOfTheDay: z.boolean().default(true),
    weeklyReport: z.boolean().default(false),
    
    // Timing des notifications
    reminderTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).default('18:00'),
    timezone: z.string().default('UTC')
  }),
  
  // État de jeu sauvegardé (pour récupération de session)
  gameState: z.object({
    hasActiveGame: z.boolean().default(false),
    currentScore: z.number().default(0),
    currentLevel: z.number().default(1),
    currentTarget: z.number().default(10),
    timeRemaining: z.number().default(60),
    gameBoard: z.any().optional(),
    gameStats: z.any().optional(),
    savedAt: z.string().datetime().optional()
  }).optional()
});

/**
 * 📖 GET /api/cubematch/settings/:userId - Récupérer tous les paramètres
 */
router.get('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Vérifier l'autorisation
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log(`⚙️ Récupération paramètres pour ${req.user!.sessionId}`);
    
    // Récupérer les paramètres sauvegardés
    const userStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: userId },
      select: {
        user_preferences: true,
        favorite_operator: true,
        total_games: true,
        highest_level: true,
        average_score: true
      }
    });
    
    // Paramètres par défaut intelligents basés sur l'historique
    const defaultSettings = generateIntelligentDefaults(userStats);
    
    // Merger avec les préférences sauvegardées
    let savedPreferences = {};
    if (userStats?.user_preferences) {
      try {
        savedPreferences = JSON.parse(userStats.user_preferences);
      } catch (error) {
        console.warn('⚠️ Erreur parsing préférences sauvegardées:', error);
      }
    }
    
    // Combiner les paramètres
    const combinedSettings = mergeSettings(defaultSettings, savedPreferences);
    
    // Ajouter des métadonnées
    const response = {
      success: true,
      userId,
      settings: combinedSettings,
      metadata: {
        gamesPlayed: userStats?.total_games || 0,
        experienceLevel: determineExperienceLevel(userStats?.total_games || 0),
        recommendedDifficulty: determineRecommendedDifficulty(userStats),
        lastUpdated: new Date().toISOString(),
        version: '2.0.0'
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération des paramètres'
    });
  }
});

/**
 * 💾 PUT /api/cubematch/settings/:userId - Sauvegarder les paramètres
 */
router.put('/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log(`💾 Sauvegarde paramètres pour ${req.user!.sessionId}`);
    
    // Valider les données
    const validatedSettings = SettingsSchema.parse(req.body);
    
    // Extraire l'opérateur favori pour les stats rapides
    const favoriteOperator = validatedSettings.gameSettings.operator;
    
    // Sauvegarder dans la base de données
    await prisma.cubeMatchUserStats.upsert({
      where: { user_id: userId },
      update: {
        user_preferences: JSON.stringify(validatedSettings),
        favorite_operator: favoriteOperator,
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        username: req.user!.sessionId || req.user!.firstName || 'Utilisateur',
        total_games: 0,
        total_score: BigInt(0),
        best_score: 0,
        average_score: 0,
        highest_level: 1,
        total_time_played: BigInt(0),
        average_time_played: 0,
        total_combo_max: 0,
        total_cells_cleared: 0,
        total_hints_used: 0,
        favorite_operator: favoriteOperator,
        user_preferences: JSON.stringify(validatedSettings),
        last_played: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    // Log pour analytics
    console.log(`✅ Paramètres sauvegardés: ${Object.keys(validatedSettings).join(', ')}`);
    
    res.json({
      success: true,
      message: 'Paramètres sauvegardés avec succès',
      savedAt: new Date().toISOString(),
      settingsCount: Object.keys(validatedSettings).length
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Erreur validation paramètres:', error.errors);
      return res.status(400).json({
        error: 'Paramètres invalides',
        details: error.errors
      });
    }
    
    console.error('❌ Erreur sauvegarde paramètres:', error);
    res.status(500).json({
      error: 'Erreur lors de la sauvegarde des paramètres'
    });
  }
});

/**
 * 🎮 POST /api/cubematch/settings/:userId/game-state - Sauvegarder l'état de jeu
 */
router.post('/:userId/game-state', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    const gameState = req.body;
    console.log(`🎮 Sauvegarde état de jeu pour ${req.user!.sessionId}`);
    
    // Récupérer les paramètres actuels
    const currentStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: userId },
      select: { user_preferences: true }
    });
    
    let currentSettings = {};
    if (currentStats?.user_preferences) {
      try {
        currentSettings = JSON.parse(currentStats.user_preferences);
      } catch (error) {
        console.warn('⚠️ Erreur parsing paramètres existants:', error);
      }
    }
    
    // Ajouter/mettre à jour l'état de jeu
    const updatedSettings = {
      ...currentSettings,
      gameState: {
        ...gameState,
        hasActiveGame: true,
        savedAt: new Date().toISOString()
      }
    };
    
    // Sauvegarder
    await prisma.cubeMatchUserStats.upsert({
      where: { user_id: userId },
      update: {
        user_preferences: JSON.stringify(updatedSettings),
        updated_at: new Date()
      },
      create: {
        user_id: userId,
        username: req.user!.sessionId || 'Utilisateur',
        total_games: 0,
        total_score: BigInt(0),
        best_score: 0,
        average_score: 0,
        highest_level: 1,
        total_time_played: BigInt(0),
        average_time_played: 0,
        total_combo_max: 0,
        total_cells_cleared: 0,
        total_hints_used: 0,
        favorite_operator: 'ADD',
        user_preferences: JSON.stringify(updatedSettings),
        last_played: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log('✅ État de jeu sauvegardé');
    
    res.json({
      success: true,
      message: 'État de jeu sauvegardé',
      savedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde état de jeu:', error);
    res.status(500).json({
      error: 'Erreur lors de la sauvegarde de l\'état de jeu'
    });
  }
});

/**
 * 🗑️ DELETE /api/cubematch/settings/:userId/game-state - Supprimer l'état de jeu
 */
router.delete('/:userId/game-state', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log(`🗑️ Suppression état de jeu pour ${req.user!.sessionId}`);
    
    // Récupérer les paramètres actuels
    const currentStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: userId },
      select: { user_preferences: true }
    });
    
    if (!currentStats?.user_preferences) {
      return res.json({
        success: true,
        message: 'Aucun état de jeu à supprimer'
      });
    }
    
    let currentSettings = {};
    try {
      currentSettings = JSON.parse(currentStats.user_preferences);
    } catch (error) {
      console.warn('⚠️ Erreur parsing paramètres:', error);
      return res.json({
        success: true,
        message: 'Paramètres corrompus, réinitialisés'
      });
    }
    
    // Supprimer l'état de jeu
    const updatedSettings = {
      ...currentSettings,
      gameState: {
        hasActiveGame: false,
        currentScore: 0,
        currentLevel: 1,
        currentTarget: 10,
        timeRemaining: 60,
        clearedAt: new Date().toISOString()
      }
    };
    
    // Sauvegarder
    await prisma.cubeMatchUserStats.update({
      where: { user_id: userId },
      data: {
        user_preferences: JSON.stringify(updatedSettings),
        updated_at: new Date()
      }
    });
    
    console.log('✅ État de jeu supprimé');
    
    res.json({
      success: true,
      message: 'État de jeu supprimé',
      clearedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur suppression état de jeu:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de l\'état de jeu'
    });
  }
});

/**
 * 🔄 POST /api/cubematch/settings/:userId/reset - Réinitialiser les paramètres
 */
router.post('/:userId/reset', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { category } = req.body; // 'all', 'game', 'ui', 'learning', etc.
    
    if (req.user!.userId !== userId) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }
    
    console.log(`🔄 Réinitialisation paramètres (${category}) pour ${req.user!.sessionId}`);
    
    // Récupérer les stats pour générer des defaults intelligents
    const userStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: userId },
      select: {
        user_preferences: true,
        total_games: true,
        average_score: true,
        highest_level: true
      }
    });
    
    let currentSettings = {};
    if (userStats?.user_preferences) {
      try {
        currentSettings = JSON.parse(userStats.user_preferences);
      } catch (error) {
        console.warn('⚠️ Erreur parsing paramètres existants:', error);
      }
    }
    
    // Générer nouveaux paramètres par défaut
    const defaultSettings = generateIntelligentDefaults(userStats);
    
    let updatedSettings;
    switch (category) {
      case 'game':
        updatedSettings = { ...currentSettings, gameSettings: defaultSettings.gameSettings };
        break;
      case 'ui':
        updatedSettings = { ...currentSettings, uiSettings: defaultSettings.uiSettings };
        break;
      case 'learning':
        updatedSettings = { ...currentSettings, learningSettings: defaultSettings.learningSettings };
        break;
      case 'privacy':
        updatedSettings = { ...currentSettings, privacySettings: defaultSettings.privacySettings };
        break;
      case 'notifications':
        updatedSettings = { ...currentSettings, notificationSettings: defaultSettings.notificationSettings };
        break;
      case 'all':
      default:
        updatedSettings = defaultSettings;
        break;
    }
    
    // Sauvegarder
    await prisma.cubeMatchUserStats.update({
      where: { user_id: userId },
      data: {
        user_preferences: JSON.stringify(updatedSettings),
        updated_at: new Date()
      }
    });
    
    console.log(`✅ Paramètres réinitialisés: ${category}`);
    
    res.json({
      success: true,
      message: `Paramètres ${category} réinitialisés`,
      resetCategory: category,
      newSettings: updatedSettings,
      resetAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erreur réinitialisation paramètres:', error);
    res.status(500).json({
      error: 'Erreur lors de la réinitialisation'
    });
  }
});

// 🔧 Fonctions utilitaires

function generateIntelligentDefaults(userStats: any) {
  const gamesPlayed = userStats?.total_games || 0;
  const averageScore = Number(userStats?.average_score || 0);
  const highestLevel = userStats?.highest_level || 1;
  
  // Adapter la difficulté selon l'expérience
  let defaultDifficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'EASY';
  if (gamesPlayed > 20 && averageScore > 400) {
    defaultDifficulty = 'MEDIUM';
  }
  if (gamesPlayed > 50 && averageScore > 700) {
    defaultDifficulty = 'HARD';
  }
  
  // Adapter la taille de grille selon le niveau
  let defaultGridSize = 6;
  if (highestLevel > 10) defaultGridSize = 8;
  if (highestLevel > 20) defaultGridSize = 10;
  
  return {
    gameSettings: {
      gridSize: defaultGridSize,
      operator: userStats?.favorite_operator || 'ADD',
      difficulty: defaultDifficulty,
      timeLimit: 60,
      unlimitedTime: false,
      allowDiagonals: gamesPlayed > 10, // Activer après expérience
      autoSubmit: false,
      spawnRate: Math.max(1500, 3000 - (gamesPlayed * 10)),
      maxNumbers: Math.min(12, 8 + Math.floor(highestLevel / 5)),
      infiniteCubes: false,
      cleanCubes: false
    },
    
    uiSettings: {
      theme: 'classic',
      soundEnabled: true,
      hintsEnabled: gamesPlayed < 30, // Désactiver après expérience
      animationsEnabled: true,
      vibrationEnabled: false,
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      showGrid: true,
      showTimer: true,
      showScore: true,
      showLevel: true,
      showCombo: true
    },
    
    learningSettings: {
      adaptiveDifficulty: true,
      intelligentHints: true,
      progressTracking: true,
      personalizedChallenges: gamesPlayed > 5,
      dailyGoal: Math.min(10, 3 + Math.floor(gamesPlayed / 10)),
      weeklyGoal: Math.min(50, 15 + Math.floor(gamesPlayed / 5)),
      targetAccuracy: Math.min(95, 70 + Math.floor(averageScore / 50)),
      targetSpeed: Math.max(1000, 2500 - (gamesPlayed * 20))
    },
    
    privacySettings: {
      shareStats: true,
      allowLeaderboard: true,
      dataCollection: true,
      anonymousAnalytics: true,
      bubixTraining: true
    },
    
    notificationSettings: {
      dailyReminder: false,
      achievementAlerts: true,
      progressUpdates: true,
      tipOfTheDay: gamesPlayed < 20,
      weeklyReport: gamesPlayed > 10,
      reminderTime: '18:00',
      timezone: 'UTC'
    }
  };
}

function mergeSettings(defaults: any, saved: any): any {
  const merged = { ...defaults };
  
  // Merger profondément chaque section
  for (const [key, value] of Object.entries(saved)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      merged[key] = { ...merged[key], ...value };
    } else {
      merged[key] = value;
    }
  }
  
  return merged;
}

function determineExperienceLevel(gamesPlayed: number): string {
  if (gamesPlayed < 5) return 'Débutant';
  if (gamesPlayed < 20) return 'Novice';
  if (gamesPlayed < 50) return 'Intermédiaire';
  if (gamesPlayed < 100) return 'Avancé';
  return 'Expert';
}

function determineRecommendedDifficulty(userStats: any): string {
  const gamesPlayed = userStats?.total_games || 0;
  const averageScore = Number(userStats?.average_score || 0);
  
  if (gamesPlayed < 10 || averageScore < 300) return 'EASY';
  if (averageScore < 600) return 'MEDIUM';
  return 'HARD';
}

export default router;
