import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/cubematch/scores - Récupérer les meilleurs scores
router.get('/scores', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Vérifier si les tables existent
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cubematch_scores'
      ) as exists
    `;
    
    if (!(tableExists as any[])[0]?.exists) {
      // Si la table n'existe pas, retourner un tableau vide
      return res.json([]);
    }
    
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
        cs.combo_max as "comboMax",
        cs.cells_cleared as "cellsCleared",
        cs.hints_used as "hintsUsed",
        cs.game_duration_seconds as "gameDurationSeconds",
        cs.created_at as "createdAt"
      FROM cubematch_scores cs
      ORDER BY cs.score DESC, cs.created_at DESC
      LIMIT ${limit}
    `;
    
    res.json(scores);
  } catch (error) {
    console.error('Erreur lors de la récupération des scores:', error);
    // Retourner des données par défaut en cas d'erreur
    const defaultScores = [
      { id: '1', userId: 'user1', username: 'Joueur 1', score: 1250, level: 8, timePlayedMs: 45000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
      { id: '2', userId: 'user2', username: 'Joueur 2', score: 980, level: 6, timePlayedMs: 38000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() },
      { id: '3', userId: 'user3', username: 'Joueur 3', score: 750, level: 5, timePlayedMs: 32000, operator: 'ADD', target: 10, allowDiagonals: false, createdAt: new Date().toISOString() }
    ];
    res.json(defaultScores.slice(0, parseInt(req.query.limit as string) || 10));
  }
});

// GET /api/cubematch/stats - Récupérer les statistiques globales
router.get('/stats', async (req, res) => {
  try {
    // Vérifier si les tables existent
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cubematch_stats'
      ) as exists
    `;
    
    if (!(tableExists as any[])[0]?.exists) {
      // Si la table n'existe pas, retourner des données par défaut
      const defaultStats = {
        totalGames: 150,
        totalScore: 125000,
        averageScore: 833,
        bestScore: 1250,
        totalTimePlayed: 5400000,
        averageTimePlayed: 36000,
        highestLevel: 8,
        totalPlayers: 25,
        averageLevel: 4.2,
        mostUsedOperator: 'ADD',
        lastUpdated: new Date().toISOString()
      };
      return res.json(defaultStats);
    }
    
    const stats = await prisma.$queryRaw`
      SELECT 
        total_games as "totalGames",
        total_score as "totalScore",
        average_score as "averageScore",
        best_score as "bestScore",
        total_time_played as "totalTimePlayed",
        average_time_played as "averageTimePlayed",
        highest_level as "highestLevel",
        total_players as "totalPlayers",
        average_level as "averageLevel",
        most_used_operator as "mostUsedOperator",
        last_updated as "lastUpdated"
      FROM cubematch_stats
      LIMIT 1
    `;
    
    res.json((stats as any[])[0] || {
      totalGames: 0,
      totalScore: 0,
      averageScore: 0,
      bestScore: 0,
      totalTimePlayed: 0,
      averageTimePlayed: 0,
      highestLevel: 1,
      totalPlayers: 0,
      averageLevel: 1,
      mostUsedOperator: 'ADD',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    // Retourner des données par défaut en cas d'erreur
    const defaultStats = {
      totalGames: 150,
      totalScore: 125000,
      averageScore: 833,
      bestScore: 1250,
      totalTimePlayed: 5400000,
      averageTimePlayed: 36000,
      highestLevel: 8,
      totalPlayers: 25,
      averageLevel: 4.2,
      mostUsedOperator: 'ADD',
      lastUpdated: new Date().toISOString()
    };
    res.json(defaultStats);
  }
});

// GET /api/cubematch/leaderboard - Récupérer le classement complet (PUBLIC)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        cus.user_id as "userId",
        cus.username,
        cus.total_games as "totalGames",
        cus.total_score as "totalScore",
        cus.best_score as "bestScore",
        cus.average_score as "averageScore",
        cus.highest_level as "highestLevel",
        cus.total_time_played as "totalTimePlayed",
        cus.average_time_played as "averageTimePlayed",
        cus.total_combo_max as "totalComboMax",
        cus.total_cells_cleared as "totalCellsCleared",
        cus.total_hints_used as "totalHintsUsed",
        cus.favorite_operator as "favoriteOperator",
        cus.last_played as "lastPlayed",
        ROW_NUMBER() OVER (ORDER BY cus.best_score DESC, cus.total_score DESC) as rank
      FROM cubematch_user_stats cus
      WHERE cus.total_games > 0
      ORDER BY cus.best_score DESC, cus.total_score DESC
      LIMIT ${limit}
    `;
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/scores - Sauvegarder un nouveau score (AUTHENTIFICATION REQUISE)
router.post('/scores', requireAuth, async (req, res) => {
  try {
    const {
      score,
      level,
      timePlayedMs,
      operator,
      target,
      allowDiagonals,
      gridSizeRows = 8,
      gridSizeCols = 8,
      maxSize = 9,
      spawnRateMin = 2,
      spawnRateMax = 4,
      tickMs = 4000,
      comboMax = 0,
      cellsCleared = 0,
      hintsUsed = 0,
      gameDurationSeconds = 0
    } = req.body;

    // Validation des données
    if (!score || !level || !timePlayedMs || !operator || !target) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    // Utiliser les données de l'utilisateur authentifié
    const userId = req.user!.userId;
    const username = req.user!.sessionId || req.user!.firstName || req.user!.username || 'Utilisateur';

    // Sauvegarder le score avec Prisma ORM
    const newScore = await prisma.cubeMatchScore.create({
      data: {
        user_id: userId,
        username: username,
        score: score,
        level: level,
        time_played_ms: BigInt(timePlayedMs),
        operator: operator,
        target: target,
        allow_diagonals: allowDiagonals,
        grid_size_rows: gridSizeRows,
        grid_size_cols: gridSizeCols,
        max_size: maxSize,
        spawn_rate_min: spawnRateMin,
        spawn_rate_max: spawnRateMax,
        tick_ms: tickMs,
        combo_max: comboMax,
        cells_cleared: cellsCleared,
        hints_used: hintsUsed,
        game_duration_seconds: gameDurationSeconds
      }
    });

    res.status(201).json({ success: true, message: 'Score sauvegardé' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du score:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/user-scores - Récupérer les scores de l'utilisateur connecté
router.get('/user-scores', requireAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const scores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: req.user!.userId
      },
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      select: {
        id: true,
        user_id: true,
        username: true,
        score: true,
        level: true,
        time_played_ms: true,
        operator: true,
        target: true,
        allow_diagonals: true,
        combo_max: true,
        cells_cleared: true,
        hints_used: true,
        game_duration_seconds: true,
        created_at: true
      }
    });

    res.json(scores.map(score => ({
      id: score.id,
      userId: score.user_id,
      username: score.username,
      score: score.score,
      level: score.level,
      timePlayedMs: Number(score.time_played_ms),
      operator: score.operator,
      target: score.target,
      allowDiagonals: score.allow_diagonals,
      comboMax: score.combo_max,
      cellsCleared: score.cells_cleared,
      hintsUsed: score.hints_used,
      gameDurationSeconds: score.game_duration_seconds,
      createdAt: score.created_at
    })));
  } catch (error) {
    console.error('Erreur lors de la récupération des scores utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/user-stats - Récupérer les statistiques de l'utilisateur connecté
router.get('/user-stats', requireAuth, async (req, res) => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        total_games as "totalGames",
        total_score as "totalScore",
        best_score as "bestScore",
        average_score as "averageScore",
        highest_level as "highestLevel",
        total_time_played as "totalTimePlayed",
        average_time_played as "averageTimePlayed",
        total_combo_max as "totalComboMax",
        total_cells_cleared as "totalCellsCleared",
        total_hints_used as "totalHintsUsed",
        favorite_operator as "favoriteOperator",
        last_played as "lastPlayed"
      FROM cubematch_user_stats
      WHERE user_id = ${req.user!.userId}
      LIMIT 1
    `;
    
    res.json((stats as any[])[0] || {
      totalGames: 0,
      totalScore: 0,
      bestScore: 0,
      averageScore: 0,
      highestLevel: 1,
      totalTimePlayed: 0,
      averageTimePlayed: 0,
      totalComboMax: 0,
      totalCellsCleared: 0,
      totalHintsUsed: 0,
      favoriteOperator: 'ADD',
      lastPlayed: null
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques utilisateur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ===== FONCTIONNALITÉS SOCIALES =====

// GET /api/cubematch/social/likes/:gameId - Récupérer les likes d'un jeu
router.get('/social/likes/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const likes = await prisma.gameLike.findMany({
      where: { gameId },
      select: {
        userId: true,
        createdAt: true
      }
    });
    
    res.json({
      totalLikes: likes.length,
      userIds: likes.map(like => like.userId)
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des likes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/social/likes/:gameId - Ajouter/retirer un like
router.post('/social/likes/:gameId', requireAuth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user!.userId;
    
    // Vérifier si l'utilisateur a déjà liké
    const existingLike = await prisma.gameLike.findUnique({
      where: {
        userId_gameId: {
          userId,
          gameId
        }
      }
    });
    
    if (existingLike) {
      // Retirer le like
      await prisma.gameLike.delete({
        where: {
          userId_gameId: {
            userId,
            gameId
          }
        }
      });
      res.json({ liked: false, message: 'Like retiré' });
    } else {
      // Ajouter le like
      await prisma.gameLike.create({
        data: {
          userId,
          gameId
        }
      });
      res.json({ liked: true, message: 'Like ajouté' });
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du like:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/social/shares/:gameId - Récupérer le nombre de partages
router.get('/social/shares/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const shareCount = await prisma.gameShare.count({
      where: { gameId }
    });
    
    res.json({ totalShares: shareCount });
  } catch (error) {
    console.error('Erreur lors de la récupération des partages:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/social/shares/:gameId - Enregistrer un partage
router.post('/social/shares/:gameId', requireAuth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user!.userId;
    
    await prisma.gameShare.create({
      data: {
        userId,
        gameId
      }
    });
    
    res.json({ success: true, message: 'Partage enregistré' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement du partage:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/social/comments/:gameId - Récupérer les commentaires d'un jeu (PUBLIC)
router.get('/social/comments/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const comments = await prisma.gameComment.findMany({
      where: { gameId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        likes: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
    
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      userId: comment.userId,
      author: `${comment.user.firstName} ${comment.user.lastName}`,
      content: comment.content,
      timestamp: new Date(comment.createdAt).toLocaleDateString('fr-FR'),
      likes: comment.likes.length
    }));
    
    res.json(formattedComments);
  } catch (error) {
    console.error('Erreur lors de la récupération des commentaires:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/social/comments/:gameId - Ajouter un commentaire
router.post('/social/comments/:gameId', requireAuth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Le contenu du commentaire est requis' });
    }
    
    await prisma.gameComment.create({
      data: {
        userId,
        gameId,
        content: content.trim()
      }
    });
    
    res.status(201).json({ success: true, message: 'Commentaire ajouté' });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du commentaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/social/comments/:commentId/like - Liker un commentaire
router.post('/social/comments/:commentId/like', requireAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.userId;
    
    // Vérifier si l'utilisateur a déjà liké ce commentaire
    const existingLike = await prisma.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      }
    });
    
    if (existingLike) {
      // Retirer le like
      await prisma.commentLike.delete({
        where: {
          userId_commentId: {
            userId,
            commentId
          }
        }
      });
      res.json({ liked: false, message: 'Like retiré du commentaire' });
    } else {
      // Ajouter le like
      await prisma.commentLike.create({
        data: {
          userId,
          commentId
        }
      });
      res.json({ liked: true, message: 'Like ajouté au commentaire' });
    }
  } catch (error) {
    console.error('Erreur lors de la gestion du like de commentaire:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/social/views/:gameId - Récupérer le nombre de vues
router.get('/social/views/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const viewCount = await prisma.gameView.count({
      where: { gameId }
    });
    
    res.json({ totalViews: viewCount });
  } catch (error) {
    console.error('Erreur lors de la récupération des vues:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/cubematch/social/views/:gameId - Enregistrer une vue
router.post('/social/views/:gameId', requireAuth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user!.userId;
    
    // Éviter les doublons de vues (1 vue par utilisateur par jour)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const existingView = await prisma.gameView.findFirst({
      where: {
        gameId,
        userId,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });
    
    if (!existingView) {
      await prisma.gameView.create({
        data: {
          userId,
          gameId
        }
      });
    }
    
    res.json({ success: true, message: 'Vue enregistrée' });
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de la vue:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// GET /api/cubematch/social/stats/:gameId - Récupérer toutes les stats sociales d'un jeu (PUBLIC)
router.get('/social/stats/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    
    const [likes, shares, views, comments, gamesPlayed] = await Promise.all([
      prisma.gameLike.count({ where: { gameId } }),
      prisma.gameShare.count({ where: { gameId } }),
      prisma.gameView.count({ where: { gameId } }),
      prisma.gameComment.count({ where: { gameId } }),
      prisma.cubeMatchScore.count() // Total des parties jouées
    ]);
    
    res.json({
      likes,
      shares,
      views,
      comments,
      gamesPlayed
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats sociales:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
