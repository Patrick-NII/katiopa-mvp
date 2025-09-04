// Test simple de la fonction getChildrenData corrigée
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testSimpleGetChildrenData() {
  console.log('🧪 Test simple de getChildrenData corrigée...')
  
  try {
    // Récupérer le parent de test
    const parent = await prisma.userSession.findFirst({
      where: {
        userType: 'PARENT',
        isActive: true
      }
    })
    
    if (!parent) {
      console.log('❌ Aucun parent trouvé')
      return
    }
    
    console.log('✅ Parent trouvé:', parent.firstName, parent.lastName)
    console.log('🏠 AccountId:', parent.accountId)
    
    // Test de la fonction getChildrenData simplifiée
    const children = await prisma.userSession.findMany({
      where: {
        accountId: parent.accountId,
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
    
    if (children.length > 0) {
      children.forEach((child, index) => {
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
      
      console.log('\n✅ Test réussi ! Les données sont accessibles.')
      
    } else {
      console.log('❌ Aucune donnée d\'enfant récupérée')
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testSimpleGetChildrenData()
