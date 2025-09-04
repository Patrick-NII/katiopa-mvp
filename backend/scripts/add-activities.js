// Script pour ajouter des activités aux enfants existants
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addActivities() {
  console.log('🔍 Ajout d\'activités aux enfants existants...')
  
  try {
    // Récupérer tous les enfants
    const children = await prisma.userSession.findMany({
      where: {
        userType: 'CHILD',
        isActive: true
      }
    })
    
    console.log('👶 Enfants trouvés:', children.length)
    
    for (const child of children) {
      console.log(`\n📚 Ajout d'activités pour ${child.firstName} ${child.lastName}...`)
      
      // Créer des activités variées
      const activities = [
        {
          userSessionId: child.id,
          domain: 'Mathématiques',
          nodeKey: 'addition_simple',
          score: Math.floor(Math.random() * 30) + 70, // 70-100
          attempts: Math.floor(Math.random() * 3) + 1,
          durationMs: (Math.floor(Math.random() * 5) + 2) * 60000 // 2-7 minutes
        },
        {
          userSessionId: child.id,
          domain: 'Mathématiques',
          nodeKey: 'soustraction_simple',
          score: Math.floor(Math.random() * 25) + 75, // 75-100
          attempts: Math.floor(Math.random() * 3) + 1,
          durationMs: (Math.floor(Math.random() * 4) + 2) * 60000
        },
        {
          userSessionId: child.id,
          domain: 'Programmation',
          nodeKey: 'sequences_basiques',
          score: Math.floor(Math.random() * 20) + 80, // 80-100
          attempts: Math.floor(Math.random() * 2) + 1,
          durationMs: (Math.floor(Math.random() * 6) + 3) * 60000
        },
        {
          userSessionId: child.id,
          domain: 'Mathématiques',
          nodeKey: 'multiplication_simple',
          score: Math.floor(Math.random() * 35) + 65, // 65-100
          attempts: Math.floor(Math.random() * 4) + 1,
          durationMs: (Math.floor(Math.random() * 5) + 3) * 60000
        },
        {
          userSessionId: child.id,
          domain: 'Programmation',
          nodeKey: 'boucles_simples',
          score: Math.floor(Math.random() * 25) + 75, // 75-100
          attempts: Math.floor(Math.random() * 3) + 1,
          durationMs: (Math.floor(Math.random() * 7) + 4) * 60000
        },
        {
          userSessionId: child.id,
          domain: 'Mathématiques',
          nodeKey: 'geometrie_formes',
          score: Math.floor(Math.random() * 30) + 70, // 70-100
          attempts: Math.floor(Math.random() * 3) + 1,
          durationMs: (Math.floor(Math.random() * 4) + 2) * 60000
        },
        {
          userSessionId: child.id,
          domain: 'Programmation',
          nodeKey: 'conditions_simples',
          score: Math.floor(Math.random() * 20) + 80, // 80-100
          attempts: Math.floor(Math.random() * 2) + 1,
          durationMs: (Math.floor(Math.random() * 6) + 3) * 60000
        }
      ]
      
      await prisma.activity.createMany({
        data: activities
      })
      
      console.log(`✅ ${activities.length} activités ajoutées pour ${child.firstName}`)
    }
    
    console.log('\n🎉 Toutes les activités ont été ajoutées !')
    
    // Vérifier le résultat
    const finalCheck = await prisma.userSession.findMany({
      where: {
        userType: 'CHILD',
        isActive: true
      },
      include: {
        activities: true
      }
    })
    
    console.log('\n📊 Résultat final:')
    finalCheck.forEach(child => {
      console.log(`   ${child.firstName} ${child.lastName}: ${child.activities.length} activités`)
    })
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout d\'activités:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
addActivities()
