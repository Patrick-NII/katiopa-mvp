// Test simple pour vérifier l'accès à la base de données depuis le frontend
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testFrontendDB() {
  console.log('🔍 Test d\'accès à la base depuis le frontend...')
  
  try {
    // Test simple : récupérer un parent
    const parent = await prisma.userSession.findFirst({
      where: {
        userType: 'PARENT',
        isActive: true
      },
      include: {
        account: {
          include: {
            userSessions: {
              where: {
                userType: 'CHILD',
                isActive: true
              },
              include: {
                activities: true
              }
            }
          }
        }
      }
    })
    
    if (parent) {
      console.log('✅ Parent trouvé:', parent.firstName, parent.lastName)
      console.log('🏠 AccountId:', parent.accountId)
      console.log('👶 Enfants:', parent.account.userSessions.length)
      
      parent.account.userSessions.forEach(child => {
        console.log(`   ${child.firstName}: ${child.activities.length} activités`)
      })
      
      // Test de la fonction getChildrenData
      console.log('\n🔍 Test de getChildrenData...')
      
      const childrenData = await getChildrenData(parent.accountId)
      console.log('📊 Enfants récupérés:', childrenData.length)
      
      childrenData.forEach((child, index) => {
        console.log(`   Enfant ${index + 1}: ${child.firstName} (${child.activities.length} activités)`)
      })
      
    } else {
      console.log('❌ Aucun parent trouvé')
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

// Exécuter le test
testFrontendDB()
