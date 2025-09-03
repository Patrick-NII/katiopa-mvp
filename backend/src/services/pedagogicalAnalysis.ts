import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  
  // Analyser les progrès avec IA
  static async analyzeProgress(context: PedagogicalContext): Promise<string> {
    try {
      console.log('🔍 Début de l\'analyse des progrès pour:', context.childName);
      
      const prompt = PROGRESS_ANALYSIS_PROMPT
        .replace('{childName}', context.childName)
        .replace('{age}', context.age.toString())
        .replace('{grade}', context.grade)
        .replace('{daysSinceRegistration}', context.daysSinceRegistration.toString())
        .replace('{totalLearningTime}', context.totalLearningTime.toString())
        .replace('{learningFrequency}', context.learningFrequency)
        .replace('{preferredTimeSlots}', context.preferredTimeSlots)
        .replace('{averageScore}', context.averageScore.toFixed(1))
        .replace('{totalActivities}', context.totalActivities.toString())
        .replace('{recentActivities}', this.formatRecentActivities(context.recentActivities))
        .replace('{childStrengths}', context.parentPreferences?.childStrengths?.join(', ') || 'Non spécifiées')
        .replace('{focusAreas}', context.parentPreferences?.focusAreas?.join(', ') || 'Non spécifiés')
        .replace('{learningGoals}', context.parentPreferences?.learningGoals?.join(', ') || 'Non spécifiés')
        .replace('{concerns}', context.parentPreferences?.concerns?.join(', ') || 'Aucune préoccupation mentionnée');

      console.log('📝 Prompt généré, appel OpenAI...');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un professeur expérimenté et bienveillant qui analyse les progrès des enfants avec empathie et pédagogie."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      });

      const response = completion.choices[0].message.content;
      console.log('✅ Réponse OpenAI reçue:', response ? 'Succès' : 'Vide');
      
      return response || "Erreur lors de l'analyse";
    } catch (error) {
      console.error('❌ Erreur lors de l\'analyse des progrès:', error);
      return "Désolé, je n'ai pas pu analyser les progrès pour le moment. Veuillez réessayer plus tard.";
    }
  }

  // Générer un exercice personnalisé
  static async generateExercise(context: PedagogicalContext): Promise<string> {
    try {
      const prompt = EXERCISE_GENERATION_PROMPT
        .replace('{childName}', context.childName)
        .replace('{age}', context.age.toString())
        .replace('{grade}', context.grade)
        .replace('{averageScore}', context.averageScore.toFixed(1))
        .replace('{recentActivities}', this.formatRecentActivities(context.recentActivities))
        .replace('{childStrengths}', context.parentPreferences?.childStrengths?.join(', ') || 'Non spécifiées')
        .replace('{focusAreas}', context.parentPreferences?.focusAreas?.join(', ') || 'Non spécifiés')
        .replace('{learningStyle}', context.parentPreferences?.learningStyle || 'Non spécifié');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un professeur créatif qui propose des exercices personnalisés et engageants pour les enfants."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.8
      });

      return completion.choices[0].message.content || "Erreur lors de la génération d'exercice";
    } catch (error) {
      console.error('Erreur lors de la génération d\'exercice:', error);
      return "Désolé, je n'ai pas pu générer un exercice pour le moment. Veuillez réessayer plus tard.";
    }
  }

  // Analyse globale avec IA
  static async generateGlobalAnalysis(context: PedagogicalContext): Promise<string> {
    try {
      const prompt = GLOBAL_ANALYSIS_PROMPT
        .replace('{childName}', context.childName)
        .replace('{age}', context.age.toString())
        .replace('{grade}', context.grade)
        .replace('{daysSinceRegistration}', context.daysSinceRegistration.toString())
        .replace('{totalLearningTime}', context.totalLearningTime.toString())
        .replace('{learningFrequency}', context.learningFrequency)
        .replace('{sessionPatterns}', JSON.stringify(context.sessionPatterns))
        .replace('{preferredTimeSlots}', context.preferredTimeSlots)
        .replace('{averageScore}', context.averageScore.toFixed(1))
        .replace('{recentActivities}', this.formatRecentActivities(context.recentActivities))
        .replace('{childStrengths}', context.parentPreferences?.childStrengths?.join(', ') || 'Non spécifiées')
        .replace('{focusAreas}', context.parentPreferences?.focusAreas?.join(', ') || 'Non spécifiés')
        .replace('{learningGoals}', context.parentPreferences?.learningGoals?.join(', ') || 'Non spécifiés')
        .replace('{concerns}', context.parentPreferences?.concerns?.join(', ') || 'Aucune préoccupation mentionnée')
        .replace('{learningStyle}', context.parentPreferences?.learningStyle || 'Non spécifié');

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Tu es un professeur principal expérimenté qui fait des bilans complets et stratégiques pour les parents."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7
      });

      return completion.choices[0].message.content || "Erreur lors de l'analyse globale";
    } catch (error) {
      console.error('Erreur lors de l\'analyse globale:', error);
      return "Désolé, je n'ai pas pu faire l'analyse globale pour le moment. Veuillez réessayer plus tard.";
    }
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
}
