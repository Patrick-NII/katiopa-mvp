// Test direct de la fonction getChildrenData
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGetChildrenData() {
  console.log('🧪 Test direct de getChildrenData...')
  
  try {
    // Récupérer le parent de test
    const parent = await prisma.userSession.findFirst({
      where: {
        userType: 'PARENT',
        isActive: true
      },
      include: {
        account: true
      }
    })
    
    if (!parent) {
      console.log('❌ Aucun parent trouvé')
      return
    }
    
    console.log('✅ Parent trouvé:', parent.firstName, parent.lastName)
    console.log('🏠 AccountId:', parent.accountId)
    
    // Test de la fonction getChildrenData
    const childrenData = await getChildrenData(parent.accountId)
    console.log('📊 Enfants récupérés:', childrenData.length)
    
    if (childrenData.length > 0) {
      childrenData.forEach((child, index) => {
        console.log(`\n👶 Enfant ${index + 1}: ${child.firstName} ${child.lastName}`)
        console.log(`   Âge: ${child.age}`)
        console.log(`   Activités: ${child.activities.length}`)
        
        if (child.activities.length > 0) {
          console.log('   Dernières activités:')
          child.activities.slice(0, 3).forEach(activity => {
            console.log(`     - ${activity.domain}: ${activity.nodeKey} (${activity.score}/100)`)
          })
        }
      })
      
      // Test de la fonction generateDataInsights
      console.log('\n💡 Test de generateDataInsights...')
      const insights = generateDataInsights(childrenData)
      console.log('📊 Insights générés:', insights.length, 'caractères')
      console.log('📄 Contenu:', insights.substring(0, 200) + '...')
      
    } else {
      console.log('❌ Aucune donnée d\'enfant récupérée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
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
testGetChildrenData()
