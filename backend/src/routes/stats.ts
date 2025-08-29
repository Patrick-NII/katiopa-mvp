import express from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Route pour récupérer les statistiques des activités
router.get("/activities", requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalActivities: 0,
        averageScore: 0,
        domains: []
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer un résumé des statistiques
router.get("/summary", requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        totalSessions: 0,
        totalTime: 0,
        progress: 0
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du résumé:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;