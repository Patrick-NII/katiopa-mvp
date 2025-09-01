import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Route de test simple
router.get('/test', (req, res) => {
  res.json({ message: 'Route de test fonctionnelle' });
});

// GET /api/experiences/games - Récupérer tous les jeux

// GET /api/experiences/games - Récupérer tous les jeux
router.get('/games', async (req, res) => {
  try {
    // Retourner des données par défaut car la table Game n'existe pas encore
    const defaultGames = [
      {
        id: '1',
        name: 'CubeMatch',
        description: 'Jeu de calcul mental avec des cubes',
        category: 'math',
        difficultyLevel: 'intermediate',
        minAge: 8,
        maxAge: 15,
        durationMinutes: 10,
        pointsReward: 50,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'CodePuzzle',
        description: 'Puzzle de programmation pour débutants',
        category: 'programming',
        difficultyLevel: 'beginner',
        minAge: 10,
        maxAge: 18,
        durationMinutes: 15,
        pointsReward: 75,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(defaultGames);
  } catch (error) {
    console.error('Erreur lors de la récupération des jeux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/exercises - Récupérer tous les exercices
router.get('/exercises', async (req, res) => {
  try {
    // Retourner des données par défaut car la table Exercise n'existe pas encore
    const defaultExercises = [
      {
        id: '1',
        title: 'Addition et Soustraction',
        description: 'Exercices de calcul mental avec additions et soustractions',
        subject: 'math',
        difficultyLevel: 'beginner',
        estimatedDuration: 15,
        pointsReward: 30,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Multiplication',
        description: 'Tables de multiplication et calculs rapides',
        subject: 'math',
        difficultyLevel: 'intermediate',
        estimatedDuration: 20,
        pointsReward: 45,
        isActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        title: 'Géométrie',
        description: 'Formes géométriques et calculs de périmètre',
        subject: 'math',
        difficultyLevel: 'advanced',
        estimatedDuration: 25,
        pointsReward: 60,
        isActive: true,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(defaultExercises);
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/schedule - Récupérer le planning de l'utilisateur
router.get('/schedule', async (req, res) => {
  try {
    // Retourner un planning par défaut
    const defaultSchedule = [
      {
        id: '1',
        userId: 'default',
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '10:00',
        activityType: 'exercise',
        activityId: '1',
        status: 'planned',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        userId: 'default',
        dayOfWeek: 'wednesday',
        startTime: '14:00',
        endTime: '15:00',
        activityType: 'game',
        activityId: '1',
        status: 'planned',
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(defaultSchedule);
  } catch (error) {
    console.error('Erreur lors de la récupération du planning:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/recommendations - Récupérer les recommandations personnalisées
router.get('/recommendations', async (req, res) => {
  try {
    // Retourner des recommandations par défaut
    const defaultRecommendations = [
      {
        id: '1',
        userId: 'default',
        type: 'game',
        title: 'Essaie CubeMatch !',
        description: 'Un nouveau jeu de calcul mental t\'attend',
        targetId: '1',
        priority: 'high',
        isRead: false,
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        userId: 'default',
        type: 'exercise',
        title: 'Pratique les multiplications',
        description: 'Continue avec les exercices de multiplication',
        targetId: '2',
        priority: 'medium',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ];
    
    res.json(defaultRecommendations);
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/welcome-message - Récupérer le message de bienvenue personnalisé
router.get('/welcome-message', async (req, res) => {
  try {
    // Retourner un message de bienvenue par défaut
    const defaultMessage = {
      message: "Bonjour ! Bienvenue sur CubeAI. Prêt(e) à commencer l'aventure ?",
      userType: 'CHILD',
      daysSinceRegistration: 0
    };
    
    res.json(defaultMessage);
  } catch (error) {
    console.error('Erreur lors de la génération du message de bienvenue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/stats/activity - Récupérer les statistiques d'activité
router.get('/stats/activity', async (req, res) => {
  try {
    // Retourner des statistiques par défaut
    const defaultStats = {
      games: { totalGames: 0, totalScore: 0, averageScore: 0, bestScore: 0 },
      exercises: { totalExercises: 0, totalScore: 0, averageScore: 0, bestScore: 0 },
      time: { totalMinutes: 0 }
    };
    
    res.json(defaultStats);
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/games/recommended - Récupérer les jeux recommandés
router.get('/games/recommended', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const recommendedGames = await prisma.$queryRaw`
      SELECT 
        g.id,
        g.name,
        g.description,
        g.category,
        g.difficulty_level as "difficultyLevel",
        g.points_reward as "pointsReward",
        g.created_at as "createdAt"
      FROM "Game" g
      LEFT JOIN "GameRating" gr ON g.id = gr.game_id
      WHERE g.is_active = true
      GROUP BY g.id
      ORDER BY COALESCE(AVG(gr.rating), 0) DESC, g.created_at DESC
      LIMIT ${limit}
    `;
    
    res.json(recommendedGames || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des jeux recommandés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/exercises/recommended - Récupérer les exercices recommandés
router.get('/exercises/recommended', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    
    const recommendedExercises = await prisma.$queryRaw`
      SELECT 
        e.id,
        e.title,
        e.description,
        e.subject,
        e.difficulty_level as "difficultyLevel",
        e.points_reward as "pointsReward",
        e.created_at as "createdAt"
      FROM "Exercise" e
      LEFT JOIN "ExerciseRating" er ON e.id = er.exercise_id
      WHERE e.is_active = true
      GROUP BY e.id
      ORDER BY COALESCE(AVG(er.rating), 0) DESC, e.created_at DESC
      LIMIT ${limit}
    `;
    
    res.json(recommendedExercises || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des exercices recommandés:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/games/top - Récupérer les meilleurs jeux par catégorie
router.get('/games/top', async (req, res) => {
  try {
    const category = req.query.category as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    let query = `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.category,
        g.difficulty_level as "difficultyLevel",
        g.points_reward as "pointsReward",
        COALESCE(AVG(gr.rating), 0) as "averageRating",
        COUNT(gr.id) as "ratingCount",
        g.created_at as "createdAt"
      FROM "Game" g
      LEFT JOIN "GameRating" gr ON g.id = gr.game_id
      WHERE g.is_active = true
    `;
    
    if (category) {
      query += ` AND g.category = '${category}'`;
    }
    
    query += `
      GROUP BY g.id
      ORDER BY averageRating DESC, ratingCount DESC
      LIMIT ${limit}
    `;
    
    const topGames = await prisma.$queryRawUnsafe(query);
    res.json(topGames || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs jeux:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/experiences/exercises/top - Récupérer les meilleurs exercices par matière
router.get('/exercises/top', async (req, res) => {
  try {
    const subject = req.query.subject as string;
    const limit = parseInt(req.query.limit as string) || 10;
    
    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.subject,
        e.difficulty_level as "difficultyLevel",
        e.points_reward as "pointsReward",
        COALESCE(AVG(er.rating), 0) as "averageRating",
        COUNT(er.id) as "ratingCount",
        e.created_at as "createdAt"
      FROM "Exercise" e
      LEFT JOIN "ExerciseRating" er ON e.id = er.exercise_id
      WHERE e.is_active = true
    `;
    
    if (subject) {
      query += ` AND e.subject = '${subject}'`;
    }
    
    query += `
      GROUP BY e.id
      ORDER BY averageRating DESC, ratingCount DESC
      LIMIT ${limit}
    `;
    
    const topExercises = await prisma.$queryRawUnsafe(query);
    res.json(topExercises || []);
  } catch (error) {
    console.error('Erreur lors de la récupération des meilleurs exercices:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
