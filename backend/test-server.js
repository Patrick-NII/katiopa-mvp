import express from 'express'
import { PrismaClient } from '@prisma/client'

const app = express()
const prisma = new PrismaClient()

app.use(express.json())

// Route de test simple
app.get('/api/test-sessions', async (req, res) => {
  try {
    console.log('🔍 Test direct des sessions...')
    
    const sessions = await prisma.userSession.findMany({
      where: {
        userType: 'CHILD',
        isActive: true
      },
      select: {
        id: true,
        sessionId: true,
        firstName: true,
        lastName: true
      },
      take: 3
    })

    console.log(`✅ Trouvé ${sessions.length} sessions`)
    
    res.json({
      success: true,
      data: sessions
    })
  } catch (error) {
    console.error('❌ Erreur:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

const PORT = 4001
app.listen(PORT, () => {
  console.log(`🚀 Serveur de test démarré sur le port ${PORT}`)
})

