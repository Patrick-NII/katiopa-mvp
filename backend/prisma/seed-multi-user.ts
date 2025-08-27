import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding du système multi-utilisateurs...')

  // 1. Créer un compte principal
  const account = await prisma.account.create({
    data: {
      email: 'famille.dupont@example.com',
      subscriptionType: 'PRO_PLUS',
      maxSessions: 4,
      isActive: true
    }
  })
  console.log('✅ Compte créé:', account.email)

  // 2. Créer plusieurs sessions utilisateur pour ce compte
  const sessions = [
    {
      sessionId: 'enfant1',
      password: await bcrypt.hash('enfant123', 10),
      firstName: 'Emma',
      lastName: 'Dupont',
      gender: 'FEMALE',
      userType: 'CHILD',
      age: 6,
      grade: 'CP',
      country: 'France',
      timezone: 'Europe/Paris'
    },
    {
      sessionId: 'enfant2',
      password: await bcrypt.hash('enfant456', 10),
      firstName: 'Lucas',
      lastName: 'Dupont',
      gender: 'MALE',
      userType: 'CHILD',
      age: 5,
      grade: 'GS',
      country: 'France',
      timezone: 'Europe/Paris'
    },
    {
      sessionId: 'parent1',
      password: await bcrypt.hash('parent123', 10),
      firstName: 'Marie',
      lastName: 'Dupont',
      gender: 'FEMALE',
      userType: 'PARENT',
      age: 35,
      country: 'France',
      timezone: 'Europe/Paris'
    },
    {
      sessionId: 'parent2',
      password: await bcrypt.hash('parent456', 10),
      firstName: 'Pierre',
      lastName: 'Dupont',
      gender: 'MALE',
      userType: 'PARENT',
      age: 37,
      country: 'France',
      timezone: 'Europe/Paris'
    }
  ]

  const createdSessions = []
  for (const sessionData of sessions) {
    const session = await prisma.userSession.create({
      data: {
        ...sessionData,
        accountId: account.id,
        isActive: true
      }
    })
    createdSessions.push(session)
    console.log(`✅ Session créée: ${session.firstName} ${session.lastName} (${session.sessionId})`)
  }

  // 3. Créer des profils détaillés pour les enfants
  const childSessions = createdSessions.filter(s => s.userType === 'CHILD')
  
  for (const childSession of childSessions) {
    await prisma.userProfile.create({
      data: {
        userSessionId: childSession.id,
        learningGoals: ['Lire couramment', 'Compter jusqu\'à 100', 'Écrire en cursive'],
        preferredSubjects: ['Mathématiques', 'Français', 'Sciences'],
        learningStyle: 'visuel',
        difficulty: 'moyen',
        interests: ['Dinosaures', 'Espace', 'Animaux', 'Musique'],
        specialNeeds: [],
        customNotes: 'Enfant curieux et motivé',
        parentWishes: 'Souhaite que l\'enfant développe sa confiance en soi et son autonomie'
      }
    })
    console.log(`✅ Profil créé pour: ${childSession.firstName}`)
  }

  // 4. Créer des activités d'apprentissage pour les enfants
  const domains = ['Mathématiques', 'Français', 'Sciences', 'IA']
  const nodeKeys = ['addition', 'soustraction', 'multiplication', 'lecture', 'ecriture', 'vocabulaire', 'logique', 'programmation']
  
  for (const childSession of childSessions) {
    // Créer 10-15 activités par enfant
    const numActivities = Math.floor(Math.random() * 6) + 10
    
    for (let i = 0; i < numActivities; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const nodeKey = nodeKeys[Math.floor(Math.random() * nodeKeys.length)]
      const score = Math.floor(Math.random() * 41) + 60 // Score entre 60 et 100
      const attempts = Math.floor(Math.random() * 3) + 1 // 1 à 3 tentatives
      const durationMs = Math.floor(Math.random() * 300000) + 60000 // 1 à 6 minutes
      
      // Date aléatoire dans les 30 derniers jours
      const daysAgo = Math.floor(Math.random() * 30)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)
      
      await prisma.activity.create({
        data: {
          userSessionId: childSession.id,
          domain,
          nodeKey,
          score,
          attempts,
          durationMs,
          createdAt
        }
      })
    }
    console.log(`✅ ${numActivities} activités créées pour: ${childSession.firstName}`)
  }

  // 5. Créer un compte gratuit pour démonstration
  const freeAccount = await prisma.account.create({
    data: {
      email: 'famille.martin@example.com',
      subscriptionType: 'FREE',
      maxSessions: 2,
      isActive: true
    }
  })
  console.log('✅ Compte gratuit créé:', freeAccount.email)

  // 6. Créer 2 sessions pour le compte gratuit
  const freeSessions = [
    {
      sessionId: 'enfant3',
      password: await bcrypt.hash('enfant789', 10),
      firstName: 'Jade',
      lastName: 'Martin',
      gender: 'FEMALE',
      userType: 'CHILD',
      age: 7,
      grade: 'CE1',
      country: 'France',
      timezone: 'Europe/Paris'
    },
    {
      sessionId: 'parent3',
      password: await bcrypt.hash('parent789', 10),
      firstName: 'Sophie',
      lastName: 'Martin',
      gender: 'FEMALE',
      userType: 'PARENT',
      age: 32,
      country: 'France',
      timezone: 'Europe/Paris'
    }
  ]

  for (const sessionData of freeSessions) {
    const session = await prisma.userSession.create({
      data: {
        ...sessionData,
        accountId: freeAccount.id,
        isActive: true
      }
    })
    console.log(`✅ Session gratuite créée: ${session.firstName} ${session.lastName}`)
  }

  // 7. Créer quelques activités pour le compte gratuit
  const freeChildSession = await prisma.userSession.findFirst({
    where: { accountId: freeAccount.id, userType: 'CHILD' }
  })

  if (freeChildSession) {
    for (let i = 0; i < 5; i++) {
      const domain = domains[Math.floor(Math.random() * domains.length)]
      const nodeKey = nodeKeys[Math.floor(Math.random() * nodeKeys.length)]
      const score = Math.floor(Math.random() * 41) + 60
      const attempts = Math.floor(Math.random() * 3) + 1
      const durationMs = Math.floor(Math.random() * 300000) + 60000
      
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 15))
      
      await prisma.activity.create({
        data: {
          userSessionId: freeChildSession.id,
          domain,
          nodeKey,
          score,
          attempts,
          durationMs,
          createdAt
        }
      })
    }
    console.log(`✅ 5 activités créées pour le compte gratuit`)
  }

  console.log('\n🎉 Seeding terminé avec succès !')
  console.log('\n📊 Résumé:')
  console.log(`- Comptes créés: 2 (1 PRO_PLUS, 1 FREE)`)
  console.log(`- Sessions totales: ${createdSessions.length + freeSessions.length}`)
  console.log(`- Profils enfants: ${childSessions.length}`)
  console.log(`- Activités totales: ~${childSessions.length * 12 + 5}`)
  
  console.log('\n🔑 Identifiants de connexion:')
  console.log('Compte PRO_PLUS (famille.dupont@example.com):')
  console.log('  - Emma (enfant1): enfant123')
  console.log('  - Lucas (enfant2): enfant456')
  console.log('  - Marie (parent1): parent123')
  console.log('  - Pierre (parent2): parent456')
  
  console.log('\nCompte FREE (famille.martin@example.com):')
  console.log('  - Jade (enfant3): enfant789')
  console.log('  - Sophie (parent3): parent789')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 