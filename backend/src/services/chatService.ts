import { PrismaClient } from '@prisma/client';
import llmService from './llmService';

const prisma = new PrismaClient();

// Service de chat simplifié
export class ChatService {
  private isInitialized = false;

  // Initialisation du service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initialisation du service de chat...');
      
      // Initialisation du service LLM
      await llmService.initialize();
      
      console.log('✅ Service de chat initialisé avec succès');
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service de chat:', error);
      throw error;
    }
  }

  // Envoi d'un message et génération de réponse
  async sendMessage(
    message: string,
    userSessionId: string,
    accountId: string,
    focus?: string
  ): Promise<{ response: string; conversationId: string }> {
    try {
      // Récupération des informations de l'utilisateur
      const userSession = await prisma.userSession.findUnique({
        where: { id: userSessionId },
        include: {
          account: true,
          profile: true
        }
      });

      if (!userSession) {
        throw new Error('Session utilisateur non trouvée');
      }

      // Génération de la réponse avec le service LLM
      const response = await llmService.generateResponse(
        message,
        userSession.userType,
        userSession.firstName,
        focus
      );

      // Sauvegarde de la conversation
      const conversation = await prisma.conversation.create({
        data: {
          userSessionId,
          accountId,
          message,
          response,
          focus,
          context: {
            userType: userSession.userType,
            subscriptionType: userSession.account.subscriptionType,
            timestamp: new Date().toISOString(),
            model: 'gpt-4o-mini',
            focus
          },
          metadata: {
            messageLength: message.length,
            responseLength: response.length,
            estimatedTokens: Math.ceil((message.length + response.length) / 4),
            processingTime: new Date().toISOString()
          }
        }
      });

      return {
        response,
        conversationId: conversation.id
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du message:', error);
      throw new Error('Impossible de traiter le message');
    }
  }

  // Récupération de l'historique des conversations
  async getConversationHistory(
    userSessionId: string,
    limit: number = 50
  ): Promise<any[]> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: { userSessionId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          message: true,
          response: true,
          focus: true,
          createdAt: true,
          context: true
        }
      });

      return conversations;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'historique:', error);
      return [];
    }
  }

  // Récupération d'une conversation spécifique
  async getConversation(conversationId: string): Promise<any | null> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          userSession: {
            select: {
              firstName: true,
              userType: true,
              age: true,
              grade: true
            }
          }
        }
      });

      return conversation;

    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la conversation:', error);
      return null;
    }
  }

  // Suppression d'une conversation
  async deleteConversation(conversationId: string, userSessionId: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userSessionId
        }
      });

      if (!conversation) {
        return false;
      }

      await prisma.conversation.delete({
        where: { id: conversationId }
      });

      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la suppression de la conversation:', error);
      return false;
    }
  }

  // Réinitialisation du service
  async reset(): Promise<void> {
    this.isInitialized = false;
    console.log('🔄 Service de chat réinitialisé');
  }
}

export default new ChatService();

