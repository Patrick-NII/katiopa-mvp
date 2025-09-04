// Script pour afficher les informations de connexion
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function showLoginInfo() {
  console.log('🔍 Informations de connexion...')
  
  try {
    const sessions = await prisma.userSession.findMany({
      where: {
        isActive: true
      },
      select: {
        sessionId: true,
        firstName: true,
        lastName: true,
        userType: true,
        password: true
      }
    })
    
    console.log('📝 Informations de connexion:')
    sessions.forEach(session => {
      console.log(`   ${session.firstName} ${session.lastName} (${session.userType}):`)
      console.log(`      SessionId: ${session.sessionId}`)
      console.log(`      Password: ${session.password}`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
showLoginInfo()
