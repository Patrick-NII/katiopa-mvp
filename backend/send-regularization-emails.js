import { PrismaClient } from '@prisma/client'
import { sendWelcomeEmail } from './src/utils/sendWelcomeEmail.ts'
import { randomUUID } from 'crypto'
import 'dotenv/config'

const prisma = new PrismaClient()

async function sendRegularizationEmails() {
  try {
    console.log('📧 Envoi des emails de régularisation aux comptes existants...\n')
    
    // Récupérer tous les comptes avec leurs sessions utilisateur
    const accounts = await prisma.account.findMany({
      include: {
        userSessions: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log(`📊 ${accounts.length} comptes trouvés dans la base de données\n`)

    let successCount = 0
    let errorCount = 0

    for (const account of accounts) {
      try {
        console.log(`📧 Traitement du compte: ${account.email}`)
        
        // Préparer les données pour l'email
        const familyMembers = account.userSessions.map(session => ({
          firstName: session.firstName,
          lastName: session.lastName,
          gender: session.gender,
          userType: session.userType,
          dateOfBirth: session.dateOfBirth,
          grade: session.grade,
          username: session.sessionId,
          sessionPassword: 'Votre mot de passe actuel' // Message informatif
        }))

        const createdSessions = account.userSessions.map(session => ({
          id: session.id,
          firstName: session.firstName,
          lastName: session.lastName,
          sessionId: session.sessionId,
          userType: session.userType,
          createdAt: session.createdAt
        }))

        // Trouver le parent pour le nom
        const parent = account.userSessions.find(s => s.userType === 'PARENT') || account.userSessions[0]
        const toName = parent ? `${parent.firstName} ${parent.lastName}`.trim() : account.email

        // Générer un ID de régularisation
        const registrationId = `REG-${randomUUID()}`

        // Envoyer l'email de régularisation
        await sendWelcomeEmail({
          toEmail: account.email,
          toName: toName || account.email,
          subscriptionType: account.subscriptionType,
          familyMembers: familyMembers,
          createdSessions: createdSessions,
          registrationId: registrationId
        })

        console.log(`   ✅ Email envoyé avec succès`)
        successCount++

        // Attendre un peu entre chaque envoi pour éviter le spam
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`   ❌ Erreur pour ${account.email}:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 Résumé des envois:')
    console.log(`   ✅ Succès: ${successCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)
    console.log(`   📧 Total traité: ${accounts.length}`)

    if (successCount > 0) {
      console.log('\n🎉 Emails de régularisation envoyés avec succès !')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction pour envoyer un email de test
async function sendTestEmail() {
  try {
    console.log('🧪 Envoi d\'un email de test...\n')
    
    const testData = {
      toEmail: 'test@example.com', // Remplacez par votre email de test
      toName: 'Utilisateur Test',
      subscriptionType: 'FREE',
      familyMembers: [
        {
          firstName: 'Jean',
          lastName: 'Dupont',
          gender: 'MALE',
          userType: 'PARENT',
          dateOfBirth: '1985-05-15',
          grade: '',
          username: 'Jean-123',
          sessionPassword: 'password123'
        },
        {
          firstName: 'Marie',
          lastName: 'Dupont',
          gender: 'FEMALE',
          userType: 'CHILD',
          dateOfBirth: '2018-03-20',
          grade: 'CP',
          username: 'Marie-456',
          sessionPassword: 'childpass123'
        }
      ],
      createdSessions: [
        {
          id: 'test-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          sessionId: 'Jean-123',
          userType: 'PARENT',
          createdAt: new Date()
        },
        {
          id: 'test-2',
          firstName: 'Marie',
          lastName: 'Dupont',
          sessionId: 'Marie-456',
          userType: 'CHILD',
          createdAt: new Date()
        }
      ],
      registrationId: `TEST-${randomUUID()}`
    }

    await sendWelcomeEmail(testData)
    console.log('✅ Email de test envoyé avec succès !')

  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2)
if (args.includes('--test')) {
  sendTestEmail()
} else {
  sendRegularizationEmails()
}
