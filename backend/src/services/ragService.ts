import { ChatOpenAI } from '@langchain/openai';
import { PrismaClient } from '@prisma/client';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { OpenAIEmbeddings } from '@langchain/openai';
import { MemoryVectorStore } from '@langchain/community/vectorstores/memory';
import { Document } from '@langchain/core/documents';

const prisma = new PrismaClient();

// Configuration des modèles OpenAI
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// Service RAG avancé
export class RAGService {
  private vectorStore: MemoryVectorStore | null = null;
  private isInitialized = false;

  // Initialisation du vector store avec les données existantes
  async initializeVectorStore(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initialisation du vector store RAG...');

      // Récupération de toutes les conversations existantes
      const conversations = await prisma.conversation.findMany({
        select: {
          id: true,
          message: true,
          response: true,
          focus: true,
          context: true,
          createdAt: true,
          userSession: {
            select: {
              firstName: true,
              userType: true,
              age: true,
              grade: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Création des documents pour le vector store
      const documents: Document[] = [];
      
      conversations.forEach(conv => {
        // Document pour la question
        documents.push(new Document({
          pageContent: `Question: ${conv.message}\nContexte: ${conv.focus || 'Général'}\nUtilisateur: ${conv.userSession?.firstName} (${conv.userSession?.userType}, ${conv.userSession?.age || 'N/A'} ans, ${conv.userSession?.grade || 'N/A'})`,
          metadata: {
            type: 'question',
            conversationId: conv.id,
            focus: conv.focus,
            userType: conv.userSession?.userType,
            timestamp: conv.createdAt
          }
        }));

        // Document pour la réponse
        documents.push(new Document({
          pageContent: `Réponse: ${conv.response}\nQuestion associée: ${conv.message}\nContexte: ${conv.focus || 'Général'}`,
          metadata: {
            type: 'response',
            conversationId: conv.id,
            focus: conv.focus,
            userType: conv.userSession?.userType,
            timestamp: conv.createdAt
          }
        }));
      });

      // Ajout de documents de connaissances générales sur Katiopa
      const knowledgeDocuments = this.createKnowledgeDocuments();
      documents.push(...knowledgeDocuments);

      // Création du vector store
      this.vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
      
      console.log(`✅ Vector store initialisé avec ${documents.length} documents`);
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du vector store:', error);
      throw error;
    }
  }

  // Création de documents de connaissances sur Katiopa
  private createKnowledgeDocuments(): Document[] {
    const knowledge = [
      {
        content: `Katiopa est une plateforme d'apprentissage IA innovante qui combine:
        - Intelligence artificielle avancée pour l'éducation personnalisée
        - Gestion des sessions enfants/parents avec suivi des progrès
        - Domaines d'apprentissage: Mathématiques, Programmation, Lecture, Sciences, IA & Logique
        - Types d'abonnements: FREE (1 session), PRO (2 sessions), PRO_PLUS (4 sessions)
        - Évaluation continue des progrès avec recommandations personnalisées`,
        metadata: { type: 'knowledge', category: 'platform_overview' }
      },
      {
        content: `Méthodes pédagogiques utilisées par Katiopa:
        - Approche Montessori: Apprentissage par l'expérience et l'exploration
        - Méthode Freinet: Pédagogie active et coopérative
        - Neurosciences cognitives: Adaptation au développement du cerveau
        - Gamification: Apprentissage ludique et engageant
        - Personnalisation: Adaptation au rythme et style de chaque enfant`,
        metadata: { type: 'knowledge', category: 'pedagogy' }
      },
      {
        content: `Types d'utilisateurs et leurs besoins:
        - ENFANTS: Apprentissage ludique, encouragements, explications simples
        - PARENTS: Suivi des progrès, recommandations, conseils éducatifs
        - ENSEIGNANTS: Outils pédagogiques, analyse des performances
        - ADMIN: Gestion de la plateforme et des utilisateurs`,
        metadata: { type: 'knowledge', category: 'user_types' }
      },
      {
        content: `Domaines d'apprentissage et leurs spécificités:
        - Mathématiques: Niveaux CP à CM2, progression logique, exercices pratiques
        - Programmation: Logique, algorithmes, créativité, résolution de problèmes
        - Lecture: Compréhension, vocabulaire, fluidité, plaisir de lire
        - Sciences: Expérimentation, observation, raisonnement scientifique
        - IA & Logique: Pensée computationnelle, résolution de problèmes complexes`,
        metadata: { type: 'knowledge', category: 'learning_domains' }
      }
    ];

    return knowledge.map(k => new Document({
      pageContent: k.content,
      metadata: k.metadata
    }));
  }

  // Recherche vectorielle pour enrichir le contexte
  async searchRelevantContext(
    query: string,
    focus?: string,
    userType?: string,
    limit: number = 5
  ): Promise<Document[]> {
    if (!this.vectorStore) {
      await this.initializeVectorStore();
    }

    try {
      // Recherche avec filtres contextuels
      let searchQuery = query;
      
      // Ajout du focus si spécifié
      if (focus) {
        searchQuery += ` ${focus} domaine apprentissage`;
      }

      // Ajout du type d'utilisateur si spécifié
      if (userType) {
        searchQuery += ` ${userType} utilisateur`;
      }

      // Recherche vectorielle
      const results = await this.vectorStore!.similaritySearch(searchQuery, limit);

      console.log(`🔍 Recherche RAG: ${results.length} documents pertinents trouvés`);
      return results;

    } catch (error) {
      console.error('❌ Erreur lors de la recherche RAG:', error);
      return [];
    }
  }

  // Génération de réponse enrichie avec RAG
  async generateRAGResponse(
    question: string,
    userType: string,
    firstName: string,
    subscriptionType: string,
    focus?: string,
    userSessionId?: string,
    accountId?: string
  ): Promise<string> {
    try {
      // Recherche de contexte pertinent
      const relevantDocs = await this.searchRelevantContext(question, focus, userType);

      // Création du prompt enrichi avec RAG
      const ragPrompt = this.createRAGPrompt(userType, firstName, subscriptionType, relevantDocs);

      // Chaîne de traitement RAG
      const chain = RunnableSequence.from([
        ragPrompt,
        llm,
        new StringOutputParser(),
      ]);

      // Exécution avec contexte enrichi
      const response = await chain.invoke({
        question,
        focus: focus || 'Général',
        relevantContext: relevantDocs.map(doc => doc.pageContent).join('\n\n'),
        userType,
        subscriptionType
      });

      // Sauvegarde de la conversation enrichie
      if (userSessionId && accountId) {
        await this.saveEnrichedConversation(
          userSessionId,
          accountId,
          question,
          response,
          focus,
          userType,
          subscriptionType,
          relevantDocs
        );
      }

      return response;

    } catch (error) {
      console.error('❌ Erreur lors de la génération RAG:', error);
      return `Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants. Erreur: ${error.message}`;
    }
  }

  // Création du prompt RAG enrichi
  private createRAGPrompt(
    userType: string,
    firstName: string,
    subscriptionType: string,
    relevantDocs: Document[]
  ): PromptTemplate {
    const contextExamples = relevantDocs
      .map((doc, index) => `Exemple ${index + 1}:\n${doc.pageContent}`)
      .join('\n\n');

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

CONTEXTE PERTINENT TROUVÉ:
${contextExamples}

MISSION:
1. Utilise le contexte pertinent ci-dessus pour enrichir ta réponse
2. Analyse les données de l'utilisateur avec précision
3. Fournis des insights pédagogiques de qualité
4. Anticipe les besoins d'apprentissage
5. Donne des recommandations personnalisées
6. Crée un lien émotionnel et motivant

STYLE DE COMMUNICATION:
- ${userType === 'PARENT' ? 'Professionnel mais chaleureux, rassurant, orienté résultats' : 'Encourageant, adapté à l\'âge, ludique et motivant'}
- Utilise le prénom de l'utilisateur
- Sois précis et concret dans tes analyses
- Donne des exemples pratiques
- Reste toujours positif et constructif
- Réfère-toi au contexte pertinent quand c'est approprié

QUESTION DE L'UTILISATEUR: {question}
MATIÈRE DE FOCUS: {focus}

RÉPONSE ENRICHIE:
`);
  }

  // Sauvegarde de conversation enrichie avec métadonnées RAG
  private async saveEnrichedConversation(
    userSessionId: string,
    accountId: string,
    message: string,
    response: string,
    focus?: string,
    userType?: string,
    subscriptionType?: string,
    relevantDocs?: Document[]
  ): Promise<void> {
    try {
      const context = {
        userType,
        subscriptionType,
        timestamp: new Date().toISOString(),
        model: 'gpt-4o-mini',
        focus,
        ragEnabled: true,
        relevantDocumentsCount: relevantDocs?.length || 0
      };

      const metadata = {
        messageLength: message.length,
        responseLength: response.length,
        estimatedTokens: Math.ceil((message.length + response.length) / 4),
        processingTime: new Date().toISOString(),
        ragDocuments: relevantDocs?.map(doc => ({
          content: doc.pageContent.substring(0, 100) + '...',
          metadata: doc.metadata
        })) || []
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

      console.log('✅ Conversation RAG enrichie sauvegardée avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de la conversation RAG:', error);
      throw error;
    }
  }

  // Mise à jour du vector store avec de nouvelles conversations
  async updateVectorStore(newConversation: any): Promise<void> {
    if (!this.vectorStore) {
      await this.initializeVectorStore();
    }

    try {
      // Ajout des nouveaux documents
      const newDocs = [
        new Document({
          pageContent: `Question: ${newConversation.message}\nContexte: ${newConversation.focus || 'Général'}`,
          metadata: {
            type: 'question',
            conversationId: newConversation.id,
            focus: newConversation.focus,
            timestamp: newConversation.createdAt
          }
        }),
        new Document({
          pageContent: `Réponse: ${newConversation.response}\nQuestion associée: ${newConversation.message}`,
          metadata: {
            type: 'response',
            conversationId: newConversation.id,
            focus: newConversation.focus,
            timestamp: newConversation.createdAt
          }
        })
      ];

      await this.vectorStore!.addDocuments(newDocs);
      console.log('✅ Vector store mis à jour avec la nouvelle conversation');

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du vector store:', error);
    }
  }

  // Réinitialisation du vector store (pour les tests ou mises à jour majeures)
  async resetVectorStore(): Promise<void> {
    this.vectorStore = null;
    this.isInitialized = false;
    console.log('🔄 Vector store réinitialisé');
  }
}

export default new RAGService();

