// Service LLM simplifié sans LangChain
export class LLMService {
  private isInitialized = false;

  // Initialisation du service
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔄 Initialisation du service LLM...');
      
      // Test de connexion à OpenAI
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY non configurée');
      }
      
      console.log('✅ Service LLM initialisé avec succès');
      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service LLM:', error);
      throw error;
    }
  }

  // Génération de réponse simple avec OpenAI
  async generateResponse(
    question: string,
    userType: string,
    firstName: string,
    focus?: string
  ): Promise<string> {
    try {
      const prompt = this.createPrompt(userType, firstName, focus);
      
      // Appel direct à l'API OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: question
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur OpenAI: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;

    } catch (error) {
      console.error('❌ Erreur lors de la génération de réponse:', error);
      return `Désolé, je rencontre une difficulté technique. Veuillez réessayer dans quelques instants.`;
    }
  }

  // Création du prompt
  private createPrompt(userType: string, firstName: string, focus?: string): string {
    return `Tu es l'Assistant IA Katiopa, un expert pédagogique de niveau international.

CONTEXTE UTILISATEUR:
- Type: ${userType}
- Prénom: ${firstName}
- Focus: ${focus || 'Général'}

TON RÔLE:
Tu es un expert pédagogique avec:
- Expertise en neurosciences cognitives
- Méthodes d'apprentissage éprouvées (Montessori, Freinet, etc.)
- Capacité d'analyse fine des progrès
- Anticipation des besoins éducatifs

STYLE DE COMMUNICATION:
- ${userType === 'PARENT' ? 'Professionnel mais chaleureux, rassurant, orienté résultats' : 'Encourageant, adapté à l\'âge, ludique et motivant'}
- Utilise le prénom de l'utilisateur
- Sois précis et concret dans tes analyses
- Donne des exemples pratiques
- Reste toujours positif et constructif

Réponds de manière claire et adaptée au type d'utilisateur.`;
  }

  // Réinitialisation du service
  async reset(): Promise<void> {
    this.isInitialized = false;
    console.log('🔄 Service LLM réinitialisé');
  }
}

export default new LLMService();
