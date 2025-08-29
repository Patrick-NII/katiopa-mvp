import { ChatOpenAI } from '@langchain/openai';
import { PrismaClient } from '@prisma/client';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { Tool } from '@langchain/core/tools';
import ragService from './ragService';

const prisma = new PrismaClient();

// Configuration du modèle OpenAI
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini', // ou 'gpt-4' pour plus de puissance
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Outils personnalisés pour accéder aux données
class DatabaseQueryTool extends Tool {
  name = 'database_query';
  description = 'Interroge la base de données pour obtenir des informations sur les utilisateurs, sessions, activités, etc.';

  async _call(input: string) {
    try {
      // Analyse de la requête pour déterminer ce qui est demandé
      const query = input.toLowerCase();
      
      if (query.includes('enfant') || query.includes('session') || query.includes('compte')) {
        // Récupération des informations sur les sessions utilisateur
        const userSessions = await prisma.userSession.findMany({
          include: {
            user: {
              include: {
                account: true,
                activities: true,
              }
            },
            account: true,
          }
        });
        
        return JSON.stringify(userSessions, null, 2);
      }
      
      if (query.includes('activité') || query.includes('exercice') || query.includes('progrès')) {
        // Récupération des activités et progrès
        const activities = await prisma.activity.findMany({
          include: {
            userSession: {
              include: {
                user: true,
                account: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        return JSON.stringify(activities, null, 2);
      }
      
      if (query.includes('statistique') || query.includes('performance')) {
        // Récupération des statistiques
        const stats = await prisma.activity.groupBy({
          by: ['domain'],
          _count: {
            id: true
          },
          _avg: {
            score: true,
            durationMs: true
          }
        });
        
        return JSON.stringify(stats, null, 2);
      }
      
      return "Requête non reconnue. Utilisez des mots-clés comme 'enfant', 'session', 'activité', 'progrès', 'statistique'.";
      
    } catch (error) {
      return `Erreur lors de la requête: ${error.message}`;
    }
  }
}

class ProjectArchitectureTool extends Tool {
  name = 'project_architecture';
  description = 'Fournit des informations sur l\'architecture du projet Katiopa, les composants, et la logique métier.';

  async _call(input: string) {
    const architecture = {
      project: "Katiopa MVP - Plateforme d'apprentissage IA",
      description: "Plateforme éducative basée sur l'IA pour l'apprentissage personnalisé des enfants",
      architecture: {
        frontend: "Next.js avec React, Tailwind CSS, Framer Motion",
        backend: "Node.js avec Express, Prisma ORM, PostgreSQL",
        ai: "OpenAI GPT-4, LangChain pour l'orchestration",
        authentication: "JWT, sessions utilisateur, gestion des rôles"
      },
      businessLogic: {
        userTypes: ["CHILD", "PARENT", "TEACHER", "ADMIN"],
        subscriptionTypes: ["FREE", "PRO", "PRO_PLUS", "ENTERPRISE"],
        sessionManagement: "Gestion des sessions enfants/parents avec temps de connexion",
        learningDomains: ["Mathématiques", "Programmation", "Lecture", "Sciences", "IA & Logique"],
        aiEvaluation: "Évaluation continue des progrès avec recommandations personnalisées"
      },
      dataStructure: {
        accounts: "Comptes utilisateur avec abonnements",
        userSessions: "Sessions actives des enfants et parents",
        activities: "Activités d'apprentissage avec scores et durées",
        userProfiles: "Profils détaillés avec préférences et objectifs"
      }
    };
    
    return JSON.stringify(architecture, null, 2);
  }
}

// Prompt principal pour l'Assistant IA Katiopa
const createMainPrompt = (userType: string, firstName: string, subscriptionType: string) => {
  return PromptTemplate.fromTemplate(`
Tu es l'Assistant IA Katiopa, une équipe pédagogique virtuelle d'excellence représentant une école réputée pour former les meilleurs cerveaux.

CONTEXTE UTILISATEUR:
- Type: ${userType}
- Prénom: ${firstName}
- Abonnement: ${subscriptionType}

TON RÔLE:
Tu es un expert pédagogique de niveau international avec:
- Expertise en neurosciences cognitives
- Méthodes d'apprentissage éprouvées (Montessori, Freinet, etc.)
- Capacité d'analyse fine des progrès
- Anticipation des besoins éducatifs
- Évaluation continue et personnalisée

MISSION:
1. Analyser les données de l'utilisateur avec précision
2. Fournir des insights pédagogiques de qualité
3. Anticiper les besoins d'apprentissage
4. Donner des recommandations personnalisées
5. Créer un lien émotionnel et motivant

STYLE DE COMMUNICATION:
- ${userType === 'PARENT' ? 'Professionnel mais chaleureux, rassurant, orienté résultats' : 'Encourageant, adapté à l\'âge, ludique et motivant'}
- Utilise le prénom de l'utilisateur
- Sois précis et concret dans tes analyses
- Donne des exemples pratiques
- Reste toujours positif et constructif

QUESTION DE L'UTILISATEUR: {question}

RÉPONSE:
`);
};

// Service principal LLM
export class LLMService {
  private tools: Tool[];
  
  constructor() {
    this.tools = [
      new DatabaseQueryTool(),
      new ProjectArchitectureTool(),
    ];
  }

  async processUserQuery(
    question: string,
    userType: string,
    firstName: string,
    subscriptionType: string,
    focus?: string,
    userSessionId?: string,
    accountId?: string
  ): Promise<string> {
    try {
      // Utilisation du service RAG pour une réponse enrichie
      console.log('🧠 Utilisation du service RAG avancé...');
      
      const response = await ragService.generateRAGResponse(
        question,
        userType,
        firstName,
        subscriptionType,
        focus,
        userSessionId,
        accountId
      );

      return response;
      
    } catch (error) {
      console.error('Erreur LLM Service:', error);
      
      // Fallback vers la méthode classique si le RAG échoue
      console.log('🔄 Fallback vers la méthode classique...');
      try {
        const prompt = createMainPrompt(userType, firstName, subscriptionType);
        
        const chain = RunnableSequence.from([
          prompt,
          llm,
          new StringOutputParser(),
        ]);

        const fallbackResponse = await chain.invoke({
          question: `${question}\n\nContexte supplémentaire: ${focus ? `Matière de focus: ${focus}` : ''}`,
        });

        // Sauvegarde de la conversation de fallback
        if (userSessionId && accountId) {
          try {
            await this.saveConversation(
              userSessionId,
              accountId,
              question,
              fallbackResponse,
              focus,
              userType,
              subscriptionType
            );
          } catch (saveError) {
            console.error('Erreur lors de la sauvegarde de la conversation de fallback:', saveError);
          }
        }

        return fallbackResponse;
        
      } catch (fallbackError) {
        console.error('Erreur lors du fallback:', fallbackError);
        return `Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants. Erreur: ${error.message}`;
      }
    }
  }

  // Méthode privée pour sauvegarder une conversation
  private async saveConversation(
    userSessionId: string,
    accountId: string,
    message: string,
    response: string,
    focus?: string,
    userType?: string,
    subscriptionType?: string
  ): Promise<void> {
    try {
      const context = {
        userType,
        subscriptionType,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
        focus
      };

      const metadata = {
        messageLength: message.length,
        responseLength: response.length,
        estimatedTokens: Math.ceil((message.length + response.length) / 4), // Estimation approximative
        processingTime: new Date().toISOString()
      };

      await prisma.conversation.create({
        data: {
          userSessionId,
          accountId,
          message,
          response,
          focus,
          context,
          metadata
        }
      });

      console.log('✅ Conversation sauvegardée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la conversation:', error);
      throw error;
    }
  }

  async getContextualResponse(
    userType: string,
    firstName: string,
    subscriptionType: string
  ): Promise<string> {
    try {
      const contextualPrompt = PromptTemplate.fromTemplate(`
Tu es l'Assistant IA Katiopa. Génère une réponse contextuelle et personnalisée pour:

Utilisateur: ${firstName} (${userType})
Abonnement: ${subscriptionType}

Donne une analyse rapide, des encouragements et des recommandations personnalisées.
Sois chaleureux, professionnel et motivant.
`);

      const chain = RunnableSequence.from([
        contextualPrompt,
        llm,
        new StringOutputParser(),
      ]);

      const response = await chain.invoke({});
      return response;
      
    } catch (error) {
      console.error('Erreur réponse contextuelle:', error);
      return `Bonjour ${firstName} ! Je suis ravi de vous accompagner dans votre apprentissage avec Katiopa.`;
    }
  }
}

export default new LLMService();
