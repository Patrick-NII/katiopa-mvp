import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function createTestSessions() {
  try {
    console.log('🚀 Création des sessions de test...')

    // Créer un compte de test
    const testAccount = await prisma.account.upsert({
      where: { email: 'test@cubeai.com' },
      update: {},
      create: {
        email: 'test@cubeai.com',
        subscriptionType: 'MAITRE',
        maxSessions: 5,
        isActive: true
      }
    })

    console.log('✅ Compte créé:', testAccount.email)

    // Créer des sessions enfants
    const childSessions = [
      {
        sessionId: 'milan-session',
        firstName: 'Milan',
        lastName: 'Test',
        age: 8,
        grade: 'CE2',
        gender: 'MALE',
        userType: 'CHILD'
      },
      {
        sessionId: 'aylon-session',
        firstName: 'Aylon',
        lastName: 'Test',
        age: 10,
        grade: 'CM1',
        gender: 'MALE',
        userType: 'CHILD'
      }
    ]

    for (const childData of childSessions) {
      const childSession = await prisma.userSession.upsert({
        where: { sessionId: childData.sessionId },
        update: {},
        create: {
          accountId: testAccount.id,
          sessionId: childData.sessionId,
          password: 'test123',
          firstName: childData.firstName,
          lastName: childData.lastName,
          age: childData.age,
          grade: childData.grade,
          gender: childData.gender,
          userType: childData.userType,
          isActive: true
        }
      })

      console.log(`✅ Session enfant créée: ${childSession.firstName} (${childSession.sessionId})`)

      // Créer des évaluations de compétences pour cette session
      const competences = await prisma.competence.findMany()
      
      for (const competence of competences) {
        // Générer des scores aléatoires mais réalistes
        const baseScore = Math.random() * 8 + 1 // Score entre 1 et 9
        const score = Math.round(baseScore * 10) / 10 // Arrondir à 1 décimale
        
        let level = 'Débutant'
        if (score >= 8) level = 'Expert'
        else if (score >= 6) level = 'Avancé'
        else if (score >= 4) level = 'Intermédiaire'

        await prisma.competenceAssessment.upsert({
          where: {
            competenceId_userSessionId: {
              competenceId: competence.id,
              userSessionId: childSession.id
            }
          },
          update: {
            score,
            level,
            progress: (score / 10) * 100,
            lastUpdated: new Date()
          },
          create: {
            competenceId: competence.id,
            userSessionId: childSession.id,
            score,
            level,
            progress: (score / 10) * 100,
            lastUpdated: new Date()
          }
        })
      }

      console.log(`✅ Évaluations créées pour ${childSession.firstName}`)
    }

    // Créer une session parent
    const parentSession = await prisma.userSession.upsert({
      where: { sessionId: 'parent-session' },
      update: {},
      create: {
        accountId: testAccount.id,
        sessionId: 'parent-session',
        password: 'test123',
        firstName: 'Parent',
        lastName: 'Test',
        gender: 'MALE',
        userType: 'PARENT',
        isActive: true
      }
    })

    console.log(`✅ Session parent créée: ${parentSession.firstName} (${parentSession.sessionId})`)

    console.log('🎉 Sessions de test créées avec succès !')
    console.log('')
    console.log('📋 Sessions disponibles :')
    console.log('- Parent: parent-session')
    console.log('- Milan: milan-session')
    console.log('- Aylon: aylon-session')
    console.log('')
    console.log('🔑 Mot de passe pour toutes les sessions: test123')

  } catch (error) {
    console.error('❌ Erreur lors de la création des sessions:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
createTestSessions()
