import express from 'express';
import { requireAuth } from '../middleware/requireAuth';

const router = express.Router();

// Route pour créer une activité
router.post("/", requireAuth, async (req, res) => {
  try {
    const { domain, nodeKey, score, attempts, durationMs } = req.body;
    
    // Validation simple
    if (!domain || !nodeKey || score === undefined) {
      return res.status(400).json({
        error: 'Données manquantes',
        code: 'MISSING_DATA'
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Activité créée avec succès',
      data: { domain, nodeKey, score, attempts, durationMs }
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création d\'activité:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

// Route pour récupérer les activités d'un utilisateur
router.get("/", requireAuth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: 'Aucune activité pour le moment'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des activités:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;