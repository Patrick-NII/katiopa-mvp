const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/cubematch/scores - Récupérer les meilleurs scores
router.get('/scores', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = await prisma.$queryRaw`
      SELECT 
        cs.id,
        cs.user_id as "userId",
        cs.username,
        cs.score,
        cs.level,
        cs.time_played_ms as "timePlayedMs",
        cs.operator,
        cs.target,
        cs.allow_diagonals as "allowDiagonals",
        cs.created_at as "createdAt"
      FROM cubematch_scores cs
      ORDER BY cs.score DESC, cs.created_at DESC
      LIMIT ${limit}
    `;
    
    res.json(scores);
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/stats - Récupérer les statistiques globales
router.get('/stats', async (req, res) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        total_games as "totalGames",
        total_score as "totalScore",
        average_score as "averageScore",
        best_score as "bestScore",
        total_time_played as "totalTimePlayed",
        average_time_played as "averageTimePlayed",
        highest_level as "highestLevel"
      FROM cubematch_stats
      LIMIT 1
    `;
    
    res.json(stats[0] || {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimePlayed: 0,
      averageTimePlayed: 0,
      highestLevel: 1
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/scores - Sauvegarder un nouveau score
router.post('/scores', authenticateToken, async (req, res) => {
  try {
    const {
      score,
      level,
      timePlayedMs,
      operator,
      target,
      allowDiagonals
    } = req.body;

    // Validation des données
    if (!score || !level || !timePlayedMs || !operator || !target) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Récupérer les informations de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { username: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    // Sauvegarder le score
    const newScore = await prisma.$executeRaw`
      INSERT INTO cubematch_scores (
        user_id, username, score, level, time_played_ms, 
        operator, target, allow_diagonals
      ) VALUES (
        ${req.user.id}, ${user.username}, ${score}, ${level}, ${timePlayedMs},
        ${operator}, ${target}, ${allowDiagonals}
      )
    `;

    res.status(201).json({ success: true, message: 'Score sauvegardé' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du score:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/user-scores - Récupérer les scores de l'utilisateur connecté
router.get('/user-scores', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const scores = await prisma.$queryRaw`
      SELECT 
        cs.id,
        cs.user_id as "userId",
        cs.username,
        cs.score,
        cs.level,
        cs.time_played_ms as "timePlayedMs",
        cs.operator,
        cs.target,
        cs.allow_diagonals as "allowDiagonals",
        cs.created_at as "createdAt"
      FROM cubematch_scores cs
      WHERE cs.user_id = ${req.user.id}
      ORDER BY cs.score DESC, cs.created_at DESC
      LIMIT ${limit}
    `;
    
    res.json(scores);
  } catch (error) {
    console.error('Erreur lors de la récupération des scores utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
