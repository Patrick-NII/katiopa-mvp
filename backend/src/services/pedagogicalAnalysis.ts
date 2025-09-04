import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const prisma = new PrismaClient();

// Types pour l'analyse pédagogique
interface PedagogicalContext {
  childName: string;
  age: number;
  grade: string;
  daysSinceRegistration: number;
  totalLearningTime: number;
  averageSessionDuration: number;
  learningFrequency: string;
  sessionPatterns: {
    morning: number;
    afternoon: number;
    evening: number;
  };
  preferredTimeSlots: string;
  totalActivities: number;
  averageScore: number;
  recentActivities: Array<{
    type: string;
    title: string;
    score: number;
    duration: number;
    completedAt: Date;
  }>;
  parentPreferences?: {
    childStrengths: string[];
    focusAreas: string[];
    learningGoals: string[];
    concerns: string[];
    studyDuration: number;
    learningStyle?: string;
  };
}

// Types pour les prompts parents et CubeAI
interface ParentPromptContext {
  content: string;
  childName: string;
  childAge: number;
  childLevel: string;
  context: {
    accountType: string;
    childSessionId: string;
    parentSessionId: string;
  };
}

interface CubeAIContext {
  childName: string;
  childAge: number;
  childLevel: string;
  accountType: string;
  parentPrompts: Array<{
    content: string;
    type: string;
    date: Date;
  }>;
  userMessage: string;
  context: any;
}

interface CubeAIExerciseContext {
  childName: string;
  childAge: number;
  childLevel: string;
  accountType: string;
  exerciseType: string;
  difficulty: string;
  parentPrompts: any[];
}

// Nouveau type pour le contexte complet de l'élève
interface CompleteChildContext {
  // Informations de base
  childName: string;
  childAge: number;
  childLevel: string;
  accountType: string;
  sessionId: string;
  
  // Statistiques d'apprentissage
  totalLearningTime: number;
  averageScore: number;
  totalActivities: number;
  daysSinceRegistration: number;
  
  // Activités récentes
  recentActivities: Array<{
    type: string;
    title: string;
    score: number;
    duration: number;
    completedAt: Date;
    domain: string;
  }>;
  
  // Analyse des domaines
  domainAnalysis: Array<{
    domain: string;
    totalActivities: number;
    averageScore: number;
    strengths: string[];
    weaknesses: string[];
    lastActivity: Date;
  }>;
  
  // Prompts des parents
  parentPrompts: Array<{
    content: string;
    processedContent: string;
    type: string;
    date: Date;
    status: string;
  }>;
  
  // Sessions et connexions
  sessionStats: {
    totalSessions: number;
    averageSessionDuration: number;
    preferredTimeSlots: string[];
    lastSessionDate: Date;
  };
  
  // Objectifs et préférences
  learningGoals: string[];
  preferredLearningStyle: string;
  focusAreas: string[];
  strengths: string[];
  concerns: string[];
}

// Prompt pour l'analyse des progrès (version ultra-concise stricte)
const PROGRESS_ANALYSIS_PROMPT = `
Analyse rapide pour {childName} ({age} ans).

INFOS:
- Score: {averageScore}%
- Temps: {totalLearningTime} min

FORMAT DE RÉPONSE EXACT (4 phrases courtes, 50 mots max):
1. Point fort: [1 phrase]
2. Point faible: [1 phrase]  
3. Conseil: [1 phrase]
4. Motivation: [1 phrase]

RÈGLES STRICTES:
- PAS de salutation
- PAS de conclusion
- PAS de titre
- JUSTE 4 phrases courtes
- MAXIMUM 50 MOTS TOTAL
- Format simple: Point fort. Point faible. Conseil. Motivation.

RÉPONDRE MAINTENANT:
`;

// Prompt pour la génération d'exercices (version ultra-concise stricte)
const EXERCISE_GENERATION_PROMPT = `
Exercice pour {childName} ({age} ans).

INFOS:
- Score: {averageScore}%
- Forces: {childStrengths}

FORMAT DE RÉPONSE EXACT (4 éléments courts, 40 mots max):
1. Nom: [3 mots max]
2. Description: [1 phrase courte]
3. Durée: [ex: "15 min"]
4. Bénéfice: [1 phrase courte]

RÈGLES STRICTES:
- PAS de salutation
- PAS de conclusion
- PAS de titre
- JUSTE 4 éléments courts
- MAXIMUM 40 MOTS TOTAL
- Format simple: Nom. Description. Durée. Bénéfice.

RÉPONDRE MAINTENANT:
`;

// Prompt pour l'analyse globale (version ultra-concise stricte)
const GLOBAL_ANALYSIS_PROMPT = `
Analyse globale pour {childName} ({age} ans).

INFOS:
- Score: {averageScore}%
- Temps: {totalLearningTime} min
- Fréquence: {learningFrequency}

FORMAT DE RÉPONSE EXACT (5 phrases courtes, 60 mots max):
1. Bilan général: [1 phrase]
2. Progression: [1 phrase]
3. Recommandation: [1 phrase]
4. Objectif: [1 phrase]
5. Encouragement: [1 phrase]

RÈGLES STRICTES:
- PAS de salutation
- PAS de conclusion
- PAS de titre
- JUSTE 5 phrases courtes
- MAXIMUM 60 MOTS TOTAL
- Format simple: Bilan. Progression. Recommandation. Objectif. Encouragement.

RÉPONDRE MAINTENANT:
`;

export class PedagogicalAnalysisService {
  
  // Récupérer le contexte complet de l'élève
  static async getCompleteChildContext(childSessionId: string): Promise<CompleteChildContext> {
    try {
      console.log('🔍 Récupération du contexte complet pour l\'enfant:', childSessionId);
      
      // Récupérer les données de base de l'enfant
      const childSession = await prisma.userSession.findUnique({
        where: { sessionId: childSessionId },
        include: {
          account: true,
          activities: {
            orderBy: { createdAt: 'desc' },
            take: 20
          },
          childActivities: {
            orderBy: { completedAt: 'desc' },
            take: 20
          },
          parentPrompts: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          cubeAIConversations: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!childSession) {
        throw new Error('Session enfant non trouvée');
      }

      // Calculer les statistiques
      const totalLearningTime = childSession.activities.reduce((sum, activity) => sum + (activity.duration || 0), 0);
      const averageScore = childSession.activities.length > 0 
        ? childSession.activities.reduce((sum, activity) => sum + (activity.score || 0), 0) / childSession.activities.length
        : 0;

      // Analyser les domaines
      const domainAnalysis = await this.analyzeDomains(childSession.activities);

      // Analyser les sessions
      const sessionStats = await this.analyzeSessions(childSessionId);

      // Extraire les objectifs des prompts parents
      const learningGoals = this.extractLearningGoals(childSession.parentPrompts);
      const focusAreas = this.extractFocusAreas(childSession.parentPrompts);
      const strengths = this.extractStrengths(childSession.parentPrompts);
      const concerns = this.extractConcerns(childSession.parentPrompts);

      const context: CompleteChildContext = {
        childName: childSession.name,
        childAge: childSession.age || 8,
        childLevel: childSession.level || 'BEGINNER',
        accountType: childSession.account.subscriptionType,
        sessionId: childSession.sessionId,
        totalLearningTime,
        averageScore: Math.round(averageScore),
        totalActivities: childSession.activities.length,
        daysSinceRegistration: Math.floor((Date.now() - childSession.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        recentActivities: childSession.activities.map(activity => ({
          type: activity.type,
          title: activity.title,
          score: activity.score || 0,
          duration: activity.duration || 0,
          completedAt: activity.completedAt,
          domain: activity.domain || 'GENERAL'
        })),
        domainAnalysis,
        parentPrompts: childSession.parentPrompts.map(prompt => ({
          content: prompt.content,
          processedContent: prompt.processedContent,
          type: prompt.promptType,
          date: prompt.createdAt,
          status: prompt.status
        })),
        sessionStats,
        learningGoals,
        preferredLearningStyle: this.determineLearningStyle(childSession.activities),
        focusAreas,
        strengths,
        concerns
      };

      console.log('✅ Contexte complet récupéré:', {
        childName: context.childName,
        totalActivities: context.totalActivities,
        averageScore: context.averageScore,
        parentPrompts: context.parentPrompts.length
      });

      return context;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du contexte:', error);
      throw error;
    }
  }

  // Analyser les domaines d'apprentissage
  private static async analyzeDomains(activities: any[]): Promise<any[]> {
    const domains = ['MATH', 'CODE', 'SCIENCE', 'LANGUAGE', 'GENERAL'];
    const analysis = [];

    for (const domain of domains) {
      const domainActivities = activities.filter(activity => activity.domain === domain);
      if (domainActivities.length === 0) continue;

      const totalActivities = domainActivities.length;
      const averageScore = domainActivities.reduce((sum, activity) => sum + (activity.score || 0), 0) / totalActivities;
      const strengths = this.identifyStrengths(domainActivities);
      const weaknesses = this.identifyWeaknesses(domainActivities);
      const lastActivity = domainActivities[0]?.completedAt;

      analysis.push({
        domain,
        totalActivities,
        averageScore: Math.round(averageScore),
        strengths,
        weaknesses,
        lastActivity
      });
    }

    return analysis;
  }

  // Analyser les sessions
  private static async analyzeSessions(sessionId: string): Promise<any> {
    const sessions = await prisma.userSession.findMany({
      where: { accountId: { equals: (await prisma.userSession.findUnique({ where: { sessionId } }))?.accountId } },
      orderBy: { createdAt: 'desc' }
    });

    const totalSessions = sessions.length;
    const averageSessionDuration = sessions.reduce((sum, session) => {
      if (session.currentSessionStartTime && session.lastLoginAt) {
        return sum + (session.lastLoginAt.getTime() - session.currentSessionStartTime.getTime());
      }
      return sum;
    }, 0) / totalSessions;

    const timeSlots = this.analyzeTimeSlots(sessions);
    const lastSessionDate = sessions[0]?.createdAt;

    return {
      totalSessions,
      averageSessionDuration: Math.round(averageSessionDuration / (1000 * 60)), // en minutes
      preferredTimeSlots: timeSlots,
      lastSessionDate
    };
  }

  // Analyser les créneaux horaires préférés
  private static analyzeTimeSlots(sessions: any[]): string[] {
    const timeSlots = { morning: 0, afternoon: 0, evening: 0 };
    
    sessions.forEach(session => {
      const hour = session.createdAt.getHours();
      if (hour >= 6 && hour < 12) timeSlots.morning++;
      else if (hour >= 12 && hour < 18) timeSlots.afternoon++;
      else timeSlots.evening++;
    });

    const preferred = [];
    if (timeSlots.morning > timeSlots.afternoon && timeSlots.morning > timeSlots.evening) preferred.push('matin');
    if (timeSlots.afternoon > timeSlots.morning && timeSlots.afternoon > timeSlots.evening) preferred.push('après-midi');
    if (timeSlots.evening > timeSlots.morning && timeSlots.evening > timeSlots.afternoon) preferred.push('soirée');

    return preferred;
  }

  // Identifier les forces dans un domaine
  private static identifyStrengths(activities: any[]): string[] {
    const strengths = [];
    const highScores = activities.filter(activity => (activity.score || 0) >= 80);
    
    if (highScores.length > activities.length * 0.7) strengths.push('Excellente maîtrise');
    if (activities.length > 10) strengths.push('Pratique régulière');
    if (activities.some(activity => activity.duration > 30)) strengths.push('Endurance d\'apprentissage');
    
    return strengths;
  }

  // Identifier les faiblesses dans un domaine
  private static identifyWeaknesses(activities: any[]): string[] {
    const weaknesses = [];
    const lowScores = activities.filter(activity => (activity.score || 0) < 60);
    
    if (lowScores.length > activities.length * 0.5) weaknesses.push('Besoin de renforcement');
    if (activities.length < 5) weaknesses.push('Pratique insuffisante');
    if (activities.some(activity => activity.duration < 5)) weaknesses.push('Sessions trop courtes');
    
    return weaknesses;
  }

  // Déterminer le style d'apprentissage
  private static determineLearningStyle(activities: any[]): string {
    const avgDuration = activities.reduce((sum, activity) => sum + (activity.duration || 0), 0) / activities.length;
    const avgScore = activities.reduce((sum, activity) => sum + (activity.score || 0), 0) / activities.length;
    
    if (avgDuration > 20 && avgScore > 75) return 'Apprenant approfondi';
    if (avgDuration < 10 && avgScore > 70) return 'Apprenant rapide';
    if (avgScore < 60) return 'Apprenant en difficulté';
    return 'Apprenant équilibré';
  }

  // Extraire les objectifs d'apprentissage des prompts parents
  private static extractLearningGoals(prompts: any[]): string[] {
    const goals = [];
    prompts.forEach(prompt => {
      const content = prompt.processedContent || prompt.content;
      if (content.includes('objectif') || content.includes('but') || content.includes('vise')) {
        goals.push(content);
      }
    });
    return goals;
  }

  // Extraire les domaines de focus
  private static extractFocusAreas(prompts: any[]): string[] {
    const areas = [];
    prompts.forEach(prompt => {
      const content = prompt.processedContent || prompt.content;
      if (content.includes('math') || content.includes('mathématiques')) areas.push('Mathématiques');
      if (content.includes('code') || content.includes('programmation')) areas.push('Programmation');
      if (content.includes('science')) areas.push('Sciences');
      if (content.includes('langue') || content.includes('français')) areas.push('Langues');
    });
    return [...new Set(areas)];
  }

  // Extraire les forces
  private static extractStrengths(prompts: any[]): string[] {
    const strengths = [];
    prompts.forEach(prompt => {
      const content = prompt.processedContent || prompt.content;
      if (content.includes('fort') || content.includes('bon') || content.includes('excellent')) {
        strengths.push(content);
      }
    });
    return strengths;
  }

  // Extraire les préoccupations
  private static extractConcerns(prompts: any[]): string[] {
    const concerns = [];
    prompts.forEach(prompt => {
      const content = prompt.processedContent || prompt.content;
      if (content.includes('difficulté') || content.includes('problème') || content.includes('inquiet')) {
        concerns.push(content);
      }
    });
    return concerns;
  }
  
  // Analyser les progrès avec IA
  static async analyzeProgress(context: PedagogicalContext): Promise<string> {
    try {
      console.log('🔍 Début de l\'analyse des progrès pour:', context.childName);
      
      // Version de fallback sans OpenAI pour le moment
      const fallbackAnalysis = this.generateFallbackAnalysis(context);
      console.log('✅ Analyse de fallback générée');
      
      return fallbackAnalysis;
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse des progrès:', error);
      return this.generateFallbackAnalysis(context);
    }
  }

  // Générer une analyse de fallback
  static generateFallbackAnalysis(context: PedagogicalContext): string {
    const score = context.averageScore;
    const activities = context.totalActivities;
    
    let pointFort = "Bon engagement dans les activités.";
    let pointFaible = "Peut améliorer la précision.";
    let conseil = "Continuez à pratiquer régulièrement.";
    let motivation = "Vous progressez bien !";
    
    if (score >= 80) {
      pointFort = "Excellents résultats obtenus.";
      pointFaible = "Maintenez ce niveau.";
      conseil = "Tentez des défis plus difficiles.";
      motivation = "Continuez sur cette lancée !";
    } else if (score >= 60) {
      pointFort = "Bonne participation aux exercices.";
      pointFaible = "Attention aux erreurs de précision.";
      conseil = "Révisez les points difficiles.";
      motivation = "Vous êtes sur la bonne voie !";
    } else {
      pointFort = "Persévérance dans l'apprentissage.";
      pointFaible = "Besoin de renforcement des bases.";
      conseil = "Pratiquez les exercices de base.";
      motivation = "Chaque effort compte !";
    }
    
    return `${pointFort} ${pointFaible} ${conseil} ${motivation}`;
  }

  // Générer un exercice personnalisé
  static async generateExercise(context: PedagogicalContext): Promise<string> {
    try {
      // Version de fallback sans OpenAI pour le moment
      const fallbackExercise = this.generateFallbackExercise(context);
      console.log('✅ Exercice de fallback généré');
      
      return fallbackExercise;
    } catch (error) {
      console.error('Erreur lors de la génération d\'exercice:', error);
      return this.generateFallbackExercise(context);
    }
  }

  // Générer un exercice de fallback
  static generateFallbackExercise(context: PedagogicalContext): string {
    const score = context.averageScore;
    const age = context.age;
    
    let nom = "Exercice de révision";
    let description = "Pratiquez les concepts de base.";
    let duree = "15 min";
    let benefice = "Renforce les connaissances.";
    
    if (score >= 80) {
      nom = "Défi avancé";
      description = "Tentez des problèmes complexes.";
      duree = "20 min";
      benefice = "Développe la pensée critique.";
    } else if (score >= 60) {
      nom = "Exercice intermédiaire";
      description = "Consolidez vos acquis.";
      duree = "15 min";
      benefice = "Améliore la confiance.";
    } else {
      nom = "Exercice de base";
      description = "Maîtrisez les fondamentaux.";
      duree = "10 min";
      benefice = "Construit des bases solides.";
    }
    
    return `${nom}. ${description} ${duree}. ${benefice}`;
  }

  // Analyse globale avec IA
  static async generateGlobalAnalysis(context: PedagogicalContext): Promise<string> {
    try {
      // Version de fallback sans OpenAI pour le moment
      const fallbackAnalysis = this.generateFallbackGlobalAnalysis(context);
      console.log('✅ Analyse globale de fallback générée');
      
      return fallbackAnalysis;
    } catch (error) {
      console.error('Erreur lors de l\'analyse globale:', error);
      return this.generateFallbackGlobalAnalysis(context);
    }
  }

  // Générer une analyse globale de fallback
  static generateFallbackGlobalAnalysis(context: PedagogicalContext): string {
    const score = context.averageScore;
    const activities = context.totalActivities;
    const time = context.totalLearningTime;
    
    let engagement = "Engagement régulier dans les activités.";
    let progression = "Progression constante observée.";
    let rythme = "Rythme d'apprentissage adapté.";
    let recommandation = "Continuez cette approche.";
    let encouragement = "Excellent travail !";
    
    if (score >= 80) {
      engagement = "Très bon engagement dans toutes les activités.";
      progression = "Progression excellente et régulière.";
      rythme = "Rythme d'apprentissage optimal.";
      recommandation = "Tentez des défis plus avancés.";
      encouragement = "Continuez sur cette excellente lancée !";
    } else if (score >= 60) {
      engagement = "Bon engagement dans la plupart des activités.";
      progression = "Progression satisfaisante avec quelques difficultés.";
      rythme = "Rythme d'apprentissage correct.";
      recommandation = "Renforcez les points difficiles.";
      encouragement = "Vous êtes sur la bonne voie !";
    } else {
      engagement = "Engagement variable selon les activités.";
      progression = "Progression lente mais régulière.";
      rythme = "Rythme d'apprentissage à ajuster.";
      recommandation = "Concentrez-vous sur les bases.";
      encouragement = "Chaque effort compte pour progresser !";
    }
    
    return `${engagement} ${progression} ${rythme} ${recommandation} ${encouragement}`;
  }

  // Formater les activités récentes pour les prompts
  private static formatRecentActivities(activities: any[]): string {
    if (!activities || activities.length === 0) {
      return "Aucune activité récente";
    }

    return activities.slice(0, 10).map(activity => 
      `- ${activity.type}: "${activity.title}" (Score: ${activity.score}%, Durée: ${activity.duration} min, ${new Date(activity.completedAt).toLocaleDateString('fr-FR')})`
    ).join('\n');
  }

  // Traiter un prompt parent
  static async processParentPrompt(context: ParentPromptContext): Promise<{
    processedContent: string;
    aiResponse: string;
  }> {
    try {
      console.log('🔍 Traitement du prompt parent pour:', context.childName);
      
      const prompt = `
Tu es un assistant pédagogique spécialisé dans l'analyse des demandes des parents.

CONTEXTE:
- Enfant: ${context.childName} (${context.childAge} ans)
- Niveau: ${context.childLevel}
- Type de compte: ${context.context.accountType}

DEMANDE DU PARENT:
"${context.content}"

TÂCHES:
1. Analysez la demande du parent
2. Clarifiez et structurez le contenu
3. Identifiez les besoins spécifiques
4. Proposez une réponse pédagogique

FORMAT DE RÉPONSE:
CONTENU TRAITÉ:
[Contenu clarifié et structuré]

RÉPONSE PÉDAGOGIQUE:
[Réponse adaptée à l'enfant]

RÈGLES:
- Langage adapté à l'âge de l'enfant
- Réponse constructive et encourageante
- Suggestions pratiques et réalisables
- Maximum 150 mots par section
`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parser la réponse
      const processedContent = this.extractProcessedContent(response);
      const aiResponse = this.extractAIResponse(response);

      console.log('✅ Prompt parent traité avec succès');
      
      return {
        processedContent,
        aiResponse
      };

    } catch (error) {
      console.error('❌ Erreur lors du traitement du prompt parent:', error);
      
      // Fallback
      return {
        processedContent: `Demande parent: ${context.content}`,
        aiResponse: `Merci pour votre demande concernant ${context.childName}. Nous prendrons en compte vos observations pour adapter l'apprentissage.`
      };
    }
  }

  // Générer une réponse pour les parents - IA curieuse et questionneuse

  // Analyser le message de l'utilisateur
  private static analyzeUserMessage(message: string, context: CompleteChildContext): any {
    const analysis = {
      intent: 'general',
      domain: 'general',
      difficulty: 'medium',
      needsExercise: false,
      needsExplanation: false,
      needsMotivation: false,
      specificTopic: null
    };

    const lowerMessage = message.toLowerCase();

    // Détecter l'intention
    if (lowerMessage.includes('exercice') || lowerMessage.includes('pratique') || lowerMessage.includes('entraîne')) {
      analysis.intent = 'exercise';
      analysis.needsExercise = true;
    } else if (lowerMessage.includes('explique') || lowerMessage.includes('comment') || lowerMessage.includes('pourquoi')) {
      analysis.intent = 'explanation';
      analysis.needsExplanation = true;
    } else if (lowerMessage.includes('motiv') || lowerMessage.includes('encourage') || lowerMessage.includes('aide')) {
      analysis.intent = 'motivation';
      analysis.needsMotivation = true;
    }

    // Détecter le domaine
    if (lowerMessage.includes('math') || lowerMessage.includes('calcul') || lowerMessage.includes('nombre')) {
      analysis.domain = 'math';
    } else if (lowerMessage.includes('code') || lowerMessage.includes('programme') || lowerMessage.includes('algorithme')) {
      analysis.domain = 'code';
    } else if (lowerMessage.includes('science') || lowerMessage.includes('expérience') || lowerMessage.includes('découverte')) {
      analysis.domain = 'science';
    } else if (lowerMessage.includes('langue') || lowerMessage.includes('français') || lowerMessage.includes('écriture')) {
      analysis.domain = 'language';
    }

    // Détecter la difficulté
    if (lowerMessage.includes('facile') || lowerMessage.includes('simple') || lowerMessage.includes('débutant')) {
      analysis.difficulty = 'easy';
    } else if (lowerMessage.includes('difficile') || lowerMessage.includes('avancé') || lowerMessage.includes('expert')) {
      analysis.difficulty = 'hard';
    }

    return analysis;
  }

  // Générer une réponse personnalisée
  private static async generatePersonalizedResponse(
    userMessage: string, 
    context: CompleteChildContext, 
    analysis: any
  ): Promise<any> {
    try {
      // Construire le prompt contextuel
      const contextualPrompt = this.buildContextualPrompt(userMessage, context, analysis);
      
      // Appeler OpenAI avec le contexte complet
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es CubeAI, un assistant pédagogique intelligent pour ${context.childName} (${context.childAge} ans).

CONTEXTE DE L'ÉLÈVE:
- Score moyen: ${context.averageScore}%
- Temps total d'apprentissage: ${context.totalLearningTime} minutes
- Activités totales: ${context.totalActivities}
- Style d'apprentissage: ${context.preferredLearningStyle}
- Domaines de focus: ${context.focusAreas.join(', ')}
- Forces: ${context.strengths.join(', ')}
- Préoccupations: ${context.concerns.join(', ')}

PROMPS DES PARENTS:
${context.parentPrompts.map(p => `- ${p.processedContent}`).join('\n')}

ANALYSE DES DOMAINES:
${context.domainAnalysis.map(d => `- ${d.domain}: ${d.averageScore}% (${d.strengths.join(', ')})`).join('\n')}

TON RÔLE:
- Sois curieux et pose des questions pertinentes
- Propose des exercices adaptés aux lacunes
- Encourage et motive l'élève
- Utilise un langage adapté à l'âge
- Sois précis et responsable dans tes conseils
- Décide de la meilleure approche pédagogique

RÈGLES:
- Réponds en français
- Sois encourageant mais honnête
- Propose des exercices si nécessaire
- Pose des questions pour mieux comprendre les besoins`
          },
          {
            role: "user",
            content: contextualPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Analyser la réponse pour déterminer le type de prompt
      const promptType = this.determinePromptType(response, analysis);
      const suggestions = this.generateSuggestions(context, analysis);
      
      return {
        message: response,
        promptType,
        difficulty: analysis.difficulty,
        suggestions
      };
    } catch (error) {
      console.error('❌ Erreur OpenAI:', error);
      return this.generateFallbackResponse(context, analysis);
    }
  }

  // Construire le prompt contextuel
  private static buildContextualPrompt(userMessage: string, context: CompleteChildContext, analysis: any): string {
    let prompt = `Message de ${context.childName}: "${userMessage}"\n\n`;
    
    if (analysis.intent === 'exercise') {
      prompt += `L'élève demande un exercice. `;
      if (analysis.domain !== 'general') {
        prompt += `Domaine: ${analysis.domain}. `;
      }
      prompt += `Difficulté: ${analysis.difficulty}. `;
      
      // Ajouter des informations sur les lacunes
      const domainWeaknesses = context.domainAnalysis.find(d => d.domain.toLowerCase() === analysis.domain);
      if (domainWeaknesses && domainWeaknesses.weaknesses.length > 0) {
        prompt += `Lacunes identifiées: ${domainWeaknesses.weaknesses.join(', ')}. `;
      }
    } else if (analysis.intent === 'explanation') {
      prompt += `L'élève demande une explication. `;
    } else if (analysis.intent === 'motivation') {
      prompt += `L'élève a besoin de motivation. `;
    }
    
    prompt += `\n\nRéponds de manière personnalisée et engageante.`;
    
    return prompt;
  }

  // Déterminer le type de prompt
  private static determinePromptType(response: string, analysis: any): string {
    if (analysis.needsExercise) return 'EXERCICE';
    if (analysis.needsExplanation) return 'EXPLICATION';
    if (analysis.needsMotivation) return 'MOTIVATION';
    return 'GENERAL';
  }

  // Générer des suggestions
  private static generateSuggestions(context: CompleteChildContext, analysis: any): string[] {
    const suggestions = [];
    
    if (analysis.domain === 'math') {
      suggestions.push('Exercice de calcul mental', 'Problème de géométrie', 'Jeu de nombres');
    } else if (analysis.domain === 'code') {
      suggestions.push('Créer un petit programme', 'Défi de logique', 'Puzzle algorithmique');
    } else if (analysis.domain === 'science') {
      suggestions.push('Expérience virtuelle', 'Quiz scientifique', 'Découverte interactive');
    } else {
      suggestions.push('Exercice personnalisé', 'Défi adaptatif', 'Activité d\'apprentissage');
    }
    
    return suggestions;
  }

  // Réponse de fallback
  private static generateFallbackResponse(context: CompleteChildContext, analysis: any): any {
    let message = `Salut ${context.childName} ! `;
    
    if (analysis.intent === 'exercise') {
      message += `Je vais te proposer un exercice adapté à ton niveau. Que dirais-tu d'un défi de ${analysis.domain} ?`;
    } else if (analysis.intent === 'explanation') {
      message += `Je suis là pour t'expliquer tout ce que tu veux ! Sur quel sujet aimerais-tu en savoir plus ?`;
    } else if (analysis.intent === 'motivation') {
      message += `Tu fais du bon travail ! Avec ${context.averageScore}% de moyenne, tu progresses bien. Continue comme ça !`;
    } else {
      message += `Comment puis-je t'aider aujourd'hui ? Tu veux un exercice, une explication ou juste discuter ?`;
    }
    
    return {
      message,
      promptType: 'GENERAL',
      difficulty: 'medium',
      suggestions: ['Exercice personnalisé', 'Explication détaillée', 'Motivation']
    };
  }

  // Améliorer l'IA pour les parents - IA curieuse et questionneuse
  static async generateParentAIResponse(parentContext: any): Promise<{
    response: string;
    questions: string[];
    suggestions: string[];
    insights: string[];
  }> {
    try {
      console.log('👨‍👩‍👧‍👦 Génération de réponse IA parent pour:', parentContext.childName);
      
      // Récupérer le contexte complet de l'enfant
      const completeContext = await this.getCompleteChildContext(parentContext.childSessionId);
      
      // Analyser les besoins et générer des questions pertinentes
      const analysis = this.analyzeParentNeeds(parentContext, completeContext);
      
      // Générer une réponse avec questions
      const response = await this.generateParentResponse(parentContext, completeContext, analysis);
      
      console.log('✅ Réponse IA parent générée');
      
      return response;
    } catch (error) {
      console.error('❌ Erreur lors de la génération de réponse IA parent:', error);
      return this.generateFallbackParentResponse(parentContext);
    }
  }

  // Analyser les besoins des parents
  private static analyzeParentNeeds(parentContext: any, completeContext: CompleteChildContext): any {
    const analysis = {
      needsMonitoring: false,
      needsGuidance: false,
      needsMotivation: false,
      needsSpecificHelp: false,
      areasOfConcern: [],
      potentialQuestions: []
    };

    // Analyser les performances
    if (completeContext.averageScore < 60) {
      analysis.needsSpecificHelp = true;
      analysis.areasOfConcern.push('Performances en baisse');
    }

    if (completeContext.totalActivities < 10) {
      analysis.needsMotivation = true;
      analysis.areasOfConcern.push('Engagement limité');
    }

    // Analyser les domaines faibles
    const weakDomains = completeContext.domainAnalysis.filter(d => d.averageScore < 60);
    if (weakDomains.length > 0) {
      analysis.needsGuidance = true;
      analysis.areasOfConcern.push(`Domaines en difficulté: ${weakDomains.map(d => d.domain).join(', ')}`);
    }

    // Générer des questions pertinentes
    analysis.potentialQuestions = this.generateParentQuestions(completeContext, analysis);

    return analysis;
  }

  // Générer des questions pour les parents
  private static generateParentQuestions(context: CompleteChildContext, analysis: any): string[] {
    const questions = [];

    // Questions sur les performances
    if (context.averageScore < 60) {
      questions.push(`Comment ${context.childName} se sent-il dans ses apprentissages actuellement ?`);
      questions.push(`Y a-t-il des matières qui posent particulièrement problème à ${context.childName} ?`);
    }

    // Questions sur l'engagement
    if (context.totalActivities < 10) {
      questions.push(`À quel moment de la journée ${context.childName} est-il le plus réceptif ?`);
      questions.push(`Quels types d'activités motivent le plus ${context.childName} ?`);
    }

    // Questions sur les objectifs
    if (context.learningGoals.length === 0) {
      questions.push(`Quels sont vos objectifs principaux pour ${context.childName} cette année ?`);
      questions.push(`Sur quels domaines aimeriez-vous que ${context.childName} progresse en priorité ?`);
    }

    // Questions sur le style d'apprentissage
    questions.push(`Comment ${context.childName} préfère-t-il apprendre : par la pratique, l'observation ou l'écoute ?`);
    questions.push(`Y a-t-il des moments où ${context.childName} semble plus concentré ou plus distrait ?`);

    return questions.slice(0, 5); // Limiter à 5 questions
  }

  // Générer une réponse pour les parents
  private static async generateParentResponse(
    parentContext: any,
    completeContext: CompleteChildContext,
    analysis: any
  ): Promise<any> {
    try {
      const prompt = `Tu es CubeAI, un assistant pédagogique intelligent pour les parents.

CONTEXTE DE L'ENFANT:
- Nom: ${completeContext.childName}
- Âge: ${completeContext.childAge} ans
- Score moyen: ${completeContext.averageScore}%
- Activités totales: ${completeContext.totalActivities}
- Style d'apprentissage: ${completeContext.preferredLearningStyle}
- Domaines de focus: ${completeContext.focusAreas.join(', ')}
- Forces: ${completeContext.strengths.join(', ')}
- Préoccupations: ${completeContext.concerns.join(', ')}

ANALYSE DES DOMAINES:
${completeContext.domainAnalysis.map(d => `- ${d.domain}: ${d.averageScore}% (${d.strengths.join(', ')})`).join('\n')}

PROMPS PRÉCÉDENTS:
${completeContext.parentPrompts.map(p => `- ${p.processedContent}`).join('\n')}

TON RÔLE:
- Sois curieux et pose des questions pertinentes
- Donne des insights basés sur les données
- Propose des suggestions d'actions
- Encourage et guide les parents
- Sois précis et responsable dans tes conseils

FORMAT DE RÉPONSE:
RÉPONSE:
[Réponse encourageante et informative]

QUESTIONS PERTINENTES:
[Liste de 3-5 questions pour mieux comprendre les besoins]

SUGGESTIONS:
[Liste d'actions concrètes que les parents peuvent faire]

INSIGHTS:
[Observations basées sur les données de l'enfant]

RÈGLES:
- Sois encourageant mais honnête
- Pose des questions ouvertes
- Donne des suggestions pratiques
- Utilise les données pour justifier tes conseils`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parser la réponse
      const parsedResponse = this.parseParentResponse(response);
      
      return parsedResponse;
    } catch (error) {
      console.error('❌ Erreur OpenAI pour parent:', error);
      return this.generateFallbackParentResponse(parentContext);
    }
  }

  // Parser la réponse parent
  private static parseParentResponse(response: string): any {
    try {
      const responseMatch = response.match(/RÉPONSE:\s*([\s\S]*?)(?=QUESTIONS PERTINENTES:|$)/);
      const questionsMatch = response.match(/QUESTIONS PERTINENTES:\s*([\s\S]*?)(?=SUGGESTIONS:|$)/);
      const suggestionsMatch = response.match(/SUGGESTIONS:\s*([\s\S]*?)(?=INSIGHTS:|$)/);
      const insightsMatch = response.match(/INSIGHTS:\s*([\s\S]*?)$/);

      const responseText = responseMatch ? responseMatch[1].trim() : 'Réponse par défaut';
      const questionsText = questionsMatch ? questionsMatch[1].trim() : '';
      const suggestionsText = suggestionsMatch ? suggestionsMatch[1].trim() : '';
      const insightsText = insightsMatch ? insightsMatch[1].trim() : '';

      const questions = this.parseList(questionsText);
      const suggestions = this.parseList(suggestionsText);
      const insights = this.parseList(insightsText);

      return {
        response: responseText,
        questions,
        suggestions,
        insights
      };
    } catch (error) {
      console.error('❌ Erreur parsing réponse parent:', error);
      return this.generateFallbackParentResponse({} as any);
    }
  }

  // Parser une liste
  private static parseList(text: string): string[] {
    const items = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const cleanLine = line.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine) {
        items.push(cleanLine);
      }
    }
    
    return items;
  }

  // Réponse de fallback pour CubeAI
  private static generateFallbackCubeAIResponse(context: CubeAIContext): any {
    return {
      response: `Salut ${context.childName} ! Je suis là pour t'aider dans ton apprentissage. Que veux-tu faire aujourd'hui ?`,
      promptType: 'GENERAL',
      difficulty: 'medium',
      suggestions: ['Commencer un exercice', 'Poser une question', 'Demander une explication']
    };
  }

  // Réponse de fallback pour les parents
  private static generateFallbackParentResponse(parentContext: any): any {
    return {
      response: `Merci pour votre message ! Je suis là pour vous accompagner dans l'apprentissage de votre enfant.`,
      questions: [
        'Comment votre enfant se sent-il dans ses apprentissages ?',
        'Y a-t-il des domaines qui posent particulièrement problème ?',
        'Quels sont vos objectifs principaux pour cette année ?'
      ],
      suggestions: [
        'Encouragez la pratique régulière',
        'Célébrez les petites victoires',
        'Maintenez une routine d\'apprentissage'
      ],
      insights: [
        'Chaque enfant apprend à son rythme',
        'La motivation vient de la réussite',
        'L\'encouragement parental est crucial'
      ]
    };
  }

  // Extraire le contenu traité d'une réponse
  private static extractProcessedContent(response: string): string {
    const match = response.match(/CONTENU TRAITÉ:\s*([\s\S]*?)(?=RÉPONSE PÉDAGOGIQUE:|$)/);
    return match ? match[1].trim() : 'Contenu traité par défaut';
  }

  // Extraire la réponse IA d'une réponse
  private static extractAIResponse(response: string): string {
    const match = response.match(/RÉPONSE PÉDAGOGIQUE:\s*([\s\S]*?)(?=RÈGLES:|$)/);
    return match ? match[1].trim() : 'Réponse pédagogique par défaut';
  }

  // Parser une réponse CubeAI
  private static parseCubeAIResponse(response: string): {
    response: string;
    promptType: string;
    difficulty: string;
    suggestions?: string[];
  } {
    const responseMatch = response.match(/RÉPONSE:\s*([\s\S]*?)(?=TYPE D'ACTIVITÉ:|$)/);
    const typeMatch = response.match(/TYPE D'ACTIVITÉ:\s*([\s\S]*?)(?=DIFFICULTÉ:|$)/);
    const difficultyMatch = response.match(/DIFFICULTÉ:\s*([\s\S]*?)(?=SUGGESTIONS:|$)/);
    const suggestionsMatch = response.match(/SUGGESTIONS:\s*([\s\S]*?)(?=RÈGLES:|$)/);

    return {
      response: responseMatch ? responseMatch[1].trim() : 'Réponse par défaut',
      promptType: typeMatch ? typeMatch[1].trim() : 'GENERAL',
      difficulty: difficultyMatch ? difficultyMatch[1].trim() : 'MEDIUM',
      suggestions: suggestionsMatch ? suggestionsMatch[1].trim().split('\n').filter(s => s.trim()) : []
    };
  }

  // Générer une réponse pour les parents - IA curieuse et questionneuse

  // Analyser les besoins d'exercice
  private static analyzeExerciseNeeds(exerciseType: string, context: CompleteChildContext): any {
    const analysis = {
      domain: 'general',
      difficulty: 'medium',
      focusOnWeaknesses: true,
      adaptToLevel: true,
      includeParentRequests: true
    };

    // Déterminer le domaine
    if (exerciseType.toLowerCase().includes('math')) analysis.domain = 'math';
    else if (exerciseType.toLowerCase().includes('code')) analysis.domain = 'code';
    else if (exerciseType.toLowerCase().includes('science')) analysis.domain = 'science';
    else if (exerciseType.toLowerCase().includes('language')) analysis.domain = 'language';

    // Adapter la difficulté au niveau de l'enfant
    if (context.averageScore < 50) analysis.difficulty = 'easy';
    else if (context.averageScore > 80) analysis.difficulty = 'hard';
    else analysis.difficulty = 'medium';

    // Identifier les lacunes à cibler
    const domainAnalysis = context.domainAnalysis.find(d => d.domain.toLowerCase() === analysis.domain);
    if (domainAnalysis && domainAnalysis.weaknesses.length > 0) {
      analysis.focusOnWeaknesses = true;
    }

    return analysis;
  }

  // Générer un exercice personnalisé
  private static async generatePersonalizedExercise(
    context: CubeAIExerciseContext,
    completeContext: CompleteChildContext,
    analysis: any
  ): Promise<any> {
    try {
      // Construire le prompt d'exercice
      const exercisePrompt = this.buildExercisePrompt(context, completeContext, analysis);
      
      // Appeler OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `Tu es CubeAI, créateur d'exercices pédagogiques pour ${completeContext.childName} (${completeContext.childAge} ans).

CONTEXTE DE L'ÉLÈVE:
- Score moyen: ${completeContext.averageScore}%
- Style d'apprentissage: ${completeContext.preferredLearningStyle}
- Domaines de focus: ${completeContext.focusAreas.join(', ')}
- Lacunes identifiées: ${completeContext.domainAnalysis.map(d => `${d.domain}: ${d.weaknesses.join(', ')}`).join('; ')}

PROMPS DES PARENTS:
${completeContext.parentPrompts.map(p => `- ${p.processedContent}`).join('\n')}

TON RÔLE:
- Créer des exercices adaptés au niveau et aux lacunes
- Intégrer les demandes des parents
- Proposer des explications claires
- Adapter la difficulté au style d'apprentissage

FORMAT DE RÉPONSE:
QUESTION:
[Question claire et engageante]

OPTIONS:
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

RÉPONSE CORRECTE:
[Lettre de la bonne réponse]

EXPLICATION:
[Explication pédagogique adaptée à l'âge]

POINTS:
[Nombre de points (5-15)]

TEMPS LIMITE:
[Temps en secondes (30-120)]

RÈGLES:
- Question adaptée à l'âge
- Options claires et distinctes
- Explication pédagogique
- Difficulté progressive`
          },
          {
            role: "user",
            content: exercisePrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      });

      const response = completion.choices[0]?.message?.content || '';
      
      // Parser la réponse
      const parsedExercise = this.parseCubeAIExercise(response);
      
      return parsedExercise;
    } catch (error) {
      console.error('❌ Erreur OpenAI pour exercice:', error);
      return this.generateFallbackExercise(context);
    }
  }

  // Construire le prompt d'exercice
  private static buildExercisePrompt(
    context: CubeAIExerciseContext,
    completeContext: CompleteChildContext,
    analysis: any
  ): string {
    let prompt = `Crée un exercice de ${context.exerciseType} pour ${completeContext.childName}.\n\n`;
    
    prompt += `CONTEXTE:\n`;
    prompt += `- Domaine: ${analysis.domain}\n`;
    prompt += `- Difficulté: ${analysis.difficulty}\n`;
    prompt += `- Niveau de l'enfant: ${completeContext.childLevel}\n`;
    
    if (analysis.focusOnWeaknesses) {
      const domainWeaknesses = completeContext.domainAnalysis.find(d => d.domain.toLowerCase() === analysis.domain);
      if (domainWeaknesses && domainWeaknesses.weaknesses.length > 0) {
        prompt += `- Lacunes à cibler: ${domainWeaknesses.weaknesses.join(', ')}\n`;
      }
    }
    
    if (completeContext.parentPrompts.length > 0) {
      prompt += `- Demandes des parents: ${completeContext.parentPrompts[0].processedContent}\n`;
    }
    
    prompt += `\nCrée un exercice engageant et adapté.`;
    
    return prompt;
  }

  // Générer un exercice de fallback
  private static generateFallbackExercise(context: CubeAIExerciseContext): {
    type: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
    timeLimit: number;
  } {
    const age = context.childAge;
    const type = context.exerciseType;
    
    let question = "Quelle est la bonne réponse ?";
    let options = ["Option A", "Option B", "Option C", "Option D"];
    let correctAnswer = "A";
    let explanation = "Bravo ! Tu as trouvé la bonne réponse !";
    let points = 10;
    let timeLimit = 60;
    
    if (type.includes('math') || type.includes('maths')) {
      if (age < 10) {
        question = "Combien font 5 + 3 ?";
        options = ["6", "7", "8", "9"];
        correctAnswer = "C";
        explanation = "5 + 3 = 8. Excellent calcul !";
      } else {
        question = "Quel est le résultat de 12 × 4 ?";
        options = ["44", "46", "48", "50"];
        correctAnswer = "C";
        explanation = "12 × 4 = 48. Parfait !";
      }
    } else if (type.includes('programm')) {
      question = "Qu'est-ce qu'une variable en programmation ?";
      options = [
        "Un type de jeu",
        "Un espace de stockage pour des données",
        "Un langage de programmation",
        "Un ordinateur"
      ];
      correctAnswer = "B";
      explanation = "Une variable est un espace de stockage pour des données. Bien compris !";
    } else if (type.includes('science')) {
      question = "Quelle planète est la plus proche du Soleil ?";
      options = ["Terre", "Mars", "Mercure", "Vénus"];
      correctAnswer = "C";
      explanation = "Mercure est la planète la plus proche du Soleil. Très bien !";
    }
    
    return {
      type: context.exerciseType,
      question,
      options,
      correctAnswer,
      explanation,
      points,
      timeLimit
    };
  }

  // Parser une réponse d'exercice CubeAI
  private static parseCubeAIExercise(response: string): {
    type: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
    timeLimit: number;
  } {
    const questionMatch = response.match(/QUESTION:\s*([\s\S]*?)(?=OPTIONS:|$)/);
    const optionsMatch = response.match(/OPTIONS:\s*([\s\S]*?)(?=RÉPONSE CORRECTE:|$)/);
    const correctAnswerMatch = response.match(/RÉPONSE CORRECTE:\s*([\s\S]*?)(?=EXPLICATION:|$)/);
    const explanationMatch = response.match(/EXPLICATION:\s*([\s\S]*?)(?=POINTS:|$)/);
    const pointsMatch = response.match(/POINTS:\s*(\d+)/);
    const timeLimitMatch = response.match(/LIMITE TEMPS:\s*(\d+)/);

    const options = optionsMatch 
      ? optionsMatch[1].trim().split('\n').filter(opt => opt.trim()).map(opt => opt.replace(/^[A-D]\)\s*/, ''))
      : ["Option A", "Option B", "Option C", "Option D"];

    return {
      type: 'EXERCICE',
      question: questionMatch ? questionMatch[1].trim() : 'Question par défaut',
      options: options.length >= 4 ? options : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: correctAnswerMatch ? correctAnswerMatch[1].trim() : 'A',
      explanation: explanationMatch ? explanationMatch[1].trim() : 'Explication par défaut',
      points: pointsMatch ? parseInt(pointsMatch[1]) : 10,
      timeLimit: timeLimitMatch ? parseInt(timeLimitMatch[1]) : 60
    };
  }
}
