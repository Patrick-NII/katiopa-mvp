// Script de test pour vérifier et ajouter des données de test
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testData() {
  console.log('🔍 Test des données dans la base...')
  
  try {
    // 1. Vérifier les comptes existants
    const accounts = await prisma.account.findMany({
      include: {
        userSessions: {
          include: {
            activities: true,
            profile: true
          }
        }
      }
    })
    
    console.log('📊 Comptes trouvés:', accounts.length)
    
    accounts.forEach((account, index) => {
      console.log(`\n🏠 Compte ${index + 1}:`)
      console.log(`   Email: ${account.email}`)
      console.log(`   Type: ${account.subscriptionType}`)
      console.log(`   Sessions: ${account.userSessions.length}`)
      
      account.userSessions.forEach((session, sIndex) => {
        console.log(`   👤 Session ${sIndex + 1}: ${session.firstName} ${session.lastName} (${session.userType})`)
        console.log(`      Activités: ${session.activities.length}`)
        console.log(`      Profil: ${session.profile ? 'Complété' : 'À compléter'}`)
      })
    })
    
    // 2. Si pas de données, créer un compte de test
    if (accounts.length === 0) {
      console.log('\n🌱 Création d\'un compte de test...')
      
      const testAccount = await prisma.account.create({
        data: {
          email: 'test@cubeai.com',
          subscriptionType: 'PRO',
          maxSessions: 3,
          isActive: true
        }
      })
      
      console.log('✅ Compte créé:', testAccount.email)
      
      // Créer un parent
      const parentSession = await prisma.userSession.create({
        data: {
          accountId: testAccount.id,
          sessionId: 'parent_test',
          password: 'password123',
          firstName: 'Marie',
          lastName: 'Dupont',
          userType: 'PARENT',
          isActive: true
        }
      })
      
      console.log('✅ Parent créé:', parentSession.firstName)
      
      // Créer un enfant
      const childSession = await prisma.userSession.create({
        data: {
          accountId: testAccount.id,
          sessionId: 'lucas_test',
          password: 'password123',
          firstName: 'Lucas',
          lastName: 'Dupont',
          age: 7,
          grade: 'CE1',
          userType: 'CHILD',
          isActive: true
        }
      })
      
      console.log('✅ Enfant créé:', childSession.firstName)
      
      // Créer le profil de l'enfant
      await prisma.userProfile.create({
        data: {
          userSessionId: childSession.id,
          learningGoals: ['Améliorer les mathématiques', 'Développer la logique'],
          preferredSubjects: ['Mathématiques', 'Programmation'],
          learningStyle: 'visuel',
          difficulty: 'débutant',
          interests: ['Jeux', 'Puzzles', 'Dessin'],
          specialNeeds: []
        }
      })
      
      console.log('✅ Profil enfant créé')
      
      // Créer des activités de test
      const activities = [
        {
          userSessionId: childSession.id,
          domain: 'Mathématiques',
          nodeKey: 'addition_simple',
          score: 85,
          attempts: 3,
          durationMs: 180000
        },
        {
          userSessionId: childSession.id,
          domain: 'Mathématiques',
          nodeKey: 'soustraction_simple',
          score: 72,
          attempts: 2,
          durationMs: 150000
        },
        {
          userSessionId: childSession.id,
          domain: 'Programmation',
          nodeKey: 'sequences_basiques',
          score: 92,
          attempts: 1,
          durationMs: 240000
        },
        {
          userSessionId: childSession.id,
          domain: 'Mathématiques',
          nodeKey: 'multiplication_simple',
          score: 68,
          attempts: 4,
          durationMs: 200000
        },
        {
          userSessionId: childSession.id,
          domain: 'Programmation',
          nodeKey: 'boucles_simples',
          score: 88,
          attempts: 2,
          durationMs: 300000
        }
      ]
      
      await prisma.activity.createMany({
        data: activities
      })
      
      console.log('✅ Activités créées:', activities.length)
      
      console.log('\n🎉 Données de test créées avec succès !')
      console.log('📝 Informations de connexion:')
      console.log('   Parent: sessionId=parent_test, password=password123')
      console.log('   Enfant: sessionId=lucas_test, password=password123')
      
    } else {
      console.log('\n✅ Des données existent déjà dans la base')
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testData()
