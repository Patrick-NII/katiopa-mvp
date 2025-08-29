import express from 'express';
import { requireAuth } from '../middleware/requireAuth';
import chatService from '../services/chatService';

const router = express.Router();

// Initialisation du service de chat
router.use(async (req, res, next) => {
  try {
    await chatService.initialize();
    next();
  } catch (error) {
    console.error('❌ Erreur d\'initialisation du service de chat:', error);
    res.status(500).json({
      error: 'Service de chat indisponible',
      code: 'CHAT_SERVICE_UNAVAILABLE'
    });
  }
});

// Envoi d'un message
router.post('/send', requireAuth, async (req, res) => {
  try {
    const { message, focus } = req.body;
    const { userId, accountId } = req.user!;

    // Validation des données
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Le message est requis et ne peut pas être vide',
        code: 'MESSAGE_REQUIRED'
      });
    }

    // Envoi du message via le service de chat
    const result = await chatService.sendMessage(
      message.trim(),
      userId,
      accountId,
      focus
    );

    res.json({
      success: true,
      message: 'Message envoyé avec succès',
      data: {
        response: result.response,
        conversationId: result.conversationId
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi du message:', error);
    
    if (error?.message === 'Impossible de traiter le message') {
      return res.status(500).json({
        error: 'Impossible de traiter le message pour le moment',
        code: 'MESSAGE_PROCESSING_ERROR'
      });
    }

    res.status(500).json({
      error: 'Erreur lors de l\'envoi du message',
      code: 'MESSAGE_SEND_ERROR'
    });
  }
});

// Récupération de l'historique des conversations
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { userId } = req.user!;
    const limit = parseInt(req.query.limit as string) || 50;

    // Validation de la limite
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        error: 'La limite doit être comprise entre 1 et 100',
        code: 'INVALID_LIMIT'
      });
    }

    const conversations = await chatService.getConversationHistory(userId, limit);

    res.json({
      success: true,
      data: conversations
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'historique',
      code: 'HISTORY_RETRIEVAL_ERROR'
    });
  }
});

// Récupération d'une conversation spécifique
router.get('/conversation/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;

    if (!id) {
      return res.status(400).json({
        error: 'ID de conversation requis',
        code: 'CONVERSATION_ID_REQUIRED'
      });
    }

    const conversation = await chatService.getConversation(id);

    if (!conversation) {
      return res.status(404).json({
        error: 'Conversation non trouvée',
        code: 'CONVERSATION_NOT_FOUND'
      });
    }

    // Vérification que l'utilisateur peut accéder à cette conversation
    if (conversation.userSessionId !== userId) {
      return res.status(403).json({
        error: 'Accès non autorisé à cette conversation',
        code: 'CONVERSATION_ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la conversation:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de la conversation',
      code: 'CONVERSATION_RETRIEVAL_ERROR'
    });
  }
});

// Suppression d'une conversation
router.delete('/conversation/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user!;

    if (!id) {
      return res.status(400).json({
        error: 'ID de conversation requis',
        code: 'CONVERSATION_ID_REQUIRED'
      });
    }

    const deleted = await chatService.deleteConversation(id, userId);

    if (!deleted) {
      return res.status(404).json({
        error: 'Conversation non trouvée ou accès non autorisé',
        code: 'CONVERSATION_NOT_FOUND_OR_ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      message: 'Conversation supprimée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression de la conversation:', error);
    res.status(500).json({
      error: 'Erreur lors de la suppression de la conversation',
      code: 'CONVERSATION_DELETION_ERROR'
    });
  }
});

// Statut du service de chat
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'available',
      timestamp: new Date().toISOString(),
      service: 'Chat Service'
    }
  });
});

export default router;


