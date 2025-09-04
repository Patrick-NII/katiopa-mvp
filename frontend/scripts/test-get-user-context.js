// Test direct de getUserContext
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGetUserContext() {
  console.log('🧪 Test direct de getUserContext...')
  
  try {
    // Simuler un userInfo
    const userInfo = {
      id: 'cmf2yznwt000245g0zi7tffx8', // ID de Marie Martin
      sessionId: 'parent_01',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'parent@katiopa.com',
      userType: 'PARENT',
      subscriptionType: 'PRO',
      isActive: true
    }
    
    console.log('👤 UserInfo simulé:', userInfo.firstName, userInfo.userType)
    
    // Test de getUserContext
    const userContext = await getUserContext(userInfo)
    console.log('✅ UserContext récupéré')
    console.log('👤 DisplayName:', userContext.displayName)
    console.log('👥 Role:', userContext.role)
    console.log('📊 Enfants:', userContext.childrenData?.length || 0)
    console.log('💡 Insights:', userContext.dataInsights ? 'Oui' : 'Non')
    
    if (userContext.childrenData && userContext.childrenData.length > 0) {
      console.log('👶 Enfants trouvés:')
      userContext.childrenData.forEach((child, index) => {
        console.log(`   ${index + 1}. ${child.firstName} ${child.lastName} (${child.activities.length} activités)`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction getUserContext (copiée du frontend)
async function getUserContext(userInfo) {
  try {
    console.log('🔍 getUserContext appelé pour:', userInfo.firstName, userInfo.userType)
    
    const displayName = userInfo.firstName || userInfo.email || 'Utilisateur'
    const role = userInfo.userType === 'CHILD' ? 'child' : 'parent'
    
    console.log('👤 Rôle détecté:', role)
    
    // Si c'est un parent, récupérer les données de tous ses enfants
    let childrenData = []
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
        level: Math.round(child.activities.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(child.activities.length, 1)),
        stats: {
          totalActivities: child.activities.length,
          avgScore: Math.round(child.activities.reduce((sum, a) => sum + (a.score || 0), 0) / Math.max(child.activities.length, 1)),
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

// Fonction getChildrenData (copiée du frontend)
async function getChildrenData(accountId) {
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
          take: 100
        },
        profile: true
      }
    })

    console.log('📊 Enfants trouvés:', children.length)
    children.forEach((child, index) => {
      console.log(`👶 Enfant ${index + 1}: ${child.firstName} ${child.lastName} (${child.activities.length} activités)`)
    })

    return children.map(child => ({
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
      
      activities: child.activities.map(activity => ({
        id: activity.id,
        domain: activity.domain,
        nodeKey: activity.nodeKey,
        score: activity.score,
        attempts: activity.attempts,
        durationMs: activity.durationMs,
        createdAt: activity.createdAt
      }))
    }))
  } catch (error) {
    console.error('❌ Erreur récupération données enfants:', error)
    return []
  }
}

// Fonction generateDataInsights (copiée du frontend)
function generateDataInsights(childrenData) {
  if (childrenData.length === 0) {
    return "Aucune donnée d'enfant disponible pour l'analyse."
  }

  let insights = "📊 **ANALYSE DES DONNÉES ENFANTS**\n\n"
  
  childrenData.forEach((child, index) => {
    insights += `**${child.firstName} ${child.lastName}** (${child.age || 'N/A'} ans)\n`
    
    // Statistiques générales
    const totalActivities = child.activities.length
    const totalSessions = 0 // Pas de sessions pour l'instant
    const avgScore = child.activities.length > 0 
      ? Math.round(child.activities.reduce((sum, a) => sum + (a.score || 0), 0) / child.activities.length)
      : 0
    
    insights += `• ${totalActivities} activités réalisées\n`
    insights += `• ${totalSessions} sessions d'apprentissage\n`
    insights += `• Score moyen: ${avgScore}/100\n`
    
    // Domaines les plus pratiqués
    const domainStats = child.activities.reduce((acc, activity) => {
      acc[activity.domain] = (acc[activity.domain] || 0) + 1
      return acc
    }, {})
    
    const topDomains = Object.entries(domainStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([domain, count]) => `${domain} (${count} fois)`)
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

// Exécuter le test
testGetUserContext()
