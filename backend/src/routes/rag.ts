import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import ragService from '../services/ragService';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// Schéma de validation pour les requêtes RAG
const ragQuerySchema = z.object({
  query: z.string().min(1).max(2000),
  focus: z.string().optional(),
  userType: z.string().optional(),
  limit: z.number().min(1).max(20).optional().default(5)
});

// Route pour initialiser le vector store RAG
router.post('/initialize', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier si l'utilisateur est admin ou a les droits
    if (user.userType !== 'ADMIN' && user.subscriptionType === 'FREE') {
      return res.status(403).json({ 
        error: 'Accès réservé aux comptes premium et administrateurs' 
      });
    }

    console.log('🔄 Initialisation du vector store RAG...');
    
    // Initialisation du vector store
    await ragService.initializeVectorStore();
    
    res.json({
      success: true,
      message: 'Vector store RAG initialisé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur initialisation RAG:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Route pour rechercher du contexte pertinent
router.post('/search', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Validation des données
    const { query, focus, userType, limit } = ragQuerySchema.parse(req.body);

    console.log(`🔍 Recherche RAG: "${query}" avec focus: ${focus || 'Général'}`);

    // Recherche de contexte pertinent
    const relevantDocs = await ragService.searchRelevantContext(
      query,
      focus,
      userType || user.userType,
      limit
    );

    // Formatage des résultats pour l'affichage
    const formattedResults = relevantDocs.map(doc => ({
      content: doc.pageContent,
      metadata: doc.metadata,
      relevance: doc.metadata.score || 0.8 // Score de pertinence par défaut
    }));

    res.json({
      success: true,
      query,
      focus,
      results: formattedResults,
      count: formattedResults.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur recherche RAG:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Données invalides', 
        details: error.errors 
      });
    }

    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Route pour réinitialiser le vector store
router.post('/reset', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier si l'utilisateur est admin
    if (user.userType !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'Accès réservé aux administrateurs' 
      });
    }

    console.log('🔄 Réinitialisation du vector store RAG...');
    
    // Réinitialisation du vector store
    await ragService.resetVectorStore();
    
    res.json({
      success: true,
      message: 'Vector store RAG réinitialisé avec succès',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur réinitialisation RAG:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Route pour obtenir les statistiques RAG
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Vérifier si l'utilisateur a accès aux stats
    if (user.userType !== 'ADMIN' && user.subscriptionType === 'FREE') {
      return res.status(403).json({ 
        error: 'Accès réservé aux comptes premium et administrateurs' 
      });
    }

    // Récupération des statistiques des conversations RAG
    const ragStats = await prisma.conversation.groupBy({
      by: ['focus'],
      where: {
        context: {
          path: ['ragEnabled'],
          equals: true
        }
      },
      _count: {
        id: true
      },
      _avg: {
        metadata: true
      }
    });

    // Statistiques générales
    const totalConversations = await prisma.conversation.count();
    const ragConversations = await prisma.conversation.count({
      where: {
        context: {
          path: ['ragEnabled'],
          equals: true
        }
      }
    });

    res.json({
      success: true,
      stats: {
        total: totalConversations,
        ragEnabled: ragConversations,
        ragPercentage: totalConversations > 0 ? Math.round((ragConversations / totalConversations) * 100) : 0,
        byFocus: ragStats
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur stats RAG:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

export default router;
