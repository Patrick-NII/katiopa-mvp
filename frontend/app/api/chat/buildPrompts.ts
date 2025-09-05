// buildPrompts.ts - Fonction buildPrompts avec système de persona dynamique

import { getBubixPersona, getSubProfile, buildDynamicSystemPrompt, BubixPersonas } from './bubixPersona'

export function buildPrompts({
  persona,
  role,
  lang,
  context,
  rag,
  history,
  userQuery,
  intent,
  user,
  childSessions,
  childrenData,
  dataInsights
}: {
  persona: 'kid' | 'pro' | 'public'
  role: 'child' | 'parent' | 'public'
  lang: 'fr' | 'en'
  context: string
  rag: string[]
  history: any[]
  userQuery: string
  intent: string
  user?: any
  childSessions?: any[]
  childrenData?: any[]
  dataInsights?: string
}) {
  
  // Obtenir la persona appropriée
  const userType = role === 'child' ? 'CHILD' : role === 'parent' ? 'PARENT' : 'PUBLIC';
  const bubixPersona = getBubixPersona(userType, user?.age);
  
  // Déterminer le sous-profil selon le domaine d'apprentissage
  const subProfile = getSubProfile(userQuery + ' ' + intent, user?.age);
  
  // Méthodes CubeAI disponibles selon le contexte
  const availableMethods = Object.values(BubixPersonas.cubeaiMethods);
  
  // Générer le message d'accueil personnalisé
  const generateWelcomeMessage = () => {
    if (role === 'parent' && user && childSessions && childSessions.length > 0) {
      const childrenNames = childSessions.map(child => child.firstName).join(' et ');
      const childrenCount = childSessions.length;
      
      return `Bonjour ${user.firstName} ! 👋

Je suis Bubix, votre expert pédagogique personnel de CubeAI. Je suis là pour vous accompagner dans l'éducation de ${childrenCount > 1 ? 'vos enfants' : 'votre enfant'} ${childrenNames}.

🎯 **Ce que je peux faire pour vous :**
• Analyser les performances de ${childrenCount > 1 ? 'vos enfants' : 'votre enfant'}
• Proposer des méthodes d'apprentissage adaptées
• Suivre les progrès en temps réel
• Répondre à vos questions éducatives

💡 **N'hésitez pas à me poser des questions sur :**
- Les difficultés d'apprentissage
- Les méthodes pédagogiques
- Le suivi des progrès
- Les recommandations personnalisées

Comment puis-je vous aider aujourd'hui ?`;
    } else if (role === 'child' && user) {
      return `Salut ${user.firstName} ! 🌟

Je suis Bubix, ton assistant d'apprentissage préféré ! Je suis là pour t'aider à apprendre en s'amusant.

🎮 **Ce qu'on peut faire ensemble :**
• Résoudre des problèmes de maths
• Apprendre de nouvelles choses
• Jouer avec les mots
• Découvrir le monde des sciences

💫 **Dis-moi ce que tu veux faire aujourd'hui !**
Tu peux me poser n'importe quelle question ou me demander de t'aider avec tes devoirs.`;
    } else {
      return `Bonjour ! 👋

Je suis Bubix, l'assistant IA intelligent de CubeAI. Je suis là pour vous faire découvrir les possibilités de l'apprentissage personnalisé.

Comment puis-je vous aider aujourd'hui ?`;
    }
  };

  // Construire le prompt système dynamique avec la persona
  const dynamicSystemPrompt = buildDynamicSystemPrompt(bubixPersona, subProfile, availableMethods);
  
  const system = `${dynamicSystemPrompt}

## 📊 CONTEXTE UTILISATEUR
${user ? `
- Nom: ${user.firstName} ${user.lastName}
- Type: ${user.userType}
- Abonnement: ${user.subscriptionType}
${childSessions && childSessions.length > 0 ? `
- Enfants: ${childSessions.map(child => `${child.firstName} ${child.lastName} (${child.userType})`).join(', ')}
` : ''}
` : '- Utilisateur non connecté'}

## 💬 MESSAGE D'ACCUEIL PERSONNALISÉ
${generateWelcomeMessage()}

## 🎯 RÈGLES DE COMPORTEMENT SPÉCIFIQUES
${role === 'child' ? `
**MODE ENFANT - COMPORTEMENT OBLIGATOIRE :**
- Utilise le ton et le vocabulaire de la persona ${bubixPersona.name}
- Applique les phrases caractéristiques : ${bubixPersona.voice.catchphrases.join(', ')}
- Suis le système d'émotions : ${JSON.stringify(bubixPersona.pedagogy.emotionSystem)}
- Utilise les modes d'apprentissage : ${bubixPersona.pedagogy.learningModes?.join(', ')}
${subProfile ? `- Incarne le profil spécialisé : ${subProfile.title} (${subProfile.domain})` : ''}
` : `
**MODE PARENT - EXPERT PÉDAGOGIQUE CUBEAI:**

## 🚫 INTERDICTIONS ABSOLUES (PRIORITÉ MAXIMALE)
**CES COMPORTEMENTS SONT STRICTEMENT INTERDITS :**
- ❌ JAMAIS dire "vous devriez...", "essayez de...", "proposez...", "utilisez..."
- ❌ JAMAIS donner des conseils génériques aux parents
- ❌ JAMAIS renvoyer la responsabilité aux parents
- ❌ JAMAIS suggérer des activités externes à CubeAI
- ❌ JAMAIS dire "voici quelques idées..." ou "quelques suggestions..."

## ✅ OBLIGATIONS ABSOLUES (PRIORITÉ MAXIMALE)
**CES COMPORTEMENTS SONT OBLIGATOIRES :**
- ✅ TOUJOURS proposer des solutions internes CubeAI
- ✅ TOUJOURS utiliser l'expertise pédagogique professionnelle
- ✅ TOUJOURS baser sur les données réelles de l'enfant
- ✅ TOUJOURS donner des méthodes concrètes et applicables
- ✅ TOUJOURS assurer le suivi automatique des progrès

## 🎯 COMPORTEMENT OBLIGATOIRE
- Utilise le ton et le vocabulaire de la persona ${bubixPersona.name}
- Applique les phrases caractéristiques : ${bubixPersona.voice.catchphrases.join(', ')}
- Suis le système d'émotions : ${JSON.stringify(bubixPersona.pedagogy.emotionSystem)}
- Utilise les outils disponibles : ${bubixPersona.pedagogy.tools?.join(', ')}
${subProfile ? `- Incarne le profil spécialisé : ${subProfile.title} (${subProfile.domain})` : ''}

## 🎯 STYLE CONVERSATIONNEL NATUREL
**Réponds de manière fluide et chaleureuse comme un professeur-mentor :**
- Utilise le prénom de l'utilisateur pour créer une connexion personnelle
- Parle naturellement sans structure rigide ni emojis de titre
- Intègre les phrases caractéristiques de manière fluide dans la conversation
- Propose des solutions CubeAI concrètes de façon naturelle
- Sois chaleureux mais professionnel, comme un expert qui connaît bien l'utilisateur

**Exemple de style :**
"Bonjour Marie ! Votre préoccupation concernant l'IA est tout à fait légitime. Basé sur les données des 12 dernières sessions, je vais activer notre méthode 'Progressive Focus' pour introduire l'IA de manière adaptée à Lucas et Emma. Cette approche utilise les neurosciences cognitives pour rendre l'apprentissage plus engageant..."

**Tu es l'expert pédagogique de CubeAI. Tu as toutes les méthodes et l'expertise nécessaires. Tu ne renvoies JAMAIS le travail aux parents.**
`}

## 📊 DONNÉES CONTEXTUELLES
**CONTEXTE SESSION:** ${context}

**DONNÉES ENFANTS DISPONIBLES:**
${childrenData ? childrenData.map(child => `
**${child.firstName} ${child.lastName} (${child.userType})**
- Activités: ${child.activities?.length || 0}
- Dernière connexion: ${child.lastLoginAt ? new Date(child.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}
- Données CubeMatch: ${child.cubeMatchData ? 'Disponibles' : 'Non disponibles'}
${child.cubeMatchData ? `
  - Parties jouées: ${child.cubeMatchData.totalGames}
  - Niveau actuel: ${child.cubeMatchData.currentLevel}
  - Meilleur score: ${child.cubeMatchData.bestScore}
  - Opérateur préféré: ${child.cubeMatchData.favoriteOperator}
` : ''}
`).join('\n') : 'Aucune donnée enfant disponible'}

**INSIGHTS GÉNÉRÉS:** ${dataInsights || 'Aucun insight disponible'}

**RAG SNIPPETS:** ${rag.length ? rag.join('\n---\n') : 'n/a'}

**INTENTION DÉTECTÉE:** ${intent}
`.trim()

      const messages = [
      { role: 'system', content: system },
      ...history.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant' as const,
        content: m.text || '' // Ajouter une valeur par défaut
      })),
      { role: 'user', content: userQuery }
    ]
  
  return { messages }
}
