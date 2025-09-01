import { PrismaClient } from '@prisma/client'
import { sendWelcomeEmail } from './src/utils/sendWelcomeEmail.ts'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const prisma = new PrismaClient()

// Fonction pour générer un mot de passe sécurisé
function generateSecurePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  return password
}

// Fonction pour générer un username basé sur le nom
function generateUsername(firstName, lastName, existingUsernames) {
  const base = `${firstName?.toLowerCase() || 'user'}-${Math.floor(Math.random() * 900) + 100}`
  let username = base
  let counter = 1
  
  while (existingUsernames.has(username)) {
    username = `${base}-${counter}`
    counter++
  }
  
  return username
}

async function resetPasswordsAndSendEmails() {
  try {
    console.log('🔐 Réinitialisation des mots de passe et envoi des nouveaux identifiants...\n')
    
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
        console.log(`🔐 Traitement du compte: ${account.email}`)
        
        // Collecter tous les usernames existants pour éviter les doublons
        const existingUsernames = new Set()
        account.userSessions.forEach(session => {
          existingUsernames.add(session.sessionId)
        })

        // Préparer les nouvelles données pour chaque session
        const updatedSessions = []
        const familyMembers = []
        const createdSessions = []

        for (const session of account.userSessions) {
          // Générer un nouveau mot de passe sécurisé
          const newPassword = generateSecurePassword()
          const hashedPassword = await bcrypt.hash(newPassword, 12)
          
          // Générer un nouveau username si nécessaire
          const newUsername = generateUsername(session.firstName, session.lastName, existingUsernames)
          existingUsernames.add(newUsername)

          // Mettre à jour la session en base
          const updatedSession = await prisma.userSession.update({
            where: { id: session.id },
            data: {
              sessionId: newUsername,
              password: hashedPassword,
              updatedAt: new Date()
            }
          })

          updatedSessions.push(updatedSession)

          // Préparer les données pour l'email
          familyMembers.push({
            firstName: session.firstName,
            lastName: session.lastName,
            gender: session.gender,
            userType: session.userType,
            dateOfBirth: session.dateOfBirth,
            grade: session.grade,
            username: newUsername,
            sessionPassword: newPassword // Mot de passe en clair pour l'email
          })

          createdSessions.push({
            id: updatedSession.id,
            firstName: updatedSession.firstName,
            lastName: updatedSession.lastName,
            sessionId: newUsername,
            userType: updatedSession.userType,
            createdAt: updatedSession.createdAt
          })

          console.log(`   👤 ${session.firstName} ${session.lastName}: ${newUsername} / ${newPassword}`)
        }

        // Trouver le parent pour le nom
        const parent = account.userSessions.find(s => s.userType === 'PARENT') || account.userSessions[0]
        const toName = parent ? `${parent.firstName} ${parent.lastName}`.trim() : account.email

        // Générer un ID de régularisation
        const registrationId = `RESET-${randomUUID()}`

        // Envoyer l'email avec les nouveaux identifiants
        await sendWelcomeEmail({
          toEmail: account.email,
          toName: toName || account.email,
          subscriptionType: account.subscriptionType,
          familyMembers: familyMembers,
          createdSessions: createdSessions,
          registrationId: registrationId
        })

        console.log(`   ✅ Mots de passe réinitialisés et email envoyé`)
        successCount++

        // Attendre un peu entre chaque traitement
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`   ❌ Erreur pour ${account.email}:`, error.message)
        errorCount++
      }
    }

    console.log('\n📊 Résumé des opérations:')
    console.log(`   ✅ Succès: ${successCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)
    console.log(`   📧 Total traité: ${accounts.length}`)

    if (successCount > 0) {
      console.log('\n🎉 Mots de passe réinitialisés et emails envoyés avec succès !')
      console.log('📧 Tous les utilisateurs ont reçu leurs nouveaux identifiants par email.')
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Fonction pour réinitialiser un compte spécifique
async function resetSpecificAccount(email) {
  try {
    console.log(`🔐 Réinitialisation du compte spécifique: ${email}\n`)
    
    const account = await prisma.account.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: {
        userSessions: {
          include: {
            profile: true
          }
        }
      }
    })

    if (!account) {
      console.log(`❌ Aucun compte trouvé avec l'email: ${email}`)
      return
    }

    console.log(`📊 Compte trouvé: ${account.email} avec ${account.userSessions.length} sessions\n`)

    // Collecter tous les usernames existants
    const existingUsernames = new Set()
    account.userSessions.forEach(session => {
      existingUsernames.add(session.sessionId)
    })

    // Préparer les nouvelles données
    const updatedSessions = []
    const familyMembers = []
    const createdSessions = []

    for (const session of account.userSessions) {
      const newPassword = generateSecurePassword()
      const hashedPassword = await bcrypt.hash(newPassword, 12)
      const newUsername = generateUsername(session.firstName, session.lastName, existingUsernames)
      existingUsernames.add(newUsername)

      const updatedSession = await prisma.userSession.update({
        where: { id: session.id },
        data: {
          sessionId: newUsername,
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      updatedSessions.push(updatedSession)

      familyMembers.push({
        firstName: session.firstName,
        lastName: session.lastName,
        gender: session.gender,
        userType: session.userType,
        dateOfBirth: session.dateOfBirth,
        grade: session.grade,
        username: newUsername,
        sessionPassword: newPassword
      })

      createdSessions.push({
        id: updatedSession.id,
        firstName: updatedSession.firstName,
        lastName: updatedSession.lastName,
        sessionId: newUsername,
        userType: updatedSession.userType,
        createdAt: updatedSession.createdAt
      })

      console.log(`   👤 ${session.firstName} ${session.lastName}: ${newUsername} / ${newPassword}`)
    }

    const parent = account.userSessions.find(s => s.userType === 'PARENT') || account.userSessions[0]
    const toName = parent ? `${parent.firstName} ${parent.lastName}`.trim() : account.email
    const registrationId = `RESET-${randomUUID()}`

    await sendWelcomeEmail({
      toEmail: account.email,
      toName: toName || account.email,
      subscriptionType: account.subscriptionType,
      familyMembers: familyMembers,
      createdSessions: createdSessions,
      registrationId: registrationId
    })

    console.log(`\n✅ Compte ${email} réinitialisé avec succès !`)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Vérifier les arguments de ligne de commande
const args = process.argv.slice(2)
if (args.includes('--email') && args[args.indexOf('--email') + 1]) {
  const email = args[args.indexOf('--email') + 1]
  resetSpecificAccount(email)
} else {
  resetPasswordsAndSendEmails()
}
