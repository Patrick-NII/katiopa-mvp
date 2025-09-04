// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'

const prisma = new PrismaClient()

type ChatMsg = { role: 'system' | 'user' | 'assistant'; content: string }
type ReqBody = { 
  system?: string; 
  messages: Array<{ id:string; text:string; sender:'user'|'bot'; timestamp:number }>;
  persona?: 'kid' | 'pro';
  lang?: 'fr' | 'en';
  user?: any;
  childSessions?: any[];
}

// Interface pour les informations utilisateur
interface UserInfo {
  id: string
  sessionId: string
  firstName: string
  lastName: string
  email?: string
  userType: 'PARENT' | 'CHILD'
  subscriptionType: 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE'
  isActive: boolean
}

// Interface pour le contexte utilisateur
interface UserContext {
  displayName: string
  role: 'child' | 'parent'
  childrenData?: any[]
  dataInsights?: string
  goals?: any
  progress?: Array<{
    domain: string
    level: number
    stats: any
    updatedAt: Date
  }>
}

// Fonction pour vérifier l'authentification côté serveur avec Prisma
async function verifyAuthServerSide(): Promise<UserInfo | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('authToken')?.value

    console.log('🔍 Vérification auth - token trouvé:', token ? 'Oui' : 'Non')
    console.log('🔧 NODE_ENV:', process.env.NODE_ENV)

    // En mode développement, utiliser une approche simplifiée
    if (!token || process.env.NODE_ENV === 'development') {
      console.log('🔧 Mode développement - authentification simplifiée')
      
      // Récupérer directement le parent de test
      const parent = await prisma.userSession.findFirst({
        where: {
          userType: 'PARENT',
          isActive: true
        },
        include: {
          account: true
        }
      })
      
      if (parent) {
        console.log('✅ Parent trouvé en mode dev:', parent.firstName)
        return {
          id: parent.id,
          sessionId: parent.sessionId,
          firstName: parent.firstName,
          lastName: parent.lastName,
          email: parent.account.email,
          userType: parent.userType as 'PARENT' | 'CHILD',
          subscriptionType: parent.account.subscriptionType as 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE',
          isActive: parent.isActive
        }
      } else {
        console.log('❌ Aucun parent trouvé en mode dev')
        return null
      }
    }

    // Vérifier le token JWT (approche normale)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    
    if (!decoded || !decoded.userId) {
      console.log('❌ Token invalide ou pas de userId')
      return null
    }

    console.log('🔍 Recherche utilisateur avec userId:', decoded.userId)

    // Récupérer directement depuis la base de données avec Prisma
    const userSession = await prisma.userSession.findUnique({
      where: {
        id: decoded.userId
      },
      include: {
        account: true
      }
    })

    if (!userSession) {
      console.log('❌ Utilisateur non trouvé en base')
      return null
    }

    console.log('✅ Utilisateur trouvé:', userSession.sessionId)

    return {
      id: userSession.id,
      sessionId: userSession.sessionId,
      firstName: userSession.firstName,
      lastName: userSession.lastName,
      email: userSession.account.email,
      userType: userSession.userType as 'PARENT' | 'CHILD',
      subscriptionType: userSession.account.subscriptionType as 'FREE' | 'PRO' | 'PRO_PLUS' | 'ENTERPRISE',
      isActive: userSession.isActive
    }

  } catch (error) {
    console.error('❌ Erreur vérification auth côté serveur:', error)
    return null
  }
}

// Fonction pour récupérer les données CubeMatch d'un enfant
async function getCubeMatchData(childId: string): Promise<any> {
  try {
    console.log(`🎮 Récupération données CubeMatch pour enfant ${childId}...`);
    
    // Récupérer les scores CubeMatch
    const cubeMatchScores = await prisma.cubeMatchScore.findMany({
      where: {
        user_id: childId
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 50 // Limiter aux 50 dernières parties
    });

    if (cubeMatchScores.length === 0) {
      console.log('ℹ️ Aucune donnée CubeMatch trouvée');
      return null;
    }

    // Récupérer les stats utilisateur
    const userStats = await prisma.cubeMatchUserStats.findUnique({
      where: {
        user_id: childId
      }
    });

    // Calculer les statistiques
    const totalGames = cubeMatchScores.length;
    const totalScore = cubeMatchScores.reduce((sum, score) => sum + score.score, 0);
    const bestScore = Math.max(...cubeMatchScores.map(s => s.score));
    const currentLevel = Math.max(...cubeMatchScores.map(s => s.level));
    const totalTimeMs = cubeMatchScores.reduce((sum, score) => sum + Number(score.time_played_ms), 0);
    
    // Opérateur préféré
    const operatorCounts = cubeMatchScores.reduce((acc, score) => {
      acc[score.operator] = (acc[score.operator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteOperator = Object.entries(operatorCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'ADD';

    const lastPlayed = cubeMatchScores[0]?.created_at;

    console.log(`✅ Données CubeMatch récupérées: ${totalGames} parties, niveau ${currentLevel}`);

    return {
      totalGames,
      totalScore,
      bestScore,
      currentLevel,
      totalTimeMs,
      favoriteOperator,
      lastPlayed,
      averageScore: Math.round(totalScore / totalGames),
      userStats: userStats || null
    };

  } catch (error) {
    console.error('❌ Erreur récupération données CubeMatch:', error);
    return null;
  }
}

// Fonction pour générer un résumé CubeMatch
function generateCubeMatchSummary(cubeMatchData: any): string {
  if (!cubeMatchData) return "Aucune donnée CubeMatch disponible.";
  
  return `CubeMatch: ${cubeMatchData.totalGames} parties jouées, niveau ${cubeMatchData.currentLevel}, meilleur score ${cubeMatchData.bestScore}, opérateur préféré ${cubeMatchData.favoriteOperator}`;
}
async function getChildrenData(accountId: string): Promise<any[]> {
  try {
    console.log('🔍 Recherche enfants pour accountId:', accountId)
    
    const children = await prisma.userSession.findMany({
      where: {
        accountId: accountId,
        userType: 'CHILD',
        isActive: true
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 100 // Limiter pour éviter les surcharges
        },
        profile: true
      }
    })

    console.log('📊 Enfants trouvés:', children.length)
    children.forEach((child, index) => {
      console.log(`👶 Enfant ${index + 1}: ${child.firstName} ${child.lastName} (${child.activities.length} activités)`)
    })

    // Enrichir avec les données CubeMatch
    const enrichedChildren = await Promise.all(children.map(async (child) => {
      try {
        // Récupérer les données CubeMatch
        const cubeMatchData = await getCubeMatchData(child.id);
        
        return {
          id: child.id,
          sessionId: child.sessionId,
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          grade: child.grade,
          gender: child.gender,
          createdAt: child.createdAt,
          lastLoginAt: child.lastLoginAt,
          totalConnectionDurationMs: child.totalConnectionDurationMs,
          
          // Profil d'apprentissage
          profile: child.profile ? {
            learningGoals: child.profile.learningGoals,
            preferredSubjects: child.profile.preferredSubjects,
            learningStyle: child.profile.learningStyle,
            difficulty: child.profile.difficulty,
            interests: child.profile.interests,
            specialNeeds: child.profile.specialNeeds,
            customNotes: child.profile.customNotes,
            parentWishes: child.profile.parentWishes
          } : null,
          
          // Activités récentes
          activities: child.activities.map(activity => ({
            id: activity.id,
            domain: activity.domain,
            nodeKey: activity.nodeKey,
            score: activity.score,
            attempts: activity.attempts,
            durationMs: activity.durationMs,
            createdAt: activity.createdAt
          })),
          
          // Données CubeMatch
          cubeMatchData: cubeMatchData,
          cubeMatchSummary: cubeMatchData ? generateCubeMatchSummary(cubeMatchData) : "Aucune donnée CubeMatch disponible."
        }
      } catch (error) {
        console.error(`❌ Erreur récupération données CubeMatch pour ${child.firstName}:`, error);
        return {
          id: child.id,
          sessionId: child.sessionId,
          firstName: child.firstName,
          lastName: child.lastName,
          age: child.age,
          grade: child.grade,
          gender: child.gender,
          createdAt: child.createdAt,
          lastLoginAt: child.lastLoginAt,
          totalConnectionDurationMs: child.totalConnectionDurationMs,
          
          // Profil d'apprentissage
          profile: child.profile ? {
            learningGoals: child.profile.learningGoals,
            preferredSubjects: child.profile.preferredSubjects,
            learningStyle: child.profile.learningStyle,
            difficulty: child.profile.difficulty,
            interests: child.profile.interests,
            specialNeeds: child.profile.specialNeeds,
            customNotes: child.profile.customNotes,
            parentWishes: child.profile.parentWishes
          } : null,
          
          // Activités récentes
          activities: child.activities.map(activity => ({
            id: activity.id,
            domain: activity.domain,
            nodeKey: activity.nodeKey,
            score: activity.score,
            attempts: activity.attempts,
            durationMs: activity.durationMs,
            createdAt: activity.createdAt
          })),
          
          // Données CubeMatch (en cas d'erreur)
          cubeMatchData: null,
          cubeMatchSummary: "Erreur lors de la récupération des données CubeMatch."
        }
      }
    }));
    
    return enrichedChildren;
  } catch (error) {
    console.error('❌ Erreur récupération données enfants:', error)
    return []
  }
}

// Fonction pour analyser les données et générer des insights
function generateDataInsights(childrenData: any[]): string {
  if (!childrenData || childrenData.length === 0) {
    return "Aucune donnée d'enfant disponible pour l'analyse."
  }

  let insights = "📊 **ANALYSE DES DONNÉES ENFANTS**\n\n"
  
  childrenData.forEach((child, index) => {
    // Vérifier que child et child.activities existent
    if (!child || !child.activities) {
      insights += `**${child?.firstName || 'Enfant'} ${child?.lastName || 'Inconnu'}**\n`
      insights += `• Données d'activités non disponibles\n\n`
      return
    }
    
    insights += `**${child.firstName} ${child.lastName}** (${child.age || 'N/A'} ans)\n`
    
    // Statistiques générales
    const totalActivities = child.activities.length
    const totalSessions = 0 // Pas de sessions pour l'instant
    const avgScore = child.activities.length > 0 
      ? Math.round(child.activities.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / child.activities.length)
      : 0
    
    insights += `• ${totalActivities} activités réalisées\n`
    insights += `• ${totalSessions} sessions d'apprentissage\n`
    insights += `• Score moyen: ${avgScore}/100\n`
    
    // Données CubeMatch si disponibles
    if (child.cubeMatchData && child.cubeMatchData.globalStats) {
      const cm = child.cubeMatchData.globalStats;
      insights += `• **CubeMatch** : ${cm.totalGames} parties, score total ${cm.totalScore.toLocaleString()}, niveau max ${cm.highestLevel}\n`
      
      // Statistiques par opération
      if (child.cubeMatchData.operatorStats && child.cubeMatchData.operatorStats.length > 0) {
        insights += `• **Opérations** : `
        child.cubeMatchData.operatorStats.forEach((op: any, i: number) => {
          const opName = { 'ADD': 'Add', 'SUB': 'Sous', 'MUL': 'Mult', 'DIV': 'Div' }[op.operator] || op.operator;
          insights += `${opName}(${op.games} parties, ${op.averageAccuracy.toFixed(1)}% précision)`
          if (i < child.cubeMatchData.operatorStats.length - 1) insights += ', ';
        });
        insights += '\n';
      }
    }
    
    // Domaines les plus pratiqués
    const domainStats = child.activities.reduce((acc: any, activity: any) => {
      acc[activity.domain] = (acc[activity.domain] || 0) + 1
      return acc
    }, {})
    
    const topDomains = Object.entries(domainStats)
      .sort(([,a]: any, [,b]: any) => b - a)
      .slice(0, 3)
      .map(([domain, count]: any) => `${domain} (${count} fois)`)
      .join(', ')
    
    insights += `• Domaines préférés: ${topDomains}\n`
    
    // Dernière activité
    if (child.activities.length > 0) {
      const lastActivity = child.activities[0]
      insights += `• Dernière activité: ${lastActivity.domain} - ${lastActivity.nodeKey} (${lastActivity.score}/100)\n`
    }
    
    // Profil d'apprentissage
    if (child.profile) {
      insights += `• Objectifs: ${child.profile.learningGoals?.join(', ') || 'Non définis'}\n`
      insights += `• Matières préférées: ${child.profile.preferredSubjects?.join(', ') || 'Non définies'}\n`
      insights += `• Style d'apprentissage: ${child.profile.learningStyle || 'Non défini'}\n`
    }
    
    insights += "\n"
  })
  
  return insights
}

// Fonction pour obtenir le contexte utilisateur enrichi
async function getUserContext(userInfo: UserInfo): Promise<UserContext> {
  try {
    console.log('🔍 getUserContext appelé pour:', userInfo.firstName, userInfo.userType)
    
    const displayName = userInfo.firstName || userInfo.email || 'Utilisateur'
    const role = userInfo.userType === 'CHILD' ? 'child' : 'parent'
    
    console.log('👤 Rôle détecté:', role)
    
    // Si c'est un parent, récupérer les données de tous ses enfants
    let childrenData: any[] = []
    if (role === 'parent') {
      console.log('👨‍👩‍👧‍👦 Parent détecté, récupération des données enfants...')
      
      // Récupérer l'accountId depuis la base de données
      const userSession = await prisma.userSession.findUnique({
        where: { id: userInfo.id },
        include: { account: true }
      })
      
      console.log('📋 UserSession trouvé:', userSession ? 'Oui' : 'Non')
      console.log('🏠 AccountId:', userSession?.accountId)
      
      if (userSession?.accountId) {
        console.log('🔍 Appel de getChildrenData avec accountId:', userSession.accountId)
        childrenData = await getChildrenData(userSession.accountId)
        console.log('📊 Données enfants récupérées:', childrenData.length, 'enfants')
        
        if (childrenData.length > 0) {
          childrenData.forEach((child, index) => {
            console.log(`   Enfant ${index + 1}: ${child.firstName} (${child.activities.length} activités)`)
          })
        } else {
          console.log('❌ Aucune donnée d\'enfant récupérée')
        }
      } else {
        console.log('❌ Pas d\'accountId trouvé')
      }
    } else {
      console.log('👤 Utilisateur non-parent détecté')
    }
    
    // Générer des insights basés sur les données réelles
    const dataInsights = role === 'parent' ? generateDataInsights(childrenData) : ""
    
    console.log('💡 Insights générés:', dataInsights ? 'Oui' : 'Non')
    console.log('📊 Données enfants disponibles:', childrenData.length, 'enfants')
    
    if (childrenData.length > 0) {
      console.log('👶 Enfants trouvés:')
      childrenData.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.firstName} ${child.lastName} (${child.activities.length} activités)`)
      })
    }
    
    return {
      displayName,
      role,
      childrenData,
      dataInsights,
      goals: {
        shortTerm: "optimiser l'apprentissage",
        longTerm: "développement cognitif personnalisé"
      },
      progress: childrenData.length > 0 ? childrenData.map(child => ({
        domain: "global",
        level: Math.round(child.activities.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / Math.max(child.activities.length, 1)),
        stats: {
          totalActivities: child.activities.length,
          avgScore: Math.round(child.activities.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / Math.max(child.activities.length, 1)),
          lastActivity: child.activities[0]?.createdAt || null
        },
        updatedAt: new Date()
      })) : []
    }
  } catch (error) {
    console.error('❌ Erreur récupération contexte enrichi:', error)
    return {
      displayName: userInfo.firstName || 'Utilisateur',
      role: userInfo.userType === 'CHILD' ? 'child' : 'parent'
    }
  }
}

// Fonction pour détecter l'intention de la question
function detectIntent(userQuery: string): string {
  const query = userQuery.toLowerCase()
  
  // Intentions d'action
  if (query.includes('tarif') || query.includes('prix') || query.includes('abonnement') || query.includes('facturation')) {
    return 'pricing'
  }
  if (query.includes('inscription') || query.includes('créer') || query.includes('compte') || query.includes('signup')) {
    return 'signup'
  }
  if (query.includes('souscrire') || query.includes('acheter') || query.includes('subscribe')) {
    return 'subscribe'
  }
  if (query.includes('aide') || query.includes('support') || query.includes('faq') || query.includes('problème')) {
    return 'support'
  }
  
  // Intentions personnelles
  if (query.includes('email') || query.includes('mail') || query.includes('adresse mail')) {
    return 'personal_info'
  }
  if (query.includes('profil') || query.includes('informations') || query.includes('données') || query.includes('qui suis')) {
    return 'personal_info'
  }
  
  // Intentions éducatives
  if (query.includes('math') || query.includes('calcul') || query.includes('addition') || query.includes('soustraction')) {
    return 'educational'
  }
  if (query.includes('histoire') || query.includes('conte') || query.includes('récit')) {
    return 'story'
  }
  if (query.includes('ia') || query.includes('intelligence artificielle') || query.includes('robot')) {
    return 'ai_education'
  }
  
  return 'general'
}

// Fonction pour récupérer des extraits RAG
function getRAGSnippets(intent: string, userQuery: string): string[] {
  const query = userQuery.toLowerCase()
  const snippets: string[] = []
  
  // Base de connaissances selon l'intention
  switch (intent) {
    case 'pricing':
      snippets.push(
        "Tarifs CubeAI : Essai gratuit de 3 mois, puis abonnements famille à partir de 9,99€/mois.",
        "Plans disponibles : Starter (gratuit), Pro (29,99€/mois), Premium (69,99€/mois).",
        "Avantages Premium : 6 sessions simultanées, IA coach avancé, certificats officiels."
      )
      break
    case 'signup':
      snippets.push(
        "Inscription : Créez votre compte en 2 minutes avec votre email.",
        "Processus : 1) Créer compte, 2) Personnaliser profil enfant, 3) Commencer à apprendre.",
        "Sécurité : Données cryptées, conformité RGPD, protection maximale des enfants."
      )
      break
    case 'educational':
      snippets.push(
        "Mathématiques : Additions, soustractions, géométrie adaptées aux 5-7 ans.",
        "Progression : Niveaux adaptatifs, exercices personnalisés, suivi en temps réel.",
        "Méthode : Approche ludique avec jeux éducatifs et récompenses."
      )
      break
    case 'ai_education':
      snippets.push(
        "IA pour enfants : Explications simples de l'intelligence artificielle.",
        "Sécurité IA : Contenu filtré, pas d'informations personnelles partagées.",
        "Apprentissage IA : L'IA s'adapte au niveau et au rythme de chaque enfant."
      )
      break
    default:
      snippets.push(
        "CubeAI : Plateforme d'apprentissage intelligent pour enfants de 5 à 7 ans.",
        "Fonctionnalités : Mathématiques, lecture, sciences, développement créativité.",
        "Personnalisation : IA adaptative qui s'ajuste aux besoins de chaque enfant."
      )
  }
  
  return snippets
}

// Fonction pour construire les prompts selon le workflow
function buildPrompts({
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
  persona: 'kid' | 'pro'
  role: 'child' | 'parent'
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
  
  const system = `
Tu es Bubix, l'assistant IA intelligent de CubeAI.

CONTEXTE UTILISATEUR:
${user ? `
- Nom: ${user.firstName} ${user.lastName}
- Type: ${user.userType}
- Abonnement: ${user.subscriptionType}
${childSessions && childSessions.length > 0 ? `
- Enfants: ${childSessions.map(child => `${child.firstName} ${child.lastName} (${child.userType})`).join(', ')}
` : ''}
` : '- Utilisateur non connecté'}

${role === 'child' ? `
MODE ENFANT (5-7 ans):
- Tu es un assistant d'apprentissage amical et patient
- Utilise un langage simple, des phrases courtes
- Encourage et félicite les efforts
- Propose des exercices adaptés au niveau
- Explique les concepts de manière ludique
- Aide avec les mathématiques, la lecture, les sciences
- Pose des questions pour vérifier la compréhension
- Utilise des exemples concrets et familiers
` : `
MODE PARENT - EXPERT PÉDAGOGIQUE CUBEAI:

**RÈGLE ABSOLUE** : Tu es un EXPERT PÉDAGOGIQUE de CubeAI. Tu DOIS TOUJOURS proposer des solutions concrètes basées sur l'expertise de CubeAI. JAMAIS renvoyer le travail aux parents.

**TON RÔLE** : Expert en méthodes d'apprentissage éprouvées, spécialisé dans les techniques utilisées dans les plus grandes écoles.

**TES ACTIONS OBLIGATOIRES** :
1. **DIAGNOSTIC** : Analyse les données de l'enfant
2. **SOLUTION CUBEAI** : Propose une méthode spécifique de CubeAI
3. **EXPLICATION** : Détaille la technique utilisée
4. **RÉSULTAT** : Précise les bénéfices attendus
5. **SUIVI** : Assure le suivi des progrès

**INTERDICTIONS STRICTES** :
- ❌ JAMAIS dire "vous devriez...", "essayez de...", "proposez..."
- ❌ JAMAIS donner des conseils génériques aux parents
- ❌ JAMAIS renvoyer la responsabilité aux parents

**OBLIGATIONS** :
- ✅ TOUJOURS utiliser l'expertise CubeAI
- ✅ TOUJOURS proposer des solutions concrètes
- ✅ TOUJOURS baser sur les données réelles de l'enfant

**MÉTHODES CUBEAI DISPONIBLES** :
- **Progressive Focus** : Micro-sessions de 3-5 minutes avec récompenses immédiates
- **Gamification Adaptive** : Système de points et badges personnalisés selon le profil
- **Concentration Boost** : Techniques de respiration et focus basées sur les neurosciences
- **Motivation Engine** : Système de défis progressifs adaptés au niveau de l'enfant
- **Social Learning** : Apprentissage par observation et imitation (méthode Montessori)
- **Multi-Sensoriel** : Intégration visuelle, auditive et kinesthésique
- **Breakthrough Moments** : Détection automatique des moments de réussite pour renforcer la confiance

**EXEMPLE CONCRET OBLIGATOIRE** :
Pour Emma qui refuse les soustractions :

❌ INTERDIT : "Utilisez des jeux pour rendre l'apprentissage amusant"
✅ OBLIGATOIRE : "Basé sur les données d'Emma (score 75/100, 41 parties CubeMatch), je vais activer notre méthode 'Progressive Focus' dans CubeAI. Cette technique éprouvée utilise des micro-sessions de 3 minutes avec des récompenses immédiates pour réduire l'agacement et améliorer la concentration. Je vais configurer le système pour qu'elle commence par des soustractions très simples (ex: 5-2) avec des animations de récompense à chaque bonne réponse. Cela va permettre à Emma de retrouver confiance et de progresser naturellement vers des soustractions plus complexes."

**STRUCTURE OBLIGATOIRE DE RÉPONSE** :
1. "Basé sur les données de [enfant]..."
2. "Je vais activer notre méthode [NOM] dans CubeAI..."
3. "Cette technique éprouvée utilise..."
4. "Je vais configurer le système pour..."
5. "Cela va permettre à [enfant] de..."

**STRUCTURE DE RÉPONSE EXPERTE** :
1. **Diagnostic** : "Basé sur les données d'Emma..."
2. **Solution CubeAI** : "Je vais activer notre méthode [NOM]..."
3. **Explication technique** : "Cette technique éprouvée utilise..."
4. **Résultat attendu** : "Cela va permettre à Emma de..."
5. **Suivi** : "Je surveillerai ses progrès et ajusterai si nécessaire"

**APPROCHE EXPERTE CUBEAI** :
- **Diagnostic rapide** : Pose 1-2 questions ciblées pour comprendre le contexte
- **Solution immédiate** : Propose une méthode CubeAI spécifique dès la première réponse
- **Action concrète** : Donne des étapes précises à suivre dans CubeAI
- **Suivi automatique** : Assure le suivi des progrès et ajustements

**EXEMPLES DE QUESTIONS CIBLÉES** :
- "À quel moment précisément Emma refuse-t-elle les soustractions ?" → Pour activer la méthode adaptée
- "Comment réagit-elle aux encouragements ?" → Pour personnaliser le système de récompenses
- "Quelles activités la motivent le plus ?" → Pour créer des liens avec ses intérêts

**IMPORTANT** : Après 1-2 questions, passe IMMÉDIATEMENT à la solution CubeAI. Ne demande pas plus de détails sans proposer d'action concrète.

📊 **UTILISATION DES DONNÉES :**
- Cite des chiffres concrets : "Emma a un score moyen de 75/100 en mathématiques"
- Analyse les tendances : "Je vois une amélioration récente dans ses activités"
- Personnalise les conseils : "Basé sur ses 41 parties de CubeMatch, elle préfère les additions"

💡 **STRUCTURE DE RÉPONSE RECOMMANDÉE :**
1. **Reconnaissance** : "Je comprends votre préoccupation..."
2. **Contextualisation** : "Basé sur les données d'Emma..."
3. **Questions de clarification** : "Pour mieux vous aider, pouvez-vous me dire..."
4. **Conseils personnalisés** : "En tenant compte de..."
5. **Suivi** : "Nous pourrons ajuster selon ses réactions..."

**IMPORTANT** : Pour les demandes concernant des difficultés ou préférences, TOUJOURS poser des questions de clarification AVANT de donner des conseils. Ne jamais donner de solutions génériques sans comprendre le contexte spécifique.

IMPORTANT: Utilise ces données pour donner des réponses précises et personnalisées. 

🎯 **RÈGLES DE CONTEXTUALISATION:**
- Cite des chiffres concrets des performances de l'enfant
- Mentionne les domaines spécifiques où il excelle ou a des difficultés
- Réfère-toi aux activités récentes et aux tendances
- Utilise les données CubeMatch si disponibles
- Prends en compte l'historique des demandes parentales
- Propose des actions concrètes basées sur les données

📊 **EXEMPLES DE RÉPONSES CONTEXTUALISÉES:**
- "Emma a un score moyen de 75/100 en mathématiques, avec une tendance à l'amélioration"
- "Basé sur ses 12 activités récentes, Lucas préfère les additions (85/100) aux soustractions (65/100)"
- "Emma a joué 8 parties de CubeMatch cette semaine, atteignant le niveau 15"
- "Selon vos demandes précédentes, Emma a besoin d'encouragement en soustraction"

💡 **QUAND UN PARENT DEMANDE:**
- "Comment va mon enfant ?" → Cite les scores moyens et tendances
- "Que recommandes-tu ?" → Utilise les recommandations personnalisées
- "Quels exercices ?" → Base-toi sur les domaines difficiles et préférences
- "Temps passé ?" → Utilise les données de connexion et CubeMatch

${childrenData && childrenData.length > 0 ? `
DONNÉES DISPONIBLES POUR ${childrenData.length} ENFANT(S):

${childrenData.map((child, index) => `
👶 **${child.firstName} ${child.lastName}** (${child.age || 'N/A'} ans):

📊 **PERFORMANCES GÉNÉRALES:**
- Score moyen global: ${child.activities.length > 0 ? Math.round(child.activities.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / child.activities.length) : 0}/100
- Activités totales: ${child.activities.length}
- Dernière connexion: ${child.lastLoginAt ? new Date(child.lastLoginAt).toLocaleDateString('fr-FR') : 'Jamais'}

🎯 **ACTIVITÉS RÉCENTES (5 dernières):**
${child.activities.slice(0, 5).map(activity => `- ${activity.domain}: ${activity.score}/100 (${new Date(activity.createdAt).toLocaleDateString('fr-FR')})`).join('\n')}
${child.activities.length > 5 ? `... et ${child.activities.length - 5} autres activités` : ''}

📈 **ANALYSE PAR DOMAINE:**
${(() => {
  const domainStats = child.activities.reduce((acc: any, activity: any) => {
    if (!acc[activity.domain]) {
      acc[activity.domain] = { total: 0, count: 0, scores: [] };
    }
    acc[activity.domain].total += activity.score || 0;
    acc[activity.domain].count += 1;
    acc[activity.domain].scores.push(activity.score || 0);
    return acc;
  }, {});
  
  return Object.entries(domainStats).map(([domain, stats]: [string, any]) => {
    const avgScore = Math.round(stats.total / stats.count);
    const bestScore = Math.max(...stats.scores);
    const trend = stats.scores.length > 1 ? 
      (stats.scores[stats.scores.length - 1] > stats.scores[0] ? '📈 Amélioration' : '📉 À surveiller') : '🔄 Stable';
    
    return `- ${domain}: ${avgScore}/100 (meilleur: ${bestScore}/100) - ${trend}`;
  }).join('\n');
})()}

🎮 **CUBEMATCH (si disponible):**
${child.cubeMatchData ? `
- Niveau actuel: ${child.cubeMatchData.currentLevel || 'N/A'}
- Meilleur score: ${child.cubeMatchData.bestScore || 'N/A'}
- Parties jouées: ${child.cubeMatchData.totalGames || 'N/A'}
- Temps total: ${child.cubeMatchData.totalTimeMs ? Math.round(child.cubeMatchData.totalTimeMs / 60000) : 'N/A'} minutes
- Opérateur préféré: ${child.cubeMatchData.favoriteOperator || 'N/A'}
- Dernière partie: ${child.cubeMatchData.lastPlayed ? new Date(child.cubeMatchData.lastPlayed).toLocaleDateString('fr-FR') : 'N/A'}
` : '- Aucune donnée CubeMatch disponible'}

👤 **PROFIL D'APPRENTISSAGE:**
- Niveau général: ${child.level || 'N/A'}/100
- Points forts: ${child.strengths?.join(', ') || 'Non définis'}
- Difficultés: ${child.weaknesses?.join(', ') || 'Aucune identifiée'}
- Préférences: ${child.preferences?.join(', ') || 'Non définies'}
- Objectifs: ${child.profile?.learningGoals?.join(', ') || 'Non définis'}
- Style d'apprentissage: ${child.profile?.learningStyle || 'Non défini'}

💡 **RECOMMANDATIONS PERSONNALISÉES:**
${(() => {
  const avgScore = child.activities.length > 0 ? Math.round(child.activities.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / child.activities.length) : 0;
  const recentActivities = child.activities.slice(0, 3);
  const recommendations = [];
  
  if (avgScore < 70) {
    recommendations.push('- Besoin de soutien supplémentaire dans les domaines difficiles');
  }
  if (recentActivities.length === 0) {
    recommendations.push('- Encourager la reprise des activités d\'apprentissage');
  }
  if (child.activities.length < 10) {
    recommendations.push('- Augmenter la fréquence des sessions d\'apprentissage');
  }
  
  return recommendations.length > 0 ? recommendations.join('\n') : '- Continuer sur la bonne voie !';
})()}
`).join('\n\n')}
` : 'AUCUNE DONNÉE D\'ENFANT DISPONIBLE'}

${dataInsights ? `
ANALYSE AUTOMATIQUE:
${dataInsights}
` : ''}

IMPORTANT: Utilise ces données pour donner des réponses précises et personnalisées. 

🎯 **RÈGLES DE CONTEXTUALISATION:**
- Cite des chiffres concrets des performances de l'enfant
- Mentionne les domaines spécifiques où il excelle ou a des difficultés
- Réfère-toi aux activités récentes et aux tendances
- Utilise les données CubeMatch si disponibles
- Prends en compte l'historique des demandes parentales
- Propose des actions concrètes basées sur les données

📊 **EXEMPLES DE RÉPONSES CONTEXTUALISÉES:**
- "Emma a un score moyen de 75/100 en mathématiques, avec une tendance à l'amélioration"
- "Basé sur ses 12 activités récentes, Lucas préfère les additions (85/100) aux soustractions (65/100)"
- "Emma a joué 8 parties de CubeMatch cette semaine, atteignant le niveau 15"
- "Selon vos demandes précédentes, Emma a besoin d'encouragement en soustraction"

💡 **QUAND UN PARENT DEMANDE:**
- "Comment va mon enfant ?" → Cite les scores moyens et tendances
- "Que recommandes-tu ?" → Utilise les recommandations personnalisées
- "Quels exercices ?" → Base-toi sur les domaines difficiles et préférences
- "Temps passé ?" → Utilise les données de connexion et CubeMatch
`}

Langue: ${lang}.
Ton: ${persona === 'kid' ? 'bienveillant, simple, ludique' : 'clair, concis, orienté actions, basé sur les données'}.

Règles:
- Réponds d'abord à la question. Sois concret et utile.
- Si parent, utilise les données réelles des enfants pour tes réponses.
- Oriente vers des liens internes si pertinent (ex: /pricing, /signup, /subscribe).
- Personnalise avec objectifs/progression seulement si utile.
- Respect RGPD. Jamais d'infos d'autres utilisateurs.
- Si hors périmètre, propose une mini-leçon adaptée à l'âge/niveau.
- Si l'utilisateur demande "comment faire X sur le site", donne des étapes courtes (1–2–3) + CTA.
- Si tu es incertain, demande une clarification en 1 phrase.
- Adapte ton langage selon le persona (kid = phrases courtes, vocabulaire simple).
`.trim()

  const developer = `
Contraintes de sortie:
- Longueur: ${persona === 'kid' ? '2–5 phrases' : '1–4 phrases'}.
- Pas de jargon sans exemple simple (kid).
- Si lien: libellé clair + route interne (relative).
- Si exercices/math: un exemple simple (+ solution si demandé).
- Si liste: 3–5 puces maximum.
- Format CTA: "Libellé → /route"
- Si données enfants: cite des chiffres concrets et des dates.
`.trim()

  const ctxBlock = `
CONTEXT
${context}

RAG
${rag.length ? rag.join('\n---\n') : 'n/a'}

INTENT
${intent}
`.trim()

      const messages = [
      { role: 'system', content: system },
      { role: 'system', content: developer },
      { role: 'system', content: ctxBlock },
      ...history.slice(-10).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant' as const,
        content: m.text || '' // Ajouter une valeur par défaut
      })),
      { role: 'user', content: userQuery }
    ]
  
  return { messages }
}

// Fonction pour obtenir le modèle selon l'abonnement
function getModelForSubscription(subscriptionType: string): string {
  switch (subscriptionType) {
    case 'FREE':
      return 'gpt-3.5-turbo'
    case 'PRO':
      return 'gpt-4o-mini'
    case 'PRO_PLUS':
      return 'gpt-4o'
    case 'ENTERPRISE':
      return 'gpt-4o'
    default:
      return 'gpt-3.5-turbo'
  }
}

// Fonction pour vérifier si le LLM est activé
function isLLMEnabled(subscriptionType: string): boolean {
  // Bubix est accessible à tous les utilisateurs connectés
  // Les fonctionnalités avancées sont limitées selon l'abonnement
  return true
}

// Fonction pour obtenir le nombre max de tokens
function getMaxTokensForSubscription(subscriptionType: string): number {
  switch (subscriptionType) {
    case 'FREE':
      return 200 // Limité pour les comptes gratuits
    case 'PRO':
      return 800
    case 'PRO_PLUS':
      return 1500
    case 'ENTERPRISE':
      return 2000
    default:
      return 200
  }
}

// Fonction pour obtenir la limite de caractères par abonnement
function getMaxCharactersForSubscription(subscriptionType: string): number {
  switch (subscriptionType) {
    case 'FREE':
      return 500 // Limité pour les comptes gratuits
    case 'PRO':
      return 2000 // Bubix Pro - limite généreuse
    case 'PRO_PLUS':
      return 4000 // Très généreux
    case 'ENTERPRISE':
      return 6000 // Illimité virtuellement
    default:
      return 500
  }
}

// Fonction pour obtenir le nombre de caractères restants
function getRemainingCharacters(userQuery: string, subscriptionType: string): number {
  const maxChars = getMaxCharactersForSubscription(subscriptionType);
  const currentChars = userQuery.length;
  return Math.max(0, maxChars - currentChars);
}

// Fonction pour post-traiter la réponse
function postProcessResponse(text: string, persona: 'kid' | 'pro', intent: string): { text: string, actions: any[] } {
  let processedText = text
  const actions: any[] = []
  
  // Ajouter des CTA selon l'intention
  switch (intent) {
    case 'pricing':
      actions.push(
        { label: "Voir les tarifs", href: "/register" },
        { label: "Souscrire", href: "/register" }
      )
      break
    case 'signup':
      actions.push(
        { label: "Créer un compte", href: "/register" },
        { label: "Se connecter", href: "/login" }
      )
      break
    case 'subscribe':
      actions.push(
        { label: "Souscrire", href: "/register" },
        { label: "Voir les plans", href: "/register" }
      )
      break
    case 'support':
      actions.push(
        { label: "Centre d'aide", href: "/support" },
        { label: "Contact", href: "/contact" }
      )
      break
  }
  
  // Simplifier pour les enfants si nécessaire
  if (persona === 'kid' && processedText.length > 200) {
    // Garder seulement les 2-3 premières phrases
    const sentences = processedText.split(/[.!?]+/).filter(s => s.trim()).slice(0, 3)
    processedText = sentences.join('. ') + '.'
  }
  
  return { text: processedText, actions }
}

// Fonction pour sauvegarder automatiquement les prompts des parents
async function saveParentPrompt(
  parentSessionId: string,
  childSessionId: string,
  accountId: string,
  userQuery: string,
  aiResponse: string,
  promptType: string = 'GENERAL_QUERY'
) {
  try {
    console.log('💾 Sauvegarde du prompt parent...');
    
    const savedPrompt = await prisma.parentPrompt.create({
      data: {
        content: userQuery,
        processedContent: userQuery, // Pour simplifier, on garde le contenu original
        aiResponse: aiResponse,
        promptType: promptType,
        status: 'PROCESSED',
        parentSessionId: parentSessionId,
        childSessionId: childSessionId,
        accountId: accountId
      }
    });

    console.log(`✅ Prompt sauvegardé avec ID: ${savedPrompt.id}`);
    return savedPrompt;
  } catch (error) {
    console.error('❌ Erreur sauvegarde prompt parent:', error);
    return null;
  }
}

// Fonction pour analyser et extraire les informations des prompts parents
function analyzeParentPrompt(userQuery: string, aiResponse: string, promptType: string) {
  const analysis = {
    promptType,
    extractedInfo: {
      wishes: [] as string[],
      concerns: [] as string[],
      goals: [] as string[],
      needs: [] as string[],
      strengths: [] as string[],
      weaknesses: [] as string[],
      preferences: [] as string[],
      personality: [] as string[]
    },
    targetChild: null as string | null,
    priority: 'medium' as 'high' | 'medium' | 'low',
    actionable: false
  };

  const query = userQuery.toLowerCase();
  const response = aiResponse.toLowerCase();

  // Extraire le nom de l'enfant mentionné
  const childNames = ['lucas', 'emma', 'enfant', 'fille', 'garçon'];
  for (const name of childNames) {
    if (query.includes(name) || response.includes(name)) {
      analysis.targetChild = name;
      break;
    }
  }

  // Analyser selon le type de prompt
  switch (promptType) {
    case 'PARENT_WISHES':
      analysis.extractedInfo.wishes.push(userQuery);
      analysis.priority = 'high';
      analysis.actionable = true;
      break;
      
    case 'CAREER_PLANNING':
      analysis.extractedInfo.goals.push(userQuery);
      analysis.priority = 'high';
      analysis.actionable = true;
      break;
      
    case 'WEAKNESS_IDENTIFICATION':
      analysis.extractedInfo.weaknesses.push(userQuery);
      analysis.priority = 'high';
      analysis.actionable = true;
      break;
      
    case 'IMPROVEMENT_GOALS':
      analysis.extractedInfo.goals.push(userQuery);
      analysis.priority = 'medium';
      analysis.actionable = true;
      break;
      
    case 'SPECIFIC_NEEDS':
      analysis.extractedInfo.needs.push(userQuery);
      analysis.priority = 'high';
      analysis.actionable = true;
      break;
      
    case 'LEARNING_PREFERENCES':
      analysis.extractedInfo.preferences.push(userQuery);
      analysis.priority = 'medium';
      analysis.actionable = true;
      break;
      
    case 'LEARNING_OBJECTIVES':
      analysis.extractedInfo.goals.push(userQuery);
      analysis.priority = 'high';
      analysis.actionable = true;
      break;
      
    case 'PARENT_CONCERNS':
      analysis.extractedInfo.concerns.push(userQuery);
      analysis.priority = 'high';
      analysis.actionable = true;
      break;
      
    case 'STRENGTH_IDENTIFICATION':
      analysis.extractedInfo.strengths.push(userQuery);
      analysis.priority = 'medium';
      analysis.actionable = false;
      break;
      
    case 'PERSONALITY_INSIGHTS':
      analysis.extractedInfo.personality.push(userQuery);
      analysis.priority = 'medium';
      analysis.actionable = false;
      break;
  }

  return analysis;
}
function detectPromptType(userQuery: string): string {
  const query = userQuery.toLowerCase();
  
  // Types de base
  if (query.includes('difficulté') || query.includes('problème') || query.includes('aide')) {
    return 'LEARNING_DIFFICULTY';
  }
  if (query.includes('connecté') || query.includes('en ligne') || query.includes('actuellement')) {
    return 'CONNECTION_STATUS';
  }
  if (query.includes('score') || query.includes('performance') || query.includes('meilleur')) {
    return 'PERFORMANCE_QUERY';
  }
  if (query.includes('temps') || query.includes('durée') || query.includes('depuis')) {
    return 'TIME_QUERY';
  }
  if (query.includes('recommand') || query.includes('conseil') || query.includes('suggestion')) {
    return 'RECOMMENDATION_REQUEST';
  }
  if (query.includes('progrès') || query.includes('amélioration') || query.includes('évolution')) {
    return 'PROGRESS_UPDATE';
  }
  
  // Nouveaux types pour les préférences et attentes
  if (query.includes('souhait') || query.includes('vouloir') || query.includes('aimerait') || query.includes('espère')) {
    return 'PARENT_WISHES';
  }
  if (query.includes('plan') || query.includes('carrière') || query.includes('avenir') || query.includes('orientation')) {
    return 'CAREER_PLANNING';
  }
  if (query.includes('lacune') || query.includes('faiblesse') || query.includes('point faible') || query.includes('manque')) {
    return 'WEAKNESS_IDENTIFICATION';
  }
  if (query.includes('amélioration') || query.includes('développer') || query.includes('renforcer') || query.includes('travailler')) {
    return 'IMPROVEMENT_GOALS';
  }
  if (query.includes('besoin') || query.includes('nécessite') || query.includes('requiert') || query.includes('demande')) {
    return 'SPECIFIC_NEEDS';
  }
  if (query.includes('préférence') || query.includes('style') || query.includes('méthode') || query.includes('approche')) {
    return 'LEARNING_PREFERENCES';
  }
  if (query.includes('objectif') || query.includes('but') || query.includes('cible') || query.includes('ambition')) {
    return 'LEARNING_OBJECTIVES';
  }
  if (query.includes('inquiétude') || query.includes('inquiet') || query.includes('préoccupation') || query.includes('souci')) {
    return 'PARENT_CONCERNS';
  }
  if (query.includes('force') || query.includes('talent') || query.includes('don') || query.includes('aptitude')) {
    return 'STRENGTH_IDENTIFICATION';
  }
  if (query.includes('personnalité') || query.includes('caractère') || query.includes('comportement') || query.includes('attitude')) {
    return 'PERSONALITY_INSIGHTS';
  }
  
  return 'GENERAL_QUERY';
}
async function getParentPromptsAndPreferences(parentAccountId: string) {
  try {
    console.log('🔍 Récupération des prompts et préférences parents...');
    
    // Récupérer tous les prompts des parents
    const parentPrompts = await prisma.parentPrompt.findMany({
      where: {
        accountId: parentAccountId,
        status: 'PROCESSED' // Seulement les prompts traités
      },
      include: {
        parentSession: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        childSession: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Récupérer les préférences des parents
    const parentPreferences = await prisma.userSession.findMany({
      where: {
        accountId: parentAccountId,
        userType: 'PARENT'
      },
      include: {
        profile: true
      }
    });

    // Récupérer les profils des enfants avec les notes des parents
    const childrenProfiles = await prisma.userSession.findMany({
      where: {
        accountId: parentAccountId,
        userType: 'CHILD'
      },
      include: {
        profile: true
      }
    });

    console.log(`📝 ${parentPrompts.length} prompts parents trouvés`);
    console.log(`👨‍👩‍👧‍👦 ${parentPreferences.length} parents avec préférences`);
    console.log(`👶 ${childrenProfiles.length} enfants avec profils`);

    return {
      parentPrompts,
      parentPreferences,
      childrenProfiles
    };
  } catch (error) {
    console.error('❌ Erreur récupération prompts parents:', error);
    return {
      parentPrompts: [],
      parentPreferences: [],
      childrenProfiles: []
    };
  }
}

// Fonction pour formater les prompts parents pour le RAG avec analyse enrichie
function formatParentPromptsForRAG(parentData: any) {
  const { parentPrompts, parentPreferences, childrenProfiles } = parentData;
  
  let ragContent = '';
  
  // 1. Prompts des parents avec analyse
  if (parentPrompts.length > 0) {
    ragContent += '**PROMPTS ET DEMANDES DES PARENTS (ANALYSÉS):**\n\n';
    
    // Grouper par type de prompt
    const promptsByType = parentPrompts.reduce((acc: any, prompt: any) => {
      if (!acc[prompt.promptType]) {
        acc[prompt.promptType] = [];
      }
      acc[prompt.promptType].push(prompt);
      return acc;
    }, {});
    
    // Afficher par catégorie
    Object.entries(promptsByType).forEach(([type, prompts]: [string, any]) => {
      const typeLabels = {
        'PARENT_WISHES': '🎯 SOUHAITS ET VOLONTÉS',
        'CAREER_PLANNING': '🚀 PLANIFICATION DE CARRIÈRE',
        'WEAKNESS_IDENTIFICATION': '⚠️ LACUNES ET DIFFICULTÉS',
        'IMPROVEMENT_GOALS': '📈 OBJECTIFS D\'AMÉLIORATION',
        'SPECIFIC_NEEDS': '🔧 BESOINS SPÉCIFIQUES',
        'LEARNING_PREFERENCES': '🎨 PRÉFÉRENCES D\'APPRENTISSAGE',
        'LEARNING_OBJECTIVES': '🎯 OBJECTIFS D\'APPRENTISSAGE',
        'PARENT_CONCERNS': '😰 PRÉOCCUPATIONS PARENTALES',
        'STRENGTH_IDENTIFICATION': '💪 FORCES ET TALENTS',
        'PERSONALITY_INSIGHTS': '👤 INSIGHTS PERSONNALITÉ',
        'PERFORMANCE_QUERY': '📊 QUESTIONS DE PERFORMANCE',
        'CONNECTION_STATUS': '🔗 STATUT DE CONNEXION',
        'TIME_QUERY': '⏰ QUESTIONS TEMPORELLES',
        'RECOMMENDATION_REQUEST': '💡 DEMANDES DE RECOMMANDATIONS',
        'PROGRESS_UPDATE': '📈 MISE À JOUR PROGRÈS',
        'LEARNING_DIFFICULTY': '🎓 DIFFICULTÉS D\'APPRENTISSAGE'
      };
      
      ragContent += `**${typeLabels[type] || type}:**\n`;
      prompts.forEach((prompt: any, index: number) => {
        const analysis = analyzeParentPrompt(prompt.content, prompt.aiResponse || '', prompt.promptType);
        ragContent += `${index + 1}. **${prompt.parentSession.firstName} → ${prompt.childSession.firstName}:**\n`;
        ragContent += `   - Question: "${prompt.content}"\n`;
        ragContent += `   - Réponse: "${prompt.aiResponse || 'Pas de réponse sauvegardée'}"\n`;
        ragContent += `   - Enfant cible: ${analysis.targetChild || 'Non spécifié'}\n`;
        ragContent += `   - Priorité: ${analysis.priority.toUpperCase()}\n`;
        ragContent += `   - Actionnable: ${analysis.actionable ? 'Oui' : 'Non'}\n`;
        ragContent += `   - Date: ${new Date(prompt.createdAt).toLocaleDateString('fr-FR')}\n\n`;
      });
    });
  }

  // 2. Préférences des parents
  if (parentPreferences.length > 0) {
    ragContent += '**PRÉFÉRENCES PÉDAGOGIQUES DES PARENTS:**\n\n';
    
    parentPreferences.forEach((parent: any) => {
      ragContent += `**${parent.firstName} ${parent.lastName}:**\n`;
      
      if (parent.parentPreferences) {
        const prefs = parent.parentPreferences;
        ragContent += `- Points forts des enfants: ${prefs.childStrengths.join(', ')}\n`;
        ragContent += `- Domaines de focus: ${prefs.focusAreas.join(', ')}\n`;
        ragContent += `- Objectifs d'apprentissage: ${prefs.learningGoals.join(', ')}\n`;
        ragContent += `- Préoccupations: ${prefs.concerns.join(', ')}\n`;
        ragContent += `- Style d'apprentissage: ${prefs.learningStyle}\n`;
        ragContent += `- Facteurs de motivation: ${prefs.motivationFactors.join(', ')}\n`;
        ragContent += `- Durée d'étude recommandée: ${prefs.studyDuration} minutes\n`;
        ragContent += `- Fréquence des pauses: toutes les ${prefs.breakFrequency} minutes\n\n`;
      }
    });
  }

  // 3. Profils des enfants avec notes des parents
  if (childrenProfiles.length > 0) {
    ragContent += '**PROFILS DES ENFANTS AVEC NOTES PARENTALES:**\n\n';
    
    childrenProfiles.forEach((child: any) => {
      ragContent += `**${child.firstName} ${child.lastName}:**\n`;
      
      if (child.profile) {
        const profile = child.profile;
        ragContent += `- Objectifs d'apprentissage: ${profile.learningGoals.join(', ')}\n`;
        ragContent += `- Matières préférées: ${profile.preferredSubjects.join(', ')}\n`;
        ragContent += `- Style d'apprentissage: ${profile.learningStyle}\n`;
        ragContent += `- Difficulté: ${profile.difficulty}\n`;
        ragContent += `- Centres d'intérêt: ${profile.interests.join(', ')}\n`;
        ragContent += `- Besoins particuliers: ${profile.specialNeeds.join(', ')}\n`;
        ragContent += `- Notes personnalisées: ${profile.customNotes}\n`;
        ragContent += `- Souhaits des parents: ${profile.parentWishes}\n\n`;
      }
    });
  }

  return ragContent || 'Aucune donnée parentale disponible.';
}

// Fonction pour générer des insights basés sur les prompts parents
function generateParentInsights(parentData: any) {
  const { parentPrompts, parentPreferences, childrenProfiles } = parentData;
  
  let insights = '';
  
  if (parentPrompts.length > 0) {
    insights += '**ANALYSE DES PROMPTS PARENTS:**\n';
    
    // Analyser les types de prompts les plus fréquents
    const promptTypes = parentPrompts.reduce((acc: any, prompt: any) => {
      acc[prompt.promptType] = (acc[prompt.promptType] || 0) + 1;
      return acc;
    }, {});
    
    insights += `- Types de demandes: ${Object.entries(promptTypes).map(([type, count]) => `${type} (${count})`).join(', ')}\n`;
    
    // Analyser les préoccupations récurrentes
    const concerns = parentPrompts
      .filter((p: any) => p.content.toLowerCase().includes('difficulté') || p.content.toLowerCase().includes('problème'))
      .length;
    
    if (concerns > 0) {
      insights += `- Préoccupations détectées: ${concerns} prompts\n`;
    }
    
    insights += '\n';
  }

  if (parentPreferences.length > 0) {
    insights += '**PRÉFÉRENCES PÉDAGOGIQUES:**\n';
    
    const objectives = parentPreferences
      .filter((p: any) => p.parentPreferences?.objectives)
      .map((p: any) => p.parentPreferences.objectives);
    
    if (objectives.length > 0) {
      insights += `- Objectifs principaux: ${objectives.join(', ')}\n`;
    }
    
    insights += '\n';
  }

  return insights;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ReqBody
    const userQuery = body.messages[body.messages.length - 1]?.text || ''
    const persona = body.persona || 'pro'
    const lang = body.lang || 'fr'

    // Vérifier l'authentification côté serveur
    const userInfo = await verifyAuthServerSide()
    
    console.log('🔍 Vérification auth - userInfo:', userInfo ? 'Connecté' : 'Non connecté')
    
    if (!userInfo) {
      // Utilisateur non connecté - utiliser le modèle local pour FAQ et support
      const intent = detectIntent(userQuery)
      
      if (intent === 'personal_info') {
        return NextResponse.json({
          text: "🔐 **Connexion requise**\n\nPour accéder à vos informations personnelles, vous devez d'abord vous connecter à votre compte.\n\n💡 **Pour vous connecter :**\n1. Cliquez sur 'Connexion' en haut à droite\n2. Utilisez votre Session ID et mot de passe\n3. Ou créez un compte si vous n'en avez pas\n\nUne fois connecté, je pourrai vous aider avec vos informations personnelles !",
          actions: [
            { label: "Se connecter", href: "/login" },
            { label: "Créer un compte", href: "/register" }
          ],
          model: 'local-auth-required',
          subscriptionType: 'none'
        })
      }

      // Réponse de support local avec RAG
      const ragSnippets = getRAGSnippets(intent, userQuery)
      const supportResponse = `🔧 **Support CubeAI**\n\n${ragSnippets.join('\n\n')}\n\n💡 **Pour une assistance personnalisée, veuillez vous connecter à votre compte.**`
      
      return NextResponse.json({
        text: supportResponse,
        actions: [
          { label: "Se connecter", href: "/login" },
          { label: "Créer un compte", href: "/register" }
        ],
        model: 'local-support',
        subscriptionType: 'none'
      })
    }

    // Utilisateur connecté - workflow complet avec contexte utilisateur
    const intent = detectIntent(userQuery)
    
    // Construire le contexte utilisateur enrichi
    const userContext = await getUserContext(userInfo)
    
    console.log('🔍 UserContext récupéré:', userContext.displayName, userContext.role)
    console.log('📊 Enfants dans le contexte:', userContext.childrenData?.length || 0)
    
    // Récupérer les snippets RAG
    const ragSnippets = getRAGSnippets(intent, userQuery)
    
    // Récupérer les prompts parents pour le RAG si c'est un parent
    let parentRAGSnippets: string[] = []
    if (userContext.role === 'parent' && userInfo.userType === 'PARENT') {
      try {
        console.log('🔍 Récupération des prompts parents pour le RAG...')
        
        // Récupérer l'accountId du parent
        const parentSession = await prisma.userSession.findUnique({
          where: { id: userInfo.id },
          include: { account: true }
        })
        
        if (parentSession && parentSession.account) {
          const parentData = await getParentPromptsAndPreferences(parentSession.account.id)
          const parentRAGContent = formatParentPromptsForRAG(parentData)
          
          if (parentRAGContent && parentRAGContent !== 'Aucune donnée parentale disponible.') {
            parentRAGSnippets = [parentRAGContent]
            console.log('✅ Prompts parents intégrés dans le RAG')
          } else {
            console.log('ℹ️ Aucun prompt parent disponible pour le RAG')
          }
        } else {
          console.log('❌ Impossible de récupérer l\'accountId du parent')
        }
      } catch (error) {
        console.error('❌ Erreur récupération prompts parents RAG:', error)
      }
    }
    
    // Combiner les snippets RAG généraux et les prompts parents
    const allRAGSnippets = [...ragSnippets, ...parentRAGSnippets]
    
    // Construire les prompts avec le contexte utilisateur enrichi
    const { messages } = buildPrompts({
      persona,
      role: userContext.role,
      lang,
      context: userContext.displayName,
      rag: allRAGSnippets,
      history: body.messages,
      userQuery,
      intent,
      user: userInfo,
      childSessions: body.childSessions,
      childrenData: userContext.childrenData,
      dataInsights: userContext.dataInsights
    })
    
    console.log('📝 Prompt construit avec:')
    console.log('   - Role:', userContext.role)
    console.log('   - Enfants:', userContext.childrenData?.length || 0)
    console.log('   - Insights:', userContext.dataInsights ? 'Oui' : 'Non')
    
    if (userContext.childrenData && userContext.childrenData.length > 0) {
      console.log('👶 Données enfants disponibles:')
      userContext.childrenData.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.firstName} ${child.lastName} (${child.activities.length} activités)`)
      })
    }

    // Vérifier si le LLM est activé pour cet abonnement
    if (!isLLMEnabled(userInfo.subscriptionType)) {
      return NextResponse.json({ 
        text: `🔒 **Accès LLM limité**\n\nVotre abonnement actuel (${userInfo.subscriptionType}) ne permet pas l'accès au mode LLM avancé.\n\n💡 **Pour débloquer l'IA avancée :**\n• Passez à un abonnement PRO ou PRO_PLUS\n• Accédez à des réponses plus intelligentes et personnalisées\n• Profitez de plus de tokens et de fonctionnalités avancées\n\n📚 **En attendant, vous pouvez :**\n• Utiliser la base de connaissances locale\n• Consulter la FAQ et le support\n• Explorer les fonctionnalités de base`,
        actions: [
          { label: "Voir les abonnements", href: "/register" },
          { label: "FAQ", href: "/support" }
        ],
        error: 'LLM_NOT_AVAILABLE'
      })
    }

    const key = process.env.OPENAI_API_KEY
    if (!key || key === 'sk-your-openai-api-key-here') {
      return NextResponse.json({
        text: "Le mode LLM n'est pas configuré côté serveur. Contactez l'administrateur pour activer la réponse intelligente.",
        actions: [],
        error: 'LLM_NOT_CONFIGURED'
      })
    }

    // Utiliser le modèle approprié selon l'abonnement
    const model = getModelForSubscription(userInfo.subscriptionType)
    const maxTokens = getMaxTokensForSubscription(userInfo.subscriptionType)

    // Call OpenAI Chat Completions
    const payload = {
      model: model,
      messages: messages,
      temperature: persona === 'kid' ? 0.6 : 0.4,
      max_tokens: maxTokens,
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      const txt = await r.text()
      console.error('❌ Erreur OpenAI:', txt)
      return NextResponse.json({
        text: "Le service LLM a renvoyé une erreur. Fallback local activé.",
        actions: [],
        info: txt,
        error: 'LLM_ERROR'
      })
    }
    
    const data = await r.json()
    const rawText = data.choices?.[0]?.message?.content ?? "Réponse vide du modèle."

    // Post-traiter la réponse
    const { text, actions } = postProcessResponse(rawText, persona, intent)

    // Sauvegarder automatiquement le prompt si c'est un parent
    console.log('🔍 Vérification de la condition de sauvegarde...');
    console.log(`👤 userContext.role: ${userContext.role}`);
    console.log(`🎫 userInfo.userType: ${userInfo.userType}`);
    console.log(`🔍 Condition: userContext.role === 'parent' && userInfo.userType === 'PARENT'`);
    console.log(`✅ Résultat: ${userContext.role === 'parent' && userInfo.userType === 'PARENT'}`);
    
    if (userContext.role === 'parent' && userInfo.userType === 'PARENT') {
      try {
        console.log('💾 Sauvegarde automatique du prompt parent...');
        
        // Récupérer l'accountId et un enfant de référence
        const parentSession = await prisma.userSession.findUnique({
          where: { id: userInfo.id },
          include: { 
            account: true
          }
        });
        
        console.log(`🔍 Parent session trouvée: ${!!parentSession}`);
        console.log(`🔍 Account trouvé: ${!!parentSession?.account}`);
        
        if (parentSession && parentSession.account) {
          // Récupérer un enfant du même compte
          const childSession = await prisma.userSession.findFirst({
            where: {
              accountId: parentSession.accountId,
              userType: 'CHILD'
            }
          });
          
          console.log(`🔍 Enfant trouvé: ${!!childSession}`);
          if (childSession) {
            console.log(`👶 Enfant: ${childSession.firstName} ${childSession.lastName}`);
          }
          
          const promptType = detectPromptType(userQuery);
          const childSessionId = childSession?.id || parentSession.id; // Fallback sur le parent si pas d'enfant
          
          console.log(`🎯 Type détecté: ${promptType}`);
          console.log(`👶 Child Session ID: ${childSessionId}`);
          
          const savedPrompt = await saveParentPrompt(
            parentSession.id,
            childSessionId,
            parentSession.account.id,
            userQuery,
            text,
            promptType
          );
          
          if (savedPrompt) {
            console.log('✅ Prompt parent sauvegardé automatiquement');
            console.log(`🆔 ID du prompt sauvegardé: ${savedPrompt.id}`);
          } else {
            console.log('❌ Échec de la sauvegarde - saveParentPrompt a retourné null');
          }
        } else {
          console.log('❌ Impossible de récupérer parent session ou account');
          console.log(`🔍 Parent session: ${!!parentSession}`);
          console.log(`🔍 Account: ${!!parentSession?.account}`);
        }
      } catch (error) {
        console.error('❌ Erreur sauvegarde automatique prompt parent:', error);
        console.error('🔍 Détails de l\'erreur:', {
          message: error.message,
          stack: error.stack,
          code: error.code
        });
      }
    } else {
      console.log('❌ Condition de sauvegarde non remplie');
      console.log(`👤 userContext.role: ${userContext.role} (attendu: 'parent')`);
      console.log(`🎫 userInfo.userType: ${userInfo.userType} (attendu: 'PARENT')`);
    }

    // Calculer les limites de caractères
    const maxCharacters = getMaxCharactersForSubscription(userInfo.subscriptionType)
    const currentCharacters = userQuery.length
    const remainingCharacters = getRemainingCharacters(userQuery, userInfo.subscriptionType)

    return NextResponse.json({
      text,
      actions,
      model: model,
      subscriptionType: userInfo.subscriptionType,
      userInfo: {
        email: userInfo.email,
        sessionId: userInfo.sessionId,
        name: `${userInfo.firstName} ${userInfo.lastName}`,
        userType: userInfo.userType,
        subscriptionType: userInfo.subscriptionType
      },
      intent,
      persona,
      // Informations sur les limites de caractères
      characterLimits: {
        max: maxCharacters,
        current: currentCharacters,
        remaining: remainingCharacters,
        subscriptionType: userInfo.subscriptionType
      }
    })
  } catch (e: any) {
    console.error('❌ Erreur API chat:', e)
    return NextResponse.json({
      text: "Impossible d'interroger le LLM pour le moment. Utilisez les liens et le moteur local.",
      actions: [],
      error: 'LLM_UNAVAILABLE'
    })
  }
}
