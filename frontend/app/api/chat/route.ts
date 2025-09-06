// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import * as jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import OpenAI from 'openai'
import { buildPrompts } from './buildPrompts'

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

    // En mode développement, utiliser une approche simplifiée SEULEMENT si pas de token
    if (!token && process.env.NODE_ENV === 'development') {
      console.log('🔧 Mode développement - authentification simplifiée (pas de token)')
      
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
    let decoded: any
    try {
      decoded = jwt.verify(token!, process.env.JWT_SECRET || 'your-secret-key') as any
    } catch (error) {
      console.log('❌ Token JWT invalide:', error)
      return null
    }
    
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

// Fonction pour vérifier les connexions actives en temps réel
async function getActiveConnections(accountId: string): Promise<any[]> {
  try {
    console.log('🔍 Vérification des connexions actives pour accountId:', accountId)
    
    // Récupérer tous les utilisateurs actifs de ce compte
    const activeUsers = await prisma.userSession.findMany({
      where: {
        accountId: accountId,
        isActive: true,
        // Vérifier si la dernière connexion est récente (dans les 30 dernières minutes)
        lastLoginAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes
        }
      },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true,
        userType: true,
        lastLoginAt: true,
        totalConnectionDurationMs: true
      }
    })
    
    console.log('👥 Utilisateurs actifs trouvés:', activeUsers.length)
    activeUsers.forEach(user => {
      console.log(`   - ${user.firstName} ${user.lastName} (${user.userType}) - Dernière connexion: ${user.lastLoginAt}`)
    })
    
    return activeUsers
  } catch (error) {
    console.error('❌ Erreur vérification connexions actives:', error)
    return []
  }
}

// Fonction pour récupérer les données CubeMatch d'un enfant
async function getCubeMatchData(childId: string, limit?: number): Promise<any> {
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
      ...(limit && { take: limit })
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
    const totalScore = cubeMatchScores.reduce((sum: number, score: any) => sum + score.score, 0);
    const bestScore = Math.max(...cubeMatchScores.map((s: any) => s.score));
    const currentLevel = Math.max(...cubeMatchScores.map((s: any) => s.level));
    const totalTimeMs = cubeMatchScores.reduce((sum: number, score: any) => sum + Number(score.time_played_ms), 0);
    
    // Opérateur préféré
    const operatorCounts = cubeMatchScores.reduce((acc: Record<string, number>, score: any) => {
      acc[score.operator] = (acc[score.operator] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteOperator = Object.entries(operatorCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'ADD';

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
async function getChildrenData(accountId: string, subscriptionType: string = 'FREE'): Promise<any> {
  try {
    console.log('🔍 Recherche enfants pour accountId:', accountId)
    
    // Déterminer les limitations selon l'abonnement
    const isProOrHigher = ['PRO', 'PRO_PLUS', 'ENTERPRISE'].includes(subscriptionType)
    const activitiesLimit = isProOrHigher ? undefined : 100
    const cubeMatchLimit = isProOrHigher ? undefined : 50
    
    console.log('🔒 Limitations appliquées:', {
      subscriptionType,
      isProOrHigher,
      activitiesLimit: activitiesLimit || 'illimité',
      cubeMatchLimit: cubeMatchLimit || 'illimité'
    })

    const children = await prisma.userSession.findMany({
      where: {
        accountId: accountId,
        userType: 'CHILD',
        isActive: true
      },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          ...(activitiesLimit && { take: activitiesLimit })
        },
        profile: true
      }
    })

    console.log('📊 Enfants trouvés:', children.length)
    children.forEach((child, index) => {
      console.log(`👶 Enfant ${index + 1}: ${child.firstName} ${child.lastName} (${child.activities.length} activités)`)
    })

    // Récupérer tous les prompts pour ce compte
    const allPrompts = await prisma.ParentPrompt.findMany({
      where: {
        userSession: {
          accountId: accountId
        }
      },
      orderBy: { createdAt: 'desc' },
      include: {
        userSession: true
      }
    })

    console.log('📝 Prompts trouvés:', allPrompts.length)

    // Enrichir avec les données CubeMatch
    const enrichedChildren = await Promise.all(children.map(async (child) => {
      try {
        // Récupérer les données CubeMatch
        const cubeMatchData = await getCubeMatchData(child.id, cubeMatchLimit);
        
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
    
    return {
      children: enrichedChildren,
      prompts: allPrompts.map(prompt => ({
        id: prompt.id,
        content: prompt.content,
        type: prompt.type,
        status: prompt.status,
        createdAt: prompt.createdAt,
        updatedAt: prompt.updatedAt,
        metadata: prompt.metadata,
        childSessionId: prompt.childSessionId,
        parentName: prompt.userSession?.firstName + ' ' + prompt.userSession?.lastName
      }))
    }
  } catch (error) {
    console.error('❌ Erreur récupération données enfants:', error)
    return { children: [], prompts: [] }
  }
}

// Fonction pour analyser les données et générer des insights
function generateDataInsights(childrenData: any[], activeConnections: any[] = [], prompts: any[] = []): string {
  if (!childrenData || childrenData.length === 0) {
    return "Aucune donnée d'enfant disponible pour l'analyse."
  }

  let insights = "📊 **ANALYSE DES DONNÉES ENFANTS**\n\n"
  
  // Informations sur les prompts générés
  if (prompts && prompts.length > 0) {
    insights += "## 📝 PROMPTS GÉNÉRÉS\n"
    insights += `• **${prompts.length} prompts** générés au total\n`
    
    // Grouper par type
    const promptsByType = prompts.reduce((acc: any, prompt: any) => {
      acc[prompt.type] = (acc[prompt.type] || 0) + 1
      return acc
    }, {})
    
    Object.entries(promptsByType).forEach(([type, count]) => {
      insights += `• **${type}**: ${count} prompts\n`
    })
    
    // Derniers prompts
    const recentPrompts = prompts.slice(0, 3)
    insights += `• **Derniers prompts**:\n`
    recentPrompts.forEach((prompt: any, index: number) => {
      const date = new Date(prompt.createdAt).toLocaleDateString('fr-FR')
      insights += `  ${index + 1}. ${prompt.type} (${date}) - ${prompt.status}\n`
    })
    insights += "\n"
  } else {
    insights += "## 📝 PROMPTS GÉNÉRÉS\n"
    insights += "• Aucun prompt généré pour le moment\n\n"
  }
  
  // Informations sur les connexions actives
  if (activeConnections.length > 0) {
    insights += "## 🔴 CONNEXIONS ACTIVES\n"
    activeConnections.forEach(user => {
      const timeAgo = Math.round((Date.now() - new Date(user.lastLoginAt).getTime()) / (1000 * 60))
      insights += `• **${user.firstName} ${user.lastName}** (${user.userType}) - Connecté il y a ${timeAgo} minutes\n`
    })
    insights += "\n"
  } else {
    insights += "## 🔴 CONNEXIONS ACTIVES\n"
    insights += "• Aucune connexion active détectée\n\n"
  }
  
  childrenData.forEach((child, index) => {
    // Vérifier que child et child.activities existent
    if (!child || !child.activities) {
      insights += `**${child?.firstName || 'Enfant'} ${child?.lastName || 'Inconnu'}**\n`
      insights += `• Données d'activités non disponibles\n\n`
      return
    }
    
    insights += `**${child.firstName} ${child.lastName}** (${child.age || 'N/A'} ans)\n`
    
    // Vérifier si cet enfant est actuellement connecté
    const isChildActive = activeConnections.some(active => 
      active.firstName === child.firstName && active.lastName === child.lastName
    )
    
    if (isChildActive) {
      const activeUser = activeConnections.find(active => 
        active.firstName === child.firstName && active.lastName === child.lastName
      )
      const timeAgo = Math.round((Date.now() - new Date(activeUser.lastLoginAt).getTime()) / (1000 * 60))
      insights += `• **🟢 ACTUELLEMENT CONNECTÉ** (depuis ${timeAgo} minutes)\n`
    } else {
      insights += `• **🔴 Non connecté**\n`
    }
    
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
          const opNameMap: Record<string, string> = { 'ADD': 'Add', 'SUB': 'Sous', 'MUL': 'Mult', 'DIV': 'Div' };
          const opName = opNameMap[op.operator] || op.operator;
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
    let activeConnections: any[] = []
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
        const dataResult = await getChildrenData(userSession.accountId, userInfo.subscriptionType)
        childrenData = dataResult.children
        console.log('📊 Données enfants récupérées:', childrenData.length, 'enfants')
        console.log('📝 Prompts récupérés:', dataResult.prompts.length, 'prompts')
        
        // Récupérer les connexions actives
        activeConnections = await getActiveConnections(userSession.accountId)
        
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
    const dataInsights = role === 'parent' ? generateDataInsights(childrenData, activeConnections, dataResult?.prompts || []) : ""
    
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

// Fonction pour construire les prompts selon le workflow (maintenant dans buildPrompts.ts)
// L'ancienne fonction a été supprimée et remplacée par buildPrompts.ts
  

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
  // LLM disponible à partir de PRO
  return ['PRO', 'PRO_PLUS', 'ENTERPRISE'].includes(subscriptionType)
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
    case 'STARTER':
      return 1000 // Limité pour les comptes starter
    case 'PRO':
    case 'PRO_PLUS':
    case 'ENTERPRISE':
      return 999999 // Illimité à partir de PRO
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

// Fonction pour sauvegarder une activité convenue entre parent et Bubix Pro
async function saveAgreedActivity(
  accountId: string,
  childSessionId: string,
  activityType: string,
  activityTitle: string,
  description: string,
  parentRequest: string,
  bubixResponse: string
) {
  try {
    const agreedActivity = await prisma.agreedActivity.create({
      data: {
        accountId,
        childSessionId,
        activityType,
        activityTitle,
        description,
        parentRequest,
        bubixResponse,
        status: 'PENDING'
      }
    })
    
    console.log('✅ Activité convenue sauvegardée:', agreedActivity.id)
    return agreedActivity
  } catch (error: any) {
    console.error('❌ Erreur sauvegarde activité convenue:', error?.message)
    return null
  }
}

// Fonction pour récupérer les activités convenues pour un enfant
async function getAgreedActivitiesForChild(childSessionId: string) {
  try {
    const activities = await prisma.agreedActivity.findMany({
      where: {
        childSessionId,
        status: { in: ['PENDING', 'PROPOSED'] }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return activities
  } catch (error: any) {
    console.error('❌ Erreur récupération activités convenues:', error?.message)
    return []
  }
}

// Fonctions de détection pour les prompts enfants
function detectActivityType(userQuery: string): string | undefined {
  const query = userQuery.toLowerCase()
  
  if (query.includes('math') || query.includes('calcul') || query.includes('nombre')) {
    return 'MATHEMATIQUES'
  } else if (query.includes('lecture') || query.includes('livre') || query.includes('histoire')) {
    return 'LECTURE'
  } else if (query.includes('science') || query.includes('expérience') || query.includes('nature')) {
    return 'SCIENCES'
  } else if (query.includes('code') || query.includes('programmation') || query.includes('robot')) {
    return 'PROGRAMMATION'
  } else if (query.includes('jeu') || query.includes('jouer') || query.includes('amusement')) {
    return 'JEU'
  }
  
  return undefined
}

function detectDifficulty(userQuery: string): string {
  const query = userQuery.toLowerCase()
  
  if (query.includes('facile') || query.includes('simple') || query.includes('facilement')) {
    return 'EASY'
  } else if (query.includes('difficile') || query.includes('compliqué') || query.includes('dur')) {
    return 'HARD'
  }
  
  return 'MEDIUM'
}

function detectEngagement(userQuery: string): string | undefined {
  const query = userQuery.toLowerCase()
  
  if (query.includes('super') || query.includes('génial') || query.includes('cool') || query.includes('j\'adore')) {
    return 'HIGH'
  } else if (query.includes('bof') || query.includes('pas intéressant') || query.includes('ennuyeux')) {
    return 'LOW'
  }
  
  return 'MEDIUM'
}

// Fonction pour détecter une activité convenue dans la conversation
function detectAgreedActivity(userQuery: string, bubixResponse: string) {
  const query = userQuery.toLowerCase()
  const response = bubixResponse.toLowerCase()
  
  // Détecter les demandes d'implémentation d'activités
  const implementationKeywords = [
    'implémenter', 'mettre en place', 'activité', 'programme', 'exercice',
    'je souhaite que tu', 'peux-tu faire', 'est-ce que tu peux'
  ]
  
  const activityKeywords = [
    'intelligence artificielle', 'ia', 'programmation', 'mathématiques', 'maths',
    'sciences', 'lecture', 'écriture', 'langue', 'histoire', 'géographie'
  ]
  
  const hasImplementationRequest = implementationKeywords.some(keyword => 
    query.includes(keyword)
  )
  
  const hasActivityMention = activityKeywords.some(keyword => 
    query.includes(keyword) || response.includes(keyword)
  )
  
  if (hasImplementationRequest && hasActivityMention) {
    // Extraire le type d'activité
    let activityType = 'GENERAL'
    let activityTitle = 'Activité d\'apprentissage'
    
    if (query.includes('intelligence artificielle') || query.includes('ia')) {
      activityType = 'IA'
      activityTitle = 'Introduction à l\'Intelligence Artificielle'
    } else if (query.includes('programmation') || query.includes('code')) {
      activityType = 'PROGRAMMATION'
      activityTitle = 'Initiation à la Programmation'
    } else if (query.includes('mathématiques') || query.includes('maths')) {
      activityType = 'MATHEMATIQUES'
      activityTitle = 'Renforcement en Mathématiques'
    } else if (query.includes('sciences')) {
      activityType = 'SCIENCES'
      activityTitle = 'Découverte des Sciences'
    }
    
    return {
      activityType,
      activityTitle,
      description: `Activité ${activityType.toLowerCase()} convenue avec le parent pour renforcer l'apprentissage de l'enfant.`
    }
  }
  
  return null
}

// Fonction pour sauvegarder automatiquement les prompts des enfants
async function saveChildPrompt(
  childSessionId: string,
  accountId: string,
  childMessage: string,
  bubixResponse: string,
  promptType: string = 'CHILD_CHAT',
  activityType?: string,
  difficulty: string = 'MEDIUM',
  engagement?: string
) {
  try {
    console.log('💾 Sauvegarde du prompt enfant...');
    
    const savedPrompt = await prisma.childPrompt.create({
      data: {
        childSessionId,
        accountId,
        childMessage,
        bubixResponse,
        promptType,
        activityType,
        difficulty,
        engagement,
        status: 'PROCESSED'
      }
    });
    
    console.log('✅ Prompt enfant sauvegardé:', savedPrompt.id);
    return savedPrompt;
  } catch (error: any) {
    console.error('❌ Erreur sauvegarde prompt enfant:', error?.message);
    return null;
  }
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
      
      const typeLabelsMap: Record<string, string> = {
        'PARENT_WISHES': '🎯 SOUHAITS PARENTS',
        'CAREER_PLANNING': '🚀 PLANIFICATION CARRIÈRE',
        'WEAKNESS_IDENTIFICATION': '⚠️ IDENTIFICATION FAIBLESSES',
        'IMPROVEMENT_GOALS': '🎯 OBJECTIFS AMÉLIORATION',
        'SPECIFIC_NEEDS': '🔧 BESOINS SPÉCIFIQUES',
        'LEARNING_PREFERENCES': '📚 PRÉFÉRENCES APPRENTISSAGE',
        'LEARNING_OBJECTIVES': '🎯 OBJECTIFS APPRENTISSAGE',
        'BEHAVIORAL_CONCERNS': '😟 PRÉOCCUPATIONS COMPORTEMENTALES',
        'SOCIAL_SKILLS': '👥 COMPÉTENCES SOCIALES',
        'MOTIVATION_ISSUES': '⚡ PROBLÈMES MOTIVATION',
        'RECOMMENDATION_REQUEST': '💡 DEMANDES DE RECOMMANDATIONS',
        'PROGRESS_UPDATE': '📈 MISE À JOUR PROGRÈS',
        'LEARNING_DIFFICULTY': '🎓 DIFFICULTÉS D\'APPRENTISSAGE'
      };
      ragContent += `**${typeLabelsMap[type] || type}:**\n`;
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
    
    // Récupérer les activités convenues si c'est un enfant
    let agreedActivities: any[] = []
    if (userContext.role === 'child' && userInfo.userType === 'CHILD') {
      try {
        console.log('🔍 Récupération des activités convenues pour l\'enfant...')
        agreedActivities = await getAgreedActivitiesForChild(userInfo.id)
        console.log('📋 Activités convenues trouvées:', agreedActivities.length)
      } catch (error: any) {
        console.error('❌ Erreur récupération activités convenues:', error?.message)
      }
    }

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
      dataInsights: userContext.dataInsights,
      agreedActivities
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
    if (!key || key === 'OPENAI_API_KEY') {
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

          // Détecter et sauvegarder les activités convenues
          const activityMatch = detectAgreedActivity(userQuery, text);
          if (activityMatch && childSession) {
            console.log('🎯 Activité convenue détectée:', activityMatch.activityTitle);
            
            const savedActivity = await saveAgreedActivity(
              parentSession.account.id,
              childSession.id,
              activityMatch.activityType,
              activityMatch.activityTitle,
              activityMatch.description,
              userQuery,
              text
            );
            
            if (savedActivity) {
              console.log('✅ Activité convenue sauvegardée:', savedActivity.id);
            }
          }
        } else {
          console.log('❌ Impossible de récupérer parent session ou account');
          console.log(`🔍 Parent session: ${!!parentSession}`);
          console.log(`🔍 Account: ${!!parentSession?.account}`);
        }
      } catch (error: any) {
        console.error('❌ Erreur sauvegarde automatique prompt parent:', error);
        console.error('🔍 Détails de l\'erreur:', {
          message: error?.message || 'Erreur inconnue',
          stack: error?.stack || 'Pas de stack trace',
          code: error?.code || 'Pas de code d\'erreur'
        });
      }
    } else {
      console.log('❌ Condition de sauvegarde non remplie');
      console.log(`👤 userContext.role: ${userContext.role} (attendu: 'parent')`);
      console.log(`🎫 userInfo.userType: ${userInfo.userType} (attendu: 'PARENT')`);
    }

    // Sauvegarder automatiquement le prompt si c'est un enfant
    if (userContext.role === 'child' && userInfo.userType === 'CHILD') {
      try {
        console.log('💾 Sauvegarde automatique du prompt enfant...');
        
        // Récupérer l'accountId de l'enfant
        const childSession = await prisma.userSession.findUnique({
          where: { id: userInfo.id },
          include: { account: true }
        });
        
        if (childSession && childSession.account) {
          // Détecter le type d'activité si applicable
          const activityType = detectActivityType(userQuery);
          const difficulty = detectDifficulty(userQuery);
          const engagement = detectEngagement(userQuery);
          
          const savedPrompt = await saveChildPrompt(
            childSession.id,
            childSession.account.id,
            userQuery,
            text,
            'CHILD_CHAT',
            activityType,
            difficulty,
            engagement
          );
          
          if (savedPrompt) {
            console.log('✅ Prompt enfant sauvegardé automatiquement');
            console.log(`🆔 ID du prompt sauvegardé: ${savedPrompt.id}`);
          }
        }
      } catch (error: any) {
        console.error('❌ Erreur sauvegarde automatique prompt enfant:', error?.message);
      }
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
