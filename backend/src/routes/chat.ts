import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import llmService from '../services/llmService';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// Schéma de validation pour les messages
const chatMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  focus: z.string().optional(),
});

// Route pour envoyer un message à l'IA Coach
router.post('/send', requireAuth, async (req, res) => {
  try {
    // Validation des données
    const { message, focus } = chatMessageSchema.parse(req.body);
    
    // Récupération des informations utilisateur depuis le token
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

          // Traitement du message par le service LLM
      const response = await llmService.processUserQuery(
        message,
        user.userType,
        user.firstName,
        user.subscriptionType,
        focus,
        user.id, // userSessionId
        user.accountId // accountId
      );

    // Sauvegarde de la conversation (optionnel pour l'instant)
    // TODO: Implémenter la sauvegarde des conversations

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        userType: user.userType,
        subscriptionType: user.subscriptionType
      }
    });

  } catch (error) {
    console.error('Erreur chat API:', error);
    
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

// Route pour obtenir une réponse contextuelle
router.get('/contextual', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Génération d'une réponse contextuelle
    const response = await llmService.getContextualResponse(
      user.userType,
      user.firstName,
      user.subscriptionType
    );

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur réponse contextuelle:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

// Route pour obtenir l'historique des conversations
router.get('/history', requireAuth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // Récupération de l'historique des conversations
    const conversations = await prisma.conversation.findMany({
      where: {
        userSessionId: user.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50, // Limiter à 50 conversations récentes
      select: {
        id: true,
        message: true,
        response: true,
        focus: true,
        context: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      conversations,
      count: conversations.length
    });

  } catch (error) {
    console.error('Erreur historique chat:', error);
    res.status(500).json({ 
      error: 'Erreur interne du serveur',
      message: error.message 
    });
  }
});

export default router;
