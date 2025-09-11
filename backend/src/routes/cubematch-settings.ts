import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Interface pour les paramètres CubeMatch
interface CubeMatchSettings {
  // Gameplay
  gridSize: number;
  operator: 'ADD' | 'SUB' | 'MUL' | 'DIV' | 'MIXED';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  unlimitedTime: boolean;
  allowDiagonals: boolean;
  
  // Audio & UX  
  soundEnabled: boolean;
  hintsEnabled: boolean;
  autoSubmit: boolean;
  
  // Avancé
  spawnRate: number;
  maxNumbers: number;
  infiniteCubes: boolean;
  cleanCubes: boolean;
  
  // État du jeu en cours (pour récupération)
  currentGameState?: {
    isPlaying: boolean;
    score: number;
    level: number;
    timeLeft: number;
    target: number;
    gameBoard?: any;
    stats?: any;
  };
}

// GET /api/cubematch/settings - Récupérer les paramètres utilisateur
router.get('/settings', requireAuth, async (req, res) => {
  try {
    console.log(`🎮 Récupération des paramètres CubeMatch pour ${req.user!.sessionId}`);
    
    const settings = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: req.user!.userId },
      select: {
        // Paramètres de jeu sauvegardés
        favorite_operator: true,
        user_preferences: true, // JSON field pour stocker les settings
        
        // Stats pour adapter la difficulté
        highest_level: true,
        average_score: true,
        total_games: true
      }
    });
    
    // Paramètres par défaut optimisés pour enfants (style Disney)
    const defaultSettings: CubeMatchSettings = {
      gridSize: 6,
      operator: settings?.favorite_operator as any || 'ADD',
      difficulty: settings?.total_games > 10 ? 'MEDIUM' : 'EASY', // Progression naturelle
      timeLimit: 60,
      unlimitedTime: false,
      allowDiagonals: false,
      soundEnabled: true,
      hintsEnabled: true,
      autoSubmit: false,
      spawnRate: 2000,
      maxNumbers: 9,
      infiniteCubes: false,
      cleanCubes: false
    };
    
    // Merger avec les préférences sauvegardées
    const userSettings = settings?.user_preferences 
      ? { ...defaultSettings, ...JSON.parse(settings.user_preferences as string) }
      : defaultSettings;
    
    console.log(`✅ Paramètres chargés pour ${req.user!.sessionId}`);
    
    res.json({
      success: true,
      settings: userSettings,
      stats: {
        gamesPlayed: settings?.total_games || 0,
        bestLevel: settings?.highest_level || 1,
        averageScore: settings?.average_score || 0
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/settings - Sauvegarder les paramètres
router.post('/settings', requireAuth, async (req, res) => {
  try {
    const settings: CubeMatchSettings = req.body;
    console.log(`💾 Sauvegarde paramètres pour ${req.user!.sessionId}:`, settings);
    
    // Upsert des préférences utilisateur
    await prisma.cubeMatchUserStats.upsert({
      where: { user_id: req.user!.userId },
      update: {
        user_preferences: JSON.stringify(settings),
        favorite_operator: settings.operator,
        updated_at: new Date()
      },
      create: {
        user_id: req.user!.userId,
        username: req.user!.sessionId,
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
        favorite_operator: settings.operator,
        user_preferences: JSON.stringify(settings),
        last_played: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    });
    
    console.log(`✅ Paramètres sauvegardés pour ${req.user!.sessionId}`);
    res.json({ success: true, message: 'Paramètres sauvegardés' });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde paramètres:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/game-state - Sauvegarder l'état du jeu en cours
router.post('/game-state', requireAuth, async (req, res) => {
  try {
    const gameState = req.body;
    console.log(`🎯 Sauvegarde état de jeu pour ${req.user!.sessionId}`);
    
    // Récupérer les paramètres actuels
    const currentStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: req.user!.userId },
      select: { user_preferences: true }
    });
    
    const currentSettings = currentStats?.user_preferences 
      ? JSON.parse(currentStats.user_preferences as string)
      : {};
    
    // Ajouter l'état du jeu aux paramètres
    const updatedSettings = {
      ...currentSettings,
      currentGameState: {
        ...gameState,
        savedAt: new Date().toISOString()
      }
    };
    
    await prisma.cubeMatchUserStats.upsert({
      where: { user_id: req.user!.userId },
      update: {
        user_preferences: JSON.stringify(updatedSettings),
        updated_at: new Date()
      },
      create: {
        user_id: req.user!.userId,
        username: req.user!.sessionId,
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
    
    console.log(`✅ État de jeu sauvegardé pour ${req.user!.sessionId}`);
    res.json({ success: true, message: 'État sauvegardé' });
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde état:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// DELETE /api/cubematch/game-state - Nettoyer l'état de jeu (après victoire/défaite)
router.delete('/game-state', requireAuth, async (req, res) => {
  try {
    console.log(`🧹 Nettoyage état de jeu pour ${req.user!.sessionId}`);
    
    const currentStats = await prisma.cubeMatchUserStats.findUnique({
      where: { user_id: req.user!.userId },
      select: { user_preferences: true }
    });
    
    if (currentStats?.user_preferences) {
      const settings = JSON.parse(currentStats.user_preferences as string);
      delete settings.currentGameState;
      
      await prisma.cubeMatchUserStats.update({
        where: { user_id: req.user!.userId },
        data: {
          user_preferences: JSON.stringify(settings),
          updated_at: new Date()
        }
      });
    }
    
    console.log(`✅ État de jeu nettoyé pour ${req.user!.sessionId}`);
    res.json({ success: true, message: 'État nettoyé' });
    
  } catch (error) {
    console.error('❌ Erreur nettoyage état:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
